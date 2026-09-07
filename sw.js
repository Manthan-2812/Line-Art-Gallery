// Service Worker for Line & Layer Gallery PWA
const CACHE_NAME = 'line-and-layer-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/gallery.html',
  '/checkout.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/app.js',
  '/gallery-app.js',
  '/utils/products.js',
  '/utils/print-master.js',
  '/utils/clerk-config.js',
  '/components/GalleryCard.js',
  '/components/AddressModal.js',
  '/components/DeliveryInstructions.js',
  '/components/TAC.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Pass network requests directly, fallback to cache for offline static assets
  if (e.request.method !== 'GET' || e.request.url.includes('/api/')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
