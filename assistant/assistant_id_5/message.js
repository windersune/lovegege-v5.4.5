import { loadConfig } from './config.js'
// 引入 @gradio/client 库
import { client } from "https://esm.sh/@gradio/client";

/**
 * [最终确认的逻辑] 使用 @gradio/client，通过计算增量(delta)实现流式“打字机”效果。
 * @param {Array<Object>} messages - 聊天历史记录
 * @returns {AsyncGenerator} - 产出包含增量内容({delta: {content: "..."}})的对象的异步生成器
 */
export async function* getResponse(messages) {
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
    
    // 2. [核心] 创建一个“记忆”变量，用来存储上一次接收到的完整回复
    let lastFullReply = "";

	try {
        // 3. 连接到您的应用根地址
		const app = await client(config.baseURL);

        // 4. 提交任务到 /chat API，获取异步可迭代的 job 对象
		const job = app.submit('/chat', [
			promptText,
			[] // 此处传入空数组作为 history
		]);

        // 5. 使用 for await...of 循环来处理异步流
		for await (const chunk of job) {
            // 从数据块中提取出当前时刻的完整回复
			const currentFullReply = chunk.data[0];
            
            // 6. [核心] 计算本次新增的文本 (delta)
            //    用当前的完整回复，减去(substring)我们“记忆”中的上一段回复
            const delta = currentFullReply.substring(lastFullReply.length);
            
            // 7. [核心] 更新“记忆”，为下一次计算做准备
            lastFullReply = currentFullReply;

            // 8. 如果计算出了新的内容 (delta不为空)
            if (delta) {
                // 就只将这个新增的部分包装成UI兼容的格式并产出
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
