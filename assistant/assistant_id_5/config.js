// --- START OF MODIFIED config.js ---

import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'huggingface_config' // 使用新的key以避免与旧配置冲突

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. 您的 Hugging Face Space 的 API 地址
//    格式通常是 https://<用户名>-<仓库名>.hf.space
//    !! 注意：这里不包含 /run/chat 后缀
const HUGGINGFACE_SPACE_URL = 'https://badanwang-teacher-basic-qwen3-0-6b.hf.space'

// 2. 您在Gradio中定义的api_name
const API_NAME = '/chat'

// 3. 为所有调试参数设置默认值，以匹配Gradio示例
const DEFAULT_CONFIG = {
	system_message: 'You are a helpful AI assistant.', // 键名从 systemPrompt 改为 system_message
	temperature: 0.7,      // 温度
	top_p: 0.95,           // Top P
	max_tokens: 512,       // 最大Token数
}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		// 将基础URL和API名称组合成完整的请求地址
		apiURL: `${HUGGINGFACE_SPACE_URL}/run${API_NAME}`,
		
		// 将默认配置与用户保存的配置合并
		// 用户保存的值会覆盖默认值
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// 创建一个只包含可调参数的对象进行保存
	const configToSave = {
		system_message: config.system_message,
		temperature: config.temperature,
		top_p: config.top_p,
		max_tokens: config.max_tokens,
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}

// --- END OF MODIFIED config.js ---
