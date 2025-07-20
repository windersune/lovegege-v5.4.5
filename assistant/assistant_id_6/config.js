// config.js

const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t"; // 请替换为您的真实API Key
// const API_BASE_URL = "https://apilovegege.com/dify"; // 暂时注释掉您的代理
const API_BASE_URL = "https://api.dify.ai";         // 【临时修改为此行】
const CHAT_ENDPOINT = `${API_BASE_URL}/v1/chat-messages`;
const FILE_UPLOAD_ENDPOINT = `${API_BASE_URL}/v1/files/upload`;
const USER_ID = "mada-123"; // 建议为每个终端用户生成独立的ID

/**
 * 步骤一 - 上传文件对象到Dify
 * @param {File} fileObject - 从 <input type="file"> 或拖拽事件中获取的 File 对象.
 * @returns {Promise<string>} - 返回上传成功后的文件ID.
 */
export async function uploadFileToDify(fileObject) {
    // 1. 创建 FormData 对象，这是上传文件的标准方式
    const formData = new FormData();

    // 2. 将文件和用户ID附加到表单数据中. [1, 3]
    // 'file' 和 'user' 是Dify API规定的必需字段名. [1]
    formData.append('file', fileObject);
    formData.append('user', USER_ID);

    console.log(`[Dify] 正在上传文件: ${fileObject.name} (${Math.round(fileObject.size / 1024)} KB)`);

    // 3. 发送 POST 请求
    const response = await fetch(FILE_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
            // 注意：当使用 FormData 时，浏览器会自动设置正确的 'Content-Type: multipart/form-data'
            // 和 boundary。千万不要手动设置 'Content-Type'。 [1, 17]
            'Authorization': `Bearer ${API_KEY}`,
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`文件上传API请求失败 (${response.status})，响应: ${errorText}`);
    }

    const result = await response.json();
    console.log("[Dify] 文件上传成功，返回结果:", result);
    return result.id; // 根据Dify文档，返回结果中包含ID. [4]
}


/**
 * 步骤二 - 发送包含文件引用的聊天消息
 * @param {string} query - 用户的文本输入.
 * @param {string | null} fileId - (可选) 从上一步获取的文件ID.
 * @param {string | null} conversationId - (可选) 当前的对话ID，用于保持上下文.
 * @returns {AsyncGenerator<object>}
 */
export async function* getDifyChatResponseAsStream(query, fileId = null, conversationId = null) {
	try {
		// 1. 构建符合Dify API文档的Payload. [5]
		const payload = {
			"inputs": {},
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || undefined, // 如果为null则不发送该字段
			"files": []
		};

        // 2. 如果存在文件ID，按官方要求格式添加到files数组中
		if (fileId) {
			payload.files.push({
				"type": "image", // 目前主要支持图片
				"transfer_method": "local_file", // 【关键】指明这是通过文件上传接口得到的文件. [5]
				"upload_file_id": fileId // 使用上传后获得的ID. [5]
			});
		}
		
		console.log("[Dify] 发送给聊天API的最终Payload:", JSON.stringify(payload, null, 2));

		// 3. 发送聊天请求
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
			throw new Error(`聊天API请求失败 (${response.status})，响应: ${errorText}`);
		}
		
        // 4. 处理流式响应 (这部分逻辑与之前相同)
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
