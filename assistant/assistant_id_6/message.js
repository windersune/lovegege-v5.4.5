import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

// 维护对话ID
let currentConversationId = null;

/**
 * 一个帮助函数，将Data URL (Base64) 转换为 File 对象
 * @param {string} dataUrl - 包含MIME类型和Base64数据的完整Data URL
 * @param {string} filename - 要创建的文件的名称
 * @returns {File} - 转换后的 File 对象
 */
function dataURLtoFile(dataUrl, filename) {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('无法从Data URL中解析MIME类型');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}


/**
 * 编排文件上传和流式聊天，能正确处理前端发来的Data URL
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator}
 */
export async function* getResponse(messages) {
	const latestUserMessage = messages.findLast(msg => msg.role === 'user');

	if (!latestUserMessage || !latestUserMessage.content) {
		yield { choices: [{ delta: { content: "抱歉，没有收到任何有效消息。" } }] };
		return;
	}

	let userQuery = '';
	let fileToUpload = null; // 目标是填充这个 File 对象
	const { content } = latestUserMessage;

	if (typeof content === 'string') {
		userQuery = content;
	} else if (Array.isArray(content)) {
		for (const part of content) {
			if (part.type === 'text') {
				userQuery = part.text;
			}
			// 【核心修正】: 识别前端的 'image_url' 类型并进行转换
			if (part.type === 'image_url' && part.image_url && part.image_url.url) {
                console.log("[Dify] 检测到 'image_url' 格式，正在转换为File对象...");
				try {
                    // 使用帮助函数将 data: URL 转换为 File 对象
                    fileToUpload = dataURLtoFile(part.image_url.url, "uploaded_image.png");
				} catch (e) {
                    console.error("[Dify] Data URL 转换失败:", e);
                    // 可以在这里向用户返回一个错误
                }
			}
		}
	}

	let fileId = null;

	try {
        // ===================================================================
        // 步骤一: 如果成功转换出文件，就上传它
        // ===================================================================
        if (fileToUpload) {
            console.log("[Dify] File对象转换成功，开始上传...");
            fileId = await uploadFileToDify(fileToUpload); // config.js 中的函数可以保持不变
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId}`);
        } else {
            console.log("[Dify] 本次消息中不包含有效文件。");
        }

        // ===================================================================
        // 步骤二: 调用聊天API
        // ===================================================================
        console.log(`[Dify] 调用聊天API -> 文本: "${userQuery}" | 文件ID: ${fileId} | 对话ID: ${currentConversationId}`);
        const stream = getDifyChatResponseAsStream(userQuery, fileId, currentConversationId);

        // 后续逻辑保持不变...
        for await (const chunk of stream) {
            const contentChunk = chunk.answer; 
            if (contentChunk) {
                yield { choices: [{ delta: { content: contentChunk } }] };
            }
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }
        console.log(`[Dify] 流式传输结束。最终会话ID更新为: ${currentConversationId}`);

	} catch (error) {
		console.error(`[Dify] 端到端流程出错: ${error.message}`);
		yield {
			choices: [{
				delta: { content: `\n\n[Dify API 调用错误]: ${error.message}` }
			}]
		};
	}
}
