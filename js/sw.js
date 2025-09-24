importScripts('./jsm/cache-polyfill.js');

const TILE_CACHE = 'cache-v4';
const TILE_URL_PATTERN = /^https:\/\/[abc]\.tile\.osm\.org\/.*/;

var cacheName = 'cache-v4';

// Storage management constants
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TILE_CACHE_SIZE = 30 * 1024 * 1024; // 30MB for tiles
const STORAGE_WARNING_THRESHOLD = 0.8; // 80% of quota
const CACHE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days

//Files to save in cache
var files = [
  './index.html', //SW treats query string as new request
  'https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i&display=swap',
  './css/styles.css',
  './jsm/chat.js',
  './jsm/scripts.js',
  './manifest.json',
  './llms-full.txt'
];

// Storage management functions
async function checkStorageQuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usagePercentage = estimate.usage / estimate.quota;

    console.log(`Storage usage: ${(estimate.usage / 1024 / 1024).toFixed(2)}MB / ${(estimate.quota / 1024 / 1024).toFixed(2)}MB (${(usagePercentage * 100).toFixed(1)}%)`);

    if (usagePercentage > STORAGE_WARNING_THRESHOLD) {
      console.warn('Storage quota approaching limit, initiating cleanup');
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

  // Sort by last access time (stored in custom headers)
  const requestsWithTime = [];

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const lastAccess = response.headers.get('x-cache-time') || '0';
      requestsWithTime.push({ request, lastAccess: parseInt(lastAccess) });
    }
  }

  // Sort by last access time (oldest first)
  requestsWithTime.sort((a, b) => a.lastAccess - b.lastAccess);

  // Remove oldest entries if cache is too large
  const currentSize = await getCacheSize(TILE_CACHE);
  if (currentSize > MAX_TILE_CACHE_SIZE) {
    const itemsToRemove = Math.ceil(requestsWithTime.length * 0.3); // Remove 30%

    for (let i = 0; i < itemsToRemove && i < requestsWithTime.length; i++) {
      await cache.delete(requestsWithTime[i].request);
    }

    console.log(`Cleaned up ${itemsToRemove} old tile cache entries`);
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
        console.log(`Removed expired cache entry: ${request.url}`);
      }
    }
  }
}



//Adding `install` event listener
self.addEventListener('install', (event) => {
  console.log('SW Installed');
  event.waitUntil(
    (async () => {
      // Check storage quota before caching
      await checkStorageQuota();

      const cache = await caches.open(cacheName);
      console.log('SW: Cache opened');

      // Add timestamp to cached responses
      const cachePromises = files.map(async (file) => {
        try {
          const response = await fetch(file);
          if (response.ok) {
            // Clone response and add cache timestamp
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
          console.warn(`Failed to cache ${file}:`, error);
        }
      });

      await Promise.all(cachePromises);

      // Check if cache size exceeds limits
      const cacheSize = await getCacheSize(cacheName);
      if (cacheSize > MAX_CACHE_SIZE) {
        console.warn(`Cache size (${(cacheSize / 1024 / 1024).toFixed(2)}MB) exceeds limit`);
        await cleanupMainCache();
      }
    })()
  );
  self.skipWaiting();
});

/*
  FETCH EVENT: triggered for every request made by index page, after install.
*/

//Adding `fetch` event listener
self.addEventListener('fetch', (event) => {
  //console.info('Event: Fetch');

  var request = event.request;





  var url = new URL(request.url);
  if (url.origin === location.origin) {
    // Static files cache
    event.respondWith(cacheFirst(request));
  } else {
    // Dynamic API cache
    event.respondWith(networkFirst(request));
  }

  // // Checking for navigation preload response
  // if (event.preloadResponse) {
  //   console.info('Using navigation preload');
  //   return response;
  // }
});

async function cacheFirst(request) {
  const requestUrl = request.url;

  if (TILE_URL_PATTERN.test(requestUrl)) {
    const cache = await caches.open(TILE_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Update last access time for LRU
      const headers = new Headers(cachedResponse.headers);
      headers.set('x-cache-time', Date.now().toString());

      const updatedResponse = new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });

      // Re-cache with updated timestamp
      await cache.put(request, updatedResponse.clone());
      return updatedResponse;
    }

    try {
      const response = await fetch(request);
      if (response.ok) {
        // Check cache size before adding new tile
        const currentSize = await getCacheSize(TILE_CACHE);

        if (currentSize > MAX_TILE_CACHE_SIZE) {
          console.log('Tile cache size limit reached, cleaning up...');
          await cleanupTileCache();
        }

        // Add timestamp to new cache entry
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
      console.error('Tile fetch failed:', error);
      throw error;
    }
  }

  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function networkFirst(request) {

	  const requestUrl = request.url;

 if (TILE_URL_PATTERN.test(requestUrl)) {
	 //console.log("from network true" );


  }

  const dynamicCache = await caches.open(cacheName);
   //console.log("from network dynamicCache opened" );

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Check cache size before adding
      const currentSize = await getCacheSize(cacheName);
      if (currentSize > MAX_CACHE_SIZE) {
        console.log('Main cache size limit reached, cleaning up...');
        await cleanupMainCache();
      }

      // Add timestamp to cached response
      const headers = new Headers(networkResponse.headers);
      headers.set('x-cache-time', Date.now().toString());

      const responseWithTimestamp = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });

      // Cache the dynamic API response
      dynamicCache.put(request, responseWithTimestamp.clone()).catch((err) => {
        console.warn(request.url + ': ' + err.message);
      });

      return responseWithTimestamp;
    }

    return networkResponse;
  } catch (err) {
    const cachedResponse = await dynamicCache.match(request);

    if (cachedResponse) {
      // Check if cached response is expired
      const cacheTime = cachedResponse.headers.get('x-cache-time');
      const now = Date.now();

      if (cacheTime && (now - parseInt(cacheTime)) > CACHE_EXPIRY_TIME) {
        console.log(`Cached response expired for ${request.url}`);
        // Return expired cache but don't delete (user still gets content)
      }

      return cachedResponse;
    }

    throw err;
  }
}

/*
  ACTIVATE EVENT: triggered once after registering, also used to clean up caches.
*/

//Adding `activate` event listener
self.addEventListener('activate', (event) => {
  //console.info('Event: Activate');

  //Navigation preload is help us make parallel request while service worker is booting up.
  //Enable - chrome://flags/#enable-service-worker-navigation-preload
  //Support - Chrome 57 beta (behing the flag)
  //More info - https://developers.google.com/web/updates/2017/02/navigation-preload#the-problem

  // Check if navigationPreload is supported or not
  // if (self.registration.navigationPreload) {
  //   self.registration.navigationPreload.enable();
  // }
  // else if (!self.registration.navigationPreload) {
  //   console.info('Your browser does not support navigation preload.');
  // }

  //Remove old and unwanted caches
  event.waitUntil(
    (async () => {
      // Check storage quota on activation
      await checkStorageQuota();

      const cacheNames = await caches.keys();

      // Clean up old caches
      const deletePromises = cacheNames.map((cache) => {
        if (cache !== cacheName && cache !== TILE_CACHE) {
          console.info('SW: Clearing Old Cache:', cache);
          return caches.delete(cache); //Deleting the old cache (cache v1)
        }
      });

      await Promise.all(deletePromises);

      // Perform initial cleanup of current caches
      await cleanupOldCaches();

      console.info("Old caches are cleared!");

      // Set up periodic storage monitoring (every 30 minutes)
      setInterval(async () => {
        try {
          await checkStorageQuota();
        } catch (error) {
          console.error('Periodic storage check failed:', error);
        }
      }, 30 * 60 * 1000);

      // To tell the service worker to activate current one
      // instead of waiting for the old one to finish.
      return self.clients.claim();
    })()
  );
});

/*
  PUSH EVENT: triggered everytime, when a push notification is received.
*/

//Adding `push` event listener
self.addEventListener('push', (event) => {
//  console.info('Event: Push');

  var title = 'Push notification demo';
  var body = {
    'body': 'click to return to application',
    'tag': 'demo',
    'icon': './images/icons/apple-touch-icon.png',
    'badge': './images/icons/apple-touch-icon.png',
    //Custom actions buttons
    'actions': [
      { 'action': 'yes', 'title': 'I ♥ this app!'},
      { 'action': 'no', 'title': 'I don\'t like this app'}
    ]
  };

  event.waitUntil(self.registration.showNotification(title, body));
});

/*
  BACKGROUND SYNC EVENT: triggers after `bg sync` registration and page has network connection.
  It will try and fetch github username, if its fulfills then sync is complete. If it fails,
  another sync is scheduled to retry (will will also waits for network connection)
*/

self.addEventListener('sync', (event) => {
  console.info('Event: Sync');

  //Check registered sync name or emulated sync from devTools
  if (event.tag === 'github' || event.tag === 'test-tag-from-devtools') {
    event.waitUntil(
      //To check all opened tabs and send postMessage to those tabs
      self.clients.matchAll().then((all) => {
        return all.map((client) => {
          return client.postMessage('online'); //To make fetch request, check app.js - line no: 122
        })
      })
      .catch((error) => {
        console.error(error);
      })
    );
  }
});

/*
  NOTIFICATION EVENT: triggered when user click the notification.
*/

//Adding `notification` click event listener
self.addEventListener('notificationclick', (event) => {
  var url = 'https://demopwa.in/';

  //Listen to custom action buttons in push notification
  if (event.action === 'yes') {
    console.log('I ♥ this app!');
  }
  else if (event.action === 'no') {
    console.warn('I don\'t like this app');
  }

  event.notification.close(); //Close the notification

  //To open the app after clicking notification
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    })
    .then((clients) => {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        //If site is opened, focus to the site
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      //If site is cannot be opened, open in new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
    .catch((error) => {
      console.error(error);
    })
  );
});