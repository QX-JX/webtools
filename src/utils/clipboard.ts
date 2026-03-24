/**
 * 兼容 HTTP 和 HTTPS 的复制到剪贴板函数
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 优先使用现代 Clipboard API (需要 HTTPS)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 失败则使用降级方案
    }
  }

  // 降级方案：使用 execCommand (支持 HTTP)
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    
    // 防止滚动
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const success = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    return success
  } catch {
    return false
  }
}
