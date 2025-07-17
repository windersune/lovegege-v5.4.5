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
	//   构建一个符合 Gradio 底层协议的、包含 fn_index 和 data 的请求体
	// ==================================================================
	const requestBody = {
        // 在您当前的 app.py 中，api_interface 是第二个被定义的，
        // 它的函数在内部的索引通常是 1。
        // （第一个是 ui_interface 的函数，索引为 0）
		fn_index: 1, 
		data: [
			lastUserMessage.content,
			config.system_message,
			Number(config.max_tokens),
			Number(config.temperature),
			Number(config.top_p),
		]
	};

	try {
		const response = await fetch(config.baseURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		});

		const responseText = await response.text();

		if (!response.ok) {
			console.error("服务器返回错误:", responseText);
			throw new Error(`API请求失败: ${response.status} ${responseText}`);
		}
		
		const jsonResponse = JSON.parse(responseText);
        
        // 返回的数据在 .data 字段中，它是一个数组
		const outputContent = jsonResponse.data[0];

		// 模拟流式返回给UI
		async function* createSingleResponse() {
			yield { content: outputContent };
		}
		return createSingleResponse();

	} catch (error) {
		console.error("在 getResponse 函数中捕获到严重错误:", error);
		throw error;
	}
}
