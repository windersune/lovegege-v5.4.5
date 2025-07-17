import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. 您的 Hugging Face Space 的 API 终端地址
//    !!! "chat" 对应您 predict 方法的 api_name !!!
const HUGGINGFACE_API_URL = 'https://badanwang-teacher-basic-qwen3-0-6b.hf.space/run/chat'

// 2. [核心修改] 根据最新的官方示例，设置默认参数
//    这些参数的名称 (key) 必须与示例中的完全一致
const DEFAULT_CONFIG = {
	system_message: 'You are a helpful and friendly AI assistant.', // 对应 system_message
	max_tokens: 2048,      // 对应 max_tokens (官方示例的 1 太小了，这里用一个更合理的值)
	temperature: 0.1,      // 对应 temperature
	top_p: 0.01,           // 对应 top_p
}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: HUGGINGFACE_API_URL,
		apiKey: '', // Hugging Face Spaces 通常不需要 API Key

		// 将默认配置与用户保存的配置合并
		// 用户保存的值会覆盖默认值
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// [核心修改] 创建一个只包含可调参数的对象进行保存
	const configToSave = {
		system_message: config.system_message,
		max_tokens: config.max_tokens,
		temperature: config.temperature,
		top_p: config.top_p,
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
