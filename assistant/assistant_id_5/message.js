import { loadConfig } from './config.js'

// [核心修改] getResponse 现在是一个标准的 async 函数，不再是生成器
export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// Gradio API 通常只需要最新的用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}

	// [核心修改] 构建适配 Gradio API 的请求体
	// 注意：去除了 stream: true
	const requestBody = {
		data: [
			lastUserMessage.content,     // 对应 "message"
			config.system_message,       // 对应 "system_message"
			Number(config.max_tokens),   // 对应 "max_tokens"
			Number(config.temperature),  // 对应 "temperature"
			Number(config.top_p),        // 对应 "top_p"
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

	// [核心修改] 直接解析 JSON 响应，不再需要 createStreamReader
	const jsonResponse = await response.json();

	// 从返回的数据中提取模型输出
	const outputContent = jsonResponse.data[0];

	// [核心修改] 为了适配您前端原有的流式处理逻辑，
	// 我们模拟一个“流”，它只包含一个最终结果。
	// 这是一个异步生成器函数。
	async function* createSingleResponse() {
		yield { content: outputContent };
	}

	return createSingleResponse();
}
