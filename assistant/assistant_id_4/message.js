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
	const config = loadConfig()

	// 历史消息记录管理部分保持原样 ...
	if (messages.length > 0) {
		messages = messages.slice(0, -1)
	}
	if (messages.length > 11) {
		messages = messages.slice(-11)
	}

	// ===================================================================
	//                        【核心修改】
	// ===================================================================
	// 构建包含所有调试参数的请求体
	const requestBody = {
		messages: [
			{ role: 'system', content: config.systemPrompt },
			...messages,
		],
		model: config.modelName,
		stream: true,
		
		// [新增] 从config对象中读取所有调试参数
		// 使用Number()和parseInt()确保类型正确，防止从localStorage读取时变成字符串
		temperature: Number(config.temperature),
		top_p: Number(config.top_p),
		max_completion_tokens: parseInt(config.max_completion_tokens, 10),
		presence_penalty: Number(config.presence_penalty),
		frequency_penalty: Number(config.frequency_penalty),
	};

	// fetch调用部分保持原样，它现在会发送包含所有参数的requestBody
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

	// 流式响应处理部分保持原样
	const reader = response.body.getReader();
	return createStreamReader(reader);
}
