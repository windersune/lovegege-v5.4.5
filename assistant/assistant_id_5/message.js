import { loadConfig } from './config.js'

export async function getResponse(messages) {
	// 1. 加载配置
	const config = loadConfig();

	// 2. 获取最新用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}

	// ==================================================================
	//                        【终极核心修正】
	//   构建一个普通的、带命名参数的 JSON 对象，与 app.py 中的函数签名匹配
	//   不再使用 {"data": [...]} 的格式
	// ==================================================================
	const requestBody = {
		message: lastUserMessage.content,     // 对应 fn=respond_for_api 的 "message" 参数
		system_message: config.system_message, // 对应 "system_message" 参数
		max_tokens: Number(config.max_tokens), // 对应 "max_tokens" 参数
		temperature: Number(config.temperature),// 对应 "temperature" 参数
		top_p: Number(config.top_p),          // 对应 "top_p" 参数
	};

	try {
		const response = await fetch(config.baseURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody), // 直接发送这个对象
		});

		const responseText = await response.text();

		if (!response.ok) {
			// 即使请求失败，也打印出服务器返回的内容，方便调试
			console.error("服务器返回错误:", responseText);
			throw new Error(`API请求失败: ${response.status} ${responseText}`);
		}
		
		const jsonResponse = JSON.parse(responseText);

		// 根据 Gradio 的标准，返回的数据在 .data 字段中，它是一个数组
		const outputContent = jsonResponse.data[0];

		// 为了适配您前端的流式UI，我们模拟一个只包含最终结果的“流”
		async function* createSingleResponse() {
			yield { content: outputContent };
		}

		return createSingleResponse();

	} catch (error) {
		console.error("在 getResponse 函数中捕获到严重错误:", error);
		throw error; // 将错误继续向上抛出，以便UI可以捕获并显示
	}
}
