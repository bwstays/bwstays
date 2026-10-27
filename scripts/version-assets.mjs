#!/usr/bin/env node
/**
 * Adds a content-hash version to every local CSS/JS URL in the HTML pages:
 *
 *   https://www.bwstays.com/css/details-page.css  ->  .../css/details-page.css?v=3fa9c1d2
 *
 * Why: the CDN in front of GitHub Pages serves .css/.js with a 4 hour
 * browser-cache lifetime while HTML is cached for 10 minutes. Without a
 * version in the URL, visitors keep running the old stylesheet and scripts
 * for hours after a deploy. The version changes only when the file's content
 * changes, so unchanged files stay cached.
 *
 *   node scripts/version-assets.mjs          # rewrite the pages
 *   node scripts/version-assets.mjs --check  # exit 1 if any version is stale
 *
 * Run it after changing any file under css/, js/ or data/*.js.
 * Zero dependencies, Node >= 18.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SITE = 'https://www.bwstays.com/';

const hashCache = new Map();
function versionOf(rel) {
  if (!hashCache.has(rel)) {
    const abs = path.join(ROOT, rel);
    hashCache.set(rel, fs.existsSync(abs)
      // line endings are normalised so Windows (CRLF checkout) and Linux CI agree
      ? crypto.createHash('sha1').update(fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8)
      : null);
  }
  return hashCache.get(rel);
}

// absolute site URLs and root-relative ones, in src="" / href="" only
const URL_RE = /((?:src|href)\s*=\s*["'])((?:https:\/\/www\.bwstays\.com\/)?((?:css|js|data|styles)\/[A-Za-z0-9_\-./]+\.(?:css|js)))(\?[^"']*)?(["'])/g;

// Font files (assets/fonts/**.woff2) get a version too: they are cached for a year, so a rebuilt icon subset
// (scripts/build-fontawesome.py) must have a new URL or visitors keep the old glyphs and new icons show blank.
// Versioned in the url() of the stylesheets under css/ (done first, so those stylesheets' own hashes include
// it) and in href="" (the font preload tags in the pages). Hashed as bytes, unlike the text files above.
const fontHash = new Map();
function fontVersionOf(rel) {
  if (!fontHash.has(rel)) {
    const abs = path.join(ROOT, rel);
    fontHash.set(rel, fs.existsSync(abs) ? crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8) : null);
  }
  return fontHash.get(rel);
}
const CSS_FONT_RE = /url\((["']?)((?:\.\.\/)+)(assets\/fonts\/[A-Za-z0-9_\-./]+\.woff2)(\?[^"')]*)?\1\)/g;
const HTML_FONT_RE = /((?:href)\s*=\s*["'])((?:https:\/\/www\.bwstays\.com\/)?(assets\/fonts\/[A-Za-z0-9_\-./]+\.woff2))(\?[^"']*)?(["'])/g;
let fontRefs = 0;
const staleFonts = [];
for (const f of fs.readdirSync(path.join(ROOT, 'css')).filter((n) => n.endsWith('.css'))) {
  const abs = path.join(ROOT, 'css', f);
  const src = fs.readFileSync(abs, 'utf8');
  const out = src.replace(CSS_FONT_RE, (all, q, up, rel, query) => {
    const v = fontVersionOf(rel);
    if (!v) return all;
    fontRefs++;
    if ((query ?? '') === `?v=${v}`) return all;
    staleFonts.push(`css/${f}: ${rel}`);
    return `url(${q}${up}${rel}?v=${v}${q})`;
  });
  if (out !== src && !CHECK) {
    fs.writeFileSync(abs, out);
    hashCache.delete(`css/${f}`);
  }
}

const pages = [];
for (const f of fs.readdirSync(ROOT)) if (f.endsWith('.html')) pages.push(f);
if (fs.existsSync(path.join(ROOT, 'reports'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) if (f.endsWith('.html')) pages.push(`reports/${f}`);
}

let changedFiles = 0;
let refs = 0;
const stale = [];
for (const page of pages) {
  const abs = path.join(ROOT, page);
  const src = fs.readFileSync(abs, 'utf8');
  const out = src.replace(URL_RE, (all, pre, full, rel, query, quote) => {
    const v = versionOf(rel);
    if (!v) return all; // not a file in this repo (e.g. a CDN path that happens to match)
    refs++;
    const wanted = `?v=${v}`;
    if ((query ?? '') === wanted) return all;
    stale.push(`${page}: ${rel}`);
    return `${pre}${full}${wanted}${quote}`;
  }).replace(HTML_FONT_RE, (all, pre, full, rel, query, quote) => {
    const v = fontVersionOf(rel);
    if (!v) return all;
    fontRefs++;
    if ((query ?? '') === `?v=${v}`) return all;
    staleFonts.push(`${page}: ${rel}`);
    return `${pre}${full}?v=${v}${quote}`;
  });
  if (out !== src) {
    changedFiles++;
    if (!CHECK) fs.writeFileSync(abs, out);
  }
}

stale.push(...staleFonts);
if (CHECK) {
  if (stale.length) {
    console.error(`stale asset versions (${stale.length}); run: node scripts/version-assets.mjs`);
    for (const s of stale.slice(0, 10)) console.error('  ' + s);
    process.exit(1);
  }
  console.log(`asset versions current (${refs} references in ${pages.length} pages)`);
} else {
  console.log(`versioned ${refs} references and ${fontRefs} font references; updated ${changedFiles} of ${pages.length} pages`);
}
