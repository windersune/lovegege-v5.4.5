const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 您的Dify API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 您的Dify代理地址
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123"; // 代表用户的唯一标识符

/**
 * [核心适配] 调用Dify的聊天API，支持携带图片文件
 * @param {string} query - 用户的文本输入.
 * @param {string | null} imageBase64 - 纯净的Base64图片数据，无图时为null.
 * @param {string | null} conversationId - 用于保持对话上下文的ID.
 * @returns {Promise<{answer: string, conversationId: string}>} - 返回包含答案和新会话ID的对象.
 */
export async function getDifyChatResponse(query, imageBase64 = null, conversationId = null) {
	try {
		// 1. 构建API请求的基础结构
		const payload = {
			"inputs": {},
			"query": query,
			"response_mode": "streaming", 
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		// 2. 【关键适配】如果存在图片数据，则构建 Dify API v1 所需的 "files" 字段
		if (imageBase64) {
			payload.files = [
				{
					"type": "image",
					"transfer_method": "base64",
					"content": imageBase64 // 将纯净的Base64数据放入
				}
			];
			// Dify会自动将这个文件映射到您工作流“开始”节点中的文件输入变量（如 `image`）
		}
		
		console.log("[Dify] 发送给API的最终Payload:", JSON.stringify(payload, null, 2));

		// 3. 发送POST请求
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		// 4. 处理响应
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		const result = await response.json();
		console.log("[Dify] API返回的完整结果:", result);

		// 5. 返回需要的数据
		return {
			answer: result.answer,
			conversationId: result.conversation_id
		};

	} catch (error) {
		console.error(`[Dify] API调用过程发生严重错误: ${error.message}`);
		throw error; // 将错误向上抛出，由 message.js 捕获并显示在UI上
	}
}


// --- 以下为兼容性函数，保持不变 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
