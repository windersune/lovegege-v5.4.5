// --- START OF FINAL message.js ---

import { loadConfig } from './config.js'

/**
 * 模拟一个只返回单个值的“伪流”，以适配现有UI逻辑。
 */
async function* createSingleValueStream(finalData) {
    yield finalData;
}

export async function getResponse(messages) {
	const config = loadConfig();

	// 获取最后一条用户消息作为输入
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("消息历史中没有找到用户消息。");
	}

	// 从最后一条用户消息中提取文本内容
	// 兼容消息内容是字符串或V4 vision格式的数组
	let userMessageText = '';
	if (typeof lastUserMessage.content === 'string') {
		userMessageText = lastUserMessage.content;
	} else if (Array.isArray(lastUserMessage.content)) {
		// 寻找第一个text类型的部分
		const textPart = lastUserMessage.content.find(p => p.type === 'text');
		if (textPart) {
			userMessageText = textPart.text;
		}
	}
	
	if (!userMessageText) {
		throw new Error("无法从最后一条用户消息中提取文本内容。");
	}

	// ---------------------------------------------------------------
	// 【关键】构建符合 Gradio API 要求的请求体
	// 参数的【顺序】必须和官方示例中定义的顺序一致。
	// ---------------------------------------------------------------
	const requestBody = {
		"data": [
			userMessageText,             // 对应官方示例的 `message`
			config.system_message,       // 对应官方示例的 `system_message`
			config.max_tokens,           // 对应官方示例的 `max_tokens`
			Number(config.temperature),  // 对应官方示例的 `temperature`
			Number(config.top_p),        // 对应官方示例的 `top_p`
		]
	};

	const response = await fetch(config.apiURL, {
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

	const jsonResponse = await response.json();
	
	// 从返回的JSON中提取模型生成的内容，通常在 `data` 数组的第一个元素
	const modelOutput = jsonResponse.data && Array.isArray(jsonResponse.data) && jsonResponse.data.length > 0
		? jsonResponse.data[0]
		: '';
	
	// 【重要】将一次性结果包装成类似OpenAI的流式格式，以便UI处理
	const finalStreamChunk = {
		choices: [{
			delta: {
				content: modelOutput
			}
		}]
	};

	return createSingleValueStream(finalStreamChunk);
}

// --- END OF FINAL message.js ---
