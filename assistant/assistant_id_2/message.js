// message.js

import { loadConfig } from './config.js';

// ... (imageFileToGenerativePart 函数保持不变) ...

// **【删除或注释掉】** createStreamReader 函数，因为我们不再需要它来处理非流式响应
/*
async function* createStreamReader(reader) {
    // ... (此函数内容全部删除或注释) ...
}
*/

/**
 * 发送消息（包含文本和可选的图片）到Gemini API。
 * 现在返回一个 Promise，解析后是处理好的文本内容（或一个表示结束的对象）。
 */
export async function getResponse(messages) {
    const config = loadConfig(); // 加载Gemini配置
    
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

        if (role === 'user' && !systemPromptAdded && config.systemPrompt) {
            parts.push({ text: config.systemPrompt + '\n\n' + msg.content });
            systemPromptAdded = true;
        } else {
            parts.push({ text: msg.content });
        }
        
        if (msg.imageFile) {
            try {
                const imagePart = await imageFileToGenerativePart(msg.imageFile);
                parts.push(imagePart);
            } catch (error) {
                console.error("图片转换失败:", error);
                throw new Error("无法处理上传的图片。请确保文件是有效图片。");
            }
        }
        
        contents.push({ role, parts });
    }

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

    const response = await fetch(config.baseURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API请求失败: ${response.status} - ${errorData}`);
    }

    // **【关键修改】：直接解析 JSON 响应，不再使用流式读取器**
    const data = await response.json(); // 等待完整的 JSON 响应

    // 根据 Gemini API 的响应结构提取文本内容
    // 检查 data.candidates 数组是否存在且有内容
    if (data && data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0 && data.candidates[0].content.parts[0].text) {
        
        const generatedText = data.candidates[0].content.parts[0].text;
        
        // **【重要】：这里你需要根据你的前端 UI 如何处理 getResponse 的返回值来调整。**
        // 原始的 getResponse 返回的是一个生成器 (generator)，你的 UI 可能通过循环 `for await (const chunk of reader)` 来接收。
        // 为了兼容，我们可以返回一个一次性 `yield` 完整结果的生成器。

        async function* singleChunkGenerator() {
            // 返回一个模拟的流式块，包含完整的文本。
            // 你的前端 UI 可能期望一个包含 `delta.content` 的对象，类似于 OpenAI 的流式响应。
            // 如果是那样，你需要将 `generatedText` 包装成类似 OpenAI 的格式：
            yield {
                choices: [{
                    delta: {
                        content: generatedText
                    }
                }]
            };
            // 如果你的前端可以直接处理 Gemini 的原始 { "candidates": ... } 结构，那么可以 yield data 对象：
            // yield data; 
        }
        return singleChunkGenerator(); // 返回这个生成器
    } else {
        console.warn("Gemini API 响应中未找到有效的文本内容:", data);
        // 返回一个空的生成器，表示没有内容
        async function* emptyGenerator() {}
        return emptyGenerator();
    }
}
