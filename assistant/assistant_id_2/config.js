// config.js

import * as storage from '@/utils/storage.js';

// 为了防止和旧配置冲突，我们为Gemini使用一个新的localStorage key
const STORAGE_KEY = 'gemini_config';

// ===================================================================
//                        【核心配置】
// ===================================================================

// 1. 您的Cloudflare Worker代理的Gemini专属地址
//    !!! 请务必确认这个地址是您自己的，并且指向了支持视觉的模型 !!!
const WORKER_GEMINI_URL = 'https://apilovegege.com/google/v1beta/models/gemini-1.5-flash:generateContent';

// 2. [新增] Gemini所有可调参数的默认值
//    参考文档: https://ai.google.dev/api/rest/v1beta/models/generateContent
const DEFAULT_GEMINI_CONFIG = {
	// 注意: Gemini没有独立的system_prompt字段，我们会在message.js中进行处理
	systemPrompt: '你是一个由Google训练的顶尖多模态AI模型Gemini。你的任务是分析用户提供的文本和图片，并给出详细、有帮助的回答。',
	
	// generationConfig 部分
	temperature: 1.0,      // 温度：控制创造性，越高越有创意 (0-1)
	topP: 0.95,            // Top P：控制核心词汇范围，一种更高级的随机性控制
	topK: 40,              // Top K：在解码时考虑K个最可能的词元
	maxOutputTokens: 8192, // 最大输出Token数：限制单次回复的长度
	// stopSequences: [],   // 停止序列：可以让模型在生成特定文本时停止
};

// ===================================================================

/**
 * 加载配置信息。
 * 它会合并默认配置和用户保存在本地的配置。
 */
export function loadConfig() {
	const savedConfig = storage.load(STORAGE_KEY) || {};
	
	return {
		// 固定的基础信息
		baseURL: WORKER_GEMINI_URL,
		
		// 将默认配置与用户保存的配置合并
		// 用户自己设置的值会覆盖默认值
		...DEFAULT_GEMINI_CONFIG,
		...savedConfig,
	};
}

/**
 * 保存配置信息到 localStorage。
 * 只保存用户可以调整的参数。
 * @param {object} config - 包含要保存参数的配置对象
 */
export function saveConfig(config) {
	const configToSave = {
		systemPrompt: config.systemPrompt,
		temperature: config.temperature,
		topP: config.topP,
		topK: config.topK,
		maxOutputTokens: config.maxOutputTokens,
	};
	storage.save(STORAGE_KEY, configToSave);
}

/**
 * 判断配置是否有效（总是返回true，因为不再需要前端API Key）
 */
export function hasValidConfig() {
	return true;
}
