import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useResponsive } from '../hooks/useResponsive'
import ResponsiveContainer, { ResponsiveText } from './ResponsiveLayout'
import FavoriteButton from './FavoriteButton'
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp'
import { KeyboardShortcut } from '../utils/accessibility'

interface ToolPageLayoutProps {
  // 基本信息
  toolId: string
  title: string
  description: string
  icon: LucideIcon
  iconColor: string // 如 'from-blue-400 to-blue-600'
  
  // 内容
  children: ReactNode
  
  // 可选的信息区块
  infoTitle?: string
  infoContent?: ReactNode
  infoColor?: string // 如 'blue' | 'indigo' | 'green'
  
  // 键盘快捷键
  shortcuts?: KeyboardShortcut[]
  showShortcutsHelp?: boolean
  onShortcutsHelpClose?: () => void
  
  // 额外的头部操作按钮
  headerActions?: ReactNode
}

export default function ToolPageLayout({
  toolId,
  title,
  description,
  icon: Icon,
  iconColor,
  children,
  infoTitle,
  infoContent,
  infoColor = 'blue',
  shortcuts,
  showShortcutsHelp = false,
  onShortcutsHelpClose,
  headerActions
}: ToolPageLayoutProps) {
  const { t } = useTranslation()
  const { isMobile } = useResponsive()
  
  const infoBgColors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100'
  }
  
  const infoTextColors: Record<string, string> = {
    blue: 'text-blue-800',
    indigo: 'text-indigo-800',
    green: 'text-green-800',
    purple: 'text-purple-800',
    orange: 'text-orange-800'
  }
  
  const infoContentColors: Record<string, string> = {
    blue: 'text-blue-700',
    indigo: 'text-indigo-700',
    green: 'text-green-700',
    purple: 'text-purple-700',
    orange: 'text-orange-700'
  }

  return (
    <ResponsiveContainer className="py-8">
      <div role="main" aria-label={t(title)}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`bg-gradient-to-br ${iconColor} rounded-2xl flex items-center justify-center ${
            isMobile ? 'w-12 h-12' : 'w-14 h-14'
          }`}>
            <Icon className={`text-white ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          </div>
          <div>
            <ResponsiveText 
              size={{ mobile: 'xl', tablet: '2xl', desktop: '2xl', large: '3xl' }}
              weight="bold"
              color="text-gray-900"
            >
              {t(title)}
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'sm', tablet: 'base', desktop: 'base', large: 'lg' }}
              color="text-gray-500"
            >
              {t(description)}
            </ResponsiveText>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <FavoriteButton
            toolId={toolId}
            size={isMobile ? 'sm' : 'md'}
            variant="outline"
            showLabel={false}
          />
        </div>
      </div>

      {/* Main Content */}
      {children}

      {/* Info Block (Optional) */}
      {infoTitle && infoContent && (
        <div className={`${infoBgColors[infoColor]} border rounded-xl p-6 mb-8`}>
          <h3 className={`font-semibold ${infoTextColors[infoColor]} mb-2`}>
            {t(infoTitle)}
          </h3>
          <div className={`text-sm ${infoContentColors[infoColor]} leading-relaxed`}>
            {typeof infoContent === 'string' ? t(infoContent) : infoContent}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Dialog */}
      {shortcuts && showShortcutsHelp && (
        <KeyboardShortcutsHelp
          shortcuts={shortcuts}
          onClose={onShortcutsHelpClose || (() => {})}
        />
      )}
      </div>
    </ResponsiveContainer>
  )
}

// 常用的工具卡片组件
interface ToolCardProps {
  children: ReactNode
  className?: string
}

export function ToolCard({ children, className = '' }: ToolCardProps) {
  return (
    <div className={`bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  )
}

// 工具操作按钮组
interface ToolActionsProps {
  children: ReactNode
  className?: string
}

export function ToolActions({ children, className = '' }: ToolActionsProps) {
  return (
    <div className={`flex justify-center gap-4 mt-6 ${className}`}>
      {children}
    </div>
  )
}
