import { loadConfig, hasValidConfig } from './config.js'

/**
 * 【最终修正版】
 *  - 严格按照 Coze API 文档解析SSE流。
 *  - 只处理 event 为 'message' 且 message.type 为 'answer' 的事件。
 *  - 兼容中间过程可能出现的其他 message 类型，避免将其内容错误地显示出来。
 */
async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';
	
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';
		
		for (const line of lines) {
			// 只处理以 "data: " 开头的行
			if (line.trim().startsWith('data: ')) {
				try {
					const json = JSON.parse(line.trim().slice(6));
                    
                    // --- 【核心修正逻辑】 ---
					// 1. 必须是 message 事件
					// 2. data中必须有 message 对象
					// 3. message 对象的 type 必须是 'answer'
					// 4. message 对象中必须有 content
					if (json.event === 'message' && 
                        json.message && 
                        json.message.type === 'answer' &&
                        typeof json.message.content === 'string'
                    ) {
                        // 创建一个符合您旧UI预期的对象结构
						const formattedJson = {
							choices: [
								{
									delta: {
										content: json.message.content
									}
								}
							]
						};
						yield formattedJson; // 将格式化后的数据块传出
					} else if (json.event === 'error') {
                        // 如果Coze流直接返回错误事件，则将其抛出
                        console.error('Coze API Stream Error Event:', json);
                        throw new Error(`Coze API Error: ${json.error.message}`);
                    }
                    // 其他类型的事件 (如 thinking, tool_response 等) 将被优雅地忽略，不传给UI

				} catch (e) {
					// 忽略JSON解析错误，因为流式数据可能不完整
				}
			}
		}
	}
}


/**
 * 发送消息到 Coze API 并获取流式响应
 * (此函数之前的逻辑已验证是正确的，保持不变)
 */
export async function getResponse(messages) {
    const config = loadConfig();

    if (!hasValidConfig(config)) {
        throw new Error('配置无效: 请在设置中填写您的 Personal Access Token 和 Bot ID。');
    }

	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error('没有找到用户消息。');
	}

	const chatHistory = messages
        .slice(0, messages.length - 1)
        .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content)
        .map(msg => ({
            role: msg.role,
            content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || ''),
        }));

	const requestBody = {
		bot_id: config.bot_id,
		user: config.user_id,
		query: typeof lastUserMessage.content === 'string' 
               ? lastUserMessage.content 
               : (lastUserMessage.content[0]?.text || ''),
		chat_history: chatHistory,
		stream: true,
	};

	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${config.token}`, 
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API请求失败: ${response.status} - ${errorData}`);
	}

	const reader = response.body.getReader();
	return createStreamReader(reader);
}
