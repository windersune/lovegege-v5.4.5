import { loadConfig } from './config.js'

// 1. 简单调用
export async function getResponse(messages) {
	const config = loadConfig();
	const response = await fetch(config.baseURL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ messages }), // 将消息历史直接发给Worker
	});

	if (!response.ok) {
		throw new Error(`请求失败: ${response.status} ${await response.text()}`);
	}

	return createSimpleStreamReader(response.body.getReader());
}

// 2. 简单解析
async function* createSimpleStreamReader(reader) {
	const decoder = new TextDecoder();
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		yield decoder.decode(value);
	}
}
