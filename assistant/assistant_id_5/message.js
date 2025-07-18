// --- message.js (最终代码) ---

// 直接从安装好的 @gradio/client 包中导入 client
import { client } from "@gradio/client";
import { loadConfig } from './config.js'

/**
 * 模拟流式读取器，让UI有打字机效果
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

	// 转换消息格式，以适配Gradio API
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
        // 使用 @gradio/client 连接并调用API
        const app = await client(config.baseURL);
        const result = await app.predict('/predict', {
            // 参数名必须和你的python函数参数名完全一致
            message: currentUserMessage,
            history: gradioHistory
        });

        // 提取并返回结果
        const modelResponseText = result.data[0];
        return simulateStreamReader(modelResponseText);

    } catch (error) {
        console.error("调用 @gradio/client 时出错:", error);
        throw new Error(`与Gradio Space通信失败: ${error.message}`);
    }
}