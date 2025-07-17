import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// 1. 您的 Hugging Face Space 的 API 终端地址
const HUGGINGFACE_API_URL = 'https://badanwang-teacher-basic-qwen3-0-6b.hf.space/run/chat'

// 2. 为所有调试参数设置默认值
const DEFAULT_CONFIG = {
	system_message: 'You are a helpful AI assistant.', // 对应 app.py 中的 system_message
	max_tokens: 2048,      // 对应 app.py 中的 max_tokens
	temperature: 0.1,      // 对应 app.py 中的 temperature
	top_p: 0.01,           // 对应 app.py 中的 top_p
}

// 加载配置信息
export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		baseURL: HUGGINGFACE_API_URL,
		apiKey: '',
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	const configToSave = {
		system_message: config.system_message,
		max_tokens: config.max_tokens,
		temperature: config.temperature,
		top_p: config.top_p,
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效
export function hasValidConfig() {
	return true
}
