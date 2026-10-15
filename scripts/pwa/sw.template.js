/* BWStays service worker.
 *
 * GENERATED: /sw.js is built from this template by `node scripts/build-pwa.mjs`.
 * Edit this file (scripts/pwa/sw.template.js), never /sw.js.
 *
 * Strategy
 *   shell   (css, js, fonts, vendor libraries, small data files, offline page)
 *           precached at install, cache-first; a new VERSION replaces the old shell.
 *   pages   (every HTML page) network-first with a short timeout, then the saved copy,
 *           then /offline.html. Pages visited once are saved; the rest of the site is
 *           saved in the background after the first load (message SYNC_SITE).
 *   data    (availability, stations, places) network-first, saved copy when offline.
 *   images  cache-first, saved on first view (and in the background sync), trimmed to a limit.
 *   other   map tiles and web fonts are cached at runtime within a size limit;
 *           analytics, the booking form, chat and weather requests always go to the network.
 */
const VERSION = '__VERSION__';
const SHELL_CACHE = 'bw-shell-' + VERSION;
const SITE_CACHE = 'bw-site-v1'; // saved pages and data (kept across versions)
const MEDIA_CACHE = 'bw-media-v1'; // images
const RUNTIME_CACHE = 'bw-runtime-v1'; // map tiles, web fonts, third-party static files

const SHELL = __SHELL__;
const PAGES = __PAGES__;
const DATA = __DATA__;
const IMAGES = __IMAGES__;
const EXTERNAL = __EXTERNAL__; // static libraries on a public CDN that some pages load
// availability files change with every booking, so they are not listed in this file
const FRESH_FILES = ['/data/bookingdata.min.js', '/data/closeddata.min.js', '/data/pendingdata.min.js'];

const OFFLINE_URL = '/offline.html';
const NETWORK_TIMEOUT_MS = 4000;
const MAX_MEDIA_ENTRIES = 600;
const MAX_RUNTIME_ENTRIES = 160;
const FRESH_DATA = /\/data\/(bookingdata|closeddata|pendingdata)(\.min)?\.js/;
const DATA_PATH = /\/data\/[^/]+\.(json|js)$|\/llms-full\.txt$/;
const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|ico)$/i;
const RUNTIME_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'tile.openstreetmap.org',
  'maps.google.com',
];

// ---------------------------------------------------------------- helpers
function pageKey(url) {
  const u = new URL(url, self.location.origin);
  let p = u.pathname;
  if (p.endsWith('/')) p += 'index.html';
  return new Request(u.origin + p);
}

async function putIfOk(cacheName, request, response) {
  if (!response || !(response.ok || response.type === 'opaque')) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function matchAny(request, opts) {
  return caches.match(request, opts || {});
}

// ---------------------------------------------------------------- lifecycle
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // one failed file must not block the whole install; only the offline page is required
    const results = await Promise.allSettled(SHELL.map(async (url) => {
      const res = await fetch(url, { cache: 'reload' });
      if (!res.ok) throw new Error(url + ' ' + res.status);
      await cache.put(url, res);
    }));
    if (!(await cache.match(OFFLINE_URL))) throw new Error('offline page could not be saved');
    return results;
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('bw-shell-') && n !== SHELL_CACHE)
      .map((n) => caches.delete(n)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) { /* optional */ }
    }
    await self.clients.claim();
  })());
});

// ---------------------------------------------------------------- fetch
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname === '/sw.js') return;
    if (request.mode === 'navigate') {
      event.respondWith(handleNavigation(event));
    } else if (FRESH_DATA.test(url.pathname) || DATA_PATH.test(url.pathname)) {
      event.respondWith(networkFirst(request));
    } else if (IMAGE_EXT.test(url.pathname) || request.destination === 'image') {
      event.respondWith(cacheFirst(request, MEDIA_CACHE, MAX_MEDIA_ENTRIES));
    } else {
      event.respondWith(cacheFirst(request, SITE_CACHE, 0));
    }
    return;
  }
  if (RUNTIME_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
  }
  // everything else (analytics, forms, chat, weather, rates) goes straight to the network
});

async function handleNavigation(event) {
  const request = event.request;
  const key = pageKey(request.url);
  try {
    const preload = event.preloadResponse ? await event.preloadResponse : null;
    const response = preload || await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (response && response.ok) {
      event.waitUntil(putIfOk(SITE_CACHE, key, response));
      return response;
    }
    // a server error page should not hide a saved copy
    const saved = await matchAny(key);
    return saved || response;
  } catch (err) {
    const saved = await matchAny(key, { ignoreSearch: true });
    if (saved) return saved;
    const fallback = await matchAny(OFFLINE_URL);
    return fallback || new Response('You are offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirst(request) {
  try {
    const response = await withTimeout(fetch(request), 5000);
    if (response && response.ok) await putIfOk(SITE_CACHE, request, response);
    return response;
  } catch (err) {
    const saved = (await matchAny(request)) || (await matchAny(request, { ignoreSearch: true }));
    if (saved) return saved;
    throw err;
  }
}

async function cacheFirst(request, cacheName, max) {
  const hit = await matchAny(request);
  if (hit) return hit;
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      await putIfOk(cacheName, request, response);
      if (max) trim(cacheName, max);
    }
    return response;
  } catch (err) {
    // offline: an older copy of the same file (different ?v= hash) is better than nothing
    const older = await matchAny(request, { ignoreSearch: true });
    if (older) return older;
    throw err;
  }
}

// ---------------------------------------------------------------- background sync of the whole site
let syncing = false;

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage(message));
}

async function syncSite() {
  if (syncing) return;
  syncing = true;
  const jobs = [];
  PAGES.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: true }));
  DATA.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: false }));
  FRESH_FILES.forEach((u) => jobs.push({ url: u, cache: SITE_CACHE, page: false, refresh: true }));
  EXTERNAL.forEach((u) => jobs.push({ url: u, cache: RUNTIME_CACHE, page: false }));
  IMAGES.forEach((u) => jobs.push({ url: u, cache: MEDIA_CACHE, page: false }));
  const total = jobs.length;
  let done = 0;
  let failed = 0;
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++];
      try {
        const key = job.page ? pageKey(job.url) : new Request(job.url);
        const cache = await caches.open(job.cache);
        const existing = job.page || job.refresh ? null : await cache.match(key);
        if (!existing) {
          // pages are revalidated (cheap 304 when unchanged); files with a ?v= hash never change
          const res = await fetch(job.url, job.page || job.refresh ? { cache: 'no-cache' } : undefined);
          if (res.ok) await cache.put(key, res);
          else failed++;
        }
      } catch (e) {
        failed++;
      }
      done++;
      if (done % 10 === 0 || done === total) broadcast({ type: 'SYNC_PROGRESS', done, total });
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  await trim(MEDIA_CACHE, MAX_MEDIA_ENTRIES);
  syncing = false;
  broadcast({ type: 'SYNC_DONE', done, total, failed, version: VERSION });
}

async function status() {
  const site = await caches.open(SITE_CACHE);
  const media = await caches.open(MEDIA_CACHE);
  const siteKeys = await site.keys();
  const pages = siteKeys.filter((r) => /\.html$/.test(new URL(r.url).pathname)).length;
  return { version: VERSION, pages, totalPages: PAGES.length, images: (await media.keys()).length, totalImages: IMAGES.length };
}

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'SYNC_SITE') {
    event.waitUntil(syncSite());
  } else if (data.type === 'STATUS') {
    event.waitUntil(status().then((s) => event.source && event.source.postMessage({ type: 'STATUS', ...s })));
  }
});
