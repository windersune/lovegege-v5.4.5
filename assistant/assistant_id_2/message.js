import { runDifyWorkflowStream } from './config.js'

// 一个休眠函数，让程序等待一段时间（单位 ms）
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// 这个函数用来模拟一个 API 请求，一秒钟后返回字符串
export async function getMockResponse() {
	await sleep(1000)
	return '这是一条模拟的回复'
}

// 维护当前对话ID，每个会话中保持一致
let currentConversationId = null;

// 主要的响应获取函数
export async function getResponse(messages) {
	console.log(`[MESSAGE] 处理对话历史记录，共 ${messages.length} 条消息`);
	console.log(`[MESSAGE] 当前对话ID: ${currentConversationId}`);
	
	// 提取用户最后一条消息内容
	let userMessage = '';
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') {
			userMessage = messages[i].content;
			break;
		}
	}
	
	console.log(`[MESSAGE] 用户当前消息: ${userMessage.substring(0, 50)}...`);
	
	// 创建一个异步迭代器来处理流式响应
	const streamAsync = async function* () {
		try {
			// 收集响应内容的队列
			const responseChunks = [];
			let responseComplete = false;
			let responseError = null;
			
			// 创建一个Promise来等待响应完成
			const responsePromise = new Promise((resolve, reject) => {
				// 调用Dify对话API，传递完整消息历史以保持上下文
				runDifyWorkflowStream(
					userMessage,           // 用户当前消息
					currentConversationId, // 当前对话ID
					(data, chunk) => {     // 数据回调
						if (chunk) {
							// 接收到内容块，添加到队列
							responseChunks.push({
								choices: [
									{
										delta: {
											content: chunk
										}
									}
								]
							});
						}
					},
					() => {  // 完成回调
						console.log(`[MESSAGE] 对话响应完成`);
						responseComplete = true;
						resolve();
					},
					(error) => {  // 错误回调
						console.error(`[MESSAGE] 对话错误: ${error.message}`);
						responseError = error;
						responseComplete = true;
						reject(error);
					},
					messages  // 添加完整消息历史作为新参数
				).then(result => {
					// 处理结果，保存会话ID
					if (result && result.conversationId) {
						console.log(`[MESSAGE] 会话ID: ${result.conversationId}`);
						currentConversationId = result.conversationId;
					}
					responseComplete = true;
					resolve();
				}).catch(error => {
					console.error(`[MESSAGE] 请求异常: ${error.message}`);
					responseError = error;
					responseComplete = true;
					reject(error);
				});
			});
			
			// 使用一个监控函数同时等待响应和检查队列
			(async () => {
				try {
					await responsePromise;
				} catch (e) {
					// 错误已在回调中处理
				}
			})();
			
			// 处理所有响应块
			let index = 0;
			while (!responseComplete || index < responseChunks.length) {
				if (index < responseChunks.length) {
					// 有可用的响应块，处理它
					yield responseChunks[index++];
				} else {
					// 等待更多响应或完成
					await sleep(10);
				}
			}
			
			// 如果有错误，yield错误消息
			if (responseError) {
				yield {
					choices: [
						{
							delta: {
								content: `处理过程中出现错误: ${responseError.message}`
							}
						}
					]
				};
			}
		} catch (error) {
			console.error(`[MESSAGE] 处理异常: ${error.message}`);
			yield {
				choices: [
					{
						delta: {
							content: `处理过程中出现错误: ${error.message}`
						}
					}
				]
			};
		}
	};
	
	return streamAsync();
}

