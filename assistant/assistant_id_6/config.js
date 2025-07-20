// 在 config.js 中

// ... 其他代码不变 ...

export async function* getDifyChatResponseAsStream(query, imageBase64 = null, conversationId = null) {
	try {
		// 1. 【核心修正】: inputs 对象不再是空的
		const inputs = {};
		
		// 2. 【核心修正】: 如果有图片，将其作为 inputs 对象的一个属性
		//    属性的键名("image")必须与您在Dify后台创建的变量名完全一致！
		if (imageBase64) {
			inputs.image = imageBase64;
		}

		// 3. 构建最终的Payload
		const payload = {
			"inputs": inputs, // <-- 将我们构建好的 inputs 对象放进去
			"query": query,
			"response_mode": "streaming",
			"user": USER_ID,
			"conversation_id": conversationId || ''
		};
		
		// 注意：我们不再需要 "files" 字段了！
		
		console.log("[Dify] 发送给API的最终Payload:", JSON.stringify(payload, null, 2));

		// 4. 后续的 fetch 和流处理逻辑完全不变
		const response = await fetch(CHAT_ENDPOINT, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`请求失败 (${response.status})，响应: ${errorText}`);
		}
		
		const reader = response.body.getReader();
		const decoder = new TextDecoder('utf-8');

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			
			const textChunk = decoder.decode(value, { stream: true });
			const lines = textChunk.split('\n\n');
			
			for (const line of lines) {
				if (line.startsWith('data: ')) {
					const jsonStr = line.substring(6);
					if (jsonStr.trim() === '[DONE]') continue;
					try {
						const parsedChunk = JSON.parse(jsonStr);
						yield parsedChunk;
					} catch (e) {
						console.error("无法解析Dify数据块:", jsonStr);
					}
				}
			}
		}

	} catch (error) {
		console.error(`[Dify] 流式API调用过程发生严重错误: ${error.message}`);
		throw error;
	}
}

// ...
