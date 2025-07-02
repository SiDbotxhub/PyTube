const CACHE_NAME = 'streamtube-v1';
const ASSETS = [
    '/',
    '/static/css/main.css',
    '/static/js/app.js',
    '/static/js/player.js',
    '/static/js/cache.js',
    '/static/icons/home.svg',
    '/static/icons/search.svg',
    '/static/icons/library.svg',
    '/static/icons/logo.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', event => {
    // Cache-first strategy for assets
    if (event.request.url.includes('/static/')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
        return;
    }
    
    // Network-first for API calls
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache API responses if needed
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
        return;
    }
    
    // For HTML pages
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match('/'))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
});
