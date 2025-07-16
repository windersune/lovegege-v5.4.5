import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'coze_config'

// ===================================================================
//                        【核心修改 for Coze】
// ===================================================================

// 1. Coze API 的基础 URL
//    文档地址: https://www.coze.cn/docs/developer_guides/coze_api_reference
const COZE_API_BASE_URL = 'https://api.coze.cn/open_api/v1/chat'

// 2. [新增] 默认配置
const DEFAULT_CONFIG = {
	// !!! 【重要】请在这里填入您自己的 Personal Access Token !!!
	token: 'pat_MGqWH4aLp5GhlVjp228Aagt9krgGRKgwEttkf7MtaIfmY3PIgPIABZUzGrUq84D1', 
	
	// !!! 【重要】请在这里填入您要调用的 Bot 的 ID !!!
	bot_id: '7500508271048966171',
	
	// 为用户生成一个唯一的、持久的ID，用于区分不同用户
	user_id: '1231412425435423',

    // Coze API 不支持像 aistudio 那样直接在请求中调整这些参数
    // 这些模型参数通常在创建和调试 Bot 时在 Coze 平台上进行配置
    // 此处保留仅为UI占位，实际API请求中不会使用
	systemPrompt: '你现在是一个 Coze 智能体。', // 仅为UI显示，实际的System Prompt在Coze平台设置
	temperature: 0.7,
	top_p: 1.0,
	max_tokens: 4096,
	presence_penalty: 0.0,
	frequency_penalty: 0.0
}

// ===================================================================

/**
 * 加载配置信息
 * @returns {object} 合并后的完整配置
 */
export function loadConfig() {
	// 从localStorage读取用户自定义的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: COZE_API_BASE_URL,
		
		// 将默认配置与用户保存的配置合并
		// 用户保存的值会覆盖默认值
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

/**
 * 保存配置信息到 localStorage
 * @param {object} config - 需要保存的配置对象
 */
export function saveConfig(config) {
	// 只保存用户可以修改的、与Coze相关的核心字段
	const configToSave = {
		token: config.token,
		bot_id: config.bot_id,
		user_id: config.user_id,
        // 其他参数（如temperature等）不保存，因为它们由Coze平台控制
	};
	storage.save(STORAGE_KEY, configToSave)
}

/**
 * 判断配置是否有效
 * @param {object} config - 配置对象
 * @returns {boolean} 如果 token 和 bot_id 都已填写，则返回 true
 */
export function hasValidConfig(config) {
	return config && config.token && config.bot_id;
}
