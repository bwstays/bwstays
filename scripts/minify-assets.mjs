#!/usr/bin/env node
/**
 * Builds minified copies of the site's CSS and JavaScript and points the pages at them.
 *
 *   css/details-page.css  ->  css/details-page.min.css  (+ .min.css.map)
 *   js/scripts.js         ->  js/scripts.min.js         (+ .min.js.map)
 *   data/sitedata.js      ->  data/sitedata.min.js      (+ .min.js.map)
 *
 * The readable source files stay in the repo and are the only files you edit.
 * Each .min file ends with a sourceMappingURL, so browser dev tools show the
 * original source (names, line numbers, breakpoints) while the page runs the
 * small file. Which sources are built = every local css/js/data file that an
 * HTML page references. Hashes of the sources are stored in assets-min.json so
 * `check.mjs` can tell when a .min file is out of date.
 *
 *   node scripts/minify-assets.mjs           # build everything, then re-point pages
 *   node scripts/minify-assets.mjs --check   # exit 1 if a .min file is stale
 *
 * After running it, run: node scripts/version-assets.mjs  (adds the ?v= hashes)
 * Needs Node >= 18 and network access the first time (npx fetches esbuild).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const MANIFEST = path.join(ROOT, 'assets-min.json');
const ESBUILD = 'esbuild@0.25.10';
const REF_RE = /((?:src|href)\s*=\s*["'])((?:https:\/\/www\.bwstays\.com\/)?)((?:css|js|data)\/[A-Za-z0-9_\-.]+?)(\.min)?\.(css|js)((?:\?[^"']*)?["'])/g;
const SKIP = new Set(['js/sw.js', 'js/cache-polyfill.js']); // service worker files must keep their exact names

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => path.join(ROOT, f));
const rep = path.join(ROOT, 'reports');
if (fs.existsSync(rep)) for (const f of fs.readdirSync(rep)) if (f.endsWith('.html')) pages.push(path.join(rep, f));

const sha = (file) => crypto.createHash('sha1').update(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);

// sources referenced by the pages, directly or in a <!--bundle ...--> list (scripts/build-bundles.mjs)
const sources = new Set();
const BUNDLE_LIST_RE = /<!--bundle\s+([^>]*?)\s*-->/g;
const LISTED_RE = /^((?:css|js|data)\/[A-Za-z0-9_\-.]+?)(\.min)?\.(css|js)$/;
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  for (const m of html.matchAll(REF_RE)) {
    const rel = `${m[3]}.${m[5]}`;
    if (!SKIP.has(rel) && fs.existsSync(path.join(ROOT, rel))) sources.add(rel);
  }
  for (const b of html.matchAll(BUNDLE_LIST_RE)) {
    for (const item of b[1].split(/\s+/)) {
      const m = item.match(LISTED_RE);
      if (!m) continue; // vendor files are already minified
      const rel = `${m[1]}.${m[3]}`;
      if (!SKIP.has(rel) && fs.existsSync(path.join(ROOT, rel))) sources.add(rel);
    }
  }
}
const list = [...sources].sort();

if (CHECK) {
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
  const stale = list.filter((rel) => {
    const min = rel.replace(/\.(css|js)$/, '.min.$1');
    return manifest[rel] !== sha(path.join(ROOT, rel)) || !fs.existsSync(path.join(ROOT, min));
  });
  if (stale.length) {
    console.error(`minified files are stale (${stale.length}); run: node scripts/minify-assets.mjs`);
    for (const s of stale.slice(0, 10)) console.error('  ' + s);
    process.exit(1);
  }
  console.log(`minified files current (${list.length} sources)`);
  process.exit(0);
}

const manifest = {};
let before = 0;
let after = 0;
for (const rel of list) {
  const min = rel.replace(/\.(css|js)$/, '.min.$1');
  const loader = rel.endsWith('.css') ? 'css' : 'js';
  const r = spawnSync('npx', ['--yes', ESBUILD, rel, '--minify', '--sourcemap=linked', `--outfile=${min}`, `--loader:.${loader}=${loader}`, '--legal-comments=none', '--charset=utf8', '--log-level=warning'],
    { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`minify failed: ${rel}\n${r.stdout}${r.stderr}`);
    process.exit(1);
  }
  manifest[rel] = sha(path.join(ROOT, rel));
  before += fs.statSync(path.join(ROOT, rel)).size;
  after += fs.statSync(path.join(ROOT, min)).size;
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

// point the pages at the minified files
let changed = 0;
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8');
  const out = html.replace(REF_RE, (all, pre, host, base, isMin, ext, tail) => {
    const rel = `${base}.${ext}`;
    if (isMin || !sources.has(rel)) return all;
    return `${pre}${host}${base}.min.${ext}${tail}`;
  });
  if (out !== html) { fs.writeFileSync(p, out); changed++; }
}
console.log(`minified ${list.length} files: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB; re-pointed ${changed} pages`);

// rebuild the bundles from the fresh .min files (scripts/build-bundles.mjs)
const bundles = spawnSync(process.execPath, [path.join(ROOT, 'scripts/build-bundles.mjs')], { cwd: ROOT, encoding: 'utf8' });
process.stdout.write(bundles.stdout);
if (bundles.status !== 0) {
  process.stderr.write(bundles.stderr);
  process.exit(1);
}
