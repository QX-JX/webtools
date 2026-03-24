import { useState } from 'react'
import { FileCode, Search, RefreshCw, Globe, CheckCircle, XCircle, Zap } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

interface GzipResult {
  url: string
  isCompressed: boolean
  compressionType: string
  isGzipEnabled: boolean
  isDeflateEnabled: boolean
  isBrEnabled: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: number | null
  contentType: string
  transferEncoding: string
}

import { API_BASE_URL } from '../../config/api'

export default function GzipCheck() {
  const text = useI18nSection<any>('pages.gzipCheck')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GzipResult | null>(null)
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
      const response = await fetch(`${API_BASE_URL}/api/gzip/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      })
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.message || text.checkFailed)
      }
    } catch (err) {
      setError(text.serverConnectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-pink-600 rounded-2xl flex items-center justify-center">
          <FileCode className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder={text.inputPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-pink-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {text.check}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Status Overview */}
          <div className={`rounded-xl p-6 shadow-sm border ${
            result.isCompressed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-4">
              {result.isCompressed ? (
                <CheckCircle className="w-12 h-12 text-green-500" />
              ) : (
                <XCircle className="w-12 h-12 text-red-500" />
              )}
              <div>
                <h2 className={`text-xl font-bold ${result.isCompressed ? 'text-green-700' : 'text-red-700'}`}>
                  {result.isCompressed ? text.enabled : text.disabled}
                </h2>
                <p className={`${result.isCompressed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.isCompressed 
                    ? text.compressionType.replace('{{type}}', result.compressionType.toUpperCase())
                    : text.enableSuggestion
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Compression Types */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{text.supportTitle}</h2>
            <div className="grid grid-cols-3 gap-4">
              <CompressionCard 
                name="Gzip" 
                enabled={result.isGzipEnabled}
                description={text.gzipDescription}
              />
              <CompressionCard 
                name="Deflate" 
                enabled={result.isDeflateEnabled}
                description={text.deflateDescription}
              />
              <CompressionCard 
                name="Brotli" 
                enabled={result.isBrEnabled}
                description={text.brotliDescription}
              />
            </div>
          </div>

          {/* Size Info */}
          {(result.originalSize > 0 || result.compressedSize > 0) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-500" />
                {text.effectTitle}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{text.originalSize}</p>
                  <p className="text-2xl font-bold text-gray-800">{formatBytes(result.originalSize)}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">{text.compressedSize}</p>
                  <p className="text-2xl font-bold text-gray-800">{formatBytes(result.compressedSize)}</p>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <p className="text-sm text-pink-600 mb-1">{text.ratio}</p>
                  <p className="text-2xl font-bold text-pink-600">
                    {result.compressionRatio !== null ? `${result.compressionRatio}%` : '-'}
                  </p>
                </div>
              </div>
              {result.compressionRatio !== null && result.compressionRatio > 0 && (
                <div className="mt-4">
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-full transition-all duration-500"
                      style={{ width: `${result.compressionRatio}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    {text.savedTransfer.replace('{{value}}', formatBytes(result.originalSize - result.compressedSize))}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{text.detailsTitle}</h2>
            <div className="space-y-3">
              <InfoRow label="URL" value={result.url} />
              <InfoRow label="Content-Type" value={result.contentType || '-'} />
              <InfoRow label="Content-Encoding" value={result.compressionType || 'none'} />
              <InfoRow label="Transfer-Encoding" value={result.transferEncoding || '-'} />
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-pink-50 rounded-xl p-6 border border-pink-100">
        <h3 className="font-semibold text-pink-800 mb-2">{text.whyTitle}</h3>
        <ul className="text-pink-700 text-sm leading-relaxed space-y-1">
          {text.whyItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function CompressionCard({ name, enabled, description }: { name: string; enabled: boolean; description: string }) {
  return (
    <div className={`p-4 rounded-lg border-2 text-center ${
      enabled 
        ? 'border-green-300 bg-green-50' 
        : 'border-gray-200 bg-gray-50'
    }`}>
      <div className="flex justify-center mb-2">
        {enabled ? (
          <CheckCircle className="w-8 h-8 text-green-500" />
        ) : (
          <XCircle className="w-8 h-8 text-gray-400" />
        )}
      </div>
      <p className={`font-semibold ${enabled ? 'text-green-700' : 'text-gray-500'}`}>{name}</p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex border-b border-gray-100 pb-2">
      <span className="w-40 text-gray-500 text-sm">{label}</span>
      <span className="flex-1 text-gray-800 font-mono text-sm break-all">{value}</span>
    </div>
  )
}
