// Bump this version whenever a shell asset changes so installed copies refresh.
const CACHE_NAME = 'currency-shell-v2';
const SHELL = [
    '/currency/',
    '/currency/style.css',
    '/currency/app.js',
    '/currency/converter.mjs',
    '/currency/manifest.webmanifest',
    '/currency/icon-192.png',
    '/currency/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(Promise.all([
        caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('currency-shell-') && key !== CACHE_NAME).map(key => caches.delete(key)))),
        self.clients.claim()
    ]));
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/currency/')) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(caches.match('/currency/').then(cached => cached || fetch(event.request)));
        return;
    }
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
