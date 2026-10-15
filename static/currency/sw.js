// Bump this version whenever a shell asset changes so installed copies refresh.
const CACHE_NAME = 'currency-shell-v8';
const SHELL = [
    '/currency/',
    '/currency/style.css',
    '/currency/app.js',
    '/currency/converter.mjs',
    '/currency/manifest.webmanifest',
    '/currency/icon.svg?v=2',
    '/currency/favicon-32.png?v=2',
    '/currency/icon-192.png?v=2',
    '/currency/icon-192.png',
    '/currency/icon-512.png?v=2',
    '/currency/icon-512.png'
];

self.addEventListener('install', event => {
    // Bypass the browser HTTP cache so a new worker always stores the current shell.
    event.waitUntil(caches.open(CACHE_NAME).then(cache =>
        cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' })))
    ));
});

self.addEventListener('activate', event => {
    // Keep older shell caches for tabs still controlled by older workers.
    event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith('/currency/')) return;
    if (event.request.mode === 'navigate') {
        event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match('/currency/')).then(cached => cached || fetch(event.request)));
        return;
    }
    event.respondWith(caches.open(CACHE_NAME).then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request)));
});
