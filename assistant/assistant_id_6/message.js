import { uploadFileToDify, getDifyChatResponseAsStream } from './config.js';

let currentConversationId = null;

export async function* getResponse(messages) {
	// ... 解析 messages 以获取 userQuery 和 imageBase64 的逻辑不变 ...

    let fileId = null; // 用于存储上传后的文件ID

	try {
        // 【核心修正】: 步骤一 - 如果有图片，先执行上传
        if (imageBase64) {
            console.log("[Dify] 检测到图片，开始上传...");
            fileId = await uploadFileToDify(imageBase64);
            console.log(`[Dify] 文件上传成功，获得File ID: ${fileId}`);
        }

        // 【核心修正】: 步骤二 - 调用聊天API，并传递获取到的 fileId
        const stream = getDifyChatResponseAsStream(userQuery, fileId, currentConversationId);


        // 6. 使用 for await...of 循环来消费这个流 (逻辑不变)
        for await (const chunk of stream) {
            // Dify 流式响应中，增量内容在 chunk.answer 字段中
            const contentChunk = chunk.answer; 
            
            if (contentChunk) {
                // 将每一个内容增量包装成UI期望的格式并产出
                yield {
                    choices: [{
                        delta: { content: contentChunk }
                    }]
                };
            }
            
            // 7. 【核心修正】: 在流的过程中，用服务器返回的ID，持续更新我们的全局变量
            //    这样下一次调用 getResponse 时，就会使用这个新的ID
            if (chunk.conversation_id) {
                currentConversationId = chunk.conversation_id;
            }
        }

        console.log(`[Dify] 流式传输结束。最终会话ID已更新为: ${currentConversationId}`);

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
