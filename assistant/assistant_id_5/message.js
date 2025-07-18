// --- message.js ---

import { loadConfig } from './config.js'

/**
 * 模拟流式读取器
 * Gradio API 一次性返回完整数据，此函数将其分解为小块，
 * 以便前端可以像处理真实流一样实现打字机效果。
 * @param {string} fullText - 从API获取到的完整回复文本
 */
async function* simulateStreamReader(fullText) {
	const chunks = fullText.split('');
	for (const chunk of chunks) {
		const responseChunk = {
			choices: [{
				delta: {
					content: chunk
				}
			}]
		};
		yield responseChunk;
		await new Promise(resolve => setTimeout(resolve, 5));
	}
}


export async function getResponse(messages) {
	const config = loadConfig();

	if (!config.baseURL) {
		throw new Error("Hugging Face Space URL未配置，请在设置中检查。");
	}

	// --- 【核心逻辑】数据格式转换 ---
	const currentUserMessage = messages[messages.length - 1].content;
	const gradioHistory = [];
	const historyMessages = messages.slice(0, -1);
	
	for (let i = 0; i < historyMessages.length; i += 2) {
		if (historyMessages[i].role === 'user' && historyMessages[i+1]?.role === 'assistant') {
			gradioHistory.push([
				historyMessages[i].content,
				historyMessages[i+1].content
			]);
		}
	}
	
	const requestBody = {
		"data": [
			currentUserMessage,
			gradioHistory
		]
	};

	// ---【重要修正】---
	// 健壮地构建API端点URL，避免双斜杠问题。
	// 1. 先移除baseURL末尾可能存在的'/'
	const cleanedBaseURL = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
	// 2. 再安全地拼接路径
	const apiEndpoint = `${cleanedBaseURL}/run/predict`;
	
	// 打印出最终请求的地址，方便调试
	console.log("准备请求的Gradio API地址:", apiEndpoint);

	// 4. 发起API请求
	const response = await fetch(apiEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(requestBody),
	});

	if (!response.ok) {
		const errorData = await response.text();
		// 打印出服务器返回的原始错误内容，帮助分析
		console.error("Gradio API返回的原始错误内容:", errorData);
		throw new Error(`对Gradio API的请求失败: ${response.status} ${errorData.slice(0, 100)}`); // 只显示前100个字符避免刷屏
	}

	const result = await response.json();
	const modelResponseText = result.data[0];
	return simulateStreamReader(modelResponseText);
}```

### 修改说明

1.  **定位问题**：错误的根源在于 `fetch` 请求的URL拼接方式不够安全。
2.  **核心修改**：我在 `fetch` 请求之前加入了**两行新代码**：
    *   `const cleanedBaseURL = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;`
    *   `const apiEndpoint = \`${cleanedBaseURL}/run/predict\`;`
3.  **代码作用**：这段新代码会在拼接URL之前，先检查 `baseURL` 是否以 `/` 结尾。如果是，就把它删掉，确保最终的API地址**永远是正确**的 `.../run/predict` 格式，避免了 `...//run/predict` 这样的错误。
4.  **增加调试信息**：我还加了一句 `console.log` 来打印出最终请求的URL，方便你后续排查问题。

**请执行以下操作：**

1.  用上面的完整代码替换你项目中的 `message.js` 文件。
2.  **无需修改 `config.js`**，无论它里面的URL带不带斜杠，新代码都能处理。
3.  清除浏览器缓存后重新运行你的H5应用。

这样修改后，你的H5应用就应该能和Python一样正常调用API了。
