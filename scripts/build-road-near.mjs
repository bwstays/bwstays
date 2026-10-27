#!/usr/bin/env node
/**
 * Builds data/road-near.json: road distance and driving time from each place page to the places listed in
 * its "Food and dine near this place", "Nearby EV charging" and "Nearby gas stations" widgets, so the lists
 * show road km instead of straight-line km with no routing call at view time.
 *
 *   node scripts/build-road-near.mjs           # write the file (OSRM, about one request a second)
 *   node scripts/build-road-near.mjs --check   # exit 1 if a widget lists a place that has no road distance
 *
 * - The centres are the data-center attributes of #food-places and [data-evgas] in the HTML pages.
 * - The places per centre are chosen exactly as js/dynamic-foodmap.js and js/dynamic-evgas.js choose them
 *   (keep the SELECTION numbers below in step with those scripts).
 * - Routing: the public OSRM server (router.project-osrm.org), driving profile, on OpenStreetMap data
 *   (c) OpenStreetMap contributors, ODbL. One table request per centre. A centre that fails keeps its
 *   previous values, and the widgets fall back to straight-line km (marked as such) for anything missing.
 * - Re-run after build-food.mjs, build-fuel.mjs, a change to data/ev-stations.json or a new place page.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/road-near.json');
const CHECK = process.argv.includes('--check');
const OSRM = 'https://router.project-osrm.org/table/v1/driving/';
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';

// same numbers as the widgets
const SELECTION = {
  food: { file: 'data/food-places.json', list: 'places', radius: 4000, max: 12, fallback: 20000, fallbackMax: 6 },
  ev: { file: 'data/ev-stations.json', list: 'stations', radius: 45000, max: 15, fallback: 80000, fallbackMax: 6 },
  gas: { file: 'data/fuel-places.json', list: 'places', radius: 30000, max: 15, fallback: 60000, fallbackMax: 6 },
};

export const centreKey = (lat, lng) => `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`;
const rad = (d) => (d * Math.PI) / 180;
const metersBetween = (aLat, aLon, bLat, bLon) => {
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLon - aLon) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
function choose(sel, items, lat, lng) {
  const all = items.map((p) => ({ p, d: metersBetween(lat, lng, p.lat, p.lon) })).sort((a, b) => a.d - b.d);
  let chosen = all.filter((x) => x.d <= sel.radius).slice(0, sel.max);
  if (chosen.length < 4) chosen = all.filter((x) => x.d <= sel.fallback).slice(0, sel.fallbackMax);
  return chosen.map((x) => x.p);
}

// centres from the pages
const centres = new Map(); // key -> { lat, lng, kinds:Set, pages:Set }
for (const f of fs.readdirSync(ROOT).filter((n) => n.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of html.matchAll(/<[a-z]+\b[^>]*>/gi)) {
    const tag = m[0];
    const center = (tag.match(/\sdata-center="([^"]+)"/) || [])[1];
    if (!center) continue;
    let kinds = [];
    if (/\sid="food-places"/.test(tag)) kinds = ['food'];
    else if (/\sdata-evgas\b/.test(tag)) kinds = [(tag.match(/\sdata-kind="([a-z]+)"/) || [])[1]].filter((k) => k === 'ev' || k === 'gas');
    if (!kinds.length) continue;
    const [lat, lng] = center.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const key = centreKey(lat, lng);
    if (!centres.has(key)) centres.set(key, { lat, lng, kinds: new Set(), pages: new Set() });
    kinds.forEach((k) => centres.get(key).kinds.add(k));
    centres.get(key).pages.add(f);
  }
}

const data = Object.fromEntries(Object.entries(SELECTION).map(([k, s]) => [k, JSON.parse(fs.readFileSync(path.join(ROOT, s.file), 'utf8'))[s.list] || []]));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { centres: {} };

// what each centre needs
const need = new Map();
for (const [key, c] of centres) {
  const ids = new Map();
  for (const kind of c.kinds) for (const p of choose(SELECTION[kind], data[kind], c.lat, c.lng)) ids.set(p.id, p);
  need.set(key, ids);
}

if (CHECK) {
  let missing = 0;
  for (const [key, ids] of need) for (const id of ids.keys()) if (!prev.centres[key] || !prev.centres[key][id]) missing++;
  if (missing) {
    console.error(`road-near.json is missing ${missing} road distance(s): run node scripts/build-road-near.mjs`);
    process.exit(1);
  }
  console.log(`road-near.json covers all ${need.size} widget centres`);
  process.exit(0);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { meta: {
  generated: new Date().toISOString().slice(0, 10),
  source: 'OSRM driving routes (router.project-osrm.org) on OpenStreetMap data, (c) OpenStreetMap contributors, ODbL',
  format: 'centres["lat,lng"][place id] = [road km, driving minutes]; built by scripts/build-road-near.mjs',
}, centres: {} };
let ok = 0, failed = 0;
for (const [key, ids] of need) {
  const c = centres.get(key);
  const list = [...ids.values()];
  if (!list.length) continue;
  const coords = [[c.lng, c.lat], ...list.map((p) => [p.lon, p.lat])].map(([x, y]) => `${x.toFixed(6)},${y.toFixed(6)}`).join(';');
  try {
    const res = await fetch(`${OSRM}${coords}?sources=0&annotations=distance,duration`, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (j.code !== 'Ok') throw new Error(j.code);
    const row = {};
    list.forEach((p, i) => {
      const m = j.distances[0][i + 1], s = j.durations[0][i + 1];
      if (m != null && s != null) row[p.id] = [Math.round(m / 100) / 10, Math.max(1, Math.round(s / 60))];
    });
    out.centres[key] = row;
    ok++;
  } catch (e) {
    if (prev.centres[key]) out.centres[key] = prev.centres[key];
    failed++;
    console.warn(`  ${key} (${[...c.pages][0]}): ${e.message}; kept the previous values`);
  }
  await sleep(1100);
}
fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote data/road-near.json: ${ok} centre(s) routed, ${failed} failed, ${Object.values(out.centres).reduce((a, r) => a + Object.keys(r).length, 0)} road distances`);
