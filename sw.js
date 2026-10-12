// Service worker: deixa o jogo jogável offline depois da primeira visita.
const CACHE = 'theus-v2.19.0';
const ASSETS = [
  './', 'index.html', 'style.css', 'manifest.json', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'src/main.js', 'src/game.js', 'src/player.js', 'src/enemies.js', 'src/bosses.js', 'src/entities.js',
  'src/world.js', 'src/rooms.js', 'src/physics.js', 'src/render.js', 'src/art.js', 'src/fx.js',
  'src/input.js', 'src/audio.js', 'src/ui.js', 'src/save.js', 'src/dialog.js', 'src/story.js', 'src/minibosses.js', 'src/invasions.js', 'src/loot.js', 'src/config.js', 'src/util.js', 'src/ai.js', 'src/build.js', 'src/crafting.js', 'src/raids.js', 'src/net.js', 'src/cloud.js',
];

self.addEventListener('install', (e) => {
  // addAll falha se um arquivo faltar; cada um é tentado separado para o app nunca ficar sem cache.
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Rede primeiro (versão mais nova), mas com limite de 3 s: em 3G fraco o jogo abre pelo cache
// e se atualiza em segundo plano. Só guarda respostas boas (nunca páginas de erro).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.includes('/api/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const network = fetch(e.request).then((res) => {
      if (res && res.ok) cache.put(e.request, res.clone());
      return res;
    });
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    try {
      const res = await Promise.race([network, timeout]);
      if (res) return res;
      return (await cache.match(e.request)) || network;
    } catch (err) {
      return (await cache.match(e.request)) || Response.error();
    }
  })());
});
