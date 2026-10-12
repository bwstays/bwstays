#!/usr/bin/env node
/**
 * Builds data/search-index.json for the static site search (search.html).
 *
 * It only reads files that already passed the fact-check filters:
 *   resources/attractions.json  (excluded records are already gone)
 *   data/food-places.json       (OpenStreetMap, ODbL)
 *   resources/help.json         (FAQ)
 *   resources/properties.json   (villas)
 *
 *   node scripts/generate-mcp.mjs && node scripts/build-search-index.mjs
 *
 * Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com';
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const trim = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const items = [];

// ---- pages
const pages = [
  ['Villa 1 - Ground Floor', 'Villa, rooms, amenities and rates', `${SITE}/villa1.html`],
  ['Book your stay', 'Reservation and availability', `${SITE}/bwstays-booking.html`],
  ['Terms, disclaimer and privacy', 'Policies', `${SITE}/footer.html`],
  ['All places to visit in Wayanad', 'Map of attractions', `${SITE}/all-locations-wayanad.html`],
  ['Food and dining map', 'Restaurants, cafes and bakeries', `${SITE}/all-fooding-wayanad.html`],
];
for (const [n, s, u] of pages) items.push({ t: 'page', n, s, u });

// ---- attractions (already filtered by the fact-check review)
const attractions = readJson('resources/attractions.json').content.attractions;
for (const a of attractions) {
  const where = a.district ? `${a.district}` : 'Wayanad';
  items.push({
    t: 'place',
    n: trim(a.name),
    s: [a.category_label, where].join(' - '),
    u: a.page_url ?? a.map_url ?? null,
    km: a.distance_from_stay_km ?? null,
    r: a.rating ?? null,
    k: trim(a.review_note ?? ''),
  });
}

// ---- food
const food = readJson('data/food-places.json').places;
for (const p of food) {
  const kind = p.kind.replace('shop:', '').replace(/_/g, ' ');
  const diet = p.vegetarian === 'only' ? 'pure vegetarian' : p.vegetarian ? 'vegetarian options' : '';
  items.push({
    t: 'food',
    n: trim(p.name),
    s: [p.cuisine?.length ? p.cuisine.join(', ') : kind, diet].filter(Boolean).join(' - '),
    u: p.osm_url ?? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
    km: p.from_stay_road_km ?? null,
    h: p.opening_hours ?? null,
    k: [kind, ...(p.cuisine ?? []), diet].join(' '),
  });
}

// ---- FAQ
for (const f of readJson('resources/help.json').content.faq) {
  items.push({ t: 'faq', n: trim(f.question), s: trim(f.answer), u: `${SITE}/bwstays-booking.html` });
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  attribution: 'Food and place data (c) OpenStreetMap contributors, ODbL',
  count: items.length,
  items,
};
fs.writeFileSync(path.join(ROOT, 'data/search-index.json'), JSON.stringify(out) + '\n');
console.log(`wrote data/search-index.json (${items.length} items, ${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
