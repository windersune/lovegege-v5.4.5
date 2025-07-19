
import { loadConfig } from './config.js'

// ... sleep 和 createStreamReader 函数保持原样 ...
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}
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
			const trimmedLine = line.trim();
			if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
			
			if (trimmedLine.startsWith('data: ')) {
				try {
					const json = JSON.parse(trimmedLine.slice(6));
					yield json;
				} catch (e) {
					console.error('解析SSE数据出错:', e);
				}
			}
		}
	}
}


export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 1. 检查整个消息历史中是否包含任何图片
	const containsImage = messages.some(msg => 
		Array.isArray(msg.content) && msg.content.some(part => part.type === 'image_url')
	);

	// 2. 如果包含图片，则确保所有用户消息都是数组格式
	let processedMessages = messages;
	if (containsImage) {
		processedMessages = messages.map(msg => {
			// 只处理 role 为 'user' 且 content 是字符串的消息
			if (msg.role === 'user' && typeof msg.content === 'string') {
				// 将其转换为多模态数组格式
				return {
					...msg,
					content: [{ type: 'text', text: msg.content }]
				};
			}
			// 其他消息（助手消息或已经是数组的用户消息）保持原样
			return msg;
		});
	}

	// 构建请求体
	const requestBody = {
		// 使用我们处理过的 processedMessages
		messages: [
			{ role: 'system', content: config.systemPrompt },
			...processedMessages,

		],
		model: config.modelName,
		stream: true,
		
		temperature: Number(config.temperature),
		top_p: Number(config.top_p),
		max_tokens: parseInt(config.max_tokens, 10),
		presence_penalty: Number(config.presence_penalty),
		frequency_penalty: Number(config.frequency_penalty),
	};

	// ... fetch 和后续代码保持不变 ...
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API请求失败: ${response.status} ${errorData}`);
	}

	const reader = response.body.getReader();
	return createStreamReader(reader);
}
