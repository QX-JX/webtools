import React from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingSpinner, Skeleton } from './LoadingStates'
import { ErrorRetry, EmptyState } from './ErrorHandling'

interface LoadingWrapperProps<T> {
  loading: boolean
  error?: string | null
  data?: T | null
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: React.ReactNode
  onRetry?: () => void
  emptyText?: string
  emptyDescription?: string
}

/**
 * 通用加载状态包装组件
 */
export function LoadingWrapper<T>({
  loading,
  error,
  data,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  onRetry,
  emptyText,
  emptyDescription
}: LoadingWrapperProps<T>) {
  const { t } = useTranslation()
  const resolvedEmptyText = emptyText ?? t('errors.noData')
  const resolvedEmptyDescription = emptyDescription ?? t('errors.noRelatedData')

  if (loading) {
    return (
      <>
        {loadingComponent || <LoadingSpinner />}
      </>
    )
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorRetry 
            error={error} 
            onRetry={onRetry || (() => window.location.reload())}
          />
        )}
      </>
    )
  }

  if (data === null || data === undefined) {
    return (
      <>
        {emptyComponent || (
          <EmptyState 
            title={resolvedEmptyText}
            description={resolvedEmptyDescription}
          />
        )}
      </>
    )
  }

  if (Array.isArray(data) && data.length === 0) {
    return (
      <>
        {emptyComponent || (
          <EmptyState 
            title={resolvedEmptyText}
            description={resolvedEmptyDescription}
          />
        )}
      </>
    )
  }

  return <>{children}</>
}

interface AsyncWrapperProps<T> {
  asyncState: {
    data: T | null
    loading: boolean
    error: string | null
    execute: (...args: any[]) => Promise<T | null>
  }
  children: React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
}

/**
 * 异步状态包装组件
 */
export function AsyncWrapper<T>({
  asyncState,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent
}: AsyncWrapperProps<T>) {
  return (
    <LoadingWrapper
      loading={asyncState.loading}
      error={asyncState.error}
      data={asyncState.data}
      loadingComponent={loadingComponent}
      errorComponent={errorComponent}
      emptyComponent={emptyComponent}
      onRetry={() => asyncState.execute()}
    >
      {children}
    </LoadingWrapper>
  )
}

/**
 * 卡片加载状态组件
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <Skeleton lines={lines} />
    </div>
  )
}

/**
 * 列表加载状态组件
 */
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }, (_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  )
}

/**
 * 表格加载状态组件
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: cols }, (_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <Skeleton lines={1} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: cols }, (_, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap">
                    <Skeleton lines={1} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
