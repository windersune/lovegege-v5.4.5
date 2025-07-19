// File: message.js
// 这个文件是正确的，无需修改。

import { runDifyWorkflowStream } from './config.js';

// 一个休眠函数，让程序等待一段时间（单位 ms）
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 维护当前对话ID，每个会话中保持一致
let currentConversationId = null;

// 主要的响应获取函数
export async function getResponse(messages) {
	let userMessage = '';
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') {
			userMessage = messages[i].content;
			break;
		}
	}
	
	console.log(`[MESSAGE] 开始处理用户消息: ${userMessage.substring(0, 50)}...`);
	console.log(`[MESSAGE] 当前对话ID: ${currentConversationId}`);
	
	const streamAsync = async function* () {
		try {
			const responseChunks = [];
			let responseComplete = false;
			let responseError = null;
			
			const responsePromise = new Promise((resolve, reject) => {
				runDifyWorkflowStream(
					userMessage,
					currentConversationId,
					(data, chunk) => {
						if (chunk) {
							responseChunks.push({ choices: [{ delta: { content: chunk } }] });
						}
					},
					() => {
						responseComplete = true;
						resolve();
					},
					(error) => {
						responseError = error;
						responseComplete = true;
						reject(error);
					}
				).then(result => {
					if (result && result.conversationId) {
						currentConversationId = result.conversationId;
					}
				}).catch(error => {
					// 错误已在回调中处理
				});
			});
			
			(async () => {
				try { await responsePromise; } catch (e) { /* no-op */ }
			})();
			
			let index = 0;
			while (!responseComplete || index < responseChunks.length) {
				if (index < responseChunks.length) {
					yield responseChunks[index++];
				} else {
					await sleep(10);
				}
			}
			
			if (responseError) {
				throw responseError;
			}
		} catch (error) {
			console.error(`[MESSAGE] 处理异常: ${error.message}`);
			yield { choices: [{ delta: { content: `处理过程中出现错误: ${error.message}` } }] };
		}
	};
	
	return streamAsync();
}
