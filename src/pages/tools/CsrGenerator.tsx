import { useState } from 'react'
import { Shield, Copy, Download, RefreshCw, Eye, FileText } from 'lucide-react'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import { useI18nSection } from '../../i18n/helpers'

interface CsrFormData {
  commonName: string      // 域名
  organization: string    // 组织名称
  organizationUnit: string // 部门
  city: string           // 城市
  state: string          // 省份
  country: string        // 国家代码
  email: string          // 邮箱
  keySize: string        // 密钥长度
}

interface CsrResult {
  csr: string
  privateKey: string
}

import { API_BASE_URL } from '../../config/api'

export default function CsrGenerator() {
  const text = useI18nSection<any>('pages.csrGenerator')
  const [activeTab, setActiveTab] = useState<'generate' | 'view'>('generate')
  const [formData, setFormData] = useState<CsrFormData>({
    commonName: '',
    organization: '',
    organizationUnit: '',
    city: '',
    state: '',
    country: 'CN',
    email: '',
    keySize: '2048'
  })
  const [result, setResult] = useState<CsrResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [csrInput, setCsrInput] = useState('')
  const [csrInfo, setCsrInfo] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateCSR = async () => {
    if (!formData.commonName) {
      alert(text.enterDomain)
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/csr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      if (data.success) {
        setResult(data.data)
      } else {
        alert(data.message || text.generateFailed)
      }
    } catch (error) {
      alert(text.serverConnectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const viewCSR = async () => {
    if (!csrInput.trim()) {
      alert(text.inputCsr)
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/csr/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csr: csrInput })
      })
      const data = await response.json()
      if (data.success) {
        setCsrInfo(data.data)
      } else {
        alert(data.message || text.parseFailed)
      }
    } catch (error) {
      alert(text.serverConnectionFailed)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    const success = await copyText(text)
    if (success) {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('generate')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'generate'
              ? 'bg-cyan-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          {text.tabs.generate}
        </button>
        <button
          onClick={() => setActiveTab('view')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'view'
              ? 'bg-cyan-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          {text.tabs.view}
        </button>
      </div>

      {activeTab === 'generate' ? (
        <div className="space-y-6">
          {/* Form */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{text.formTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {text.labels.commonName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="commonName"
                  value={formData.commonName}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.commonName}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.organization}</label>
                <input
                  type="text"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.organization}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.organizationUnit}</label>
                <input
                  type="text"
                  name="organizationUnit"
                  value={formData.organizationUnit}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.organizationUnit}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.city}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.city}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.state}</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.state}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.country}</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {text.countries.map((item: any) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.email}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={text.placeholders.email}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{text.labels.keySize}</label>
                <select
                  name="keySize"
                  value={formData.keySize}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {text.keySizes.map((item: any) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={generateCSR}
              disabled={loading}
              className="mt-6 w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {text.generating}
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  {text.generateAction}
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-600" />
                    {text.csrRequest}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.csr, 'csr')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'csr' ? text.copied : text.copy}
                    </button>
                    <button
                      onClick={() => downloadFile(result.csr, 'certificate.csr')}
                      className="px-3 py-1.5 text-sm bg-cyan-100 text-cyan-700 hover:bg-cyan-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {text.download}
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  value={result.csr}
                  className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm resize-none"
                />
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-500" />
                    {text.privateKey}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(result.privateKey, 'key')}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copied === 'key' ? text.copied : text.copy}
                    </button>
                    <button
                      onClick={() => downloadFile(result.privateKey, 'private.key')}
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {text.download}
                    </button>
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-red-600">
                    {text.privateKeyWarning}
                  </p>
                </div>
                <textarea
                  readOnly
                  value={result.privateKey}
                  className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm resize-none"
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* CSR Input */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{text.inputCsr}</h2>
            <textarea
              value={csrInput}
              onChange={(e) => setCsrInput(e.target.value)}
              placeholder={text.placeholders.csr}
              className="w-full h-48 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              onClick={viewCSR}
              disabled={loading}
              className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-cyan-600 hover:to-cyan-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {text.parsing}
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  {text.parseAction}
                </>
              )}
            </button>
          </div>

          {/* CSR Info */}
          {csrInfo && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">{text.csrInfo}</h3>
              <div className="space-y-3">
                {text.infoItems.map((item: any) => {
                  const rawValue = csrInfo[item.key]
                  const value = item.key === 'keySize' && rawValue
                    ? text.keySizeValue.replace('{{value}}', String(rawValue))
                    : rawValue
                  return value && (
                  <div key={item.label} className="flex border-b border-gray-100 pb-2">
                    <span className="w-32 text-gray-500 text-sm">{item.label}</span>
                    <span className="flex-1 text-gray-800 font-medium">{value}</span>
                  </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-2">{text.aboutTitle}</h3>
        <p className="text-blue-700 text-sm leading-relaxed">
          {text.aboutDescription}
        </p>
      </div>
    </div>
  )
}
