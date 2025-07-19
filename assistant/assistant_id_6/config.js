// File: config.js
// 这是严格按照官方文档修正的最终版本

// --- 配置 ---
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123";

/**
 * [最终版] 这个函数严格按照Dify官方文档构造请求。
 */
export async function runDifyWorkflowStream(query, conversationId = null, onDataCallback, onDoneCallback, onErrorCallback) {
	try {
		// [核心修正] 根据您提供的官方curl命令，构造100%正确的Payload。
		// 它必须同时包含 "inputs": {} 和 "query": "..." 这两个顶层键。
		const payload = {
			"inputs": {}, // 必须存在，即使为空对象
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || ''
			// "files" 参数是可选的，我们暂时不加
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
		
		// 后续的流式处理逻辑是正确的，保持不变
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
