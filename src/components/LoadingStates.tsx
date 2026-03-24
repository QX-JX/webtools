import React from 'react'
import { useTranslation } from 'react-i18next'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  className = '' 
}) => {
  const { t } = useTranslation()
  const finalText = text === undefined ? t('common.loading') : text
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
        {finalText && <p className="text-gray-600 text-sm">{finalText}</p>}
      </div>
    </div>
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  role?: string
  'aria-live'?: 'off' | 'assertive' | 'polite'
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  title,
  description,
  role,
  'aria-live': ariaLive
}) => {
  const { t } = useTranslation()
  const finalTitle = title || t('common.processing')
  const finalDescription = description || t('common.processingDescription')
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" role={role} aria-live={ariaLive}>
      <div className="flex items-center space-x-4">
        <LoadingSpinner size="sm" />
        <div>
          <h3 className="text-lg font-medium text-gray-900">{finalTitle}</h3>
          <p className="text-sm text-gray-500">{finalDescription}</p>
        </div>
      </div>
    </div>
  )
}

interface LoadingProgressProps {
  progress?: number
  text?: string
  showPercentage?: boolean
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  progress = 0, 
  text,
  showPercentage = true
}) => {
  const { t } = useTranslation()
  const finalText = text || t('common.inProgress')
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{finalText}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  lines = 1 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="h-4 bg-gray-200 rounded mb-2 last:mb-0"></div>
      ))}
    </div>
  )
}

interface LoadingButtonProps {
  loading: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  'aria-label'?: string
  title?: string
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading, 
  children, 
  disabled = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}