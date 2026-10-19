#!/usr/bin/env node
/**
 * Browser and screen-size test: the site in Chrome, Edge, Firefox and Safari's engine (WebKit),
 * on a phone (390 px), a tablet (820 px) and a desktop (1366 px).
 *
 * Every page/browser/size combination is opened (the local repository served as https://www.bwstays.com,
 * as in links.test.mjs) and checked:
 *   broken   - the page does not load; it scrolls sideways (wider than the screen); an image of the site
 *              fails to load; an uncaught JavaScript error; on a phone the Menu button does not open the menu
 *   look at  - text smaller than 11 px; on a phone, links and buttons smaller than 24 x 24 px (WCAG 2.2
 *              target size), JavaScript errors that may come from outside scripts blocked in the test
 * A screenshot of the top of every combination is saved for a visual check.
 *
 *   node tests/ui/compat.test.mjs                       # one page of each kind (about 22 pages), all browsers and sizes
 *   node tests/ui/compat.test.mjs --all                 # every page
 *   node tests/ui/compat.test.mjs --browsers chrome,firefox --sizes phone --page index.html
 *
 * Firefox and WebKit are Playwright's builds: install once with  npx playwright-core install firefox webkit
 * Chrome and Edge are the installed browsers. WebKit is the engine of Safari, not Safari itself.
 * Writes tests/ui/results/compat-report.html (+ .json, screenshots in results/compat/). Exit 1 when broken.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SITE, deployedFiles, serveSite, pool } from './lib/site.mjs';
import { renderCompatReport } from './lib/compat-html.mjs';

const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const ALL = argv.includes('--all');
const CONCURRENCY = Number(opt('--concurrency') || 3);
const OUT = path.join(ROOT, 'tests', 'ui', 'results');
const SHOTS = path.join(OUT, 'compat');

const SIZES = {
  phone: { viewport: { width: 390, height: 844 }, mobile: true },
  tablet: { viewport: { width: 820, height: 1180 }, mobile: true },
  desktop: { viewport: { width: 1366, height: 900 }, mobile: false },
};
const BROWSERS = {
  chrome: { engine: 'chromium', paths: [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'], channel: 'chrome' },
  edge: { engine: 'chromium', paths: [process.env.EDGE_PATH, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', '/usr/bin/microsoft-edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'], channel: 'msedge' },
  firefox: { engine: 'firefox' },
  safari: { engine: 'webkit' },
};
const browsers = (opt('--browsers') ?? Object.keys(BROWSERS).join(',')).split(',').map((s) => s.trim()).filter(Boolean);
const sizes = (opt('--sizes') ?? Object.keys(SIZES).join(',')).split(',').map((s) => s.trim()).filter(Boolean);
for (const b of browsers) if (!BROWSERS[b]) { console.error(`unknown browser ${b} (${Object.keys(BROWSERS).join(', ')})`); process.exit(2); }
for (const s of sizes) if (!SIZES[s]) { console.error(`unknown size ${s} (${Object.keys(SIZES).join(', ')})`); process.exit(2); }

const files = deployedFiles();
const NOT_PAGES = /^(google[0-9a-f]+|yandex_[0-9a-f]+)\.html$|^(apps-script|scripts|docs|setup|vendor|tests|node_modules)\//;
const isRedirect = (f) => /http-equiv=["']refresh["']/i.test(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const allPages = [...files].filter((f) => f.endsWith('.html') && !NOT_PAGES.test(f) && !isRedirect(f)).sort();

/** One page of each kind: the fixed pages plus the first place page of every category. */
function samplePages() {
  const fixed = ['index.html', 'bwstays-booking.html', 'footer.html', 'search.html', 'all-locations-wayanad.html', 'all-fooding-wayanad.html', 'bw-one-day-trails-kalpetta-wayanad.html', 'bw-restaurants-food-wayanad.html', '404.html', 'offline.html'];
  const siteData = new Function(`${fs.readFileSync(path.join(ROOT, 'data/sitedata.js'), 'utf8')}; return siteData;`)();
  const picks = [];
  for (const [cat, rows] of Object.entries(siteData)) {
    if (cat === 'stays') continue;
    const r = rows.find((x) => String(x.knowmore ?? '').startsWith(`${SITE}/`) && allPages.includes(x.knowmore.slice(SITE.length + 1)));
    if (r) picks.push(r.knowmore.slice(SITE.length + 1));
  }
  return [...new Set([...fixed.filter((f) => allPages.includes(f)), ...picks])];
}
const pages = opt('--page') ? opt('--page').split(',').map((s) => s.trim()) : ALL ? allPages : samplePages();

let pw;
try { pw = await import(process.env.PLAYWRIGHT_CORE ? pathToFileURL(process.env.PLAYWRIGHT_CORE).href : 'playwright-core'); }
catch { console.error(`playwright-core is not installed in ${ROOT}: run  npm install  there`); process.exit(2); }
pw = pw.chromium ? pw : pw.default;

async function launch(name) {
  const b = BROWSERS[name];
  if (b.engine === 'chromium') {
    const exe = b.paths.filter(Boolean).find((p) => fs.existsSync(p));
    return pw.chromium.launch(exe ? { executablePath: exe } : { channel: b.channel });
  }
  return pw[b.engine].launch();
}

const results = []; // {page, browser, size, status, problems:[{level, what, detail}], shot, ms}
fs.mkdirSync(SHOTS, { recursive: true });
for (const f of fs.readdirSync(SHOTS)) fs.rmSync(path.join(SHOTS, f));
const t0 = Date.now();
const versions = {};
const skipped = [];

for (const bname of browsers) {
  let browser;
  try { browser = await launch(bname); } catch (e) {
    skipped.push({ browser: bname, reason: e.message.split('\n')[0] });
    console.log(`${bname}: not available (${e.message.split('\n')[0].slice(0, 120)})`);
    continue;
  }
  versions[bname] = browser.version();
  for (const sname of sizes) {
    const size = SIZES[sname];
    const engine = BROWSERS[bname].engine;
    const context = await browser.newContext({
      viewport: size.viewport,
      ...(engine !== 'firefox' ? { isMobile: size.mobile, hasTouch: size.mobile } : { hasTouch: size.mobile }),
      deviceScaleFactor: 1,
      serviceWorkers: 'block',
    });
    const blocked = new WeakMap();
    await serveSite(context, files, {
      onBlocked: (req) => { if (req.resourceType() !== 'script') return; try { const p = req.frame().page(); blocked.set(p, true); } catch { /* worker */ } },
    });
    await pool(pages, CONCURRENCY, async (file) => {
      const r = { page: file, browser: bname, size: sname, status: 'ok', problems: [], shot: null, ms: 0 };
      results.push(r);
      const started = Date.now();
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]));
      const problem = (level, what, detail = '') => r.problems.push({ level, what, detail });
      try {
        const resp = await page.goto(`${SITE}/${file}`, { waitUntil: 'load', timeout: 60000 });
        if (!resp || resp.status() !== 200) { problem('broken', 'page does not load', `status ${resp?.status()}`); return; }
        await page.waitForTimeout(1200);
        const m = await page.evaluate(measure, { phone: sname === 'phone' });
        if (m.overflow > 2) problem('broken', 'page scrolls sideways', `${m.overflow}px wider than the screen; widest: ${m.wide.join(' | ') || 'not found'}`);
        for (const img of m.badImages) problem('broken', 'image does not load', img);
        if (m.smallText.length) problem('look', 'text smaller than 11 px', `${m.smallText.length} element(s), e.g. ${m.smallText.slice(0, 3).join(' | ')}`);
        if (m.smallTargets.length) problem('look', 'tap target smaller than 24 x 24 px', `${m.smallTargets.length}, e.g. ${m.smallTargets.slice(0, 4).join(' | ')}`);
        if (sname === 'phone') {
          const btn = page.locator('#mainNav [data-toggle="collapse"]:visible').first();
          if (await btn.count()) {
            await btn.click({ timeout: 4000 }).catch(() => {});
            const opened = await page.waitForFunction(() => { const n = document.getElementById('navbarResponsive'); return n && n.classList.contains('show') && n.getBoundingClientRect().height > 40; }, null, { timeout: 4000 }).then(() => true, () => false);
            if (!opened) problem('broken', 'the Menu button does not open the menu');
            else {
              const clipped = await page.evaluate(() => [...document.querySelectorAll('#navbarResponsive a, #navbarResponsive select')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1); }).length);
              if (clipped) problem('broken', 'menu items stick out of the screen', `${clipped} item(s)`);
            }
            await page.evaluate(() => window.scrollTo(0, 0));
          }
        }
        for (const e of [...new Set(errors)]) problem(blocked.get(page) ? 'look' : 'broken', blocked.get(page) ? 'JavaScript error (outside scripts are blocked in the test)' : 'JavaScript error', e);
        const shot = `${bname}-${sname}-${file.replace(/[\\/]/g, '_').replace(/\.html$/, '')}.jpg`;
        await page.screenshot({ path: path.join(SHOTS, shot), type: 'jpeg', quality: 55 }).then(() => { r.shot = `compat/${shot}`; }).catch(() => {});
      } catch (e) {
        problem('broken', 'test could not run on the page', e.message.split('\n')[0]);
      } finally {
        r.ms = Date.now() - started;
        r.status = r.problems.some((p) => p.level === 'broken') ? 'broken' : r.problems.length ? 'look' : 'ok';
        await page.close().catch(() => {});
      }
    });
    await context.close();
    console.log(`  ${bname} ${sname}: ${pages.length} pages`);
  }
  await browser.close();
}

/** Runs in the page: sideways overflow, images, small text and tap targets. */
function measure({ phone }) {
  const W = document.documentElement.clientWidth;
  const overflow = document.documentElement.scrollWidth - W;
  const name = (e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const visible = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && b.width > 0 && b.height > 0; };
  const inScroller = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return true; } return false; };
  const wide = [];
  if (overflow > 2) {
    for (const e of document.body.querySelectorAll('*')) {
      const b = e.getBoundingClientRect();
      if (b.right > W + 2 && b.width > 0 && !inScroller(e) && getComputedStyle(e).position !== 'fixed') {
        if (![...wide].some((w) => w.el.contains(e))) wide.push({ el: e, txt: `${name(e)} (${Math.round(b.right - W)}px)` });
        if (wide.length >= 4) break;
      }
    }
  }
  const badImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc && /bwstays\.com/.test(i.currentSrc) && i.loading !== 'lazy').map((i) => i.currentSrc.replace(/^https:\/\/www\.bwstays\.com\//, ''));
  const smallText = [];
  for (const e of document.body.querySelectorAll('p, li, a, span, td, th, label, small, button, h1, h2, h3, h4, h5, h6, div')) {
    if (smallText.length > 40) break;
    const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own || !visible(e)) continue;
    const fs = parseFloat(getComputedStyle(e).fontSize);
    if (fs < 11) smallText.push(`${name(e)} ${fs}px "${e.textContent.trim().slice(0, 24)}"`);
  }
  const smallTargets = [];
  if (phone) {
    for (const e of document.querySelectorAll('a[href], button, select, input:not([type=hidden])')) {
      if (!visible(e) || e.closest('#navbarResponsive:not(.show)')) continue;
      // a decorative duplicate (an image link hidden from screen readers and keyboard, covered by the card's title link)
      if (e.getAttribute('aria-hidden') === 'true' && e.getAttribute('tabindex') === '-1') continue;
      const b = e.getBoundingClientRect();
      // a link inside a sentence is exempt (WCAG 2.5.8 inline exception)
      const inline = e.tagName === 'A' && getComputedStyle(e).display === 'inline' && e.parentElement && /^(P|LI|TD|SPAN|SMALL)$/.test(e.parentElement.tagName) && e.parentElement.textContent.trim().length > e.textContent.trim().length + 10;
      if (!inline && (b.width < 24 || b.height < 24)) smallTargets.push(`${name(e)} ${Math.round(b.width)}x${Math.round(b.height)} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}"`);
    }
  }
  return { overflow, wide: wide.map((w) => w.txt), badImages, smallText, smallTargets };
}

const report = {
  run: { started: new Date(t0).toISOString(), finished: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), command: `node tests/ui/compat.test.mjs ${argv.join(' ')}`.trim(), node: process.version, platform: `${process.platform} ${process.arch}`, versions, skipped },
  browsers, sizes, pages, results,
};
fs.writeFileSync(path.join(OUT, 'compat-report.json'), JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(OUT, 'compat-report.html'), renderCompatReport(report));
const broken = results.filter((r) => r.status === 'broken');
const look = results.filter((r) => r.status === 'look');
console.log(`combinations ${results.length} (pages ${pages.length} x browsers ${browsers.length - skipped.length} x sizes ${sizes.length}): ok ${results.length - broken.length - look.length}, look at ${look.length}, broken ${broken.length}`);
const byWhat = new Map();
for (const r of results) for (const p of r.problems) if (p.level === 'broken') { const k = p.what; byWhat.set(k, [...(byWhat.get(k) ?? []), `${r.browser}/${r.size} ${r.page}: ${p.detail}`]); }
for (const [k, v] of byWhat) { console.log(`BROKEN ${k}: ${v.length}`); for (const x of v.slice(0, 5)) console.log(`   ${x.slice(0, 220)}`); }
console.log(broken.length ? 'FAIL (report: tests/ui/results/compat-report.html)' : 'PASS (report: tests/ui/results/compat-report.html)');
process.exit(broken.length ? 1 : 0);
