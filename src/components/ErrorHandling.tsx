import React from 'react'
import { AlertTriangle, RefreshCw, X, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n/config'

export type AlertType = 'error' | 'warning' | 'info' | 'success'

interface AlertProps {
  type: AlertType
  title?: string
  message: string
  onClose?: () => void
  className?: string
  actions?: React.ReactNode
}

export const Alert: React.FC<AlertProps> = ({ 
  type, 
  title, 
  message, 
  onClose, 
  className = '',
  actions 
}) => {
  const icons = {
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    success: <CheckCircle className="w-5 h-5 text-green-500" />
  }

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800'
  }

  return (
    <div className={`border rounded-lg p-4 ${colors[type]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium">{title}</h3>
          )}
          <div className={`text-sm ${title ? 'mt-1' : ''}`}>
            {message}
          </div>
          {actions && (
            <div className="mt-3">
              {actions}
            </div>
          )}
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{i18n.t('errors.somethingWentWrong')}</h2>
            <p className="text-gray-600 mb-4">{i18n.t('errors.unexpectedError')}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {i18n.t('auth.retry')}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface ErrorRetryProps {
  error: string
  onRetry: () => void
  retryText?: string
}

export const ErrorRetry: React.FC<ErrorRetryProps> = ({ 
  error, 
  onRetry, 
  retryText 
}) => {
  const { t } = useTranslation()
  const finalRetryText = retryText || t('auth.retry')
  
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('errors.somethingWentWrong')}</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {finalRetryText}
        </button>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description,
  action 
}) => {
  const { t } = useTranslation()
  const finalTitle = title || t('errors.noData')
  const finalDescription = description || t('errors.noRelatedData')
  
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
        {icon || <Info className="h-6 w-6 text-gray-400" />}
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-2">{finalTitle}</h3>
      <p className="text-sm text-gray-500 mb-4">{finalDescription}</p>
      {action}
    </div>
  )
}