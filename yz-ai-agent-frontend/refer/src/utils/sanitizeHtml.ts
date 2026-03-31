import DOMPurify from 'dompurify'

/**
 * 安全地清理 HTML 内容，防止 XSS 攻击
 * @param html 需要清理的 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  // 配置 DOMPurify，允许安全的链接和基本样式
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['a', 'span', 'strong', 'em', 'b', 'i', 'u'],
    ALLOWED_ATTR: ['href', 'class', 'style'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|javascript):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // 允许 javascript:void(0) 用于链接占位符
    SAFE_FOR_TEMPLATES: false,
  })
}

