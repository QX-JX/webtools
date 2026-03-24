import React from 'react'
import { ToolUsageRecord } from '../utils/toolHistory'
import { useToolHistory, useToolFavorite } from '../hooks/useToolHistory'
import { useResponsive } from '../hooks/useResponsive'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useI18nSection } from '../i18n/helpers'

interface ToolHistoryItemProps {
  record: ToolUsageRecord
  onClick?: () => void
  onRemove?: () => void
  onToggleFavorite?: () => void
  showCategory?: boolean
  showUsageCount?: boolean
  showTimestamp?: boolean
  compact?: boolean
}

export const ToolHistoryItem: React.FC<ToolHistoryItemProps> = ({
  record,
  onClick,
  onRemove,
  onToggleFavorite,
  showCategory = true,
  showUsageCount = true,
  showTimestamp = true,
  compact = false
}) => {
  const text = useI18nSection<any>('components.toolHistory')
  const { isFavorite, toggleFavorite } = useToolFavorite(record.toolId)

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onToggleFavorite) {
      onToggleFavorite()
    } else {
      toggleFavorite()
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onRemove) {
      onRemove()
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: zhCN
    })
  }

  return (
    <div
      className={`group relative bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 ${
        compact ? 'p-3' : 'p-4'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onClick) {
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`font-medium text-gray-900 ${
              compact ? 'text-sm' : 'text-base'
            }`}>
              {record.toolName}
            </h3>
            {showCategory && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {record.toolCategory}
              </span>
            )}
          </div>
          
          {!compact && (
            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
              {showUsageCount && (
                <span>{text.usageCount.replace('{{count}}', String(record.usageCount))}</span>
              )}
              {showTimestamp && (
                <span>{text.recentUsed.replace('{{value}}', formatTimeAgo(record.lastUsed))}</span>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={handleToggleFavorite}
            className={`p-1 rounded-full transition-colors ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            aria-label={isFavorite ? text.removeFavorite : text.addFavorite}
            title={isFavorite ? text.removeFavorite : text.addFavorite}
          >
            <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
          
          {onRemove && (
            <button
              onClick={handleRemove}
              className="p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              aria-label={text.removeRecord}
              title={text.removeRecord}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToolHistoryListProps {
  records: ToolUsageRecord[]
  onToolClick?: (record: ToolUsageRecord) => void
  onRemoveRecord?: (record: ToolUsageRecord) => void
  onToggleFavorite?: (record: ToolUsageRecord) => void
  emptyMessage?: string
  showCategory?: boolean
  showUsageCount?: boolean
  showTimestamp?: boolean
  compact?: boolean
  className?: string
}

export const ToolHistoryList: React.FC<ToolHistoryListProps> = ({
  records,
  onToolClick,
  onRemoveRecord,
  onToggleFavorite,
  emptyMessage,
  showCategory = true,
  showUsageCount = true,
  showTimestamp = true,
  compact = false,
  className = ''
}) => {
  const navigate = useNavigate()

  const handleToolClick = (record: ToolUsageRecord) => {
    if (onToolClick) {
      onToolClick(record)
    } else {
      // Navigate to the tool page
      navigate(`/tools/${record.toolId}`)
    }
  }

  const handleRemoveRecord = (record: ToolUsageRecord) => {
    if (onRemoveRecord) {
      onRemoveRecord(record)
    }
  }

  const handleToggleFavorite = (record: ToolUsageRecord) => {
    if (onToggleFavorite) {
      onToggleFavorite(record)
    }
  }

  if (records.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage || text.emptyHistory}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {records.map((record) => (
        <ToolHistoryItem
          key={record.id}
          record={record}
          onClick={() => handleToolClick(record)}
          onRemove={onRemoveRecord ? () => handleRemoveRecord(record) : undefined}
          onToggleFavorite={onToggleFavorite ? () => handleToggleFavorite(record) : undefined}
          showCategory={showCategory}
          showUsageCount={showUsageCount}
          showTimestamp={showTimestamp}
          compact={compact}
        />
      ))}
    </div>
  )
}

interface ToolHistoryPanelProps {
  className?: string
  defaultTab?: 'recent' | 'favorites' | 'most-used'
  maxItems?: number
  showSearch?: boolean
  showActions?: boolean
  onToolClick?: (record: ToolUsageRecord) => void
}

export const ToolHistoryPanel: React.FC<ToolHistoryPanelProps> = ({
  className = '',
  defaultTab = 'recent',
  maxItems = 10,
  showSearch = true,
  showActions = true,
  onToolClick
}) => {
  const text = useI18nSection<any>('components.toolHistory')
  const [activeTab, setActiveTab] = React.useState<'recent' | 'favorites' | 'most-used'>(defaultTab)
  const [searchQuery, setSearchQuery] = React.useState('')
  const { history, favorites, recentTools, mostUsedTools, searchHistory, clearHistory } = useToolHistory()
  const { isMobile } = useResponsive()

  const getCurrentRecords = () => {
    let records: ToolUsageRecord[] = []
    
    switch (activeTab) {
      case 'recent':
        records = recentTools
        break
      case 'favorites':
        records = favorites
        break
      case 'most-used':
        records = mostUsedTools
        break
    }

    if (searchQuery) {
      records = searchHistory(searchQuery).filter(record =>
        records.some(r => r.id === record.id)
      )
    }

    return records.slice(0, maxItems)
  }

  const currentRecords = getCurrentRecords()

  const handleClearHistory = async () => {
    if (window.confirm(text.confirmClear)) {
      await clearHistory()
    }
  }

  const tabs = [
    { key: 'recent', label: text.tabs.recent, count: recentTools.length },
    { key: 'favorites', label: text.tabs.favorites, count: favorites.length },
    { key: 'most-used', label: text.tabs.mostUsed, count: mostUsedTools.length }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{text.title}</h2>
          {showActions && (
            <button
              onClick={handleClearHistory}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
              disabled={history.length === 0}
            >
              {text.clearHistory}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={text.searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.key ? 'page' : undefined}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
        <ToolHistoryList
          records={currentRecords}
          onToolClick={onToolClick}
          emptyMessage={
            activeTab === 'recent' ? text.emptyMessages.recent :
            activeTab === 'favorites' ? text.emptyMessages.favorites :
            text.emptyMessages.mostUsed
          }
          compact={isMobile}
        />
      </div>
    </div>
  )
}

export default ToolHistoryPanel
