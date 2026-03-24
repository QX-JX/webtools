import { useState } from 'react'
import { Clock, Star, TrendingUp, Search, Trash2, Filter, Download } from 'lucide-react'
import { useToolHistory } from '../../hooks/useToolHistory'
import ToolHistoryPanel, { ToolHistoryItem } from '../../components/ToolHistory'
import { useResponsive } from '../../hooks/useResponsive'
import ResponsiveContainer, { ResponsiveText, ResponsiveButton } from '../../components/ResponsiveLayout'
import { ToolExporter } from '../../utils/export'
import { useI18nSection } from '../../i18n/helpers'

export default function ToolHistoryDemo() {
  const text = useI18nSection<any>('pages.toolHistoryDemo')
  const {
    history,
    favorites,
    recentTools,
    mostUsedTools,
    isLoading,
    error,
    clearHistory,
    searchHistory,
    usageStats
  } = useToolHistory()

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'favorites' | 'analytics'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const { isMobile } = useResponsive()

  const handleClearHistory = async () => {
    if (window.confirm(text.confirmClear)) {
      await clearHistory()
    }
  }

  const handleExportHistory = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const dataToExport = searchQuery ? searchHistory(searchQuery) : history
      
      if (format === 'json') {
        ToolExporter.exportToolResults(text.exportTitle, dataToExport, {
          format: 'json',
          filename: 'tool-history.json',
          prettyPrint: true,
          includeMetadata: true
        })
      } else if (format === 'csv') {
        ToolExporter.exportToolResults(text.exportTitle, dataToExport, {
          format: 'csv',
          filename: 'tool-history.csv',
          includeMetadata: true
        })
      } else if (format === 'txt') {
        const textContent = dataToExport.map((record: any) => 
          `${record.toolName} (${record.toolCategory})\n` +
          `${text.usageCount.replace('{{count}}', String(record.usageCount))}\n` +
          `${text.lastUsed.replace('{{time}}', new Date(record.lastUsed).toLocaleString('zh-CN'))}\n` +
          `${text.favorite.replace('{{value}}', record.favorite ? text.yes : text.no)}\n` +
          '---\n'
        ).join('\n')
        
        ToolExporter.exportToolResults(text.exportTitle, textContent, {
          format: 'txt',
          filename: 'tool-history.txt'
        })
      }
      
      setShowExportDialog(false)
    } catch (error) {
      console.error(text.exportFailed, error)
      alert(text.exportFailed)
    }
  }

  const tabs = [
    { key: 'overview', label: text.tabs.overview, icon: TrendingUp },
    { key: 'history', label: text.tabs.history, icon: Clock },
    { key: 'favorites', label: text.tabs.favorites, icon: Star },
    { key: 'analytics', label: text.tabs.analytics, icon: Filter }
  ]

  if (isLoading) {
    return (
      <ResponsiveContainer className="py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{text.loading}</p>
        </div>
      </ResponsiveContainer>
    )
  }

  if (error) {
    return (
      <ResponsiveContainer className="py-8">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600">{text.loadFailed.replace('{{error}}', error)}</p>
        </div>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center ${
            isMobile ? 'w-12 h-12' : 'w-14 h-14'
          }`}>
            <Clock className={`text-white ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          <div>
            <ResponsiveText 
              size={{ mobile: 'xl', tablet: '2xl', desktop: '2xl', large: '3xl' }}
              weight="bold"
              color="text-gray-900"
            >
              {text.title}
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'sm', tablet: 'base', desktop: 'base', large: 'lg' }}
              color="text-gray-500"
            >
              {text.description}
            </ResponsiveText>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ResponsiveButton
            onClick={() => setShowExportDialog(true)}
            variant="outline"
            size={{ mobile: 'sm', desktop: 'base' }}
            disabled={history.length === 0}
          >
            <Download className="w-4 h-4" />
            {text.export}
          </ResponsiveButton>
          <ResponsiveButton
            onClick={handleClearHistory}
            variant="outline"
            size={{ mobile: 'sm', desktop: 'base' }}
            disabled={history.length === 0}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            {text.clear}
          </ResponsiveButton>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={text.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Usage Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{text.stats.totalTools}</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.totalToolsUsed}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{text.stats.totalUsage}</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.totalUsageCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{text.stats.favoriteTools}</p>
                  <p className="text-2xl font-bold text-gray-900">{usageStats.favoriteCount}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{text.stats.averageUsage}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {usageStats.totalToolsUsed > 0 
                      ? Math.round(usageStats.totalUsageCount / usageStats.totalToolsUsed)
                      : 0}
                  </p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Filter className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <ToolHistoryPanel
            showSearch={false}
            showActions={false}
            maxItems={50}
          />
        )}

        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{text.favoriteToolsTitle}</h2>
              <p className="text-sm text-gray-500 mt-1">{text.favoriteToolsDescription}</p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(searchQuery ? searchHistory(searchQuery).filter((r: any) => r.favorite) : favorites).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {text.noFavoriteTools}
                  </div>
                ) : (
                  (searchQuery ? searchHistory(searchQuery).filter((r: any) => r.favorite) : favorites).map((record: any) => (
                    <ToolHistoryItem
                      key={record.id}
                      record={record}
                      showCategory={true}
                      showUsageCount={true}
                      showTimestamp={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Most Used Tools */}
            {mostUsedTools.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{text.mostUsed}</h3>
                <div className="space-y-3">
                  {mostUsedTools.slice(0, 10).map((tool: any, index: number) => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{tool.toolName}</h4>
                          <p className="text-sm text-gray-500">{tool.toolCategory}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{tool.usageCount}</p>
                        <p className="text-xs text-gray-500">{text.timesUsed}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentTools.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{text.recentActivity}</h3>
                <div className="space-y-3">
                  {recentTools.slice(0, 10).map((tool: any) => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{tool.toolName}</h4>
                        <p className="text-sm text-gray-500">{tool.toolCategory}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-900">
                          {new Date(tool.lastUsed).toLocaleDateString('zh-CN')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(tool.lastUsed).toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{text.exportDialogTitle}</h3>
            <p className="text-gray-600 mb-6">{text.exportDialogDescription}</p>
            <div className="space-y-3">
              <button
                onClick={() => handleExportHistory('json')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{text.formats.json.title}</div>
                <div className="text-sm text-gray-500">{text.formats.json.description}</div>
              </button>
              <button
                onClick={() => handleExportHistory('csv')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{text.formats.csv.title}</div>
                <div className="text-sm text-gray-500">{text.formats.csv.description}</div>
              </button>
              <button
                onClick={() => handleExportHistory('txt')}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{text.formats.txt.title}</div>
                <div className="text-sm text-gray-500">{text.formats.txt.description}</div>
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {text.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ResponsiveContainer>
  )
}
