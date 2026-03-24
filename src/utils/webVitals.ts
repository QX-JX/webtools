import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals'

type ReportHandler = (metric: Metric) => void

// Web Vitals 性能指标监控
export function reportWebVitals(onReport?: ReportHandler) {
  const handler: ReportHandler = onReport || ((metric) => {
    // 默认输出到控制台（生产环境会被移除）
    console.log(`[Web Vitals] ${metric.name}:`, metric.value)
  })

  // Cumulative Layout Shift - 累积布局偏移
  onCLS(handler)
  // Interaction to Next Paint - 交互到下一次绘制（替代FID）
  onINP(handler)
  // Largest Contentful Paint - 最大内容绘制
  onLCP(handler)
  // First Contentful Paint - 首次内容绘制
  onFCP(handler)
  // Time to First Byte - 首字节时间
  onTTFB(handler)
}

// 发送到分析服务（可选）
export function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    timestamp: Date.now()
  })

  // 使用 sendBeacon 确保数据在页面卸载时也能发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body)
  }
}

// 性能指标阈值（基于 Google 推荐）
export const VITALS_THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 },
  LCP: { good: 2500, needsImprovement: 4000 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 }
}

// 获取性能评级
export function getVitalRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[name as keyof typeof VITALS_THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}
