// File: config.js
// 这是最终的、正确的版本

// --- 配置 ---
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123";

/**
 * [最终版] 这个函数负责与Dify API进行实际的通信。
 */
export async function runDifyWorkflowStream(query, conversationId = null, onDataCallback, onDoneCallback, onErrorCallback) {
	try {
		// [核心修正] 根据Dify服务器返回的明确错误，使用最终正确的Payload结构。
		// "query" 必须是顶层参数，不能被 "inputs" 包裹。
		const payload = {
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API请求失败，状态码: ${response.status}. 响应: ${errorText}`);
		}
		
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
						if (data.conversation_id) newConversationId = data.conversation_id;
						if (data.event === 'agent_message' && typeof data.answer === 'string') {
							fullResponse += data.answer;
							if (onDataCallback) onDataCallback(data, data.answer);
						} else if (data.event === 'error') {
							throw new Error(`流错误: ${data.code} - ${data.message}`);
						}
					} catch (e) {
						// 忽略解析错误
					}
				}
			}
		}

		if (onDoneCallback) onDoneCallback();
		
		return { conversationId: newConversationId, response: fullResponse };

	} catch (error) {
		if (onErrorCallback) onErrorCallback(error);
		throw error;
	}
}

// --- 为了兼容性，保留旧的导出函数 ---
export function loadConfig() {
	return {
		apiKey: API_KEY,
		baseURL: API_BASE_URL
	};
}

export function hasValidConfig() {
	return true;
}
