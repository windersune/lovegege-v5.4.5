import { loadConfig } from './config.js'

// ... sleep 函数保持原样 ...
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms))
}

// [核心修改] 重写 createStreamReader 以适配 Gradio 的 SSE 格式
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
			// 跳过空行
			if (!trimmedLine) continue;

			if (trimmedLine.startsWith('data:')) {
				try {
					const json = JSON.parse(trimmedLine.slice(5)); // 从 "data:" 之后开始解析

					// Gradio 流结束时会发送一个 "process_completed" 消息
					if (json.msg === 'process_completed') {
						// 提取最终的输出内容
						const finalOutput = json.output.data[0];
						yield { content: finalOutput };
						return; // 结束生成器
					}
					
					// Gradio 在生成过程中可能会发送 "process_generating" 消息
					// 如果需要实现打字机效果，可以在这里处理中间数据
					if (json.msg === 'process_generating' && json.output) {
						//  可以根据需要 yield 中间结果
						//  yield { content: json.output.data[0] };
					}

				} catch (e) {
					console.error('解析Gradio SSE数据出错:', e, "Line:", trimmedLine);
				}
			}
		}
	}
}


export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// [修改] Gradio API 通常只需要最新的用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("No user message found to send.");
	}

	// [核心修改] 构建适配 Gradio API 的请求体
	// 参数的顺序需要和 Gradio 应用中定义的函数参数顺序一致
	const requestBody = {
		data: [
			lastUserMessage.content,   // 对应 "message"
			config.system_message,     // 对应 "system_message"
			Number(config.max_tokens), // 对应 "max_tokens"
			Number(config.temperature),// 对应 "temperature"
			Number(config.top_p),      // 对应 "top_p"
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
		const errorData = await response.text();
		throw new Error(`API请求失败: ${response.status} ${errorData}`);
	}

	const reader = response.body.getReader();
	return createStreamReader(reader);
}
