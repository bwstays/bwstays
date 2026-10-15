#!/usr/bin/env node
/**
 * Build-time prerender: writes the content that the page scripts build in the browser into the
 * HTML files themselves, so crawlers that do not run JavaScript (AI crawlers, social previews,
 * simple fetchers) see the same text and links as visitors.
 *
 *   node scripts/prerender.mjs                 # prerender every page
 *   node scripts/prerender.mjs --page index.html --page bwstays-booking.html
 *   node scripts/prerender.mjs --dry-run       # report what would change, write nothing
 *   node scripts/prerender.mjs --verify        # no browser: check the markers are in place
 *
 * How it works
 *   1. Each page is opened in headless Chrome with its own scripts, from this repository
 *      (https://www.bwstays.com/* is served from disk; other hosts are blocked, so the result
 *      does not depend on the network).
 *   2. For each container in TARGETS the rendered inner HTML is read.
 *   3. It is written back into the same container in the source file, between
 *      <!--prerender:begin--> and <!--prerender:end-->. No new files are created, and no
 *      attribute outside the containers (links, ids, scripts) is touched.
 *   4. When the page loads in a browser the existing scripts rebuild the container (every target
 *      is one that its script clears first), so visitors see the same result as before.
 *
 * Needs: node >= 18, playwright-core (npm i --no-save playwright-core) and a Chrome/Chromium.
 *   CHROME_PATH=/path/to/chrome   (default: common Windows/Linux locations)
 *   PLAYWRIGHT_CORE=/path/to/playwright-core/index.mjs   (when it is not installed in this repo)
 *
 * Re-run it after changing data/sitedata.js, nearbylocationsdata.js, food/fuel/EV data or the
 * scripts that render these blocks. The monthly data workflow does this.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.bwstays.com';
const BEGIN = '<!--prerender:begin-->';
const END = '<!--prerender:end-->';
const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const VERIFY = args.includes('--verify');
const onlyPages = args.flatMap((a, i) => (a === '--page' ? [args[i + 1]] : []));

const SKIP = /^(google[0-9a-f]+|yandex_[0-9a-f]+|404|offline|villa1)\.html$/i;

/**
 * Containers whose content is built by JavaScript and replaced (never appended to) by it.
 *  - selector : CSS selector in the rendered page (all matches, in document order)
 *  - match    : how to find the same element(s) in the source HTML
 *  - inner    : 'html' = the container's inner HTML; 'list' = wrap only the .evgas-list element
 */
const TARGETS = [
  { name: 'discover rows', selector: '#wrapper-div .project-text', match: { classToken: 'project-text' } },
  { name: 'place details', selector: '.det-marg-f', match: { classToken: 'det-marg-f' }, first: true },
  { name: 'other places', selector: '#plantation-places', match: { id: 'plantation-places' } },
  { name: 'nearby places', selector: '#nearby-cards', match: { id: 'nearby-cards' } },
  { name: 'food list', selector: '#food-list', match: { id: 'food-list' }, ensureClass: 'bw-food-widget' },
  { name: 'ev and fuel lists', selector: '[data-evgas]', match: { attr: 'data-evgas' }, inner: 'list' },
];

// ---------------------------------------------------------------- source HTML helpers
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** all elements of one tag (default div) in html whose opening tag satisfies test(attrsText) */
function findElements(html, test, tag = 'div') {
  const out = [];
  const openRe = new RegExp(`<${tag}\\b([^>]*)>`, 'gi');
  let m;
  while ((m = openRe.exec(html))) {
    if (!test(m[1])) continue;
    // matching close tag by depth, skipping comments
    const tagRe = new RegExp(`<(/?)${tag}\\b[^>]*>|<!--[\\s\\S]*?-->`, 'gi');
    tagRe.lastIndex = openRe.lastIndex;
    let depth = 1;
    let t;
    let closeStart = -1;
    let end = -1;
    while ((t = tagRe.exec(html))) {
      if (t[0].startsWith('<!--')) continue;
      depth += t[1] ? -1 : 1;
      if (depth === 0) {
        closeStart = t.index;
        end = tagRe.lastIndex;
        break;
      }
    }
    if (closeStart === -1) continue;
    out.push({ start: m.index, openEnd: openRe.lastIndex, closeStart, end, attrs: m[1] });
  }
  return out;
}
const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`, 'i')) || attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*'([^']*)'`, 'i'));
  return m ? m[1] : null;
};
const hasAttr = (attrs, name) => new RegExp(`(?:^|\\s)${name}(?:\\s|=|$)`, 'i').test(attrs);
const tester = (match) => (attrs) => {
  if (match.id) return attr(attrs, 'id') === match.id;
  if (match.classToken) return (attr(attrs, 'class') || '').split(/\s+/).includes(match.classToken);
  if (match.attr) return hasAttr(attrs, match.attr);
  return false;
};

function stripMarkers(inner) {
  return inner.replace(/<!--prerender:begin-->[\s\S]*?<!--prerender:end-->/g, '');
}

// ---------------------------------------------------------------- verify mode (no browser)
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.test(f))
  .filter((f) => !onlyPages.length || onlyPages.includes(f)).sort();

if (VERIFY) {
  let problems = 0;
  let withTargets = 0;
  for (const f of pages) {
    const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const t of TARGETS) {
      const els = findElements(html, tester(t.match));
      if (!els.length) continue;
      withTargets++;
      const missing = els.filter((e) => !html.slice(e.openEnd, e.closeStart).includes(BEGIN));
      if (missing.length) {
        problems++;
        console.error(`${f}: ${t.name}: ${missing.length} of ${els.length} container(s) have no prerendered content`);
      }
    }
  }
  if (problems) {
    console.error(`prerender is incomplete in ${problems} place(s): run node scripts/prerender.mjs`);
    process.exit(1);
  }
  console.log(`prerender markers present in all ${withTargets} containers`);
  process.exit(0);
}

// ---------------------------------------------------------------- browser
async function loadPlaywright() {
  try {
    return await import('playwright-core');
  } catch (e) {
    if (process.env.PLAYWRIGHT_CORE) return import(pathToFileURL(process.env.PLAYWRIGHT_CORE).href);
    console.error('playwright-core is needed: npm i --no-save playwright-core (or set PLAYWRIGHT_CORE)');
    process.exit(2);
  }
}
function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    console.error('No Chrome found; set CHROME_PATH');
    process.exit(2);
  }
  return found;
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' };

const pw = await loadPlaywright();
const chromium = pw.chromium ?? pw.default?.chromium;
const browser = await chromium.launch({ executablePath: chromePath() });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });

await context.route('**/*', async (route) => {
  const u = new URL(route.request().url());
  if (u.origin !== ORIGIN) return route.abort(); // analytics, fonts, tiles, ads: not needed and not deterministic
  let rel = decodeURIComponent(u.pathname.slice(1));
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: 'not found' });
  return route.fulfill({ body: fs.readFileSync(file), contentType: MIME[path.extname(file)] || 'application/octet-stream' });
});

let changedPages = 0;
let containers = 0;
const report = [];
for (const f of pages) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const crlf = src.includes('\r\n');
  let html = src.replace(/\r\n/g, '\n');
  // never prerender on top of an earlier prerender: render the page as authored
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/${f}`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200);
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2500);

  const snapshots = [];
  for (const t of TARGETS) {
    const els = findElements(html, tester(t.match));
    if (!els.length) continue;
    const rendered = await page.evaluate(({ selector, inner, first }) => {
      const nodes = [...document.querySelectorAll(selector)];
      const take = first ? nodes.slice(0, 1) : nodes;
      return take.map((n) => {
        if (inner === 'list') {
          const l = n.querySelector('.evgas-list');
          return l && l.querySelector('.bw-food-item') ? l.outerHTML : '';
        }
        return n.innerHTML;
      });
    }, { selector: t.selector, inner: t.inner || 'html', first: Boolean(t.first) });
    snapshots.push({ t, els: t.first ? els.slice(0, 1) : els, rendered });
  }

  // write from the end of the file backwards so earlier offsets stay valid
  const edits = [];
  for (const { t, els, rendered } of snapshots) {
    els.forEach((el, i) => {
      const snap = (rendered[i] || '').replace(/\s+\n/g, '\n').trim();
      if (!snap) return;
      edits.push({ el, t, snap });
    });
  }
  edits.sort((a, b) => b.el.openEnd - a.el.openEnd);
  for (const { el, t, snap } of edits) {
    const block = `${BEGIN}${snap}${END}`;
    let openTag = html.slice(el.start, el.openEnd);
    if (t.ensureClass && !(attr(el.attrs, 'class') || '').split(/\s+/).includes(t.ensureClass)) {
      const cls = attr(el.attrs, 'class');
      openTag = cls === null
        ? openTag.replace(/>$/, ` class="${t.ensureClass}">`)
        : openTag.replace(/class\s*=\s*"([^"]*)"/i, (m0, c) => `class="${(c + ' ' + t.ensureClass).trim()}"`);
    }
    html = html.slice(0, el.start) + openTag + block + html.slice(el.closeStart);
    containers++;
  }
  report.push({ f, containers: edits.length, errors: errors.length });
  await page.close();

  const out = crlf ? html.replace(/\n/g, '\r\n') : html;
  if (out !== src) {
    changedPages++;
    if (!DRY) fs.writeFileSync(path.join(ROOT, f), out);
  }
}
await browser.close();

for (const r of report) {
  if (r.containers || r.errors) console.log(`${r.f.padEnd(58)} ${String(r.containers).padStart(2)} container(s)${r.errors ? `, ${r.errors} page error(s)` : ''}`);
}
console.log(`${DRY ? 'would change' : 'changed'} ${changedPages} page(s); ${containers} container(s) prerendered`);
