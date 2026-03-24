import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NetworkStatusProps {
  showToast?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

/**
 * 网络状态指示器组件
 * Network status indicator component
 */
export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  showToast = true,
  position = 'top-right'
}) => {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (showToast) {
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      if (showToast) {
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 3000)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [showToast])

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  }

  return (
    <>
      {/* 状态指示器 */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          isOnline 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span>{isOnline ? t('components.networkStatus.online') : t('components.networkStatus.offline')}</span>
        </div>
      </div>

      {/* 通知提示 */}
      {showNotification && (
        <div className={`fixed ${positionClasses[position]} z-50 mt-12`}>
          <div className={`px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            isOnline
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <span className="font-medium">
                {isOnline ? t('components.networkStatus.connected') : t('components.networkStatus.disconnected')}
              </span>
            </div>
            <p className="text-sm opacity-90 mt-1">
              {isOnline 
                ? t('components.networkStatus.connectedDescription')
                : t('components.networkStatus.disconnectedDescription')
              }
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * 网络状态 Hook
 * Network status hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline }
}

/**
 * 网络请求 Hook，支持离线处理
 * Network request hook with offline handling
 */
export function useNetworkRequest<T>() {
  const { t } = useTranslation()
  const { isOnline } = useNetworkStatus()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = async (
    url: string, 
    options?: RequestInit
  ): Promise<T | null> => {
    if (!isOnline) {
      setError(t('components.networkStatus.disconnected'))
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          ...options?.headers
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : t('components.networkStatus.requestFailed')
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { request, loading, error, isOnline }
}
