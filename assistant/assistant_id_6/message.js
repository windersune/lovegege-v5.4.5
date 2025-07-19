// File: message.js
// [最终版] 已适配非流式（blocking）模式

// [核心修改] 导入新的非流式函数
import { getDifyChatResponse } from './config.js'; 

// 维护当前对话ID
let currentConversationId = null;

// [核心修改] getResponse函数已大幅简化
export async function getResponse(messages) {
	let userMessage = '';
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') {
			userMessage = messages[i].content;
			break;
		}
	}
	
	console.log(`[MESSAGE] 开始处理用户消息: ${userMessage}`);
	console.log(`[MESSAGE] 当前对话ID: ${currentConversationId}`);
	
	// 返回一个异步生成器，以兼容UI的期望
	const streamAsync = async function* () {
		try {
			// 直接调用新的非流式函数，并等待完整结果
			const result = await getDifyChatResponse(userMessage, currentConversationId);
			
			// 更新会话ID以备下次使用
			if (result && result.conversationId) {
				currentConversationId = result.conversationId;
				console.log(`[MESSAGE] 已更新会话ID为: ${currentConversationId}`);
			}
			
			// 检查是否有有效回复
			if (result && result.answer) {
				// 将完整回复一次性yield出去
				yield {
					choices: [{
						delta: {
							content: result.answer
						}
					}]
				};
			} else {
				// 如果Dify返回的answer是空的，给出一个提示
				const emptyReply = "（智能助手本次没有返回任何内容）";
				yield {
					choices: [{
						delta: {
							content: emptyReply
						}
					}]
				};
			}
			
		} catch (error) {
			// 如果API调用出错，将错误信息显示在聊天窗口
			console.error(`[MESSAGE] 处理异常: ${error.message}`);
			yield {
				choices: [{
					delta: {
						content: `处理过程中出现错误: ${error.message}`
					}
				}]
			};
		}
	};
	
	return streamAsync();
}
