// --- message.js ---

import { loadConfig } from './config.js'

/**
 * 模拟流式读取器
 * Gradio API 一次性返回完整数据，此函数将其分解为小块，
 * 以便前端可以像处理真实流一样实现打字机效果。
 * @param {string} fullText - 从API获取到的完整回复文本
 */
async function* simulateStreamReader(fullText) {
	// 将文本拆分成单个字符，模拟打字效果
	const chunks = fullText.split('');
	
	for (const chunk of chunks) {
		// 模拟OpenAI流的格式，以免破坏现有UI逻辑
		const responseChunk = {
			choices: [{
				delta: {
					content: chunk
				}
			}]
		};
		yield responseChunk;
		
		// 在每个字符之间添加一个微小的延迟，让效果更平滑
		await new Promise(resolve => setTimeout(resolve, 5));
	}
}


export async function getResponse(messages) {
	// 加载包含你的Space URL的配置
	const config = loadConfig();

	if (!config.baseURL) {
		throw new Error("Hugging Face Space URL未配置，请在设置中检查。");
	}

	// --- 【核心逻辑】数据格式转换 ---
	// Gradio API 需要 (message, history) 两个参数
	
	// 1. 从消息数组中提取出最后一条用户消息
	const currentUserMessage = messages[messages.length - 1].content;
	
	// 2. 将剩余的消息转换为Gradio需要的history格式
	//    格式: [[user_msg_1, assistant_msg_1], [user_msg_2, assistant_msg_2], ...]
	const gradioHistory = [];
	const historyMessages = messages.slice(0, -1);
	
	for (let i = 0; i < historyMessages.length; i += 2) {
		// 确保我们成对处理用户和助手的消息
		if (historyMessages[i].role === 'user' && historyMessages[i+1]?.role === 'assistant') {
			gradioHistory.push([
				historyMessages[i].content,
				historyMessages[i+1].content
			]);
		}
	}
	
	// 3. 构建请求体
	//    注意：格式与你之前的OpenAI格式完全不同
	const requestBody = {
		"data": [
			currentUserMessage, // 参数1: message (字符串)
			gradioHistory       // 参数2: history (数组)
		]
	};

	// 4. 发起API请求
	//    请求的端点是 /run/predict
	const response = await fetch(`${config.baseURL}/run/predict`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		throw new Error(`对Gradio API的请求失败: ${response.status} ${errorData}`);
	}

	const result = await response.json();
	
	// 从返回的JSON中提取模型的回复文本
	// Gradio的返回格式是 {"data": ["模型的回复在这里"], ...}
	const modelResponseText = result.data[0];

	// 返回一个模拟的流式读取器，让UI可以逐字显示回复
	return simulateStreamReader(modelResponseText);
}
