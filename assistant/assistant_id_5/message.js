import { loadConfig } from './config.js'

// [最终正确版本]
export async function getResponse(messages) {
	// 1. 加载配置
	const config = loadConfig();
	console.log("【步骤1】加载的配置:", config);

	// 2. 获取最新用户消息
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("没有找到可以发送的用户消息。");
	}
	console.log("【步骤2】获取的用户消息:", lastUserMessage.content);

	// ==================================================================
	//                        【最核心的修改】
	//   构建一个符合 Gradio 底层HTTP标准的、包含 data 数组的请求体
	//   参数的顺序必须和官网示例函数定义的顺序完全一致
	// ==================================================================
	const requestBody = {
		data: [
			lastUserMessage.content,     // 对应 "message"
			config.system_message,       // 对应 "system_message"
			Number(config.max_tokens),   // 对应 "max_tokens"
			Number(config.temperature),  // 对应 "temperature"
			Number(config.top_p),        // 对应 "top_p"
		]
	};
	console.log("【步骤3】构建的最终请求体 (Request Body):", JSON.stringify(requestBody));

	try {
		const response = await fetch(config.baseURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		});

		console.log("【步骤4】收到的原始响应 (Response):", response);
		
		const responseText = await response.text();
		console.log("【步骤5】收到的原始响应文本 (Raw Text):", responseText);

		if (!response.ok) {
			throw new Error(`API请求失败: ${response.status} ${responseText}`);
		}

		// 6. 解析JSON
		const jsonResponse = JSON.parse(responseText);
		console.log("【步骤6】解析后的JSON数据:", jsonResponse);

		const outputContent = jsonResponse.data[0];

		// 7. 模拟流式返回给UI
		async function* createSingleResponse() {
			yield { content: outputContent };
		}
		return createSingleResponse();

	} catch (error) {
		console.error("【捕获异常】在请求或处理过程中发生严重错误:", error);
		// 向上抛出异常，让UI显示错误信息
		throw error;
	}
}
