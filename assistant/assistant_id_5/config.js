import * as storage from '@/utils/storage.js'

const STORAGE_KEY = 'super_simple_hf_config'

// 1. 你的“智能管家”Worker 的 API 地址
const SMART_WORKER_URL = 'https://apilovegege.com/hf/chat' // <-- 指向新的智能端点

// 2. 模型ID，仅用于UI显示
const HF_MODEL_ID = 'badanwang/teacher_basic_qwen3-0.6b'

export function loadConfig() {
	return { baseURL: SMART_WORKER_URL, modelName: HF_MODEL_ID }
}
export function saveConfig(config) { storage.save(STORAGE_KEY, {}); }
export function hasValidConfig() { return true }
