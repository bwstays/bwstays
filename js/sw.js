importScripts('./js/cache-polyfill.js');
const TILE_CACHE = 'cache-v4';
const TILE_URL_PATTERN = /^https:\/\/[abc]\.tile\.osm\.org\/.*/;
var cacheName = 'cache-v4';
const MAX_CACHE_SIZE = 50 * 1024 * 1024; 
const MAX_TILE_CACHE_SIZE = 30 * 1024 * 1024; 
const STORAGE_WARNING_THRESHOLD = 0.8; 
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; 
var files = [
  './index.html', 
  'https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i&display=swap',
  './css/styles.css',
  './js/chat.js',
  './js/scripts.js',
  './manifest.json',
  './llms-full.txt'
];
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usagePercentage = estimate.usage / estimate.quota;
    if (usagePercentage > STORAGE_WARNING_THRESHOLD) {
      await cleanupOldCaches();
    }
    return { usage: estimate.usage, quota: estimate.quota, percentage: usagePercentage };
  }
  return null;
}
async function getCacheSize(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  let totalSize = 0;
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  return totalSize;
}
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  for (const name of cacheNames) {
    if (name === TILE_CACHE) {
      await cleanupTileCache();
    } else if (name === cacheName) {
      await cleanupMainCache();
    }
  }
}
async function cleanupTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const requests = await cache.keys();
  const requestsWithTime = [];
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const lastAccess = response.headers.get('x-cache-time') || '0';
      requestsWithTime.push({ request, lastAccess: parseInt(lastAccess) });
    }
  }
  requestsWithTime.sort((a, b) => a.lastAccess - b.lastAccess);
  const currentSize = await getCacheSize(TILE_CACHE);
  if (currentSize > MAX_TILE_CACHE_SIZE) {
    const itemsToRemove = Math.ceil(requestsWithTime.length * 0.3); 
    for (let i = 0; i < itemsToRemove && i < requestsWithTime.length; i++) {
      await cache.delete(requestsWithTime[i].request);
    }
  }
}
async function cleanupMainCache() {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const cacheTime = response.headers.get('x-cache-time');
      if (cacheTime && (now - parseInt(cacheTime)) > CACHE_EXPIRY_TIME) {
        await cache.delete(request);
      }
    }
  }
}
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      await checkStorageQuota();
      const cache = await caches.open(cacheName);
      const cachePromises = files.map(async (file) => {
        try {
          const response = await fetch(file);
          if (response.ok) {
            const responseClone = response.clone();
            const headers = new Headers(responseClone.headers);
            headers.set('x-cache-time', Date.now().toString());
            const modifiedResponse = new Response(responseClone.body, {
              status: responseClone.status,
              statusText: responseClone.statusText,
              headers: headers
            });
            await cache.put(file, modifiedResponse);
          }
        } catch (error) {
        }
      });
      await Promise.all(cachePromises);
      const cacheSize = await getCacheSize(cacheName);
      if (cacheSize > MAX_CACHE_SIZE) {
        await cleanupMainCache();
      }
    })()
  );
  self.skipWaiting();
});
self.addEventListener('fetch', (event) => {
  var request = event.request;
  var url = new URL(request.url);
  if (url.origin === location.origin) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});
async function cacheFirst(request) {
  const requestUrl = request.url;
  if (TILE_URL_PATTERN.test(requestUrl)) {
    const cache = await caches.open(TILE_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-cache-time', Date.now().toString());
      const updatedResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
      await cache.put(request, updatedResponse.clone());
      return updatedResponse;
    }
    try {
      const response = await fetch(request);
      if (response.ok) {
        const currentSize = await getCacheSize(TILE_CACHE);
        if (currentSize > MAX_TILE_CACHE_SIZE) {
          await cleanupTileCache();
        }
        const headers = new Headers(response.headers);
        headers.set('x-cache-time', Date.now().toString());
        const responseWithTimestamp = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: headers
        });
        await cache.put(request, responseWithTimestamp.clone());
        return responseWithTimestamp;
      }
      return response;
    } catch (error) {
      throw error;
    }
  }
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}
async function networkFirst(request) {
	  const requestUrl = request.url;
 if (TILE_URL_PATTERN.test(requestUrl)) {
  }
  const dynamicCache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const currentSize = await getCacheSize(cacheName);
      if (currentSize > MAX_CACHE_SIZE) {
        await cleanupMainCache();
      }
      const headers = new Headers(networkResponse.headers);
      headers.set('x-cache-time', Date.now().toString());
      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });
      dynamicCache.put(request, responseWithTimestamp.clone()).catch((err) => {
      });
      return responseWithTimestamp;
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await dynamicCache.match(request);
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('x-cache-time');
      const now = Date.now();
      if (cacheTime && (now - parseInt(cacheTime)) > CACHE_EXPIRY_TIME) {
      }
      return cachedResponse;
    }
    throw err;
  }
}
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await checkStorageQuota();
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map((cache) => {
        if (cache !== cacheName && cache !== TILE_CACHE) {
          return caches.delete(cache); 
        }
      });
      await Promise.all(deletePromises);
      await cleanupOldCaches();
      setInterval(async () => {
        try {
          await checkStorageQuota();
        } catch (error) {
        }
      }, 30 * 60 * 1000);
      return self.clients.claim();
    })()
  );
});
self.addEventListener('push', (event) => {
  var title = 'Push notification demo';
  var body = {
    'body': 'click to return to application',
    'tag': 'demo',
    'icon': './images/icons/apple-touch-icon.png',
    'badge': './images/icons/apple-touch-icon.png',
    'actions': [
      { 'action': 'yes', 'title': 'I ♥ this app!'},
      { 'action': 'no', 'title': 'I don\'t like this app'}
    ]
  };
  event.waitUntil(self.registration.showNotification(title, body));
});
self.addEventListener('sync', (event) => {
  if (event.tag === 'github' || event.tag === 'test-tag-from-devtools') {
    event.waitUntil(
      self.clients.matchAll().then((all) => {
        return all.map((client) => {
          return client.postMessage('online'); 
        })
      })
      .catch((error) => {
      })
    );
  }
});
self.addEventListener('notificationclick', (event) => {
  var url = 'https://demopwa.in/';
  if (event.action === 'yes') {
  }
  else if (event.action === 'no') {
  }
  event.notification.close(); 
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clients) => {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
    .catch((error) => {
    })
  );
});