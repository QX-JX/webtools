import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Search, Calendar, Server, User, Shield, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { LoadingButton, LoadingCard } from '../../components/LoadingStates'
import { Alert } from '../../components/ErrorHandling'
import { useAsync } from '../../hooks/useAsync'
import { FormValidator, ValidationRules, commonRules, sanitizers } from '../../utils/validation'
import { useResponsive } from '../../hooks/useResponsive'
import ResponsiveContainer, { ResponsiveText, ResponsiveGrid } from '../../components/ResponsiveLayout'
import ExportFormatSelector from '../../components/ExportFormatSelector'
import { ToolExporter, ExportFormat, ExportOptions } from '../../utils/export'
import { useToolHistory } from '../../hooks/useToolHistory'
import FavoriteButton from '../../components/FavoriteButton'
import { copyToClipboard } from '../../utils/clipboard'

import { API_BASE_URL } from '../../config/api'

interface WhoisResult {
  domainName: string
  registrar: string
  registrarUrl: string
  creationDate: string
  expirationDate: string
  updatedDate: string
  nameServers: string | string[]
  status: string | string[]
  registrant: {
    name: string
    organization: string
    country: string
    email: string
  }
  admin: {
    name: string
    email: string
  }
  tech: {
    name: string
    email: string
  }
  dnssec: string
  raw: Record<string, unknown>
}

export default function WhoisLookup() {
  const { t } = useTranslation()
  const [domain, setDomain] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [copied, setCopied] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string[] }>({})
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({})
  const { isMobile } = useResponsive()
  const { recordToolUsage } = useToolHistory()
  
  // 引用DOM元素
  const domainInputRef = useRef<HTMLInputElement>(null)
  
  // 设置验证规则
  const validationRules: ValidationRules = {
    domain: {
      required: true,
      minLength: 3,
      maxLength: 253,
      pattern: commonRules.domain.pattern,
      message: t('whois.invalidDomain')
    }
  }
  
  const validator = new FormValidator(validationRules)

  const { data: result, loading, error, execute: handleLookup, setError } = useAsync<WhoisResult>(
    async (domain: string) => {
      const response = await fetch(`${API_BASE_URL}/api/whois/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
      })
      const data = await response.json()
      
      if (data.success) {
        // 记录工具使用历史
        recordToolUsage(
          'whois-lookup',
          t('whois.title'),
          t('categories.detection'),
          { domain },
          data.data
        )
        return data.data
      } else {
        throw new Error(data.message || t('errors.somethingWentWrong'))
      }
    }
  )

  const validateField = (fieldName: string, value: string) => {
    const validationResult = validator.validate({ [fieldName]: value })
    setValidationErrors(prev => ({ ...prev, [fieldName]: validationResult.errors[fieldName] || [] }))
    return validationResult.errors[fieldName] || []
  }
  
  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }))
    validateField(fieldName, domain)
  }
  
  const handleDomainChange = (value: string) => {
    setDomain(value)
    // 如果字段已经被触摸过，实时验证
    if (touchedFields.domain) {
      validateField('domain', value)
    }
  }
  
  const handleSubmit = async () => {
    // 标记所有字段为已触摸
    setTouchedFields({ domain: true })
    
    // 验证整个表单
    const validationResult = validator.validate({ domain })
    setValidationErrors(validationResult.errors)
    
    if (!validationResult.isValid) {
      return
    }
    
    // 清理域名并查询
    const sanitizedDomain = sanitizers.removeSpaces(domain)
    await handleLookup(sanitizedDomain)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const formatArray = (value: string | string[]): string[] => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(/[\s,]+/).filter(Boolean)
    return []
  }

  const handleCopyToClipboard = async () => {
    if (result) {
      const success = await copyToClipboard(JSON.stringify(result.raw, null, 2))
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }
  }

  const getDaysUntilExpiry = (expirationDate: string) => {
    if (!expirationDate) return null
    try {
      const expiry = new Date(expirationDate)
      const now = new Date()
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return days
    } catch {
      return null
    }
  }

  return (
    <ResponsiveContainer className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center ${
            isMobile ? 'w-12 h-12' : 'w-14 h-14'
          }`}>
            <Globe className={`text-white ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          <div className="flex-1">
            <ResponsiveText 
              size={{ mobile: 'xl', tablet: '2xl', desktop: '2xl', large: '3xl' }}
              weight="bold"
              color="text-gray-900"
              className="mb-1"
            >
              {t('whois.title')}
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'sm', tablet: 'base', desktop: 'base', large: 'base' }}
              color="text-gray-500"
            >
              {t('whois.description')}
            </ResponsiveText>
          </div>
        </div>
        <FavoriteButton
          toolId="whois-lookup"
          size={isMobile ? 'sm' : 'md'}
          variant="outline"
          showLabel={false}
        />
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6" role="form" aria-label={t('whois.title')}>
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <div className="flex-1 relative">
            <Globe className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
              isMobile ? 'left-3 w-4 h-4' : 'left-4 w-5 h-5'
            }`} />
            <input
              ref={domainInputRef}
              type="text"
              value={domain}
              onChange={(e) => handleDomainChange(e.target.value)}
              onBlur={() => handleFieldBlur('domain')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('whois.placeholder')}
              aria-label={t('whois.placeholder')}
              aria-required="true"
              aria-invalid={validationErrors.domain && validationErrors.domain.length > 0}
              aria-describedby={validationErrors.domain && validationErrors.domain.length > 0 ? 'domain-error' : undefined}
              className={`w-full border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                isMobile ? 'pl-10 pr-3 py-2 text-sm' : 'pl-12 pr-4 py-3'
              } ${
                validationErrors.domain && validationErrors.domain.length > 0
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : touchedFields.domain && !validationErrors.domain?.length
                  ? 'border-green-300 focus:ring-green-500 bg-green-50'
                  : 'border-gray-200 focus:ring-purple-500'
              }`}
            />
            {validationErrors.domain && validationErrors.domain.length > 0 && (
              <div 
                id="domain-error"
                className={`absolute left-0 text-red-600 ${
                  isMobile ? '-bottom-5 text-xs' : '-bottom-6 text-xs'
                }`}
                role="alert"
                aria-live="polite"
              >
                {validationErrors.domain[0]}
              </div>
            )}
            {touchedFields.domain && !validationErrors.domain?.length && domain && (
              <div 
                className={`absolute left-0 text-green-600 ${
                  isMobile ? '-bottom-5 text-xs' : '-bottom-6 text-xs'
                }`}
                role="status"
                aria-live="polite"
              >
                {t('dns.validFormat')}
              </div>
            )}
          </div>
          <LoadingButton
            loading={loading}
            onClick={handleSubmit}
            disabled={!domain || validationErrors.domain?.length > 0}
            className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium hover:from-purple-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobile ? 'px-4 py-2 text-sm rounded-lg' : 'px-6 py-3 rounded-lg'
            }`}
            aria-label={t('whois.search')}
            aria-busy={loading}
          >
            <Search className={`mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            {t('common.search')}
          </LoadingButton>
        </div>
        {error && (
          <Alert 
            type="error" 
            title={t('errors.lookupFailed')} 
            message={error} 
            className="mt-3"
            onClose={() => setError(null)}
          />
        )}
      </div>

      {/* Result */}
      {loading && (
        <LoadingCard 
          title={t('whois.querying')} 
          description={t('whois.queryingDesc')}
          role="status"
          aria-live="polite"
        />
      )}
      
      {result && !loading && (
        <div className="space-y-3 md:space-y-4" role="region" aria-label={t('whois.title')}>
          {/* Domain Overview */}
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100" role="region" aria-label={t('whois.domainInfo')}>
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
              <ResponsiveText size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg', large: 'xl' }} weight="semibold" color="text-gray-800">
                {t('whois.domainInfo')}
              </ResponsiveText>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center gap-3'}`}>
                {result.expirationDate && (() => {
                  const days = getDaysUntilExpiry(result.expirationDate)
                  if (days === null) return null
                  const isExpiringSoon = days <= 30
                  const isExpired = days < 0
                  return (
                    <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-medium ${
                      isExpired ? 'bg-red-100 text-red-700' :
                      isExpiringSoon ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {isExpired ? t('whois.expired', { days: Math.abs(days) }) :
                       isExpiringSoon ? t('whois.expiringSoon', { days }) :
                       t('whois.remaining', { days })}
                    </span>
                  )
                })()}
                <ExportFormatSelector
                  onExport={async (_format: ExportFormat, options: ExportOptions) => {
                    ToolExporter.exportWhoisResults(result, domain, options)
                  }}
                  buttonText={t('dns.export')}
                  className={isMobile ? 'w-full' : ''}
                  aria-label={t('dns.export')}
                />
              </div>
            </div>
            
            <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2, large: 2 }} gap={{ mobile: 4, tablet: 4, desktop: 6, large: 6 }}>
              <InfoItem icon={Globe} label={t('whois.domain')} value={result.domainName} />
              <InfoItem icon={Server} label={t('whois.registrar')} value={result.registrar} />
              <InfoItem icon={Calendar} label={t('whois.creationDate')} value={formatDate(result.creationDate)} />
              <InfoItem icon={Calendar} label={t('whois.expirationDate')} value={formatDate(result.expirationDate)} />
              <InfoItem icon={Calendar} label={t('whois.updatedDate')} value={formatDate(result.updatedDate)} />
              <InfoItem icon={Shield} label={t('whois.dnssec')} value={result.dnssec || t('whois.dnssecDisabled')} />
            </ResponsiveGrid>
          </div>

          {/* Name Servers */}
          {result.nameServers && formatArray(result.nameServers).length > 0 && (
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100" role="region" aria-label={t('whois.dnsServer')}>
              <ResponsiveText size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg', large: 'xl' }} weight="semibold" color="text-gray-800" className="mb-4 flex items-center gap-2">
                <Server className={`text-purple-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                {t('whois.dnsServer')}
              </ResponsiveText>
              <div className="flex flex-wrap gap-2" role="list" aria-label={t('whois.dnsServer')}>
                {formatArray(result.nameServers).map((ns, index) => (
                  <span key={index} className={`px-2 py-1 md:px-3 md:py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs md:text-sm font-mono`} role="listitem">
                    {ns}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          {result.status && formatArray(result.status).length > 0 && (
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100" role="region" aria-label={t('whois.domainStatus')}>
              <ResponsiveText size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg', large: 'xl' }} weight="semibold" color="text-gray-800" className="mb-4 flex items-center gap-2">
                <Shield className={`text-purple-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                {t('whois.domainStatus')}
              </ResponsiveText>
              <div className="flex flex-wrap gap-2" role="list" aria-label={t('whois.domainStatus')}>
                {formatArray(result.status).map((status, index) => (
                  <span key={index} className={`px-2 py-1 md:px-3 md:py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs md:text-sm`} role="listitem">
                    {status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Registrant Info */}
          {(result.registrant.name || result.registrant.organization) && (
            <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100" role="region" aria-label={t('whois.registrantInfo')}>
              <ResponsiveText size={{ mobile: 'lg', tablet: 'lg', desktop: 'lg', large: 'xl' }} weight="semibold" color="text-gray-800" className="mb-4 flex items-center gap-2">
                <User className={`text-purple-600 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                {t('whois.registrantInfo')}
              </ResponsiveText>
              <ResponsiveGrid cols={{ mobile: 1, tablet: 2, desktop: 2, large: 2 }} gap={{ mobile: 4, tablet: 4, desktop: 6, large: 6 }}>
                <InfoItem label={t('whois.name')} value={result.registrant.name} />
                <InfoItem label={t('whois.organization')} value={result.registrant.organization} />
                <InfoItem label={t('whois.country')} value={result.registrant.country} />
                <InfoItem label={t('whois.email')} value={result.registrant.email} />
              </ResponsiveGrid>
            </div>
          )}

          {/* Raw Data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" role="region" aria-label={t('whois.rawData')}>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className={`w-full flex items-center justify-between hover:bg-gray-50 transition-colors ${
                isMobile ? 'px-4 py-3' : 'px-6 py-4'
              }`}
              aria-expanded={showRaw}
              aria-controls="raw-data-content"
              aria-label={t('whois.toggleRawData')}
            >
              <ResponsiveText size={{ mobile: 'base', tablet: 'base', desktop: 'base', large: 'lg' }} weight="semibold" color="text-gray-800">
                {t('whois.rawData')}
              </ResponsiveText>
              {showRaw ? <ChevronUp className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} /> : <ChevronDown className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />}
            </button>
            {showRaw && (
              <div id="raw-data-content" className={`${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'}`}>
                <div className="flex justify-end mb-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className={`text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors ${
                      isMobile ? 'px-2 py-1' : 'px-3 py-1.5'
                    }`}
                    aria-label={t('whois.copyRawData')}
                    aria-live="polite"
                  >
                    <Copy className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {copied ? t('whois.copied') : t('whois.copy')}
                  </button>
                </div>
                <pre className={`bg-gray-50 rounded-lg overflow-x-auto font-mono text-gray-700 ${
                  isMobile ? 'p-3 text-xs' : 'p-4 text-sm'
                }`}>
                  <code>{JSON.stringify(result.raw, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 md:mt-8 bg-purple-50 rounded-xl p-4 md:p-6 border border-purple-100">
        <ResponsiveText size={{ mobile: 'base', tablet: 'base', desktop: 'base', large: 'lg' }} weight="semibold" color="text-purple-800" className="mb-2">
          {t('whois.whatIsWhois')}
        </ResponsiveText>
        <ResponsiveText size={{ mobile: 'xs', tablet: 'sm', desktop: 'sm', large: 'base' }} color="text-purple-700" className="leading-relaxed">
          {t('whois.about')}
        </ResponsiveText>
      </div>
    </ResponsiveContainer>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon?: React.ElementType; label: string; value: string }) {
  const { isMobile } = useResponsive()
  
  if (!value || value === '-') return null
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className={`text-gray-400 mt-0.5 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />}
      <div>
        <ResponsiveText size={{ mobile: 'xs', tablet: 'sm', desktop: 'sm', large: 'base' }} color="text-gray-500">
          {label}
        </ResponsiveText>
        <ResponsiveText size={{ mobile: 'sm', tablet: 'base', desktop: 'base', large: 'lg' }} weight="medium" color="text-gray-800">
          {value}
        </ResponsiveText>
      </div>
    </div>
  )
}
