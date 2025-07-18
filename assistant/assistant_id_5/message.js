import { loadConfig } from './config.js'

/**
 * 将标准对话历史发送到 Gradio API 并获取流式响应
 * @param {Array} messages - 对话历史数组, 格式为 [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]
 * @returns {AsyncGenerator} - 返回一个流式数据读取器，每次yield出完整的回复文本
 */
export async function getResponse(messages) {
	const config = loadConfig();

	if (messages.length === 0) {
		throw new Error("对话历史不能为空");
	}

	// 1. 将通用消息格式转换为 Gradio API 需要的格式
	// Gradio `predict` 函数接收: (message, history)
	// - message: 最新的用户消息 (string)
	// - history: 之前的对话对 (Array of [user_msg, assistant_msg])
	const latestMessage = messages[messages.length - 1].content;
	const history = [];
	
	// 提取除最后一条消息外的所有内容作为历史
	const historyMessages = messages.slice(0, -1);
	for (let i = 0; i < historyMessages.length; i += 2) {
		const userMsg = historyMessages[i].content;
		// 确保即使历史记录不完整也不会出错
		const assistantMsg = (historyMessages[i + 1]) ? historyMessages[i + 1].content : "";
		history.push([userMsg, assistantMsg]);
	}

	// 2. 构建Gradio API需要的请求体
	const requestBody = {
		data: [
			latestMessage,
			history
		]
	};

	// 3. 发送请求到你的Cloudflare Worker
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`Gradio API 请求失败: ${response.status} ${errorData}`);
	}

	// 4. 使用专门为Gradio设计的流式解析器
	return createGradioStreamReader(response.body.getReader());
}

/**
 * 创建一个专门解析Gradio流式响应的异步生成器
 * @param {ReadableStreamDefaultReader} reader - fetch响应的reader
 */
async function* createGradioStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || ''; // 保留不完整的行到下一次循环处理

		for (const line of lines) {
			const trimmedLine = line.trim();
			// Gradio的流式数据以 'data: ' 开头
			if (trimmedLine.startsWith('data: ')) {
				try {
					const json = JSON.parse(trimmedLine.slice(6));
					
					// Gradio在生成过程中会发送 'process_generating' 事件
					// 当生成结束时会发送 'process_completed' 事件
					if (json.msg === 'process_generating' || json.msg === 'process_completed') {
						// 从你的app.py我们知道，输出在 `output.data[0]`
						const outputText = json.output?.data?.[0];

						// 只有在获取到有效文本时才 yield
						if (typeof outputText === 'string') {
							// 【重要】这里直接 yield 完整的文本字符串
							yield outputText;
						}
						
						// 如果是最后一条消息，则结束生成器
						if (json.msg === 'process_completed') {
							return;
						}
					}
				} catch (e) {
					console.error('解析Gradio SSE数据出错:', e);
				}
			}
		}
	}
}
