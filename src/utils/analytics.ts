/**
 * 工具使用统计和性能监控系统
 */

export interface ToolUsageData {
  toolId: string
  toolName: string
  category: string
  usageCount: number
  totalTime: number // 毫秒
  lastUsed: number // 时间戳
  averageResponseTime: number // 平均响应时间
  errorCount: number
  successCount: number
}

export interface PerformanceMetrics {
  pageLoadTime: number
  apiResponseTime: number
  renderTime: number
  resourceLoadTime: number
  timestamp: number
  url: string
  userAgent: string
}

export interface UserBehaviorEvent {
  type: 'click' | 'input' | 'scroll' | 'resize' | 'focus' | 'blur' | 'page_view' | 'performance'
  element?: string
  value?: string
  data?: any
  timestamp: number
  url: string
  sessionId: string
}

export interface SessionData {
  sessionId: string
  startTime: number
  endTime?: number
  pageViews: number
  toolUsages: ToolUsageData[]
  performanceMetrics: PerformanceMetrics[]
  behaviorEvents: UserBehaviorEvent[]
  deviceInfo: {
    userAgent: string
    screenResolution: string
    viewportSize: string
    language: string
    timezone: string
  }
}

class AnalyticsManager {
  private static instance: AnalyticsManager
  private sessionData: SessionData | null = null
  private toolUsage: Map<string, ToolUsageData> = new Map()
  private isTracking = false
  private performanceObserver: PerformanceObserver | null = null
  
  // 配置选项
  private config = {
    enablePerformanceTracking: true,
    enableUserBehaviorTracking: false, // 默认关闭，需要用户同意
    enableErrorTracking: true,
    maxSessionDuration: 30 * 60 * 1000, // 30分钟
    maxStoredSessions: 100,
    storageKey: 'webtools_analytics_data'
  }

  private constructor() {}

  static getInstance(): AnalyticsManager {
    if (!AnalyticsManager.instance) {
      AnalyticsManager.instance = new AnalyticsManager()
    }
    return AnalyticsManager.instance
  }

  /**
   * 初始化分析系统
   */
  initialize(): void {
    if (this.isTracking) return

    this.startSession()
    this.setupPerformanceObserver()
    this.setupErrorTracking()
    this.loadStoredData()
    
    this.isTracking = true
    console.log('[Analytics] 分析系统已初始化')
  }

  /**
   * 开始新的会话
   */
  startSession(): void {
    const sessionId = this.generateSessionId()
    
    this.sessionData = {
      sessionId,
      startTime: Date.now(),
      pageViews: 0,
      toolUsages: [],
      performanceMetrics: [],
      behaviorEvents: [],
      deviceInfo: this.getDeviceInfo()
    }

    console.log(`[Analytics] 新会话开始: ${sessionId}`)
  }

  /**
   * 结束当前会话
   */
  endSession(): void {
    if (!this.isTracking || !this.sessionData) return

    const sessionDuration = Date.now() - this.sessionData.startTime
    console.log(`[Analytics] 会话结束: ${this.sessionData.sessionId} (持续时间: ${sessionDuration}ms)`)
    
    this.saveData()
    this.sessionData = null
  }

  /**
   * 记录工具使用
   */
  trackToolUsage(toolId: string, toolName: string, category: string, responseTime: number, success = true): void {
    if (!this.isTracking || !this.sessionData) return

    let usageData = this.toolUsage.get(toolId)
    
    if (!usageData) {
      usageData = {
        toolId,
        toolName,
        category,
        usageCount: 0,
        totalTime: 0,
        lastUsed: Date.now(),
        averageResponseTime: 0,
        errorCount: 0,
        successCount: 0
      }
      this.toolUsage.set(toolId, usageData)
    }

    // 更新统计数据
    usageData.usageCount++
    usageData.lastUsed = Date.now()
    usageData.totalTime += responseTime
    usageData.averageResponseTime = usageData.totalTime / usageData.usageCount
    
    if (success) {
      usageData.successCount++
    } else {
      usageData.errorCount++
    }

    // 添加到会话数据
    this.sessionData.toolUsages.push({ ...usageData })

    console.log(`[Analytics] 工具使用记录: ${toolName} (${responseTime}ms, ${success ? '成功' : '失败'})`)
  }

  /**
   * 记录页面访问
   */
  trackPageView(page: string, title: string): void {
    if (!this.isTracking || !this.sessionData) return

    this.sessionData.pageViews++
    
    this.trackUserBehavior({
      type: 'page_view',
      data: { page, title, url: window.location.href }
    })
    
    console.log(`[Analytics] 页面访问记录: ${page} - ${title}`)
  }

  /**
   * 记录性能指标
   */
  trackPerformance(eventName: string, duration: number, metadata?: any): void {
    if (!this.isTracking || !this.sessionData) return

    this.trackUserBehavior({
      type: 'performance',
      data: { eventName, duration, metadata, url: window.location.href }
    })
    
    console.log(`[Analytics] 性能记录: ${eventName} - ${duration}ms`)
  }

  /**
   * 记录性能指标
   */
  trackPerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    if (!this.isTracking || !this.sessionData) return

    const fullMetrics: PerformanceMetrics = {
      pageLoadTime: metrics.pageLoadTime || 0,
      apiResponseTime: metrics.apiResponseTime || 0,
      renderTime: metrics.renderTime || 0,
      resourceLoadTime: metrics.resourceLoadTime || 0,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.sessionData.performanceMetrics.push(fullMetrics)
    
    // 限制存储数量
    if (this.sessionData.performanceMetrics.length > 50) {
      this.sessionData.performanceMetrics = this.sessionData.performanceMetrics.slice(-50)
    }
  }

  /**
   * 记录用户行为
   */
  trackUserBehavior(event: Omit<UserBehaviorEvent, 'timestamp' | 'url' | 'sessionId'>): void {
    if (!this.isTracking || !this.sessionData || !this.config.enableUserBehaviorTracking) return

    const behaviorEvent: UserBehaviorEvent = {
      ...event,
      timestamp: Date.now(),
      url: window.location.href,
      sessionId: this.sessionData.sessionId
    }

    this.sessionData.behaviorEvents.push(behaviorEvent)
    
    // 限制存储数量
    if (this.sessionData.behaviorEvents.length > 100) {
      this.sessionData.behaviorEvents = this.sessionData.behaviorEvents.slice(-100)
    }
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObserver(): void {
    if (!this.config.enablePerformanceTracking || !window.PerformanceObserver) return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.trackPerformanceMetrics({
              pageLoadTime: entry.duration,
              apiResponseTime: 0,
              renderTime: 0,
              resourceLoadTime: 0
            })
          } else if (entry.entryType === 'resource') {
            this.trackPerformanceMetrics({
              pageLoadTime: 0,
              apiResponseTime: 0,
              renderTime: 0,
              resourceLoadTime: entry.duration
            })
          }
        })
      })

      this.performanceObserver.observe({ entryTypes: ['navigation', 'resource'] })
    } catch (error) {
      console.warn('[Analytics] 性能观察器初始化失败:', error)
    }
  }

  /**
   * 设置错误跟踪
   */
  private setupErrorTracking(): void {
    if (!this.config.enableErrorTracking) return

    // 监听 JavaScript 错误
    window.addEventListener('error', (event) => {
      this.trackError('javascript', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // 监听未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('promise', {
        reason: event.reason
      })
    })
  }

  /**
   * 记录错误
   */
  private trackError(type: string, errorData: any): void {
    if (!this.isTracking) return

    console.error(`[Analytics] 错误记录 (${type}):`, errorData)
    
    // 可以在这里添加错误统计逻辑
  }

  /**
   * 获取工具使用统计
   */
  getToolUsageStats(): ToolUsageData[] {
    return Array.from(this.toolUsage.values()).sort((a, b) => b.usageCount - a.usageCount)
  }

  /**
   * 获取会话数据
   */
  getSessionData(): SessionData | null {
    return this.sessionData
  }

  /**
   * 获取设备信息
   */
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存数据到本地存储
   */
  saveData(): void {
    if (!this.sessionData) return

    const data = {
      sessionData: this.sessionData,
      toolUsage: Array.from(this.toolUsage.entries()),
      timestamp: Date.now()
    }

    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(data))
      console.log('[Analytics] 数据已保存到本地存储')
    } catch (error) {
      console.warn('[Analytics] 数据保存失败:', error)
    }
  }

  /**
   * 从本地存储加载数据
   */
  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        
        if (data.toolUsage && Array.isArray(data.toolUsage)) {
          this.toolUsage = new Map(data.toolUsage)
        }
        
        console.log('[Analytics] 历史数据已加载')
      }
    } catch (error) {
      console.warn('[Analytics] 数据加载失败:', error)
    }
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7天

    // 清理旧的工具使用数据
    for (const [key, usage] of this.toolUsage.entries()) {
      if (now - usage.lastUsed > maxAge) {
        this.toolUsage.delete(key)
      }
    }

    console.log('[Analytics] 过期数据已清理')
  }

  /**
   * 销毁分析系统
   */
  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    this.saveData()
    this.isTracking = false
    
    console.log('[Analytics] 分析系统已销毁')
  }

  /**
   * 获取统计摘要
   */
  getSummary() {
    const toolStats = this.getToolUsageStats()
    const totalUsage = toolStats.reduce((sum, tool) => sum + tool.usageCount, 0)
    const totalErrors = toolStats.reduce((sum, tool) => sum + tool.errorCount, 0)
    const averageResponseTime = toolStats.reduce((sum, tool) => sum + tool.averageResponseTime, 0) / toolStats.length || 0

    return {
      totalTools: toolStats.length,
      totalUsage,
      totalErrors,
      averageResponseTime,
      sessionDuration: this.sessionData ? Date.now() - this.sessionData.startTime : 0,
      topTools: toolStats.slice(0, 5)
    }
  }
}

// 导出单例实例
export const analytics = AnalyticsManager.getInstance()

// 导出 AnalyticsManager 类
export { AnalyticsManager }

/**
 * 工具使用统计 Hook（为 React 组件准备）
 */
export function useAnalytics() {
  const trackToolUsage = (toolId: string, toolName: string, category: string, responseTime: number, success = true) => {
    analytics.trackToolUsage(toolId, toolName, category, responseTime, success)
  }

  const getToolStats = () => {
    return analytics.getToolUsageStats()
  }

  const getSummary = () => {
    return analytics.getSummary()
  }

  return {
    trackToolUsage,
    getToolStats,
    getSummary,
    analytics
  }
}