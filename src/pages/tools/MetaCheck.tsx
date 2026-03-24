import { useState } from 'react'
import { Search, Globe, Loader2, Tag, FileText, Share2, Settings } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

interface MetaTag {
  name: string
  content: string
  type: string
}

interface MetaResult {
  url: string
  metaTags: MetaTag[]
  totalCount: number
}

import { API_BASE_URL } from '../../config/api'

export default function MetaCheck() {
  const text = useI18nSection<any>('pages.metaCheck')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MetaResult | null>(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!url.trim()) {
      setError(text.enterUrl)
      return
    }
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`${API_BASE_URL}/api/meta/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err: any) {
      setError(err.message || text.checkFailed)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return <FileText className="w-4 h-4" />
      case 'property': return <Share2 className="w-4 h-4" />
      case 'http-equiv': return <Settings className="w-4 h-4" />
      default: return <Tag className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'bg-purple-100 text-purple-700'
      case 'property': return 'bg-blue-100 text-blue-700'
      case 'http-equiv': return 'bg-orange-100 text-orange-700'
      case 'charset': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const groupedTags = result?.metaTags.reduce((acc, tag) => {
      const group = tag.type === 'property' && tag.name.startsWith('og:') ? 'Open Graph'
        : tag.type === 'property' && tag.name.startsWith('twitter:') ? 'Twitter Card'
      : tag.type === 'title' ? text.groups.pageTitle
      : tag.type === 'http-equiv' ? text.groups.httpEquiv
      : tag.type === 'charset' ? text.groups.charset
      : text.groups.basicMeta
    if (!acc[group]) acc[group] = []
    acc[group].push(tag)
    return acc
  }, {} as Record<string, MetaTag[]>)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center">
          <Search className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{text.urlLabel}</label>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder={text.inputPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {text.check}
          </button>
        </div>
        {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
      </div>

      {result && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">{text.resultTitle}</h2>
              <span className="text-sm text-gray-500">{text.totalCount.replace('{{count}}', String(result.totalCount))}</span>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg break-all">{result.url}</p>
          </div>

          {groupedTags && Object.entries(groupedTags).map(([group, tags]) => (
            <div key={group} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">{group} ({tags.length})</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {tags.map((tag, idx) => (
                  <div key={idx} className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getTypeColor(tag.type)}`}>
                        {getTypeIcon(tag.type)}
                        {tag.name}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-700 text-sm break-all bg-gray-50 px-3 py-2 rounded">
                      {tag.content || <span className="text-gray-400 italic">{text.emptyContent}</span>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-amber-50 rounded-xl p-6 border border-amber-100">
        <h3 className="font-semibold text-amber-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-amber-700 text-sm space-y-1">
          {text.infoItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
