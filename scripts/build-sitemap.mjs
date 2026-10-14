#!/usr/bin/env node
/**
 * Builds sitemap.xml, page-sitemap.xml (same content, kept so earlier submissions keep working),
 * sitemap.txt and sitemap_index.xml from the pages in this repository.
 *
 *   node scripts/build-sitemap.mjs           # write the files
 *   node scripts/build-sitemap.mjs --check   # exit 1 if the set of URLs is out of date (lastmod ignored)
 *
 * Rules
 *   - every HTML page that is indexable: not noindex, not 404/offline, not a search-engine verification file
 *   - URL comes from the page's <link rel="canonical"> when it is on www.bwstays.com
 *   - lastmod is the date of the newest git commit that changed the page's own content;
 *     site-wide edits (see below) do not count. If git history is not available (shallow clone)
 *     the previous lastmod is kept.
 *   - each page lists its content images (<image:image>) for image search
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const ORIGIN = 'https://www.bwstays.com';
const SKIP = /^(google[0-9a-f]+|yandex_[0-9a-f]+|404|offline)\.html$/i;
const SKIP_IMG = /^assets\/img\/(pwa|icons|logo)\b/;
const MAX_IMAGES = 40;

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.test(f));
const reports = path.join(ROOT, 'reports');
if (fs.existsSync(reports)) for (const f of fs.readdirSync(reports)) if (f.endsWith('.html')) pages.push(`reports/${f}`);

// previous lastmod values, used when git history is missing
const prev = new Map();
const prevFile = path.join(ROOT, 'sitemap.xml');
if (fs.existsSync(prevFile)) {
  for (const m of fs.readFileSync(prevFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) prev.set(m[1], m[2]);
}

// One pass over the history: for each page, the date of the newest commit that changed it and
// was not a site-wide edit. A commit is site-wide (and ignored) when
//   - it touched more than BULK_LIMIT pages, or
//   - its subject, with the file name removed, was used by 5 or more commits (the same change
//     committed page by page, e.g. "Refresh CSS version string in x.html"), or
//   - it is plumbing: asset versions, minified files, regenerated data, merges.
const BULK_LIMIT = 15;
const PLUMBING = /^(Refresh|Rebuild|Regenerate|Prerender|PWA:|All pages:|Location pages:|Merge)|version string|asset version|minified|cache.?bust/i;
const lastChange = new Map();
{
  const r = spawnSync('git', ['log', '--no-merges', '--name-only', '--format=@%cs|%s', '--', '*.html'],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status === 0) {
    const commits = [];
    let cur = null;
    for (const line of r.stdout.split(/\r?\n/)) {
      if (line.startsWith('@')) {
        const parts = line.slice(1).split('|');
        cur = { date: parts[0].trim(), subject: parts.slice(1).join('|').trim(), files: [] };
        commits.push(cur);
      } else if (line.trim() && cur) {
        cur.files.push(line.trim());
      }
    }
    const shape = (c) => c.subject.replace(/[\w./-]+\.html/gi, '<file>').toLowerCase();
    const uses = new Map();
    for (const c of commits) uses.set(shape(c), (uses.get(shape(c)) || 0) + 1);
    for (const c of commits) {
      if (!c.files.length || c.files.length > BULK_LIMIT) continue;
      if (PLUMBING.test(c.subject) || uses.get(shape(c)) >= 5) continue;
      for (const f of c.files) if (!lastChange.has(f)) lastChange.set(f, c.date);
    }
  }
}

const today = new Date().toISOString().slice(0, 10);
const entries = [];
for (const file of pages.sort()) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) continue;
  const canon = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  const url = canon && canon[1].startsWith(ORIGIN + '/') ? canon[1] : `${ORIGIN}/${file}`;
  const images = new Set();
  const imgRe = /(?:src|data-src|content)=["'](https:\/\/www\.bwstays\.com\/(assets\/img\/[^"'?#]+\.(?:webp|avif|jpe?g|png)))/gi;
  for (const m of html.matchAll(imgRe)) {
    if (SKIP_IMG.test(m[2])) continue;
    if (fs.existsSync(path.join(ROOT, m[2]))) images.add(m[1]);
    if (images.size >= MAX_IMAGES) break;
  }
  entries.push({ file, url, lastmod: lastChange.get(file) || prev.get(url) || today, images: [...images] });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'];
for (const e of entries) {
  xml.push('<url>', `  <loc>${esc(e.url)}</loc>`, `  <lastmod>${e.lastmod}</lastmod>`);
  for (const img of e.images) xml.push(`  <image:image><image:loc>${esc(img)}</image:loc></image:image>`);
  xml.push('</url>');
}
xml.push('</urlset>', '');
const sitemapXml = xml.join('\n');
const sitemapTxt = entries.map((e) => e.url).join('\n') + '\n';
const newest = entries.map((e) => e.lastmod).sort().pop() || today;
const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${ORIGIN}/sitemap.xml</loc>
    <lastmod>${newest}</lastmod>
  </sitemap>
</sitemapindex>
`;

if (CHECK) {
  const want = new Set(entries.map((e) => e.url));
  const text = fs.existsSync(prevFile) ? fs.readFileSync(prevFile, 'utf8') : '';
  const have = new Set([...text.matchAll(/<loc>(https:\/\/www\.bwstays\.com\/[^<]+\.html)<\/loc>/g)].map((m) => m[1]));
  const missing = [...want].filter((u) => !have.has(u));
  const extra = [...have].filter((u) => !want.has(u));
  if (missing.length || extra.length) {
    console.error(`sitemap.xml is out of date: ${missing.length} missing, ${extra.length} extra (run node scripts/build-sitemap.mjs)`);
    process.exit(1);
  }
  console.log(`sitemap.xml lists all ${want.size} indexable pages`);
} else {
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(ROOT, 'page-sitemap.xml'), sitemapXml);
  fs.writeFileSync(path.join(ROOT, 'sitemap.txt'), sitemapTxt);
  fs.writeFileSync(path.join(ROOT, 'sitemap_index.xml'), index);
  const imgs = entries.reduce((n, e) => n + e.images.length, 0);
  console.log(`sitemap written: ${entries.length} pages, ${imgs} images, newest lastmod ${newest}`);
}
