/* PRODUCTIV Life OS — offline-first service worker (no build deps) */
const CACHE = 'productiv-os-v1';
const CORE = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          try {
            const clientUrl = new URL(client.url);
            if (clientUrl.pathname.replace(/\/index\.html$/, '/') === new URL(targetUrl, client.url).pathname.replace(/\/index\.html$/, '/') || client.url.includes('productiv')) {
              return client.focus();
            }
          } catch {
            /* abaikan */
          }
        }
        if (clients.length > 0) {
          const first = clients[0];
          try {
            first.navigate(targetUrl);
          } catch {
            /* abaikan */
          }
          return first.focus();
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener('notificationclose', () => {
  /* sengaja kosong — sekadar memastikan event terdaftar */
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigasi SPA: network-first, fallback ke shell cache saat offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Aset (JS/CSS/font/gambar, termasuk Google Fonts): cache-first
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          // Simpan juga opaque (CDN font) agar offline tetap jalan
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
          }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }));
    })
  );
});
