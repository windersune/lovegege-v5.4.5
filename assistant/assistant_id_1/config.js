// 直接复制dify.py中的核心逻辑到JavaScript

// --- 配置 ---
const API_KEY = "app-tNfG1uJfELDK8CWUb0fanZA5"
const API_BASE_URL = "https://api.dify.ai/v1"
// 修改API端点为对话型应用接口
const CHAT_ENDPOINT = `${API_BASE_URL}/chat-messages`
const USER_ID = "my_test_user_002"

// 全局对话历史记录状态
const CONVERSATION_HISTORY = {};
// --- 配置结束 ---
	
// 返回API配置信息
export function loadConfig() {
	return {
		apiKey: API_KEY,
		baseURL: API_BASE_URL
	}
}

// 兼容接口
export function hasValidConfig() {
	return true;
}

// 格式化对话历史为context
export function formatContextForWorkflow(history, currentQuery) {
	const formattedLines = [];
	
	// 添加历史记录
	for (const message of history) {
		const role = message.role === 'user' ? 'User' : 'Assistant';
		formattedLines.push(`${role}: ${message.content}`);
	}
	
	// 添加当前查询
	formattedLines.push(`User: ${currentQuery}`);
	
	return formattedLines.join('\n');
}

// 主要的API调用函数
export async function runDifyWorkflowStream(
	query, 
	conversationId = null, 
	onDataCallback, 
	onDoneCallback, 
	onErrorCallback,
	messageHistory = null
) {
	try {
		console.log(`[DEBUG] 开始调用对话API，conversation_id=${conversationId}`);
		
		// 准备请求体 - 严格按照Dify对话型应用API格式
		const payload = {
			query: query,
			response_mode: "streaming",
			user: USER_ID,
			inputs: {
				text: query  // 添加必需的text字段
			}
		};
		
		// 如果有conversation_id，添加到请求中
		if (conversationId) {
			payload.conversation_id = conversationId;
			console.log(`[DEBUG] 添加会话ID到请求: ${conversationId}`);
		}
		
		console.log(`[DEBUG] 请求参数: `, JSON.stringify(payload));
		
		// 发送请求
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		// 处理错误
		if (response.status !== 200) {
			const errorText = await response.text();
			console.error(`[ERROR] 请求失败: ${response.status}`);
			console.error(`[ERROR] 响应内容: ${errorText}`);
			throw new Error(`对话API调用失败: ${response.statusText}`);
		}
		
		// 处理流式响应
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullResponse = '';
		let newConversationId = null;
		
		// 逐块处理响应流
		while (true) {
			const { value, done } = await reader.read();
			
			if (done) {
				if (onDoneCallback) {
					onDoneCallback();
				}
				break;
			}
			
			buffer += decoder.decode(value, { stream: true });
			
			// 按行处理数据，Dify的SSE响应格式是data: {...}\n\n
			let lineEndIndex;
			while ((lineEndIndex = buffer.indexOf('\n\n')) !== -1) {
				const line = buffer.substring(0, lineEndIndex);
				buffer = buffer.substring(lineEndIndex + 2);
				
				// 处理数据行，它应该以 "data:" 开头
				if (line.startsWith('data:')) {
					const jsonStr = line.substring(5).trim();
					if (jsonStr) {
						try {
							const data = JSON.parse(jsonStr);
							
							// 提取conversation_id
							if (data.conversation_id && !newConversationId) {
								newConversationId = data.conversation_id;
								console.log(`[DEBUG] 从响应中获取会话ID: ${newConversationId}`);
							}
							
							// 提取回答内容
							let content = '';
							
							// 根据事件类型提取数据
							if (data.event === 'message') {
								// 消息事件，包含answer字段
								if (data.answer) {
									content = data.answer;
								}
								
								if (content) {
									console.log(`[DEBUG] 接收消息块: ${content}`);
									fullResponse += content;
									if (onDataCallback) {
										onDataCallback(data, content);
									}
								}
							} else if (data.event === 'message_end') {
								// 消息结束事件，可以获取元数据
								console.log(`[DEBUG] 消息结束`);
								if (data.metadata) {
									console.log(`[DEBUG] 使用元数据: `, JSON.stringify(data.metadata));
								}
							} else if (data.event === 'error') {
								// 错误事件
								const errorMsg = data.message || '未知流式错误';
								console.error(`[ERROR] 流错误: ${errorMsg}`);
								if (onErrorCallback) {
									onErrorCallback(new Error(errorMsg));
								}
							}
						} catch (e) {
							console.warn(`[WARN] JSON解析错误: ${e.message}, 原始数据: ${jsonStr}`);
						}
					}
				}
			}
		}
		
		// 确定最终的会话ID
		const finalConversationId = newConversationId || conversationId;
		console.log(`[DEBUG] 最终会话ID: ${finalConversationId}`);
		
		// 更新对话历史
		if (finalConversationId && fullResponse) {
			if (!CONVERSATION_HISTORY[finalConversationId]) {
				CONVERSATION_HISTORY[finalConversationId] = [];
			}
			
			// 添加用户消息
			CONVERSATION_HISTORY[finalConversationId].push({
				role: 'user',
				content: query
			});
			
			// 添加助手消息
			CONVERSATION_HISTORY[finalConversationId].push({
				role: 'assistant',
				content: fullResponse
			});
			
			console.log(`[DEBUG] 更新历史记录，当前长度: ${CONVERSATION_HISTORY[finalConversationId].length}`);
		}
		
		return {
			conversationId: finalConversationId,
			response: fullResponse
		};
	} catch (error) {
		console.error(`[ERROR] 对话API调用异常: ${error.message}`);
		if (onErrorCallback) {
			onErrorCallback(error);
		}
		throw error;
	}
}
