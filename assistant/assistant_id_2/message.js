// message.js

import { loadConfig } from './config.js';

/**
 * 将用户选择的图片文件转换成Gemini API可以接受的Base64格式。
 * @param {File} file - 用户通过 <input type="file"> 选择的文件对象
 * @returns {Promise<object>} - 一个包含MIME类型和Base64数据的对象
 */
function imageFileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result;
        const parts = result.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1];
        const base64Data = parts[1];
        resolve({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      } catch (error) {
        reject(new Error("解析Base64数据失败: " + error.message));
      }
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * 处理SSE（Server-Sent Events）流式响应的自定义读取器。
 * Gemini的流式输出格式与OpenAI兼容，此函数无需修改。
 */
async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';
	
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';
		
		for (const line of lines) {
			if (line.startsWith('data: ')) {
				try {
					const json = JSON.parse(line.slice(6));
					yield json;
				} catch (e) {
					console.error('解析SSE数据出错:', e, "原始行:", line);
				}
			}
		}
	}
}


/**
 * 发送消息（包含文本和可选的图片）到Gemini API，并返回一个流式响应读取器。
 * @param {Array<object>} messages - 完整的消息历史数组
 *   - 最新一条消息的结构: { role: 'user', content: '文本', imageFile?: File }
 */
export async function getResponse(messages) {
    const config = loadConfig();
    
    // 从消息历史中移除最后一条机器人的占位消息
    const messagesToProcess = messages.slice(0, -1);
    
    // 构建Gemini API需要的 'contents' 数组
    const contents = [];
    
    // Gemini没有独立的system角色，我们将systemPrompt加在第一条用户消息前
    let isFirstUserMessage = true;
    
    // 处理历史消息
    for (const msg of messagesToProcess) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        
        // --- 核心逻辑：处理文本和图片 ---
        const userParts = [];

        // 添加系统提示到第一条用户消息
        if (role === 'user' && isFirstUserMessage && config.systemPrompt) {
            userParts.push({ text: config.systemPrompt + '\n\n' + msg.content });
            isFirstUserMessage = false;
        } else {
            userParts.push({ text: msg.content });
        }
        
        // 如果消息中附带了图片文件，处理它
        if (msg.imageFile) {
            try {
                const imagePart = await imageFileToGenerativePart(msg.imageFile);
                userParts.push(imagePart);
            } catch (error) {
                console.error("图片处理失败:", error);
                throw new Error("无法处理上传的图片。");
            }
        }
        
        contents.push({ role, parts: userParts });
    }

    // 构建包含调试参数的请求体
    const requestBody = {
        contents,
        generationConfig: {
            temperature: Number(config.temperature),
            topP: Number(config.topP),
            topK: parseInt(config.topK, 10),
            maxOutputTokens: parseInt(config.maxOutputTokens, 10),
        }
    };

    // 发送请求到我们的Cloudflare Worker代理
    const response = await fetch(config.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorData}`);
    }

    // 返回流式读取器以供前端处理
    const reader = response.body.getReader();
    return createStreamReader(reader);
}
