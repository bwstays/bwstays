#!/usr/bin/env node
/**
 * Rebuilds data/nearbylocationsdata.js: the place-to-place road-distance matrix.
 *
 * The committed matrix had ~49% of its pairs missing (0) because it was built
 * for ~30 places and never extended. This script computes driving distances
 * from OpenStreetMap data (OSRM, free, no key) for every pair of places whose
 * coordinates pass basic trust checks, and keeps the previous value only where
 * a coordinate cannot be trusted. Unknown stays 0, which the page code treats
 * as "no data".
 *
 *   node scripts/build-distances.mjs           # write data/nearbylocationsdata.js
 *   node scripts/build-distances.mjs --dry-run # print a report only
 *
 * Routing data (c) OpenStreetMap contributors, ODbL. Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry-run');
const OSRM = 'https://router.project-osrm.org';
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';
const STAY = [11.605787, 76.083311]; // Kalpetta, used only to sanity-check OSRM

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const load = (file, expr) => {
  const ctx = vm.createContext({});
  vm.runInContext(`${read(file)}\n;this.__v = ${expr};`, ctx, { filename: file });
  return ctx.__v;
};

const siteData = load('data/sitedata.js', 'siteData');
const old = load('data/nearbylocationsdata.js', 'locations');
const review = JSON.parse(read('data/mcp-review.json')).entries;

// ---- places
const siteById = new Map();
for (const [category, rows] of Object.entries(siteData)) {
  for (const r of rows) siteById.set(r.id, { ...r, category });
}
const ids = Object.keys(old.names).map(Number).sort((a, b) => a - b);
const maxId = Math.max(...ids);

const key = (cat, id) => `${cat}-${id}`;
const parse = (s) => {
  const [lat, lng] = String(s ?? '').split(',').map((v) => Number(v.trim()));
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
};

// Places that are genuinely one physical place under two records; shared
// coordinates are therefore expected and fine.
const SAME_PLACE = [[20, 56], [34, 35], [36, 42]];
const sameGroup = (a, b) => SAME_PLACE.some((g) => g.includes(a) && g.includes(b));

const info = new Map(); // id -> {coord, untrusted: reason|null}
for (const id of ids) {
  const s = siteById.get(id);
  const coord = s ? parse(s.latlong) : null;
  let why = null;
  if (!s) why = 'no record in sitedata.js';
  else if (!coord) why = 'no coordinates';
  else if (s.category === 'stays') why = 'placeholder record in the stays category';
  else {
    const rv = review[key(s.category, id)];
    if (rv?.exclude) why = `excluded in review: ${rv.exclude}`;
    else if (rv?.withhold?.includes('coordinates')) why = `coordinates withheld: ${rv.note}`;
  }
  info.set(id, { id, name: old.names[id], coord, untrusted: why });
}
// Shared coordinates between unrelated places are placeholders. Records that
// are already untrusted are ignored, so they cannot taint a real place.
const byPoint = new Map();
for (const p of info.values()) {
  if (!p.coord || p.untrusted) continue;
  const k = p.coord.join(',');
  byPoint.set(k, [...(byPoint.get(k) ?? []), p.id]);
}
for (const group of byPoint.values()) {
  if (group.length < 2) continue;
  for (const a of group) {
    const others = group.filter((b) => b !== a);
    if (others.every((b) => sameGroup(a, b))) continue;
    info.get(a).untrusted = `coordinates shared with ${others.map((b) => info.get(b).name).join(', ')}`;
  }
}

// ---- routing
async function osrmTable(points) {
  const coords = points.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `${OSRM}/table/v1/driving/${coords}?annotations=distance`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const j = await res.json();
  if (j.code !== 'Ok') throw new Error(`OSRM ${j.code}: ${j.message ?? ''}`);
  return j;
}

let trusted = [...info.values()].filter((p) => p.coord && !p.untrusted);
const first = await osrmTable([...trusted.map((p) => p.coord), STAY]);
// a coordinate that snaps more than 1.5 km from any road is not a real road-side place
trusted.forEach((p, i) => {
  const snap = first.sources[i]?.distance ?? 0;
  if (snap > 1500) p.untrusted = `coordinate is ${(snap / 1000).toFixed(1)} km from the nearest road`;
});
trusted = trusted.filter((p) => !p.untrusted);
const net = await osrmTable([...trusted.map((p) => p.coord), STAY]);
const idx = new Map(trusted.map((p, i) => [p.id, i]));
const stayIdx = trusted.length;

const meters = (a, b) => net.distances[idx.get(a)][idx.get(b)];
const km = (m) => {
  const v = Math.round(m / 1000);
  return v === 0 && m > 0 ? 1 : v;
};

// ---- matrix
const matrix = {};
const stats = { fromRouting: 0, keptOld: 0, unknown: 0, changed: 0, filled: 0, same: 0 };
for (const a of ids) {
  const row = new Array(maxId).fill(0);
  for (const b of ids) {
    if (a === b) continue;
    const oldVal = Number(old.distances?.[a]?.[b - 1] ?? 0) || 0;
    let v = 0;
    if (idx.has(a) && idx.has(b)) {
      const ab = meters(a, b);
      const ba = meters(b, a);
      if (ab != null && ba != null) {
        v = km((ab + ba) / 2);
        stats.fromRouting++;
        if (oldVal === 0) stats.filled++;
        else if (oldVal !== v) stats.changed++;
        else stats.same++;
      }
    }
    if (v === 0 && oldVal > 0) {
      // untrusted endpoint: keep the historical value only if both directions agree
      const rev = Number(old.distances?.[b]?.[a - 1] ?? 0) || 0;
      v = rev > 0 ? Math.round((oldVal + rev) / 2) : oldVal;
      stats.keptOld++;
    }
    if (v === 0) stats.unknown++;
    row[b - 1] = v;
  }
  matrix[a] = row;
}
// enforce symmetry for values kept from the old data
for (const a of ids) {
  for (const b of ids) {
    if (b <= a) continue;
    const x = matrix[a][b - 1];
    const y = matrix[b][a - 1];
    if (x !== y) {
      const v = x && y ? Math.round((x + y) / 2) : x || y;
      matrix[a][b - 1] = v;
      matrix[b][a - 1] = v;
    }
  }
}

// ---- sanity check: routed distance from Kalpetta vs figures confirmed from official sources
const CONFIRMED_FROM_KALPETTA = { 4: 64, 31: 54.5, 33: 25, 21: 28, 28: 38, 8: 14 };
for (const [id, want] of Object.entries(CONFIRMED_FROM_KALPETTA)) {
  const i = idx.get(Number(id));
  if (i === undefined) continue;
  const got = km(net.distances[i][stayIdx]);
  console.log(`  check ${String(id).padStart(3)} ${info.get(Number(id)).name.padEnd(46)} routed ${got} km, confirmed ~${want} km`);
}
const report = [];
for (const p of trusted) {
  const d = net.distances[idx.get(p.id)][stayIdx];
  report.push({ id: p.id, name: p.name, from_stay_road_km: d == null ? null : km(d) });
}
const untrusted = [...info.values()].filter((p) => p.untrusted).map((p) => ({ id: p.id, name: p.name, reason: p.untrusted }));

console.log(`places: ${ids.length}  trusted coordinates: ${trusted.length}  untrusted: ${untrusted.length}`);
console.log('pairs:', JSON.stringify(stats));
const total = ids.length * (ids.length - 1);
let zeros = 0;
for (const a of ids) for (const b of ids) if (a !== b && matrix[a][b - 1] === 0) zeros++;
console.log(`unknown pairs after rebuild: ${zeros} of ${total} (${((zeros / total) * 100).toFixed(1)}%), was ${(
  (ids.flatMap((a) => ids.filter((b) => a !== b).map((b) => (Number(old.distances?.[a]?.[b - 1] ?? 0) === 0 ? 1 : 0))).reduce((s, v) => s + v, 0) / total) * 100
).toFixed(1)}%`);
console.log('untrusted:');
for (const u of untrusted) console.log(`  ${String(u.id).padStart(3)} ${u.name} - ${u.reason}`);
if (process.argv.includes('--report')) console.log(JSON.stringify(report));

if (DRY) process.exit(0);

// ---- write
const header = `/**
 * Place-to-place road distances (km) for Wayanad locations.
 *
 * DATA STRUCTURE
 * 1. locations.names:     { id: "Place name" }
 * 2. locations.distances: { id: [d(id -> 1), d(id -> 2), ... d(id -> ${maxId})] }
 *    The value for place N is at index N-1. 0 means "unknown / not computed".
 *    The matrix is symmetric: distances[a][b-1] === distances[b][a-1].
 * 3. locations.meta:      provenance and the ids whose coordinates could not be trusted.
 *
 * Generated by scripts/build-distances.mjs from driving routes on OpenStreetMap
 * data (c) OpenStreetMap contributors, ODbL. Re-run the script to refresh;
 * do not hand-edit the numbers.
 */
`;
const names = Object.fromEntries(ids.map((id) => [id, old.names[id]]));
const meta = {
  generated: new Date().toISOString().slice(0, 10),
  method: 'OSRM driving distance on OpenStreetMap data, rounded to km, averaged over both directions',
  attribution: 'Routing data (c) OpenStreetMap contributors, ODbL',
  places_without_trusted_coordinates: untrusted,
};
const body = `const locations = {
  names: ${JSON.stringify(names, null, 2).replace(/\n/g, '\n  ')},
  distances: {
${ids.map((id) => `    ${id}: [${matrix[id].join(',')}]`).join(',\n')}
  },
  meta: ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}
};
`;
fs.writeFileSync(path.join(ROOT, 'data/nearbylocationsdata.js'), header + body);
console.log('wrote data/nearbylocationsdata.js');
