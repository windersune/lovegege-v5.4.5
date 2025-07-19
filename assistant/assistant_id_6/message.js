// 文件: message.js (用于Dify)
// [最终微调适配版]

import { getDifyChatResponse } from './config.js';

// 维护当前对话ID，保持不变
let currentConversationId = null;

export async function getResponse(messages) {
	// 1. 从消息历史中安全地找出最新的用户消息
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	// 如果找不到用户消息，直接返回提示，避免后续错误
	if (!latestUserMessage || !latestUserMessage.content) {
		return (async function* () {
			yield { choices: [{ delta: { content: "抱歉，我没有收到任何消息内容。" } }] };
		})();
	}

	// 2. 初始化将要传递给API的变量
	let userQuery = '';
	let imageBase64 = null; // 用于存储从UI传来的Base64图片数据

	// 3. 【核心适配逻辑】解析来自UI的 content 字段
	const { content } = latestUserMessage;
	if (typeof content === 'string') {
		// a) 如果 content 是字符串，说明是纯文本消息
		userQuery = content;
	} else if (Array.isArray(content)) {
		// b) 如果 content 是数组，说明是多模态消息（包含文本和/或图片）
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text; // 提取文本
			}
			// c) 【精确匹配】查找您UI定义的图片字段
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
				// 提取Data URL (e.g., "data:image/png;base64,iVBOR...") 中逗号之后的部分
				imageBase64 = part.image_url.url.split(',')[1];
			}
		}
	}

	console.log(`[Dify] 准备发送给API -> 文本: "${userQuery}" | 是否有图: ${!!imageBase64}`);
	console.log(`[Dify] 当前对话ID: ${currentConversationId}`);

	// 4. 使用异步生成器将API调用结果包装起来，以兼容UI的流式显示
	const streamAsync = async function* () {
		try {
			// 调用config中的函数，并传递解析好的文本和图片数据
			const result = await getDifyChatResponse(userQuery, imageBase64, currentConversationId);

			// 更新会话ID以备下次连续对话使用
			if (result && result.conversationId) {
				currentConversationId = result.conversationId;
				console.log(`[Dify] 已更新会话ID: ${currentConversationId}`);
			}
			
			// 准备最终要显示的答案
			const answer = (result && result.answer) ? result.answer : "（本次回复为空）";
			
			// 以UI期望的格式返回最终答案
			yield {
				choices: [{
					delta: { content: answer }
				}]
			};

		} catch (error) {
			// 如果API调用出错，将详细错误信息显示在聊天窗口
			console.error(`[Dify] API调用出错: ${error.message}`);
			yield {
				choices: [{
					delta: { content: `[Dify API 错误] ${error.message}` }
				}]
			};
		}
	};
	
	return streamAsync();
}
