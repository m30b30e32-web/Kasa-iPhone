/* Offline application shell for Kasa-iPhone (GitHub Pages subpath safe). */
const CACHE = 'kasa-iphone-pwa-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kasa-iphone-pwa-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const local = url.origin === self.location.origin && url.pathname.startsWith(new URL('./', self.registration.scope).pathname);
  if (local) {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) {
        const clone = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, clone)));
      }
      return response;
    }).catch(() => caches.match(req).then(cached => cached || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
    return;
  }
  // Cache the existing external Manrope stylesheet and font once loaded online.
  if (url.protocol === 'https:' && (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com')) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok || response.type === 'opaque') {
        const clone = response.clone();
        event.waitUntil(caches.open(CACHE).then(cache => cache.put(req, clone)));
      }
      return response;
    })));
  }
});
