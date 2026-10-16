#!/usr/bin/env node
/**
 * SEO, PWA and security audit of every page (static files, no network).
 *
 *   node scripts/audit-site.mjs            print the findings
 *   node scripts/audit-site.mjs --strict   exit 1 if there is any "error" finding
 *
 * Checks per page: title, description, canonical, hreflang, Open Graph, Twitter card, robots,
 * JSON-LD validity, lang, viewport, h1, image alt text, CSP and referrer policy, manifest and icons,
 * target=_blank links without rel=noopener, plain http:// resources, and the sitewide files
 * (robots.txt, sitemap, manifest, service worker, security.txt).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com';
const STRICT = process.argv.includes('--strict');
const SKIP = /^(google[0-9a-f]+|yandex_[0-9a-f]+)\.html$/i;

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.test(f));
const rep = fs.existsSync(path.join(ROOT, 'reports')) ? fs.readdirSync(path.join(ROOT, 'reports')).filter((f) => f.endsWith('.html')).map((f) => `reports/${f}`) : [];
pages.push(...rep);

const findings = []; // {level, page, msg}
const add = (level, page, msg) => findings.push({ level, page, msg });
const titles = new Map();
const descs = new Map();

for (const f of pages) {
  const h = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(h);
  const internal = /^(404|offline|footer)\.html$/.test(f) ? false : true;
  const get = (re) => (h.match(re) || [])[1];
  const title = get(/<title[^>]*>([\s\S]*?)<\/title>/i)?.trim();
  const desc = get(/<meta[^>]+name=["']description["'][^>]+content=(?:"([^"]*)"|'([^']*)')/i);
  const canon = get(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);

  if (!/<html[^>]+\blang=/i.test(h)) add('error', f, 'html has no lang attribute');
  if (!/<meta[^>]+name=["']viewport["']/i.test(h)) add('error', f, 'no viewport meta');
  if (!title) add('error', f, 'no <title>');
  else {
    if (title.length > 70) add('warn', f, `title is ${title.length} characters (aim for 60 or less)`);
    if (!noindex) titles.set(title, [...(titles.get(title) || []), f]);
  }
  if (!desc) add('error', f, 'no meta description');
  else {
    if (desc.length < 50 || desc.length > 170) add('warn', f, `meta description is ${desc.length} characters (aim for 70-160)`);
    if (!noindex) descs.set(desc, [...(descs.get(desc) || []), f]);
  }
  if (!noindex && internal) {
    if (!canon) add('error', f, 'no canonical link');
    else if (canon !== `${SITE}/${f}` && !(f === 'index.html' && canon === `${SITE}/`)) add('warn', f, `canonical ${canon} is not the page URL`);
    if (!/property=["']og:title["']/.test(h)) add('warn', f, 'no og:title');
    if (!/property=["']og:description["']/.test(h)) add('warn', f, 'no og:description');
    if (!/property=["']og:image["']/.test(h)) add('warn', f, 'no og:image');
    if (!/property=["']og:url["']/.test(h)) add('warn', f, 'no og:url');
    if (!/name=["']twitter:card["']/.test(h)) add('warn', f, 'no twitter:card');
    if (!/rel=["']alternate["'][^>]+hreflang/i.test(h)) add('warn', f, 'no hreflang alternate');
  }
  const h1 = (h.match(/<h1[\s>]/gi) || []).length;
  if (h1 === 0 && internal && !noindex) add('warn', f, 'no <h1>');
  if (h1 > 1) add('warn', f, `${h1} <h1> headings`);

  // JSON-LD
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch { add('error', f, 'invalid JSON-LD block'); }
  }
  const faqBlocks = [...h.matchAll(/"@type":\s*"FAQPage"/g)].length;
  if (faqBlocks > 1) add('error', f, `${faqBlocks} FAQPage blocks (Google accepts one)`);

  // images
  const imgs = [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const noAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  if (noAlt) add('warn', f, `${noAlt} <img> without alt`);
  const noDim = imgs.filter((t) => !/\bwidth=/.test(t) || !/\bheight=/.test(t)).length;
  if (noDim > 3) add('info', f, `${noDim} <img> without width/height (layout shift)`);

  // PWA hooks
  if (!/rel=["']manifest["']/.test(h) && !/^(google|yandex)/.test(f)) add('warn', f, 'no manifest link');
  if (!/name=["']theme-color["']/.test(h)) add('info', f, 'no theme-color');
  if (!/rel=["']apple-touch-icon["']/.test(h) && internal) add('info', f, 'no apple-touch-icon');
  if (!/pwa(\.min)?\.js/.test(h) && !/^(404|offline)\.html$/.test(f)) add('warn', f, 'pwa.js is not loaded (no service worker registration)');

  // security
  const csp = get(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]+content="([^"]*)"/i);
  if (!csp) add('warn', f, 'no Content-Security-Policy meta');
  else {
    if (/script-src[^;]*'unsafe-eval'/.test(csp)) add('warn', f, "CSP script-src allows 'unsafe-eval'");
    if (!/object-src\s+'none'/.test(csp)) add('info', f, "CSP has no object-src 'none'");
    if (!/base-uri/.test(csp)) add('info', f, 'CSP has no base-uri');
    if (!/frame-ancestors/.test(csp)) add('info', f, 'CSP frame-ancestors cannot be set by meta (needs a header)');
  }
  if (!/name=["']referrer["']/.test(h)) add('warn', f, 'no referrer policy meta');
  const blanks = [...h.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)].map((m) => m[0]).filter((t) => !/rel=["'][^"']*noopener/.test(t));
  if (blanks.length) add('warn', f, `${blanks.length} target=_blank link(s) without rel=noopener`);
  const http = [...h.matchAll(/\b(?:src|href)=["'](http:\/\/[^"']+)["']/gi)].map((m) => m[1]).filter((u) => !/^http:\/\/www\.w3\.org|schemas\.|localhost/.test(u));
  if (http.length) add('error', f, `plain http resource: ${http[0]}`);
  const inlineHandlers = (h.match(/\son(?:click|load|error|change|submit)=/gi) || []).length;
  if (inlineHandlers) add('info', f, `${inlineHandlers} inline event handler(s) (they need 'unsafe-inline' in the CSP)`);
}
for (const [t, list] of titles) if (list.length > 1) add('warn', list.join(', '), `same title on ${list.length} pages: ${t.slice(0, 60)}`);
for (const [d, list] of descs) if (list.length > 1) add('info', list.join(', ').slice(0, 120), `same meta description on ${list.length} pages`);

// sitewide files
const need = (f, level = 'warn') => { if (!fs.existsSync(path.join(ROOT, f))) add(level, f, 'missing'); return fs.existsSync(path.join(ROOT, f)); };
if (need('robots.txt')) {
  const r = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  if (!/Sitemap:/i.test(r)) add('warn', 'robots.txt', 'no Sitemap line');
  if (/Disallow:\s*\/\s*$/m.test(r)) add('error', 'robots.txt', 'disallows the whole site');
}
need('sitemap.xml');
need('.well-known/security.txt');
if (need('manifest.json')) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  for (const k of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'background_color', 'id', 'scope', 'lang', 'description', 'categories']) if (m[k] === undefined) add(['id', 'scope', 'lang', 'description', 'categories'].includes(k) ? 'info' : 'error', 'manifest.json', `no ${k}`);
  const sizes = (m.icons || []).map((i) => `${i.sizes}${/maskable/.test(i.purpose || '') ? ' maskable' : ''}`);
  if (!sizes.some((s) => s.startsWith('192'))) add('error', 'manifest.json', 'no 192px icon');
  if (!sizes.some((s) => s.startsWith('512'))) add('error', 'manifest.json', 'no 512px icon');
  if (!sizes.some((s) => /maskable/.test(s))) add('warn', 'manifest.json', 'no maskable icon');
  if (!(m.screenshots || []).length) add('info', 'manifest.json', 'no screenshots (richer install prompt)');
  if (!(m.shortcuts || []).length) add('info', 'manifest.json', 'no shortcuts');
}
need('offline.html');
need('sw.js');

const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.msg.localeCompare(b.msg));
// group identical messages across pages
const groups = new Map();
for (const x of findings) {
  const key = `${x.level}|${x.msg.replace(/\d+/g, 'N')}`;
  const g = groups.get(key) || { level: x.level, msg: x.msg, pages: [] };
  g.pages.push(x.page);
  groups.set(key, g);
}
let errors = 0;
for (const g of [...groups.values()].sort((a, b) => order[a.level] - order[b.level] || b.pages.length - a.pages.length)) {
  if (g.level === 'error') errors += g.pages.length;
  console.log(`${g.level.toUpperCase().padEnd(5)} ${String(g.pages.length).padStart(3)} page(s)  ${g.msg}${g.pages.length <= 3 ? '  [' + g.pages.join(', ') + ']' : ''}`);
}
console.log(`\n${pages.length} pages audited; ${errors} error(s)`);
if (STRICT && errors) process.exit(1);
