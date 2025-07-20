// =================================================================
//     Dify API Configuration (Final, Complete, and Correct Version)
// =================================================================
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 您的API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 您的基础URL

// 我们使用 Chat App 的标准接口
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`; 
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123";

/**
 * 步骤一 - 上传文件 (这个函数是本次修正的核心)
 * @param {string} dataUrl 
 * @returns {Promise<string>} 
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
    console.log("[Dify] 文件上传API成功返回JSON:", result); // 增加一个日志，方便确认

    // 【最终核心修正】: 必须有这一行，将获取到的ID返回给调用者
    return result.id;
}

/**
 * 步骤二 - 发送聊天消息 (此函数已是正确的)
 * @param {Array} messages 
 * @param {string | null} conversationId 
 * @returns {AsyncGenerator<object>}
 */
export async function* getDifyChatResponseAsStream(messages, conversationId = null) {
	try {
		const payload = {
			"inputs": {}, 
			"query": "This query is overridden by messages.",
			"messages": messages,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
		};
		
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
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
