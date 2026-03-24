import { useState } from 'react'
import { Server, Search, RefreshCw, Globe, Mail, FileText, Link, Database, AlertCircle } from 'lucide-react'
import { VirtualList } from '../../components/VirtualList'
import { useI18nSection } from '../../i18n/helpers'

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

const DNS_TYPE_ICONS: Record<string, any> = {
  ALL: Database,
  A: Globe,
  AAAA: Globe,
  MX: Mail,
  TXT: FileText,
  CNAME: Link,
  NS: Server,
  SOA: Database,
}

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

export default function DnsLookupEnhanced() {
  const text = useI18nSection<any>('pages.dnsLookupEnhanced')
  const dnsTypes = text.dnsTypes.map((item: any) => ({
    ...item,
    icon: DNS_TYPE_ICONS[item.value],
  }))
  const [domain, setDomain] = useState('')
  const [dnsType, setDnsType] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DnsResult | null>(null)
  const [error, setError] = useState('')
  const [useVirtualScroll, setUseVirtualScroll] = useState(false)
  const [recordThreshold] = useState(50) // 超过50条记录使用虚拟滚动

  const renderDnsRecord = (record: DnsRecord, index: number) => (
    <div
      key={index}
      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
    >
      <code className="text-sm font-mono text-gray-800 break-all flex-1">
        {Array.isArray(record.value) ? record.value.join(' ') : record.value}
      </code>
      <div className="flex items-center gap-3 text-sm text-gray-500 ml-4 shrink-0">
        {record.priority !== undefined && (
          <span>{text.priority.replace('{{value}}', String(record.priority))}</span>
        )}
        {record.ttl !== undefined && (
          <span>TTL: {record.ttl}</span>
        )}
      </div>
    </div>
  )

  const handleLookup = async () => {
    if (!domain.trim()) {
      setError(text.enterDomain)
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/dns/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim(), type: dnsType })
      })
      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
        // 如果记录数超过阈值，自动启用虚拟滚动
        setUseVirtualScroll(data.data.records.length > recordThreshold)
      } else {
        setError(data.message || text.lookupFailed)
      }
    } catch (err) {
      setError(text.serverConnectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const groupedRecords = result?.records.reduce((acc, record) => {
    if (!acc[record.type]) acc[record.type] = []
    acc[record.type].push(record)
    return acc
  }, {} as Record<string, DnsRecord[]>)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
          <Server className="w-8 h-8 text-white" />
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
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              placeholder={text.inputPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={dnsType}
            onChange={(e) => setDnsType(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {dnsTypes.map((type: any) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          <button
            onClick={handleLookup}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {text.lookup}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-red-500 text-sm">{error}</p>
        )}
      </div>

      {/* DNS Type Legend */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          {dnsTypes.filter((item: any) => item.value !== 'ALL').map((type: any) => (
            <div key={type.value} className="flex items-center gap-2 text-sm">
              <span className={`px-2 py-0.5 rounded font-medium ${TYPE_COLORS[type.value]}`}>
                {type.value}
              </span>
              <span className="text-gray-500">{type.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{result.domain}</h2>
                <p className="text-sm text-gray-500">{text.foundRecords.replace('{{count}}', String(result.records.length))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {text.queryTime.replace('{{time}}', new Date(result.queryTime).toLocaleString('zh-CN'))}
                </p>
                {result.records.length > recordThreshold && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{text.virtualScrollEnabled}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Records by Type */}
          {groupedRecords && Object.entries(groupedRecords).map(([type, records]) => (
            <div key={type} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${TYPE_COLORS[type]}`}>
                  {type}
                </span>
                <span className="text-gray-500 text-sm font-normal">
                  {dnsTypes.find((item: any) => item.value === type)?.desc}
                </span>
                <span className="text-gray-400 text-sm font-normal">
                  {text.recordCount.replace('{{count}}', String(records.length))}
                </span>
                {records.length > 20 && (
                  <span className="text-blue-500 text-xs font-normal">
                    {text.virtualScrollTag}
                  </span>
                )}
              </h3>
              
              {useVirtualScroll && records.length > 20 ? (
                <VirtualList
                  items={records}
                  itemHeight={60}
                  containerHeight={Math.min(400, records.length * 60)}
                  renderItem={renderDnsRecord}
                  className="dns-records-virtual-list"
                />
              ) : (
                <div className="space-y-2">
                  {records.map((record, index) => renderDnsRecord(record, index))}
                </div>
              )}
            </div>
          ))}

          {result.records.length === 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
              <p className="text-gray-500">{text.noRecords}</p>
            </div>
          )}
        </div>
      )}

      {/* Performance Info */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">{text.performanceTitle}</h3>
        <ul className="text-blue-700 text-sm leading-relaxed space-y-1">
          {text.performanceItems.map((item: string) => (
            <li key={item}>• {item.replace('{{count}}', String(recordThreshold))}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
