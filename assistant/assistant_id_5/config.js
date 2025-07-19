import * as storage from '@/utils/storage.js'

const STORAGE_KEY = 'hf_space_config'

// 1. [已修正] 根据能正常工作的HTML文件，使用最终正确的API URL
const HUGGINGFACE_API_URL = 'https://apilovegege.com/run/predict'

// 2. 描述信息
const HF_MODEL_NAME = 'Hugging Face Space API'

// ===================================================================

export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		baseURL: HUGGINGFACE_API_URL,
		modelName: HF_MODEL_NAME,
		apiKey: '',
		...savedConfig
	}
}

export function saveConfig(config) {
	const configToSave = {};
	storage.save(STORAGE_KEY, configToSave)
}

export function hasValidConfig() {
	return true
}
