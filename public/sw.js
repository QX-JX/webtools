/**
 * Service Worker for advanced caching and offline support
 * 高级缓存和离线支持的服务工作线程
 */

const CACHE_NAME = 'kunqiong-webtools-v1'
const RUNTIME_CACHE = 'runtime-cache'

// 需要预缓存的资源
const PRECACHE_RESOURCES = [
  '/',
  '/assets/index.css',
  '/assets/index.js',
  '/favicon.svg',
  '/manifest.json'
]

// 安装事件 - 预缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_RESOURCES))
      .then(() => self.skipWaiting())
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// 获取事件 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 请求 - 网络优先策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
    return
  }

  // 静态资源 - 缓存优先策略
  if (request.destination === 'image' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request))
    return
  }

  // 其他请求 - 网络优先策略
  event.respondWith(networkFirst(request))
})

// 缓存优先策略
async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    // 离线时返回备用响应
    return new Response('离线模式 - 内容暂时不可用', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// 网络优先策略
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
    return response
  } catch (error) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    // 离线时返回备用响应
    return new Response('离线模式 - 内容暂时不可用', {
      status: 503,
      statusText: 'Service Unavailable'
    })
  }
}

// 后台同步（用于离线操作）
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

async function handleBackgroundSync() {
  // 处理离线时保存的操作
  console.log('执行后台同步...')
}

// 推送通知（可选）
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.svg'
    })
  }
})

// 消息处理（用于与主线程通信）
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})