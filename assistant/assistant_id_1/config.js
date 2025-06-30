import * as storage from '@/utils/storage.js'

// 保存在 localStorage 中的配置信息的 key
const STORAGE_KEY = 'config'

// ===================================================================
//                        【核心修改】
// ===================================================================

// 1. 您的Cloudflare Worker代理的目标地址
//    !!! 请确保这个地址是您自己的Worker地址 !!!
const WORKER_CHATGPT_URL = 'https://cool-mountain-b541.zuoshilong888.workers.dev/openai/v1/chat/completions'

// 2. 您想使用的ChatGPT模型
const CHATGPT_MODEL_NAME = 'gpt-3.5-turbo' // 或 'gpt-4o'

// 3. [新增] 为所有调试参数设置默认值
const DEFAULT_CONFIG = {
	systemPrompt: '你是一个由OpenAI训练的AI助手，请友好并有帮助地回答问题。',
	temperature: 0.7,      // 温度：控制随机性，越高越随机 (0-2)
	top_p: 1.0,            // Top P：控制核心词汇范围 (0-1)
	max_tokens: 2048,      // 最大Token数：限制单次回复的长度
	presence_penalty: 0.0, // 存在惩罚：-2.0到2.0，正值会鼓励模型谈论新话题
	frequency_penalty: 0.0 // 频率惩罚：-2.0到2.0，正值会降低重复词语的概率
}

// ===================================================================

// 加载配置信息
export function loadConfig() {
	// 从localStorage读取用户保存的配置
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: WORKER_CHATGPT_URL,
		modelName: CHATGPT_MODEL_NAME,
		apiKey: '', 
		
		// [修改] 将默认配置与用户保存的配置合并
		// 用户保存的值会覆盖默认值
		...DEFAULT_CONFIG,
		...savedConfig
	}
}

// 保存配置信息到 localStorage
export function saveConfig(config) {
	// [修改] 创建一个只包含可调参数的对象进行保存
	const configToSave = {
		systemPrompt: config.systemPrompt,
		temperature: config.temperature,
		top_p: config.top_p,
		max_tokens: config.max_tokens,
		presence_penalty: config.presence_penalty,
		frequency_penalty: config.frequency_penalty,
	};
	storage.save(STORAGE_KEY, configToSave)
}

// 判断配置是否有效（总是返回true）
export function hasValidConfig() {
	return true
}
