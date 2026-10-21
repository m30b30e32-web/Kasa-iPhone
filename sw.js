/* Kasa PWA: offline shell, scoped to GitHub Pages /Kasa-iPhone/. */
const CACHE_NAME = 'kasa-pwa-13-ultra-3d-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const ROOT = new URL('./', self.registration.scope).pathname;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k =>
    (k.startsWith('kasa-iphone-pwa-') || k.startsWith('kasa-pwa-13-ultra-3d-')) && k !== CACHE_NAME
  ).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const inScope = url.origin === self.location.origin && url.pathname.startsWith(ROOT);
  if (inScope) {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) {
        const clone = res.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, clone)));
      }
      return res;
    }).catch(() => caches.match(req).then(cached =>
      cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
    )));
    return;
  }
  // Optional: keep Manrope stylesheet/fonts available after they are loaded online
  // by a service-worker-controlled visit; failures never block calculations.
  if (url.protocol === 'https:' && (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com')) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') {
        const clone = res.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, clone)));
      }
      return res;
    })));
  }
});
