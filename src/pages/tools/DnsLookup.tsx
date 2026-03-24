import { useState, useRef } from 'react'
import { Server, Search, Globe, Mail, FileText, Link, Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LoadingButton, LoadingCard } from '../../components/LoadingStates'
import { Alert, EmptyState } from '../../components/ErrorHandling'
import { useAsync } from '../../hooks/useAsync'
import { FormValidator, ValidationRules, commonRules, sanitizers } from '../../utils/validation'
import { useResponsive } from '../../hooks/useResponsive'
import ResponsiveContainer, { ResponsiveText } from '../../components/ResponsiveLayout'
import ExportFormatSelector from '../../components/ExportFormatSelector'
import { ToolExporter, ExportFormat, ExportOptions } from '../../utils/export'
import { useToolHistory } from '../../hooks/useToolHistory'
import FavoriteButton from '../../components/FavoriteButton'

interface DnsRecord {
  type: string
  value: string | string[]
  priority?: number
  ttl?: number
}

interface DnsResult {
  domain: string
  records: DnsRecord[]
  queryTime: string
}

const DNS_TYPES = [
  { value: 'ALL', label: 'dns.types.ALL', icon: Database },
  { value: 'A', label: 'dns.types.A', icon: Globe, desc: 'dns.typeDescs.A' },
  { value: 'AAAA', label: 'dns.types.AAAA', icon: Globe, desc: 'dns.typeDescs.AAAA' },
  { value: 'MX', label: 'dns.types.MX', icon: Mail, desc: 'dns.typeDescs.MX' },
  { value: 'TXT', label: 'dns.types.TXT', icon: FileText, desc: 'dns.typeDescs.TXT' },
  { value: 'CNAME', label: 'dns.types.CNAME', icon: Link, desc: 'dns.typeDescs.CNAME' },
  { value: 'NS', label: 'dns.types.NS', icon: Server, desc: 'dns.typeDescs.NS' },
  { value: 'SOA', label: 'dns.types.SOA', icon: Database, desc: 'dns.typeDescs.SOA' },
]

const TYPE_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700',
  AAAA: 'bg-indigo-100 text-indigo-700',
  MX: 'bg-green-100 text-green-700',
  TXT: 'bg-yellow-100 text-yellow-700',
  CNAME: 'bg-purple-100 text-purple-700',
  NS: 'bg-cyan-100 text-cyan-700',
  SOA: 'bg-gray-100 text-gray-700',
}

import { API_BASE_URL } from '../../config/api'

export default function DnsLookup() {
  const { t } = useTranslation()
  const [domain, setDomain] = useState('')
  const [dnsType, setDnsType] = useState('ALL')
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
      message: t('dns.invalidDomain')
    }
  }
  
  const validator = new FormValidator(validationRules)
  
  const { data: result, loading, error, execute: handleLookup, setError } = useAsync<DnsResult>(
    async (domain: string, dnsType: string) => {
      const response = await fetch(`${API_BASE_URL}/api/dns/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), type: dnsType })
      })
      const data = await response.json()
      
      if (data.success) {
        // 记录工具使用历史
        recordToolUsage(
          'dns-lookup',
          t('dns.title'),
          t('categories.detection'),
          { domain, dnsType },
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
    await handleLookup(sanitizedDomain, dnsType)
  }

  const groupedRecords = result?.records.reduce((acc, record) => {
    if (!acc[record.type]) acc[record.type] = []
    acc[record.type].push(record)
    return acc
  }, {} as Record<string, DnsRecord[]>)

  return (
    <ResponsiveContainer className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center ${
            isMobile ? 'w-12 h-12' : 'w-14 h-14'
          }`}>
            <Server className={`text-white ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          <div>
            <ResponsiveText 
              size={{ mobile: 'xl', tablet: '2xl', desktop: '2xl', large: '3xl' }}
              weight="bold"
              color="text-gray-900"
            >
              {t('dns.title')}
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'sm', tablet: 'base', desktop: 'base', large: 'lg' }}
              color="text-gray-500"
            >
              {t('dns.description')}
            </ResponsiveText>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton
            toolId="dns-lookup"
            size={isMobile ? 'sm' : 'md'}
            variant="outline"
            showLabel={false}
          />
        </div>
      </div>

      {/* Search Box */}
      <div 
        className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 mb-6"
        role="form"
        aria-label={t('dns.title')}
      >
        <div className={`flex flex-col gap-3 ${isMobile ? 'space-y-3' : 'md:flex-row'}`}>
          <div className="flex-1 relative">
            <Globe className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 ${
              isMobile ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
            <input
              ref={domainInputRef}
              type="text"
              value={domain}
              onChange={(e) => handleDomainChange(e.target.value)}
              onBlur={() => handleFieldBlur('domain')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder={t('dns.placeholder')}
              aria-label={t('dns.domainInput')}
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
                  : 'border-gray-200 focus:ring-blue-500'
              }`}
            />
            {validationErrors.domain && validationErrors.domain.length > 0 && (
              <div 
                id="domain-error"
                className={`absolute left-0 text-red-600 ${
                  isMobile ? 'text-xs -bottom-5' : 'text-xs -bottom-6'
                }`}
                role="alert"
                aria-live="polite"
              >
                {validationErrors.domain[0]}
              </div>
            )}
            {touchedFields.domain && !validationErrors.domain?.length && domain && (
              <div className={`absolute left-0 text-green-600 ${
                isMobile ? 'text-xs -bottom-5' : 'text-xs -bottom-6'
              }`}>
                ✓ {t('dns.validFormat')}
              </div>
            )}
          </div>
          <select
            value={dnsType}
            onChange={(e) => setDnsType(e.target.value)}
            aria-label={t('dns.typeSelect')}
            className={`border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-3'
            }`}
          >
            {DNS_TYPES.map(type => (
              <option key={type.value} value={type.value}>{t(type.label)}</option>
            ))}
          </select>
          <LoadingButton
            loading={loading}
            onClick={handleSubmit}
            disabled={!domain || validationErrors.domain?.length > 0}
            aria-label={t('dns.searchBtn')}
            className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-3'
            }`}
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

      {/* DNS Type Legend */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2 sm:gap-3">
          {DNS_TYPES.filter(t => t.value !== 'ALL').map(type => (
            <div key={type.value} className={`flex items-center gap-1 sm:gap-2 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              <span className={`rounded font-medium ${
                isMobile ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-0.5 text-sm'
              } ${TYPE_COLORS[type.value]}`}>
                {type.value}
              </span>
              <span className="text-gray-500 hidden sm:inline">{t(type.desc)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      {loading && (
        <LoadingCard 
          title={t('dns.loadingTitle')} 
          description={t('dns.loadingDesc')}
        />
      )}
      
      {result && !loading && (
        <div className="space-y-3 sm:space-y-4" role="region" aria-label={t('dns.resultRegion')}>
          {/* Summary */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
              <div>
                <ResponsiveText size={{ mobile: 'base', tablet: 'lg' }} weight="semibold" color="text-gray-800">
                  {result.domain}
                </ResponsiveText>
                <ResponsiveText size={{ mobile: 'xs', tablet: 'sm' }} color="text-gray-500">
                  {t('dns.foundRecords', { count: result.records.length })}
                </ResponsiveText>
              </div>
              <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center gap-3'}`}>
                <ResponsiveText size={{ mobile: 'xs', tablet: 'sm' }} color="text-gray-400">
                  {t('dns.queryTime', { time: new Date(result.queryTime).toLocaleString('zh-CN') })}
                </ResponsiveText>
                {result.records.length > 0 && (
                  <ExportFormatSelector
                    onExport={async (_format: ExportFormat, options: ExportOptions) => {
                      // 转换记录格式以匹配导出要求
                      const exportRecords = result.records.map(record => ({
                        type: record.type,
                        name: result.domain,
                        value: Array.isArray(record.value) ? record.value.join(' ') : record.value,
                        ttl: record.ttl || 300,
                        class: 'IN'
                      }))
                      
                      ToolExporter.exportDNSResults(exportRecords, result.domain, options)
                    }}
                    buttonText={t('common.export')}
                    className={isMobile ? 'w-full' : ''}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Records by Type */}
          {groupedRecords && Object.entries(groupedRecords).map(([type, records]) => (
            <div key={type} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100" role="region" aria-label={t('dns.typeRecordRegion', { type })}>
              <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-1 rounded text-sm font-medium ${TYPE_COLORS[type]}`}>
                  {type}
                </span>
                <span className="text-gray-500 text-sm font-normal hidden sm:inline">
                  {t(DNS_TYPES.find(t => t.value === type)?.desc || '')}
                </span>
                <span className="text-gray-400 text-sm font-normal">
                  ({t('dns.recordCount', { count: records.length })})
                </span>
              </h3>
              <div className="space-y-2">
                {records.map((record, index) => (
                  <div
                    key={index}
                    className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-center justify-between'} p-3 bg-gray-50 rounded-lg`}
                  >
                    <code className={`font-mono text-gray-800 break-all ${
                      isMobile ? 'text-sm' : 'text-sm'
                    }`}>
                      {Array.isArray(record.value) ? record.value.join(' ') : record.value}
                    </code>
                    <div className={`flex text-gray-500 ${
                      isMobile ? 'text-xs gap-4' : 'items-center gap-3 text-sm ml-4 shrink-0'
                    }`}>
                      {record.priority !== undefined && (
                        <span>{t('dns.priority', { priority: record.priority })}</span>
                      )}
                      {record.ttl !== undefined && (
                        <span>TTL: {record.ttl}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {result.records.length === 0 && (
            <EmptyState 
              icon={<Globe className="h-6 w-6 text-gray-400" />}
              title={t('dns.noRecords')}
              description={t('dns.noRecordsDesc')}
            />
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 sm:mt-8 bg-blue-50 rounded-xl p-4 sm:p-6 border border-blue-100">
        <ResponsiveText 
          size={{ mobile: 'base', tablet: 'lg' }} 
          weight="semibold" 
          color="text-blue-800" 
          className="mb-2"
        >
          {t('dns.typeInfo')}
        </ResponsiveText>
        <ul className={`text-blue-700 leading-relaxed space-y-1 ${
          isMobile ? 'text-sm' : 'text-sm'
        }`}>
          {DNS_TYPES.filter(rt => rt.value !== 'ALL').map(rt => (
            <li key={rt.value}>
              <strong>{t(rt.label)}</strong>：{t(`dns.typeDetails.${rt.value}`)}
            </li>
          ))}
        </ul>
      </div>
    </ResponsiveContainer>
  )
}
