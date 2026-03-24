import { useState } from 'react'
import { Hash, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { copyToClipboard } from '../../utils/clipboard'

export default function PxToRem() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [baseSize, setBaseSize] = useState(16)
  const [precision, setPrecision] = useState(4)
  const [copied, setCopied] = useState(false)

  const convertPxToRem = (css: string) => {
    return css.replace(/(\d*\.?\d+)px/g, (_match, num) => {
      const px = parseFloat(num)
      const rem = px / baseSize
      return `${parseFloat(rem.toFixed(precision))}rem`
    })
  }

  const convertRemToPx = (css: string) => {
    return css.replace(/(\d*\.?\d+)rem/g, (_match, num) => {
      const rem = parseFloat(num)
      const px = rem * baseSize
      return `${parseFloat(px.toFixed(precision))}px`
    })
  }

  const handleConvert = (direction: 'toRem' | 'toPx') => {
    if (direction === 'toRem') {
      setOutput(convertPxToRem(input))
    } else {
      setOutput(convertRemToPx(input))
    }
  }

  const copyOutput = async () => {
    const success = await copyToClipboard(output)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 快速转换表
  const quickConvert = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center">
          <Hash className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.pxToRem.title')}</h1>
          <p className="text-gray-500">{t('pages.pxToRem.description')}</p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.pxToRem.baseFontSize')}</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={baseSize}
                onChange={(e) => setBaseSize(parseInt(e.target.value) || 16)}
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-500">px</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.pxToRem.precision')}</label>
            <select
              value={precision}
              onChange={(e) => setPrecision(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={2}>{t('pages.pxToRem.precisionOptions.2')}</option>
              <option value={3}>{t('pages.pxToRem.precisionOptions.3')}</option>
              <option value={4}>{t('pages.pxToRem.precisionOptions.4')}</option>
              <option value={5}>{t('pages.pxToRem.precisionOptions.5')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <label className="block font-medium text-gray-700 mb-3">{t('pages.pxToRem.inputLabel')}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`.example {
  font-size: 16px;
  padding: 24px 32px;
  margin-bottom: 20px;
  border-radius: 8px;
}`}
            className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => handleConvert('toRem')}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-emerald-700 transition-colors"
            >
              {t('pages.pxToRem.convertToRem')}
            </button>
            <button
              onClick={() => handleConvert('toPx')}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t('pages.pxToRem.convertToPx')}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <label className="font-medium text-gray-700">{t('pages.pxToRem.outputLabel')}</label>
            <button
              onClick={copyOutput}
              disabled={!output}
              className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              {copied ? t('pages.pxToRem.copied') : t('pages.pxToRem.copy')}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={t('pages.pxToRem.outputPlaceholder')}
            className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none bg-gray-50"
          />
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">{t('pages.pxToRem.quickReferenceTitle', { baseSize })}</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
          {quickConvert.map((px) => (
            <div key={px} className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500">{px}px</p>
              <p className="font-mono font-medium text-emerald-600">
                {parseFloat((px / baseSize).toFixed(precision))}rem
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-emerald-50 rounded-xl p-6 border border-emerald-100">
        <h3 className="font-semibold text-emerald-800 mb-2">{t('pages.pxToRem.whyUseRem')}</h3>
        <ul className="text-emerald-700 text-sm leading-relaxed space-y-1">
          {(t('pages.pxToRem.infoItems', { returnObjects: true }) as string[]).map((item) => (
            <li key={item}>• {item}</li>
          ))}
          <li>• {t('pages.pxToRem.formula', { baseSize })}</li>
        </ul>
      </div>
    </div>
  )
}
