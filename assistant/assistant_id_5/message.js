import { loadConfig } from './config.js'

/**
 * [修改] 解析由 Gradio/Hugging Face Space 后端发送的、以换行符分隔的JSON流。
 * 这种流的每一行都是一个独立的JSON对象。
 * @param {ReadableStreamDefaultReader} reader - fetch响应体的reader
 */
async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		// 将新读取到的数据块追加到缓冲区
		buffer += decoder.decode(value, { stream: true });
		// 按换行符分割
		const lines = buffer.split('\n');
		// 保留最后一个不完整的行，放回缓冲区等待下一次读取
		buffer = lines.pop() || '';

		for (const line of lines) {
			const trimmedLine = line.trim();
			// 跳过空行
			if (!trimmedLine) continue;

			try {
				// 尝试将每一行解析为JSON
				const json = JSON.parse(trimmedLine);
				yield json;
			} catch (e) {
				console.error('解析Hugging Face Stream JSON数据出错:', e, '原始行:', trimmedLine);
			}
		}
	}
}


/**
 * [核心修改] 获取对 Hugging Face Space API 的响应
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 一个异步生成器，其产出格式与OpenAI API兼容
 */
export async function getResponse(messages) {
	// 加载包含 baseURL 和 modelName 的配置
	const config = loadConfig();

	// 1. [修改] 准备请求体 (Request Body)
	//    - 移除所有 OpenAI 特定的参数
	//    - 根据 Python 示例，我们只需要发送最后一条用户信息
	
	// 从消息历史中找到最后一条用户发出的消息
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	
	if (!lastUserMessage) {
		throw new Error("消息历史中没有找到用户消息。");
	}

	// 提取文本内容。原版支持图片，这里我们假设新API只接受文本。
	const promptText = typeof lastUserMessage.content === 'string' 
		? lastUserMessage.content 
		: lastUserMessage.content.find(p => p.type === 'text')?.text || '';

	if (!promptText) {
		throw new Error("无法从最后一条用户消息中提取文本内容。");
	}

	// 构建符合 Hugging Face Space (Gradio) API 的请求体
	const requestBody = {
		message: promptText,
		// Gradio API 通常通过参数控制是否流式返回
		// 如果您的API需要，可以在这里添加，例如 stream: true
	};

	// 2. [修改] 发起fetch请求
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			// Hugging Face Space 通常不需要 API Key in Bearer token
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`API请求失败: ${response.status} ${errorData}`);
	}

	// 3. [修改] 处理流式响应
	//    创建一个新的异步生成器，用于模拟Python代码中的“打字机”效果，
	//    并将其输出包装成与OpenAI兼容的格式，以便UI代码无需更改。
	return (async function*() {
		const reader = response.body.getReader();
		const streamReader = createStreamReader(reader);
		
		let lastChunkText = "";

		for await (const chunk of streamReader) {
			// =================================================================
			//  重要: 您可能需要根据实际返回的JSON结构调整这里的路径
			//  例如，如果返回的是 {"reply": "你好"}，则使用 chunk.reply
			//  根据gradio-client的常见行为，它可能在 chunk.output[0] 或类似位置
			//  我们先假设它在一个名为 'output' 的键中，且是一个数组
			// =================================================================
			const currentFullText = chunk.output && Array.isArray(chunk.output) 
				? chunk.output[0] 
				: (chunk.reply || ''); // 备选方案: 检查 'reply' 键

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
	})();
}
