import { loadConfig } from './config.js'

export async function getResponse(messages) {
	const config = loadConfig();
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();

	console.log("【调试】准备发送请求到:", config.baseURL);

	const requestBody = {
		data: [
			lastUserMessage.content,
			config.system_message,
			Number(config.max_tokens),
			Number(config.temperature),
			Number(config.top_p),
		],
	};
    
    console.log("【调试】请求体 (Request Body):", JSON.stringify(requestBody));

	try {
		const response = await fetch(config.baseURL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requestBody),
		});

        console.log("【调试】收到响应状态码:", response.status);
        const responseData = await response.json();
		console.log("【调试】收到响应数据:", responseData);
        
        // 为了让前端能动，我们返回一个模拟的生成器
		async function* finalResponse() {
            yield { content: responseData.data[0] || "调试成功，但无内容" };
        }
        return finalResponse();

	} catch (error) {
		console.error("【调试】Fetch 请求彻底失败:", error);
        // 返回一个显示错误的生成器
        async function* errorResponse() {
            yield { content: "请求失败，请看控制台【调试】信息" };
        }
        return errorResponse();
	}
}
