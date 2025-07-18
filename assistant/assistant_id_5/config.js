// --- config.js ---

import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'huggingface_space_config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. 你的Hugging Face Space的公共URL
//    !!! 必须替换为你自己的地址 !!!
//    例如: "https://badawang-teacher-basic-qwen3-0-6b.hf.space"
const YOUR_SPACE_URL = "https://badanwang-teacher-basic-qwen3-0-6b.hf.space";

// ===================================================================


// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	// 返回你的Space API地址
	// 如果用户在设置中保存了新的地址，则使用新的，否则使用默认值
	return {
		baseURL: savedConfig.baseURL || YOUR_SPACE_URL
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	const configToSave = {
		baseURL: config.baseURL
	};
	storage.save(STORAGE_KEY, configToSave);
}

// 判断配置是否有效
export function hasValidConfig() {
    const config = loadConfig();
    // 只要baseURL存在且看起来像个URL，就认为有效
	return !!config.baseURL && config.baseURL.startsWith('http');
}
