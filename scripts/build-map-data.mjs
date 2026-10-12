#!/usr/bin/env node
/**
 * Builds data/map-places.json: the places drawn on all-locations-wayanad.html,
 * with category filters. It replaces the separate hand-entered marker list in
 * js/way_food_loc.js so the map uses the same fact-checked records as the
 * rest of the site:
 *
 *   - records excluded by data/mcp-review.json are left out
 *   - a coordinate is used only when nearbylocationsdata.js marks it trusted
 *     (not shared between unrelated places, not withheld, not off-road)
 *
 *   node scripts/build-map-data.mjs
 *
 * Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com/';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const load = (file, expr) => {
  const ctx = vm.createContext({});
  vm.runInContext(`${read(file)}\n;this.__v = ${expr};`, ctx, { filename: file });
  return ctx.__v;
};

const siteData = load('data/sitedata.js', 'siteData');
const locations = load('data/nearbylocationsdata.js', 'locations');
const review = JSON.parse(read('data/mcp-review.json')).entries;
const untrusted = new Set((locations.meta?.places_without_trusted_coordinates ?? []).map((p) => p.id));

const LABELS = {
  plantation: 'Plantations', waterfalls: 'Waterfalls & lakes', museums: 'Museums & crafts',
  romantic: 'Viewpoints & romantic spots', culthist: 'Culture & history', trucking: 'Trekking',
  wildlife: 'Wildlife', farms: 'Farms', sporting: 'Adventure sports', tribal: 'Tribal heritage',
  cycling: 'Cycling', shopping: 'Shopping', pilgrimage: 'Pilgrimage',
};
const SKIP = new Set(['stays', 'food']); // food has its own map

const places = [];
const dropped = { excluded: 0, no_trusted_coordinate: 0 };
for (const [cat, rows] of Object.entries(siteData)) {
  if (SKIP.has(cat) || !LABELS[cat]) continue;
  for (const r of rows) {
    const rv = review[`${cat}-${r.id}`];
    if (rv?.exclude) {
      dropped.excluded++;
      continue;
    }
    const [lat, lon] = String(r.latlong ?? '').split(',').map((v) => Number(v.trim()));
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || untrusted.has(r.id) || rv?.withhold?.includes('coordinates')) {
      dropped.no_trusted_coordinate++;
      continue;
    }
    const img = (r.image ?? [])[0] ?? '';
    const imgPath = img.replace(SITE, '');
    const dist = Number(r.distance);
    places.push({
      id: r.id,
      name: String(r.name).replace(/\s+/g, ' ').trim(),
      cat,
      label: LABELS[cat],
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      url: typeof r.knowmore === 'string' && r.knowmore.startsWith(SITE) && fs.existsSync(path.join(ROOT, r.knowmore.replace(SITE, '')))
        ? r.knowmore : null,
      img: img.startsWith(SITE) && fs.existsSync(path.join(ROOT, imgPath)) ? img : null,
      km: Number.isFinite(dist) && dist > 0 && !rv?.withhold?.includes('distance') ? dist : null,
      district: rv?.district ?? null,
      note: rv?.note ?? null,
    });
  }
}
places.sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name));

const categories = Object.entries(LABELS)
  .map(([key, label]) => ({ key, label, count: places.filter((p) => p.cat === key).length }))
  .filter((c) => c.count > 0);
const out = {
  generated: new Date().toISOString().slice(0, 10),
  center: { lat: 11.605787, lon: 76.083311 },
  dropped,
  categories,
  places,
};
fs.writeFileSync(path.join(ROOT, 'data/map-places.json'), JSON.stringify(out) + '\n');
console.log(`wrote data/map-places.json: ${places.length} places in ${categories.length} categories`, JSON.stringify(dropped));
