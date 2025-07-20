// =================================================================
//     Dify API Configuration (Final Version Based on Evidence)
// =================================================================
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";
const API_BASE_URL = "https://apilovegege.com/dify";
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

// ... (uploadFileToDify 函数是正确的，保持不变) ...
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
    return result.id;
}


// ... (getResponseAsStream 函数也需要修正，以正确解析Chat API的返回格式) ...
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		const payload = {
			"inputs": {}, 
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
			"files": [] // 这是将文件送入`sys.files`的唯一正确途径
		};

		if (fileId) {
            // 【最终修正】: 只提供必须的字段，不加任何多余的 "variable" 键
            payload.files.push({
				"type": "image",
                "transfer_method": "local_file",
				"upload_file_id": fileId
			});
		}
		
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
                        // 【最终修正】: 解析Chat API的标准数据块，它应该包含 'answer' 字段
						const parsedChunk = JSON.parse(jsonStr);
						yield parsedChunk; 
					} catch (e) {
						// 之前的报错就是在这里发生的，现在我们知道了原因
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

export function loadConfig() { return { apiKey: API_KEY, baseURL: API_BASE_URL }; }
export function hasValidConfig() { return true; }
