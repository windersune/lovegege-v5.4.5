// 文件: config.js
// [最终正确版 - 完全遵循官方文档]

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

/**
 * 步骤一 - 上传文件到Dify并获取文件ID
 * @param {string} dataUrl - 包含MIME类型和Base64数据的完整Data URL
 * @returns {Promise<string>} - 返回上传成功后的文件ID.
 */
export async function uploadFileToDify(dataUrl) {
    // 1. 从Data URL中动态解析出MIME类型和纯Base64数据
    const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!matches) {
        throw new Error('无效的Data URL格式。');
    }
    const mimeType = matches[1]; // 例如 "image/jpeg"
    const imageBase64 = matches[2];

    // 2. 将 Base64 字符串解码为二进制数据
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // 3. 用二进制数据和正确的MIME类型创建Blob对象
    const blob = new Blob([byteArray], { type: mimeType });

    // 4. 创建 FormData 并添加字段，严格遵循官方文档
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg'); // `file`是必需的字段名
    formData.append('user', USER_ID);           // `user`是必需的字段名

    // 5. 发送请求
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            // 当使用 FormData 时，浏览器会自动设置正确的 'Content-Type: multipart/form-data' 和 boundary，我们不能手动设置
            'Authorization': `Bearer ${API_KEY}`,
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
 * 步骤二 - 发送聊天消息，并在 files 字段中附带文件ID
 * @param {string} query - 用户的文本输入.
 * @param {string | null} fileId - 从上一步获取的文件ID.
 * @param {string | null} conversationId - 对话上下文ID.
 * @returns {AsyncGenerator<object>}
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		// 【核心】: 构建符合官方文档的最终Payload
		const payload = {
			"inputs": {}, // inputs 对象在此场景下为空
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
			"files": [] // <-- 初始化 files 数组
		};

        // 【核心】: 如果有文件ID，构建正确的对象并推入 files 数组
		if (fileId) {
			payload.files.push({
				"type": "image",
				"upload_file_id": fileId // <-- 使用官方指定的 `upload_file_id` 键
			});
		}
		
		console.log("[Dify] 发送给聊天API的最终Payload:", JSON.stringify(payload, null, 2));

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
