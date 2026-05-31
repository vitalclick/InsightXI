/* InsightXI Mobile — minimal service worker (offline-ready shell) */
const CACHE = 'insightxi-mobile-v1';
const ASSETS = [
  'InsightXI Mobile.html',
  'assets/css/insightxi.css',
  'assets/css/mobile.css',
  'assets/js/data.js',
  'assets/js/charts.js',
  'assets/js/mobile-screens.js',
  'assets/js/mobile-detail.js',
  'assets/js/mobile-shell.js',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match('InsightXI Mobile.html')))
  );
});
