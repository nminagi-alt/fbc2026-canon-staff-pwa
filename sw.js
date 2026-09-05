const CACHE = 'fbc2026-staff-shell-v3';
const SHELL = [
  './manifest.webmanifest?v=3',
  './icon-192-v2.png',
  './icon-512-v2.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // Always bypass HTTP cache for manifest and current icons.
  if (
    url.pathname.endsWith('/manifest.webmanifest') ||
    url.pathname.endsWith('/icon-192-v2.png') ||
    url.pathname.endsWith('/icon-512-v2.png')
  ) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // Navigation and index.html are always network-first so hosting updates
  // appear immediately instead of being trapped by an old cache.
  if (
    req.mode === 'navigate' ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/')
  ) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => response)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static shell assets may use cache-first.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
