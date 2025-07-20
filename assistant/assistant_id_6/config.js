// =================================================================
//                 Dify API Configuration
// =================================================================
// 请确保将 API_KEY 和 API_BASE_URL 替换为您的真实信息
// IMPORTANT: Replace with your actual Dify API Key and Base URL.
const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 替换成你自己的Dify应用API密钥
const API_BASE_URL = "https://apilovegege.com/dify"; // 替换成你自己的Dify API基础URL
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;

// 建议为每个终端用户生成一个唯一的、稳定的ID。
// A unique and stable ID for the end-user.
const USER_ID = "mada-123";

/**
 * 步骤一 - 上传文件到Dify并获取文件ID (此函数已是正确的，无需修改)
 * Step 1 - Upload a file to Dify and get the file ID. (This function is correct, no changes needed).
 * @param {string} dataUrl - 包含MIME类型和Base64数据的完整Data URL (The complete Data URL string, including MIME type and Base64 data).
 * @returns {Promise<string>} - 返回上传成功后的文件ID (Returns the file ID after a successful upload).
 */
export async function uploadFileToDify(dataUrl) {
    // 1. 从Data URL中动态解析出MIME类型和纯Base64数据
    // 1. Dynamically parse the MIME type and raw Base64 data from the Data URL.
    const matches = dataUrl.match(/^data:(image\/[a-z]+);base64,(.*)$/);
    if (!matches) {
        throw new Error('无效的Data URL格式 (Invalid Data URL format).');
    }
    const mimeType = matches[1]; // 例如 "image/jpeg"
    const imageBase64 = matches[2];

    // 2. 将 Base64 字符串解码为二进制数据
    // 2. Decode the Base64 string into binary data.
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    // 3. 用二进制数据和正确的MIME类型创建Blob对象
    // 3. Create a Blob object with the binary data and the correct MIME type.
    const blob = new Blob([byteArray], { type: mimeType });

    // 4. 创建 FormData 并添加字段，严格遵循官方文档
    // 4. Create FormData and append fields, strictly following the official documentation.
    const formData = new FormData();
    formData.append('file', blob, 'image.jpg'); // `file`是必需的字段名 (`file` is the required field name)
    formData.append('user', USER_ID);           // `user`是必需的字段名 (`user` is the required field name)

    // 5. 发送请求
    // 5. Send the request.
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            // 当使用 FormData 时，浏览器会自动设置正确的 'Content-Type: multipart/form-data' 和 boundary，我们不能手动设置
            // When using FormData, the browser automatically sets the correct 'Content-Type: multipart/form-data' with a boundary. Do not set it manually.
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传失败 (${response.status})，响应: ${errorText} (File upload failed (${response.status}), response: ${errorText})`);
    }

    const result = await response.json();
    console.log("[Dify] 文件上传成功，返回结果 (File uploaded successfully, response):", result);
    return result.id; // 返回文件ID (Return the file ID)
}


/**
 * 步骤二 - 发送聊天消息，并在 files 字段中附带文件ID (此函数已修正)
 * Step 2 - Send a chat message with the file ID in the `files` field (This function has been corrected).
 * @param {string} query - 用户的文本输入 (The user's text input).
 * @param {string | null} fileId - 从上一步获取的文件ID (The file ID obtained from the previous step).
 * @param {string | null} conversationId - 对话上下文ID (The conversation context ID).
 * @returns {AsyncGenerator<object>}
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		// 构建符合官方文档的最终Payload
		// Construct the final payload according to the official documentation.
		const payload = {
			"inputs": {},
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || '',
			"files": [] // <-- 初始化 files 数组 (Initialize the files array)
		};

        // 【核心修正】: 根据Dify文档，引用已上传文件时，必须同时提供`type`, `transfer_method`, 和 `upload_file_id`。
        // [CRITICAL FIX]: According to Dify's documentation, when referencing an uploaded file,
        // you must provide `type`, `transfer_method`, and `upload_file_id` together.
		if (fileId) {
			payload.files.push({
				"type": "image",
				"transfer_method": "local_file", // <-- 【关键补充】指明这是通过本服务上传的文件 (CRITICAL ADDITION: Specifies this is a file uploaded via this service)
				"upload_file_id": fileId         // <-- 使用官方指定的 `upload_file_id` 键 (Use the official `upload_file_id` key)
			});
		}
		
		console.log("[Dify] 发送给聊天API的最终Payload (Final payload sent to the chat API):", JSON.stringify(payload, null, 2));

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
			throw new Error(`请求失败 (${response.status})，响应: ${errorText} (Request failed (${response.status}), response: ${errorText})`);
		}
		
        // 后续的流处理逻辑完全不变
        // The subsequent stream processing logic remains unchanged.
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
						console.error("无法解析Dify数据块 (Could not parse Dify data chunk):", jsonStr);
					}
				}
			}
		}

	} catch (error) {
		console.error(`[Dify] 流式API调用过程发生严重错误 (A critical error occurred during the streaming API call): ${error.message}`);
		throw error;
	}
}


// =================================================================
//                 兼容性函数 (Compatibility Functions)
// =================================================================
// These functions remain unchanged.
export function loadConfig() {
	return { apiKey: API_KEY, baseURL: API_BASE_URL };
}

export function hasValidConfig() {
	return true;
}
