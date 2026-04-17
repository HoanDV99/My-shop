// Service Worker cho My Shop PWA
// Chiến lược: Cache First cho static assets, Network First cho API

const CACHE_NAME = 'myshop-v1'
const STATIC_ASSETS = [
  '/',
  '/pos',
  '/products',
  '/categories',
  '/inventory',
  '/reports',
]

// Install: cache các trang chính
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: xóa cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch: Network First cho API/Supabase, Cache First cho static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Bỏ qua các request không phải GET
  if (event.request.method !== 'GET') return

  // Bỏ qua Supabase API - luôn dùng network
  if (url.hostname.includes('supabase.co')) return

  // Bỏ qua Next.js dev HMR
  if (url.pathname.startsWith('/_next/webpack-hmr')) return

  // Static assets: Cache First
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached || fetch(event.request).then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          return res
        })
      )
    )
    return
  }

  // Trang HTML: Network First, fallback sang cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    )
    return
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'My Shop', {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [100, 50, 100],
      })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/pos'))
})
