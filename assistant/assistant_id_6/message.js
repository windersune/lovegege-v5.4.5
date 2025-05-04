import { loadConfig } from './config.js'

// 一个休眠函数，让程序等待一段时间（单位 ms）
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// 这个函数用来模拟一个 API 请求，一秒钟后返回字符串
export async function getMockResponse() {
	await sleep(1000)
	return '这是一条模拟的回复'
}

// 创建一个自定义的流式读取器，用于处理SSE流
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
	// 由于配置信息可能会发生变化，因此每次都需要重新加载配置信息
	const config = loadConfig()

	// 梳理一下这里收到的 messages 数组里有什么内容：
	// 1. 前面 0 轮或多轮的对话（每轮对话包含一条用户的 + 一条机器人的）
	// 2. 用户本次发送的消息
	// 3. 我们提前为机器人构造的占位消息

	// 最后一条占位消息不应该发送给 API，去掉它
	if (messages.length > 0) {
		messages = messages.slice(0, -1)
	}
	// 历史消息记录最多只保留最后 5 轮，加上用户本次发送的消息
	// 因此最终发送给 API 的消息最多取最后 11 条
	if (messages.length > 11) {
		messages = messages.slice(-11)
	}

	// 构建请求体
	const requestBody = {
		messages: [
			{ role: 'system', content: config.systemPrompt },
			...messages,
		],
		model: config.modelName,
		stream: true,
	};

	// 使用fetch API直接发送请求
	const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${config.apiKey}`,
			// 关键：添加跨域头信息
			'X-Requested-With': 'XMLHttpRequest'
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API请求失败: ${response.status} ${errorData}`);
	}

	// 处理流式响应
	const reader = response.body.getReader();
	return createStreamReader(reader);
}
