import { useState, useEffect, useRef } from 'react'

interface UseLazyImageOptions {
  threshold?: number
  rootMargin?: string
  placeholder?: string
}

export const useLazyImage = (src: string, options: UseLazyImageOptions = {}) => {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE2MFYxNDBIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+dGggZD0iTTI0MCAxMjVIMjI1VjE0MEgyNDBWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTc1IDE2MEgxNjBWMTc1SDE3NVYxNjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNDAgMTYwSDIyNVYxNzVIMjQwVjE2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
  } = options

  const [imageSrc, setImageSrc] = useState(placeholder)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!imageRef.current) return

    // 清理之前的观察者
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 重置状态
    setImageSrc(placeholder)
    setIsLoaded(false)
    setError(false)

    // 创建新的 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 当图片进入视口时，加载真实图片
            const img = new Image()
            
            img.onload = () => {
              setImageSrc(src)
              setIsLoaded(true)
              setError(false)
            }
            
            img.onerror = () => {
              setError(true)
              console.error(`Failed to load image: ${src}`)
            }
            
            img.src = src
            
            // 停止观察
            if (observerRef.current) {
              observerRef.current.disconnect()
            }
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    // 开始观察
    if (observerRef.current) {
      observerRef.current.observe(imageRef.current)
    }

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [src, threshold, rootMargin, placeholder])

  const refCallback = (node: HTMLImageElement | null) => {
    imageRef.current = node
  }

  return {
    imageRef: refCallback,
    imageSrc,
    isLoaded,
    error
  }
}