#!/usr/bin/env node
/**
 * Builds data/fuel-places.json: petrol / diesel / CNG stations in Wayanad from
 * OpenStreetMap (Overpass, (c) OpenStreetMap contributors, ODbL), so the "Nearby
 * Gas Filling Station" map needs no third-party API at view time.
 *
 *   node scripts/build-fuel.mjs
 *   node scripts/build-fuel.mjs --from saved-overpass.json
 *
 * EV charging is NOT taken from OpenStreetMap: it has no charging stations
 * mapped in Wayanad. Those come from the hand-maintained data/ev-stations.json.
 * Missing hours or phones are left null; the fix is to add them on OpenStreetMap
 * (each place carries an osm_edit_url) and re-run this script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data/fuel-places.json');
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';
const QUERY = `[out:json][timeout:180];
area["name"="Wayanad"]["boundary"="administrative"]->.a;
nwr["amenity"="fuel"](area.a);
out center tags;`;

const clean = (v) => { const s = String(v ?? '').replace(/\s+/g, ' ').trim(); return s === '' ? null : s; };

async function overpass() {
  const mirrors = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
  let last;
  for (const url of mirrors) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(QUERY),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!Array.isArray(j.elements)) throw new Error('no elements');
        return { elements: j.elements, timestamp: j.osm3s?.timestamp_osm_base ?? null };
      } catch (e) {
        last = e;
        await new Promise((r) => setTimeout(r, 4000 * attempt));
      }
    }
  }
  throw new Error(`Overpass unavailable: ${last?.message}`);
}

// --from file.json reuses a saved Overpass response (testing / when Overpass is slow)
const fromIdx = process.argv.indexOf('--from');
const { elements, timestamp } = fromIdx > 0
  ? { elements: JSON.parse(fs.readFileSync(process.argv[fromIdx + 1], 'utf8')).elements, timestamp: null }
  : await overpass();
const places = [];
for (const el of elements) {
  const t = el.tags ?? {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) continue;
  const brand = clean(t.brand ?? t.operator);
  const name = clean(t.name) ?? brand ?? 'Fuel station';
  const fuels = Object.keys(t).filter((k) => k.startsWith('fuel:') && t[k] === 'yes').map((k) => k.slice(5));
  places.push({
    id: `osm-${el.type}-${el.id}`,
    name,
    brand,
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    fuels,
    opening_hours: clean(t.opening_hours),
    phone: clean(t.phone ?? t['contact:phone']),
    osm_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    osm_edit_url: `https://www.openstreetmap.org/edit?${el.type}=${el.id}`,
  });
}
if (places.length < 10) throw new Error(`only ${places.length} stations returned; keeping the previous file`);
places.sort((a, b) => a.lat - b.lat || a.lon - b.lon);
fs.writeFileSync(OUT, JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  source: 'OpenStreetMap via Overpass (c) OpenStreetMap contributors, ODbL',
  osm_timestamp: timestamp,
  count: places.length,
  places,
}, null, 1) + '\n');
console.log(`wrote data/fuel-places.json: ${places.length} fuel stations`);
