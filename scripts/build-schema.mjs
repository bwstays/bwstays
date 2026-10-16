#!/usr/bin/env node
/**
 * Generated structured data (JSON-LD) that must stay in step with the pages:
 *   - bwstays-booking.html : VacationRental (the villa: rate, capacity, beds, bath, amenities, photos, address)
 *                            read from the booking page itself, plus a BreadcrumbList
 *   - every place page     : BreadcrumbList  Home > Places to visit in Wayanad > <place>
 *   - all-locations, all-fooding, footer: already have a breadcrumb inside their WebPage block (left alone)
 *
 *   node scripts/build-schema.mjs           rewrite the generated blocks
 *   node scripts/build-schema.mjs --check   exit 1 if a page is out of date (also run by check.mjs)
 *
 * Only facts shown on the page are used; nothing is invented (no phone number, no rating).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com';
const CHECK = process.argv.includes('--check');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ld = (obj) => `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2)}\n</script>`;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();

function jsonLdBlocks(html) {
  const out = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { out.push(JSON.parse(m[1])); } catch { /* reported by the audit */ }
  }
  return out;
}

const rates = vm.runInNewContext(read('data/rates.js') + ';bwRates');
const index = read('index.html');
const business = jsonLdBlocks(index).find((b) => b['@type'] === 'LocalBusiness');
if (!business) throw new Error('build-schema: LocalBusiness JSON-LD not found in index.html');

let stale = 0;
function put(file, begin, end, block) {
  const f = path.join(ROOT, file);
  const raw = fs.readFileSync(f, 'utf8');
  const crlf = raw.includes('\r\n');
  let t = raw.replace(/\r\n/g, '\n');
  const wrapped = `<!--${begin}-->${block}<!--${end}-->`;
  const re = new RegExp(`<!--${begin}-->[\\s\\S]*?<!--${end}-->`);
  t = re.test(t) ? t.replace(re, () => wrapped) : t.replace('</head>', () => wrapped + '\n</head>');
  const out = crlf ? t.replace(/\n/g, '\r\n') : t;
  if (out !== raw) {
    stale++;
    if (!CHECK) fs.writeFileSync(f, out);
  }
}

// ---------------------------------------------------------------- booking page: the villa
{
  const html = read('bwstays-booking.html');
  const rate = Number((html.match(/price-tag[^>]*>\s*(?:₹|&#8377;)\s*([\d,]+)\s*\/\s*night/i) || [])[1]?.replace(/,/g, ''));
  const beds = Number((html.match(/(\d+)\s*Beds?\b/i) || [])[1]);
  const baths = Number((html.match(/(\d+)\s*Baths?\b/i) || [])[1]);
  const cardAdults = Number((html.match(/fa-user-friends[\s\S]{0,120}?Up to (\d+)\s*Adults?/i) || [])[1]); // adults included in the rate, shown on the card
  const adults = rates.maxAdults; // the large room sleeps up to this many with an extra bed
  const pets = /Pet Friendly/i.test(html); // amenity chip
  const list = html.replace(/<!--[\s\S]*?-->/g, '').match(/<ul class="bk-amenities">([\s\S]*?)<\/ul>/);
  const amenities = list ? [...list[1].matchAll(/<span>([^<]+)<\/span>/g)].map((m) => decode(m[1])) : [];
  const images = [...html.matchAll(/<figure class="bk-g[^"]*">\s*<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  if (!rate || !beds || !adults || amenities.length < 5 || images.length < 3) {
    throw new Error(`build-schema: could not read the villa facts from the booking page (rate ${rate}, beds ${beds}, adults ${adults}, amenities ${amenities.length}, images ${images.length})`);
  }
  if (rate !== rates.perNight) throw new Error(`build-schema: the booking page shows INR ${rate} but data/rates.js says INR ${rates.perNight}`);
  if (cardAdults !== rates.includedAdults) throw new Error(`build-schema: the booking page card says up to ${cardAdults} adults but data/rates.js includes ${rates.includedAdults}`);
  const rental = {
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    '@id': `${SITE}/bwstays-booking.html#villa-stay`,
    name: 'Black and White Stays - Villa Stay',
    identifier: 'bwstays-villa-stay',
    description: `A villa stay in Kalpetta, Wayanad for staycations and workations. The large room sleeps up to ${adults} adults. Rate listed on the booking page: INR ${rate} per night, GST included. Extra bed per night: INR ${rates.extraAdultPerNight} per extra adult and INR ${rates.extraChildPerNight} per extra child, beyond ${rates.includedAdults} adults and ${rates.includedChildren} child.`,
    url: `${SITE}/bwstays-booking.html`,
    image: images,
    latitude: business.geo.latitude,
    longitude: business.geo.longitude,
    address: business.address,
    priceRange: `INR ${rate} per night`,
    availableLanguage: ['en'],
    petsAllowed: pets,
    containsPlace: {
      '@type': 'Accommodation',
      additionalType: 'EntirePlace',
      name: 'Villa Stay',
      occupancy: { '@type': 'QuantitativeValue', value: adults, unitText: 'adults' },
      bed: { '@type': 'BedDetails', numberOfBeds: beds },
      ...(baths ? { numberOfBathroomsTotal: baths } : {}),
      petsAllowed: pets,
      amenityFeature: amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    },
    sameAs: business.sameAs,
  };
  put('bwstays-booking.html', 'lodging-jsonld:begin', 'lodging-jsonld:end', ld(rental));
  put('bwstays-booking.html', 'breadcrumb-jsonld:begin', 'breadcrumb-jsonld:end', ld({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/index.html` },
      { '@type': 'ListItem', position: 2, name: 'Book your stay', item: `${SITE}/bwstays-booking.html` },
    ],
  }));
}

// ---------------------------------------------------------------- place pages
let places = 0;
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith('.html'))) {
  const html = read(f);
  const attraction = jsonLdBlocks(html).find((b) => b['@type'] === 'TouristAttraction');
  if (!attraction) continue;
  places++;
  put(f, 'breadcrumb-jsonld:begin', 'breadcrumb-jsonld:end', ld({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/index.html` },
      { '@type': 'ListItem', position: 2, name: 'Places to visit in Wayanad', item: `${SITE}/all-locations-wayanad.html` },
      { '@type': 'ListItem', position: 3, name: String(attraction.name).replace(/\s+/g, ' ').trim(), item: `${SITE}/${f}` },
    ],
  }));
}

if (CHECK) {
  if (stale) {
    console.error(`structured data is stale on ${stale} block(s): run node scripts/build-schema.mjs`);
    process.exit(1);
  }
  console.log(`structured data is current (villa + ${places} place breadcrumbs)`);
} else {
  console.log(`structured data: ${stale} block(s) written (villa rental on the booking page, breadcrumbs on ${places} place pages + booking)`);
}
