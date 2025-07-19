const API_KEY = "app-V8ZAbavCEJ20ZKlJ4dRJOr7t";

// [修正 1] 移除了URL中多余的单引号
const API_BASE_URL = "https://apilovegege.com/dify"; 
const WORKFLOW_ENDPOINT = `${API_BASE_URL}/v1/workflows/run`;
const USER_ID = "mada-123";

// --- 配置结束 ---

// --- 兼容接口，保持不变 ---
export function loadConfig() {
	return {
		apiKey: API_KEY, // 虽然硬编码，但保持接口兼容性
		baseURL: API_BASE_URL
	};
}
export function hasValidConfig() {
	return true;
}
// --- 兼容接口结束 ---


/**
 * [核心修正] 调用Dify工作流的主要函数
 * @param {string} query - 当前用户的提问
 * @param {string|null} conversationId - 当前的会话ID，如果是新会话则为null
 * @param {Function} onDataCallback - 接收到流式数据块时的回调函数
 * @param {Function} onDoneCallback - 流结束时的回调
 * @param {Function} onErrorCallback - 发生错误时的回调
 * @returns {Promise<Object>} - 返回一个包含最终结果和会话ID的对象
 */
export async function runDifyWorkflowStream(query, conversationId = null, onDataCallback, onDoneCallback, onErrorCallback) {
	try {
		console.log(`[DEBUG] 开始调用工作流, query: "${query}", conversation_id: ${conversationId}`);

		// [修正 2] 简化请求体，不再手动拼接上下文(context)。
		// Dify会通过 conversation_id 自动管理历史记录。
		// 我们只发送当前用户的提问(query)即可。
		// 【注意】请确保您在Dify工作流中定义的输入变量名是 "query"。如果不是，请修改这里的键名。
		const payload = {
			inputs: {
				"query": query 
			},
			response_mode: "streaming",
			user: USER_ID,
			conversation_id: conversationId || '' // 如果为null，则传递空字符串，Dify会自动创建新会话
		};
		
		console.log("[DEBUG] 发送的Payload:", JSON.stringify(payload, null, 2));

		// 发送请求
		const response = await fetch(WORKFLOW_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});
		
		// 处理错误
		if (!response.ok) {
			const errorText = await response.text();
			const error = new Error(`API请求失败，状态码: ${response.status}. 响应: ${errorText}`);
			console.error(`[ERROR] ${error.message}`);
			throw error;
		}
		
		// 处理流式响应 (这部分逻辑是正确的，予以保留)
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
		let buffer = '';
		let fullResponse = '';
		let newConversationId = conversationId;
		
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			
			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || ''; // 保留缓冲区中不完整的行

			for (const line of lines) {
				if (line.startsWith('data:')) {
					const jsonStr = line.substring(5).trim();
					if (!jsonStr) continue;

					try {
						const data = JSON.parse(jsonStr);
						
						if (data.conversation_id) {
							newConversationId = data.conversation_id;
						}
						
						if (data.event === 'agent_message' && typeof data.answer === 'string') {
							fullResponse += data.answer;
							if (onDataCallback) {
								onDataCallback(data, data.answer);
							}
						} else if (data.event === 'error') {
							throw new Error(`流错误: ${data.code} - ${data.message}`);
						}
					} catch (e) {
						console.warn(`[WARN] JSON解析错误: ${e.message}`, "Line:", line);
					}
				}
			}
		}

		if (onDoneCallback) onDoneCallback();
		
		const result = {
			conversationId: newConversationId,
			response: fullResponse
		};
		console.log("[DEBUG] 工作流执行完毕, 结果:", result);
		return result;

	} catch (error) {
		console.error(`[ERROR] 工作流调用异常: ${error.message}`);
		if (onErrorCallback) onErrorCallback(error);
		throw error;
	}
}
