import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// ==================================================================
//                        【终极核心修正】
//       将 URL 指向 Gradio 底层的通用预测端点
// ==================================================================
const HUGGINGFACE_API_URL = 'https://badanwang-teacher-basic-qwen3-0-6b.hf.space/run/laoshifu'

// 参数的默认值保持不变
const DEFAULT_CONFIG = {
	system_message: '你是一名老师傅。',
	max_tokens: 2048,
	temperature: 0.7, // 使用一个更常规的默认值
	top_p: 0.95,      // 使用一个更常规的默认值
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
