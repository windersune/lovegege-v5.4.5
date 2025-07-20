// 文件: config.js
// [最终正确版 - 修正了inputs中文件的格式]

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123";

export async function* getDifyChatResponseAsStream(query, imageBase64 = null, conversationId = null) {
	try {
		const inputs = {};

		// 【核心修正】: 当有图片时，我们构建一个完整的 "文件对象"
		if (imageBase64) {
			inputs.image = { // "image" 键名必须与Dify后台创建的变量名完全一致
				"type": "image",
				"transfer_method": "base64",
				"content": imageBase64 // <-- 将纯净的Base64字符串作为 content 的值
			};
		}

		const payload = {
			"inputs": inputs,
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
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

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		// 后续的流处理逻辑完全不变
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


// --- 兼容性函数，保持不变 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}// 文件: config.js
// [最终正确版 - 修正了inputs中文件的格式]

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123";

export async function* getDifyChatResponseAsStream(query, imageBase64 = null, conversationId = null) {
	try {
		const inputs = {};

		// 【核心修正】: 当有图片时，我们构建一个完整的 "文件对象"
		if (imageBase64) {
			inputs.image = { // "image" 键名必须与Dify后台创建的变量名完全一致
				"type": "image",
				"transfer_method": "base64",
				"content": imageBase64 // <-- 将纯净的Base64字符串作为 content 的值
			};
		}

		const payload = {
			"inputs": inputs,
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
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

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		// 后续的流处理逻辑完全不变
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


// --- 兼容性函数，保持不变 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
