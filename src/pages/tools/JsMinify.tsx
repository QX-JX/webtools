import { useState, useRef, useEffect } from 'react'
import { Minimize2, Copy, ArrowRightLeft } from 'lucide-react'
import { Alert } from '../../components/ErrorHandling'
import { LoadingButton } from '../../components/LoadingStates'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function JsMinify() {
  const text = useI18nSection<any>('pages.jsMinify')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'minify' | 'beautify'>('minify')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 工具历史记录
  const { recordToolUsage } = useToolHistory()

  // 记录工具使用
  useEffect(() => {
    recordToolUsage('js-minify', text.toolName, text.toolCategory)
  }, [recordToolUsage, text.toolCategory, text.toolName])
  
  // 引用DOM元素
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const minifyJs = (code: string): string => {
    // 简单的 JS 压缩
    let result = code
    // 移除单行注释
    result = result.replace(/\/\/.*$/gm, '')
    // 移除多行注释
    result = result.replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除多余空白
    result = result.replace(/\s+/g, ' ')
    // 移除操作符周围的空格
    result = result.replace(/\s*([{}\[\]();,:<>+\-*\/=!&|?])\s*/g, '$1')
    // 修复一些情况
    result = result.replace(/\bfunction\(/g, 'function (')
    result = result.replace(/\bif\(/g, 'if (')
    result = result.replace(/\bfor\(/g, 'for (')
    result = result.replace(/\bwhile\(/g, 'while (')
    result = result.replace(/\bswitch\(/g, 'switch (')
    result = result.replace(/\breturn\{/g, 'return {')
    result = result.trim()
    return result
  }

  const beautifyJs = (code: string): string => {
    // 简单的 JS 格式化
    let result = code
    let indent = 0
    const lines: string[] = []
    let currentLine = ''

    for (let i = 0; i < result.length; i++) {
      const char = result[i]
      
      if (char === '{' || char === '[') {
        currentLine += char
        lines.push('  '.repeat(indent) + currentLine.trim())
        currentLine = ''
        indent++
      } else if (char === '}' || char === ']') {
        if (currentLine.trim()) {
          lines.push('  '.repeat(indent) + currentLine.trim())
          currentLine = ''
        }
        indent = Math.max(0, indent - 1)
        lines.push('  '.repeat(indent) + char)
      } else if (char === ';') {
        currentLine += char
        lines.push('  '.repeat(indent) + currentLine.trim())
        currentLine = ''
      } else if (char === ',') {
        currentLine += char
        if (result[i + 1] !== ' ' && result[i + 1] !== '\n') {
          currentLine += ' '
        }
      } else {
        currentLine += char
      }
    }

    if (currentLine.trim()) {
      lines.push('  '.repeat(indent) + currentLine.trim())
    }

    return lines.filter(l => l.trim()).join('\n')
  }

  const handleConvert = () => {
    try {
      setError(null)
      let result
      if (mode === 'minify') {
        result = minifyJs(input)
      } else {
        result = beautifyJs(input)
      }
      setOutput(result)
      
      // 记录工具使用历史
      recordToolUsage(
        'js-minify',
        text.toolNameHistory,
        text.toolCategory,
        { mode, inputLength: input.length, outputLength: result.length },
        { result }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : text.processFailed)
    }
  }

  const copyOutput = async () => {
    const success = await copyToClipboard(output)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setError(text.copyFailed)
    }
  }

  const clear = () => {
    setInput('')
    setOutput('')
    setError(null)
    inputRef.current?.focus()
  }

  const getStats = () => {
    const inputSize = new Blob([input]).size
    const outputSize = new Blob([output]).size
    const ratio = inputSize > 0 ? Math.round((1 - outputSize / inputSize) * 100) : 0
    return { inputSize, outputSize, ratio }
  }

  const stats = getStats()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center">
            <Minimize2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <p className="text-gray-500">{text.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton toolId="js-minify" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('minify')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'minify' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-label={text.switchToMinify}
            title={text.switchToMinifyTitle}
          >
            {text.minify}
          </button>
          <button
            onClick={() => setMode('beautify')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'beautify' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-label={text.switchToBeautify}
            title={text.switchToBeautifyTitle}
          >
            {text.beautify}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="font-medium text-gray-700">{text.input}</span>
            <span className="text-sm text-gray-500">{stats.inputSize} bytes</span>
          </div>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={text.inputPlaceholder}
            className="w-full h-80 p-4 font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
            aria-label={text.inputAria}
            title={text.inputTitle}
          />
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="font-medium text-gray-700">{text.output}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{stats.outputSize} bytes</span>
              {mode === 'minify' && stats.ratio > 0 && (
                <span className="text-sm text-green-600">-{stats.ratio}%</span>
              )}
              <button
                onClick={copyOutput}
                disabled={!output}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                aria-label={text.copyOutput}
                title={text.copyOutputTitle}
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            ref={outputRef}
            value={output}
            readOnly
            placeholder={text.resultPlaceholder}
            className="w-full h-80 p-4 font-mono text-sm resize-none bg-gray-50"
            aria-label={text.outputAria}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        <LoadingButton
          loading={false}
          onClick={handleConvert}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-amber-700 transition-colors"
          aria-label={mode === 'minify' ? text.executeMinify : text.executeBeautify}
          title={mode === 'minify' ? text.executeMinifyTitle : text.executeBeautifyTitle}
        >
          {mode === 'minify' ? text.minifyCode : text.beautifyCode}
        </LoadingButton>
        <button
          onClick={() => { setInput(output); setOutput('') }}
          disabled={!output}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
          aria-label={text.swap}
          title={text.swapTitle}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {text.swap}
        </button>
        <button
          onClick={clear}
          className="px-8 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          aria-label={text.clear}
          title={text.clearTitle}
        >
          {text.clear}
        </button>
      </div>

      {copied && (
        <p className="text-center text-green-600 mt-4">{text.copied}</p>
      )}

      {/* Info */}
      <div className="mt-8 bg-yellow-50 rounded-xl p-6 border border-yellow-100">
        <h3 className="font-semibold text-yellow-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-yellow-700 text-sm leading-relaxed space-y-1">
          {text.infoItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
