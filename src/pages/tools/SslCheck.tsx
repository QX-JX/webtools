import { useState } from 'react'
import { Lock, Search, RefreshCw, Globe, CheckCircle, XCircle, AlertTriangle, Shield, Calendar, Key } from 'lucide-react'
import { useI18nSection } from '../../i18n/helpers'

interface SslResult {
  domain: string
  valid: boolean
  authorizationError: string | null
  subject: {
    commonName: string
    organization: string
    organizationUnit: string
    country: string
    state: string
    locality: string
  }
  issuer: {
    commonName: string
    organization: string
    country: string
  }
  validFrom: string
  validTo: string
  daysRemaining: number
  isExpired: boolean
  isExpiringSoon: boolean
  serialNumber: string
  fingerprint: string
  fingerprint256: string
  subjectAltNames: string[]
  protocol: string
  cipher: {
    name?: string
    version?: string
  }
  chain: Array<{
    subject: Record<string, string>
    issuer: Record<string, string>
    validFrom: string
    validTo: string
  }>
}

import { API_BASE_URL } from '../../config/api'

export default function SslCheck() {
  const text = useI18nSection<any>('pages.sslCheck')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SslResult | null>(null)
  const [error, setError] = useState('')

  const handleCheck = async () => {
    if (!domain.trim()) {
      setError(text.enterDomain)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ssl/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateStr
    }
  }

  const getStatusIcon = () => {
    if (!result) return null
    if (result.isExpired) return <XCircle className="w-12 h-12 text-red-500" />
    if (result.isExpiringSoon) return <AlertTriangle className="w-12 h-12 text-yellow-500" />
    if (result.valid) return <CheckCircle className="w-12 h-12 text-green-500" />
    return <AlertTriangle className="w-12 h-12 text-orange-500" />
  }

  const getStatusColor = () => {
    if (!result) return ''
    if (result.isExpired) return 'bg-red-50 border-red-200'
    if (result.isExpiringSoon) return 'bg-yellow-50 border-yellow-200'
    if (result.valid) return 'bg-green-50 border-green-200'
    return 'bg-orange-50 border-orange-200'
  }

  const getStatusText = () => {
    if (!result) return { title: '', color: '' }
    if (result.isExpired) return { title: text.statusExpired, color: 'text-red-700' }
    if (result.isExpiringSoon) return { title: text.statusExpiringSoon, color: 'text-yellow-700' }
    if (result.valid) return { title: text.statusValid, color: 'text-green-700' }
    return { title: text.statusProblem, color: 'text-orange-700' }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
          <Lock className="w-8 h-8 text-white" />
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
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder={text.inputPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className={`rounded-xl p-6 shadow-sm border ${getStatusColor()}`}>
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div className="flex-1">
                <h2 className={`text-xl font-bold ${getStatusText().color}`}>
                  {getStatusText().title}
                </h2>
                <p className="text-gray-600">
                  {result.isExpired 
                    ? text.expiredDays.replace('{{count}}', String(Math.abs(result.daysRemaining)))
                    : text.remainingDays.replace('{{count}}', String(result.daysRemaining))
                  }
                </p>
                {result.authorizationError && (
                  <p className="text-orange-600 text-sm mt-1">
                    {text.warning.replace('{{message}}', result.authorizationError)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">{text.protocol}</p>
                <p className="font-semibold text-gray-800">{result.protocol || 'TLS'}</p>
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              {text.validityPeriod}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">{text.validFrom}</p>
                <p className="font-medium text-gray-800">{formatDate(result.validFrom)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">{text.validTo}</p>
                <p className="font-medium text-gray-800">{formatDate(result.validTo)}</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.isExpired ? 'bg-red-500' :
                    result.isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.max(0, Math.min(100, (result.daysRemaining / 365) * 100))}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Certificate Info */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {text.certificateInfo}
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{text.subject}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoRow label={text.commonName} value={result.subject.commonName} />
                  <InfoRow label={text.organization} value={result.subject.organization} />
                  <InfoRow label={text.organizationUnit} value={result.subject.organizationUnit} />
                  <InfoRow label={text.country} value={result.subject.country} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{text.issuer}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <InfoRow label={text.commonName} value={result.issuer.commonName} />
                  <InfoRow label={text.organization} value={result.issuer.organization} />
                </div>
              </div>
            </div>
          </div>

          {/* SAN */}
          {result.subjectAltNames.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {text.subjectAltNames.replace('{{count}}', String(result.subjectAltNames.length))}
              </h2>
              <div className="flex flex-wrap gap-2">
                {result.subjectAltNames.map((name, index) => (
                  <span key={index} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-mono">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-green-600" />
              {text.technicalDetails}
            </h2>
            <div className="space-y-2">
              <InfoRow label={text.serialNumber} value={result.serialNumber} mono />
              <InfoRow label={text.fingerprintSha1} value={result.fingerprint} mono />
              <InfoRow label={text.fingerprintSha256} value={result.fingerprint256} mono />
              {result.cipher?.name && (
                <InfoRow label={text.cipherSuite} value={result.cipher.name} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-green-50 rounded-xl p-6 border border-green-100">
        <h3 className="font-semibold text-green-800 mb-2">{text.infoTitle}</h3>
        <ul className="text-green-700 text-sm leading-relaxed space-y-1">
          {text.infoItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center py-2 border-b border-gray-100 last:border-0">
      <span className="w-40 text-gray-500 text-sm shrink-0">{label}</span>
      <span className={`text-gray-800 break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
