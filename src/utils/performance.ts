/**
 * 性能监控工具
 * Performance monitoring utility
 */

export interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  navigationTiming?: PerformanceNavigationTiming
  resourceTiming?: PerformanceResourceTiming[]
}

/**
 * 获取核心 Web 指标
 */
export async function getCoreWebVitals(): Promise<PerformanceMetrics> {
  const metrics: PerformanceMetrics = {}

  // First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcp = entries[entries.length - 1]
      metrics.fcp = fcp.startTime
    })
    fcpObserver.observe({ entryTypes: ['paint'] })
  } catch (e) {
    console.warn('FCP 监控失败:', e)
  }

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      metrics.lcp = lastEntry.startTime
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
  } catch (e) {
    console.warn('LCP 监控失败:', e)
  }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fid = entries[0]
      // @ts-ignore - processingStart exists on FirstInputPolyfillEntry
      metrics.fid = fid.processingStart - fid.startTime
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
  } catch (e) {
    console.warn('FID 监控失败:', e)
  }

  // Cumulative Layout Shift
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }
      metrics.cls = clsValue
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  } catch (e) {
    console.warn('CLS 监控失败:', e)
  }

  // Time to First Byte
  try {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigationTiming) {
      metrics.ttfb = navigationTiming.responseStart - navigationTiming.requestStart
      metrics.navigationTiming = navigationTiming
    }
  } catch (e) {
    console.warn('TTFB 监控失败:', e)
  }

  // Resource Timing
  try {
    metrics.resourceTiming = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  } catch (e) {
    console.warn('Resource Timing 监控失败:', e)
  }

  return metrics
}

/**
 * 性能指标收集器
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []
  private callback?: (metrics: PerformanceMetrics) => void

  constructor(callback?: (metrics: PerformanceMetrics) => void) {
    this.callback = callback
  }

  start() {
    this.setupObservers()
  }

  stop() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  private setupObservers() {
    // FCP Observer
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries[entries.length - 1]
        this.metrics.fcp = fcp.startTime
        this.notify()
      })
      fcpObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(fcpObserver)
    } catch (e) {}

    // LCP Observer
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.lcp = lastEntry.startTime
        this.notify()
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)
    } catch (e) {}

    // FID Observer
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fid = entries[0]
        // @ts-ignore - processingStart exists on FirstInputPolyfillEntry
        this.metrics.fid = fid.processingStart - fid.startTime
        this.notify()
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
      this.observers.push(fidObserver)
    } catch (e) {}

    // CLS Observer
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
        this.metrics.cls = clsValue
        this.notify()
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(clsObserver)
    } catch (e) {}
  }

  private notify() {
    if (this.callback) {
      this.callback({ ...this.metrics })
    }
  }

  getMetrics() {
    return { ...this.metrics }
  }
}

/**
 * 资源加载监控
 */
export function monitorResourceLoading() {
  const resources = performance.getEntriesByType('resource')
  const slowResources = resources.filter((resource: any) => {
    return resource.duration > 1000 // 超过1秒的资源
  })

  if (slowResources.length > 0) {
    console.warn('慢资源加载:', slowResources.map((r: any) => ({
      name: r.name,
      duration: r.duration,
      size: r.transferSize
    })))
  }

  return {
    totalResources: resources.length,
    slowResources: slowResources.length,
    averageLoadTime: resources.reduce((acc, r: any) => acc + r.duration, 0) / resources.length
  }
}

/**
 * 内存使用监控
 */
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory
    return {
      usedJSHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
      usagePercentage: (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100
    }
  }
  return null
}

/**
 * 长任务监控
 */
export function monitorLongTasks() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).duration > 50) { // 超过50ms的任务
            console.warn('长任务检测:', {
              duration: (entry as any).duration,
              startTime: entry.startTime,
              name: entry.name
            })
          }
        }
      })
      observer.observe({ entryTypes: ['longtask'] })
      return observer
    } catch (e) {
      console.warn('长任务监控不支持')
    }
  }
  return null
}

/**
 * 性能报告生成器
 */
export function generatePerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    metrics: {} as PerformanceMetrics,
    memory: monitorMemoryUsage(),
    resources: monitorResourceLoading()
  }

  // 获取核心指标
  getCoreWebVitals().then(metrics => {
    report.metrics = metrics
    console.log('性能报告:', report)
  })

  return report
}