import { useState, useRef, useEffect } from 'react'
import { RefreshCw, Play, Pause, Globe, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useI18nSection } from '../../i18n/helpers'

export default function PageRefresh() {
  const { t } = useTranslation()
  const text = useI18nSection<any>('pages.pageRefresh')
  const [url, setUrl] = useState('')
  const [interval, setIntervalTime] = useState(30)
  const [isRunning, setIsRunning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [refreshCount, setRefreshCount] = useState(0)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  const startRefresh = () => {
    if (!url.trim()) {
      alert(text.urlRequired)
      return
    }

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl
    }
    setUrl(targetUrl)

    setIsRunning(true)
    setCountdown(interval)
    setRefreshCount(0)
    
    // 立即刷新一次
    refreshPage(targetUrl)

    // 设置定时刷新
    timerRef.current = setInterval(() => {
      refreshPage()
      setCountdown(interval)
    }, interval * 1000)

    // 设置倒计时
    countdownRef.current = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
  }

  const stopRefresh = () => {
    setIsRunning(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }

  const refreshPage = (targetUrl = url) => {
    if (iframeRef.current) {
      iframeRef.current.src = targetUrl + (targetUrl.includes('?') ? '&' : '?') + '_t=' + Date.now()
    }
    setRefreshCount(prev => prev + 1)
    setLastRefresh(new Date())
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const presetIntervals = [5, 10, 30, 60, 120, 300]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{text.title}</h1>
          <p className="text-gray-500">{text.description}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={text.urlPlaceholder}
              disabled={isRunning}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <input
              type="number"
              value={interval}
              onChange={(e) => setIntervalTime(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isRunning}
              className="w-20 px-3 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-100"
            />
            <span className="text-gray-500">{text.seconds}</span>
          </div>
          {isRunning ? (
            <button
              onClick={stopRefresh}
              className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <Pause className="w-5 h-5" />
              {text.stop}
            </button>
          ) : (
            <button
              onClick={startRefresh}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-teal-600 transition-colors flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              {text.start}
            </button>
          )}
        </div>

        {/* Preset Intervals */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-gray-500 py-1">{text.quickSet}</span>
          {presetIntervals.map((sec) => (
            <button
              key={sec}
              onClick={() => setIntervalTime(sec)}
              disabled={isRunning}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                interval === sec
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
              }`}
            >
              {sec < 60
                ? t('pages.pageRefresh.secondsValue', { count: sec })
                : t('pages.pageRefresh.minutesValue', { count: sec / 60 })}
            </button>
          ))}
        </div>
      </div>

      {/* Status */}
      {isRunning && (
        <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-cyan-700">{text.running}</span>
              </div>
              <div className="text-cyan-700">
                {t('pages.pageRefresh.refreshIn', { count: countdown })}
              </div>
              <div className="text-cyan-700">
                {t('pages.pageRefresh.refreshedCount', { count: refreshCount })}
              </div>
            </div>
            {lastRefresh && (
              <div className="text-cyan-600 text-sm">
                {t('pages.pageRefresh.lastRefresh', { time: formatTime(lastRefresh) })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
          <span className="font-medium text-gray-700">{text.previewTitle}</span>
        </div>
        <div className="h-[500px] bg-gray-100">
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts"
              title="preview"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              {text.previewPlaceholder}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-cyan-50 rounded-xl p-6 border border-cyan-100">
        <h3 className="font-semibold text-cyan-800 mb-2">{text.usageTitle}</h3>
        <ul className="text-cyan-700 text-sm leading-relaxed space-y-1">
          {text.usageItems.map((item: string) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
