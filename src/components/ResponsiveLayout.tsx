import { ReactNode } from 'react'
import { useResponsive } from '../hooks/useResponsive'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: boolean
  center?: boolean
}

/**
 * 响应式容器组件
 */
export default function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = 'lg',
  padding = true,
  center = true
}: ResponsiveContainerProps) {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  const maxWidthClasses = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: isLarge ? 'max-w-7xl' : 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    full: 'max-w-none'
  }

  const paddingClasses = padding 
    ? isMobile ? 'px-4' : isTablet ? 'px-6' : isDesktop ? 'px-8' : 'px-12'
    : ''

  const centerClass = center ? 'mx-auto' : ''

  return (
    <div className={`${maxWidthClasses[maxWidth]} ${paddingClasses} ${centerClass} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
  gap?: {
    mobile?: number
    tablet?: number
    desktop?: number
    large?: number
  }
}

/**
 * 响应式网格组件
 */
export function ResponsiveGrid({ 
  children, 
  className = '',
  cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = { mobile: 3, tablet: 4, desktop: 6, large: 8 }
}: ResponsiveGridProps) {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  const getGridCols = () => {
    if (isMobile) return `grid-cols-${cols.mobile || 1}`
    if (isTablet) return `grid-cols-${cols.tablet || 2}`
    if (isDesktop) return `grid-cols-${cols.desktop || 3}`
    if (isLarge) return `grid-cols-${cols.large || 4}`
    return 'grid-cols-1'
  }

  const getGap = () => {
    if (isMobile) return `gap-${gap.mobile || 3}`
    if (isTablet) return `gap-${gap.tablet || 4}`
    if (isDesktop) return `gap-${gap.desktop || 6}`
    if (isLarge) return `gap-${gap.large || 8}`
    return 'gap-3'
  }

  return (
    <div className={`grid ${getGridCols()} ${getGap()} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  size?: {
    mobile?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    tablet?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    desktop?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
    large?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
  }
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: string
}

/**
 * 响应式文本组件
 */
export function ResponsiveText({ 
  children, 
  className = '',
  size = { mobile: 'sm', tablet: 'base', desktop: 'base', large: 'lg' },
  weight = 'normal',
  color = 'text-gray-900'
}: ResponsiveTextProps) {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  const getTextSize = () => {
    if (isMobile) return `text-${size.mobile || 'sm'}`
    if (isTablet) return `text-${size.tablet || 'base'}`
    if (isDesktop) return `text-${size.desktop || 'base'}`
    if (isLarge) return `text-${size.large || 'lg'}`
    return 'text-base'
  }

  const getFontWeight = () => {
    return `font-${weight}`
  }

  return (
    <div className={`${getTextSize()} ${getFontWeight()} ${color} ${className}`}>
      {children}
    </div>
  )
}

interface ResponsiveButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: {
    mobile?: 'sm' | 'base' | 'lg'
    tablet?: 'sm' | 'base' | 'lg'
    desktop?: 'sm' | 'base' | 'lg'
    large?: 'sm' | 'base' | 'lg'
  }
  fullWidth?: boolean
  disabled?: boolean
}

/**
 * 响应式按钮组件
 */
export function ResponsiveButton({ 
  children, 
  onClick,
  className = '',
  variant = 'primary',
  size = { mobile: 'sm', tablet: 'base', desktop: 'base', large: 'base' },
  fullWidth = false,
  disabled = false
}: ResponsiveButtonProps) {
  const { isMobile, isTablet, isDesktop, isLarge } = useResponsive()
  
  const getButtonSize = () => {
    const sizeValue = isMobile ? size.mobile : isTablet ? size.tablet : isDesktop ? size.desktop : isLarge ? size.large : size.desktop
    switch (sizeValue) {
      case 'sm':
        return 'px-3 py-2 text-sm'
      case 'lg':
        return 'px-6 py-3 text-lg'
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300'
      case 'secondary':
        return 'bg-gray-600 text-white hover:bg-gray-700 disabled:bg-gray-300'
      case 'outline':
        return 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:border-indigo-300 disabled:text-indigo-300'
      case 'ghost':
        return 'text-indigo-600 hover:bg-indigo-50 disabled:text-indigo-300'
      default:
        return 'bg-indigo-600 text-white hover:bg-indigo-700'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getButtonSize()} ${getVariantClasses()} rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}