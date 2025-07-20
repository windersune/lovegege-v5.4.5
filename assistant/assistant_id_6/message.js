// message.js

// 1. 从重构后的 config.js 中导入函数
import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

// 2. 维护对话ID以支持上下文
let currentConversationId = null;

/**
 * 编排文件上传和流式聊天。
 * @param {Array<Object>} messages - 聊天历史记录。
 *   - 对于图文消息，期望的 content 格式为:
 *     [{type: 'text', text: '...'}, {type: 'image', file: File}]
 * @returns {AsyncGenerator} - 返回符合标准AI聊天UI库格式的数据块。
 */
export async function* getResponse(messages) {
	// 3. 找到最新的用户消息
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	if (!latestUserMessage || !latestUserMessage.content) {
		// 返回一个空的或提示性的消息
		yield { choices: [{ delta: { content: "抱歉，没有收到任何有效消息。" } }] };
		return;
	}

	// 4. 从消息体中解析出文本和 File 对象
	let userQuery = '';
	let fileToUpload = null; // 用于存储待上传的 File 对象
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text;
			}
			// 直接从消息中获取 File 对象
			if (part.type === 'image' && part.file instanceof File) {
				fileToUpload = part.file;
			}
		}
	}

	let fileId = null;

	try {
        // ===================================================================
        // 步骤一: 如果有文件，调用新的上传函数
        // ===================================================================
        if (fileToUpload) {
            console.log("[Dify] 检测到文件对象，开始上传...");
            fileId = await uploadFileToDify(fileToUpload); // 传递 File 对象
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId}`);
        }

        // ===================================================================
        // 步骤二: 调用聊天API，无论是否有文件
        // ===================================================================
        console.log(`[Dify] 调用聊天API -> 文本: "${userQuery}" | 文件ID: ${fileId} | 对话ID: ${currentConversationId}`);
        const stream = getDifyChatResponseAsStream(userQuery, fileId, currentConversationId);

        // 7. 消费流式响应，并更新对话ID
        for await (const chunk of stream) {
            // 假设Dify流返回的数据结构中有 answer 字段
            const contentChunk = chunk.answer; 
            
            if (contentChunk) {
                // 产出符合通用UI库的数据格式
                yield {
                    choices: [{ delta: { content: contentChunk } }]
                };
            }
            
            // 在流式响应的事件中，持续更新会话ID
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }

        console.log(`[Dify] 流式传输结束。最终会话ID更新为: ${currentConversationId}`);

	} catch (error) {
		console.error(`[Dify] 端到端流程出错: ${error.message}`);
		// 以同样的数据格式返回错误信息，以便UI能够展示
		yield {
			choices: [{
				delta: { content: `\n\n[Dify API 调用错误]: ${error.message}` }
			}]
		};
	}
}
