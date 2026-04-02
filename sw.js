const CACHE_NAME = 'expenseflow-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install - cache all assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Activate - clean old caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch - Network first for app files, cache first for external resources
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For same-origin requests (our app files), use network-first strategy
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the fresh response
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            // If not cached and navigation, return index
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
        })
    );
  } else {
    // For external resources (CDN), use cache-first strategy
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
