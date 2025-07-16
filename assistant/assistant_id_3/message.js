import { loadConfig, hasValidConfig } from './config.js'

/**
 * 【关键修改】
 * 修改 createStreamReader 函数来适配 Coze API 的响应结构。
 * Coze 在 event: 'message' 中返回内容，格式为 { message: { content: '...' } }
 * 我们需要将其转换为您前端UI期望的格式，很可能是 { choices: [{ delta: { content: '...' } }] }
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
			if (line.trim().startsWith('data: ')) {
				try {
					const json = JSON.parse(line.trim().slice(6));
                    
                    // 【在这里进行转换】
                    // 检查事件类型是否为 'message' 并且包含有效内容
					if (json.event === 'message' && json.message && json.message.content) {
                        // 创建一个符合旧版UI预期的对象结构
						const formattedJson = {
							choices: [
								{
									delta: {
										content: json.message.content
									}
								}
							]
						};
						yield formattedJson;
					} else if (json.event === 'error') {
                        // 如果Coze流返回错误，则将其抛出
                        console.error('Coze API Stream Error:', json);
                        throw new Error(`Coze API Error: ${json.error.message}`);
                    }

				} catch (e) {
					console.error('解析或转换SSE数据出错:', e);
				}
			}
		}
	}
}


/**
 * 发送消息到 Coze API 并获取流式响应
 * @param {Array<object>} messages - 对话历史消息数组
 * @returns {AsyncGenerator<object, void, unknown>} - 一个异步生成器，用于逐块返回响应
 */
export async function getResponse(messages) {
	const config = loadConfig();

	if (!hasValidConfig(config)) {
		throw new Error('配置无效: 请在设置中填写您的 Personal Access Token 和 Bot ID。');
	}

    // Coze /chat API 只接受最新的用户输入作为 `query`
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error('没有找到用户消息。');
	}

    // Coze API 通过 `chat_history` 字段传递历史记录
    // 【优化】过滤掉空的或非user/assistant角色的历史记录，确保格式正确
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
