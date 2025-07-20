// 文件: config.js
// [最终正确版 - 修正了函数导出错误]

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
// 【核心修正】: 添加 export 关键字，使此函数可以被外部文件导入
export async function uploadFileToDify(dataUrl) {
    const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!matches || matches.length < 3) {
        throw new Error('无效的Data URL格式。');
    }
    const mimeType = matches[1];
    const imageBase64 = matches[2];

    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const formData = new FormData();
    formData.append('file', blob, 'image.jpg');
    formData.append('user', USER_ID);

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
 * 【重构的函数】: 步骤二 - 发送聊天消息 (此函数已正确导出，无需改动)
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


// --- 兼容性函数，保持不变 ---
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
