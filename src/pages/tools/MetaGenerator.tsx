import { useState } from 'react'
import { FileText, Copy, Eye } from 'lucide-react'
import LazyImage from '../../components/LazyImage'
import { copyToClipboard } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

export default function MetaGenerator() {
  const text = useI18nSection<any>('pages.metaGenerator')
  const [form, setForm] = useState({
    title: '',
    description: '',
    keywords: '',
    author: '',
    robots: 'index, follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogUrl: '',
    twitterCard: 'summary_large_image',
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'UTF-8',
    language: 'zh-CN',
  })
  const [copied, setCopied] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const generateMeta = () => {
    const lines: string[] = []
    
    lines.push(`<meta charset="${form.charset}">`)
    lines.push(`<meta name="viewport" content="${form.viewport}">`)
    
    if (form.title) lines.push(`<title>${form.title}</title>`)
    if (form.description) lines.push(`<meta name="description" content="${form.description}">`)
    if (form.keywords) lines.push(`<meta name="keywords" content="${form.keywords}">`)
    if (form.author) lines.push(`<meta name="author" content="${form.author}">`)
    if (form.robots) lines.push(`<meta name="robots" content="${form.robots}">`)
    if (form.language) lines.push(`<meta http-equiv="content-language" content="${form.language}">`)
    
    // Open Graph
    if (form.ogTitle || form.title) {
      lines.push('')
      lines.push('<!-- Open Graph / Facebook -->')
      lines.push('<meta property="og:type" content="website">')
      lines.push(`<meta property="og:title" content="${form.ogTitle || form.title}">`)
      if (form.ogDescription || form.description) {
        lines.push(`<meta property="og:description" content="${form.ogDescription || form.description}">`)
      }
      if (form.ogImage) lines.push(`<meta property="og:image" content="${form.ogImage}">`)
      if (form.ogUrl) lines.push(`<meta property="og:url" content="${form.ogUrl}">`)
    }
    
    // Twitter
    if (form.twitterCard) {
      lines.push('')
      lines.push('<!-- Twitter -->')
      lines.push(`<meta name="twitter:card" content="${form.twitterCard}">`)
      lines.push(`<meta name="twitter:title" content="${form.ogTitle || form.title}">`)
      if (form.ogDescription || form.description) {
        lines.push(`<meta name="twitter:description" content="${form.ogDescription || form.description}">`)
      }
      if (form.ogImage) lines.push(`<meta name="twitter:image" content="${form.ogImage}">`)
    }
    
    return lines.join('\n')
  }

  const copyCode = async () => {
    const success = await copyToClipboard(generateMeta())
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.basicInfo}</h2>
            <div className="space-y-4">
              <FormField label={text.labels.title} name="title" value={form.title} onChange={handleChange} placeholder={text.placeholders.title} />
              <FormField label={text.labels.description} name="description" value={form.description} onChange={handleChange} placeholder={text.placeholders.description} textarea />
              <FormField label={text.labels.keywords} name="keywords" value={form.keywords} onChange={handleChange} placeholder={text.placeholders.keywords} />
              <FormField label={text.labels.author} name="author" value={form.author} onChange={handleChange} placeholder={text.placeholders.author} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.robots}</label>
                <select name="robots" value={form.robots} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {text.robotsOptions.map((item: any) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.socialMedia}</h2>
            <div className="space-y-4">
              <FormField label={text.labels.ogTitle} name="ogTitle" value={form.ogTitle} onChange={handleChange} placeholder={text.placeholders.ogTitle} />
              <FormField label={text.labels.ogDescription} name="ogDescription" value={form.ogDescription} onChange={handleChange} placeholder={text.placeholders.ogDescription} textarea />
              <FormField label={text.labels.ogImage} name="ogImage" value={form.ogImage} onChange={handleChange} placeholder={text.placeholders.ogImage} />
              <FormField label={text.labels.ogUrl} name="ogUrl" value={form.ogUrl} onChange={handleChange} placeholder={text.placeholders.ogUrl} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.twitterCard}</label>
                <select name="twitterCard" value={form.twitterCard} onChange={handleChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {text.twitterOptions.map((item: any) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                {text.generatedCode}
              </h2>
              <button
                onClick={copyCode}
                className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {copied ? text.copied : text.copy}
              </button>
            </div>
            <pre className="p-4 bg-gray-800 text-gray-100 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
              {generateMeta()}
            </pre>
          </div>

          {/* Search Preview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">{text.searchPreview}</h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                {form.title || text.searchPreviewTitleFallback}
              </p>
              <p className="text-green-700 text-sm">{form.ogUrl || 'https://example.com'}</p>
              <p className="text-gray-600 text-sm mt-1">
                {form.description || text.searchPreviewDescriptionFallback}
              </p>
            </div>
          </div>

          {/* Social Preview */}
          {form.ogImage && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">{text.socialPreview}</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <LazyImage src={form.ogImage} alt="OG Preview" className="w-full h-48 object-cover bg-gray-100" onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                <div className="p-4">
                  <p className="font-semibold text-gray-800">{form.ogTitle || form.title || text.socialPreviewTitleFallback}</p>
                  <p className="text-sm text-gray-500 mt-1">{form.ogDescription || form.description || text.socialPreviewDescriptionFallback}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FormField({ label, name, value, onChange, placeholder, textarea }: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      ) : (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      )}
    </div>
  )
}
