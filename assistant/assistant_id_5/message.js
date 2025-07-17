// --- START OF MODIFIED message.js ---

import { loadConfig } from './config.js'

/**
 * 模拟一个异步生成器，它只产生单个值。
 * 这用于将一次性返回的API结果包装成与流式API相似的格式，
 * 以便你的UI代码可以（可能）用类似的方式处理。
 * @param {any} finalData - 最终要传递的数据
 */
async function* createSingleValueStream(finalData) {
    yield finalData;
}

export async function getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 从消息历史中获取最新的用户消息
	// Gradio示例只处理单次对话，所以我们取最后一条
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("消息历史中没有找到用户消息。");
	}

	// ---------------------------------------------------------------
	// 【关键】构建符合 Gradio API 要求的请求体
	// 这是一个包含 "data" 键的JSON对象，"data"是一个数组。
	// 数组中参数的【顺序】必须和Gradio接口中定义的输入组件顺序完全一致！
	// ---------------------------------------------------------------
	const requestBody = {
		"data": [
			lastUserMessage.content,     // 对应 python 示例中的 `message`
			config.system_message,       // 对应 python 示例中的 `system_message`
			config.max_tokens,           // 对应 python 示例中的 `max_tokens`
			Number(config.temperature),  // 对应 python 示例中的 `temperature`
			Number(config.top_p),        // 对应 python 示例中的 `top_p`
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

	// Gradio API 返回一个包含结果的JSON对象，而不是流
	const jsonResponse = await response.json();

	// 从返回的JSON中提取模型生成的内容
	// 通常，结果在 `data` 数组的第一个元素中
	const modelOutput = jsonResponse.data && jsonResponse.data[0] ? jsonResponse.data[0] : '';
	
	// 【重要】因为API不是流式的，我们模拟一个只返回一次的“伪流”
	// 这样你的UI代码可能不需要做太大改动。
	// 我们将最终结果包装成类似OpenAI的格式。
	const finalStreamChunk = {
		choices: [{
			delta: {
				content: modelOutput
			}
		}]
	};

	return createSingleValueStream(finalStreamChunk);
}


// --- END OF MODIFIED message.js ---
