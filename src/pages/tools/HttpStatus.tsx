import { useState } from 'react'
import { Activity, Search, RefreshCw, Globe, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ToolPageLayout from '../../components/ToolPageLayout'
import { LoadingButton, LoadingCard } from '../../components/LoadingStates'
import { Alert } from '../../components/ErrorHandling'

interface HttpResult {
  url: string
  method: string
  statusCode: number
  statusText: string
  responseTime: number
  headers: Record<string, string>
  redirectUrl: string
  contentType: string
  contentLength: string
  server: string
}

const HTTP_METHODS = ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS']

const STATUS_COLORS: Record<string, string> = {
  '1': 'bg-blue-100 text-blue-700',    // 1xx
  '2': 'bg-green-100 text-green-700',  // 2xx
  '3': 'bg-yellow-100 text-yellow-700', // 3xx
  '4': 'bg-orange-100 text-orange-700', // 4xx
  '5': 'bg-red-100 text-red-700',      // 5xx
}

import { API_BASE_URL } from '../../config/api'

export default function HttpStatus() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [method, setMethod] = useState('GET')
  const [followRedirects, setFollowRedirects] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<HttpResult | null>(null)
  const [error, setError] = useState('')
  const [showHeaders, setShowHeaders] = useState(false)

  const handleCheck = async () => {
    if (!url.trim()) {
      setError(t('httpStatus.urlEmpty'))
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/http/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), method, followRedirects })
      })
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.message || t('httpStatus.checkFailed'))
      }
    } catch (err) {
      setError(t('httpStatus.serverError'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (code: number) => {
    const firstDigit = String(code)[0]
    return STATUS_COLORS[firstDigit] || 'bg-gray-100 text-gray-700'
  }

  const getStatusDescription = (code: number) => {
    return t(`httpStatus.status.${code}`, { defaultValue: t('httpStatus.unknownStatus') })
  }

  return (
    <ToolPageLayout
      toolId="http-status"
      title={t('httpStatus.title')}
      description={t('httpStatus.description')}
      icon={Activity}
      iconColor="from-slate-500 to-slate-700"
    >
      {/* Search Box */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white font-medium"
            >
              {HTTP_METHODS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder={t('httpStatus.placeholder')}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <LoadingButton
              loading={loading}
              onClick={handleCheck}
              icon={Search}
              className="px-8 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg font-medium hover:from-slate-700 hover:to-slate-800 transition-colors border-none"
            >
              {t('httpStatus.check')}
            </LoadingButton>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={followRedirects}
              onChange={(e) => setFollowRedirects(e.target.checked)}
              className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
            />
            {t('httpStatus.followRedirects')}
          </label>
        </div>
        {error && (
          <Alert type="error" message={error} className="mt-3" />
        )}
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Status Overview */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-lg text-2xl font-bold ${getStatusColor(result.statusCode)}`}>
                  {result.statusCode}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {result.statusText || getStatusDescription(result.statusCode)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {result.statusText !== getStatusDescription(result.statusCode) && getStatusDescription(result.statusCode) !== t('httpStatus.unknownStatus')
                      ? getStatusDescription(result.statusCode) 
                      : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-5 h-5" />
                <span className="font-medium">{result.responseTime} ms</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('httpStatus.contentType')}</p>
                  <p className="font-medium text-gray-800">{result.contentType || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('httpStatus.contentLength')}</p>
                  <p className="font-medium text-gray-800">{formatBytes(result.contentLength)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('httpStatus.server')}</p>
                  <p className="font-medium text-gray-800">{result.server || '-'}</p>
                </div>
                {result.redirectUrl && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('httpStatus.redirectUrl')}</p>
                    <a 
                      href={result.redirectUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      {result.redirectUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Headers */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <button
              onClick={() => setShowHeaders(!showHeaders)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{t('httpStatus.headers')}</span>
                <span className="text-xs text-gray-400">({Object.keys(result.headers).length})</span>
              </div>
              {showHeaders ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            
            {showHeaders && (
              <div className="px-6 pb-6 pt-2 divide-y divide-gray-50">
                {Object.entries(result.headers).map(([key, value]) => (
                  <div key={key} className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-1">
                    <span className="text-sm font-medium text-gray-500">{key}:</span>
                    <span className="text-sm text-gray-800 sm:col-span-2 font-mono break-all">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolPageLayout>
  )
}

function formatBytes(bytes: string) {
  if (!bytes) return '-'
  const num = parseInt(bytes)
  if (isNaN(num)) return bytes
  if (num < 1024) return `${num} B`
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(2)} KB`
  return `${(num / 1024 / 1024).toFixed(2)} MB`
}

function InfoItem({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      {isLink ? (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:underline flex items-center gap-1 break-all"
        >
          {value}
          <ExternalLink className="w-4 h-4 shrink-0" />
        </a>
      ) : (
        <p className="font-medium text-gray-800 break-all">{value}</p>
      )}
    </div>
  )
}
