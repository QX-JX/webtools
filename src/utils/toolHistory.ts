import React from 'react'

export interface ToolUsageRecord {
  id: string
  toolId: string
  toolName: string
  toolCategory: string
  timestamp: number
  usageCount: number
  lastUsed: number
  parameters?: Record<string, any>
  results?: any
  favorite?: boolean
}

export interface ToolHistoryManagerOptions {
  maxHistoryItems?: number
  storageKey?: string
  onHistoryUpdate?: (history: ToolUsageRecord[]) => void
}

class ToolHistoryManager {
  private maxHistoryItems: number
  private storageKey: string
  private onHistoryUpdate?: (history: ToolUsageRecord[]) => void
  private history: ToolUsageRecord[] = []

  constructor(options: ToolHistoryManagerOptions = {}) {
    this.maxHistoryItems = options.maxHistoryItems || 100
    this.storageKey = options.storageKey || 'tool_usage_history'
    this.onHistoryUpdate = options.onHistoryUpdate
    this.loadHistory()
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.history = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load tool history:', error)
      this.history = []
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history))
      this.onHistoryUpdate?.(this.history)
    } catch (error) {
      console.warn('Failed to save tool history:', error)
    }
  }

  recordToolUsage(
    toolId: string,
    toolName: string,
    toolCategory: string,
    parameters?: Record<string, any>,
    results?: any
  ): void {
    const now = Date.now()
    const existingRecord = this.history.find(record => record.toolId === toolId)

    if (existingRecord) {
      // Update existing record
      existingRecord.usageCount++
      existingRecord.lastUsed = now
      existingRecord.parameters = parameters
      existingRecord.results = results
    } else {
      // Create new record
      const newRecord: ToolUsageRecord = {
        id: `${toolId}-${now}`,
        toolId,
        toolName,
        toolCategory,
        timestamp: now,
        usageCount: 1,
        lastUsed: now,
        parameters,
        results,
        favorite: false
      }
      this.history.unshift(newRecord)
    }

    // Sort by last used (most recent first)
    this.history.sort((a, b) => b.lastUsed - a.lastUsed)

    // Limit history size
    if (this.history.length > this.maxHistoryItems) {
      this.history = this.history.slice(0, this.maxHistoryItems)
    }

    this.saveHistory()
  }

  getHistory(limit?: number): ToolUsageRecord[] {
    const history = [...this.history]
    return limit ? history.slice(0, limit) : history
  }

  getFavorites(): ToolUsageRecord[] {
    return this.history.filter(record => record.favorite)
  }

  getRecentTools(limit: number = 10): ToolUsageRecord[] {
    return this.history.slice(0, limit)
  }

  getMostUsedTools(limit: number = 10): ToolUsageRecord[] {
    return [...this.history]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  toggleFavorite(toolId: string): boolean {
    const record = this.history.find(record => record.toolId === toolId)
    if (record) {
      record.favorite = !record.favorite
      this.saveHistory()
      return record.favorite
    }
    return false
  }

  isFavorite(toolId: string): boolean {
    const record = this.history.find(record => record.toolId === toolId)
    return record?.favorite || false
  }

  clearHistory(): void {
    this.history = []
    this.saveHistory()
  }

  removeTool(toolId: string): void {
    this.history = this.history.filter(record => record.toolId !== toolId)
    this.saveHistory()
  }

  searchHistory(query: string): ToolUsageRecord[] {
    const lowercaseQuery = query.toLowerCase()
    return this.history.filter(record =>
      record.toolName.toLowerCase().includes(lowercaseQuery) ||
      record.toolCategory.toLowerCase().includes(lowercaseQuery) ||
      record.toolId.toLowerCase().includes(lowercaseQuery)
    )
  }

  getUsageStats(): {
    totalToolsUsed: number
    totalUsageCount: number
    mostUsedTool?: ToolUsageRecord
    recentlyUsedTool?: ToolUsageRecord
    favoriteCount: number
  } {
    const favorites = this.getFavorites()
    const mostUsed = this.getMostUsedTools(1)[0]
    const recentlyUsed = this.getRecentTools(1)[0]

    return {
      totalToolsUsed: this.history.length,
      totalUsageCount: this.history.reduce((sum, record) => sum + record.usageCount, 0),
      mostUsedTool: mostUsed,
      recentlyUsedTool: recentlyUsed,
      favoriteCount: favorites.length
    }
  }
}

// 全局实例
let globalHistoryManager: ToolHistoryManager | null = null

export function getToolHistoryManager(options?: ToolHistoryManagerOptions): ToolHistoryManager {
  if (!globalHistoryManager) {
    globalHistoryManager = new ToolHistoryManager(options)
  }
  return globalHistoryManager
}

export function useToolHistory() {
  const [history, setHistory] = React.useState<ToolUsageRecord[]>([])
  const [favorites, setFavorites] = React.useState<ToolUsageRecord[]>([])
  const [manager] = React.useState(() => getToolHistoryManager({
    onHistoryUpdate: (updatedHistory) => {
      setHistory(updatedHistory)
      setFavorites(updatedHistory.filter(record => record.favorite))
    }
  }))

  React.useEffect(() => {
    setHistory(manager.getHistory())
    setFavorites(manager.getFavorites())
  }, [])

  return {
    history,
    favorites,
    recordToolUsage: manager.recordToolUsage.bind(manager),
    toggleFavorite: manager.toggleFavorite.bind(manager),
    isFavorite: manager.isFavorite.bind(manager),
    getRecentTools: manager.getRecentTools.bind(manager),
    getMostUsedTools: manager.getMostUsedTools.bind(manager),
    searchHistory: manager.searchHistory.bind(manager),
    getUsageStats: manager.getUsageStats.bind(manager),
    clearHistory: manager.clearHistory.bind(manager),
    removeTool: manager.removeTool.bind(manager)
  }
}

export default ToolHistoryManager