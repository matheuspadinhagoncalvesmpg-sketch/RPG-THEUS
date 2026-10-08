const CACHE_NAME = 'rpg-ooo-v4';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './local_server.js',
  './hollow.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Rede primeiro (sempre a versão mais nova); se estiver offline, usa o cache.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res && res.ok && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match(e.request))
  );
});
