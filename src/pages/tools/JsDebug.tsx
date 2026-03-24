import { useState, useRef } from 'react'
import { Terminal, Play, Trash2, Copy } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'
import { copyToClipboard } from '../../utils/clipboard'

interface LogEntry {
  id: number
  type: 'log' | 'error' | 'warn' | 'info'
  content: string
  timestamp: Date
}

export default function JsDebug() {
  const text = useI18nSection<any>('pages.jsDebug')
  const [code, setCode] = useState(text.defaultCode)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [copied, setCopied] = useState(false)
  const idRef = useRef(0)

  const runCode = () => {
    setLogs([])
    
    // 创建自定义 console
    const customConsole = {
      log: (...args: any[]) => addLog('log', args),
      error: (...args: any[]) => addLog('error', args),
      warn: (...args: any[]) => addLog('warn', args),
      info: (...args: any[]) => addLog('info', args),
    }

    const addLog = (type: LogEntry['type'], args: any[]) => {
      const content = args.map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2)
          } catch {
            return String(arg)
          }
        }
        return String(arg)
      }).join(' ')

      setLogs(prev => [...prev, {
        id: ++idRef.current,
        type,
        content,
        timestamp: new Date()
      }])
    }

    try {
      // 使用 Function 构造器执行代码
      const fn = new Function('console', code)
      fn(customConsole)
    } catch (error) {
      addLog('error', [(error as Error).message])
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const copyCode = async () => {
    const success = await copyToClipboard(code)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400 bg-red-900/20'
      case 'warn': return 'text-yellow-400 bg-yellow-900/20'
      case 'info': return 'text-blue-400 bg-blue-900/20'
      default: return 'text-gray-300'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center">
          <Terminal className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="font-medium text-gray-700">{text.editorTitle}</span>
            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className={`p-2 rounded-lg transition-colors ${copied ? 'text-green-600 bg-green-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}`}
                title={copied ? text.copied : text.copy}
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCode('')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                title={text.clear}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[400px] p-4 font-mono text-sm resize-none focus:outline-none"
            placeholder={text.placeholder}
            spellCheck={false}
          />
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={runCode}
              className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              {text.run}
            </button>
          </div>
        </div>

        {/* Console */}
        <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="font-medium text-gray-300">{text.consoleTitle}</span>
            <button
              onClick={clearLogs}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              title={text.clear}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[450px] overflow-y-auto p-4 font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">{text.consolePlaceholder}</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div key={log.id} className={`p-2 rounded ${getLogColor(log.type)}`}>
                    <span className="text-gray-500 text-xs mr-2">[{formatTime(log.timestamp)}]</span>
                    <span className="whitespace-pre-wrap">{log.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-100">
        <h3 className="font-semibold text-yellow-800 mb-2">{text.usageTitle}</h3>
        <ul className="text-yellow-700 text-sm leading-relaxed space-y-1">
          {text.usageItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
