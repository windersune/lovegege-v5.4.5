import { loadConfig } from './config.js'
import { client } from "https://esm.sh/@gradio/client";

/**
 * [最终修正] 忠实原文输出，完整展示包括 "think" 在内的所有中间过程。
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 在每一步都产出包含 *完整* 回复的对象的异步生成器。
 */
export async function* getResponse(messages) {
	const config = loadConfig();

	// 提取 prompt 的逻辑保持不变
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) throw new Error("消息历史中没有找到用户消息。");

	const promptText = typeof lastUserMessage.content === 'string' 
		? lastUserMessage.content 
		: lastUserMessage.content.find(p => p.type === 'text')?.text || '';
	if (!promptText) throw new Error("无法从最后一条用户消息中提取文本内容。");

	try {
		const app = await client(config.baseURL);
		const job = app.submit('/chat', [
			promptText,
			[]
		]);

		// ===================================================================
		// 【核心修正】: 不再计算增量，直接产出每一步的完整回复。
		// ===================================================================
		for await (const chunk of job) {
            // 从数据块中提取出当前时刻的完整回复
			const currentFullReply = chunk.data[0];

            // 直接将这个完整回复包装成UI兼容的格式并产出
            // UI组件需要用这个新内容【覆盖】掉旧内容，而不是追加
			yield {
				choices: [{
					delta: {
						content: currentFullReply
					}
				}]
			};
		}

	} catch (error) {
		console.error("Gradio API 调用失败:", error);
		const errorMessage = `API 调用出错: ${error.message}`;
        yield { choices: [{ delta: { content: errorMessage } }] };
		throw new Error(errorMessage);
	}
}
