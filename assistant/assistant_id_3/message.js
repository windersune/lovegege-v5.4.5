// message.js - 带终极调试日志
import { loadConfig, hasValidConfig } from './config.js'

async function* createStreamReader(reader) {
	const decoder = new TextDecoder();
	let buffer = '';
    console.log('[DEBUG] createStreamReader: Starting to read from stream...');
	
	while (true) {
		const { value, done } = await reader.read();
		if (done) {
            console.log('[DEBUG] createStreamReader: Stream has finished.');
			break;
        }

        const rawChunk = decoder.decode(value, { stream: true });
		console.log('[RAW STREAM DEBUG] Received Data Chunk:', rawChunk);
		
		buffer += rawChunk;
		const lines = buffer.split('\n');
		buffer = lines.pop() || '';
		
		for (const line of lines) {
			if (line.trim().startsWith('data: ')) {
				try {
					const json = JSON.parse(line.trim().slice(6));
                    
					if (json.event === 'message' && json.message && json.message.type === 'answer' && typeof json.message.content === 'string') {
						const formattedJson = { choices: [{ delta: { content: json.message.content } }] };
						yield formattedJson;
					} else if (json.event === 'error') {
                        console.error('Coze API Stream Error Event:', json);
                        throw new Error(`Coze API Error: ${json.error.message}`);
                    }
				} catch (e) {}
			}
		}
	}
}

export async function getResponse(messages) {
    console.log('[DEBUG] --- getResponse function started ---');
    try {
        const config = loadConfig();
        console.log('[DEBUG] Loaded config:', config);
        if (!hasValidConfig(config)) {
            console.error('[DEBUG] 配置无效! Token 或 Bot ID 为空。');
            throw new Error('配置无效: 请在设置中填写您的 Personal Access Token 和 Bot ID。');
        }
        console.log('[DEBUG] Config is valid.');
        const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
        if (!lastUserMessage) { throw new Error('没有找到用户消息。'); }
        const chatHistory = messages.slice(0, messages.length - 1).filter(msg => (msg.role === 'user' || msg.role === 'assistant') && msg.content).map(msg => ({ role: msg.role, content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || ''), }));
        const requestBody = { bot_id: config.bot_id, user: config.user_id, query: typeof lastUserMessage.content === 'string' ? lastUserMessage.content : (lastUserMessage.content[0]?.text || ''), chat_history: chatHistory, stream: true, };
        console.log('[DEBUG] Preparing to send request with body:', JSON.stringify(requestBody, null, 2));
        
        console.log('[DEBUG] Sending fetch request to:', config.baseURL);
        const response = await fetch(config.baseURL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.token}`, }, body: JSON.stringify(requestBody), });
        console.log('[DEBUG] Received fetch response header.');

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] API请求失败: ${response.status}`, errorText);
            throw new Error(`API请求失败: ${response.status} - ${errorText}`);
        }
        console.log('[DEBUG] Response is OK (200). Creating stream reader.');
        const reader = response.body.getReader();
        return createStreamReader(reader);
    } catch (error) {
        console.error('[DEBUG] --- Catched an error in getResponse ---', error);
        throw error;
    }
}
