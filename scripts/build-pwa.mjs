#!/usr/bin/env node
/**
 * Builds /sw.js (the service worker) from scripts/pwa/sw.template.js and the site's own files.
 *
 *   node scripts/build-pwa.mjs           # write sw.js
 *   node scripts/build-pwa.mjs --check   # exit 1 if sw.js is stale (used by check.mjs / CI)
 *
 * What it works out from the repository (nothing is typed by hand):
 *   SHELL   css, js, fonts, vendor libraries and small data files that the pages load, plus
 *           the offline page, the manifest and the app icons: saved when the app installs.
 *   PAGES   every HTML page: saved in the background after the first visit.
 *   DATA    JSON data files the pages fetch: saved in the background.
 *   IMAGES  every image that a page or a data file refers to: saved in the background.
 *
 * VERSION is a hash of the SHELL file list and contents. It changes only when a stylesheet,
 * script, vendor library, font, icon or the manifest changes, so a new booking in the calendar
 * data does not make every visitor download the shell again.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://www.bwstays.com';
const SKIP_PAGES = /^(google[0-9a-f]+|yandex_[0-9a-f]+)\.html$/i;
// availability changes with every booking: always fetched fresh, never part of the shell/version
const FRESH = /^data\/(bookingdata|closeddata)(\.min)?\.js$/;

const rel = (p) => p.split(path.sep).join('/');
const exists = (r) => fs.existsSync(path.join(ROOT, r)) && fs.statSync(path.join(ROOT, r)).isFile();

// ---- pages
const pageFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP_PAGES.test(f));
const reportsDir = path.join(ROOT, 'reports');
if (fs.existsSync(reportsDir)) {
  for (const f of fs.readdirSync(reportsDir)) if (f.endsWith('.html')) pageFiles.push(`reports/${f}`);
}
const pages = pageFiles.sort();

// ---- references found in pages and data files
const URL_RE = /https:\/\/www\.bwstays\.com\/([A-Za-z0-9_\-./%]+?\.[A-Za-z0-9]+(?:\?[A-Za-z0-9=._\-]+)?)(?=["'\s)<>\\,;]|$)/g;
const found = new Map(); // url path (with query) -> relative file path
function scan(text) {
  for (const m of text.matchAll(URL_RE)) {
    const withQuery = m[1];
    const file = decodeURIComponent(withQuery.split('?')[0]);
    if (exists(file)) found.set(withQuery, file);
  }
}
for (const p of pages) scan(fs.readFileSync(path.join(ROOT, p), 'utf8'));
for (const dir of ['data', 'js']) {
  const d = path.join(ROOT, dir);
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (/\.(js|json)$/.test(f) && !f.endsWith('.map')) scan(fs.readFileSync(path.join(d, f), 'utf8'));
  }
}

// images and fonts that stylesheets refer to with relative url(...)
const cssUrls = new Set();
for (const dir of ['css']) {
  const d = path.join(ROOT, dir);
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.css') || f.endsWith('.min.css')) continue; // minified copies hold the same urls
    const text = fs.readFileSync(path.join(d, f), 'utf8');
    scan(text); // absolute https://www.bwstays.com/... urls
    for (const m of text.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      const u = m[1];
      if (/^(data:|https?:|#)/.test(u)) continue;
      const file = path.posix.normalize(path.posix.join(dir, u.split('?')[0].split('#')[0]));
      if (exists(file)) cssUrls.add(file);
    }
  }
}
// public-CDN files that pages load (pages that use jsPDF, flatpickr, charts...)
const external = new Set();
for (const p of pages) {
  const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
  for (const m of html.matchAll(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/[A-Za-z0-9_\-./]+?\.(?:js|css)(?=["'\s>])/g)) {
    if (!/\[version\]/.test(m[0])) external.add(m[0]);
  }
}
const IMG = /\.(png|jpe?g|gif|webp|avif|svg|ico)$/i;
const shell = new Set();
const data = new Set();
const images = new Set();
for (const [urlPath, file] of found) {
  if (/\.html$/.test(file) || file === 'sw.js' || file === 'offline.html') continue;
  if (FRESH.test(file)) continue;
  const abs = `${ORIGIN}/${urlPath}`;
  if (IMG.test(file)) {
    // the app icons are part of the shell, every other image is saved in the background
    if (file.startsWith('assets/img/pwa/')) shell.add(abs);
    else images.add(`${ORIGIN}/${file}`);
  } else if (/\.(css|js|woff2?|ttf)$/.test(file) && !file.endsWith('.map')) {
    shell.add(abs);
  } else if (/^data\/.*\.json$/.test(file)) {
    data.add(`${ORIGIN}/${file}`);
  }
}
for (const f of cssUrls) {
  if (IMG.test(f)) images.add(`${ORIGIN}/${f}`);
  else if (/\.(woff2?|ttf)$/.test(f)) shell.add(`${ORIGIN}/${f}`);
}
// translations fetched by the language switcher
if (fs.existsSync(path.join(ROOT, 'lang'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'lang'))) if (f.endsWith('.json')) data.add(`${ORIGIN}/lang/${f}`);
}
// every JSON data file (places, stations, search index...): some are requested with built-up URLs
for (const f of fs.readdirSync(path.join(ROOT, 'data'))) {
  if (f.endsWith('.json')) data.add(`${ORIGIN}/data/${f}`);
}
// the app shell always carries the offline page, manifest and icons, even if no page names them
['offline.html', 'manifest.json',
  'assets/img/pwa/icon-192.png', 'assets/img/pwa/icon-512.png', 'assets/img/pwa/icon-maskable-512.png',
  'assets/img/pwa/apple-touch-icon.png', 'assets/img/pwa/icon-96.png',
].forEach((f) => { if (exists(f)) shell.add(`/${f}`); });
// the two pages most visitors open first work offline straight after install
['index.html', 'bwstays-booking.html'].forEach((f) => { if (exists(f)) shell.add(`${ORIGIN}/${f}`); });
if (exists('index.html')) shell.add(`${ORIGIN}/`);

const toPath = (u) => (u.startsWith(ORIGIN) ? u.slice(ORIGIN.length) || '/' : u);
const shellList = [...shell].map(toPath).sort();
const pageList = pages.map((p) => `/${p}`);
const dataList = [...data].map(toPath).sort();
const imageList = [...images].map(toPath).sort();

// ---- version: shell file list + contents of the local files behind it (not pages, not availability)
const hash = crypto.createHash('sha1');
for (const u of shellList) {
  hash.update(u + '\n');
  const file = decodeURIComponent(u.replace(/^\//, '').split('?')[0]);
  if (file && !/\.html$/.test(file) && exists(file)) hash.update(fs.readFileSync(path.join(ROOT, file)));
}
for (const f of ['scripts/pwa/sw.template.js']) hash.update(fs.readFileSync(path.join(ROOT, f)));
const version = hash.digest('hex').slice(0, 10);

const template = fs.readFileSync(path.join(ROOT, 'scripts/pwa/sw.template.js'), 'utf8').replace(/\r\n/g, '\n');
const fmt = (a) => '[\n' + a.map((x) => '  ' + JSON.stringify(x)).join(',\n') + '\n]';
const out = template
  .replace('__VERSION__', version)
  .replace('__SHELL__', fmt(shellList))
  .replace('__PAGES__', fmt(pageList))
  .replace('__DATA__', fmt(dataList))
  .replace('__IMAGES__', fmt(imageList))
  .replace('__EXTERNAL__', fmt([...external].sort()));

const target = path.join(ROOT, 'sw.js');
if (CHECK) {
  const cur = exists('sw.js') ? fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (cur !== out) {
    console.error('sw.js is stale: run node scripts/build-pwa.mjs');
    process.exit(1);
  }
  console.log(`sw.js is current (version ${version})`);
} else {
  fs.writeFileSync(target, out);
  console.log(`sw.js written: version ${version} | shell ${shellList.length} | pages ${pageList.length} | data ${dataList.length} | images ${imageList.length} | external ${external.size}`);
}
