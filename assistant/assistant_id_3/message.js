import { loadConfig, hasValidConfig } from './config.js'

// createStreamReader 函数与您提供的版本保持一致，因为它是一个通用的SSE解析器
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
					yield json;
				} catch (e) {
					console.error('解析Coze SSE数据出错:', e);
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

	// 1. 检查配置是否有效
	if (!hasValidConfig(config)) {
		throw new Error('配置无效: 请在设置中填写您的 Personal Access Token 和 Bot ID。');
	}

	// 2. 从完整的消息历史中提取最后一条用户消息作为 query
    // Coze /chat API 只接受最新的用户输入作为 `query`
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error('没有找到用户消息。');
	}

	// 3. 提取除最后一条用户消息外的对话历史
    // Coze API 通过 `chat_history` 字段传递历史记录
	const chatHistory = messages.slice(0, messages.length - 1).map(msg => ({
		role: msg.role === 'assistant' ? 'assistant' : 'user', // 仅支持 'user' 和 'assistant'
		content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || ''), // 简化处理，仅取文本部分
	}));


	// 4. 构建 Coze API 请求体
	const requestBody = {
		bot_id: config.bot_id,
		user: config.user_id,
		query: typeof lastUserMessage.content === 'string' 
               ? lastUserMessage.content 
               : (lastUserMessage.content[0]?.text || ''), // 简化处理，仅取最新的文本query
		chat_history: chatHistory,
		stream: true,
	};
    
    // 注意：Coze API 不支持图片输入（/chat 接口），所以我们简化了逻辑，
    // 不再需要处理多模态 `content` 数组。如果用户上传了图片，我们只提取文本部分。

	// 5. 发送 fetch 请求
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
            // Coze API 要求使用 Bearer Token进行身份验证
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
