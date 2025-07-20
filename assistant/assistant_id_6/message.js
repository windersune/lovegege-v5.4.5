import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

let currentConversationId = null;

/**
 * [最终正确版] 编排文件上传和流式聊天
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator}
 */
export async function* getResponse(messages) {
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	if (!latestUserMessage || !latestUserMessage.content) {
		return (async function* () {
			yield { choices: [{ delta: { content: "抱歉，我没有收到任何消息内容。" } }] };
		})();
	}

	let userQuery = '';
	let imageDataUrl = null;
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text;
			}
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
				imageDataUrl = part.image_url.url; 
			}
		}
	}
	
	let fileId = null;

	try {
        if (imageDataUrl) {
            console.log("[Dify] 检测到图片，开始上传... (Image detected, starting upload...)");
            fileId = await uploadFileToDify(imageDataUrl);
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId} (File uploaded successfully, got File ID: ${fileId})`);
        }

        console.log(`[Dify] 开始调用聊天API -> 文本: "${userQuery}" | 文件ID: ${fileId} | 对话ID: ${currentConversationId}`);
        const stream = getDifyChatResponseAsStream(userQuery, fileId, currentConversationId);

        for await (const chunk of stream) {
            const contentChunk = chunk.answer; 
            
            if (contentChunk) {
                yield { choices: [{ delta: { content: contentChunk } }] };
            }
            
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }

        console.log(`[Dify] 流式传输结束。最终会话ID已更新为: ${currentConversationId}`);

	} catch (error) {
		console.error(`[Dify] 完整流程出错 (Error in the complete process): ${error.message}`);
		yield {
			choices: [{
				delta: { content: `\n\n[Dify API 错误] ${error.message}` }
			}]
		};
	}
}
