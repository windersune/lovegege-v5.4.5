import { loadConfig } from './config.js'

// [最终版] getResponse 函数
export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 获取最新的用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}

	// [核心修改] 构建包含 6 个参数的请求体，与 app.py 中的 respond 函数签名完全对应
	// (message, history, system_message, max_tokens, temperature, top_p)
	const requestBody = {
		data: [
			lastUserMessage.content,     // 1. message (string)
			[],                          // 2. history (list[tuple[str, str]]), 我们发送一个空数组
			config.system_message,       // 3. system_message (string)
			Number(config.max_tokens),   // 4. max_tokens (number)
			Number(config.temperature),  // 5. temperature (number)
			Number(config.top_p),        // 6. top_p (number)
		],
	};

	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
        // 尝试解析错误信息以提供更详细的线索
		const errorText = await response.text();
		console.error("API 错误响应:", errorText);
		throw new Error(`API请求失败: ${response.status} ${errorText}`);
	}

	// 因为后端的 respond 函数是一个流式生成器 (yield)，所以这里需要流式读取
	// 我们需要一个适配 Gradio 流的 reader
	const reader = response.body.getReader();
	
	async function* createGradioStreamReader(reader) {
		const decoder = new TextDecoder();
		let buffer = '';
		let contentBuffer = '';

		while (true) {
			const { value, done } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() || '';

			for (const line of lines) {
				const trimmedLine = line.trim();
				if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

				try {
					const json = JSON.parse(trimmedLine.slice(5));

					if (json.msg === 'process_generating' && json.output) {
						const newContent = json.output.data[0];
						if (newContent.length > contentBuffer.length) {
							const delta = newContent.substring(contentBuffer.length);
							yield { content: delta };
							contentBuffer = newContent;
						}
					} else if (json.msg === 'process_completed') {
						const finalOutput = json.output.data[0];
						if (finalOutput.length > contentBuffer.length) {
							const delta = finalOutput.substring(contentBuffer.length);
							yield { content: delta };
						}
						return;
					}
				} catch (e) {
					console.error('解析Gradio SSE数据出错:', e, "Line:", trimmedLine);
				}
			}
		}
	}

	return createGradioStreamReader(reader);
}
