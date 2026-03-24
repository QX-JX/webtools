/**
 * 响应式设计工具函数
 */

/**
 * 设备类型枚举
 */
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  LARGE = 'large'
}

/**
 * 断点配置
 */
export const BREAKPOINTS = {
  MOBILE: 640,    // 小于 640px
  TABLET: 768,    // 640px - 768px
  DESKTOP: 1024,  // 768px - 1024px
  LARGE: 1280     // 大于 1280px
} as const

/**
 * 获取当前设备类型
 */
export function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.TABLET) {
    return DeviceType.MOBILE
  } else if (width < BREAKPOINTS.DESKTOP) {
    return DeviceType.TABLET
  } else if (width < BREAKPOINTS.LARGE) {
    return DeviceType.DESKTOP
  } else {
    return DeviceType.LARGE
  }
}

/**
 * 响应式工具类配置
 */
export const responsiveClasses = {
  // 容器类
  container: {
    mobile: 'px-4',
    tablet: 'px-6',
    desktop: 'px-8',
    large: 'px-8'
  },
  
  // 网格类
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3',
    large: 'grid-cols-4'
  },
  
  // 间距类
  spacing: {
    mobile: 'gap-3',
    tablet: 'gap-4',
    desktop: 'gap-6',
    large: 'gap-8'
  },
  
  // 字体大小
  text: {
    mobile: 'text-sm',
    tablet: 'text-base',
    desktop: 'text-lg',
    large: 'text-xl'
  },
  
  // 内边距
  padding: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
    large: 'p-10'
  }
}

/**
 * 获取响应式类名
 */
export function getResponsiveClass(deviceType: DeviceType, classType: keyof typeof responsiveClasses): string {
  return responsiveClasses[classType][deviceType]
}

/**
 * 触摸设备检测
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 设备方向检测
 */
export function getDeviceOrientation(): 'portrait' | 'landscape' {
  if (typeof window === 'undefined') return 'portrait'
  return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
}

/**
 * 安全区域适配（iPhone X 及以上）
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }
  
  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('--safe-area-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-right') || '0')
  }
}

/**
 * 响应式图片配置
 */
export const responsiveImages = {
  sizes: {
    mobile: '(max-width: 640px) 100vw',
    tablet: '(max-width: 768px) 50vw',
    desktop: '(max-width: 1024px) 33vw',
    large: '25vw'
  },
  
  // 不同设备的图片质量
  quality: {
    mobile: 70,
    tablet: 80,
    desktop: 85,
    large: 90
  }
}

/**
 * 移动端手势配置
 */
export const touchGestures = {
  swipeThreshold: 50,    // 滑动阈值（像素）
  tapDelay: 300,        // 点击延迟（毫秒）
  doubleTapDelay: 300,  // 双击延迟（毫秒）
  longPressDelay: 500   // 长按延迟（毫秒）
}

/**
 * 响应式动画配置
 */
export const responsiveAnimations = {
  duration: {
    mobile: 200,   // 移动端动画更快
    tablet: 250,
    desktop: 300,
    large: 350
  },
  
  easing: {
    mobile: 'ease-out',
    tablet: 'ease-in-out',
    desktop: 'ease-in-out',
    large: 'ease-in-out'
  }
}

/**
 * 字体加载优化
 */
export const fontOptimization = {
  // 不同设备的字体大小调整
  scale: {
    mobile: 0.875,    // 14px base
    tablet: 0.9375,   // 15px base
    desktop: 1,       // 16px base
    large: 1.0625   // 17px base
  },
  
  // 行高调整
  lineHeight: {
    mobile: 1.4,
    tablet: 1.5,
    desktop: 1.6,
    large: 1.7
  }
}