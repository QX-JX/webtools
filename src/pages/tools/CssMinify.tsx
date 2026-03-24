import { useState, useRef } from 'react'
import { Maximize2, Copy, ArrowRightLeft } from 'lucide-react'
import { Alert } from '../../components/ErrorHandling'
import { LoadingButton } from '../../components/LoadingStates'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function CssMinify() {
  const text = useI18nSection<any>('pages.cssMinify')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'minify' | 'beautify'>('minify')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { recordToolUsage } = useToolHistory()
  
  // 引用DOM元素
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const minifyCss = (code: string): string => {
    let result = code
    // 移除注释
    result = result.replace(/\/\*[\s\S]*?\*\//g, '')
    // 移除多余空白
    result = result.replace(/\s+/g, ' ')
    // 移除选择器和属性周围的空格
    result = result.replace(/\s*([{};:,>~+])\s*/g, '$1')
    // 移除最后一个分号
    result = result.replace(/;}/g, '}')
    // 移除 0 后面的单位
    result = result.replace(/(:|\s)0(px|em|rem|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)/g, '$10')
    result = result.trim()
    return result
  }

  const beautifyCss = (code: string): string => {
    let result = code
    // 在 { 后添加换行
    result = result.replace(/\{/g, ' {\n  ')
    // 在 } 前添加换行
    result = result.replace(/\}/g, '\n}\n\n')
    // 在 ; 后添加换行
    result = result.replace(/;/g, ';\n  ')
    // 清理多余的空白
    result = result.replace(/\n\s*\n/g, '\n')
    result = result.replace(/\{\s+/g, '{\n  ')
    result = result.replace(/\s+\}/g, '\n}')
    // 移除末尾多余换行
    result = result.trim()
    return result
  }

  const handleConvert = () => {
    try {
      setError(null)
      let result
      if (mode === 'minify') {
        result = minifyCss(input)
      } else {
        result = beautifyCss(input)
      }
      setOutput(result)
      
      // 记录工具使用历史
      recordToolUsage(
        'css-minify',
        text.toolName,
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
          <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
            <Maximize2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <p className="text-gray-500">{text.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton toolId="css-minify" />
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
              mode === 'minify' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-label={text.switchToMinify}
            title={text.switchToMinifyTitle}
          >
            {text.minify}
          </button>
          <button
            onClick={() => setMode('beautify')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'beautify' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
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
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors"
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
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-blue-700 text-sm leading-relaxed space-y-1">
          {text.infoItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
