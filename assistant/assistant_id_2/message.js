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
        // FileReader读取的结果是 "data:image/jpeg;base64,xxxxxxxxxx"
        // 我们需要把它拆分成MIME类型和纯Base64数据
        const parts = result.split(',');
        const mimeType = parts[0].match(/:(.*?);/)[1]; // 提取 "image/jpeg"
        const base64Data = parts[1]; // 提取纯Base64数据

        resolve({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      } catch (error) {
        reject(new Error("图片解析Base64失败: " + error.message));
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
		buffer = lines.pop() || ''; // 处理不完整的行
		
		for (const line of lines) {
			const trimmedLine = line.trim();
			if (!trimmedLine || trimmedLine === 'data: [DONE]') continue; // 跳过空行和结束标记
			
			if (trimmedLine.startsWith('data: ')) {
				try {
					const json = JSON.parse(trimmedLine.slice(6)); // 移除 'data: ' 前缀
					yield json; // 每次解析成功就 yield 出一个JSON对象
				} catch (e) {
					console.error('解析SSE数据出错:', e, "原始行:", trimmedLine);
				}
			}
		}
	}
}


/**
 * 发送消息（包含文本和可选的图片）到Gemini API，并返回一个流式响应读取器。
 * @param {Array<object>} messages - 完整的消息历史数组，其中包含以下结构：
 *   - { role: 'user' | 'assistant', content: '文本内容', imageFile?: File }
 *   - 传入的数组中，最后一条消息是用于显示占位的机器人消息，不应发送给API，因此通常是 messages.slice(0, -1)
 *   - 最后一条用户消息可能包含 imageFile
 */
export async function getResponse(messages) {
    const config = loadConfig(); // 加载Gemini配置
    
    // [重要] Gemini没有独立的system角色，我们将systemPrompt加到第一个用户消息前
    // 历史消息处理：移除最后一条占位消息
    let messagesToSend = messages.slice(0, -1);
    
    // 历史消息记录最多只保留最后 5 轮（即10条），加上用户本次发送的消息
    if (messagesToSend.length > 10) { 
        messagesToSend = messagesToSend.slice(-10);
    }

    const contents = []; // Gemini API的请求体主数组

    // 遍历要发送的所有消息，构建contents数组
    let systemPromptAdded = false;
    for (let i = 0; i < messagesToSend.length; i++) {
        const msg = messagesToSend[i];
        const role = msg.role === 'assistant' ? 'model' : 'user'; // Gemini将assistant称为model
        const parts = [];

        // 处理系统提示词：只在第一个用户消息的文本内容前添加
        if (role === 'user' && !systemPromptAdded && config.systemPrompt) {
            parts.push({ text: config.systemPrompt + '\n\n' + msg.content });
            systemPromptAdded = true;
        } else {
            parts.push({ text: msg.content });
        }
        
        // 如果消息中附带了图片文件，处理它
        if (msg.imageFile) {
            try {
                const imagePart = await imageFileToGenerativePart(msg.imageFile);
                parts.push(imagePart); // 将处理好的图片数据添加到parts数组
            } catch (error) {
                console.error("图片转换失败:", error);
                throw new Error("无法处理上传的图片。请确保文件是有效图片。");
            }
        }
        
        contents.push({ role, parts });
    }

    // 构建最终请求体，包含所有参数
    const requestBody = {
        contents,
        generationConfig: {
            temperature: Number(config.temperature),
            topP: Number(config.topP),
            topK: parseInt(config.topK, 10),
            maxOutputTokens: parseInt(config.maxOutputTokens, 10),
        }
        // safetySettings 和 tools 等可选参数如果不需要可以不加
    };
    
    console.log("发送到Gemini代理的请求体:", JSON.stringify(requestBody, null, 2)); // 调试用，可以看到发送的JSON

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
