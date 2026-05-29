const CACHE = 'bctrip-v2';
const OFFLINE_URL = 'offline.html';

const PRECACHE = [
  '.',
  'index.html',
  'style.css',
  'app.js',
  'trip.json',
  'manifest.json',
  'offline.html',
  'icons/icon-192.svg',
  'icons/icon-512.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then(r => r || caches.match('index.html'))
      )
    );
    return;
  }

  if (e.request.url.includes('images.unsplash.com')) {
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          }).catch(() => new Response('', { status: 200 }));
        })
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
