import { useState } from 'react'
import { Mail, Copy, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { copyToClipboard as copyText } from '../../utils/clipboard'

export default function EmailEncrypt() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const encodeToUnicode = (str: string) => {
    return Array.from(str).map(char => `&#${char.charCodeAt(0)};`).join('')
  }

  const encodeToHex = (str: string) => {
    return Array.from(str).map(char => `&#x${char.charCodeAt(0).toString(16)};`).join('')
  }

  const encodeToJs = (str: string) => {
    const encoded = Array.from(str).map(char => `\\x${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    return `<script>document.write("${encoded}")</script>`
  }

  const encodeToMailto = (str: string) => {
    const encoded = encodeToUnicode(str)
    return `<a href="mailto:${encoded}">${encoded}</a>`
  }

  const encodeToCss = (str: string) => {
    const id = 'email-' + Math.random().toString(36).substr(2, 9)
    const reversed = str.split('').reverse().join('')
    return `<style>#${id}::after{content:"${reversed}";direction:rtl;unicode-bidi:bidi-override}</style><span id="${id}"></span>`
  }

  const copyToClipboard = async (text: string, type: string) => {
    const success = await copyText(text)
    if (success) {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const results = email ? [
    { id: 'unicodeDecimal', name: t('pages.emailEncrypt.results.unicodeDecimal.name'), code: encodeToUnicode(email), desc: t('pages.emailEncrypt.results.unicodeDecimal.description') },
    { id: 'unicodeHex', name: t('pages.emailEncrypt.results.unicodeHex.name'), code: encodeToHex(email), desc: t('pages.emailEncrypt.results.unicodeHex.description') },
    { id: 'javascript', name: t('pages.emailEncrypt.results.javascript.name'), code: encodeToJs(email), desc: t('pages.emailEncrypt.results.javascript.description') },
    { id: 'mailto', name: t('pages.emailEncrypt.results.mailto.name'), code: encodeToMailto(email), desc: t('pages.emailEncrypt.results.mailto.description') },
    { id: 'cssReverse', name: t('pages.emailEncrypt.results.cssReverse.name'), code: encodeToCss(email), desc: t('pages.emailEncrypt.results.cssReverse.description') },
  ] : []

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.emailEncrypt.title')}</h1>
          <p className="text-gray-500">{t('pages.emailEncrypt.description')}</p>
        </div>
      </div>

      {/* Input */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.emailEncrypt.inputLabel')}</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@domain.com"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{result.name}</h3>
                  <p className="text-sm text-gray-500">{result.desc}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(result.code, result.name)}
                  className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied === result.name ? t('pages.emailEncrypt.copied') : t('pages.emailEncrypt.copy')}
                </button>
              </div>
              <pre className="p-4 bg-gray-50 rounded-lg overflow-x-auto text-sm font-mono text-gray-700 whitespace-pre-wrap break-all">
                {result.code}
              </pre>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-rose-50 rounded-xl p-6 border border-rose-100">
        <h3 className="font-semibold text-rose-800 mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t('pages.emailEncrypt.infoTitle')}
        </h3>
        <ul className="text-rose-700 text-sm leading-relaxed space-y-1">
          {(t('pages.emailEncrypt.infoItems', { returnObjects: true }) as string[]).map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
