import { loadConfig } from './config.js'

// 一个休眠函数，让程序等待一段时间（单位 ms）
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// 这个函数用来模拟一个 API 请求，一秒钟后返回字符串
export async function getMockResponse() {
	await sleep(1000)
	return '这是一条模拟的回复'
}

export async function getResponse(messages) {
	// 由于配置信息可能会发生变化，因此每次都需要重新加载配置信息
	const config = loadConfig()

	// 梳理一下这里收到的 messages 数组里有什么内容：
	// 1. 前面 0 轮或多轮的对话（每轮对话包含一条用户的 + 一条机器人的）
	// 2. 用户本次发送的消息
	// 3. 我们提前为机器人构造的占位消息

	// 最后一条占位消息不应该发送给 Coze，去掉它
	if (messages.length > 0) {
		messages = messages.slice(0, -1)
	}
	
	// 历史消息记录最多只保留最后 5 轮，加上用户本次发送的消息
	if (messages.length > 11) {
		messages = messages.slice(-11)
	}

	// 获取最新的用户消息
	const latestUserMessage = messages[messages.length - 1].content
	console.log("最新用户消息:", latestUserMessage)
	
	// 转换历史消息为Coze API期望的格式
	const additionalMessages = messages.map(msg => ({
		role: msg.role === 'user' ? 'user' : 'assistant',
		content: msg.content,
		content_type: 'text'
	}))

	// 构建符合Coze API v3格式的请求体
	const requestBody = {
		bot_id: config.botId,
		user_id: config.userId,
		stream: true,
		auto_save_history: true,
		additional_messages: additionalMessages
	}

	console.log('发送请求到Coze API:', JSON.stringify(requestBody))

	try {
		// 创建请求选项
		const requestOptions = {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${config.apiKey}`,
				'Content-Type': 'application/json',
				'Accept': 'text/event-stream'
			},
			body: JSON.stringify(requestBody)
		}

		// 发送请求到Coze API
		console.log('发送请求到URL:', config.baseURL)
		const response = await fetch(config.baseURL, requestOptions)
		
		if (!response.ok) {
			const errorText = await response.text()
			console.error('API错误响应:', errorText)
			throw new Error(`API请求失败: ${response.status} ${response.statusText}`)
		}

		console.log('API响应状态:', response.status)
		
		// 创建一个可迭代的流对象，模拟OpenAI的响应格式
		const stream = {
			[Symbol.asyncIterator]: async function* () {
				const reader = response.body.getReader()
				const decoder = new TextDecoder()
				
				// 用于存储完整回复
				let fullBotResponse = ""
				let currentEvent = null
				let buffer = ""
				
				try {
					console.log("开始处理响应流")
					
					// 处理流式响应
					while (true) {
						const { value, done } = await reader.read()
						if (done) {
							console.log("响应流结束")
							break
						}
						
						// 解码并添加到缓冲区
						const chunk = decoder.decode(value, { stream: true })
						buffer += chunk
						
						// 按行处理
						const lines = buffer.split('\n')
						// 保留最后一个可能不完整的行
						buffer = lines.pop() || ''
						
						// 处理每一行
						for (const line of lines) {
							const trimmedLine = line.trim()
							if (!trimmedLine) continue
							
							// 事件行
							if (trimmedLine.startsWith("event:")) {
								currentEvent = trimmedLine.substring(6).trim()
								// 输出简要的事件类型信息
								if (currentEvent === "conversation.message.delta") {
									console.log("收到消息片段事件")
								}
							}
							// 数据行
							else if (trimmedLine.startsWith("data:")) {
								const dataStr = trimmedLine.substring(5).trim()
								
								// 完成信号
								if (currentEvent === "done" || dataStr === "[DONE]") {
									console.log("响应完成")
									break
								}
								
								// 尝试解析JSON
								try {
									const eventData = JSON.parse(dataStr)
									
									// 主要处理消息片段事件 - 这是我们需要的文本内容
									if (currentEvent === "conversation.message.delta" && 
										eventData.role === "assistant" && 
										eventData.type === "answer") {
										
										const contentChunk = eventData.content || ""
										fullBotResponse += contentChunk
										
										// 以OpenAI格式生成响应
										yield {
											choices: [{
												delta: {
													content: contentChunk
												}
											}]
										}
									}
									// 处理完成事件
									else if (currentEvent === "conversation.message.completed" && 
										eventData.role === "assistant" && 
										eventData.type === "answer") {
										// 这里只记录日志，不生成新的内容片段
										console.log("收到完整回复:", eventData.content)
									}
									// 处理其他事件
									else if (currentEvent === "conversation.chat.completed") {
										console.log("对话完成")
									}
									
								} catch (error) {
									// 错误处理，但不中断流
									console.log("解析JSON错误，跳过")
								}
							}
						}
					}
					
					// 如果未收到任何内容，返回提示消息
					if (!fullBotResponse) {
						console.warn("未收到任何文本回复")
						yield {
							choices: [{
								delta: {
									content: "未收到回复，请重试"
								}
							}]
						}
					}
					
				} catch (error) {
					console.error("流处理错误:", error)
					yield {
						choices: [{
							delta: {
								content: "处理响应时出错"
							}
						}]
					}
				}
			}
		}

		return stream
	} catch (error) {
		console.error('Coze API请求错误:', error)
		throw error
	}
}
