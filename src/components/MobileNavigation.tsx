import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Settings, User, ChevronRight, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useResponsive, useTouchGestures } from '../hooks/useResponsive'

interface MobileNavItem {
  name: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface MobileNavigationProps {
  items: MobileNavItem[]
  userMenu?: boolean
  showSearch?: boolean
}

/**
 * 移动端底部导航组件
 */
export function MobileBottomNavigation({ items, userMenu = true }: MobileNavigationProps) {
  const { t } = useTranslation()
  const location = useLocation()
  const { isMobile } = useResponsive()
  const [activeItem, setActiveItem] = useState('')

  useEffect(() => {
    // 根据当前路径确定活动项
    const currentItem = items.find(item => location.pathname.startsWith(item.path))
    setActiveItem(currentItem?.path || items[0]?.path || '')
  }, [location.pathname, items])

  if (!isMobile) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-xs font-medium">{t(item.name)}</span>
              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
        
        {userMenu && (
          <button className="flex flex-col items-center justify-center flex-1 py-2 px-1 text-gray-500 hover:text-gray-700">
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{t('common.my')}</span>
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 移动端侧边抽屉导航
 */
export function MobileDrawerNavigation({ items, isOpen, onClose }: {
  items: MobileNavItem[]
  isOpen: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  const { onTouchStart, onTouchMove, onTouchEnd, swipeDirection } = useTouchGestures()

  useEffect(() => {
    // 右滑关闭抽屉
    if (swipeDirection === 'right') {
      onClose()
    }
  }, [swipeDirection, onClose])

  if (!isMobile) return null

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* 遮罩层 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* 抽屉内容 */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-out"
        style={{ transform: isOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{t('common.menu')}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航项 */}
        <nav className="flex-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center justify-between p-4 text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">{t(item.name)}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            )
          })}
        </nav>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-500" />
            <span className="font-medium">{t('common.settings')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 移动端浮动操作按钮
 */
export function MobileFloatingButton({ 
  onClick, 
  icon: Icon, 
  position = 'bottom-right',
  color = 'indigo'
}: {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  color?: 'indigo' | 'blue' | 'green' | 'red' | 'purple'
}) {
  const { isMobile } = useResponsive()
  
  if (!isMobile) return null

  const positionClasses = {
    'bottom-right': 'bottom-20 right-4',
    'bottom-left': 'bottom-20 left-4',
    'top-right': 'top-20 right-4',
    'top-left': 'top-20 left-4'
  }

  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    red: 'bg-red-600 hover:bg-red-700',
    purple: 'bg-purple-600 hover:bg-purple-700'
  }

  return (
    <button
      onClick={onClick}
      className={`fixed ${positionClasses[position]} w-14 h-14 ${colorClasses[color]} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 z-40`}
    >
      <Icon className="w-6 h-6 mx-auto" />
    </button>
  )
}

/**
 * 移动端搜索栏
 */
export function MobileSearchBar({ 
  placeholder,
  onSearch,
  value,
  onChange
}: {
  placeholder?: string
  onSearch?: (value: string) => void
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  const resolvedPlaceholder = placeholder || t('common.search')
  
  if (!isMobile) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-top">
      <div className="flex items-center p-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={resolvedPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch?.(value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        <button 
          onClick={() => onSearch?.(value)}
          className="ml-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          {t('common.search')}
        </button>
      </div>
    </div>
  )
}
