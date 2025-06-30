// src/assistant/assistant_id_3/message.js

import { loadConfig } from './config.js';

/**
 * 将Data URL字符串转换成Gemini API可以接受的Base64格式。
 * @param {string} dataUrl - 包含Base64数据的Data URL字符串 (例如 "data:image/jpeg;base64,xxxxxxxxxx")
 * @returns {object} - 一个包含MIME类型和纯Base64数据的对象
 */
function dataUrlToGenerativePart(dataUrl) { // <-- 函数名改为更准确的 dataUrlToGenerativePart
  // Data URL 格式通常是 "data:<mime-type>;base64,<base64-data>"
  const parts = dataUrl.split(',');
  const mimeType = parts[0].match(/:(.*?);/)[1]; // 提取 "image/jpeg"
  const base64Data = parts[1]; // 提取纯Base64数据

  return {
    inline_data: {
      mime_type: mimeType,
      data: base64Data
    }
  };
}

// ... (createStreamReader 函数如果已删除或注释掉，保持不变) ...

/**
 * 发送消息（包含文本和可选的图片）到Gemini API，并返回一个流式响应读取器。
 * @param {Array<object>} messages - 完整的消息历史数组，其中包含以下结构：
 *   - { role: 'user' | 'assistant', content: '文本内容', image?: string } // image 字段现在是 Base64 Data URL 字符串
 */
export async function getResponse(messages) {
    const config = loadConfig();
    
    let messagesToSend = messages.slice(0, -1);
    if (messagesToSend.length > 10) { 
        messagesToSend = messagesToSend.slice(-10);
    }

    const contents = [];
    let systemPromptAdded = false;
    for (let i = 0; i < messagesToSend.length; i++) {
        const msg = messagesToSend[i];
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts = [];

        // 处理系统提示词：只在第一个用户消息的文本内容前添加
        if (role === 'user' && !systemPromptAdded && config.systemPrompt) {
            parts.push({ text: config.systemPrompt + '\n\n' + msg.content });
            systemPromptAdded = true;
        } else {
            parts.push({ text: msg.content });
        }
        
        // 如果消息中附带了图片 Data URL 字符串，处理它
        // 注意：这里现在预期 msg.image 包含 Base64 Data URL 字符串
        if (msg.image) { // <-- 确保这里是 msg.image，而不是 msg.imageFile
            try {
                // 调用修改后的函数来解析 Data URL 字符串
                const imagePart = dataUrlToGenerativePart(msg.image); // <-- 这里调用修改后的函数
                parts.push(imagePart);
            } catch (error) {
                console.error("图片Data URL解析失败:", error);
                throw new Error("无法处理上传的图片。请确保Data URL格式有效。");
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
    };
    
    console.log("发送到Gemini代理的请求体:", JSON.stringify(requestBody, null, 2));

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

    // 直接解析 JSON 响应
    const data = await response.json();

    // 根据 Gemini API 的响应结构提取文本内容
    if (data && data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
        
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // 返回一个一次性 yield 完整结果的生成器，以兼容前端的流式处理逻辑
        async function* singleChunkGenerator() {
            yield {
                choices: [{
                    delta: {
                        content: generatedText
                    }
                }]
            };
        }
        return singleChunkGenerator();
    } else {
        console.warn("Gemini API 响应中未找到有效的文本内容:", data);
        async function* emptyGenerator() {}
        return emptyGenerator();
    }
}
