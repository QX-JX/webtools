import { useState, useEffect } from 'react'
import { DeviceType, BREAKPOINTS, getDeviceType, isTouchDevice, getDeviceOrientation } from '../utils/responsive'

/**
 * 响应式设计 Hook
 */
export function useResponsive() {
  const [deviceType, setDeviceType] = useState<DeviceType>(DeviceType.DESKTOP)
  const [isTouch, setIsTouch] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // 初始化
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })
      setDeviceType(getDeviceType(width))
      setIsTouch(isTouchDevice())
      setOrientation(getDeviceOrientation())
    }

    // 立即执行一次
    updateDeviceInfo()

    // 监听窗口变化
    const handleResize = () => {
      updateDeviceInfo()
    }

    // 监听方向变化（移动端）
    const handleOrientationChange = () => {
      setTimeout(updateDeviceInfo, 100) // 延迟执行，确保方向变化完成
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return {
    deviceType,
    isTouch,
    orientation,
    windowSize,
    isMobile: deviceType === DeviceType.MOBILE,
    isTablet: deviceType === DeviceType.TABLET,
    isDesktop: deviceType === DeviceType.DESKTOP,
    isLarge: deviceType === DeviceType.LARGE,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape'
  }
}

/**
 * 媒体查询 Hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * 断点 Hook
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.TABLET - 1}px)`)
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.TABLET}px) and (max-width: ${BREAKPOINTS.DESKTOP - 1}px)`)
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.DESKTOP}px) and (max-width: ${BREAKPOINTS.LARGE - 1}px)`)
  const isLarge = useMediaQuery(`(min-width: ${BREAKPOINTS.LARGE}px)`)

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLarge,
    deviceType: isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : isDesktop ? DeviceType.DESKTOP : DeviceType.LARGE
  }
}

/**
 * 触摸手势 Hook
 */
export function useTouchGestures() {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setSwipeDirection(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isUpSwipe = distanceY > minSwipeDistance
    const isDownSwipe = distanceY < -minSwipeDistance

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) {
        setSwipeDirection('left')
      } else if (isRightSwipe) {
        setSwipeDirection('right')
      }
    } else {
      if (isUpSwipe) {
        setSwipeDirection('up')
      } else if (isDownSwipe) {
        setSwipeDirection('down')
      }
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection,
    isSwiping: swipeDirection !== null
  }
}

/**
 * 响应式字体大小 Hook
 */
export function useResponsiveFontSize() {
  const { deviceType } = useResponsive()
  
  const getFontSize = (baseSize: number) => {
    switch (deviceType) {
      case DeviceType.MOBILE:
        return baseSize * 0.875 // 87.5%
      case DeviceType.TABLET:
        return baseSize * 0.9375 // 93.75%
      case DeviceType.DESKTOP:
        return baseSize // 100%
      case DeviceType.LARGE:
        return baseSize * 1.0625 // 106.25%
      default:
        return baseSize
    }
  }

  const getLineHeight = (baseHeight: number) => {
    switch (deviceType) {
      case DeviceType.MOBILE:
        return baseHeight * 0.875
      case DeviceType.TABLET:
        return baseHeight * 0.95
      case DeviceType.DESKTOP:
        return baseHeight
      case DeviceType.LARGE:
        return baseHeight * 1.0625
      default:
        return baseHeight
    }
  }

  return {
    getFontSize,
    getLineHeight,
    deviceType
  }
}

/**
 * 安全区域 Hook（适配刘海屏）
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement)
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-right') || '0')
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea)
    return () => window.removeEventListener('resize', updateSafeArea)
  }, [])

  return safeArea
}