const filesToCache = [
  '/',
  'https://bwstays.github.io/bwstays/error.html'
];
const staticCacheName = 'pages-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(filesToCache);
    });
  )
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // found a cached resource
      if (response) {
        return response;
      }

      // request the non-cached resource
      return fetch(event.request).then(response => {

        // fetch request returned 404, serve custom 404 page
        if (response.status === 404) {
          return caches.match('https://bwstays.github.io/bwstays/error.html');
        }
      });
    });
  );
});