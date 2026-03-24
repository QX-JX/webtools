import { Link } from 'react-router-dom'
import { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '../hooks/useResponsive'

interface ResponsiveToolCardProps {
  title: string
  description: string
  icon: LucideIcon
  path: string
  color: string
  badge?: string
  usage?: number
  featured?: boolean
  onClick?: (path: string) => void
}

/**
 * 响应式工具卡片组件
 */
export default function ResponsiveToolCard({ 
  title, 
  description, 
  icon: Icon, 
  path, 
  color, 
  badge,
  usage,
  featured = false,
  onClick
}: ResponsiveToolCardProps) {
  const { t } = useTranslation()
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  // 点击时先滚动到顶部
  const handleClick = () => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    if (onClick) {
      onClick(path)
    }
  }
  
  const Component = (onClick ? 'button' : Link) as any
  const componentProps = onClick 
    ? { onClick: handleClick, type: 'button' as const }
    : { to: path, onClick: handleClick }
  
  const getPadding = () => {
    if (isMobile) return 'p-3'
    if (isTablet) return 'p-4'
    if (isDesktop) return 'p-4'
    return 'p-5'
  }

  const getIconSize = () => {
    if (isMobile) return 'w-8 h-8'
    if (isTablet) return 'w-9 h-9'
    if (isDesktop) return 'w-10 h-10'
    return 'w-11 h-11'
  }

  const getIconInnerSize = () => {
    if (isMobile) return 'w-5 h-5'
    if (isTablet) return 'w-6 h-6'
    if (isDesktop) return 'w-6 h-6'
    return 'w-7 h-7'
  }

  const getTitleSize = () => {
    if (isMobile) return 'text-sm'
    if (isTablet) return 'text-base'
    if (isDesktop) return 'text-base'
    return 'text-lg'
  }
  
  return (
    <Component 
      {...componentProps}
      className={`
        group relative overflow-hidden rounded-xl transition-all duration-300 hover:shadow-xl
        ${getPadding()}
        ${featured ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200' : 'bg-white border border-gray-100'}
        hover:-translate-y-1 hover:border-indigo-300
        ${onClick ? 'w-full text-left' : ''}
      `}
    >
      {/* 特色标识 */}
      {featured && (
        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
          {t('common.recommended')}
        </div>
      )}
      
      {/* 图标区域 */}
      <div className={`
        ${getIconSize()}
        ${color} rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300
      `}>
        <Icon className={`${getIconInnerSize()} text-white`} />
      </div>
      
      {/* 文字区域 */}
      <div className="flex flex-col gap-1 overflow-hidden">
        <h3 className={`${getTitleSize()} font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate`}>
          {t(title)}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
          {t(description)}
        </p>
      </div>

      {/* 底部信息 (可选) */}
      {usage !== undefined && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            {t('common.usageCount', { count: usage })}
          </span>
          {badge && (
            <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-md font-medium">
              {t(badge)}
            </span>
          )}
        </div>
      )}
      
      {/* 悬停效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* 箭头指示器 */}
      <div className="absolute bottom-4 right-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Component>
  )
}

/**
 * 响应式工具列表组件
 */
export function ResponsiveToolList({ 
  tools,
  featuredTools = [],
  showUsage = true,
  columns = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  onToolClick
}: {
  tools: Array<{
    id: string
    title: string
    description: string
    icon: LucideIcon
    path: string
    color: string
    category: string
    usage?: number
  }>
  featuredTools?: string[]
  showUsage?: boolean
  columns?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
  onToolClick?: (toolId: string, path: string) => void
}) {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  const getGridCols = () => {
    if (isMobile) return `grid-cols-${columns.mobile || 1}`
    if (isTablet) return `grid-cols-${columns.tablet || 2}`
    if (isDesktop) return `grid-cols-${columns.desktop || 3}`
    if (isLarge) return `grid-cols-${columns.large || 4}`
    return 'grid-cols-1'
  }

  return (
    <div className={`grid ${getGridCols()} gap-4 md:gap-6 lg:gap-8`}>
      {tools.map((tool) => (
        <ResponsiveToolCard
          key={tool.id}
          title={tool.title}
          description={tool.description}
          icon={tool.icon}
          path={tool.path}
          color={tool.color}
          usage={showUsage ? tool.usage : undefined}
          featured={featuredTools.includes(tool.id)}
          onClick={onToolClick ? () => onToolClick(tool.id, tool.path) : undefined}
        />
      ))}
    </div>
  )
}

/**
 * 工具分类展示组件
 */
export function ResponsiveToolCategories({ 
  categories,
  tools,
  showCounts = true
}: {
  categories: Array<{
    id: string
    name: string
    icon: LucideIcon
    color: string
  }>
  tools: Array<{
    id: string
    title: string
    description: string
    icon: LucideIcon
    path: string
    color: string
    category: string
  }>
  showCounts?: boolean
}) {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  
  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryTools = tools.filter(tool => tool.category === category.id)
        const Icon = category.icon
        
        if (categoryTools.length === 0) return null
        
        return (
          <div key={category.id} className="space-y-4">
            {/* 分类标题 */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {t(category.name)}
                </h2>
                {showCounts && (
                  <p className="text-sm text-gray-500">
                    {t('common.toolsCount', { count: categoryTools.length })}
                  </p>
                )}
              </div>
            </div>
            
            {/* 工具列表 */}
            <ResponsiveToolList tools={categoryTools} showUsage={false} />
          </div>
        )
      })}
    </div>
  )
}