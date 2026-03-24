import { useState, useCallback } from 'react'
import { Link, ArrowRightLeft, Copy, Trash2 } from 'lucide-react'
import { Alert } from '../../components/ErrorHandling'
import { LoadingButton } from '../../components/LoadingStates'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function UrlEncode() {
  const text = useI18nSection<any>('pages.urlEncode')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [encodeType, setEncodeType] = useState<'component' | 'full'>('component')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [converting, setConverting] = useState(false)

  const { recordToolUsage } = useToolHistory()

  const handleConvert = useCallback(async () => {
    if (!input.trim()) return

    setConverting(true)
    setError('')

    try {
      let result: string
      if (mode === 'encode') {
        result = encodeType === 'component'
          ? encodeURIComponent(input)
          : encodeURI(input)
      } else {
        result = encodeType === 'component'
          ? decodeURIComponent(input)
          : decodeURI(input)
      }

      setOutput(result)

      // 记录工具使用
      recordToolUsage('url-encode', text.toolName, text.toolCategory, {
        mode,
        encodeType,
        inputLength: input.length,
        outputLength: result.length
      })
    } catch (e) {
      setError(text.convertFailed)
    } finally {
      setConverting(false)
    }
  }, [encodeType, input, mode, recordToolUsage, text.convertFailed, text.toolCategory, text.toolName])

  const swapMode = useCallback(() => {
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setInput(output)
    setOutput(input)
    setError('')
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
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
            <Link className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
            <p className="text-gray-500">{text.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton toolId="url-encode" />
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap justify-center gap-4 mb-6" role="group" aria-label={text.modeSelector}>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('encode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'encode' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={mode === 'encode'}
          >
            {text.encode}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'decode' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={mode === 'decode'}
          >
            {text.decode}
          </button>
        </div>
        <div className="inline-flex bg-gray-100 rounded-lg p-1" role="group" aria-label={text.typeSelector}>
          <button
            onClick={() => setEncodeType('component')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              encodeType === 'component' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={encodeType === 'component'}
            title={text.componentDescription}
          >
            {text.componentTitle}
          </button>
          <button
            onClick={() => setEncodeType('full')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              encodeType === 'full' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600'
            }`}
            aria-pressed={encodeType === 'full'}
            title={text.fullDescription}
          >
            {text.fullTitle}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="url-input" className="font-medium text-gray-700">
              {mode === 'encode' ? text.inputEncodeLabel : text.inputDecodeLabel}
            </label>
            <button
              onClick={clear}
              className="text-gray-400 hover:text-gray-600"
              aria-label={text.clearInput}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            id="url-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? text.encodePlaceholder : text.decodePlaceholder}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-invalid={error ? 'true' : 'false'}
          />
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label htmlFor="url-output" className="font-medium text-gray-700">
              {mode === 'encode' ? text.outputEncodeLabel : text.outputDecodeLabel}
            </label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label={text.copyResult}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <textarea
            id="url-output"
            value={output}
            readOnly
            placeholder={text.resultPlaceholder}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none bg-gray-50"
            aria-live="polite"
          />
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
          className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-colors"
        >
          {mode === 'encode' ? text.encode : text.decode}
        </LoadingButton>
        <button
          onClick={swapMode}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
          aria-label={text.swapInputOutput}
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

      {/* Info */}
      <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-green-700 text-sm leading-relaxed space-y-2">
          <li>
            <strong>{text.componentModeTitle}</strong>：{text.componentModeDescription}
            <br />
            <span className="text-green-600">{text.componentExample}</span>
          </li>
          <li>
            <strong>{text.fullModeTitle}</strong>：{text.fullModeDescription}
            <br />
            <span className="text-green-600">{text.fullExample}</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
