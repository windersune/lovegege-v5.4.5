import { loadConfig } from './config.js'

/**
 * [核心修改] 完全按照能正常工作的HTML示例，获取API响应。
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 产出单个包含完整回复的对象的异步生成器
 */
export async function getResponse(messages) {
	// 加载包含正确 baseURL 的配置
	const config = loadConfig();

	// 1. 提取最后一条用户消息作为 prompt
	const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
	if (!lastUserMessage) {
		throw new Error("消息历史中没有找到用户消息。");
	}

	const promptText = typeof lastUserMessage.content === 'string' 
		? lastUserMessage.content 
		: lastUserMessage.content.find(p => p.type === 'text')?.text || '';

	if (!promptText) {
		throw new Error("无法从最后一条用户消息中提取文本内容。");
	}

	// 2. [重要] 构建与HTML示例完全一致的请求体
	const requestBody = {
		"fn_index": 0,
		"data": [
			promptText
		],
		"session_hash": "a" + Math.random().toString(36).substring(2)
	};
    
	// 3. 使用异步生成器，以便返回一个符合UI预期的对象
	return (async function*() {
		try {
			// 4. 发起 fetch 请求
			const response = await fetch(config.baseURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`服务器错误: ${response.status}. 响应: ${errorText}`);
			}

			// 5. [重要] 等待并解析完整的JSON响应，而不是流式读取
			const result = await response.json();

			// 6. 从返回的JSON中提取回复
            //    根据HTML示例，回复在 result.data 数组的第一个元素
			const modelReply = result.data[0];

            if (typeof modelReply === 'undefined') {
                console.error("服务器返回的完整JSON:", result);
                throw new Error("从服务器返回的数据中找不到有效的回复 (result.data[0] is undefined)。");
            }

			// 7. 将完整的回复包装成UI兼容的格式并产出一次
			yield {
				choices: [{
					delta: {
						content: modelReply
					}
				}]
			};

		} catch (error) {
			console.error("API 调用失败:", error);
			throw error; // 将错误向上抛出，让UI可以捕获
		}
	})();
}
