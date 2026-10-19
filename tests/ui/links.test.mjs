#!/usr/bin/env node
/**
 * UI test: click every link on every page and check it works.
 *
 * Each published page is opened in Chrome (the local repository served as https://www.bwstays.com,
 * so absolute links work, with GitHub Pages' case-sensitive paths). After the page scripts have built
 * their lists, every <a href> is clicked:
 *   - a link to another page must start a navigation (or open a tab) to exactly its href, and that
 *     page must exist; a #fragment on it must exist on that page once it is rendered;
 *   - a #link on the same page must point at an element that exists;
 *   - "#" / javascript: links (menus, toggles) must not throw an error when clicked;
 *   - mailto:, tel: and WhatsApp links must carry a real-looking address or number.
 * Images, scripts, styles and icons the page loads must exist, and redirect pages must point at a page
 * that exists. With --external every outside link is also requested (servers that refuse automated
 * requests, e.g. 403/429, are reported as "could not verify", not as broken).
 *
 *   node tests/ui/links.test.mjs                    # all pages, site links only
 *   node tests/ui/links.test.mjs --external         # + check outside links over the network
 *   node tests/ui/links.test.mjs --page index.html,footer.html
 *
 * Needs playwright-core and Chrome (see tests/ui/README.md). Writes tests/ui/results/links-report.md
 * and links-report.json. Exit code 1 when anything is broken.
 */
import fs from 'node:fs';
import path from 'node:path';
import { renderReport } from './lib/report-html.mjs';
import { ROOT, SITE, deployedFiles, isSiteUrl, fileFor, pageKey, launchChrome, serveSite, pool } from './lib/site.mjs';

const argv = process.argv.slice(2);
const opt = (name) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
const EXTERNAL = argv.includes('--external');
const CONCURRENCY = Number(opt('--concurrency') || 4);
const ONLY = opt('--page')?.split(',').map((s) => s.trim()).filter(Boolean);
const OUT_DIR = path.join(ROOT, 'tests', 'ui', 'results');

const files = deployedFiles();
// search-engine ownership files and tool folders are not pages of the site
const NOT_PAGES = /^(google[0-9a-f]+|yandex_[0-9a-f]+)\.html$|^(apps-script|scripts|docs|setup|vendor|tests|node_modules)\//;
const pages = (ONLY ?? [...files].filter((f) => f.endsWith('.html') && !NOT_PAGES.test(f)).sort());
for (const p of pages) if (!files.has(p)) { console.error(`not a published file: ${p}`); process.exit(2); }

const failures = []; // {page, what, detail}
const warnings = [];
const fail = (page, what, detail) => failures.push({ page, what, detail });
const warn = (page, what, detail) => warnings.push({ page, what, detail });
const anchorsByFile = new Map(); // file -> Set of ids/names once rendered
const internalTargets = new Map(); // page key -> [{page, text, href, hash}]
const externalLinks = new Map(); // url -> [{page, text}]
const stats = { pages: 0, links: 0, clicked: 0, redirects: 0 };
const pageRows = []; // one row per page for the HTML report

const label = (l) => (l.text || l.aria || l.title || l.img || '(no text)').replace(/\s+/g, ' ').trim().slice(0, 60);
const isPlaceholderNumber = (digits) => /(\d)\1{6,}/.test(digits) || /^0+$/.test(digits);

function checkContactLink(page, l) {
  const href = l.href.trim();
  if (/^mailto:/i.test(href)) {
    const addr = decodeURIComponent(href.slice(7).split('?')[0]);
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(addr)) fail(page, 'email link without a valid address', `"${label(l)}" -> ${href}`);
    return;
  }
  if (/^(tel|sms):/i.test(href)) {
    const digits = href.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) fail(page, 'phone link without a valid number', `"${label(l)}" -> ${href}`);
    else if (isPlaceholderNumber(digits)) warn(page, 'phone link with a placeholder number', `"${label(l)}" -> ${href}`);
  }
}

function checkWhatsApp(page, l) {
  let u;
  try { u = new URL(l.abs); } catch { return false; }
  if (!/(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(u.hostname)) return false;
  const digits = (u.hostname.endsWith('wa.me') ? u.pathname : (u.searchParams.get('phone') || '')).replace(/\D/g, '');
  if (!digits) warn(page, 'WhatsApp link without a number', `"${label(l)}" -> ${l.abs}`);
  else if (isPlaceholderNumber(digits)) warn(page, 'WhatsApp link with a placeholder number', `"${label(l)}" -> ${l.abs}`);
  return true;
}

// ---------------------------------------------------------------- redirect pages (no browser needed)
function redirectTarget(file) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const m = html.match(/<meta[^>]+http-equiv=["']refresh["'][^>]*content=["']\s*\d+\s*;\s*url=([^"']+)["']/i);
  return m ? new URL(m[1].trim(), `${SITE}/${file}`).href : null;
}

// ---------------------------------------------------------------- browser
const browser = await launchChrome();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
const states = new Map(); // page -> {file, clicking, captured, wake}
const popupOwner = new Map(); // new tab -> state of the page whose link opened it
const ownPages = new WeakSet(); // tabs the test opened itself; any other tab is a clicked link and is closed
context.on('page', (p) => setTimeout(() => { if (!ownPages.has(p)) p.close().catch(() => {}); }, 3000));
const newPage = async () => { const p = await context.newPage(); ownPages.add(p); return p; };
await serveSite(context, files, {
  onBlocked: (req) => {
    if (req.resourceType() !== 'script') return;
    let p; try { p = req.frame().page(); } catch { return; }
    const st = states.get(p);
    if (st) st.blockedScripts.add(new URL(req.url()).hostname);
  },
  onSiteMissing: (url, req) => {
    let p; try { p = req.frame().page(); } catch { return; }
    const st = states.get(p);
    if (st && !st.clicking && !(req.isNavigationRequest() && req.frame() === p.mainFrame())) fail(st.file, 'broken resource (404)', `${req.resourceType()} ${url}`);
  },
  intercept: async (req, route) => {
    if (!req.isNavigationRequest()) return false;
    let p; try { p = req.frame().page(); } catch {
      // the first request of a new tab has no frame yet: it belongs to the page clicking that link
      const bare = req.url().replace(/#.*$/, '');
      const clicking = [...states.values()].filter((s) => s.clicking);
      const st = clicking.find((s) => s.expect === bare && !s.captured) ?? (clicking.length === 1 ? clicking[0] : null);
      if (!st) return false;
      st.captured = { url: req.url(), popup: true };
      await route.abort('aborted');
      st.wake?.();
      return true;
    }
    let st = states.get(p), popup = false;
    if (!st) {
      // a new tab: rel="noopener" hides its opener, so the 'popup' event of the clicked page names it
      popup = true;
      for (let w = 0; w < 40 && !(st = popupOwner.get(p)); w++) await new Promise((r) => setTimeout(r, 25));
      if (!st) { const op = await p.opener().catch(() => null); st = op && states.get(op); }
    }
    if (!st || !st.clicking || req.frame() !== p.mainFrame()) return false;
    st.captured = { url: req.url(), popup };
    await route.abort('aborted');
    if (popup) p.close().catch(() => {});
    st.wake?.();
    return true;
  },
});

async function testPage(file) {
  const target = redirectTarget(file);
  const row = { file, kind: target ? 'redirect' : 'page', title: '', links: 0, clicked: 0, resources: 0, ms: 0 };
  pageRows.push(row);
  const started = Date.now();
  if (target) {
    row.target = target;
    stats.redirects++;
    if (!isSiteUrl(target)) warn(file, 'redirects off the site', target);
    else if (!fileFor(target, files)) fail(file, 'redirect target does not exist', target);
    else addInternal(file, { text: 'meta refresh', abs: target });
    return;
  }
  const page = await newPage();
  const st = { file, row, clicking: false, captured: null, wake: null, blockedScripts: new Set() };
  states.set(page, st);
  page.on('popup', (p) => { popupOwner.set(p, st); p.once('close', () => popupOwner.delete(p)); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  try {
    const resp = await page.goto(`${SITE}/${file}`, { waitUntil: 'load', timeout: 45000 });
    if (!resp || resp.status() !== 200) { fail(file, 'page does not load', `status ${resp?.status()}`); return; }
    await page.waitForTimeout(1200); // page scripts build the lists after load
    stats.pages++;
    row.title = await page.title().catch(() => '');

    // resources the page references (lazy images included, which a load alone would not request)
    const res = await page.evaluate(() => {
      const out = [];
      const add = (kind, u) => { if (u && !u.startsWith('data:') && !u.startsWith('blob:')) out.push([kind, u]); };
      document.querySelectorAll('img[src],script[src],iframe[src],video[src],audio[src],source[src],track[src]').forEach((e) => add(e.tagName.toLowerCase(), e.src));
      document.querySelectorAll('img[srcset],source[srcset]').forEach((e) => e.srcset.split(',').forEach((s) => { const u = s.trim().split(/\s+/)[0]; if (u) add('srcset', new URL(u, location.href).href); }));
      document.querySelectorAll('link[href]').forEach((e) => { if (/stylesheet|icon|manifest|preload|apple-touch-icon|canonical|alternate/i.test(e.rel)) add(`link ${e.rel}`, e.href); });
      // the page's own address as given to search engines and social previews
      document.querySelectorAll('meta[property="og:url"],meta[property="og:image"],meta[name="twitter:image"]').forEach((e) => add(e.getAttribute('property') || e.getAttribute('name'), e.content));
      document.querySelectorAll('[data-src]').forEach((e) => add('data-src', new URL(e.getAttribute('data-src'), location.href).href));
      return out;
    });
    const seenRes = new Set();
    for (const [kind, u] of res) {
      if (seenRes.has(u) || !isSiteUrl(u)) continue;
      seenRes.add(u);
      row.resources++;
      if (!fileFor(u, files)) fail(file, 'broken resource (404)', `${kind} ${u}`);
    }

    // anchors that links from other pages can jump to
    anchorsByFile.set(file, new Set(await page.evaluate(() => [...document.querySelectorAll('[id],a[name]')].map((e) => e.id || e.getAttribute('name')))));

    const links = await page.evaluate(listLinks);
    stats.links += links.length;
    row.links = links.length;
    row.clicks = [];
    const mine = () => failures.reduce((n, x) => n + (x.page === file), 0);

    for (const l of links) {
      const rec = { cat: l.cat, text: label(l), href: l.abs || l.href, how: 'script', ok: true };
      row.clicks.push(rec);
      l.rec = rec;
      const before = mine();
      await checkLink(page, st, l, errors);
      if (mine() > before) { rec.ok = false; rec.note = failures.filter((x) => x.page === file).slice(before - mine()).map((x) => x.what).join('; '); }
    }

    // what a visitor does: real mouse clicks on the menu, Know More buttons and nearby-place cards
    // (scrolled into view; fails when the link is hidden or covered by something else)
    for (const l of links.filter((x) => REAL_CLICK.has(x.cat) && !x.decorative)) {
      const rec = { cat: l.cat, text: label(l), href: l.abs || l.href, how: 'mouse', ok: true };
      row.clicks.push(rec);
      const before = mine();
      await click(page, st, l, errors, kindOf(page, l), 'mouse');
      if (mine() > before) { rec.ok = false; rec.note = failures.filter((x) => x.page === file).slice(before - mine()).map((x) => x.what).join('; '); }
    }
    for (const e of [...new Set(errors)]) {
      if (st.blockedScripts.size) warn(file, 'JavaScript error, possibly because outside scripts are blocked in the test', `${e} (blocked: ${[...st.blockedScripts].join(', ')})`);
      else fail(file, 'JavaScript error on the page', e);
    }
    errors.length = 0;

    // the menu on a phone: open it with the menu button, then tap each item
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SITE}/${file}`, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(800);
    const phoneLinks = (await page.evaluate(listLinks)).filter((x) => x.cat === 'menu' && !x.decorative);
    for (const l of phoneLinks) {
      const rec = { cat: 'menu', text: label(l), href: l.abs || l.href, how: 'phone', ok: true };
      row.clicks.push(rec);
      const before = mine();
      await click(page, st, l, errors, kindOf(page, l), 'phone');
      if (mine() > before) { rec.ok = false; rec.note = failures.filter((x) => x.page === file).slice(before - mine()).map((x) => x.what).join('; '); }
    }
  } catch (e) {
    fail(file, 'test could not run on the page', e.message.split('\n')[0]);
  } finally {
    row.ms = Date.now() - started;
    states.delete(page);
    await page.close().catch(() => {});
  }
}

const REAL_CLICK = new Set(['menu', 'knowmore', 'nearby']);

/** Every link of the page, numbered (data-uitest) and sorted into the part of the page it is in. */
function listLinks() {
  return [...document.querySelectorAll('a[href]')].map((a, i) => {
    a.setAttribute('data-uitest', String(i));
    const href = a.getAttribute('href') || '';
    const text = (a.innerText || '').replace(/\s+/g, ' ').trim();
    const cat = a.closest('#mainNav') ? 'menu'
      : a.closest('#nearby-cards, #nearby-places') ? 'nearby'
      : (a.getAttribute('data-i18n') === 'nav.km' || /^(know more|view attractions|attractions)$/i.test(text)) ? 'knowmore'
      : a.closest('footer') ? 'footer'
      : a.closest('#testimonial, #signup') ? 'contact'
      : href.startsWith('#') ? 'in-page'
      : 'content';
    // an image link beside a card's title link, hidden from screen readers and keyboard: the title link covers it
    const decorative = a.getAttribute('aria-hidden') === 'true' || a.getAttribute('tabindex') === '-1';
    return { i, cat, decorative, href, abs: a.href, target: a.target, text, aria: a.getAttribute('aria-label') || '', title: a.title || '', img: a.querySelector('img')?.alt || '' };
  });
}

/** 'navigate' for a link to another page, 'hash' for a #section on this page, 'action' for # / javascript:. */
function kindOf(page, l) {
  const href = l.href.trim();
  if (/^javascript:/i.test(href) || href === '#' || href === '') return 'action';
  if (href.startsWith('#') || (isSiteUrl(l.abs) && pageKey(l.abs) === pageKey(page.url()) && new URL(l.abs).hash)) return 'hash';
  return 'navigate';
}

/** All checks for one link (script click). */
async function checkLink(page, st, l, errors) {
  const file = st.file;
  {
    {
      const href = l.href.trim();
      if (/^(mailto|tel|sms):/i.test(href)) { checkContactLink(file, l); return; }
      if (/^javascript:/i.test(href) || href === '#' || href === '') { await click(page, st, l, errors, 'action'); return; }
      if (/^data:/i.test(href)) { warn(file, 'data: link', label(l)); return; }
      const sameDoc = href.startsWith('#') || (isSiteUrl(l.abs) && pageKey(l.abs) === pageKey(page.url()) && new URL(l.abs).hash);
      if (sameDoc) {
        const hash = decodeURIComponent(new URL(l.abs).hash.slice(1));
        const exists = await page.evaluate((h) => !!(document.getElementById(h) || document.getElementsByName(h)[0]) || h === 'top', hash);
        if (exists) { await click(page, st, l, errors, 'hash'); return; }
        // not an id: the page script may map it (footer.html#tc -> #section-tc); it must scroll somewhere
        // instant reset (the site scrolls smoothly), then give the smooth scroll up to 3 s on a slow machine
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await page.waitForFunction(() => window.scrollY === 0, null, { timeout: 3000 }).catch(() => {});
        await click(page, st, l, errors, 'hash');
        const moved = await page.waitForFunction(() => window.scrollY > 50, null, { timeout: 3000, polling: 100 }).then(() => true, () => false);
        if (!moved) fail(file, 'link to a missing section on the same page', `"${label(l)}" -> #${hash}`);
        return;
      }
      if (!/^https?:/i.test(l.abs)) { warn(file, 'link with an unusual scheme', `"${label(l)}" -> ${href}`); return; }
      await click(page, st, l, errors, 'navigate');
      if (isSiteUrl(l.abs)) addInternal(file, l);
      else if (!checkWhatsApp(file, l)) { if (!externalLinks.has(l.abs)) externalLinks.set(l.abs, []); externalLinks.get(l.abs).push({ page: file, text: label(l) }); }
    }
  }
}

/** Wait until the page stops scrolling (the site scrolls smoothly to #sections). */
async function waitScrollIdle(page) {
  let last = -1;
  for (let i = 0; i < 30; i++) {
    const y = await page.evaluate(() => window.scrollY).catch(() => 0);
    if (y === last) return;
    last = y;
    await page.waitForTimeout(120);
  }
}

/** Open the phone menu (menu button) if it is closed; the menu items are hidden until then. */
async function openPhoneMenu(page) {
  const open = await page.evaluate(() => document.getElementById('navbarResponsive')?.classList.contains('show') ?? true);
  if (open) return;
  // the "Menu" button (data-toggle=collapse); the decorative .menuBtn bars beside it do nothing
  const btn = page.locator('#mainNav [data-toggle="collapse"]:visible').first();
  await btn.click({ timeout: 3000 }).catch(() => {});
  await page.waitForFunction(() => document.getElementById('navbarResponsive')?.classList.contains('show') && !document.querySelector('#navbarResponsive.collapsing'), null, { timeout: 3000 }).catch(() => {});
}

/** Click one link: 'script' (every link, also hidden menu links), 'mouse' (a visitor's click) or 'phone' (menu at phone size). */
async function click(page, st, l, errors, kind, how = 'script') {
  const nErr = errors.length;
  if (how === 'phone') await openPhoneMenu(page);
  st.captured = null;
  st.expect = l.abs.replace(/#.*$/, '');
  st.clicking = true;
  const woke = new Promise((r) => { st.wake = r; });
  let before;
  if (how === 'script') {
    try {
      before = await page.evaluate((i) => {
        const a = document.querySelector(`[data-uitest="${i}"]`);
        if (!a) return null;
        const b = { href: location.href };
        a.click();
        return b;
      }, l.i);
    } catch (e) {
      // a click that navigated the page itself before evaluate returned
      before = { href: '' };
    }
  } else {
    // a real mouse click (or tap) in the middle of the link, as a visitor does: Playwright scrolls it into
    // view and refuses when it is hidden, has no size or another element would receive the click
    before = { href: page.url() };
    const tryClick = async () => { await waitScrollIdle(page); await page.locator(`[data-uitest="${l.i}"]`).click({ timeout: 5000, noWaitAfter: true }); };
    try {
      // once more after the page has stopped moving (smooth scrolling from the previous click)
      await tryClick().catch(async (e) => {
        if (/ERR_ABORTED|net::/.test(e.message)) throw e;
        // cards lift on hover: move the mouse off them so the target stays still, then try again
        await page.mouse.move(0, 0).catch(() => {});
        if (how === 'phone') await openPhoneMenu(page);
        await tryClick();
      });
    } catch (e) {
      const msg = e.message.split('\n').find((x) => /intercepts|not visible|outside of the viewport|not stable|detached|Timeout/i.test(x)) || e.message.split('\n')[0];
      if (!/ERR_ABORTED|net::/.test(e.message)) {
        st.clicking = false;
        st.wake = null;
        stats.clicked++;
        st.row.clicked++;
        fail(st.file, how === 'phone' ? 'menu item cannot be tapped on a phone' : 'link cannot be clicked with the mouse (hidden or covered)', `[${l.cat}] "${label(l)}" -> ${l.href}: ${msg.trim().slice(0, 160)}`);
        return;
      }
    }
  }
  stats.clicked++;
  st.row.clicked++;
  if (before === null) { st.clicking = false; warn(st.file, 'link disappeared before it could be clicked', `"${label(l)}" -> ${l.href}`); return; }
  if (kind === 'navigate') await Promise.race([woke, page.waitForTimeout(2500)]);
  else await page.waitForTimeout(how === 'script' ? 60 : 400);
  st.clicking = false;
  st.wake = null;
  if (errors.length > nErr) fail(st.file, 'clicking the link throws an error', `"${label(l)}" -> ${l.href}: ${errors.slice(nErr).join('; ')}`);
  errors.length = nErr; // do not report the same error again as a page error
  if (kind !== 'navigate') {
    // a toggle may have moved to another page by script: that page must exist
    if (st.captured && isSiteUrl(st.captured.url) && !fileFor(st.captured.url, files)) fail(st.file, 'clicking leads to a missing page', `"${label(l)}" -> ${st.captured.url}`);
    return;
  }
  const now = await page.evaluate(() => location.href).catch(() => '');
  const got = st.captured?.url ?? (now !== before.href ? now : null);
  if (!got) { fail(st.file, 'clicking the link does nothing', `"${label(l)}" -> ${l.abs}`); return; }
  // a request never carries the #fragment; the fragment itself is checked against the target page
  const norm = (u) => (st.captured ? u.replace(/#.*$/, '') : u.replace(/#$/, ''));
  if (norm(got) !== norm(l.abs)) {
    // the page script took the visitor somewhere else than the href says
    if (isSiteUrl(got) && !fileFor(got, files)) fail(st.file, 'clicking leads to a missing page', `"${label(l)}" href ${l.abs}, opened ${got}`);
    else warn(st.file, 'click opens a different address than the link shows', `"${label(l)}" href ${l.abs}, opened ${got}`);
  }
  // a click that changed the page (same-document) is undone so the next links start from the same page
  if (!st.captured && now !== before.href) await page.goto(before.href, { waitUntil: 'load' }).then(() => page.waitForTimeout(800)).then(() => page.evaluate(() => [...document.querySelectorAll('a[href]')].forEach((a, i) => a.setAttribute('data-uitest', String(i))))).catch(() => {});
}

/** A problem found after the click (target page, #section): the link's record and its mouse/phone clicks are not ok. */
function markBad(r, note) {
  const row = pageRows.find((x) => x.file === r.page);
  for (const c of row?.clicks ?? []) if (c.href === r.href) { c.ok = false; c.note = c.note ? `${c.note}; ${note}` : note; }
}

function addInternal(page, l) {
  const key = pageKey(l.abs);
  if (!internalTargets.has(key)) internalTargets.set(key, []);
  internalTargets.get(key).push({ page, text: label(l), href: l.abs, hash: decodeURIComponent(new URL(l.abs).hash.slice(1)), rec: l.rec });
}

const t0 = Date.now();
const startedAt = new Date().toISOString();
const chromeVersion = browser.version();
await pool(pages, CONCURRENCY, async (f, i) => {
  await testPage(f);
  if ((i + 1) % 10 === 0) console.log(`  ${i + 1}/${pages.length} pages`);
});

// ---------------------------------------------------------------- targets of site links
const toRender = [];
for (const [key, refs] of internalTargets) {
  const f = fileFor(key, files);
  if (!f) { for (const r of refs) { fail(r.page, 'link to a page that does not exist (404)', `"${r.text}" -> ${r.href}`); markBad(r, 'page does not exist (404)'); } continue; }
  if (f.endsWith('.html') && refs.some((r) => r.hash) && !anchorsByFile.has(f)) toRender.push(f);
}
// pages linked with a #section that this run did not open (e.g. --page): render them for their anchors
await pool([...new Set(toRender)], CONCURRENCY, async (f) => {
  const target = redirectTarget(f);
  if (target) { anchorsByFile.set(f, null); return; }
  const page = await newPage();
  try {
    await page.goto(`${SITE}/${f}`, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1200);
    anchorsByFile.set(f, new Set(await page.evaluate(() => [...document.querySelectorAll('[id],a[name]')].map((e) => e.id || e.getAttribute('name')))));
  } catch { /* reported below as unknown */ } finally { await page.close().catch(() => {}); }
});
// a #name that is not an id may be mapped by the page script (footer.html#tc -> #section-tc):
// open the link itself and accept it when the page scrolls to an element that exists
const aliasChecks = new Map(); // "file#hash" -> Promise<boolean>
async function hashWorks(f, hash) {
  const page = await newPage();
  try {
    await page.goto(`${SITE}/${f}#${encodeURIComponent(hash)}`, { waitUntil: 'load', timeout: 45000 });
    return await page.waitForFunction(() => window.scrollY > 50, null, { timeout: 5000, polling: 100 }).then(() => true, () => false);
  } catch { return false; } finally { await page.close().catch(() => {}); }
}
const pending = [];
for (const [key, refs] of internalTargets) {
  const f = fileFor(key, files);
  if (!f || !f.endsWith('.html')) continue;
  const anchors = anchorsByFile.get(f);
  for (const r of refs) {
    if (!r.hash || r.hash === 'top') continue;
    if (anchors === null) warn(r.page, 'link with #section to a redirect page', `"${r.text}" -> ${r.href}`);
    else if (!anchors) warn(r.page, 'could not open the linked page to check its #section', `"${r.text}" -> ${r.href}`);
    else if (!anchors.has(r.hash)) {
      const k = `${f}#${r.hash}`;
      if (!aliasChecks.has(k)) aliasChecks.set(k, null);
      pending.push([k, r]);
    }
  }
}
await pool([...aliasChecks.keys()], CONCURRENCY, async (k) => { const [f, h] = [k.slice(0, k.indexOf('#')), k.slice(k.indexOf('#') + 1)]; aliasChecks.set(k, await hashWorks(f, h)); });
for (const [k, r] of pending) if (!aliasChecks.get(k)) { fail(r.page, 'link to a missing section on another page', `"${r.text}" -> ${r.href}`); markBad(r, 'section missing on the target page'); }
await browser.close();

// ---------------------------------------------------------------- outside links (optional)
const externalResults = [];
if (EXTERNAL) {
  console.log(`checking ${externalLinks.size} outside links ...`);
  await pool([...externalLinks.keys()], 8, async (url) => {
    const r = await probe(url);
    externalResults.push({ url, ...r, refs: externalLinks.get(url) });
    const where = externalLinks.get(url);
    const first = `${where[0].page} "${where[0].text}"${where.length > 1 ? ` (+${where.length - 1} more)` : ''}`;
    if (r.verdict === 'broken') fail(where[0].page, 'outside link is broken', `${url} -> ${r.detail}; linked from ${first}`);
    else if (r.verdict === 'unverified') warn(where[0].page, 'outside link could not be verified', `${url} -> ${r.detail}; linked from ${first}`);
  });
}

// these sites send log-in pages, 400 or 999 to scripts while working in a browser
const SOCIAL = /(^|\.)(facebook|linkedin|instagram|x|twitter|youtube|tiktok|pinterest)\.com$/;

async function probe(url) {
  const headers = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36', accept: 'text/html,application/xhtml+xml,*/*;q=0.8' };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow', headers, signal: AbortSignal.timeout(20000) });
      res.body?.cancel().catch(() => {});
      if (res.status >= 400 && SOCIAL.test(new URL(url).hostname)) return { verdict: 'unverified', detail: `HTTP ${res.status} (social sites answer scripts differently from browsers)` };
      if (res.status < 400) return { verdict: 'ok', detail: `${res.status}${res.url !== url ? ` via ${res.url}` : ''}` };
      if ([401, 403, 405, 406, 429, 451, 999].includes(res.status) || res.status >= 500 && attempt === 0) { if (res.status >= 500) continue; return { verdict: 'unverified', detail: `HTTP ${res.status} (refuses automated requests)` }; }
      return { verdict: 'broken', detail: `HTTP ${res.status}` };
    } catch (e) {
      if (attempt === 0) continue;
      const msg = e.cause?.code || e.name || e.message;
      return /ENOTFOUND|ERR_INVALID_URL|ECONNREFUSED/.test(msg) ? { verdict: 'broken', detail: msg } : { verdict: 'unverified', detail: msg };
    }
  }
  return { verdict: 'broken', detail: 'HTTP 5xx twice' };
}

// ---------------------------------------------------------------- report
const group = (list) => { const m = new Map(); for (const x of list) { if (!m.has(x.what)) m.set(x.what, []); m.get(x.what).push(x); } return m; };
const lines = [
  '# Link test report', '',
  `Run: ${new Date().toISOString()}  ·  ${((Date.now() - t0) / 1000).toFixed(0)} s`, '',
  `Pages opened: ${stats.pages} (+${stats.redirects} redirect pages)  ·  links found: ${stats.links}  ·  clicks: ${stats.clicked}  ·  site pages linked: ${internalTargets.size}  ·  outside links: ${externalLinks.size}${EXTERNAL ? ' (checked)' : ' (not checked, use --external)'}`, '',
  `**Broken: ${failures.length}**  ·  To look at: ${warnings.length}`, '',
];
for (const [title, list] of [['Broken', failures], ['To look at', warnings]]) {
  if (!list.length) continue;
  lines.push(`## ${title}`, '');
  for (const [what, items] of group(list)) {
    lines.push(`### ${what} (${items.length})`, '');
    for (const x of items) lines.push(`- ${x.page}: ${x.detail}`);
    lines.push('');
  }
}
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'links-report.md'), lines.join('\n'));
const report = {
  run: {
    started: startedAt, finished: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000),
    command: `node tests/ui/links.test.mjs ${argv.join(' ')}`.trim(), external: EXTERNAL, concurrency: CONCURRENCY, only: ONLY ?? null,
    node: process.version, chrome: chromeVersion, platform: `${process.platform} ${process.arch}`,
  },
  stats: { ...stats, siteTargets: internalTargets.size, outsideLinks: externalLinks.size, outsideChecked: EXTERNAL },
  pages: pageRows.sort((a, b) => a.file.localeCompare(b.file)),
  failures, warnings, external: externalResults,
};
fs.writeFileSync(path.join(OUT_DIR, 'links-report.json'), JSON.stringify(report, null, 1));
fs.writeFileSync(path.join(OUT_DIR, 'links-report.html'), renderReport(report));

console.log(`pages ${stats.pages} (+${stats.redirects} redirects), links ${stats.links}, clicks ${stats.clicked}, outside links ${externalLinks.size}${EXTERNAL ? ' checked' : ''}`);
for (const [what, items] of group(failures)) {
  console.log(`BROKEN ${what}: ${items.length}`);
  for (const x of items.slice(0, 8)) console.log(`   ${x.page}: ${x.detail}`);
  if (items.length > 8) console.log(`   ... ${items.length - 8} more in tests/ui/results/links-report.md`);
}
for (const [what, items] of group(warnings)) console.log(`look at: ${what}: ${items.length}`);
console.log(failures.length ? `FAIL: ${failures.length} broken (report: tests/ui/results/links-report.html)` : 'PASS: no broken links (report: tests/ui/results/links-report.html)');
process.exit(failures.length ? 1 : 0);
