// --- START OF FILE message.js ---

import { loadConfig } from './config.js'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. [删除] 不再需要 createStreamReader 函数，因为后端是非流式的。

// 2. [重构] getResponse 函数，以适配您的自定义后端
export async function* getResponse(messages) {
	// 加载包含所有参数的完整配置
	const config = loadConfig();

	// 3. [修改] 从消息历史中提取最后一条用户消息
	//    您的后端只接收最后一条用户消息，而不是整个历史记录
	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	if (!lastUserMessage || typeof lastUserMessage.content !== 'string') {
		// 如果没有找到有效的用户消息，则抛出错误或返回空
		throw new Error('未找到有效的用户输入或输入格式不正确（不支持图片）。');
	}

	// 4. [修改] 构建符合您后端 API 要求的请求体
	//    字段名必须与您 FastAPI 函数中的 .get() 调用完全一致
	const requestBody = {
		message: lastUserMessage.content,          // 单个字符串
		system_message: config.systemPrompt,       // 来自配置的系统提示
		
		// 数值型参数
		temperature: Number(config.temperature),
		top_p: Number(config.top_p),
		max_tokens: parseInt(config.max_tokens, 10),
	};
	
	// 5. [修改] 发送 fetch 请求，并处理非流式响应
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

	// 6. [修改] 将一次性收到的完整文本包装成模拟的流式数据块
	//    这是为了与前端其他部分（调用 getResponse 的代码）保持兼容
	const fullText = await response.text();
	
	// 模拟 OpenAI 流式响应的格式，将完整文本一次性 yield 出去
	yield {
		choices: [{
			delta: {
				content: fullText
			}
		}]
	};
	
	// 生成器结束
	return;
}
