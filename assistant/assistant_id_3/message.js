import { loadConfig, hasValidConfig } from './config.js'

// createStreamReader 函数与上一版相同，包含了格式转换逻辑
async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';
	
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';
		
		for (const line of lines) {
			if (line.trim().startsWith('data: ')) {
				try {
					const json = JSON.parse(line.trim().slice(6));
                    
					if (json.event === 'message' && json.message && json.message.content) {
						const formattedJson = {
							choices: [{ delta: { content: json.message.content } }]
						};
                        // console.log('[DEBUG] Yielding formatted data chunk:', formattedJson); // 可以取消注释看每个数据块
						yield formattedJson;
					} else if (json.event === 'error') {
                        console.error('[DEBUG] Coze API Stream Error:', json);
                        throw new Error(`Coze API Error: ${json.error.message}`);
                    }

				} catch (e) {
					console.error('[DEBUG] 解析或转换SSE数据出错:', e);
				}
			}
		}
	}
}


/**
 * 【终极调试版】
 * 发送消息到 Coze API 并获取流式响应
 * @param {Array<object>} messages - 对话历史消息数组
 */
export async function getResponse(messages) {
    // ================== 新增的调试日志 ==================
    console.log('[DEBUG] --- getResponse function started ---');

    try {
        const config = loadConfig();
        console.log('[DEBUG] Loaded config:', config);

        // 1. 检查配置是否有效
        if (!hasValidConfig(config)) {
            console.error('[DEBUG] 配置无效! Token 或 Bot ID 为空。');
            throw new Error('配置无效: 请在设置中填写您的 Personal Access Token 和 Bot ID。');
        }
        console.log('[DEBUG] Config is valid.');

        // 2. 准备请求数据
        const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
        if (!lastUserMessage) {
            throw new Error('没有找到用户消息。');
        }

        const chatHistory = messages
            .slice(0, messages.length - 1)
            .filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content)
            .map(msg => ({
                role: msg.role,
                content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || ''),
            }));

        const requestBody = {
            bot_id: config.bot_id,
            user: config.user_id,
            query: typeof lastUserMessage.content === 'string' 
                   ? lastUserMessage.content 
                   : (lastUserMessage.content[0]?.text || ''),
            chat_history: chatHistory,
            stream: true,
        };
        console.log('[DEBUG] Preparing to send request with body:', JSON.stringify(requestBody, null, 2));

        // 3. 发送 fetch 请求
        console.log('[DEBUG] Sending fetch request to:', config.baseURL);
        const response = await fetch(config.baseURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`, 
            },
            body: JSON.stringify(requestBody),
        });
        console.log('[DEBUG] Received fetch response header.');

        // 4. 检查响应状态
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] API请求失败: ${response.status}`, errorText);
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        console.log('[DEBUG] Response is OK (200). Creating stream reader.');

        // 5. 返回流式读取器
        const reader = response.body.getReader();
        return createStreamReader(reader);

    } catch (error) {
        console.error('[DEBUG] --- Catched an error in getResponse ---', error);
        // 将错误向上抛出，以便UI层可以捕获它（如果UI有相应处理）
        throw error;
    }
}
