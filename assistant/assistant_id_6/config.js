// 文件: config.js
// [最终正确版 - 动态解析MIME类型]

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

/**
 * 【新函数】: 步骤一 - 上传文件到Dify并获取文件ID
 * @param {string} dataUrl - 包含MIME类型和Base64数据的完整Data URL
 * @returns {Promise<string>} - 返回上传成功后的文件ID.
 */
async function uploadFileToDify(dataUrl) {
    // 1. 【核心修正】: 从Data URL中动态解析出MIME类型和纯Base64数据
    const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!matches || matches.length < 3) {
        throw new Error('无效的Data URL格式。无法解析MIME类型或Base64数据。');
    }
    const mimeType = matches[1]; // 例如 "image/jpeg"
    const imageBase64 = matches[2]; // 纯净的Base64字符串

    console.log(`[Dify] 动态解析 -> MIME类型: ${mimeType}`);

    // 2. 将 Base64 转换为 Blob 对象
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // 3. 【核心修正】: 使用动态解析出的 mimeType 来创建 Blob
    const blob = new Blob([byteArray], { type: mimeType });

    // 4. 使用 FormData 来包装文件
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg'); // 文件名可以任意，但最好有后缀
    formData.append('user', USER_ID);

    // 5. 发送POST请求 (后续逻辑不变)
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败 (${response.status})，响应: ${errorText}`);
    }

    const result = await response.json();
    return result.id;
}


/**
 * 【重构的函数】: 步骤二 - 发送聊天消息 (此函数无需改动)
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		const inputs = {};
		if (fileId) {
			inputs.image = fileId;
		}

		const payload = {
			"inputs": inputs,
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
