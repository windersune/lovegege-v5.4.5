// 直接复制dify.py中的核心逻辑到JavaScript

// --- 配置 ---
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"
const API_BASE_URL = "https://api.dify.ai/v1"
const WORKFLOW_ENDPOINT = `${API_BASE_URL}/workflows/run`
const USER_ID = "my_test_user_workflow_002"

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

// 主要的工作流调用函数
export async function runDifyWorkflowStream(query, conversationId = null, onDataCallback, onDoneCallback, onErrorCallback) {
	try {
		console.log(`[DEBUG] 开始调用工作流，conversation_id=${conversationId}`);
		
		// 获取对话历史
		let history = [];
		if (conversationId && CONVERSATION_HISTORY[conversationId]) {
			history = CONVERSATION_HISTORY[conversationId];
			console.log(`[DEBUG] 找到历史记录，长度: ${history.length}`);
		}
		
		// 格式化输入
		const contextString = formatContextForWorkflow(history, query);
		console.log(`[DEBUG] 格式化的上下文: ${contextString}`);
		
		// 准备请求
		const payload = {
			inputs: {
				context: contextString
			},
			response_mode: "streaming",
			user: USER_ID
		};
		
		// 如果有conversation_id，添加到请求中
		if (conversationId) {
			payload.conversation_id = conversationId;
			console.log(`[DEBUG] 添加会话ID到请求: ${conversationId}`);
		}
		
		// 发送请求
		const response = await fetch(WORKFLOW_ENDPOINT, {
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
			throw new Error(`工作流调用失败: ${response.statusText}`);
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
			
			// 按行处理数据
			let lineEndIndex;
			while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
				const line = buffer.substring(0, lineEndIndex);
				buffer = buffer.substring(lineEndIndex + 1);
				
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
							if (data.event === 'agent_message' || 
								data.event === 'message' || 
								data.event === 'chunk' || 
								data.event === 'text_chunk') {
								
								// 尝试从不同位置获取内容
								if (data.answer) {
									content = data.answer;
								} else if (data.data && typeof data.data === 'object') {
									if (data.data.text) {
										content = data.data.text;
									} else if (data.data.message) {
										content = data.data.message;
									} else if (data.data.content) {
										content = data.data.content;
									}
								}
								
								if (content) {
									fullResponse += content;
									if (onDataCallback) {
										onDataCallback(data, content);
									}
								}
							} else if (data.event === 'error') {
								const errorMsg = data.message || 'Unknown stream error';
								console.error(`[ERROR] 流错误: ${errorMsg}`);
								if (onErrorCallback) {
									onErrorCallback(new Error(errorMsg));
								}
							}
						} catch (e) {
							console.warn(`[WARN] JSON解析错误: ${e.message}`);
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
		console.error(`[ERROR] 工作流调用异常: ${error.message}`);
		if (onErrorCallback) {
			onErrorCallback(error);
		}
		throw error;
	}
}
