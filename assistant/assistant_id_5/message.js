import { loadConfig } from './config.js'

/**
 * 解析由 Gradio/Hugging Face Space 后端发送的、以换行符分隔的JSON流。
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
			const trimmedLine = line.trim();
			if (!trimmedLine) continue;
            // Gradio 流通常以 'data: ' 开头
			if (trimmedLine.startsWith('data: ')) {
				try {
					const json = JSON.parse(trimmedLine.slice(6));
					yield json;
				} catch (e) {
					console.error('解析Hugging Face Stream JSON数据出错:', e, '原始行:', trimmedLine);
				}
			}
		}
	}
}


/**
 * [核心修改] 获取对 Hugging Face Space API 的响应
 */
export async function getResponse(messages) {
	const config = loadConfig();

	// 1. 提取最后一条用户消息作为 prompt
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) throw new Error("消息历史中没有找到用户消息。");

	const promptText = typeof lastUserMessage.content === 'string' 
		? lastUserMessage.content 
		: lastUserMessage.content.find(p => p.type === 'text')?.text || '';

	if (!promptText) throw new Error("无法从最后一条用户消息中提取文本内容。");

	// 2. [已修正] 构建符合 Gradio /run/ API 的请求体
    //    它需要一个 data 字段，其值为一个数组，包含所有参数。
	const requestBody = {
		"data": [
			promptText
		]
	};

	// 3. 发起fetch请求 (URL已在config.js中修正)
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

	// 4. 处理流式响应
	return (async function*() {
		const reader = response.body.getReader();
		const streamReader = createStreamReader(reader);
		
		let lastChunkText = "";

		for await (const chunk of streamReader) {
            // 根据 Python 代码，Gradio 流的每个 chunk 都是到当前为止的完整回复
			// 假设回复在 chunk.data[0] 中
			if (chunk.msg === 'process_generating' && chunk.output.data) {
				const currentFullText = chunk.output.data[0] || "";

				// 计算新增的文本 (delta)
				const newText = currentFullText.substring(lastChunkText.length);
				lastChunkText = currentFullText;

				if (newText) {
					// 将新增文本包装成OpenAI的格式，以兼容UI
					yield {
						choices: [{
							delta: {
								content: newText
							}
						}]
					};
				}
			}
		}
	})();
}
