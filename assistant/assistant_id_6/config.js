const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 您的Dify API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 您的Dify代理地址
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const USER_ID = "mada-123"; // 代表用户的唯一标识符

/**
 * [非流式函数 - 已废弃，仅供参考]
 * 调用Dify的聊天API，一次性返回完整结果。
 */
// export async function getDifyChatResponse(query, imageBase64 = null, conversationId = null) { ... }


/**
 * [核心重构 - 流式函数]
 * 调用Dify的流式聊天API，并以异步生成器方式产出数据块。
 * @param {string} query - 用户的文本输入.
 * @param {string | null} imageBase64 - 纯净的Base64图片数据.
 * @param {string | null} conversationId - 对话上下文ID.
 * @returns {AsyncGenerator<object>} - 返回一个异步生成器，产出从API收到的原始数据块(chunk)。
 */
export async function* getDifyChatResponseAsStream(query, imageBase64 = null, conversationId = null) {
	try {
		// 1. 构建包含流式请求参数的Payload
		const payload = {
			"inputs": {},
			"query": query,
			"response_mode": "streaming", // <-- 【关键改动】
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		if (imageBase64) {
			payload.files = [{
				"type": "image", "transfer_method": "base64", "content": imageBase64
			}];
		}
		
		// 2. 发送请求
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
		
		// 3. 【核心改动】: 不再使用 .json()，而是获取响应体的数据流读取器
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');

		// 4. 循环读取数据流中的每一个片段
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break; // 流已结束
			}
			
			// 将二进制数据片段解码为字符串。一个片段可能包含多条 "data: {...}" 信息。
			const textChunk = decoder.decode(value, { stream: true });
            
            // Dify 的流式数据使用 Server-Sent Events (SSE) 格式，以 "data: " 开头，以 "\n\n" 分隔
			const lines = textChunk.split('\n\n');
			
			for (const line of lines) {
				if (line.startsWith('data: ')) {
					// 提取 "data: " 后面的 JSON 字符串
					const jsonStr = line.substring(6);
					if (jsonStr.trim() === '[DONE]') {
                        // Dify流结束的标志
						continue;
					}
					try {
						const parsedChunk = JSON.parse(jsonStr);
						yield parsedChunk; // 【关键】将解析后的数据块产出
					} catch (e) {
						console.error("无法解析Dify数据块:", jsonStr);
					}
				}
			}
		}

	} catch (error) {
		console.error(`[Dify] 流式API调用过程发生严重错误: ${error.message}`);
		throw error; // 将错误向上抛出
	}
}


// --- 兼容性函数 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
