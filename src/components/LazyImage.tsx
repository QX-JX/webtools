import React, { useState, useEffect, useRef } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  threshold?: number
  rootMargin?: string
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE2MFYxNDBIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHA+dGggZD0iTTI0MCAxMjVIMjI1VjE0MEgyNDBWMTI1WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTc1IDE2MEgxNjBWMTc1SDE3NVYxNjBaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yNDAgMTYwSDIyNVYxNzVIMjQwVjE2MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+',
  threshold = 0.1,
  rootMargin = '50px',
  onError,
  onLoad
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (!imageRef) return

    // 清理之前的观察者
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 创建新的 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 当图片进入视口时，加载真实图片
            const img = new Image()
            img.src = src
            img.onload = () => {
                      setImageSrc(src)
                      if (onLoad) {
                        // 创建合成事件对象
                        const event = {
                          target: img,
                          currentTarget: img,
                          preventDefault: () => {},
                          stopPropagation: () => {},
                          nativeEvent: new Event('load'),
                          bubbles: false,
                          cancelable: false,
                          defaultPrevented: false,
                          eventPhase: 0,
                          isTrusted: true,
                          timeStamp: Date.now(),
                          type: 'load'
                        } as unknown as React.SyntheticEvent<HTMLImageElement>
                        onLoad(event)
                      }
                    }
                    img.onerror = () => {
                      // 图片加载失败时的处理
                      console.error(`Failed to load image: ${src}`)
                      if (onError) {
                        // 创建合成事件对象
                        const event = {
                          target: img,
                          currentTarget: img,
                          preventDefault: () => {},
                          stopPropagation: () => {},
                          nativeEvent: new Event('error'),
                          bubbles: false,
                          cancelable: false,
                          defaultPrevented: false,
                          eventPhase: 0,
                          isTrusted: true,
                          timeStamp: Date.now(),
                          type: 'error'
                        } as unknown as React.SyntheticEvent<HTMLImageElement>
                        onError(event)
                      }
                    }
            
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
      observerRef.current.observe(imageRef)
    }

    // 清理函数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [imageRef, src, threshold, rootMargin])

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      className={`lazy-image ${className}`}
      loading="lazy"
      style={{
        transition: 'opacity 0.3s ease-in-out',
        opacity: imageSrc === placeholder ? 0.7 : 1
      }}
      onError={onError}
      onLoad={onLoad}
    />
  )
}

export default LazyImage