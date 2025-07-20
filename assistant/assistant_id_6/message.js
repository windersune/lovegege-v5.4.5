import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

let currentConversationId = null;

export async function* getResponse(messages) {
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');
	if (!latestUserMessage || !latestUserMessage.content) { /* ... */ }

	let userQuery = '';
	let imageDataUrl = null;
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') userQuery = part.text;
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
				imageDataUrl = part.image_url.url; 
			}
		}
	}
	
	try {
        let finalMessages = [];

        if (imageDataUrl) {
            console.log("[Dify] 检测到图片，开始上传...");
            const fileId = await uploadFileToDify(imageDataUrl);
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId}`);

            // 【核心变更】: 构建Dify多模态消息格式
            finalMessages.push({
                "role": "user",
                "content": userQuery,
                "files": [
                    {
                        "type": "image",
                        "transfer_method": "remote_url", // 使用 remote_url
                        "upload_file_id": fileId // 并提供 ID
                    }
                ]
            });

        } else {
            // 如果没有图片，就是简单的文本消息
            finalMessages.push({ "role": "user", "content": userQuery });
        }

        console.log(`[Dify] 开始调用聊天API -> 对话ID: ${currentConversationId}`);
        // 【核心变更】: 将构建好的 finalMessages 数组传递过去
        const stream = getDifyChatResponseAsStream(finalMessages, currentConversationId);

        for await (const chunk of stream) {
            if (chunk.answer) {
                yield { choices: [{ delta: { content: chunk.answer } }] };
            }
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }
	} catch (error) {
		console.error(`[Dify] 完整流程出错: ${error.message}`);
		yield { choices: [{ delta: { content: `\n\n[Dify API 错误] ${error.message}` } }] };
	}
}
