// File: config.js
// [最终版] 已切换到非流式（blocking）模式

// --- 配置 ---
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123";

/**
 * [核心修改] 函数名和逻辑已变更为非流式（blocking）模式。
 * 它不再需要回调函数，而是直接返回一个包含最终结果的Promise。
 */
export async function getDifyChatResponse(query, conversationId = null) {
	try {
		// [核心修改] response_mode 已从 "streaming" 改为 "blocking"
		const payload = {
			"inputs": {},
			"query": query,
			"response_mode": "blocking", 
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
		
		// [核心修改] 不再读取流，而是直接解析完整的JSON响应
		const result = await response.json();
		
		// 为了调试，在控制台打印出Dify返回的完整结果
		console.log("[DEBUG] Dify 'blocking' 模式返回的完整结果:", result);

		// 从完整的JSON中提取需要的数据并返回
		return {
			answer: result.answer,
			conversationId: result.conversation_id
		};

	} catch (error) {
		console.error(`[ERROR] Dify API 调用失败: ${error.message}`);
		throw error;
	}
}


// --- 为了兼容性，保留旧的导出函数 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
