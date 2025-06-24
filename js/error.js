//https://medium.com/@straker/custom-404-page-without-a-server-2dad21c8f480
const filesToCache = [
  '/',
  'https://www.bwstays.com/css/styles.css',
  'https://www.bwstays.com/data/sitedata.js',
  'https://www.bwstays.com/data/nearbylocationsdata.js'
];
const staticCacheName = 'pages-cache-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
       return cache.addAll(filesToCache);
    })
  );
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
          return caches.match('https://www.bwstays.com/error.html');
        }
        return caches.open(staticCacheName)
        .then(cache => {
          cache.put(event.request.url, response.clone());
          return response;
        });

      });
    }).catch(error => {
         console.log('Network request for   ', event.request.url);
	})
  );
});