import { loadConfig } from './config.js'
// 【新】: 引入 @gradio/client 库
import { client } from "https://esm.sh/@gradio/client";

/**
 * [核心重构] 使用 @gradio/client 和 for-await-of 循环获取流式响应
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 产出包含增量内容({delta: {content: "..."}})的对象的异步生成器
 */
export async function* getResponse(messages) {
	// 加载包含正确 baseURL 的配置
	const config = loadConfig();

	// 1. 提取最后一条用户消息作为 prompt (逻辑保持不变)
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
    
    // 用于存储上一次的完整回复，以便计算增量
    let lastFullReply = "";

	try {
        // 2. 连接到您的应用根地址
		const app = await client(config.baseURL);

        // 3. 提交任务到 /chat API，获取异步可迭代的 job 对象
        //    参数必须是数组，按顺序对应Python函数的参数
		const job = app.submit('/chat', [
			promptText,
			[] // 此处传入空数组作为 history
		]);

        // 4. 【最终正确逻辑】: 使用 for await...of 循环来处理异步流
		for await (const chunk of job) {
            // chunk 的标准结构是 { data: ["完整的回复..."] }
			const currentFullReply = chunk.data[0];
            
            // 5. 计算本次新增的文本 (delta)
            const delta = currentFullReply.substring(lastFullReply.length);
            lastFullReply = currentFullReply; // 更新记录

            if (delta) {
                // 6. 将增量文本包装成UI兼容的格式并产出
                yield {
                    choices: [{
                        delta: {
                            content: delta
                        }
                    }]
                };
            }
		}

	} catch (error) {
		console.error("Gradio API 调用失败:", error);
		// 将错误格式化并向上抛出，让UI可以捕获并显示
        const errorMessage = `API 调用出错: ${error.message}`;
        yield {
            choices: [{
                delta: {
                    content: errorMessage
                }
            }]
        };
		throw new Error(errorMessage);
	}
}
