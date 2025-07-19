import { loadConfig } from './config.js'

/**
 * [已修改] 解析 Gradio 后端发送的 SSE (Server-Sent Events) 流。
 * Gradio 流的每一条有效信息都以 "data: " 开头。
 * @param {ReadableStreamDefaultReader} reader - fetch响应体的reader
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
			// 只处理以 "data: " 开头的行
			if (trimmedLine.startsWith('data: ')) {
				try {
					// 移除 "data: " 前缀并解析JSON
					const json = JSON.parse(trimmedLine.slice(6));
					yield json;
				} catch (e) {
					console.error('解析Gradio Stream JSON数据出错:', e, '原始行:', trimmedLine);
				}
			}
		}
	}
}


/**
 * [核心修改] 严格按照 `gradio_client` 的行为模式获取响应
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 一个异步生成器，其产出格式与OpenAI API兼容
 */
export async function getResponse(messages) {
	// 加载包含正确 baseURL 的配置
	const config = loadConfig();

	// 1. 从消息历史中提取最后一条用户消息作为 prompt
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("消息历史中没有找到用户消息。");
	}

	const promptText = typeof lastUserMessage.content === 'string' 
		? lastUserMessage.content 
		: lastUserMessage.content.find(p => p.type === 'text')?.text || '';

	if (!promptText) {
		throw new Error("无法从最后一条用户消息中提取文本内容。");
	}

	// 2. [重要] 构建符合 Gradio /run/ API 的请求体
    //    gradio_client 将所有参数按顺序放入一个 "data" 数组中。
    //    因为您的函数只有一个 `message` 参数，所以数组里只有一个元素。
	const requestBody = {
		"data": [
			promptText
		]
	};

	// 3. 发起 fetch 请求
	const response = await fetch(config.baseURL, { // baseURL 已在 config.js 中设为 .../run/chat
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

	// 4. [重要] 处理流式响应，模拟Python代码的行为
	return (async function*() {
		const reader = response.body.getReader();
		const streamReader = createStreamReader(reader);
		
		// 这个变量用于存储上一次收到的完整文本，对应您Python代码中的 `last_chunk`
		let lastChunkText = "";

		for await (const chunk of streamReader) {
			// Gradio 在流式生成过程中，会发送 msg 为 "process_generating" 的事件
			if (chunk.msg === 'process_generating' && chunk.output && chunk.output.data) {
				// 获取当前收到的完整回复文本
				// 我们假设回复在 .data 数组的第一个元素中
				const currentFullText = chunk.output.data[0] || "";

				// 计算本次新增的文本 (delta)，完全复刻您Python代码的逻辑
				const newText = currentFullText.substring(lastChunkText.length);
				
				// 更新“上一次”的文本记录，为下次计算做准备
				lastChunkText = currentFullText;

				if (newText) {
					// 将新增文本包装成与您项目UI兼容的OpenAI格式
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
