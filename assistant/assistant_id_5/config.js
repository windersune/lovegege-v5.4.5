import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'hf_space_config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. 您的Cloudflare Worker代理的目标API地址
//    [重要] gradio_client 会自动将 api_name="/chat" 转换为 /run/chat 的请求路径。
//    所以我们在这里必须使用完整的、真实的请求URL。
const HUGGINGFACE_API_URL = 'https://apilovegege.com/run/predict'

// 2. 您调用的模型或Space的描述
const HF_MODEL_NAME = 'Hugging Face Space API (via Gradio)'

// 3. Gradio API的默认配置
//    您的Python代码没有传递除 `message` 之外的参数，所以这里为空。
const DEFAULT_CONFIG = {}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: HUGGINGFACE_API_URL,
		modelName: HF_MODEL_NAME,
		apiKey: '', // Gradio API 不需要API Key
		
		// 合并配置 (当前为空)
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// 当前没有可供用户调节的参数需要保存
	const configToSave = {};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
