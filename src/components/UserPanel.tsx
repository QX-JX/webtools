import { useState, useRef, useEffect } from 'react'
import { LogOut, User, Loader, LayoutDashboard, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { KUNQIONG_AITOOLS_SETTINGS, KUNQIONG_AITOOLS_USER_CENTER } from '../config/kunqiongLinks'

interface UserPanelProps {
  avatar?: string
  nickname?: string
  onLogout: () => void
  isLoading?: boolean
  /** 覆盖触发按钮样式（例如与鲲穹官网页头「登录/注册」按钮一致） */
  triggerClassName?: string
  /** 与 aiformat 页头登录按钮同风格（白字、渐变底） */
  variant?: 'default' | 'kunqiongHeader'
}

export default function UserPanel({
  avatar,
  nickname,
  onLogout,
  isLoading,
  triggerClassName,
  variant = 'default',
}: UserPanelProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭面板
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={panelRef} className="relative">
      {/* 用户按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          triggerClassName ??
          (variant === 'kunqiongHeader'
            ? 'header-login-btn gap-2 min-w-0 max-w-[140px] sm:max-w-[200px]'
            : 'flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors min-w-0')
        }
        title={(nickname?.trim() || t('auth.user'))}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={nickname || ''}
            className={`w-7 h-7 rounded-full object-cover flex-shrink-0 bg-gray-100 ${variant === 'kunqiongHeader' ? 'ring-2 ring-white/40 shadow-sm' : 'ring-1 ring-gray-200/80'}`}
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <User className={`w-6 h-6 flex-shrink-0 ${variant === 'kunqiongHeader' ? 'text-white' : 'text-gray-600'}`} />
        )}
        <span
          className={`text-sm font-medium whitespace-nowrap truncate ${variant === 'kunqiongHeader' ? 'text-white' : 'text-gray-700 hidden sm:inline'}`}
        >
          {nickname?.trim() || t('auth.user')}
        </span>
      </button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* 用户信息 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {avatar ? (
                <img
                  src={avatar}
                  alt={nickname || ''}
                  className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-1 ring-gray-100"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{nickname?.trim() || t('auth.user')}</p>
                <p className="text-xs text-gray-500">{t('auth.loggedIn')}</p>
              </div>
            </div>
          </div>

          <a
            href={KUNQIONG_AITOOLS_USER_CENTER}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-100"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-600" />
            {t('auth.userCenter')}
          </a>

          <a
            href={KUNQIONG_AITOOLS_SETTINGS}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-100"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            {t('auth.settings')}
          </a>

          {/* 退出登录按钮 */}
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            disabled={isLoading}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {isLoading ? t('auth.loggingOut') : t('auth.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
