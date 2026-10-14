#!/usr/bin/env node
/**
 * Looks up OpenStreetMap coordinates (Nominatim, free, ODbL) for places whose coordinate the
 * site does not trust, so a person can review them before they go into data/sitedata.js.
 * Read-only: prints a table, changes nothing.
 *
 *   node scripts/probe-coords.mjs 3 6 17 26     # ids from data/nearbylocationsdata.js
 *
 * Nominatim usage policy: one request per second, identify the application.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';
const BBOX = { minLat: 11.35, maxLat: 12.05, minLon: 75.7, maxLon: 76.5 }; // Wayanad district, with margin
const ids = process.argv.slice(2).map(Number).filter(Boolean);

const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/sitedata.js'), 'utf8') + '\n;this.__v = siteData;', ctx);
const siteData = ctx.__v;
const byId = new Map();
for (const [cat, rows] of Object.entries(siteData)) for (const r of rows) byId.set(r.id, { ...r, cat });

const rad = (d) => (d * Math.PI) / 180;
const km = (a, b) => {
  const h = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (const id of ids) {
  const s = byId.get(id);
  if (!s) { console.log(id, '(no siteData record)'); continue; }
  const cur = String(s.latlong || '').split(',').map(Number);
  const have = cur.length === 2 && cur.every(Number.isFinite) ? cur : null;
  const queries = [`${s.name}, Wayanad, Kerala`, `${s.name}, Kerala, India`];
  const seen = new Set();
  console.log(`\n#${id} ${s.name}  [${s.cat}]  stated: ${have ? have.join(', ') : 'none'}`);
  for (const q of queries) {
    const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=4&addressdetails=0&viewbox=75.7,12.05,76.5,11.35&q=' + encodeURIComponent(q);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const rows = await res.json();
      for (const r of rows) {
        const lat = Number(r.lat), lon = Number(r.lon);
        const inside = lat >= BBOX.minLat && lat <= BBOX.maxLat && lon >= BBOX.minLon && lon <= BBOX.maxLon;
        const k = `${r.osm_type}${r.osm_id}`;
        if (seen.has(k)) continue;
        seen.add(k);
        console.log(`   ${inside ? 'IN ' : 'out'} ${lat.toFixed(5)}, ${lon.toFixed(5)}  ${have ? km(have, [lat, lon]).toFixed(1) + ' km from stated' : ''}  ${r.category}/${r.type}  ${String(r.display_name).slice(0, 80)}`);
      }
    } catch (e) {
      console.log('   lookup failed', e.message);
    }
    await sleep(1100);
  }
}
