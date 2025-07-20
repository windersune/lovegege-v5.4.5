const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";


// ... (uploadFileToDify 函数是正确的，保持不变) ...
export async function uploadFileToDify(dataUrl) {
    // ...
}

/**
 * [最终版] 发送聊天消息
 * 它现在接收一个完整的 messages 数组，而不是零散的参数
 */
export async function* getDifyChatResponseAsStream(messages, conversationId = null) {
	try {
		const payload = {
			"inputs": {}, 
			"query": "This will be ignored, content is in messages.", // 这个字段会被忽略
			"messages": messages, // 【核心变更】: 使用 messages 字段传递所有内容
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
		};
		
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		// ... (后续的流解析代码是正确的，保持不变) ...
        // ...
	} catch (error) {
		console.error(`[Dify] 完整流程发生严重错误: ${error.message}`);
		throw error;
	}
}

export function loadConfig() { return { apiKey: API_KEY, baseURL: API_BASE_URL }; }
export function hasValidConfig() { return true; }
