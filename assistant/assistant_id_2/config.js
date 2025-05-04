import * as storage from '@/utils/storage.js'

// 配置信息有以下几个字段：
// - apiKey: Coze API Key (已硬编码)
// - baseURL: Coze API Base URL (已硬编码)
// - botId: Coze智能体ID (已硬编码)
// - userId: 用户唯一标识 (已硬编码)

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// 硬编码的API配置
const HARDCODED_BOT_ID = '7500508271048966171' // 替换为你的Coze智能体ID
const HARDCODED_USER_ID = 'dawdaw4d56' // 替换为用户唯一标识，可以是任意字符串
const HARDCODED_API_KEY = 'pat_ovJL6AVkQf7pUoThXzBGXoVcGH0V1EK5Qmlj3VFcgq5qA0zHZHCt2yc1UqPtqypI' // 替换为你的Coze API密钥
const HARDCODED_BASE_URL = 'https://api.coze.cn/v3/chat' // 更新为Coze v3的API端点，与coze.py保持一致

// 初始化配置信息
// 使用硬编码的API信息
function initConfig() {
	return {
		apiKey: HARDCODED_API_KEY,
		baseURL: HARDCODED_BASE_URL,
		botId: HARDCODED_BOT_ID,
		userId: HARDCODED_USER_ID
	}
}

// 从 localStorage 中读取配置信息
// 如果没有保存过配置信息，则初始化一个配置信息，并保存到 localStorage
export function loadConfig() {
	// 始终使用硬编码配置
	return initConfig();
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// 合并硬编码配置和用户提供的配置
	const newConfig = {
		...initConfig(),
		// 可以在这里添加其他用户配置项
	};
	
	storage.save(STORAGE_KEY, newConfig)
}

// 判断是否已经保存了必填字段
export function hasValidConfig() {
	// 由于使用硬编码值，总是返回true
	return true;
}
