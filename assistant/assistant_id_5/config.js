import * as storage from '@/utils/storage.js'

const STORAGE_KEY = 'hf_space_config'

// ===================================================================
// 【核心修正】: URL 必须是您的中转服务器的 *根地址*。
// @gradio/client 库会基于此根地址自动处理 /config, /queue/join 等子路径。
const HUGGINGFACE_BASE_URL = 'https://apilovegege.com'
// ===================================================================

const HF_MODEL_NAME = 'Hugging Face Space API'

export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	// 使用修正后的基础URL
	return {
		baseURL: HUGGINGFACE_BASE_URL,
		modelName: HF_MODEL_NAME,
		apiKey: '', // Gradio Client 不需要 apiKey
		...savedConfig
	}
}

export function saveConfig(config) {
	// 目前没有需要保存到本地存储的特定配置
	const configToSave = {};
	storage.save(STORAGE_KEY, configToSave)
}

export function hasValidConfig() {
	// 因为不需要配置，所以始终返回 true
	return true
}
