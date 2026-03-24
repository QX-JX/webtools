import { useState, type ReactNode } from 'react'
import { Code, Search, Globe, Copy, Download, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { copyToClipboard as copyText } from '../../utils/clipboard'
import ToolPageLayout from '../../components/ToolPageLayout'
import { LoadingButton } from '../../components/LoadingStates'
import { Alert } from '../../components/ErrorHandling'
import { API_BASE_URL } from '../../config/api'

interface SourceResult {
  html: string
  lineCount: number
  contentLength: number
  statusCode: number
}

export default function ViewSource() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SourceResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleFetch = async () => {
    if (!url.trim()) {
      setError(t('viewSource.urlEmpty'))
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/source/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await response.json()

      if (data.success && data.data) {
        setResult(data.data as SourceResult)
      } else {
        setError(data.message || t('viewSource.fetchFailed'))
      }
    } catch {
      setError(t('viewSource.serverError'))
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    const success = await copyText(result.html)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.html], { type: 'text/html' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = 'source.html'
    anchor.click()
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <ToolPageLayout
      toolId="view-source"
      title={t('viewSource.title')}
      description={t('viewSource.description')}
      icon={Code}
      iconColor="from-gray-500 to-gray-700"
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleFetch()}
              placeholder={t('viewSource.placeholder')}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <LoadingButton
            loading={loading}
            onClick={handleFetch}
            className="px-8 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-colors border-none"
          >
            <Search className="w-4 h-4 mr-2" />
            {t('viewSource.fetch')}
          </LoadingButton>
        </div>
        {error && <Alert type="error" message={error} className="mt-3" />}
      </div>

      {result && !loading && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{t('viewSource.lineCount', { count: result.lineCount })}</span>
                </div>
                <div className="text-gray-600">{formatBytes(result.contentLength)}</div>
                <div
                  className={`px-2 py-1 rounded text-sm ${
                    result.statusCode === 200 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {result.statusCode}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? t('base64.copied') : t('base64.copy')}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('common.export')}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-800 text-gray-300 p-4 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed">
                <code>
                  {result.html.split('\n').map((line, index) => (
                    <div key={index} className="flex hover:bg-gray-700/50">
                      <span className="w-12 text-gray-500 text-right pr-4 select-none shrink-0">
                        {index + 1}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap break-all">{highlightHtml(line)}</span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-gray-100 rounded-xl p-6 border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">{t('common.usageInstructions')}</h3>
        <ul className="text-gray-600 text-sm leading-relaxed space-y-1">
          <li>• {t('viewSource.usage1')}</li>
          <li>• {t('viewSource.usage2')}</li>
          <li>• {t('viewSource.usage3')}</li>
          <li>• {t('viewSource.usage4')}</li>
        </ul>
      </div>
    </ToolPageLayout>
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function highlightHtml(line: string): ReactNode {
  const parts: ReactNode[] = []
  let key = 0
  const tagRegex = /<\/?[\w-]+[^>]*>/g
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = tagRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>)
    }

    parts.push(
      <span key={key++} className="text-cyan-400">
        {match[0]}
      </span>
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push(<span key={key++}>{line.slice(lastIndex)}</span>)
  }

  return parts.length > 0 ? parts : line
}
