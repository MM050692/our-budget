const CACHE = 'our-dhan-v9-18';
const CORE = [
  './', './index.html', './recovery.html', './style.css?v=9-17', './app.js?v=9-18', './config.js', './manifest.json',
  './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './shortcut-spend.png', './shortcut-income.png', './shortcut-transfer.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  ]));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }

  if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    })));
  }
});

self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data?.json() || {}; }
  catch (_error) { payload = { body: event.data?.text() || 'Time for today’s money check-in.' }; }
  const title = payload.title || 'Our DHAN';
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || 'Record today’s income and spending.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: `our-dhan-${payload.slot || 'daily'}`,
    renotify: false,
    data: { url: payload.url || './?source=reminder' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './?source=reminder', self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        if ('navigate' in client) await client.navigate(target);
        return client.focus();
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
  }));
});
