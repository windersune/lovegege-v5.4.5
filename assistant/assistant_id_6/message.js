// 1. 从config.js中导入两个独立的函数
import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

// 2. 维护当前对话ID，以支持上下文连续性
let currentConversationId = null;

/**
 * [最终正确版] 编排文件上传和流式聊天，并正确传递完整Data URL。
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 产出包含内容增量({delta: {content: "..."}})的对象的异步生成器
 */
export async function* getResponse(messages) {
	// 3. 从消息历史中安全地找出最新的用户消息
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	if (!latestUserMessage || !latestUserMessage.content) {
		return (async function* () {
			yield { choices: [{ delta: { content: "抱歉，我没有收到任何消息内容。" } }] };
		})();
	}

	// 4. 解析来自UI的 content 字段，提取文本和图片
	let userQuery = '';
    // 【核心修正】: 使用更准确的变量名，并准备接收完整的Data URL
	let imageDataUrl = null; 
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text;
			}
			// 【核心修正】: 直接获取完整的 part.image_url.url
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
				imageDataUrl = part.image_url.url; 
			}
		}
	}
	
	let fileId = null;

	try {
        // ===================================================================
        // 步骤一 - 如果有图片，调用上传API
        // ===================================================================
        if (imageDataUrl) {
            console.log("[Dify] 检测到图片，开始上传...");
            // 【核心修正】: 将完整的 imageDataUrl 传递给上传函数
            fileId = await uploadFileToDify(imageDataUrl);
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId}`);
        }

        // ===================================================================
        // 步骤二 - 调用聊天API
        // ===================================================================
        console.log(`[Dify] 开始调用聊天API -> 文本: "${userQuery}" | 文件ID: ${fileId} | 对话ID: ${currentConversationId}`);
        const stream = getDifyChatResponseAsStream(userQuery, fileId, currentConversationId);

        // 7. 使用 for await...of 循环消费聊天数据流 (逻辑不变)
        for await (const chunk of stream) {
            const contentChunk = chunk.answer; 
            
            if (contentChunk) {
                yield {
                    choices: [{
                        delta: { content: contentChunk }
                    }]
                };
            }
            
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }

        console.log(`[Dify] 流式传输结束。最终会话ID已更新为: ${currentConversationId}`);

	} catch (error) {
		console.error(`[Dify] 完整流程出错: ${error.message}`);
		yield {
			choices: [{
				delta: { content: `\n\n[Dify API 错误] ${error.message}` }
			}]
		};
	}
}
