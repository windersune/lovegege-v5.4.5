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

// message.js (最终修正版)
export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig()

	// ===================================================================
	//                        【核心修改】
	//  我们不再对 messages 数组进行任何 slice (切片) 操作。
	//  api.js 传过来的完整数据包将被直接使用。
	// ===================================================================

	// 构建包含所有调试参数的请求体
	const requestBody = {
		// 【重要】这里直接将完整的 messages 数组放入请求体
		// systemPrompt 应该由前端逻辑在最开始就加入 history 数组
		messages: [
			{ role: 'system', content: config.systemPrompt },
			...messages,
		],
		model: config.modelName,
		stream: true,
		
		// 从config对象中读取所有调试参数
		temperature: Number(config.temperature),
		top_p: Number(config.top_p),
		max_tokens: parseInt(config.max_tokens, 10),
		presence_penalty: Number(config.presence_penalty),
		frequency_penalty: Number(config.frequency_penalty),
	};

	// fetch调用部分保持原样
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
            // 如果您的 baseURL 不是 OpenAI 官方地址，可能不需要 Authorization
            // 如果需要，请确保这里有 'Authorization': `Bearer ${config.apiKey}`
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
