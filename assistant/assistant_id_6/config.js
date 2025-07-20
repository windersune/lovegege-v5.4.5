const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
// 【新】: Dify 文件上传的专用API端点
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

/**
 * 【新函数】: 步骤一 - 上传文件到Dify并获取文件ID
 * @param {string} imageBase64 - 纯净的Base64图片数据.
 * @returns {Promise<string>} - 返回上传成功后的文件ID.
 */
async function uploadFileToDify(imageBase64) {
    // 1. 将 Base64 转换为 Blob 对象，这是文件上传的标准格式
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' }); // 假设为png，也可根据需要调整

    // 2. 使用 FormData 来包装文件
    const formData = new FormData();
    formData.append('file', blob, 'image.png'); // 'file' 是Dify要求的字段名
    formData.append('user', USER_ID);

    // 3. 发送 POST 请求到文件上传端点
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            // 注意：当使用 FormData 时，浏览器会自动设置正确的 Content-Type，我们不需要手动指定
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败 (${response.status})，响应: ${errorText}`);
    }

    const result = await response.json();
    console.log("[Dify] 文件上传成功，返回结果:", result);
    return result.id; // 返回文件ID
}


/**
 * 【重构的函数】: 步骤二 - 发送聊天消息，并附带文件ID
 * @param {string} query - 用户的文本输入.
 * @param {string | null} fileId - 从上一步获取的文件ID.
 * @param {string | null} conversationId - 对话上下文ID.
 * @returns {AsyncGenerator<object>}
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		const inputs = {};
        
        // 【核心修正】: 如果有文件ID，将其直接作为 inputs.image 的值
		if (fileId) {
			inputs.image = fileId; // "image" 键名与Dify后台变量名一致
		}

		const payload = {
			"inputs": inputs,
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		console.log("[Dify] 发送给聊天API的最终Payload:", JSON.stringify(payload, null, 2));
		// 后续的 fetch 和流处理逻辑完全不变
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
