import * as storage from '@/utils/storage.js'

// 配置信息有以下几个字段：
// - apiKey: Moonshot API Key (已硬编码)
// - baseURL: Moonshot API Base URL (已硬编码)
// - modelName: Moonshot Model Name (已硬编码)
// - systemPrompt: 系统提示词 (可选)

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// 默认的系统提示词
const DEFAULT_SYSTEM_PROMPT = '你可以回答任何的问题。'

// 硬编码的API配置
const HARDCODED_API_KEY = 'sk-ad7b096bbf254e40bfc724191867e874' // 替换为你的实际API密钥
const HARDCODED_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1' // 只设置基础URL，不包含具体端点
const HARDCODED_MODEL_NAME = 'qwen-max-latest' // 根据需要修改

// 初始化配置信息
// 使用硬编码的API信息
function initConfig() {
	return {
		apiKey: HARDCODED_API_KEY,
		baseURL: HARDCODED_BASE_URL,
		modelName: HARDCODED_MODEL_NAME,
		systemPrompt: DEFAULT_SYSTEM_PROMPT,
	}
}

// 从 localStorage 中读取配置信息
// 如果没有保存过配置信息，则初始化一个配置信息，并保存到 localStorage
export function loadConfig() {
	// 始终使用硬编码配置
	return initConfig();
}

// 保存配置信息到 localStorage（仅保存系统提示词）
export function saveConfig(config) {
	// 合并硬编码配置和用户提供的系统提示词
	const newConfig = {
		...initConfig(),
		systemPrompt: config.systemPrompt || DEFAULT_SYSTEM_PROMPT
	};
	
	storage.save(STORAGE_KEY, newConfig)
}

// 判断是否已经保存了必填字段
export function hasValidConfig() {
	// 由于使用硬编码值，总是返回true
	return true;
}
