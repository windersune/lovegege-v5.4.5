import { loadConfig } from './config.js'

export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 获取最新的用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}

	// [核心] 构建与 respond_for_api 函数完全匹配的请求体
	// 参数顺序: message, system_message, max_tokens, temperature, top_p
	const requestBody = {
		data: [
			lastUserMessage.content,
			config.system_message,
			Number(config.max_tokens),
			Number(config.temperature),
			Number(config.top_p),
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
		const errorText = await response.text();
		console.error("API 错误响应:", errorText);
		throw new Error(`API请求失败: ${response.status} ${errorText}`);
	}

	// [核心] API 现在直接返回一个 JSON 对象，不再是流
	const jsonResponse = await response.json();

	// 提取模型输出的内容
	const outputContent = jsonResponse.data[0];

	// 为了适配您前端的流式UI，我们模拟一个只包含最终结果的“流”
	async function* createSingleResponse() {
		yield { content: outputContent };
	}

	return createSingleResponse();
}
