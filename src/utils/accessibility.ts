import React from 'react'

/**
 * 键盘快捷键和可访问性支持工具
 */

export interface KeyboardShortcut {
  key: string
  modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
  description: string
  action: () => void
  disabled?: boolean
}

/**
 * 键盘快捷键管理器
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private isEnabled = true

  /**
   * 注册快捷键
   */
  register(shortcut: KeyboardShortcut): void {
    const key = this.generateKey(shortcut.key, shortcut.modifiers)
    this.shortcuts.set(key, shortcut)
  }

  /**
   * 注销快捷键
   */
  unregister(key: string, modifiers?: string[]): void {
    const shortcutKey = this.generateKey(key, modifiers)
    this.shortcuts.delete(shortcutKey)
  }

  /**
   * 启用/禁用快捷键
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) return

    const key = this.generateKey(event.key.toLowerCase(), this.getModifiers(event))
    const shortcut = this.shortcuts.get(key)

    if (shortcut && !shortcut.disabled) {
      event.preventDefault()
      shortcut.action()
    }
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * 生成快捷键标识符
   */
  private generateKey(key: string, modifiers?: string[]): string {
    const parts: string[] = []
    
    if (modifiers) {
      const sortedModifiers = modifiers.slice().sort()
      parts.push(...sortedModifiers)
    }
    
    parts.push(key)
    
    return parts.join('+')
  }

  /**
   * 获取修饰键
   */
  private getModifiers(event: KeyboardEvent): string[] {
    const modifiers: string[] = []
    
    if (event.ctrlKey) modifiers.push('ctrl')
    if (event.altKey) modifiers.push('alt')
    if (event.shiftKey) modifiers.push('shift')
    if (event.metaKey) modifiers.push('meta')
    
    return modifiers.sort()
  }
}

/**
 * 可访问性工具
 */
export class AccessibilityUtils {
  /**
   * 创建可访问的按钮属性
   */
  static createButtonProps(
    label: string,
    expanded?: boolean,
    disabled?: boolean,
    pressed?: boolean
  ): Record<string, any> {
    return {
      'aria-label': label,
      'aria-expanded': expanded,
      'aria-disabled': disabled,
      'aria-pressed': pressed,
      role: 'button',
      tabIndex: disabled ? -1 : 0
    }
  }

  /**
   * 创建可访问的输入框属性
   */
  static createInputProps(
    label: string,
    required?: boolean,
    invalid?: boolean,
    describedBy?: string
  ): Record<string, any> {
    return {
      'aria-label': label,
      'aria-required': required,
      'aria-invalid': invalid,
      'aria-describedby': describedBy
    }
  }

  /**
   * 创建可访问的表单属性
   */
  static createFormProps(label: string): Record<string, any> {
    return {
      'aria-label': label,
      role: 'form'
    }
  }

  /**
   * 创建可访问的导航属性
   */
  static createNavigationProps(label: string, current?: boolean): Record<string, any> {
    return {
      'aria-label': label,
      'aria-current': current ? 'page' : undefined,
      role: 'navigation'
    }
  }

  /**
   * 创建可访问的状态消息属性
   */
  static createStatusProps(polite = true): Record<string, any> {
    return {
      'aria-live': polite ? 'polite' : 'assertive',
      'aria-atomic': true,
      role: 'status'
    }
  }

  /**
   * 创建可访问的对话框属性
   */
  static createDialogProps(
    title: string,
    describedBy?: string,
    modal = true
  ): Record<string, any> {
    return {
      'aria-label': title,
      'aria-describedby': describedBy,
      role: 'dialog',
      'aria-modal': modal
    }
  }

  /**
   * 焦点管理
   */
  static focusManagement = {
    /**
     * 获取可聚焦的元素
     */
    getFocusableElements(container: HTMLElement): HTMLElement[] {
      const selector = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ].join(', ')

      return Array.from(container.querySelectorAll(selector))
    },

    /**
     * 聚焦第一个元素
     */
    focusFirst(container: HTMLElement): void {
      const elements = this.getFocusableElements(container)
      if (elements.length > 0) {
        (elements[0] as HTMLElement).focus()
      }
    },

    /**
     * 聚焦最后一个元素
     */
    focusLast(container: HTMLElement): void {
      const elements = this.getFocusableElements(container)
      if (elements.length > 0) {
        (elements[elements.length - 1] as HTMLElement).focus()
      }
    },

    /**
     * 创建焦点陷阱
     */
    createFocusTrap(container: HTMLElement) {
      const elements = this.getFocusableElements(container)
      const firstElement = elements[0] as HTMLElement
      const lastElement = elements[elements.length - 1] as HTMLElement

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Tab') {
          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }

      container.addEventListener('keydown', handleKeyDown)

      return () => {
        container.removeEventListener('keydown', handleKeyDown)
      }
    }
  }

  /**
   * 屏幕阅读器通知
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', priority)
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  /**
   * 跳过链接
   */
  static createSkipLink(targetId: string, text = '跳转到主内容'): HTMLElement {
    const link = document.createElement('a')
    link.href = `#${targetId}`
    link.textContent = text
    link.className = 'skip-link'
    link.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `

    link.addEventListener('focus', () => {
      link.style.top = '6px'
    })

    link.addEventListener('blur', () => {
      link.style.top = '-40px'
    })

    return link
  }
}

/**
 * 常用快捷键配置
 */
export const commonShortcuts = {
  /**
   * 搜索快捷键
   */
  search: (action: () => void): KeyboardShortcut => ({
    key: 'k',
    modifiers: ['ctrl'],
    description: '聚焦搜索框',
    action
  }),

  /**
   * 刷新快捷键
   */
  refresh: (action: () => void): KeyboardShortcut => ({
    key: 'r',
    modifiers: ['ctrl'],
    description: '刷新页面',
    action
  }),

  /**
   * 导出快捷键
   */
  export: (action: () => void): KeyboardShortcut => ({
    key: 'e',
    modifiers: ['ctrl', 'shift'],
    description: '导出结果',
    action
  }),

  /**
   * 帮助快捷键
   */
  help: (action: () => void): KeyboardShortcut => ({
    key: '?',
    modifiers: [],
    description: '显示帮助',
    action
  }),

  /**
   * 主页快捷键
   */
  home: (action: () => void): KeyboardShortcut => ({
    key: 'h',
    modifiers: ['ctrl', 'alt'],
    description: '返回主页',
    action
  })
}

/**
 * React Hook: 键盘快捷键
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true): void {
  React.useEffect(() => {
    if (!enabled) return

    const manager = new KeyboardShortcutManager()
    
    shortcuts.forEach(shortcut => {
      manager.register(shortcut)
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      manager.handleKeyDown(event)
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

/**
 * React Hook: 可访问性焦点管理
 */
export function useFocusManagement(containerRef: React.RefObject<HTMLElement>): void {
  React.useEffect(() => {
    if (!containerRef.current) return

    const cleanup = AccessibilityUtils.focusManagement.createFocusTrap(containerRef.current)
    
    return cleanup
  }, [containerRef])
}

/**
 * React Hook: 屏幕阅读器通知
 */
export function useAnnouncer(): (message: string, priority?: 'polite' | 'assertive') => void {
  return React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    AccessibilityUtils.announce(message, priority)
  }, [])
}