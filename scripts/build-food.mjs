#!/usr/bin/env node
/**
 * Builds data/food-places.json (and .csv): a static, reusable list of places to
 * eat and drink in Wayanad, so the maps do not depend on a third-party API at
 * view time and the data keeps working on free static hosting.
 *
 * Sources
 *   - OpenStreetMap via the Overpass API (c) OpenStreetMap contributors, ODbL
 *   - the hand-entered `foodations` list in js/way_food_loc.js (kept, de-duplicated)
 *   - driving distance from the stay via OSRM (OpenStreetMap routing)
 *
 *   node scripts/build-food.mjs            # fetch, merge, write
 *   node scripts/build-food.mjs --offline  # reuse the previous file's OSM rows
 *
 * Missing details (hours, phone, cuisine...) are left null on purpose. The fix
 * is to add them to OpenStreetMap, then re-run this script; every place links
 * to its OSM edit page. Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'data/food-places.json');
const OUT_CSV = path.join(ROOT, 'data/food-places.csv');
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';
const STAY = { lat: 11.605787, lon: 76.083311 };
const OFFLINE = process.argv.includes('--offline');

const QUERY = `[out:json][timeout:180];
area["name"="Wayanad"]["boundary"="administrative"]->.a;
(
  nwr["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|bar|pub|biergarten)$"](area.a);
  nwr["shop"~"^(bakery|confectionery|sweets|pastry|deli)$"](area.a);
);
out center tags;`;

// ---- helpers
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const rad = (d) => (d * Math.PI) / 180;
const meters = (a, b) => {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
const clean = (v) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  return s === '' ? null : s;
};
const yes = (v) => (v === 'yes' || v === 'only' ? true : v === 'no' ? false : null);
const title = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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

function fromOsm(el) {
  const t = el.tags ?? {};
  const name = clean(t.name);
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!name || lat == null || lon == null) return null;
  const kind = t.amenity ?? `shop:${t.shop}`;
  const addr = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city'] ?? t['addr:town'] ?? t['addr:village'], t['addr:postcode']]
    .map(clean).filter(Boolean);
  const phone = clean(t.phone ?? t['contact:phone'] ?? t['contact:mobile']);
  const website = clean(t.website ?? t['contact:website']);
  const cuisine = clean(t.cuisine)?.split(';').map((c) => title(c.trim())).filter(Boolean) ?? [];
  const osm = `${el.type}/${el.id}`;
  return {
    id: `osm-${el.type}-${el.id}`,
    name,
    kind,
    cuisine,
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    address: addr.length ? addr.join(', ') : null,
    phone,
    website,
    opening_hours: clean(t.opening_hours),
    vegetarian: t['diet:vegetarian'] === 'only' ? 'only' : yes(t['diet:vegetarian']),
    vegan: yes(t['diet:vegan']),
    halal: yes(t['diet:halal']),
    takeaway: yes(t.takeaway),
    delivery: yes(t.delivery),
    outdoor_seating: yes(t.outdoor_seating),
    wifi: t.internet_access === 'wlan' || t.internet_access === 'yes' ? true : t.internet_access === 'no' ? false : null,
    wheelchair: clean(t.wheelchair),
    brand: clean(t.brand ?? t.operator),
    source: 'openstreetmap',
    osm_url: `https://www.openstreetmap.org/${osm}`,
    osm_edit_url: `https://www.openstreetmap.org/edit?${el.type}=${el.id}`,
    site_listed: false,
  };
}

// Spelling in the hand-entered list; names from OpenStreetMap are left as mapped.
const tidyName = (n) =>
  n && n
    .replace(/Resturants?/gi, (m) => (m.toLowerCase().endsWith('s') ? 'Restaurants' : 'Restaurant'))
    .replace(/Vegiter(?:ia|ai)n/gi, 'Vegetarian')
    .replace(/\s+/g, ' ')
    .trim();

// ---- the hand-entered list on the site
function siteList() {
  const src = fs.readFileSync(path.join(ROOT, 'js/way_food_loc.js'), 'utf8');
  const i = src.indexOf('var foodations');
  const j = src.indexOf('];', i);
  const ctx = vm.createContext({ iconURLPrefix: 'https://www.bwstays.com/' });
  const arr = vm.runInContext(src.slice(i, j + 2).replace(/^var foodations\s*=/, '(') .replace(/;\s*$/, '') + ')', ctx);
  return arr
    .map((r) => ({
      name: tidyName(clean((r[0].match(/>([^<]+)<\/a><\/h6>/) ?? [])[1] ?? r[6])),
      lat: Number(r[1]),
      lon: Number(r[2]),
    }))
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lon));
}
// Not places to eat, or the homestay itself.
const NOT_FOOD = /^(black\s*&\s*white|beyco|bevco|nesto hyper market)/i;

// ---- road distance from the stay (OSRM), in chunks
async function roadKm(places) {
  const out = new Map();
  const CH = 90;
  for (let i = 0; i < places.length; i += CH) {
    const chunk = places.slice(i, i + CH);
    const coords = [STAY, ...chunk].map((p) => `${p.lon},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA } });
      const j = await res.json();
      if (j.code !== 'Ok') throw new Error(j.code);
      chunk.forEach((p, k) => {
        const m = j.distances[0][k + 1];
        const snap = j.destinations?.[k + 1]?.distance ?? 0;
        // a point more than 1 km from any road has no meaningful driving distance
        out.set(p.id, m == null || snap > 1000 ? null : Math.round((m / 1000) * 10) / 10);
      });
    } catch {
      chunk.forEach((p) => out.set(p.id, null));
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return out;
}

// ---- main
let osmRows;
let osmTimestamp = null;
if (OFFLINE && fs.existsSync(OUT_JSON)) {
  const prev = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
  osmRows = prev.places.filter((p) => p.source === 'openstreetmap');
  osmTimestamp = prev.meta.osm_snapshot;
} else {
  const { elements, timestamp } = await overpass();
  osmTimestamp = timestamp;
  osmRows = elements.map(fromOsm).filter(Boolean);
}
// the same venue can be mapped as both a node and a building outline
const seen = new Map();
osmRows = osmRows.filter((p) => {
  const k = `${norm(p.name)}|${p.lat.toFixed(3)}|${p.lon.toFixed(3)}`;
  if (seen.has(k)) return false;
  seen.set(k, true);
  return true;
});

const manual = siteList().filter((m) => !NOT_FOOD.test(m.name));
let matched = 0;
const extra = [];
const seenManual = new Set();
for (const m of manual) {
  const key = `${norm(m.name)}|${m.lat.toFixed(3)}|${m.lon.toFixed(3)}`;
  if (seenManual.has(key)) continue;
  seenManual.add(key);
  const hit = osmRows.find((p) => (norm(p.name).includes(norm(m.name)) || norm(m.name).includes(norm(p.name))) && meters(p, m) < 400);
  if (hit) {
    hit.site_listed = true;
    matched++;
  } else {
    extra.push({
      id: `site-${norm(m.name)}-${m.lat.toFixed(4)}`,
      name: m.name,
      kind: 'restaurant',
      cuisine: [], lat: m.lat, lon: m.lon, address: null, phone: null, website: null, opening_hours: null,
      vegetarian: /veg(e|i)?t?arian|pure veg/i.test(m.name) ? true : null,
      vegan: null, halal: null, takeaway: null, delivery: null, outdoor_seating: null, wifi: null, wheelchair: null, brand: null,
      source: 'bwstays-listing',
      osm_url: null,
      osm_edit_url: `https://www.openstreetmap.org/note/new#map=18/${m.lat}/${m.lon}`,
      site_listed: true,
      unverified_position: true,
    });
  }
}
const places = [...osmRows, ...extra];
const road = await roadKm(places);
for (const p of places) {
  p.from_stay_straight_km = Math.round((meters(STAY, p) / 1000) * 10) / 10;
  p.from_stay_road_km = road.get(p.id) ?? null;
}
places.sort((a, b) => a.from_stay_straight_km - b.from_stay_straight_km || a.name.localeCompare(b.name));

const has = (f) => places.filter((p) => (Array.isArray(p[f]) ? p[f].length : p[f] != null)).length;
const meta = {
  generated: new Date().toISOString().slice(0, 10),
  osm_snapshot: osmTimestamp,
  count: places.length,
  from_openstreetmap: osmRows.length,
  site_listed_only: extra.length,
  site_listed_matched_in_osm: matched,
  completeness: Object.fromEntries(
    ['address', 'phone', 'website', 'opening_hours', 'cuisine', 'vegetarian', 'takeaway', 'delivery', 'outdoor_seating', 'wifi', 'from_stay_road_km']
      .map((f) => [f, `${has(f)}/${places.length}`]),
  ),
  stay: STAY,
  attribution: 'Place data (c) OpenStreetMap contributors, ODbL 1.0 - https://www.openstreetmap.org/copyright',
  how_to_improve: 'Missing hours, phone or cuisine are left null. Add them to OpenStreetMap (osm_edit_url on each place), then run: node scripts/build-food.mjs',
};
fs.writeFileSync(OUT_JSON, JSON.stringify({ meta, places }, null, 1) + '\n');

const cols = ['id', 'name', 'kind', 'cuisine', 'lat', 'lon', 'address', 'phone', 'website', 'opening_hours', 'vegetarian', 'takeaway', 'delivery', 'from_stay_road_km', 'source', 'osm_url'];
const esc = (v) => {
  const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
fs.writeFileSync(OUT_CSV, [cols.join(','), ...places.map((p) => cols.map((c) => esc(p[c])).join(','))].join('\n') + '\n');

console.log(JSON.stringify(meta, null, 1));
