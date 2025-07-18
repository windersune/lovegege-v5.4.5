// --- message.js (最终修正版 - NPM/Yarn 导入) ---

// 【重要修正】直接从安装的包中导入client
import { client } from "@gradio/client";
import { loadConfig } from './config.js'

/**
 * 模拟流式读取器 (此函数保持不变)
 */
async function* simulateStreamReader(fullText) {
	const chunks = fullText.split('');
	for (const chunk of chunks) {
		const responseChunk = {
			choices: [{
				delta: {
					content: chunk
				}
			}]
		};
		yield responseChunk;
		await new Promise(resolve => setTimeout(resolve, 5));
	}
}


export async function getResponse(messages) {
	const config = loadConfig();

	if (!config.baseURL) {
		throw new Error("Hugging Face Space URL未配置，请在设置中检查。");
	}

	// --- 数据格式转换 (保持不变) ---
	const currentUserMessage = messages[messages.length - 1].content;
	const gradioHistory = [];
	const historyMessages = messages.slice(0, -1);
	
	for (let i = 0; i < historyMessages.length; i += 2) {
		if (historyMessages[i].role === 'user' && historyMessages[i+1]?.role === 'assistant') {
			gradioHistory.push([
				historyMessages[i].content,
				historyMessages[i+1].content
			]);
		}
	}
	
	try {
        // --- 使用 @gradio/client (逻辑保持不变, 仅导入方式改变) ---

        // 1. 初始化客户端
        const app = await client(config.baseURL);

        // 2. 调用 predict API
        const result = await app.predict('/predict', {
            message: currentUserMessage,
            history: gradioHistory
        });

        // 3. 提取数据
        const modelResponseText = result.data[0];
        
        // 4. 返回模拟流
        return simulateStreamReader(modelResponseText);

    } catch (error) {
        console.error("调用 @gradio/client 时出错:", error);
        throw new Error(`与Gradio Space通信失败: ${error.message}`);
    }
}
