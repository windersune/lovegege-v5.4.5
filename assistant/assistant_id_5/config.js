import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key (建议为新配置使用新的key)
const STORAGE_KEY = 'hf_space_config'


// 1. 您的Cloudflare Worker代理的目标API地址、
const HUGGINGFACE_API_URL = 'https://apilovegege.com/chat'

// 2. [可选] 您调用的模型或Space的描述
const HF_MODEL_NAME = 'Hugging Face Space API'

// 3. [修改] Hugging Face API的默认配置
//    根据您的Python代码，此API似乎没有类似OpenAI的复杂参数。
//    如果您的Space支持其他参数，可以在这里添加。
const DEFAULT_CONFIG = {
	// Hugging Face Space API 通常不支持这些OpenAI参数
	// systemPrompt: '',
	// temperature: 0.7,
	// top_p: 1.0,
	// max_tokens: 2048,
	// presence_penalty: 0.0,
	// frequency_penalty: 0.0
}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: HUGGINGFACE_API_URL,
		modelName: HF_MODEL_NAME,
		apiKey: '', // Hugging Face Space 通常不需要OpenAI格式的API Key
		
		// 将默认配置与用户保存的配置合并
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// [修改] 创建一个只包含可调参数的对象进行保存
	// 如果您的Hugging Face Space有可调参数，请在此处定义
	const configToSave = {
		// 例如: some_param: config.some_param
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
