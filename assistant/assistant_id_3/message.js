import { loadConfig } from './config.js';

/**
 * 【最终修正版】
 *  - 增加了对传入 messages 数组的预处理，使其能应对UI框架在第一次调用时传入的格式错误的数据。
 *  - 保留了您编写的、完全正确的Coze API v3的调用和流式解析逻辑。
 */
export async function getResponse(messages) {
	const config = loadConfig();

	// ===================== 【核心修正：数组预处理】 =====================
	// 在执行任何操作前，先过滤掉所有无效的消息记录。
	// 这可以防止UI框架在会话开始时传入的、格式错误的占位消息（如 undefined 或缺少 content 属性）导致程序崩溃。
	const cleanedMessages = messages.filter(msg => msg && msg.content !== undefined && msg.content !== null);
	// =================================================================

	// 如果清洗后没有消息了，说明输入有问题，直接返回。
	if (cleanedMessages.length === 0) {
		console.error("接收到的消息数组为空或无效。");
		// 返回一个空的流，避免UI卡死
		return {
			[Symbol.asyncIterator]: async function* () {}
		};
	}

	// 后续所有操作都使用清洗过的 `cleanedMessages`
	const latestUserMessage = cleanedMessages[cleanedMessages.length - 1].content;
	console.log("最新用户消息:", latestUserMessage);

	const additionalMessages = cleanedMessages.map(msg => ({
		role: msg.role === 'user' ? 'user' : 'assistant',
		content: msg.content,
		content_type: 'text'
	}));

	const requestBody = {
		bot_id: config.botId,
		user_id: config.userId,
		stream: true,
		auto_save_history: true,
		additional_messages: additionalMessages
	};

	console.log('发送请求到Coze API:', JSON.stringify(requestBody));

	try {
		const requestOptions = {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json',
				'Accept': 'text/event-stream'
			},
			body: JSON.stringify(requestBody)
		};

		const response = await fetch(config.baseURL, requestOptions);

		if (!response.ok) {
			const errorText = await response.text();
			console.error('API错误响应:', errorText);
			throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
		}

		console.log('API响应状态:', response.status);

		// 【保留您成功的逻辑】下面的流处理部分完全使用您编写的、已被验证成功的代码
		const stream = {
			[Symbol.asyncIterator]: async function* () {
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				let buffer = "";

				try {
					console.log("开始处理响应流");
					while (true) {
						const { value, done } = await reader.read();
						if (done) {
							console.log("响应流结束");
							break;
						}
						
						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';
						
						for (const line of lines) {
							if (line.trim().startsWith("event:")) {
								// 简化处理，我们只关心 data
							} else if (line.trim().startsWith("data:")) {
								const dataStr = line.trim().substring(5).trim();
								try {
									const eventData = JSON.parse(dataStr);
									if (eventData.message && eventData.message.type === "answer") {
										const contentChunk = eventData.message.content || "";
										if (contentChunk) {
											yield {
												choices: [{ delta: { content: contentChunk } }]
											};
										}
									}
								} catch (error) {
									// 忽略非JSON或格式不符的data行
								}
							}
						}
					}
				} catch (error) {
					console.error("流处理错误:", error);
					yield { choices: [{ delta: { content: "处理响应时出错" } }] };
				}
			}
		};

		return stream;
	} catch (error) {
		console.error('Coze API请求错误:', error);
		throw error;
	}
}
