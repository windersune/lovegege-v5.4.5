// 文件: config.js
// [最终修正 - 解决 USER_ID is not defined 问题]

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 您的Dify API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 您的Dify代理地址
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
// 将 USER_ID 的定义保留在文件顶部，或者移到函数内部均可，但要确保其存在。

/**
 * [核心重构 - 流式函数]
 * @param {string} query - 用户的文本输入.
 * @param {string | null} imageBase64 - 纯净的Base64图片数据.
 * @param {string | null} conversationId - 对话上下文ID.
 * @returns {AsyncGenerator<object>} - 返回一个异步生成器，产出从API收到的原始数据块(chunk)。
 */
export async function* getDifyChatResponseAsStream(query, imageBase64 = null, conversationId = null) {
	// 【核心修正】: 将 USER_ID 的定义放在函数内部，确保其作用域正确。
	const USER_ID = "mada-123"; // 代表用户的唯一标识符

	try {
		const inputs = {};
		if (imageBase64) {
			inputs.image = imageBase64;
		}

		const payload = {
			"inputs": inputs,
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID, // <-- 现在这里可以安全地引用 USER_ID
			"conversation_id": conversationId || ''
		};
		
		console.log("[Dify] 发送给API的最终Payload:", JSON.stringify(payload, null, 2));

		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		// ... 后续的流处理逻辑完全不变 ...
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			
			const textChunk = decoder.decode(value, { stream: true });
			const lines = textChunk.split('\n\n');
			
			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const jsonStr = line.substring(6);
					if (jsonStr.trim() === '[DONE]') continue;
					try {
						const parsedChunk = JSON.parse(jsonStr);
						yield parsedChunk;
					} catch (e) {
						console.error("无法解析Dify数据块:", jsonStr);
					}
				}
			}
		}

	} catch (error) {
		console.error(`[Dify] 流式API调用过程发生严重错误: ${error.message}`);
		throw error;
	}
}


// --- 兼容性函数 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
