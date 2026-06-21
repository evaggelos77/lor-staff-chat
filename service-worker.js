const CACHE_NAME = 'lor-staff-chat-v6c-online-cache';
const ASSETS = ['./','./index.html','./styles.css','./app.js','./i18n.js','./manifest.webmanifest','./assets/lor-staff-icon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Network-first so testers always get the latest app; fall back to cache only when offline.
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  if(event.request.url.includes('/api/')) return;
  event.respondWith(
    fetch(event.request)
      .then(resp => { const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(()=>{}); return resp; })
      .catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
  );
});
