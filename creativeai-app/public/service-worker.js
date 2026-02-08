// Service Worker for CreativeAI PWA
const CACHE_NAME = 'creativeai-v2'
const urlsToCache = [
    '/',
    '/index.html',
    '/src/main.jsx',
    '/src/App.jsx',
    '/src/App.css',
    '/src/index.css',
    '/manifest.json'
]

// 설치 이벤트
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache')
                return cache.addAll(urlsToCache)
            })
    )
})

// Fetch 이벤트 - 네트워크 우선, 캐시 폴백
self.addEventListener('fetch', (event) => {
    // POST 등 비-GET 요청은 캐시하지 않음 (오류 방지)
    if (event.request.method !== 'GET') {
        return event.respondWith(fetch(event.request));
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 응답이 유효하면 캐시에 저장
                if (response && response.status === 200) {
                    const responseToCache = response.clone()
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache)
                        })
                }
                return response
            })
            .catch(() => {
                // 네트워크 실패 시 캐시에서 반환
                return caches.match(event.request)
            })
    )
})

// 활성화 이벤트 - 오래된 캐시 정리
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME]
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
})
