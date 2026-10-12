#!/usr/bin/env node
/**
 * Static MCP generator for BWStays.
 *
 * Builds mcp.json, .well-known/mcp.json, resources/*.json and tools/**\/*.json
 * from the site's own data files and pages, so the MCP output cannot drift from
 * what the website actually says. Nothing here is hand-written marketing copy:
 * if a fact is not on the site it is reported as "not published" rather than
 * invented.
 *
 *   node scripts/generate-mcp.mjs            # regenerate files
 *   node scripts/generate-mcp.mjs --check    # fail if committed files are stale
 *
 * Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com';
const CHECK = process.argv.includes('--check');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

// ---------------------------------------------------------------- helpers
const decodeEntities = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
const text = (html) =>
  decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slug = (s) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const must = (cond, msg) => {
  if (!cond) throw new Error(`generate-mcp: ${msg}`);
};
const warnings = [];
/** A same-site page URL, or null (with a warning) when the file is not in the repo. */
const sitePage = (u) => {
  if (!u || !u.startsWith(SITE)) return null;
  const rel = decodeURIComponent(new URL(u).pathname).replace(/^\//, '');
  if (!fs.existsSync(path.join(ROOT, rel))) {
    warnings.push(`page not found, link dropped: ${u}`);
    return null;
  }
  return u;
};

/** Evaluate a browser-style data file (`const x = {...}`) and return named globals. */
function loadGlobals(file, names) {
  const ctx = vm.createContext({});
  vm.runInContext(`${read(file)}\n;this.__out = {${names.join(',')}};`, ctx, { filename: file });
  return ctx.__out;
}

// ---------------------------------------------------------------- sources
const { siteData } = loadGlobals('data/sitedata.js', ['siteData']);
const { shopdata } = loadGlobals('data/shopdata.js', ['shopdata']);
const { locations } = loadGlobals('data/nearbylocationsdata.js', ['locations']);
// faq.js also wires up DOM handlers, so evaluate only the array literal.
const faqSrc = read('js/faq.js').match(/const faqData\s*=\s*(\[[\s\S]*?\r?\n\]);/);
must(faqSrc, 'faqData array not found in js/faq.js');
const faqData = vm.runInNewContext(`(${faqSrc[1]})`);
const { booking: bookedRaw } = loadGlobals('data/bookingdata.js', ['booking']);
const { closed: closedRaw } = loadGlobals('data/closeddata.js', ['closed']);

const indexHtml = read('index.html');
const villaHtml = read('villa1.html');
const bookingHtml = read('bwstays-booking.html');
const footerHtml = read('footer.html');

// ---------------------------------------------------------------- facts
function jsonLd(html, type) {
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const d = JSON.parse(m[1]);
      if (d['@type'] === type || (Array.isArray(d['@type']) && d['@type'].includes(type))) return d;
    } catch {
      /* invalid blocks are reported by the site audit, not here */
    }
  }
  return null;
}
const business = jsonLd(indexHtml, 'LocalBusiness');
must(business, 'LocalBusiness JSON-LD missing from index.html');

const emailB64 = indexHtml.match(/data-email="([A-Za-z0-9+/=]+)"/);
must(emailB64, 'obfuscated email missing from index.html');
const EMAIL = Buffer.from(emailB64[1], 'base64').toString('utf8');
const whatsapp = indexHtml.match(/https:\/\/wa\.me\/(\d+)/)?.[1] ?? null;

// The site publishes only a masked phone ("+-- --- --- ----") and a
// 9999999999-pattern WhatsApp link. Treat as unverified instead of asserting it.
const phoneIsPlaceholder = !whatsapp || /^(\d)\1{3,}|9999999999$/.test(whatsapp);
const WHATSAPP_LINK = phoneIsPlaceholder ? null : `https://wa.me/${whatsapp}`;

const villaPrice = villaHtml.match(/From\s*(?:&#8377;|₹)\s*([\d,]+)\s*\/\s*Night/i);
must(villaPrice, 'villa1.html starting price not found');
const villaDetails = [...villaHtml.slice(villaHtml.indexOf('id="amenities"')).matchAll(
  /detail-value[^>]*>\s*([^<]*)</g,
)].map((m) => m[1].trim()).filter(Boolean);
must(villaDetails.length > 5, 'villa1.html amenity list not found');
// First two tiles are room count and capacity; "Premium" + "Utensils" is one
// amenity the page splits across two tiles.
const villaAmenities = villaDetails
  .slice(2)
  .join('|')
  .replace('Premium|Utensils', 'Premium Utensils')
  .split('|');

const bookingVillas = [...bookingHtml.matchAll(
  /<h5 class="mb-0">\s*(Luxury Villa[^<]*)<\/h5>\s*<span class="price-tag[^>]*>\s*(?:₹|&#8377;)\s*([\d,]+)\s*\/\s*night/gi,
)].map((m) => ({ name: m[1].trim().replace(/\s+/g, ' '), price: Number(m[2].replace(/,/g, '')) }));
must(bookingVillas.length >= 1, 'bwstays-booking.html villa cards not found');
const arrivalSlots = [...bookingHtml.matchAll(/<option[^>]*>\s*(\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M|After \d{1,2}:\d{2} [AP]M)\s*</g)]
  .map((m) => m[1]);

// Terms of service paragraphs from footer.html (verbatim, trimmed): the "Terms of Service"
// and "Responsibility" cards, in page order.
const legalCard = (id) => {
  const m = footerHtml.match(new RegExp('<section class="legal-card" id="' + id + '">([\\s\\S]*?)</section>'));
  return m ? [...m[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((x) => text(x[1])).filter((t) => t.length > 20) : [];
};
const termsParagraphs = [...legalCard('section-tc'), ...legalCard('section-responsibility')];
must(termsParagraphs.length >= 5, 'terms paragraphs not found in footer.html');
const privacyParagraph = legalCard('section-privacy')[0] ?? '';
must(privacyParagraph, 'privacy paragraph not found in footer.html');

// ---------------------------------------------------------------- attractions
const CATEGORY_LABELS = {
  plantation: 'Plantations', waterfalls: 'Waterfalls & Lakes', museums: 'Museums & Crafts',
  romantic: 'Romantic Spots & Viewpoints', culthist: 'Cultural & Historical', trucking: 'Trekking',
  wildlife: 'Wildlife', farms: 'Farm Visits', sporting: 'Sporting', food: 'Food', tribal: 'Tribal',
  cycling: 'Cycling', shopping: 'Shopping', pilgrimage: 'Pilgrimage',
};
// `stays` holds placeholder rows ("Sample", +91-000 000 0000) - never publish them.
const SKIPPED_CATEGORIES = new Set(['stays']);

const attractions = [];
for (const [category, rows] of Object.entries(siteData)) {
  if (SKIPPED_CATEGORIES.has(category)) continue;
  for (const r of rows) {
    attractions.push({
      id: `${category}-${r.id}`,
      name: r.name,
      category,
      category_label: CATEGORY_LABELS[category] ?? category,
      description: (r.description ?? '').replace(/\.+$/, '').trim(),
      distance_from_stay_km: num(r.distance),
      typical_visit_duration: r.duration || null,
      rating: num(r.rating),
      best_seasons: r.seasontovisit ?? [],
      transport: r.transport || null,
      coordinates: (() => {
        const [lat, lng] = String(r.latlong ?? '').split(',').map((v) => Number(v.trim()));
        return Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : null;
      })(),
      map_url: r.map || null,
      page_url: sitePage(r.knowmore),
    });
  }
}
must(attractions.length > 50, 'attraction extraction produced too few rows');

// ---- editorial review (data/mcp-review.json)
// Records stay in data/sitedata.js because each attraction page renders by id;
// the review only changes what is published to AI consumers.
const reviewEntries = JSON.parse(read('data/mcp-review.json')).entries;
const excluded = [];
const knownIds = new Set(attractions.map((a) => a.id));
for (const id of Object.keys(reviewEntries)) {
  must(knownIds.has(id), `data/mcp-review.json: no attraction with id ${id}`);
}
for (let i = attractions.length - 1; i >= 0; i--) {
  const a = attractions[i];
  const rv = reviewEntries[a.id];
  a.district = rv?.district ?? null;
  a.locality = rv?.locality ?? null;
  a.review_note = rv?.note ?? null;
  if (!rv) continue;
  if (rv.exclude) {
    excluded.unshift({ name: a.name.trim(), reason: rv.exclude });
    attractions.splice(i, 1);
    continue;
  }
  for (const f of rv.withhold ?? []) {
    if (f === 'distance') a.distance_from_stay_km = null;
    else if (f === 'coordinates') a.coordinates = null;
    else if (f === 'description') a.description = null;
    else throw new Error(`generate-mcp: unknown withhold field "${f}" for ${a.id}`);
  }
}

// ---- reliability filter
// data/sitedata.js carries template defaults that are not facts about the place:
// `fee` is "0" for 76 of 85 rows (including sanctuaries that charge entry),
// `timing` is 09:00-17:00 for 48, `holidays` is "Sun" for 70, and one boilerplate
// description is reused across unrelated places. Those fields are therefore not
// published; the rest is published only when it passes basic consistency checks.
const STAY_POINT = [business.geo.latitude, business.geo.longitude];
const straightKm = (lat, lng) => {
  const rad = (d) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat - STAY_POINT[0]) / 2) ** 2 +
    Math.cos(rad(STAY_POINT[0])) * Math.cos(rad(lat)) * Math.sin(rad(lng - STAY_POINT[1]) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};
const count = (arr, key) => arr.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map());
const descCount = count(attractions, (a) => a.description);
const pointCount = count(attractions, (a) => (a.coordinates ? `${a.coordinates.latitude},${a.coordinates.longitude}` : ''));
const reliability = { descriptions_withheld: 0, coordinates_withheld: 0, distances_withheld: 0 };
for (const a of attractions) {
  if (!a.description || descCount.get(a.description) > 1) {
    if (a.description) reliability.descriptions_withheld++;
    a.description = null;
  }
  if (a.coordinates) {
    const key = `${a.coordinates.latitude},${a.coordinates.longitude}`;
    if (pointCount.get(key) > 1) {
      reliability.coordinates_withheld++;
      a.coordinates = null;
    }
  }
  if (a.coordinates && a.distance_from_stay_km != null) {
    const line = straightKm(a.coordinates.latitude, a.coordinates.longitude);
    // A road distance cannot be meaningfully shorter than the straight line.
    if (a.distance_from_stay_km < line * 0.8 - 1) {
      reliability.distances_withheld++;
      a.distance_from_stay_km = null;
    }
  }
}
const rawRows = Object.entries(siteData).filter(([c]) => !SKIPPED_CATEGORIES.has(c)).flatMap(([, rows]) => rows);
const feeZero = rawRows.filter((r) => Number(r.fee) === 0 && r.fee !== '').length;
const mostCommonTiming = [...count(rawRows, (r) => (r.timing ?? []).join(',')).entries()].sort((a, b) => b[1] - a[1])[0];
const ATTRACTION_DATA_NOTE =
  `Entry fees, opening hours and weekly holidays are not published: the source data holds template defaults ` +
  `(fee 0 for ${feeZero} of ${rawRows.length} places, ${mostCommonTiming[0]} for ${mostCommonTiming[1]}). ` +
  `Descriptions and coordinates shared between unrelated places, and distances shorter than the straight-line ` +
  `distance, are withheld (null). Confirm details before relying on them.`;
const byDistance = (a, b) =>
  (a.distance_from_stay_km ?? 1e9) - (b.distance_from_stay_km ?? 1e9) || a.name.localeCompare(b.name);

const shops = Object.entries(shopdata).flatMap(([kind, rows]) =>
  rows.map((r) => ({
    name: r.name,
    kind,
    description: (r.description ?? '').replace(/\.+$/, '').trim(),
    distance_from_stay_km: num(r.distance),
    rating: num(r.rating),
    map_url: r.map || null,
    page_url: sitePage(r.knowmore),
  })),
);

// ---------------------------------------------------------------- food and distances
const foodFile = JSON.parse(read('data/food-places.json'));
const foodPlaces = foodFile.places.map((p) => ({
  name: p.name,
  kind: p.kind.replace('shop:', ''),
  cuisine: p.cuisine,
  lat: p.lat,
  lon: p.lon,
  address: p.address,
  phone: p.phone,
  website: p.website,
  opening_hours: p.opening_hours,
  vegetarian: p.vegetarian,
  takeaway: p.takeaway,
  delivery: p.delivery,
  from_stay_road_km: p.from_stay_road_km,
  position_unverified: p.unverified_position === true,
  osm_url: p.osm_url,
}));
const placeIds = Object.keys(locations.names).map(Number).sort((a, b) => a - b);
// ids are unique across data/sitedata.js; places excluded by the fact-check are not offered as neighbours
const excludedIds = new Set(
  Object.entries(reviewEntries).filter(([, v]) => v.exclude).map(([k]) => Number(k.split('-').pop())),
);
const kmBetween = (a, b) =>
  a === b ? 0 : excludedIds.has(a) || excludedIds.has(b) ? null : locations.distances[a]?.[b - 1] || null;

// ---------------------------------------------------------------- availability
const pad = (n) => String(n).padStart(2, '0');
const isoDate = (s) => {
  const m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
};
const toRanges = (pairs) =>
  pairs
    .map(([from, to]) => ({ from: isoDate(from), to: isoDate(to || from) }))
    .filter((r) => r.from)
    .map((r) => ({ from: r.from, to: r.to || r.from }));

const builtAt = new Date();
const BUILD_DATE = builtAt.toISOString().slice(0, 10);

// ---------------------------------------------------------------- output model
const META = (type, source) => ({ generated: BUILD_DATE, version: '2.0.0', type, source, generator: 'scripts/generate-mcp.mjs' });
const NOT_PUBLISHED = 'Not published on bwstays.com - confirm with the host before relying on it.';

const properties = [
  {
    id: 'villa1',
    name: 'Luxury Villa 1 - Ground Floor',
    page_url: `${SITE}/villa1.html`,
    type: 'Entire villa',
    rooms: 2,
    max_guests: 'Up to 8 adults (villa page); booking form lists 2 guests per villa',
    price_from_inr_per_night: Number(villaPrice[1].replace(/,/g, '')),
    price_listed_on_booking_form_inr_per_night: bookingVillas[0]?.price ?? null,
    amenities: villaAmenities,
    pets_allowed: true,
  },
  ...(bookingVillas[1]
    ? [{
        id: 'villa2',
        name: bookingVillas[1].name.replace(/\s*-\s*/, ' - '),
        page_url: null,
        type: 'Entire villa',
        price_listed_on_booking_form_inr_per_night: bookingVillas[1].price,
        pets_allowed: true,
        note: 'Listed on the booking form only; the site has no dedicated villa2 page.',
      }]
    : []),
];

const dataQualityNotes = [
  'villa1.html ("up to 8 adults", from INR 3,999/night) and bwstays-booking.html ("2 guests", INR 5,000/night) disagree. Both are reported; confirm current rate and capacity with the host.',
  'No verified phone number is published: the site masks it and the WhatsApp link uses a placeholder-pattern number.',
  'Payment and cancellation terms on the site are written for tours ("tour commencement date") and are quoted verbatim, not reinterpreted.',
];

const resources = {
  about: {
    description: 'Who Black and White Stays is, where it is, and how to reach it',
    content: {
      name: business.name,
      tagline: 'STAY CONNECTED, STAY CLOSE, STAY RELAXED',
      summary: business.description,
      website: SITE,
      concept: 'Colive, Cowork & Coplay - villas for vacations and workations in Kalpetta, Wayanad',
      location: {
        locality: business.address.addressLocality,
        region: 'Kerala',
        country: 'India',
        postal_code: business.address.postalCode,
        coordinates: business.geo ? { latitude: business.geo.latitude, longitude: business.geo.longitude } : null,
      },
      open_hours: '24 hours, 7 days a week (per structured data on index.html)',
      social: (business.sameAs ?? []).map((u) => u.replace(/\/$/, '')),
      languages_offered_on_site: ['English', 'Spanish', 'French'],
      data_quality_notes: dataQualityNotes,
    },
    source: 'index.html',
  },
  properties: {
    description: 'Villas offered by Black and White Stays with the rate and capacity the site publishes',
    content: {
      count: properties.length,
      properties,
      data_quality_notes: dataQualityNotes.slice(0, 1),
    },
    source: 'villa1.html, bwstays-booking.html',
  },
  amenities: {
    description: 'Amenities listed on the villa page',
    content: {
      property: 'villa1',
      amenities: villaAmenities,
      rooms: 2,
      max_guests_per_villa_page: 'Up to 8 adults',
      pets_allowed: true,
    },
    source: 'villa1.html',
  },
  booking: {
    description: 'How to book, what the booking form asks for, and how to make contact',
    content: {
      booking_page: `${SITE}/bwstays-booking.html`,
      process: [
        'Choose check-in and check-out dates on the booking page',
        'Select a villa',
        'Enter guest information, pick an arrival window and accept the Terms and Cancellation Policy',
        'Submit the reservation',
      ],
      arrival_windows: arrivalSlots,
      nightly_rate_on_booking_form_inr: bookingVillas.map((v) => ({ villa: v.name, inr_per_night: v.price })),
      payment_terms_quoted_from_site: termsParagraphs.slice(0, 5),
      contact: {
        email: EMAIL,
        whatsapp_link: WHATSAPP_LINK,
        phone: null,
        phone_note: 'The site masks its phone number and its WhatsApp link uses a placeholder-pattern number, so neither is published here. Use email or the booking page.',
        contact_form: `${SITE}/index.html#signup`,
      },
    },
    source: 'bwstays-booking.html, footer.html, index.html',
  },
  policies: {
    description: 'Terms of service and privacy statement, quoted from footer.html',
    content: {
      terms_url: `${SITE}/footer.html`,
      terms_of_service: termsParagraphs,
      privacy: privacyParagraph,
      note: 'Quoted verbatim. Cancellation and refund specifics are referenced on the booking page but not spelled out there.',
    },
    source: 'footer.html',
  },
  attractions: {
    description: 'Places to visit around Kalpetta, Wayanad - distances are kilometres from the stay',
    content: {
      destination: 'Wayanad, Kerala',
      count: attractions.length,
      categories: Object.fromEntries(
        Object.keys(CATEGORY_LABELS)
          .filter((c) => attractions.some((a) => a.category === c))
          .map((c) => [c, { label: CATEGORY_LABELS[c], count: attractions.filter((a) => a.category === c).length }]),
      ),
      data_quality: {
        note: ATTRACTION_DATA_NOTE,
        ...reliability,
        excluded_after_fact_check: excluded,
      },
      attractions: [...attractions].sort(byDistance),
    },
    source: 'data/sitedata.js',
  },
  location: {
    description: 'Where the stay is and how far common destinations are',
    content: {
      address: { locality: 'Kalpetta', district: 'Wayanad', state: 'Kerala', country: 'India', postal_code: business.address.postalCode },
      coordinates: business.geo ? { latitude: business.geo.latitude, longitude: business.geo.longitude } : null,
      nearest_attractions: [...attractions].filter((a) => a.distance_from_stay_km != null).sort(byDistance).slice(0, 15)
        .map((a) => ({ name: a.name, category: a.category_label, distance_km: a.distance_from_stay_km })),
      nearby_places_indexed: Object.keys(locations.names).length,
      local_shopping: shops.slice().sort(byDistance),
      coordinate_note: 'data/sitedata.js places the property near 11.5352, 76.1789 while structured data uses 11.6058, 76.0833; verify before navigation.',
    },
    source: 'index.html, data/sitedata.js, data/shopdata.js, data/nearbylocationsdata.js',
  },
  food: {
    description: 'Places to eat and drink in Wayanad (OpenStreetMap data), with driving distance from the stay',
    content: {
      attribution: foodFile.meta.attribution,
      generated: foodFile.meta.generated,
      count: foodFile.places.length,
      completeness: foodFile.meta.completeness,
      how_to_improve: foodFile.meta.how_to_improve,
      note: 'Hours, phone and cuisine are null where not recorded; they are not guessed.',
      places: foodPlaces,
    },
    source: 'data/food-places.json',
  },
  distances: {
    description: 'Driving distance in km between 90 Wayanad places (null = not computed)',
    content: {
      unit: 'km, fastest driving route on OpenStreetMap data, averaged over both directions, rounded',
      attribution: 'Routing data (c) OpenStreetMap contributors, ODbL',
      generated: locations.meta?.generated ?? null,
      usage: 'matrix[i][j] is the distance from places[i] to places[j]; the matrix is symmetric.',
      places: placeIds.map((id) => ({
        id,
        name: locations.names[id].trim(),
        ...(excludedIds.has(id) ? { excluded: 'failed the web fact-check; see resources/attractions.json' } : {}),
      })),
      matrix: placeIds.map((a) => placeIds.map((b) => kmBetween(a, b))),
      places_without_trusted_coordinates: locations.meta?.places_without_trusted_coordinates ?? [],
    },
    source: 'data/nearbylocationsdata.js',
  },
  help: {
    description: 'Frequently asked questions shown on the site',
    content: { faq: faqData.map((f) => ({ question: f.question, answer: f.answer })) },
    source: 'js/faq.js',
  },
};

// ---------------------------------------------------------------- tools
const norm = (s) => String(s).toLowerCase();
// Tool outputs carry a compact record; the full detail lives in resources/attractions.json.
const brief = (a) => ({
  name: a.name,
  category: a.category_label,
  distance_from_stay_km: a.distance_from_stay_km,
  rating: a.rating,
  district: a.district ?? 'Wayanad',
  note: a.review_note,
  page_url: a.page_url,
});
const pick = (pred, cmp = byDistance) => attractions.filter(pred).sort(cmp).map(brief);
const attractionResponses = [
  ...Object.keys(CATEGORY_LABELS)
    .filter((c) => attractions.some((a) => a.category === c))
    .map((c) => ({
      input: { category: c },
      output: { label: CATEGORY_LABELS[c], results: pick((a) => a.category === c) },
    })),
  { input: { max_distance_km: 10 }, output: { results: pick((a) => (a.distance_from_stay_km ?? 1e9) <= 10) } },
  { input: { max_distance_km: 25 }, output: { results: pick((a) => (a.distance_from_stay_km ?? 1e9) <= 25) } },
  {
    input: { top_rated: true },
    output: { results: pick((a) => (a.rating ?? 0) >= 4.6, (a, b) => b.rating - a.rating || byDistance(a, b)) },
  },
];

const bookedRanges = toRanges(bookedRaw);
const closedRanges = toRanges(closedRaw);
const isPast = (r) => r.to < BUILD_DATE;

const tools = {
  'search/attractions': {
    name: 'search_attractions',
    description: 'Look up attractions by category, distance, entry fee or rating (pre-computed)',
    responses: attractionResponses,
    default_response: {
      message: 'Use one of the pre-computed inputs: category, max_distance_km (10 or 25), top_rated.',
      categories: Object.keys(CATEGORY_LABELS),
      data_quality: ATTRACTION_DATA_NOTE,
    },
  },
  'search/properties': {
    name: 'search_properties',
    description: 'List the villas the site publishes',
    responses: [
      { input: { query: 'all' }, output: { results: properties } },
      ...properties.map((p) => ({ input: { id: p.id }, output: { results: [p] } })),
      { input: { pets: true }, output: { results: properties.filter((p) => p.pets_allowed) } },
    ],
  },
  'search/food': {
    name: 'search_food',
    description: 'Find places to eat near the stay by kind, diet or distance (pre-computed, OpenStreetMap data)',
    responses: (() => {
      const brief = (p) => ({
        name: p.name,
        kind: p.kind,
        cuisine: p.cuisine,
        from_stay_road_km: p.from_stay_road_km,
        opening_hours: p.opening_hours,
        phone: p.phone,
        osm_url: p.osm_url,
      });
      const byDist = (a, b) => (a.from_stay_road_km ?? 1e9) - (b.from_stay_road_km ?? 1e9) || a.name.localeCompare(b.name);
      const pick = (pred) => foodPlaces.filter(pred).sort(byDist).map(brief);
      const out = [
        { input: { max_distance_km: 1 }, output: { results: pick((p) => (p.from_stay_road_km ?? 1e9) <= 1) } },
        { input: { max_distance_km: 3 }, output: { results: pick((p) => (p.from_stay_road_km ?? 1e9) <= 3) } },
        { input: { vegetarian: true }, output: { results: pick((p) => p.vegetarian).slice(0, 40) } },
        { input: { has_opening_hours: true }, output: { results: pick((p) => p.opening_hours).slice(0, 40) } },
      ];
      for (const kind of ['restaurant', 'cafe', 'bakery', 'fast_food']) {
        out.push({ input: { kind }, output: { results: pick((p) => p.kind === kind).slice(0, 40) } });
      }
      return out;
    })(),
    default_response: {
      message: 'Use max_distance_km (1 or 3), vegetarian, has_opening_hours, or kind (restaurant, cafe, bakery, fast_food).',
      attribution: foodFile.meta.attribution,
    },
  },
  'search/nearby': {
    name: 'nearby_places',
    description: 'The closest attractions to each place by driving distance (pre-computed)',
    responses: placeIds
      .filter((id) => placeIds.some((o) => o !== id && kmBetween(id, o)))
      .map((id) => ({
        input: { place_id: id, place: locations.names[id].trim() },
        output: {
          nearest: placeIds
            .filter((o) => o !== id && kmBetween(id, o))
            .map((o) => ({ id: o, name: locations.names[o].trim(), distance_km: kmBetween(id, o) }))
            .sort((a, b) => a.distance_km - b.distance_km || a.name.localeCompare(b.name))
            .slice(0, 8),
        },
      })),
    default_response: {
      message: 'Look up a place by id or exact name; the full matrix is in resources/distances.json.',
    },
  },
  'booking/availability': {
    name: 'check_availability',
    description: 'Dates the site marks as booked or closed. Static snapshot - not live inventory.',
    responses: [
      {
        input: { property: 'all' },
        output: {
          booked_ranges: bookedRanges,
          closed_ranges: closedRanges,
          snapshot_date: BUILD_DATE,
          all_listed_ranges_are_in_the_past: [...bookedRanges, ...closedRanges].every(isPast),
          availability_feed: `${SITE}/bwstays-room-availabilty.xml`,
          instruction: 'This is a build-time snapshot. Direct the guest to the booking page to confirm live availability.',
        },
      },
    ],
    default_response: {
      status: 'unknown',
      booking_page: `${SITE}/bwstays-booking.html`,
      message: 'Availability is not pre-computed for arbitrary dates. Use the booking page or contact the host.',
    },
  },
  'booking/pricing': {
    name: 'get_pricing',
    description: 'Nightly rates exactly as published on the site',
    responses: [
      {
        input: { property: 'villa1' },
        output: {
          from_inr_per_night: properties[0].price_from_inr_per_night,
          booking_form_inr_per_night: properties[0].price_listed_on_booking_form_inr_per_night,
          gst: 'Terms state fees are inclusive of 18% GST',
          note: 'The two prices come from different pages and are not reconciled by the site.',
        },
      },
      ...(bookingVillas[1]
        ? [{ input: { property: 'villa2' }, output: { booking_form_inr_per_night: bookingVillas[1].price, note: properties[1].note } }]
        : []),
    ],
    default_response: { message: NOT_PUBLISHED, booking_page: `${SITE}/bwstays-booking.html` },
  },
  'booking/contact': {
    name: 'contact_info',
    description: 'How to reach Black and White Stays',
    responses: [
      {
        input: { purpose: 'booking' },
        output: {
          email: EMAIL,
          whatsapp_link: WHATSAPP_LINK,
          phone: null,
          booking_page: `${SITE}/bwstays-booking.html`,
          note: 'No verified phone or WhatsApp number is published on the site; use email or the booking page.',
        },
      },
    ],
    default_response: { email: EMAIL, website: SITE },
  },
};

// ---------------------------------------------------------------- manifest
const manifest = {
  name: 'bwstays',
  version: '2.0.0',
  description: 'AI context for Black and White Stays - villas and workation stays in Kalpetta, Wayanad, Kerala',
  metadata: {
    generated: BUILD_DATE,
    generator: 'scripts/generate-mcp.mjs',
    source: SITE,
    contact: EMAIL,
  },
  resources: Object.entries(resources).map(([name, r]) => ({
    name,
    description: r.description,
    path: `/resources/${name}.json`,
  })),
  tools: Object.entries(tools).map(([p, t]) => ({
    name: t.name,
    description: t.description,
    path: `/tools/${p}.json`,
  })),
};

// ---------------------------------------------------------------- write
const outputs = new Map();
const put = (rel, obj) => outputs.set(rel, `${JSON.stringify(obj, null, 2)}\n`);

put('mcp.json', manifest);
put('.well-known/mcp.json', manifest);
for (const [name, r] of Object.entries(resources)) {
  put(`resources/${name}.json`, {
    name,
    description: r.description,
    content: r.content,
    metadata: META('json', r.source),
  });
}
for (const [p, t] of Object.entries(tools)) {
  put(`tools/${p}.json`, { ...t, metadata: META('json', 'generated from site data') });
}

// Guard: every manifest path must correspond to an output.
for (const e of [...manifest.resources, ...manifest.tools]) {
  must(outputs.has(e.path.replace(/^\//, '')), `manifest path without output: ${e.path}`);
}

// Files this generator owns that no longer have an output are removed.
const owned = (dir) =>
  fs.existsSync(path.join(ROOT, dir))
    ? fs.readdirSync(path.join(ROOT, dir), { recursive: true, withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith('.json'))
        .map((d) => path.relative(ROOT, path.join(d.parentPath ?? d.path, d.name)).replace(/\\/g, '/'))
    : [];
const stale = [...owned('resources'), ...owned('tools')].filter((f) => !outputs.has(f));

// `generated` is a date, so --check ignores it to avoid failing every midnight.
const stripDate = (s) => s.replace(/"generated": "\d{4}-\d{2}-\d{2}"/g, '"generated": "-"');
let drift = 0;
for (const [rel, body] of outputs) {
  const abs = path.join(ROOT, rel);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n') : null;
  if (CHECK) {
    if (current === null || stripDate(current) !== stripDate(body)) {
      console.error(`stale: ${rel}`);
      drift++;
    }
    continue;
  }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
}
if (CHECK) {
  for (const f of stale) {
    console.error(`orphan: ${f}`);
    drift++;
  }
  if (drift) {
    console.error(`MCP files out of date (${drift}). Run: node scripts/generate-mcp.mjs`);
    process.exit(1);
  }
  console.log(`MCP files up to date (${outputs.size} files).`);
} else {
  for (const f of stale) fs.rmSync(path.join(ROOT, f));
  console.log(`wrote ${outputs.size} files${stale.length ? `, removed ${stale.length} orphan(s): ${stale.join(', ')}` : ''}`);
}
for (const w of new Set(warnings)) console.warn(`warning: ${w}`);
