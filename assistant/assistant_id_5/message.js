import { loadConfig } from './config.js'

// [最终正确版本]
export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 获取最新的用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}

	// ==================================================================
	//                        【最核心的修改】
	//   构建一个带参数名的 JSON 对象，而不是之前的 data 数组
	//   这与您提供的最新官方示例完全匹配
	// ==================================================================
	const requestBody = {
		message: lastUserMessage.content,
		system_message: config.system_message,
		max_tokens: Number(config.max_tokens),
		temperature: Number(config.temperature),
		top_p: Number(config.top_p),
	};

	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody), // 直接发送这个对象
	});

	if (!response.ok) {
		const errorText = await response.text();
		console.error("API 错误响应:", errorText);
		throw new Error(`API请求失败: ${response.status} ${errorText}`);
	}

	// API 现在直接返回一个 JSON 对象，不再是流，所以我们直接解析它
	const jsonResponse = await response.json();
	
	// 从返回的数据中提取模型输出
	// 根据官方示例，结果在 .data 字段中，它是一个数组
	const outputContent = jsonResponse.data[0];

	// 为了适配您前端可能存在的流式UI，我们模拟一个只包含最终结果的“流”
	async function* createSingleResponse() {
		yield { content: outputContent };
	}

	return createSingleResponse();
}
