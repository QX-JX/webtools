/**
 * Service Worker 注册工具
 * Service Worker registration utility
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker 注册成功:', registration.scope)
          
          // 监听更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 发现新版本
                  console.log('发现新版本的 ServiceWorker')
                  // 可以在这里提示用户刷新页面
                  if (confirm('发现新版本，是否立即更新？')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.log('ServiceWorker 注册失败:', error)
        })
    })
    
    // 监听 Service Worker 控制变化
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker 控制器发生变化')
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
      })
      .catch((error) => {
        console.error('Service Worker 注销失败:', error)
      })
  }
}

/**
 * 缓存策略工具函数
 */
export async function clearCache() {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    const deleted = await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    )
    console.log('缓存已清理:', deleted)
  }
}

/**
 * 网络状态检测
 */
export function checkNetworkStatus(): boolean {
  return navigator.onLine
}

/**
 * 监听网络状态变化
 */
export function onNetworkChange(callback: (online: boolean) => void) {
  window.addEventListener('online', () => callback(true))
  window.addEventListener('offline', () => callback(false))
}

/**
 * 预加载关键资源
 */
export function preloadCriticalResources(urls: string[]) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PRELOAD_RESOURCES',
      urls
    })
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  if (!('caches' in window)) {
    return null
  }
  
  const cacheNames = await caches.keys()
  const stats = []
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const requests = await cache.keys()
    let size = 0
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        size += blob.size
      }
    }
    
    stats.push({
      name: cacheName,
      entries: requests.length,
      size: (size / 1024 / 1024).toFixed(2) + ' MB'
    })
  }
  
  return stats
}