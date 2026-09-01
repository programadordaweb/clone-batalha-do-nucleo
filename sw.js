/* ============================================================
   SERVICE WORKER — deixa o jogo instalável e jogável OFFLINE.
   Depois de abrir uma vez, o celular guarda tudo e o jogo roda
   mesmo sem internet.
   ============================================================ */
const CACHE = 'clone-v15';

const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css?v=15',
  './js/input.js?v=15',
  './js/audio.js?v=15',
  './js/art.js?v=15',
  './js/shop.js?v=15',
  './js/entities.js?v=15',
  './js/boss.js?v=15',
  './js/map.js?v=15',
  './js/game.js?v=15',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-64.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;

  // REDE PRIMEIRO: assim uma versao nova do jogo aparece na hora.
  // Se estiver sem internet, cai para o que esta guardado (offline).
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok){
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => {
        if (hit) return hit;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', {status:504, statusText:'offline'});
      }))
  );
});
