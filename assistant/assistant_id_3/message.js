import { loadConfig } from './config.js';

/**
 * 【最终确认版】
 *  - 融合了数组预处理的健壮性（我的建议）和流式数据解析的正确性（您的实现）。
 *  - 这应该能确保在所有情况下（包括首次对话）都能稳定地工作。
 */
export async function getResponse(messages) {
	const config = loadConfig();

	// ===================== 第一部分：健壮的消息预处理（来自我的建议） =====================
	// 在执行任何操作前，先过滤掉所有无效的消息记录，防止UI框架在会话开始时传入错误数据。
	const cleanedMessages = messages.filter(msg => msg && msg.content !== undefined && msg.content !== null);
	
	if (cleanedMessages.length === 0) {
		console.error("接收到的消息数组在清洗后为空，已中止。");
		return { [Symbol.asyncIterator]: async function* () {} };
	}
	// ===================================================================================

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
		
		// ============ 第二部分：精确的流式数据解析（来自您的正确实现） ============
		const stream = {
			[Symbol.asyncIterator]: async function* () {
				const reader = response.body.getReader();
				const decoder = new TextDecoder();
				
				let currentEvent = null;
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
							const trimmedLine = line.trim();
							if (!trimmedLine) continue;
							
							if (trimmedLine.startsWith("event:")) {
								currentEvent = trimmedLine.substring(6).trim();
							} else if (trimmedLine.startsWith("data:")) {
								const dataStr = trimmedLine.substring(5).trim();
								
								if (currentEvent === "done" || dataStr === "[DONE]") {
									console.log("响应完成信号");
									return; // 明确结束生成器
								}
								
								try {
									const eventData = JSON.parse(dataStr);
									
									if (currentEvent === "conversation.message.delta" && 
										eventData.role === "assistant" && 
										eventData.type === "answer" &&
                                        eventData.content
                                    ) {
										yield {
											choices: [{ delta: { content: eventData.content } }]
										};
									}
								} catch (error) {
									// 忽略无法解析的JSON行，这在流式数据中是正常现象
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
		// =========================================================================

		return stream;
	} catch (error) {
		console.error('Coze API请求错误:', error);
		throw error;
	}
}
