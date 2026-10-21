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
const { bwRates } = loadGlobals('data/rates.js', ['bwRates']);
const { locations } = loadGlobals('data/nearbylocationsdata.js', ['locations']);
// faq.js also wires up DOM handlers, so evaluate only the array literal.
const faqSrc = read('js/faq.js').match(/const faqData\s*=\s*(\[[\s\S]*?\r?\n\]);/);
must(faqSrc, 'faqData array not found in js/faq.js');
const faqData = vm.runInNewContext(`(${faqSrc[1]})`);
const { booking: bookedRaw } = loadGlobals('data/bookingdata.js', ['booking']);
const { closed: closedRaw } = loadGlobals('data/closeddata.js', ['closed']);

const evFile = JSON.parse(read('data/ev-stations.json'));
const fuelFile = JSON.parse(read('data/fuel-places.json'));

const indexHtml = read('index.html');
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

// The amenity chips, the card facts and the rate all come from the booking page
// (commented-out chips are ignored).
const amenityBlock = bookingHtml.replace(/<!--[\s\S]*?-->/g, '').match(/<ul class="bk-amenities">([\s\S]*?)<\/ul>/);
must(amenityBlock, 'bwstays-booking.html amenity list not found');
const amenityChips = [...amenityBlock[1].matchAll(/<span>([^<]+)<\/span>/g)]
  .map((m) => m[1].replace(/&amp;/g, '&').trim())
  .filter(Boolean);
must(amenityChips.length > 5, 'bwstays-booking.html amenity list is too short');
const villaAmenities = amenityChips;
const cardFacts = bookingHtml.match(/(\d+)\s*Beds?[\s\S]{0,300}?Up to (\d+)\s*Adults?/i);
must(cardFacts, 'bwstays-booking.html villa card facts not found');
const villaBeds = Number(cardFacts[1]);
const cardAdults = Number(cardFacts[2]); // adults included in the rate (shown on the card)
must(cardAdults === bwRates.maxAdults, `bwstays-booking.html card says up to ${cardAdults} adults but data/rates.js allows ${bwRates.maxAdults}`);
const villaMaxAdults = bwRates.maxAdults; // booking limit

const bookingVillas = [...bookingHtml.matchAll(
  /<h5[^>]*class="mb-0"[^>]*>\s*(Villa Stay[^<]*)<\/h5>\s*<span class="price-tag[^>]*>\s*(?:₹|&#8377;)\s*([\d,]+)\s*\/\s*night/gi,
)].map((m) => ({ name: m[1].trim().replace(/\s+/g, ' '), price: Number(m[2].replace(/,/g, '')) }));
must(bookingVillas.length >= 1, 'bwstays-booking.html villa cards not found');
must(bookingVillas[0].price === bwRates.perNight, `bwstays-booking.html shows INR ${bookingVillas[0].price} but data/rates.js says INR ${bwRates.perNight}`);
const extraBed = {
  included_in_nightly_rate: `${bwRates.includedAdults} adults and ${bwRates.includedChildren} child (0-12 years)`,
  extra_child_inr_per_night: bwRates.extraChildPerNight,
  max_adults: bwRates.maxAdults,
  max_children: bwRates.maxChildren,
  gst: 'Rates include GST (the Terms state fees are inclusive of 18% GST)',
};
const arrivalSlots = [...bookingHtml.matchAll(/<option[^>]*>\s*(\d{1,2}:\d{2} [AP]M - \d{1,2}:\d{2} [AP]M|After \d{1,2}:\d{2} [AP]M)\s*</g)]
  .map((m) => m[1]);

// Terms of service paragraphs from footer.html (verbatim, trimmed): the "Terms of Service"
// and "Responsibility" cards, in page order.
const legalCard = (id) => {
  const m = footerHtml.match(new RegExp('<section class="legal-card" id="' + id + '">([\\s\\S]*?)</section>'));
  return m ? [...m[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((x) => text(x[1])).filter((t) => t.length > 20) : [];
};
const termsParagraphs = [...legalCard('section-tc'), ...legalCard('section-responsibility')];
const cancellationParagraphs = legalCard('section-cancellation');
must(cancellationParagraphs.length >= 5, 'cancellation paragraphs not found in footer.html');
must(termsParagraphs.length >= 5, 'terms paragraphs not found in footer.html');
const privacyParagraph = legalCard('section-privacy')[0] ?? '';
must(privacyParagraph, 'privacy paragraph not found in footer.html');

// ---------------------------------------------------------------- attractions
const CATEGORY_LABELS = {
  plantation: 'Plantations', waterfalls: 'Waterfalls & Lakes', museums: 'Museums & Crafts',
  romantic: 'Romantic Spots & Viewpoints', culthist: 'Cultural & Historical', trucking: 'Trekking',
  wildlife: 'Wildlife', farms: 'Farm Visits', sporting: 'Sporting', food: 'Food', tribal: 'Tribal',
  cycling: 'Cycling', shopping: 'Shopping', pilgrimage: 'Pilgrimage', health: 'Health & Wellness',
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
// provenance of the facts (data/verification.json, kept up to date by scripts/verify-data.mjs): only
// medium/high confidence official sources are published, with the link and the date they were checked
const verificationFile = fs.existsSync(path.join(ROOT, 'data/verification.json')) ? JSON.parse(read('data/verification.json')).places : {};
const officialFact = (f) => (f && f.value && f.source_url && ['high', 'medium'].includes(f.confidence) ? { value: f.value, source_url: f.source_url, confidence: f.confidence } : null);
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
  const vr = verificationFile[Number(a.id.split('-').pop())];
  a.verification = vr
    ? {
        last_checked: vr.checked ?? null,
        coordinate_source: vr.coordinate?.osm_ref ? `OpenStreetMap ${vr.coordinate.osm_ref}` : null,
        official_timing: officialFact(vr.timing),
        official_fee: officialFact(vr.fee),
      }
    : null;
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
const durationCount = count(attractions, (a) => a.typical_visit_duration ?? '');
const reliability = { descriptions_withheld: 0, coordinates_withheld: 0, distances_withheld: 0, durations_withheld: 0 };
for (const a of attractions) {
  // the same visit duration on many unrelated places is a template default, not a fact
  if (a.typical_visit_duration && durationCount.get(a.typical_visit_duration) > 2) {
    reliability.durations_withheld++;
    a.typical_visit_duration = null;
  }
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

// ---------------------------------------------------------------- charging and fuel
const evStations = evFile.stations
  .map((x) => ({
    id: x.id,
    name: x.name,
    operator: x.operator ?? null,
    latitude: x.lat,
    longitude: x.lon,
    distance_km: Number(straightKm(x.lat, x.lon).toFixed(1)),
    verified: Boolean(x.verified),
  }))
  .sort((a, b) => a.distance_km - b.distance_km);
const fuelStations = fuelFile.places
  .map((x) => ({
    id: x.id,
    name: x.name,
    brand: x.brand ?? null,
    latitude: x.lat,
    longitude: x.lon,
    distance_km: Number(straightKm(x.lat, x.lon).toFixed(1)),
    fuels: x.fuels ?? [],
    opening_hours: x.opening_hours ?? null,
    phone: x.phone ?? null,
    osm_url: x.osm_url ?? null,
  }))
  .sort((a, b) => a.distance_km - b.distance_km);

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
    id: 'villa_stay',
    name: 'Villa Stay',
    page_url: `${SITE}/bwstays-booking.html`,
    type: 'Entire villa',
    beds: villaBeds,
    max_guests: `Up to ${villaMaxAdults} adults and ${bwRates.maxChildren} children (booking limit)`,
    price_listed_on_booking_form_inr_per_night: bookingVillas[0]?.price ?? null,
    extra_bed: extraBed,
    amenities: villaAmenities,
    pets_allowed: true,
  },
];

const dataQualityNotes = [
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
      concept: 'Colive, Cowork & Coplay - a villa stay for vacations and workations in Kalpetta, Wayanad',
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
      web_app: {
        installable: true,
        works_offline: 'pages, places, food, charging and fuel lists, policies; not live availability, booking submit, chat or weather',
        manifest: `${SITE}/manifest.json`,
      },
      data_quality_notes: dataQualityNotes,
    },
    source: 'index.html',
  },
  properties: {
    description: 'The villa stay offered by Black and White Stays, with the rate and capacity the booking page publishes',
    content: {
      count: properties.length,
      properties,
      data_quality_notes: [],
    },
    source: 'bwstays-booking.html',
  },
  amenities: {
    description: 'Amenities listed on the booking page',
    content: {
      property: 'villa_stay',
      amenities: villaAmenities,
      beds: villaBeds,
      max_adults: villaMaxAdults,
      pets_allowed: true,
    },
    source: 'bwstays-booking.html',
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
      is_a_request: 'The booking form sends a booking request by email. The dates are held only after the host confirms by email; dates already asked for show as Requested on the calendar and stay selectable.',
      arrival_windows: arrivalSlots,
      nightly_rate_on_booking_form_inr: bookingVillas.map((v) => ({ villa: v.name, inr_per_night: v.price })),
      extra_bed: extraBed,
      payment_terms_quoted_from_site: termsParagraphs.slice(0, 5),
      contact: {
        email: EMAIL,
        whatsapp_link: WHATSAPP_LINK,
        phone: null,
        phone_note: 'The site masks its phone number and its WhatsApp link uses a placeholder-pattern number, so neither is published here. Use email or the booking page.',
        contact_form: `${SITE}/#signup`,
      },
    },
    source: 'bwstays-booking.html, footer.html, index.html',
  },
  policies: {
    description: 'Terms of service and privacy statement, quoted from footer.html',
    content: {
      terms_url: `${SITE}/footer.html`,
      faq_url: `${SITE}/footer.html#faq`,
      terms_of_service: termsParagraphs,
      cancellations_and_refunds: cancellationParagraphs,
      cancellation_url: `${SITE}/footer.html#cancellation`,
      privacy: privacyParagraph,
      note: 'Quoted verbatim from footer.html.',
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
    description: `Driving distance in km between ${placeIds.length} Wayanad places (null = not computed)`,
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
  charging_and_fuel: {
    description: 'EV charging stations and fuel stations around the stay, with straight-line distance from the stay',
    content: {
      stay: { name: business.name, coordinates: { latitude: STAY_POINT[0], longitude: STAY_POINT[1] } },
      distance_note: 'distance_km is the straight-line distance from the stay, not a driving distance.',
      ev_charging: {
        count: evFile.stations.length,
        note: evFile.note,
        verified_count: evFile.stations.filter((x) => x.verified).length,
        warning:
          'OpenStreetMap has no charging stations mapped in Wayanad. This list is kept by hand from places already shown on the site; positions are approximate until verified on the ground.',
        stations: evStations,
      },
      fuel: {
        count: fuelFile.places.length,
        attribution: fuelFile.source,
        generated: fuelFile.generated,
        note: 'Opening hours and phone numbers are null where OpenStreetMap does not record them; they are not guessed.',
        stations: fuelStations,
      },
    },
    source: 'data/ev-stations.json, data/fuel-places.json',
  },
  help: {
    description: 'Frequently asked questions shown on the site (footer page, #faq)',
    content: { faq: faqData.map((f, i) => ({ question: f.question, answer: f.answer, url: `${SITE}/footer.html#faq-${i + 1}` })) },
    source: 'js/faq.js (shown on footer.html#faq)',
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
    description: 'The villa stay the booking page publishes',
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
          no_dates_listed: bookedRanges.length + closedRanges.length === 0,
          all_listed_ranges_are_in_the_past:
            bookedRanges.length + closedRanges.length > 0 && [...bookedRanges, ...closedRanges].every(isPast),
          data_source:
            'The host keeps booked and closed dates in a Google Calendar; a scheduled job copies the next 365 days into data/bookingdata.js and data/closeddata.js every 30 minutes.',
          booking_window: 'today up to one year ahead; earlier dates cannot be booked',
          nights_rule: 'A stay may end (check-out) on a booked day, but no night of the stay may be booked or closed.',
          instruction:
            'This is a build-time snapshot. An empty list means no dates are marked yet, not that every date is free. Direct the guest to the booking page to confirm live availability.',
        },
      },
    ],
    default_response: {
      status: 'unknown',
      booking_page: `${SITE}/bwstays-booking.html`,
      message: 'Availability is not pre-computed for arbitrary dates. Use the booking page or contact the host.',
    },
  },
  'search/charging': {
    name: 'nearby_charging_and_fuel',
    description: 'Closest EV charging stations and fuel stations to the stay (pre-computed, straight-line km)',
    responses: [
      { input: { kind: 'ev', limit: 5 }, output: { results: evStations.slice(0, 5), note: 'Positions are approximate and not yet verified on the ground.' } },
      { input: { kind: 'fuel', limit: 5 }, output: { results: fuelStations.slice(0, 5) } },
      { input: { kind: 'ev', within_km: 25 }, output: { results: evStations.filter((x) => x.distance_km <= 25) } },
      { input: { kind: 'fuel', within_km: 15 }, output: { results: fuelStations.filter((x) => x.distance_km <= 15) } },
    ],
    default_response: {
      message: 'Use one of the pre-computed inputs: kind ev or fuel with limit 5, or within_km 25 (ev) / 15 (fuel).',
      full_lists: `${SITE}/resources/charging_and_fuel.json`,
    },
  },
  'booking/pricing': {
    name: 'get_pricing',
    description: 'Nightly rates exactly as published on the site',
    responses: [
      {
        input: { property: 'villa_stay' },
        output: {
          booking_form_inr_per_night: properties[0].price_listed_on_booking_form_inr_per_night,
          extra_bed: extraBed,
          gst: extraBed.gst,
          note: 'Rate as listed on the booking page.',
        },
      },
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
  description: 'AI context for Black and White Stays - a villa stay for vacations and workations in Kalpetta, Wayanad, Kerala',
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
const stripDate = (s) => s.replace(/"(generated|snapshot_date)": "\d{4}-\d{2}-\d{2}"/g, '"$1": "-"');
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
