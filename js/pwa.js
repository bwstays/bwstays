// Progressive Web App support for every page:
//   - registers /sw.js (the service worker, built by scripts/build-pwa.mjs)
//   - after the first load saves the rest of the site for offline use (not on Save-Data / 2G)
//   - shows a small "new version" prompt, an offline notice and an install prompt
// Nothing here is required for the site to work; if anything is unsupported it does nothing.
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  var SYNC_KEY = 'bw-sync-version';
  var DISMISS_KEY = 'bw-install-dismissed';
  var SAVE_KEY = 'bw-save-dismissed';
  var DISMISS_DAYS = 30;

  function store(op, key, value) {
    try {
      if (op === 'get') return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode or blocked storage */ }
    return null;
  }

  // ---- small UI (styles are injected so no stylesheet change is needed on every page)
  var styleEl;
  function ensureStyle() {
    if (styleEl) return;
    styleEl = document.createElement('style');
    styleEl.textContent =
      '.bw-pwa-bar{position:fixed;left:12px;right:12px;margin:0 auto;bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:1050;max-width:520px;' +
      'width:auto;box-sizing:border-box;background:#111;color:#fff;border-radius:12px;padding:10px 14px;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;' +
      'box-shadow:0 6px 24px rgba(0,0,0,.35);display:flex;gap:10px;align-items:center;flex-wrap:wrap}' +
      '.bw-pwa-bar span{flex:1 1 150px;min-width:0}' +
      '.bw-pwa-bar button{border:0;border-radius:8px;padding:7px 14px;font:inherit;cursor:pointer;white-space:nowrap;flex:0 0 auto}' +
      '.bw-pwa-bar .bw-pwa-primary{background:#3f7f7b;color:#fff}' +
      '.bw-pwa-bar .bw-pwa-primary:hover{background:#2f6f6b}' +
      '.bw-pwa-bar .bw-pwa-secondary{background:transparent;color:#cfd8d7}' +
      '.bw-pwa-bar button:focus-visible{outline:3px solid #8cc4c0;outline-offset:2px}' +
      '.bw-pwa-offline{top:0;bottom:auto;left:0;right:0;transform:none;max-width:none;width:auto;border-radius:0;justify-content:center;background:#7a3b00}';
    document.head.appendChild(styleEl);
  }

  function bar(id, html, className) {
    var existing = document.getElementById(id);
    if (existing) existing.remove();
    ensureStyle();
    var el = document.createElement('div');
    el.id = id;
    el.className = 'bw-pwa-bar' + (className ? ' ' + className : '');
    el.setAttribute('role', 'status');
    el.innerHTML = html;
    document.body.appendChild(el);
    return el;
  }

  // ---- update prompt
  var refreshing = false;
  var hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    // the first install also changes the controller (clients.claim): that must not reload the page
    if (!hadController) { hadController = true; return; }
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  function promptUpdate(worker) {
    var el = bar('bw-pwa-update',
      '<span>A new version of the site is ready.</span>' +
      '<button type="button" class="bw-pwa-primary">Refresh</button>' +
      '<button type="button" class="bw-pwa-secondary">Later</button>');
    el.querySelector('.bw-pwa-primary').addEventListener('click', function () {
      worker.postMessage({ type: 'SKIP_WAITING' });
    });
    el.querySelector('.bw-pwa-secondary').addEventListener('click', function () { el.remove(); });
  }

  // ---- offline notice
  function onlineState() {
    var el = document.getElementById('bw-pwa-offline');
    if (navigator.onLine) {
      if (el) el.remove();
    } else if (!el) {
      bar('bw-pwa-offline', '<span>You are offline. Saved pages are still available.</span>', 'bw-pwa-offline');
    }
  }
  window.addEventListener('online', onlineState);
  window.addEventListener('offline', onlineState);

  // ---- save the rest of the site for offline use
  // 'auto' on Wi-Fi/desktop/unknown, 'ask' on a cellular connection (about 8 MB), 'no' on Save-Data or 2G
  function syncPolicy() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return 'auto';
    if (c.saveData) return 'no';
    if (/(^|-)2g$/.test(c.effectiveType || '')) return 'no';
    if (c.type === 'cellular') return 'ask';
    return 'auto';
  }

  function requestSync(worker) {
    if (!worker) return;
    worker.postMessage({ type: 'SYNC_SITE' });
  }

  navigator.serviceWorker.addEventListener('message', function (event) {
    var d = event.data || {};
    if (d.type === 'STATUS') {
      var parts = (store('get', SYNC_KEY) || '').split('|');
      var age = parts[1] ? Date.now() - parseInt(parts[1], 10) : Infinity;
      var complete = d.totalPages && d.pages >= d.totalPages;
      if (parts[0] !== d.version || age > 7 * 86400000 || !complete) {
        var run = function () { navigator.serviceWorker.ready.then(function (r) { requestSync(r.active); }); };
        if (syncPolicy() === 'ask') {
          if (!dismissed(SAVE_KEY)) {
            window.setTimeout(function () {
              var el = bar('bw-pwa-save',
                '<span>Save the site on your phone to use it offline (about 8 MB)?</span>' +
                '<button type="button" class="bw-pwa-primary">Save</button>' +
                '<button type="button" class="bw-pwa-secondary">No thanks</button>');
              el.querySelector('.bw-pwa-primary').addEventListener('click', function () { el.remove(); run(); });
              el.querySelector('.bw-pwa-secondary').addEventListener('click', function () { el.remove(); remember(SAVE_KEY); });
            }, 10000);
          }
        } else if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 15000 });
        else window.setTimeout(run, 8000);
      }
    }
    if (d.type === 'SYNC_DONE' && d.version) store('set', SYNC_KEY, d.version + '|' + Date.now());
    if (d.type === 'SYNC_PROGRESS' || d.type === 'SYNC_DONE') {
      document.dispatchEvent(new CustomEvent('bw:pwa-sync', { detail: d }));
    }
  });

  // ---- install prompt (Android/desktop Chrome) and iOS hint
  var deferredPrompt = null;
  function dismissed(key) {
    var t = parseInt(store('get', key || DISMISS_KEY) || '0', 10);
    return t && Date.now() - t < DISMISS_DAYS * 86400000;
  }
  function remember(key) { store('set', key || DISMISS_KEY, String(Date.now())); }
  function standalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (dismissed() || standalone()) return;
    window.setTimeout(function () {
      if (!deferredPrompt || document.getElementById('bw-pwa-install')) return;
      var el = bar('bw-pwa-install',
        '<span>Install BWStays for quick access, also offline.</span>' +
        '<button type="button" class="bw-pwa-primary">Install</button>' +
        '<button type="button" class="bw-pwa-secondary">Not now</button>');
      el.querySelector('.bw-pwa-primary').addEventListener('click', function () {
        el.remove();
        deferredPrompt.prompt();
        deferredPrompt.userChoice.finally(function () { deferredPrompt = null; remember(); });
      });
      el.querySelector('.bw-pwa-secondary').addEventListener('click', function () { el.remove(); remember(); });
    }, 15000);
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null;
    var el = document.getElementById('bw-pwa-install');
    if (el) el.remove();
  });

  // iOS has no install prompt API. Safari, Chrome, Firefox and Edge on iOS 16.4+ can all
  // "Add to Home Screen" from the share menu, so show a short how-to in any of them.
  function iosHint() {
    var ua = window.navigator.userAgent || '';
    var isIphone = /iphone|ipad|ipod/i.test(ua) && !window.MSStream;
    // iPadOS reports a Mac user agent; touch support tells it apart from a real Mac
    var isIpadOs = /macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;
    if (!(isIphone || isIpadOs) || standalone() || dismissed()) return;
    window.setTimeout(function () {
      if (document.getElementById('bw-pwa-install')) return;
      var el = bar('bw-pwa-install',
        '<span>Install this app: tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>.</span>' +
        '<button type="button" class="bw-pwa-secondary">Got it</button>');
      el.querySelector('button').addEventListener('click', function () { el.remove(); remember(); });
    }, 8000);
  }

  // ---- registration
  function register() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', function () {
          if (w.state === 'installed' && navigator.serviceWorker.controller) promptUpdate(w);
        });
      });
      // check for a new version when the app comes back to the foreground
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') reg.update().catch(function () {});
      });

      navigator.serviceWorker.ready.then(function (ready) {
        // ask the worker which version it is; sync for a new version or when the last sync is over a week old
        if (navigator.onLine && syncPolicy() !== 'no' && ready.active) ready.active.postMessage({ type: 'STATUS' });
      });
    }).catch(function () { /* the site works without a service worker */ });
  }

  // public hook: window.bwPwa.saveForOffline()
  window.bwPwa = {
    saveForOffline: function () {
      return navigator.serviceWorker.ready.then(function (reg) { requestSync(reg.active, true); });
    },
  };

  onlineState();
  iosHint();
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
})();
