import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key (建议为新配置使用新的key)
const STORAGE_KEY = 'hf_space_config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. [已修正] 您的Cloudflare Worker代理的目标API地址
//    Gradio的API端点通常在 /run/ 路径下
const HUGGINGFACE_API_URL = 'https://apilovegege.com/run/predict' // <--- 这里是关键改动！

// 2. [可选] 您调用的模型或Space的描述
const HF_MODEL_NAME = 'Hugging Face Space API'

// 3. Hugging Face API的默认配置 (通常无额外参数)
const DEFAULT_CONFIG = {}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		baseURL: HUGGINGFACE_API_URL,
		modelName: HF_MODEL_NAME,
		apiKey: '', 
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	const configToSave = {};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
