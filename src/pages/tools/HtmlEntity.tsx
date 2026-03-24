import { useState, useCallback } from 'react'
import { Code, ArrowRightLeft, Copy, Trash2 } from 'lucide-react'
import { Alert } from '../../components/ErrorHandling'
import { LoadingButton } from '../../components/LoadingStates'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

// HTML 实体映射
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  ' ': '&nbsp;',
  '©': '&copy;',
  '®': '&reg;',
  '™': '&trade;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
}

const REVERSE_ENTITIES: Record<string, string> = Object.fromEntries(
  Object.entries(HTML_ENTITIES).map(([k, v]) => [v, k])
)

export default function HtmlEntity() {
  const text = useI18nSection<any>('pages.htmlEntity')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [encodeAll, setEncodeAll] = useState(false)
  const [copied, setCopied] = useState(false)
  const [converting, setConverting] = useState(false)
  const [error, setError] = useState('')
  
  const { recordToolUsage } = useToolHistory()

  const handleConvert = useCallback(async () => {
    if (!input.trim()) return
    
    setConverting(true)
    setError('')
    
    try {
      let result: string
      if (mode === 'encode') {
        if (encodeAll) {
          // 编码所有字符为数字实体
          result = Array.from(input).map(char => `&#${char.charCodeAt(0)};`).join('')
        } else {
          // 只编码特殊字符
          result = input.replace(/[&<>"']/g, char => HTML_ENTITIES[char] || char)
        }
      } else {
        // 解码
        let decoded = input
        // 解码命名实体
        Object.entries(REVERSE_ENTITIES).forEach(([entity, char]) => {
          decoded = decoded.split(entity).join(char)
        })
        // 解码数字实体
        decoded = decoded.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
        decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
        result = decoded
      }
      
      setOutput(result)
      
      // 记录工具使用
      await recordToolUsage('html-entity', text.toolName, text.toolCategory, {
        mode,
        encodeAll,
        inputLength: input.length,
        outputLength: result.length
      })
    } catch (e) {
      setError(text.convertFailed)
    } finally {
      setConverting(false)
    }
  }, [encodeAll, input, mode, recordToolUsage, text.convertFailed, text.toolCategory, text.toolName])

  const swapMode = useCallback(() => {
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setInput(output)
    setOutput(input)
  }, [mode, input, output])

  const copyOutput = useCallback(async () => {
    if (!output) return
    const success = await copyToClipboard(output)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setError(text.copyFailed)
    }
  }, [output, text.copyFailed])

  const clear = useCallback(() => {
    setInput('')
    setOutput('')
    setError('')
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <p className="text-gray-500">{text.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton toolId="html-entity" />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap justify-center gap-4 mb-6" role="group" aria-label={text.modeSelector}>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('encode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'encode' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={mode === 'encode'}
            aria-label={text.switchToEncode}
            title={text.switchToEncode}
          >
            {text.encode}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'decode' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={mode === 'decode'}
            aria-label={text.switchToDecode}
            title={text.switchToDecode}
          >
            {text.decode}
          </button>
        </div>
        {mode === 'encode' && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              id="encode-all"
              checked={encodeAll}
              onChange={(e) => setEncodeAll(e.target.checked)}
              className="rounded border-gray-300"
              aria-describedby="encode-all-description"
            />
            <span id="encode-all-description">{text.encodeAll}</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="html-input" className="font-medium text-gray-700">
              {mode === 'encode' ? text.inputEncodeLabel : text.inputDecodeLabel}
            </label>
            <button 
              onClick={clear} 
              className="text-gray-400 hover:text-gray-600"
              aria-label={text.clearInput}
              title={text.clearInput}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? text.encodePlaceholder : text.decodePlaceholder}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            aria-describedby="input-description"
            aria-invalid={error ? 'true' : 'false'}
          />
          <div id="input-description" className="sr-only">
            {mode === 'encode' ? text.inputDescriptionEncode : text.inputDescriptionDecode}
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="html-output" className="font-medium text-gray-700">
              {mode === 'encode' ? text.outputEncodeLabel : text.outputDecodeLabel}
            </label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label={text.copyResult}
              title={text.copyResult}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <textarea
            id="html-output"
            value={output}
            readOnly
            placeholder={text.resultPlaceholder}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none bg-gray-50"
            aria-describedby="output-description"
            aria-live="polite"
          />
          <div id="output-description" className="sr-only">
            {mode === 'encode' ? text.outputDescriptionEncode : text.outputDescriptionDecode}
          </div>
          {copied && (
            <p className="text-green-600 text-sm mt-2" role="status" aria-live="polite">{text.copied}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        <LoadingButton
          loading={converting}
          onClick={handleConvert}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors"
          aria-label={mode === 'encode' ? text.executeEncode : text.executeDecode}
          title={mode === 'encode' ? text.executeEncode : text.executeDecode}
        >
          {mode === 'encode' ? text.encode : text.decode}
        </LoadingButton>
        <button
          onClick={swapMode}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          aria-label={text.swap}
          title={text.swapMode}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {text.swap}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {/* Common Entities */}
      <div className="mt-8 bg-orange-50 rounded-xl p-6 border border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-3">{text.commonEntities}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {Object.entries(HTML_ENTITIES).slice(0, 12).map(([char, entity]) => (
            <div key={entity} className="flex items-center justify-between p-2 bg-white rounded-lg">
              <span className="font-mono text-orange-600">{entity}</span>
              <span className="text-gray-600">{char === ' ' ? text.space : char}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
