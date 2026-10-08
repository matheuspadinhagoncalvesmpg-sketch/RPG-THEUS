// Service worker: deixa o jogo jogável offline depois da primeira visita.
const CACHE = 'theus-v2.1.0';
const ASSETS = [
  './', 'index.html', 'style.css', 'manifest.json', 'icon.svg',
  'src/main.js', 'src/game.js', 'src/player.js', 'src/enemies.js', 'src/bosses.js', 'src/entities.js',
  'src/world.js', 'src/rooms.js', 'src/physics.js', 'src/render.js', 'src/art.js', 'src/fx.js',
  'src/input.js', 'src/audio.js', 'src/ui.js', 'src/save.js', 'src/dialog.js', 'src/config.js', 'src/util.js', 'src/ai.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Rede primeiro (sempre a versão mais nova), cache como reserva offline.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  if (new URL(e.request.url).pathname.includes('/api/')) return; // IA sempre ao vivo
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
