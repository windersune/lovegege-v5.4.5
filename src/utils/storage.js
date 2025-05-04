/**
 * 存储工具函数
 * 用于在localStorage中保存和读取数据
 */

/**
 * 保存数据到localStorage
 * @param {string} key - 存储键名
 * @param {any} value - 要存储的数据（会被JSON序列化）
 */
export function save(key, value) {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('保存数据到localStorage失败:', error);
  }
}

/**
 * 从localStorage读取数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 如果数据不存在时返回的默认值
 * @returns {any} 存储的数据或默认值
 */
export function load(key, defaultValue = null) {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return defaultValue;
    }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error('从localStorage读取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 从localStorage中删除数据
 * @param {string} key - 要删除的存储键名
 */
export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('从localStorage删除数据失败:', error);
  }
}

/**
 * 清空localStorage中的所有数据
 */
export function clear() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('清空localStorage失败:', error);
  }
}

/**
 * 获取localStorage中存储的所有键名
 * @returns {string[]} 键名数组
 */
export function getAllKeys() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      keys.push(localStorage.key(i));
    }
    return keys;
  } catch (error) {
    console.error('获取localStorage键名失败:', error);
    return [];
  }
} 