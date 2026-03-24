import React from 'react'
import { ToolUsageRecord, getToolHistoryManager } from '../utils/toolHistory'

export interface ToolHistoryHook {
  history: ToolUsageRecord[]
  favorites: ToolUsageRecord[]
  recentTools: ToolUsageRecord[]
  mostUsedTools: ToolUsageRecord[]
  isLoading: boolean
  error: string | null
  recordToolUsage: (
    toolId: string,
    toolName: string,
    toolCategory: string,
    parameters?: Record<string, any>,
    results?: any
  ) => void
  toggleFavorite: (toolId: string) => Promise<boolean>
  isFavorite: (toolId: string) => boolean
  searchHistory: (query: string) => ToolUsageRecord[]
  clearHistory: () => Promise<void>
  removeTool: (toolId: string) => Promise<void>
  refreshHistory: () => void
  usageStats: {
    totalToolsUsed: number
    totalUsageCount: number
    mostUsedTool?: ToolUsageRecord
    recentlyUsedTool?: ToolUsageRecord
    favoriteCount: number
  }
}

export function useToolHistory(): ToolHistoryHook {
  const [history, setHistory] = React.useState<ToolUsageRecord[]>([])
  const [favorites, setFavorites] = React.useState<ToolUsageRecord[]>([])
  const [recentTools, setRecentTools] = React.useState<ToolUsageRecord[]>([])
  const [mostUsedTools, setMostUsedTools] = React.useState<ToolUsageRecord[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [usageStats, setUsageStats] = React.useState({
    totalToolsUsed: 0,
    totalUsageCount: 0,
    favoriteCount: 0
  })

  const manager = React.useRef(getToolHistoryManager({
    onHistoryUpdate: (updatedHistory) => {
      setHistory(updatedHistory)
      setFavorites(updatedHistory.filter(record => record.favorite))
      setRecentTools(updatedHistory.slice(0, 10))
      setMostUsedTools([...updatedHistory].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10))
      
      const stats = getToolHistoryManager().getUsageStats()
      setUsageStats(stats)
    }
  })).current

  React.useEffect(() => {
    try {
      setIsLoading(true)
      const currentHistory = manager.getHistory()
      setHistory(currentHistory)
      setFavorites(currentHistory.filter(record => record.favorite))
      setRecentTools(currentHistory.slice(0, 10))
      setMostUsedTools([...currentHistory].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10))
      
      const stats = manager.getUsageStats()
      setUsageStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const recordToolUsage = React.useCallback((
    toolId: string,
    toolName: string,
    toolCategory: string,
    parameters?: Record<string, any>,
    results?: any
  ) => {
    try {
      manager.recordToolUsage(toolId, toolName, toolCategory, parameters, results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record tool usage')
    }
  }, [manager])

  const toggleFavorite = React.useCallback(async (toolId: string): Promise<boolean> => {
    try {
      return manager.toggleFavorite(toolId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle favorite')
      return false
    }
  }, [manager])

  const isFavorite = React.useCallback((toolId: string): boolean => {
    return manager.isFavorite(toolId)
  }, [manager])

  const searchHistory = React.useCallback((query: string): ToolUsageRecord[] => {
    return manager.searchHistory(query)
  }, [manager])

  const clearHistory = React.useCallback(async (): Promise<void> => {
    try {
      manager.clearHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history')
    }
  }, [manager])

  const removeTool = React.useCallback(async (toolId: string): Promise<void> => {
    try {
      manager.removeTool(toolId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove tool')
    }
  }, [manager])

  const refreshHistory = React.useCallback(() => {
    try {
      const currentHistory = manager.getHistory()
      setHistory(currentHistory)
      setFavorites(currentHistory.filter(record => record.favorite))
      setRecentTools(currentHistory.slice(0, 10))
      setMostUsedTools([...currentHistory].sort((a, b) => b.usageCount - a.usageCount).slice(0, 10))
      
      const stats = manager.getUsageStats()
      setUsageStats(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh history')
    }
  }, [manager])

  return {
    history,
    favorites,
    recentTools,
    mostUsedTools,
    isLoading,
    error,
    recordToolUsage,
    toggleFavorite,
    isFavorite,
    searchHistory,
    clearHistory,
    removeTool,
    refreshHistory,
    usageStats
  }
}

export function useToolFavorite(toolId: string): {
  isFavorite: boolean
  toggleFavorite: () => Promise<boolean>
} {
  const { favorites, toggleFavorite } = useToolHistory()
  const [favoriteStatus, setFavoriteStatus] = React.useState(false)

  React.useEffect(() => {
    setFavoriteStatus(favorites.some(fav => fav.toolId === toolId))
  }, [toolId, favorites])

  const handleToggle = React.useCallback(async () => {
    const newStatus = await toggleFavorite(toolId)
    setFavoriteStatus(newStatus)
    return newStatus
  }, [toolId, toggleFavorite])

  return {
    isFavorite: favoriteStatus,
    toggleFavorite: handleToggle
  }
}

export function useRecentTools(limit: number = 5): {
  recentTools: ToolUsageRecord[]
  isLoading: boolean
  refresh: () => void
} {
  const { recentTools, isLoading, refreshHistory } = useToolHistory()
  const [filteredRecent, setFilteredRecent] = React.useState<ToolUsageRecord[]>([])

  React.useEffect(() => {
    setFilteredRecent(recentTools.slice(0, limit))
  }, [recentTools, limit])

  return {
    recentTools: filteredRecent,
    isLoading,
    refresh: refreshHistory
  }
}

export function useMostUsedTools(limit: number = 5): {
  mostUsedTools: ToolUsageRecord[]
  isLoading: boolean
  refresh: () => void
} {
  const { mostUsedTools, isLoading, refreshHistory } = useToolHistory()
  const [filteredMostUsed, setFilteredMostUsed] = React.useState<ToolUsageRecord[]>([])

  React.useEffect(() => {
    setFilteredMostUsed(mostUsedTools.slice(0, limit))
  }, [mostUsedTools, limit])

  return {
    mostUsedTools: filteredMostUsed,
    isLoading,
    refresh: refreshHistory
  }
}