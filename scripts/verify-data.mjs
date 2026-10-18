#!/usr/bin/env node
/**
 * Data-quality audit of the Wayanad place data: finds what is wrong, stale or unverified and
 * writes a work list. It never edits the site.
 *
 *   node scripts/verify-data.mjs                      # offline checks only (seconds)
 *   node scripts/verify-data.mjs --online             # + OpenStreetMap, OSRM routing and source-link checks
 *   node scripts/verify-data.mjs --online --out data-quality-report.md
 *   node scripts/verify-data.mjs --strict             # exit 1 when an integrity ERROR is found
 *
 * Sources it compares:  data/sitedata.js (the facts), data/nearbylocationsdata.js (distance
 * matrix), data/verification.json (provenance: OSM id, official source URL, confidence, date
 * checked) and the hand-written Timing/Fee/Holiday lines of every place page.
 *
 * Sections of the report:
 *   ERRORS          integrity problems (duplicate ids, broken matrix, a place missing from it)
 *   TO REVIEW       disagreements between two things the site says, or between the site and a
 *                   source in the registry (page vs data, stated vs routed distance, official
 *                   timing or fee vs the site, coordinate vs its OpenStreetMap object)
 *   PENDING         evidence-backed corrections that are in the registry but not yet applied
 *   MISSING         facts not published yet (placeholders, no timing, no fee, no coordinate)
 *   STALE           registry entries older than 180 days, dead source links
 *
 * Free: OpenStreetMap Nominatim (1 request/second), OSRM, plain HTTP. No keys.
 * Licence rule: never copy coordinates, hours or phone numbers from Google Maps.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const ONLINE = args.includes('--online');
const STRICT = args.includes('--strict');
const OUT = args.includes('--out') ? args[args.indexOf('--out') + 1] : null;
const UA = 'bwstays-data-verification/1.0 (https://www.bwstays.com)';
const KALPETTA = [11.605787, 76.083311]; // the site's own coordinate; "km from Kalpetta" is measured from here
const STALE_DAYS = 180;
const TODAY = new Date();

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const load = (file, expr) => {
  const ctx = vm.createContext({});
  vm.runInContext(`${read(file)}\n;this.__v = ${expr};`, ctx, { filename: file });
  return ctx.__v;
};
const siteData = load('data/sitedata.js', 'siteData');
const locations = load('data/nearbylocationsdata.js', 'locations');
const registry = fs.existsSync(path.join(ROOT, 'data/verification.json')) ? JSON.parse(read('data/verification.json')) : { places: {} };
const review = JSON.parse(read('data/mcp-review.json')).entries ?? {};

const errors = [], toReview = [], pending = [], missing = [], stale = [];
const places = [];
const seen = new Map();
for (const [category, rows] of Object.entries(siteData)) {
  for (const r of rows) {
    const [lat, lng] = String(r.latlong ?? '').split(',').map((v) => Number(v.trim()));
    const p = { ...r, category, name: String(r.name).trim(), lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
    places.push(p);
    if (seen.has(r.id)) errors.push(`id ${r.id} is used by both "${seen.get(r.id)}" and "${p.name}" (${category}); use the next free id`);
    else seen.set(r.id, `${category}: ${p.name}`);
  }
}
const byId = new Map(places.map((p) => [p.id, p]));
const label = (p) => `[${p.id}] ${p.name}`;
const published = (p) => p.category !== 'stays' && !review[`${p.category}-${p.id}`]?.exclude;

const hav = (a, b) => {
  const t = (x) => (x * Math.PI) / 180, R = 6371;
  const dl = t(b[0] - a[0]), dn = t(b[1] - a[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ 1. integrity
const ids = Object.keys(locations.names).map(Number);
for (const p of places) if (!(p.id in locations.names)) errors.push(`${label(p)} (${p.category}) is missing from the distance matrix (data/nearbylocationsdata.js)`);
for (const id of ids) if (!byId.has(id)) toReview.push(`matrix id ${id} ("${locations.names[id]}") has no record in data/sitedata.js: remove it from the matrix or restore the record`);
let asym = 0, badRows = 0;
for (const a of ids) {
  const row = locations.distances[a];
  if (!row || row.length !== ids.length) { badRows++; continue; }
  if (row[a - 1] !== 0) errors.push(`matrix: ${a} is ${row[a - 1]} km from itself`);
  for (const b of ids) if (a < b && row[b - 1] !== locations.distances[b][a - 1]) asym++;
}
if (badRows) errors.push(`matrix: ${badRows} rows do not have ${ids.length} columns`);
if (asym) errors.push(`matrix: ${asym} pairs are not symmetric`);
const untrusted = new Map((locations.meta?.places_without_trusted_coordinates ?? []).map((p) => [p.id, p.reason]));
for (const [id, reason] of untrusted) {
  const row = locations.distances[id] ?? [];
  const legacy = row.filter((x) => x > 0).length;
  void legacy;
}

// ------------------------------------------------------------------ 2. page text vs data
const minutes = (s) => {
  const out = [];
  for (const m of String(s).matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi)) {
    if (!m[2] && !m[3]) continue; // a bare number is not a time
    let h = Number(m[1]);
    const mm = Number(m[2] ?? 0);
    if (m[3]) { const pm = m[3].toLowerCase() === 'pm'; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    if (h <= 24 && mm < 60) out.push(h * 60 + mm);
  }
  return [...new Set(out)].sort((a, b) => a - b);
};
const sameList = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const norm = (s) => String(s ?? '').trim().toLowerCase();
const noHoliday = (s) => ['', 'na', 'n/a', 'none', 'all day', 'nil'].includes(norm(s));
const numbers = (s) => /^\s*(no (entry )?fee|free)/i.test(String(s ?? '')) ? [0] : [...new Set(String(s ?? '').replace(/,/g, '').match(/\d+(?:\.\d+)?/g) ?? [])].map(Number).sort((a, b) => a - b);
const lineText = (html, re) => {
  const m = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null;
};
for (const p of places) {
  if (!published(p) || !String(p.knowmore ?? '').startsWith('https://www.bwstays.com/')) continue;
  const file = p.knowmore.split('/').pop();
  if (!file || !fs.existsSync(path.join(ROOT, file))) { toReview.push(`${label(p)}: page ${file} does not exist`); continue; }
  const html = read(file);
  const pTime = lineText(html, /fa-clock da-icon"><\/i>\s*Timing:([^\n]*(?:\n[^\n<]*)?)/);
  const pFee = lineText(html, /fa-rupee-sign da-icon"><\/i>\s*<b>\s*Fee\s*:([^<]*)/);
  const pHol = lineText(html, /fa-power-off da-icon"><\/i>\s*Holiday:([^<\n]*)/);
  const dTime = minutes((p.timing ?? []).join(' '));
  if (pTime !== null && dTime.length) {
    const t = minutes(pTime);
    if (!sameList(t, dTime)) toReview.push(`${label(p)}: page says "${pTime}" but data says ${JSON.stringify(p.timing)}`);
  }
  if (pHol !== null) {
    const same = noHoliday(pHol) ? noHoliday(p.holidays) : norm(pHol) === norm(p.holidays);
    if (!same) toReview.push(`${label(p)}: page holiday "${pHol}" vs data "${p.holidays}"`);
  }
  if (pFee !== null && numbers(pFee).length && !(numbers(p.fee).length && sameList(numbers(pFee), numbers(p.fee))))
    toReview.push(`${label(p)}: page fee "${pFee}" vs data "${p.fee}"`);
}

// ------------------------------------------------------------------ 3. registry vs site (offline)
const regPlaces = registry.places ?? {};
for (const [id, e] of Object.entries(regPlaces)) {
  const p = byId.get(Number(id));
  if (!p) { toReview.push(`registry has id ${id} (${e.name}) but sitedata.js does not`); continue; }
  if (!published(p)) continue;
  const c = e.coordinate;
  if (c && ['corrected', 'new'].includes(c.status) && c.osm_ref && c.lat != null && p.lat != null) {
    const off = hav([c.lat, c.lng ?? c.lon], [p.lat, p.lng]);
    if (off > 0.3) pending.push(`${label(p)}: coordinate evidence ${c.osm_ref} is ${off.toFixed(2)} km from the site's coordinate (${p.latlong}); proposed ${c.lat}, ${c.lon}. ${c.evidence ?? ''}`.trim());
  }
  for (const key of ['timing', 'fee']) {
    if (e[key]?.conflict) toReview.push(`${label(p)}: ${key} sources disagree (owner decision): ${e[key].note}`);
  }
  for (const key of ['timing', 'fee']) {
    const f = e[key];
    if (!f || !f.value || !['high', 'medium'].includes(f.confidence)) continue;
    const mine = key === 'timing' ? minutes(f.value) : numbers(f.value);
    const site = key === 'timing' ? minutes((p.timing ?? []).join(' ')) : numbers(p.fee);
    // flagged only when the site states something the source does not (a shorter wording is fine)
    if (mine.length && !(site.length && site.every((v) => mine.includes(v)))) pending.push(`${label(p)}: official ${key} "${String(f.value).slice(0, 110)}" (${f.confidence}, ${f.source_url}) differs from the site (${key === 'timing' ? JSON.stringify(p.timing) : JSON.stringify(p.fee)})`);
  }
  if (e.identity && !['real'].includes(e.identity) && published(p) && p.category !== 'stays' && !untrusted.has(p.id))
    toReview.push(`${label(p)}: research says identity is "${e.identity}" but the place is published with a trusted coordinate`);
  const days = (TODAY - new Date(e.checked ?? 0)) / 86400000;
  if (days > STALE_DAYS) stale.push(`${label(p)}: last checked ${e.checked} (${Math.round(days)} days ago)`);
}

// ------------------------------------------------------------------ 4. missing facts
for (const p of places) {
  if (!published(p)) continue;
  const miss = [];
  if (p.lat == null) miss.push('coordinate');
  if (!/\d/.test(String(p.timing ?? ''))) miss.push('timing');
  if (!String(p.fee ?? '').trim()) miss.push('fee');
  if (/0{3}\s*0{3}/.test(String(p.Contact ?? ''))) miss.push('contact (placeholder +91-000...)');
  if (!regPlaces[p.id]) miss.push('verification record');
  if (untrusted.has(p.id)) miss.push(`trusted coordinate (${untrusted.get(p.id)})`);
  if (miss.length) missing.push(`${label(p)}: ${miss.join('; ')}`);
}

// ------------------------------------------------------------------ 5. online checks
async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}
if (ONLINE) {
  // 5a. stated km from Kalpetta vs the fastest route (OSRM) from the site's own coordinate
  try {
    const trusted = places.filter((p) => published(p) && p.lat != null && !untrusted.has(p.id));
    const coords = [KALPETTA, ...trusted.map((p) => [p.lat, p.lng])].map(([a, b]) => `${b},${a}`).join(';');
    const j = await getJson(`https://router.project-osrm.org/table/v1/driving/${coords}?annotations=distance&sources=0`);
    trusted.forEach((p, i) => {
      const routed = j.distances[0][i + 1] / 1000, stated = Number(p.distance);
      if (!Number.isFinite(stated)) return;
      if (Math.abs(routed - stated) > Math.max(4, stated * 0.25)) toReview.push(`${label(p)}: site says ${stated} km from Kalpetta, the route is ${routed.toFixed(1)} km`);
    });
    // 5b. spot-check the matrix against fresh routing (every 5th trusted place)
    const sample = trusted.filter((_, i) => i % 5 === 0).slice(0, 14);
    const c2 = sample.map((p) => `${p.lng},${p.lat}`).join(';');
    const m = await getJson(`https://router.project-osrm.org/table/v1/driving/${c2}?annotations=distance`);
    let bad = 0, n = 0;
    sample.forEach((a, i) => sample.forEach((b, k) => {
      if (i >= k) return;
      n++;
      const fresh = (m.distances[i][k] + m.distances[k][i]) / 2000, stored = locations.distances[a.id][b.id - 1];
      if (stored && Math.abs(fresh - stored) > Math.max(3, stored * 0.2)) { bad++; toReview.push(`matrix ${label(a)} <-> ${label(b)}: stored ${stored} km, fresh route ${fresh.toFixed(1)} km`); }
    }));
    console.error(`routing: compared ${trusted.length} places with Kalpetta and ${n} matrix pairs (${bad} differ)`);
  } catch (e) { toReview.push(`routing check could not run: ${e.message}`); }

  // 5c. each registry OpenStreetMap object still exists and is where the registry says
  try {
    const refs = Object.entries(regPlaces).map(([id, e]) => [Number(id), e.coordinate?.osm_ref]).filter(([, r]) => /^(node|way|relation)\/\d+$/.test(r ?? ''));
    for (let i = 0; i < refs.length; i += 40) {
      const chunk = refs.slice(i, i + 40);
      const q = chunk.map(([, r]) => r[0].toUpperCase() + r.split('/')[1]).join(',');
      const found = await getJson(`https://nominatim.openstreetmap.org/lookup?format=jsonv2&osm_ids=${q}`);
      const have = new Map(found.map((f) => [`${f.osm_type}/${f.osm_id}`, f]));
      for (const [id, ref] of chunk) {
        const p = byId.get(id), f = have.get(ref), c = regPlaces[id].coordinate;
        if (!f) { toReview.push(`${label(p)}: OpenStreetMap object ${ref} no longer exists or was not returned`); continue; }
        if (c.lat != null) {
          const off = hav([Number(f.lat), Number(f.lon)], [c.lat, c.lon]);
          if (off > 0.5) toReview.push(`${label(p)}: registry coordinate is ${off.toFixed(2)} km from OpenStreetMap ${ref} ("${f.name ?? f.display_name?.split(',')[0]}")`);
        }
      }
      await sleep(1100);
    }
  } catch (e) { toReview.push(`OpenStreetMap lookup could not run: ${e.message}`); }

  // 5d. source links in the registry are alive
  const urls = [...new Set(Object.values(regPlaces).flatMap((e) => [e.timing?.source_url, e.fee?.source_url]).filter((u) => /^https?:\/\//.test(u ?? '')))];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < urls.length) {
      const u = urls[next++];
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
        const res = await fetch(u, { method: 'GET', headers: { 'User-Agent': UA }, signal: ctl.signal, redirect: 'follow' });
        clearTimeout(t);
        if (res.status === 404 || res.status === 410 || res.status >= 500) stale.push(`source link ${u} answers ${res.status}`);
      } catch (e) { stale.push(`source link ${u} could not be reached (${e.name})`); }
    }
  }));
}

// ------------------------------------------------------------------ report
const section = (title, note, list) => `## ${title} (${list.length})\n${note}\n\n${list.length ? list.map((l) => `- ${l}`).join('\n') : '_none_'}\n`;
const report = [
  `# Wayanad data-quality report`,
  `Generated ${TODAY.toISOString().slice(0, 10)} (${ONLINE ? 'online' : 'offline'} run) from ${places.length} places, ${ids.length} matrix ids, ${Object.keys(regPlaces).length} registry entries.\n`,
  section('ERRORS', 'Integrity problems. Fix first; `--strict` fails on these.', errors),
  section('TO REVIEW', 'Two things the site says disagree, or the site disagrees with a source. Research, then fix the wrong side.', toReview),
  section('PENDING', 'Evidence-backed corrections found by research that are not applied yet. Apply, record the evidence in data/verification.json.', pending),
  section('MISSING', 'Facts not published yet. Do not invent them: find a source or leave blank.', missing),
  section('STALE', `Registry entries older than ${STALE_DAYS} days and dead source links.`, stale),
].join('\n');
if (OUT) fs.writeFileSync(path.resolve(OUT), report);
console.log(report);
console.error(`errors ${errors.length} | to review ${toReview.length} | pending ${pending.length} | missing ${missing.length} | stale ${stale.length}`);
if (STRICT && errors.length) process.exit(1);
