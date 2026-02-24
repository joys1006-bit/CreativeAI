/**
 * [DevOps 담당] Service Worker
 * - 오프라인 캐싱 전략
 * - 정적 자산 프리캐시
 * - 동적 API 캐시 (Network First)
 */
const CACHE_NAME = 'ai-captioner-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// 설치: 정적 자산 캐시
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// 활성화: 이전 캐시 제거
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// 요청 처리: 전략별 분기
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // API 요청: Network First
    if (url.pathname.startsWith('/upload') ||
        url.pathname.startsWith('/status') ||
        url.pathname.startsWith('/progress') ||
        url.pathname.startsWith('/translate') ||
        url.pathname.startsWith('/tts') ||
        url.pathname.startsWith('/silence')) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    // 정적 자산: Cache First
    event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch {
        const cached = await caches.match(request);
        return cached || new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
