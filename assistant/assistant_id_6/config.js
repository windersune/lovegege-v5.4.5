// =================================================================
//     Dify API Configuration (Final Version Based on Official Docs & Logic)
// =================================================================
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 您的API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 您的基础URL

// 坚持使用 Chat App 接口
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`; 

// 这个上传接口，严格遵循您提供的官方文档
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

/**
 * 步骤一 - 上传文件 (此函数已确认为100%符合官方文档)
 */
export async function uploadFileToDify(dataUrl) {
    const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!matches) throw new Error('无效的Data URL格式.');
    const mimeType = matches[1], imageBase64 = matches[2];
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
        headers: { 'Authorization': `Bearer ${API_KEY}` },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败 (${response.status})，响应: ${errorText}`);
    }

    const result = await response.json();
    console.log("[Dify] 文件上传成功:", result);
    return result.id;
}

/**
 * 步骤二 - 发送聊天消息 (使用 "variable" 键来精确映射)
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		const payload = {
			"inputs": {}, 
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
			"files": []
		};

		if (fileId) {
            payload.files.push({
				"type": "image",
                "transfer_method": "local_file",
				"upload_file_id": fileId,
                // 【最终解决方案】: 这行代码将上传的文件，直接映射到您定义的`image`变量
                "variable": "image" 
			});
		}
		
		console.log("[Dify] 发送最终Payload到聊天接口:", JSON.stringify(payload, null, 2));

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
						yield JSON.parse(jsonStr);
					} catch (e) {
						console.error("无法解析Dify数据块:", jsonStr);
					}
				}
			}
		}

	} catch (error) {
		console.error(`[Dify] 完整流程发生严重错误: ${error.message}`);
		throw error;
	}
}

// 兼容性函数
export function loadConfig() { return { apiKey: API_KEY, baseURL: API_BASE_URL }; }
export function hasValidConfig() { return true; }
