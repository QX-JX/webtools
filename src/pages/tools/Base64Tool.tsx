import { useState, useCallback, useRef } from 'react'
import { Binary, ArrowRightLeft, Copy, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ErrorHandling'
import { LoadingButton } from '../../components/LoadingStates'
import { useToolHistory } from '../../hooks/useToolHistory'
import { FavoriteButton } from '../../components/FavoriteButton'
import { useResponsive } from '../../hooks/useResponsive'
import { copyToClipboard } from '../../utils/clipboard'

export default function Base64Tool() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [mode, setMode] = useState<'encode' | 'decode'>('encode')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [converting, setConverting] = useState(false)
  
  const { recordToolUsage } = useToolHistory()
  const { isMobile } = useResponsive()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLTextAreaElement>(null)

  const handleConvert = useCallback(async () => {
    if (!input.trim()) {
      setError(t('base64.inputPlaceholder'))
      return
    }

    setError('')
    setConverting(true)
    
    try {
      // 模拟异步操作，让UI更流畅
      await new Promise(resolve => setTimeout(resolve, 100))
      
      let result: string
      if (mode === 'encode') {
        // 编码：支持中文
        const encoded = btoa(unescape(encodeURIComponent(input)))
        setOutput(encoded)
        result = encoded
      } else {
        // 解码
        const decoded = decodeURIComponent(escape(atob(input)))
        setOutput(decoded)
        result = decoded
      }
      
      // 记录工具使用历史
      recordToolUsage(
        'base64-tool',
        t('base64.title'),
        mode === 'encode' ? t('base64.encode') : t('base64.decode'),
        { mode, inputLength: input.length },
        { outputLength: result.length }
      )
    } catch (e) {
      setError(mode === 'decode' ? t('base64.decodeError') : t('base64.encodeError'))
    } finally {
      setConverting(false)
    }
  }, [input, mode, recordToolUsage, t])

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
    }
  }, [output])

  const clear = useCallback(() => {
    setInput('')
    setOutput('')
    setError('')
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" role="main" aria-label={t('base64.ariaLabel')}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center">
          <Binary className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t('base64.title')}</h1>
          <p className="text-gray-500">{t('base64.description')}</p>
        </div>
        <FavoriteButton
          toolId="base64-tool"
          size={isMobile ? 'sm' : 'md'}
          variant="outline"
          showLabel={false}
        />
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-6" role="group" aria-label={t('base64.modeSelection')}>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('encode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'encode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
            role="radio"
            aria-checked={mode === 'encode'}
            aria-label={t('base64.encodeMode')}
            tabIndex={0}
          >
            {t('base64.encode')}
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              mode === 'decode' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
            }`}
            role="radio"
            aria-checked={mode === 'decode'}
            aria-label={t('base64.decodeMode')}
            tabIndex={0}
          >
            {t('base64.decode')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label className="font-medium text-gray-700" htmlFor="base64-input">
              {mode === 'encode' ? t('base64.originalText') : t('base64.base64String')}
            </label>
            <button 
              onClick={clear} 
              className="text-gray-400 hover:text-gray-600"
              aria-label={t('base64.clear')}
              title={`${t('base64.clear')} (Ctrl+L)`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            ref={inputRef}
            id="base64-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? t('base64.placeholderEncode') : t('base64.placeholderDecode')}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={mode === 'encode' ? t('base64.inputLabelEncode') : t('base64.inputLabelDecode')}
            aria-describedby="input-help"
          />
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <label className="font-medium text-gray-700" htmlFor="base64-output">
              {mode === 'encode' ? t('base64.base64Result') : t('base64.decodeResult')}
            </label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              aria-label={t('base64.copy')}
              title={`${t('base64.copy')} (Ctrl+C)`}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <textarea
            ref={outputRef}
            id="base64-output"
            value={output}
            readOnly
            placeholder={t('base64.resultPlaceholder')}
            className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none bg-gray-50"
            aria-label={mode === 'encode' ? t('base64.outputLabelEncode') : t('base64.outputLabelDecode')}
            aria-describedby="output-help"
          />
          {output && (
            <div id="output-help" className="mt-2 text-sm text-gray-500">
              {t('base64.charCount', { count: output.length })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">
        <LoadingButton
          loading={converting}
          onClick={handleConvert}
          className="px-10"
        >
          {t('base64.convert')}
        </LoadingButton>
        <button
          onClick={swapMode}
          className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          title={t('base64.swap')}
        >
          <ArrowRightLeft className="w-4 h-4" />
          {t('base64.swap')}
        </button>
      </div>

      {error && (
        <div className="mt-6">
          <Alert type="error" message={error} />
        </div>
      )}

      {copied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm shadow-xl animate-fade-in-up">
          {t('base64.copied')}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-indigo-50 rounded-xl p-6 border border-indigo-100">
        <h3 className="font-semibold text-indigo-800 mb-2">{t('base64.whatIsBase64')}</h3>
        <p className="text-indigo-700 text-sm leading-relaxed">
          {t('base64.base64Info')}
        </p>
      </div>
    </div>
  )
}
