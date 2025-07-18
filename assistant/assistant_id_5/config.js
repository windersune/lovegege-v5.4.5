import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'huggingface_config' // 使用一个专用的key

// ===================================================================
//                        【核心修改】
//      专门用于调用 Hugging Face Gradio 应用的配置
// ===================================================================

// 1. 你的Cloudflare Worker代理中，为Hugging Face设置的完整URL
//    !!! 请确保路径 '/hf/run/predict' 与你的Worker代码一致 !!!
const WORKER_HF_URL = 'https://apilovegege.com/hf/run/predict'

// 2. 你部署在Hugging Face上的模型ID (用于UI显示或参考)
const HF_MODEL_ID = 'badanwang/teacher_basic_qwen3-0.6b'

// 加载配置信息
export function loadConfig() {
	// 对于这个应用，配置很简单，基本都是固定的
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: WORKER_HF_URL,
		modelName: HF_MODEL_ID,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
// 注意：你的 Gradio 后端没有可调参数，所以这个函数目前为空，但保留以备将来扩展
export function saveConfig(config) {
	const configToSave = {}; // 没有需要保存的用户可调参数
	storage.save(STORAGE_KEY, configToSave);
}

// 判断配置是否有效
// 因为是公开的Space，所以总是返回true
export function hasValidConfig() {
	return true
}
