// 文件: message.js (用于Dify)
// [最终流式版]

// 1. 导入新的、支持流式的API调用函数
import { getDifyChatResponseAsStream } from './config.js';

// 2. 维护当前对话ID，保持上下文连续性
let currentConversationId = null;

/**
 * [最终流式版] 调用Dify的流式API，并以增量方式产出回复内容。
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 产出包含内容增量({delta: {content: "..."}})的对象的异步生成器
 */
export async function* getResponse(messages) {
	// 3. 从消息历史中安全地找出最新的用户消息 (逻辑不变)
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	if (!latestUserMessage || !latestUserMessage.content) {
		return (async function* () {
			yield { choices: [{ delta: { content: "抱歉，我没有收到任何消息内容。" } }] };
		})();
	}

	// 4. 解析来自UI的 content 字段，提取文本和图片 (逻辑不变)
	let userQuery = '';
	let imageBase64 = null;
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text;
			}
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
				imageBase64 = part.image_url.url.split(',')[1];
			}
		}
	}
	
	// 控制台日志，方便调试
	console.log(`[Dify] 准备流式发送 -> 文本: "${userQuery}" | 是否有图: ${!!imageBase64}`);
	console.log(`[Dify] 当前对话ID: ${currentConversationId}`);

	try {
        // 5. 【核心改动】调用新的流式函数，它返回一个可供迭代的流 (stream)
        const stream = getDifyChatResponseAsStream(userQuery, imageBase64, currentConversationId);

        // 6. 【核心改动】使用 for await...of 循环来消费这个流
        for await (const chunk of stream) {
            // Dify 流式响应中，增量内容通常在 chunk.answer 字段中
            const contentChunk = chunk.answer; 
            
            // 7. 确保有内容才产出，避免空delta
            if (contentChunk) {
                // 将每一个内容增量包装成UI期望的格式并产出
                yield {
                    choices: [{
                        delta: { content: contentChunk }
                    }]
                };
            }
            
            // 8. 在流的过程中，持续更新会话ID
            //    Dify 的流通常在每个数据块里都包含 conversation_id
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }

        console.log(`[Dify] 流式传输结束。最终会话ID: ${currentConversationId}`);

	} catch (error) {
		// 如果在API调用或流处理过程中出错，将详细错误信息显示在聊天窗口
		console.error(`[Dify] 流式API调用出错: ${error.message}`);
		yield {
			choices: [{
				delta: { content: `\n\n[Dify API 错误] ${error.message}` }
			}]
		};
	}
}
