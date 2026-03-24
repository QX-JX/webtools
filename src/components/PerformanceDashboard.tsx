import React, { useState, useEffect } from 'react'
import { Activity, TrendingUp, Clock, MemoryStick, HardDrive } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PerformanceMonitor, generatePerformanceReport, monitorMemoryUsage } from '../utils/performance'

interface PerformanceDashboardProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

/**
 * 性能监控仪表板
 * Performance monitoring dashboard
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  autoRefresh = false,
  refreshInterval = 5000
}) => {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0
  })
  const [memory, setMemory] = useState<any>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitor, setMonitor] = useState<PerformanceMonitor | null>(null)

  useEffect(() => {
    // 初始化性能监控
    const perfMonitor = new PerformanceMonitor((newMetrics) => {
      setMetrics(prev => ({ ...prev, ...newMetrics }))
    })

    setMonitor(perfMonitor)

    return () => {
      perfMonitor.stop()
    }
  }, [])

  useEffect(() => {
    if (isMonitoring && autoRefresh) {
      const interval = setInterval(() => {
        const memoryInfo = monitorMemoryUsage()
        setMemory(memoryInfo)
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [isMonitoring, autoRefresh, refreshInterval])

  const startMonitoring = () => {
    if (monitor) {
      monitor.start()
      setIsMonitoring(true)
      
      // 立即获取一次内存信息
      const memoryInfo = monitorMemoryUsage()
      setMemory(memoryInfo)
    }
  }

  const stopMonitoring = () => {
    if (monitor) {
      monitor.stop()
      setIsMonitoring(false)
    }
  }

  const generateReport = () => {
    const report = generatePerformanceReport()
    
    // 创建并下载报告
    const reportData = JSON.stringify(report, null, 2)
    const blob = new Blob([reportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTime = (time: number) => {
    if (time === 0) return t('components.performanceDashboard.notMeasured')
    return `${time.toFixed(2)}ms`
  }

  const getGradeColor = (value: number, thresholds: number[]) => {
    if (value <= thresholds[0]) return 'text-green-600'
    if (value <= thresholds[1]) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMetricGrade = (metric: string, value: number) => {
    switch (metric) {
      case 'fcp':
        return getGradeColor(value, [1800, 3000])
      case 'lcp':
        return getGradeColor(value, [2500, 4000])
      case 'fid':
        return getGradeColor(value, [100, 300])
      case 'cls':
        return getGradeColor(value * 1000, [100, 250])
      case 'ttfb':
        return getGradeColor(value, [800, 1800])
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {t('components.performanceDashboard.title')}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMonitoring
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isMonitoring ? t('components.performanceDashboard.stopMonitoring') : t('components.performanceDashboard.startMonitoring')}
          </button>
          
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
          >
            {t('components.performanceDashboard.exportReport')}
          </button>
        </div>
      </div>

      {/* 核心 Web 指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">FCP</span>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getMetricGrade('fcp', metrics.fcp)}`}>
            {formatTime(metrics.fcp)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('components.performanceDashboard.metrics.fcp')}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">LCP</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getMetricGrade('lcp', metrics.lcp)}`}>
            {formatTime(metrics.lcp)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('components.performanceDashboard.metrics.lcp')}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">FID</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getMetricGrade('fid', metrics.fid)}`}>
            {formatTime(metrics.fid)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('components.performanceDashboard.metrics.fid')}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CLS</span>
            <HardDrive className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getMetricGrade('cls', metrics.cls)}`}>
            {metrics.cls === 0 ? t('components.performanceDashboard.notMeasured') : metrics.cls.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('components.performanceDashboard.metrics.cls')}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">TTFB</span>
            <MemoryStick className="w-4 h-4 text-gray-400" />
          </div>
          <div className={`text-2xl font-bold ${getMetricGrade('ttfb', metrics.ttfb)}`}>
            {formatTime(metrics.ttfb)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{t('components.performanceDashboard.metrics.ttfb')}</div>
        </div>
      </div>

      {/* 内存使用情况 */}
      {memory && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <MemoryStick className="w-5 h-5" />
            {t('components.performanceDashboard.memoryTitle')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">{t('components.performanceDashboard.memory.used')}</div>
              <div className="text-lg font-semibold text-gray-800">
                {(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('components.performanceDashboard.memory.total')}</div>
              <div className="text-lg font-semibold text-gray-800">
                {(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('components.performanceDashboard.memory.usageRate')}</div>
              <div className={`text-lg font-semibold ${
                memory.usagePercentage > 80 ? 'text-red-600' :
                memory.usagePercentage > 60 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {memory.usagePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 性能优化建议 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">{t('components.performanceDashboard.tipsTitle')}</h3>
        <div className="space-y-2 text-sm text-blue-700">
          {(t('components.performanceDashboard.tips', { returnObjects: true }) as string[]).map((item) => (
            <div key={item}>• {item}</div>
          ))}
        </div>
      </div>

      {!isMonitoring && (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>{t('components.performanceDashboard.emptyState')}</p>
        </div>
      )}
    </div>
  )
}
