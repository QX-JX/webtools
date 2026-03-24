import React, { useState, useEffect } from 'react'
import { X, Command } from 'lucide-react'
import { KeyboardShortcutManager, commonShortcuts, KeyboardShortcut } from '../utils/accessibility'
import { useI18nSection } from '../i18n/helpers'

interface KeyboardShortcutsHelpProps {
  isOpen?: boolean
  onClose?: () => void
  shortcuts?: KeyboardShortcut[]
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen: controlledIsOpen,
  onClose,
  shortcuts = []
}) => {
  const text = useI18nSection<any>('components.keyboardShortcutsHelp')
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setInternalIsOpen(false)
    }
  }
  
  const handleToggle = () => {
    if (onClose) {
      onClose()
    } else {
      setInternalIsOpen(prev => !prev)
    }
  }

  // 合并常用快捷键和自定义快捷键
  const allShortcuts = [
    ...Object.values(commonShortcuts).map(fn => fn(() => {})),
    ...shortcuts
  ]

  useEffect(() => {
    const manager = new KeyboardShortcutManager()
    
    // 注册帮助快捷键
    manager.register({
      key: '?',
      description: text.toggleDescription,
      action: handleToggle
    })

    const handleKeyDown = (event: KeyboardEvent) => {
      // 检查是否是 ? 键（需要处理不同的键盘布局）
      if (event.key === '?' || event.key === '/' || event.keyCode === 191) {
        if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
          event.preventDefault()
          handleToggle()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const formatShortcut = (shortcut: KeyboardShortcut): string => {
    const parts: string[] = []
    
    if (shortcut.modifiers) {
      // 根据操作系统显示不同的修饰键符号
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modifierSymbols = {
        ctrl: isMac ? '⌘' : 'Ctrl',
        alt: isMac ? '⌥' : 'Alt',
        shift: isMac ? '⇧' : 'Shift',
        meta: isMac ? '⌘' : 'Win'
      }
      
      shortcut.modifiers.forEach(modifier => {
        parts.push(modifierSymbols[modifier] || modifier)
      })
    }
    
    // 特殊键的显示
    const keySymbols: Record<string, string> = {
      ' ': 'Space',
      'enter': 'Enter',
      'escape': 'Esc',
      'tab': 'Tab',
      'delete': 'Del',
      'backspace': 'Backspace'
    }
    
    parts.push(keySymbols[shortcut.key.toLowerCase()] || shortcut.key.toUpperCase())
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    return parts.join(isMac ? '' : '+')
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Command className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-800">
              {text.title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={text.close}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {text.helpTextBefore} <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd> {text.helpTextMiddle} <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">/</kbd> {text.helpTextAfter}
            </p>
          </div>

          <div className="space-y-4">
            {allShortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-700">{shortcut.description}</span>
                <kbd className="px-3 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">{text.tipTitle}</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              {text.tipItems.map((item: string) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            {text.closeEsc}
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
