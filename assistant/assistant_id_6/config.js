// --- 配置 ---
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";

// [修正 1] 切换到正确的API端点：聊天应用使用 /v1/chat-messages
const API_BASE_URL = "https://apilovegege.com/dify"; 
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`; // <--- 关键改动！

const USER_ID = "mada-123";

// --- 配置结束 ---

// --- 兼容接口，保持不变 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}
export function hasValidConfig() {
	return true;
}
// --- 兼容接口结束 ---

/**
 * [核心修正] 调用Dify聊天应用的主要函数
 */
export async function runDifyWorkflowStream(query, conversationId = null, onDataCallback, onDoneCallback, onErrorCallback) {
	try {
		console.log(`[DEBUG] 开始调用聊天API, query: "${query}", conversation_id: ${conversationId}`);

		// [修正 2] 调整Payload以匹配 /v1/chat-messages 接口的要求
		// 它不需要将 "query" 包装在 "inputs" 对象中
		const payload = {
			"query": query, 
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		console.log("[DEBUG] 发送的Payload:", JSON.stringify(payload, null, 2));

		// 发送请求到正确的端点
		const response = await fetch(CHAT_ENDPOINT, { // <--- 关键改动！
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		// 错误处理部分保持不变
		if (!response.ok) {
			const errorText = await response.text();
			const error = new Error(`API请求失败，状态码: ${response.status}. 响应: ${errorText}`);
			console.error(`[ERROR] ${error.message}`);
			throw error;
		}
		
		// 流式响应处理部分保持不变，它对于两种模式是通用的
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullResponse = '';
		let newConversationId = conversationId;
		
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				if (line.startsWith('data:')) {
					const jsonStr = line.substring(5).trim();
					if (!jsonStr) continue;

					try {
						const data = JSON.parse(jsonStr);
						
						if (data.conversation_id) {
							newConversationId = data.conversation_id;
						}
						
						if (data.event === 'agent_message' && typeof data.answer === 'string') {
							fullResponse += data.answer;
							if (onDataCallback) {
								onDataCallback(data, data.answer);
							}
						} else if (data.event === 'error') {
							throw new Error(`流错误: ${data.code} - ${data.message}`);
						}
					} catch (e) {
						console.warn(`[WARN] JSON解析错误: ${e.message}`, "Line:", line);
					}
				}
			}
		}

		if (onDoneCallback) onDoneCallback();
		
		const result = {
			conversationId: newConversationId,
			response: fullResponse
		};
		console.log("[DEBUG] 聊天调用执行完毕, 结果:", result);
		return result;

	} catch (error) {
		console.error(`[ERROR] 聊天调用异常: ${error.message}`);
		if (onErrorCallback) onErrorCallback(error);
		throw error;
	}
}
