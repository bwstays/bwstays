#!/usr/bin/env node
/**
 * Compare the site's timings, fees and contact numbers with DTPC Wayanad (www.dtpcwayanad.com,
 * the District Tourism Promotion Council), the official source for the places it runs.
 *
 *   node scripts/check-dtpc.mjs                 # fetch DTPC, compare, write data/dtpc-snapshot.json + report
 *   node scripts/check-dtpc.mjs --offline       # compare against the last snapshot only (no network)
 *   node scripts/check-dtpc.mjs --out dtpc-report.md
 *
 * - data/dtpc-map.json maps each DTPC page to place ids in data/sitedata.js (sure / uncertain).
 * - Every DTPC page is fetched (1 request per second). Its "Entry Time" / "Timing", "Ticket Fare" /
 *   "Entry Fee", "Contact" and "More Info" blocks are read as DTPC wrote them.
 * - The snapshot keeps what DTPC said last time, so a run reports what DTPC CHANGED since then;
 *   new DTPC pages that are not mapped are listed as candidates.
 * - Nothing in the site data is changed: the report says what differs, a person (or the /improve-data
 *   loop, with review) decides. Never copy anything from Google Maps.
 * Exit code 0 always (the network or DTPC may be down); the report says what was checked.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://www.dtpcwayanad.com';
const argv = process.argv.slice(2);
const OFFLINE = argv.includes('--offline');
const outArg = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : null;
const SNAP = path.join(ROOT, 'data', 'dtpc-snapshot.json');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const map = JSON.parse(read('data/dtpc-map.json'));
const ctx = vm.createContext({});
vm.runInContext(`${read('data/sitedata.js')}\n;this.__v = siteData;`, ctx);
const places = {};
for (const [cat, rows] of Object.entries(ctx.__v)) if (cat !== 'stays') for (const r of rows) places[r.id] = r;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; bwstays-data-verification/1.0; +https://www.bwstays.com)' }, signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Visible text of a DTPC page as lines (comments, scripts, styles and icons removed). */
function lines(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|svg|noscript)[\s\S]*?<\/\1>/gi, '')
    .replace(/<(br|\/p|\/div|\/li|\/h\d|\/tr|\/td|\/span)[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8377;|&#x20b9;/gi, '₹').replace(/&deg;/g, '°').replace(/&[a-z]+;/g, ' ')
    .split('\n').map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const HEADS = { timing: /^(entry time|timings?|time|visiting hours?|opening hours?|working hours?|available slots?)\s*:?$/i, fee: /^(ticket fare|entry fee|fee|ticket|tickets|rates?)\s*:?$/i, contact: /^(contact|phone|contact no\.?)\s*:?$/i, info: /^more info\s*:?$/i };
const STOP = /^(entry time|timings?|time|ticket fare|entry fee|fee|contact|available slots?|how to reach|by road|by rail|by air|more info|book now|route map|weather today|places of interest|explore more.*|discover more|sitemap|❯|&#10095;)\s*:?$/i;

/** The labelled blocks of a DTPC page. */
function facts(html) {
  const L = lines(html);
  const out = { timing: [], fee: [], contact: [], info: [] };
  for (let i = 0; i < L.length; i++) {
    for (const [k, re] of Object.entries(HEADS)) {
      if (!re.test(L[i])) continue;
      // a block is a few short lines (descriptions and the page footer are not part of it)
      for (let j = i + 1; j < L.length && j < i + 14 && !STOP.test(L[j]) && L[j].length <= 140; j++) if (!out[k].includes(L[j])) out[k].push(L[j]);
    }
  }
  out.info = out.info.filter((x) => !/^explore more/i.test(x));
  out.contact = out.contact.filter((x) => /\d{3}[\s-]?\d{2}/.test(x));
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  out.title = h1 ? h1[1].replace(/<[^>]+>/g, '').trim() : '';
  return out;
}

/** "09:00 AM to 06:00 PM" -> "09:00-18:00" (others kept as written). */
const hhmm = (h, m, ap) => { let x = Number(h) % 12; if (/p/i.test(ap)) x += 12; return `${String(x).padStart(2, '0')}:${m ?? '00'}`; };
function ranges(text) {
  const out = [];
  const re = /(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\.?\s*(?:to|-|–)\s*(\d{1,2})(?:[:.](\d{2}))?\s*([ap])\.?\s*m\.?/gi;
  let m;
  while ((m = re.exec(text))) out.push(`${hhmm(m[1], m[2], m[3])}-${hhmm(m[4], m[5], m[6])}`);
  return out;
}
const numbers = (s) => [...String(s ?? '').matchAll(/(\d[\d,]*)/g)].map((m) => Number(m[1].replace(/,/g, ''))).filter((n) => n >= 5);

const old = fs.existsSync(SNAP) ? JSON.parse(fs.readFileSync(SNAP, 'utf8')) : { pages: {} };
const snap = { _comment: 'What DTPC Wayanad published, as read by scripts/check-dtpc.mjs. Compared on the next run to report what DTPC changed.', fetched: new Date().toISOString().slice(0, 10), pages: {} };
const report = { checked: [], differs: [], dtpcChanged: [], newPages: [], errors: [] };

// all DTPC destination and adventure pages, to notice new ones
let listed = new Set(Object.values(map.pages).map((p) => p.url).filter(Boolean));
if (!OFFLINE) {
  for (const u of [`${BASE}/`, `${BASE}/destination`, `${BASE}/adventure`, ...['waterfalls', 'hills', 'museums', 'wildlife', 'pilgrim-centres', 'places-of-interest'].map((c) => `${BASE}/destination/${c}`)]) {
    try {
      const h = await get(u);
      for (const m of h.matchAll(/https:\/\/www\.dtpcwayanad\.com\/(destination|adventure)\/[a-z0-9-]+/g)) listed.add(m[0]);
    } catch (e) { report.errors.push(`${u}: ${e.message}`); }
    await sleep(1000);
  }
}
const CATEGORY = /\/destination\/(waterfalls|hills|museums|wildlife|pilgrim-centres|places-of-interest)$/;
listed = [...listed].filter((u) => !CATEGORY.test(u)).sort();
const known = new Map(Object.entries(map.pages).map(([slug, p]) => [p.url, { slug, ...p }]));
const notOnSite = new Set((map.not_on_site ?? []).map((x) => x.url));

for (const url of listed) {
  const slug = url.split('/').pop();
  let f;
  if (OFFLINE) f = old.pages[slug];
  else {
    try { f = facts(await get(url)); } catch (e) { report.errors.push(`${url}: ${e.message}`); f = old.pages[slug]; }
    await sleep(1000);
  }
  if (!f) continue;
  snap.pages[slug] = { url, ...f };
  const prev = old.pages[slug];
  if (prev && !OFFLINE) for (const k of ['timing', 'fee', 'contact', 'info']) {
    if (JSON.stringify(prev[k] ?? []) !== JSON.stringify(f[k] ?? [])) report.dtpcChanged.push({ slug, url, field: k, before: prev[k] ?? [], now: f[k] ?? [] });
  }
  const m = known.get(url);
  if (!m) { if (!notOnSite.has(url) && (f.timing.length || f.fee.length)) report.newPages.push({ slug, url, title: f.title, timing: f.timing, fee: f.fee }); continue; }
  for (const id of m.ids) {
    const r = places[id];
    if (!r) { report.errors.push(`${slug}: place ${id} is not in data/sitedata.js`); continue; }
    const row = { id, name: r.name.trim(), slug, url, mapping: m.mapping };
    const skip = new Set(m.skip ?? []);
    report.checked.push(row);
    // timing: every clock range DTPC gives for entry must be on the site (boat/trek extras are listed, not required)
    const dt = ranges(f.timing.filter((x) => !/boat|trek|ride|safari|zip|kayak/i.test(x)).join(' | '));
    const site = (r.timing ?? []).map((x) => String(x).replace(/\s*\(.*\)$/, ''));
    if (!skip.has('timing') && dt.length && dt.join(',') !== site.join(',')) report.differs.push({ ...row, field: 'timing', site: r.timing ?? [], dtpc: f.timing });
    if (!skip.has('timing') && !dt.length && f.timing.length && !site.length && !/day ?time|daylight/i.test(f.timing.join(' '))) report.differs.push({ ...row, field: 'timing', site: [], dtpc: f.timing, note: 'DTPC gives hours in words' });
    // fee: the adult (or first) amount DTPC gives must appear in the site fee
    const adult = f.fee.find((x) => /adult|person|entry|indian/i.test(x)) ?? f.fee[0];
    const need = numbers(adult)[0];
    if (!skip.has('fee') && need && !numbers(r.fee).includes(need)) report.differs.push({ ...row, field: 'fee', site: r.fee ?? '', dtpc: f.fee });
    if (!f.fee.length && /free|no entry fee/i.test(f.info.join(' ')) && r.fee && !/free|no (entry )?fee|^0$/i.test(String(r.fee))) report.differs.push({ ...row, field: 'fee', site: r.fee, dtpc: f.info });
    // contact: a DTPC number missing from the site
    const dPhones = f.contact.join(' ').match(/\d[\d\s-]{8,}\d/g) ?? [];
    const sitePhones = String(r.Contact ?? '').replace(/\D/g, '');
    const missing = dPhones.filter((p) => { const d = p.replace(/\D/g, '').slice(-8); return d.length === 8 && !sitePhones.includes(d); });
    if (!skip.has('contact') && missing.length) report.differs.push({ ...row, field: 'contact', site: r.Contact ?? '', dtpc: f.contact });
  }
}
if (!OFFLINE) fs.writeFileSync(SNAP, JSON.stringify(snap, null, 1) + '\n');

const md = [
  '# DTPC Wayanad check', '',
  `Run ${new Date().toISOString()} · ${OFFLINE ? 'offline (last snapshot)' : 'fetched from www.dtpcwayanad.com'} · DTPC pages ${listed.length} · places compared ${report.checked.length}`, '',
  `**Differs: ${report.differs.length}** · DTPC changed since last run: ${report.dtpcChanged.length} · new DTPC pages: ${report.newPages.length} · errors: ${report.errors.length}`, '',
  '## Site differs from DTPC', '',
  ...(report.differs.length ? report.differs.map((d) => `- [${d.id}] ${d.name} (${d.mapping}) **${d.field}**: site \`${JSON.stringify(d.site)}\` · DTPC: "${d.dtpc.join(' | ')}"${d.note ? ` (${d.note})` : ''} · ${d.url}`) : ['_none_']), '',
  '## What DTPC changed since the last run', '',
  ...(report.dtpcChanged.length ? report.dtpcChanged.map((c) => `- ${c.slug} ${c.field}: "${c.before.join(' | ')}" → "${c.now.join(' | ')}" · ${c.url}`) : ['_none_']), '',
  '## DTPC pages with timings or fees that are not on the site', '',
  ...(report.newPages.length ? report.newPages.map((p) => `- ${p.title || p.slug}: ${p.timing.join(' | ')} · ${p.fee.join(' | ')} · ${p.url}`) : ['_none_']), '',
  ...(report.errors.length ? ['## Errors', '', ...report.errors.map((e) => `- ${e}`), ''] : []),
].join('\n');
if (outArg) fs.writeFileSync(path.resolve(outArg), md);
console.log(md);
