import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * 将Markdown文本转换为安全的HTML
 * @param {string} markdown - Markdown格式的文本
 * @returns {string} 安全的HTML字符串
 */
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  
  // 将Markdown转换为HTML
  const rawHtml = marked(markdown)
  
  // 清理HTML以防止XSS攻击
  const cleanHtml = DOMPurify.sanitize(rawHtml)
  
  return cleanHtml
}
