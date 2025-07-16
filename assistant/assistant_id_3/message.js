import { loadConfig, hasValidConfig } from './config.js';

/**
 * 【最终确认版】
 *  - 根据日志分析，本函数现在可以精确地从 Coze SSE 流中提取并转换数据。
 *  - 只处理 event 为 'message' 且 message.type 为 'answer' 的事件。
 *  - 将提取到的 content 包装成您前端UI所期望的格式。
 *  - 增加了对JSON解析错误的健壮处理。
 */
async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		// SSE 使用两个换行符作为消息分隔符
		const parts = buffer.split('\n\n');
		
		// 保留最后一个不完整的消息部分在缓冲区中
		buffer = parts.pop() || '';

		for (const part of parts) {
			const lines = part.split('\n');
			for (const line of lines) {
				// 只处理以 "data: " 开头的有效数据行
				if (line.trim().startsWith('data: ')) {
					const dataString = line.trim().substring(5); // 提取 "data: " 后面的内容
					try {
						const json = JSON.parse(dataString);

						// --- 【最核心的精确提取逻辑】 ---
						if (json.event === 'message' &&
							json.message &&
							json.message.type === 'answer' &&
							typeof json.message.content === 'string'
						) {
							// 将提取到的内容包装成UI期望的格式
							const formattedChunk = {
								choices: [
									{
										delta: {
											content: json.message.content,
										},
									},
								],
							};
							yield formattedChunk;
						}
						// 优雅地忽略所有其他类型的事件 (如 verbose, tool_response, thinking 等)
						
					} catch (error) {
						// 如果某一行数据不是有效的JSON，则忽略它，继续处理下一行
						// console.warn('Skipping non-JSON data line:', dataString);
					}
				}
			}
		}
	}
}

/**
 * 发送消息到 Coze API 并获取流式响应
 * (此函数逻辑已完全验证，无需修改)
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
