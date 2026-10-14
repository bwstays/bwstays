#!/usr/bin/env node
/**
 * Builds two worklists that turn the open data issues (#101, #102) into a field checklist.
 * Nothing here is invented: it lists what is missing, with a link to open the spot on OpenStreetMap
 * (so a volunteer or the owner can confirm and add it there), then the monthly refresh picks it up.
 *
 *   data/survey-food.csv         places that eat/drink: unverified positions first, then the places
 *                                 nearest the villa that lack opening hours or a phone number
 *   data/survey-coordinates.csv  places whose coordinate the site does not trust
 *
 *   node scripts/build-survey.mjs
 *
 * Do NOT copy coordinates, hours or phone numbers from Google Maps: its terms forbid it and
 * OpenStreetMap's licence (ODbL) cannot accept it. Use a visit, the place's own website, or its owner.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const csv = (rows) => rows.map((r) => r.map((v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}).join(',')).join('\n') + '\n';
const osmView = (lat, lon) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=18/${lat}/${lon}`;
const osmEdit = (lat, lon) => `https://www.openstreetmap.org/edit#map=19/${lat}/${lon}`;

// ---- food
const food = JSON.parse(read('data/food-places.json')).places;
const fRows = [['priority', 'what_to_do', 'name', 'kind', 'road_km_from_villa', 'lat', 'lon', 'missing', 'view_on_osm', 'edit_on_osm']];
const unverified = food.filter((p) => p.unverified_position || p.source !== 'openstreetmap');
for (const p of unverified.sort((a, b) => (a.from_stay_road_km ?? 999) - (b.from_stay_road_km ?? 999))) {
  fRows.push([1, 'Confirm the position on the ground, then add the place to OpenStreetMap', p.name, p.kind, p.from_stay_road_km,
    p.lat, p.lon, 'listed only on this website', osmView(p.lat, p.lon), osmEdit(p.lat, p.lon)]);
}
const near = food
  .filter((p) => p.source === 'openstreetmap')
  .sort((a, b) => (a.from_stay_road_km ?? 999) - (b.from_stay_road_km ?? 999))
  .slice(0, 60);
for (const p of near) {
  const missing = [!p.opening_hours && 'opening_hours', !p.phone && 'phone', !p.cuisine?.length && 'cuisine', p.vegetarian == null && 'diet:vegetarian'].filter(Boolean);
  if (!missing.length) continue;
  fRows.push([2, 'Add the missing tags on OpenStreetMap', p.name, p.kind, p.from_stay_road_km, p.lat, p.lon,
    missing.join(' '), p.osm_url || osmView(p.lat, p.lon), p.osm_edit_url || osmEdit(p.lat, p.lon)]);
}
fs.writeFileSync(path.join(ROOT, 'data/survey-food.csv'), csv(fRows));

// ---- coordinates
const ctx = vm.createContext({});
vm.runInContext(`${read('data/nearbylocationsdata.js')}\n;this.__v = locations;`, ctx);
const meta = ctx.__v.meta?.places_without_trusted_coordinates ?? [];
const sCtx = vm.createContext({});
vm.runInContext(`${read('data/sitedata.js')}\n;this.__v = siteData;`, sCtx);
const byId = new Map();
for (const [cat, rows] of Object.entries(sCtx.__v)) for (const r of rows) byId.set(r.id, { ...r, cat });
const cRows = [['id', 'place', 'category', 'stated_lat', 'stated_lon', 'why_not_trusted', 'what_is_needed', 'view_on_osm']];
for (const m of meta) {
  const s = byId.get(m.id);
  const [lat, lon] = String(s?.latlong ?? '').split(',').map((v) => Number(v.trim()));
  const has = Number.isFinite(lat) && Number.isFinite(lon);
  let need = 'Confirm the real position (visit, or the place\'s own site) and update data/sitedata.js';
  if (/excluded in review|placeholder/i.test(m.reason)) need = 'Owner decision: keep, rename or remove this record (issue #100)';
  else if (/no coordinates|no record/i.test(m.reason)) need = 'Find the real place and add its coordinate, or remove the entry';
  cRows.push([m.id, m.name, s?.cat ?? '', has ? lat : '', has ? lon : '', m.reason, need, has ? osmView(lat, lon) : '']);
}
fs.writeFileSync(path.join(ROOT, 'data/survey-coordinates.csv'), csv(cRows));

console.log(`data/survey-food.csv: ${fRows.length - 1} rows (${unverified.length} unverified, ${fRows.length - 1 - unverified.length} missing details)`);
console.log(`data/survey-coordinates.csv: ${cRows.length - 1} rows`);
