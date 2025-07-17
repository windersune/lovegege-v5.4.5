// --- START OF FILE config.js ---

import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. [修改] 将 URL 指向您自己的 Hugging Face Space API 地址
//    这个地址就是您部署的应用地址，后面跟上 FastAPI 中定义的路由 /laoshifu
const CUSTOM_MODEL_URL = 'https://badanwang-teacher-basic-qwen3-0-6b.hf.space/laoshifu'

// 2. [修改] 更新模型名称为一个描述性的名字（此名称仅用于显示，不会发送到后端）
const CUSTOM_MODEL_NAME = 'badanwang/teacher_basic_qwen3-0.6b' 

// 3. 您的后端 API 所支持的参数默认值
//    注意：我们移除了后端不支持的 presence_penalty 和 frequency_penalty
const DEFAULT_CONFIG = {
	systemPrompt: '你是一个乐于助人的AI教师。',
	temperature: 0.7,      // 温度 (0-2)
	top_p: 0.95,           // Top P (0-1)
	max_tokens: 2048,      // 最大Token数
}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// [修改] 使用新的 API 地址和模型名
		baseURL: CUSTOM_MODEL_URL,
		modelName: CUSTOM_MODEL_NAME,
		apiKey: '', // 您的模型不需要 API Key
		
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// [修改] 只保存后端支持的参数
	const configToSave = {
		systemPrompt: config.systemPrompt,
		temperature: config.temperature,
		top_p: config.top_p,
		max_tokens: config.max_tokens,
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
