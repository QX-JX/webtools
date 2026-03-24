/// <reference lib="dom" />
import { useState, useCallback, useRef } from 'react'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface AsyncActions<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
  setError: (error: string | null) => void
}

export type UseAsyncReturn<T> = AsyncState<T> & AsyncActions<T>

/**
 * 处理异步操作的 Hook
 * @param asyncFunction 异步函数
 * @param immediate 是否立即执行
 * @returns 包含状态和方法的对象
 */
export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()
    
    setLoading(true)
    setError(null)

    try {
      // 将 signal 添加到参数中
      const result = await asyncFunction(...args, { signal: abortControllerRef.current.signal })
      setData(result)
      return result
    } catch (err: any) {
      // 忽略取消的请求
      if (err.name === 'AbortError') {
        return null
      }
      
      const errorMessage = err.message || '操作失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    // 取消正在进行的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setData(null)
    setLoading(false)
    setError(null)
  }, [])

  // 清理函数
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // 组件卸载时清理
  useState(() => {
    return cleanup
  })

  // 立即执行
  if (immediate && !loading && !error && !data) {
    execute()
  }

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
    setError
  }
}

/**
 * 处理 API 请求的 Hook，带有自动重试功能
 */
export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    immediate?: boolean
    maxRetries?: number
    retryDelay?: number
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  }
): UseAsyncReturn<T> & { retry: () => void } {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError
  } = options || {}

  const [retryCount, setRetryCount] = useState(0)
  const asyncResult = useAsync<T>(apiFunction, false)

  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      setTimeout(() => {
        asyncResult.execute()
      }, retryDelay)
    }
  }, [retryCount, maxRetries, retryDelay, asyncResult])

  // 包装 execute 函数以添加成功/失败回调
  const executeWithCallbacks = useCallback(async (...args: any[]) => {
    const result = await asyncResult.execute(...args)
    if (result) {
      onSuccess?.(result)
      setRetryCount(0) // 重置重试计数
    } else if (asyncResult.error) {
      onError?.(asyncResult.error)
    }
    return result
  }, [asyncResult, onSuccess, onError])

  return {
    ...asyncResult,
    execute: executeWithCallbacks,
    retry
  }
}

/**
 * 防抖 Hook
 */
export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      func(...args)
    }, delay)
  }, [func, delay]) as T
}

/**
 * 节流 Hook
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastExecTimeRef = useRef<number>(0)

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastExecTimeRef.current > delay) {
      func(...args)
      lastExecTimeRef.current = now
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        func(...args)
        lastExecTimeRef.current = Date.now()
      }, delay - (now - lastExecTimeRef.current))
    }
  }, [func, delay]) as T
}