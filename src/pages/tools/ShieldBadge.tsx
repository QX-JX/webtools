import { useState } from 'react'
import { Award, Copy, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LazyImage from '../../components/LazyImage'
import { copyToClipboard as copyText } from '../../utils/clipboard'

export default function ShieldBadge() {
  const { t } = useTranslation()
  const [label, setLabel] = useState('version')
  const [message, setMessage] = useState('1.0.0')
  const [color, setColor] = useState('blue')
  const [style, setStyle] = useState('flat')
  const [logo, setLogo] = useState('')
  const [logoColor, setLogoColor] = useState('white')
  const [copied, setCopied] = useState(false)

  const colors = [
    { name: 'brightgreen', hex: '#4c1' },
    { name: 'green', hex: '#97ca00' },
    { name: 'yellow', hex: '#dfb317' },
    { name: 'yellowgreen', hex: '#a4a61d' },
    { name: 'orange', hex: '#fe7d37' },
    { name: 'red', hex: '#e05d44' },
    { name: 'blue', hex: '#007ec6' },
    { name: 'lightgrey', hex: '#9f9f9f' },
    { name: 'success', hex: '#97ca00' },
    { name: 'important', hex: '#fe7d37' },
    { name: 'critical', hex: '#e05d44' },
    { name: 'informational', hex: '#007ec6' },
    { name: 'inactive', hex: '#9f9f9f' },
  ]

  const styles = ['flat', 'flat-square', 'plastic', 'for-the-badge', 'social']

  const logos = ['', 'github', 'npm', 'docker', 'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'nodejs', 'java', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin']

  const generateUrl = () => {
    let url = `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(message)}-${color}`
    const params = new URLSearchParams()
    if (style !== 'flat') params.set('style', style)
    if (logo) params.set('logo', logo)
    if (logo && logoColor !== 'white') params.set('logoColor', logoColor)
    const queryString = params.toString()
    return queryString ? `${url}?${queryString}` : url
  }

  const generateMarkdown = () => {
    return `![${label}](${generateUrl()})`
  }

  const generateHtml = () => {
    return `<img src="${generateUrl()}" alt="${label}">`
  }

  const copyToClipboard = async (text: string) => {
    const success = await copyText(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadSvg = async () => {
    try {
      const response = await fetch(generateUrl())
      const svg = await response.text()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${label}-${message}.svg`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      alert(t('pages.shieldBadge.downloadFailed'))
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center">
          <Award className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('pages.shieldBadge.title')}</h1>
          <p className="text-gray-500">{t('pages.shieldBadge.description')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.shieldBadge.basicSettings')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.shieldBadge.labelField')}</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="version"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.shieldBadge.messageField')}</label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.shieldBadge.color')}</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        color === c.name ? 'border-gray-800 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.shieldBadge.style')}</label>
                <div className="flex flex-wrap gap-2">
                  {styles.map((s) => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        style === s ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.shieldBadge.logoSettings')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.shieldBadge.logo')}</label>
                <select
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  {logos.map((l) => (
                    <option key={l} value={l}>{l || t('pages.shieldBadge.none')}</option>
                  ))}
                </select>
              </div>
              {logo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.shieldBadge.logoColor')}</label>
                  <input
                    type="text"
                    value={logoColor}
                    onChange={(e) => setLogoColor(e.target.value)}
                    placeholder="white"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.shieldBadge.preview')}</h2>
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg min-h-[100px]">
              <LazyImage src={generateUrl()} alt="badge preview" />
            </div>
            <button
              onClick={downloadSvg}
              className="w-full mt-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('pages.shieldBadge.downloadSvg')}
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{t('pages.shieldBadge.codeTitle')}</h2>
            <div className="space-y-4">
              <CodeBlock label="URL" code={generateUrl()} onCopy={copyToClipboard} />
              <CodeBlock label="Markdown" code={generateMarkdown()} onCopy={copyToClipboard} />
              <CodeBlock label="HTML" code={generateHtml()} onCopy={copyToClipboard} />
            </div>
            {copied && <p className="text-green-600 text-sm mt-2">{t('pages.shieldBadge.copiedToClipboard')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ label, code, onCopy }: { label: string; code: string; onCopy: (text: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <button onClick={() => onCopy(code)} className="text-gray-400 hover:text-gray-600">
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <pre className="p-3 bg-gray-50 rounded-lg text-sm font-mono text-gray-700 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
    </div>
  )
}
