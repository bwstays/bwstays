#!/usr/bin/env node
/**
 * Keeps llms.txt and llms-full.txt in step with the site's data.
 *
 * The two files are written by hand (page summaries, cancellation policy, ...). This script owns
 * ONE block at the end of each, between
 *     <!-- BEGIN GENERATED: site-data -->   and   <!-- END GENERATED: site-data -->
 * and rewrites only that block from the same sources the Static MCP files use, so the text an AI
 * assistant (and the site chat, which reads llms-full.txt) sees cannot drift from mcp.json.
 *
 *   node scripts/build-llms.mjs           # rewrite the block in both files
 *   node scripts/build-llms.mjs --check   # exit 1 if a block is stale (the snapshot date is ignored)
 *
 * Run it after node scripts/generate-mcp.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SITE = 'https://www.bwstays.com';
const BEGIN = '<!-- BEGIN GENERATED: site-data -->';
const END = '<!-- END GENERATED: site-data -->';
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

const mcp = json('mcp.json');
const charging = json('resources/charging_and_fuel.json').content;
const availability = json('tools/booking/availability.json').responses[0].output;
const ctx = vm.createContext({});
vm.runInContext(`${read('data/sitedata.js')}\n;this.__v = siteData;`, ctx);
const shops = ctx.__v.shopping ?? [];
const snapshot = mcp.metadata.generated;

const has = (v) => v !== undefined && v !== null && String(v).trim() !== '' && !/^(na|n\/a)$/i.test(String(v).trim());

// ---------------------------------------------------------------- llms.txt (short)
const short = [
  BEGIN,
  '## Machine-readable data (generated from the site data)',
  '',
  `Snapshot: ${snapshot}`,
  '',
  `- [Static MCP manifest](${SITE}/mcp.json): ${mcp.resources.length} resources and ${mcp.tools.length} tools, pre-built JSON, no server`,
  `- [LLMFeed](${SITE}/.well-known/mcp.llmfeed.json): the same capabilities in LLMFeed format`,
  `- [Full text](${SITE}/llms-full.txt): all page text, policies and data summaries`,
  ...mcp.resources.map((r) => `- [${r.name}](${SITE}${r.path}): ${r.description}`),
  ...mcp.tools.map((t) => `- [tool ${t.name}](${SITE}${t.path}): ${t.description}`),
  '',
  '- Availability: the host keeps booked and closed dates in a calendar that is copied into the booking page every 30 minutes; only today to one year ahead can be booked. Confirm on the booking page: ' + `${SITE}/bwstays-booking.html`,
  '- The website is an installable web app and keeps saved pages available offline.',
  END,
  '',
].join('\n');

// ---------------------------------------------------------------- llms-full.txt (detailed)
const lines = [BEGIN, '## Site data summary (generated; the MCP files hold the full detail)', '', `Snapshot: ${snapshot}`, ''];

lines.push('### Booking, availability and cancellation');
lines.push(`- Booking page: ${SITE}/bwstays-booking.html. Dates can be chosen from today up to one year ahead; past dates are not selectable.`);
lines.push('- The booking form sends a booking request by email. Dates are held only after the host confirms by email; dates already asked for show as Requested on the calendar.');
lines.push(`- Availability data: ${availability.data_source}`);
lines.push(`- Stay rule: ${availability.nights_rule}`);
lines.push(
  availability.no_dates_listed
    ? '- Right now no booked or closed dates are marked in the calendar. That means none are entered yet, not that every date is confirmed free; always confirm on the booking page.'
    : `- Booked ranges listed: ${availability.booked_ranges.length}; closed ranges listed: ${availability.closed_ranges.length}.`
);
lines.push(`- Cancellation, refund and date-change terms: ${SITE}/footer.html#cancellation`);
lines.push('');

const villa = json('resources/properties.json').content.properties[0];
lines.push('### The villa');
lines.push(`- ${villa.name}: the only stay offered. Book and see photos, the video tour and amenities on ${villa.page_url}.`);
lines.push(`- Rate listed on the booking page: INR ${villa.price_listed_on_booking_form_inr_per_night} per night, GST included. Beds: ${villa.beds}. Capacity: ${villa.max_guests}.`);
lines.push(`- Extra child (per night): INR ${villa.extra_bed.extra_child_inr_per_night} for each child beyond the ${villa.extra_bed.included_in_nightly_rate} included in the nightly rate; the booking form accepts up to ${villa.extra_bed.max_adults} adults and ${villa.extra_bed.max_children} children.`);
lines.push(`- Amenities: ${villa.amenities.join(', ')}. Pets allowed: ${villa.pets_allowed ? 'yes' : 'no'}.`, '');

const faq = json('resources/help.json').content.faq;
lines.push(`### Frequently asked questions (${SITE}/footer.html#faq)`);
for (const f of faq) lines.push(`- Q: ${f.question} A: ${f.answer} (${f.url})`);
lines.push('');

lines.push('### Shopping places (listed on the site)');
for (const s of shops) {
  const bits = [s.name];
  if (has(s.description)) bits.push(String(s.description).replace(/\s+/g, ' ').trim());
  const extra = [];
  if (has(s.timing && s.timing.join ? s.timing.join(', ') : s.timing)) extra.push(`hours ${[].concat(s.timing).join(', ')}`);
  if (has(s.holidays)) extra.push(`closed ${s.holidays}`);
  if (has(s.distance)) extra.push(`${s.distance} km from Kalpetta`);
  if (has(s.map)) extra.push(`map ${s.map}`);
  lines.push(`- ${bits.join(': ')}${extra.length ? ` (${extra.join('; ')})` : ''}`);
}
lines.push('- Details that are not listed (hours, phone, rating) are not published; ask the host.', '');

lines.push('### EV charging near the stay');
lines.push(`- ${charging.ev_charging.count} stations are listed, nearest first. Positions are approximate and not yet verified on the ground; OpenStreetMap has no charging stations mapped in Wayanad.`);
for (const x of charging.ev_charging.stations.slice(0, 12)) {
  lines.push(`- ${x.name}${x.operator && x.operator !== x.name ? ` (${x.operator})` : ''}: ${x.distance_km} km from the stay (${x.latitude}, ${x.longitude})`);
}
lines.push('');

lines.push('### Fuel stations near the stay');
lines.push(`- ${charging.fuel.count} fuel stations from OpenStreetMap (c) OpenStreetMap contributors, ODbL. Opening hours and phone numbers are given only where OpenStreetMap records them.`);
for (const x of charging.fuel.stations.slice(0, 12)) {
  const fuels = x.fuels.length ? `; ${x.fuels.join(', ')}` : '';
  const hours = x.opening_hours ? `; hours ${x.opening_hours}` : '';
  lines.push(`- ${x.name}: ${x.distance_km} km from the stay (${x.latitude}, ${x.longitude})${fuels}${hours}`);
}
lines.push(`- Full lists: ${SITE}/resources/charging_and_fuel.json`, '');

lines.push('### Web app');
lines.push('- The site can be installed on a phone (Add to Home Screen) and keeps pages, places, food, charging and fuel lists, and policies available offline. Live availability, booking submit, chat and weather need a connection.');
lines.push(END, '');
const full = lines.join('\n');

// ---------------------------------------------------------------- write / check
function withBlock(file, block) {
  const abs = path.join(ROOT, file);
  const raw = fs.readFileSync(abs, 'utf8');
  const crlf = raw.includes('\r\n');
  const text = raw.replace(/\r\n/g, '\n');
  const a = text.indexOf(BEGIN);
  const b = text.indexOf(END);
  let out;
  if (a !== -1 && b !== -1 && b > a) {
    out = text.slice(0, a) + block.replace(/\n$/, '') + text.slice(b + END.length);
  } else {
    out = text.replace(/\s*$/, '') + '\n\n' + block;
  }
  return { abs, out, crlf };
}
const stripSnapshot = (s) => s.replace(/Snapshot: \d{4}-\d{2}-\d{2}/g, 'Snapshot: -');

let stale = 0;
for (const [file, block] of [['llms.txt', short], ['llms-full.txt', full]]) {
  const { abs, out, crlf } = withBlock(file, block);
  const cur = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
  if (CHECK) {
    if (stripSnapshot(cur) !== stripSnapshot(out)) {
      console.error(`${file} is stale: run node scripts/build-llms.mjs`);
      stale++;
    }
  } else {
    fs.writeFileSync(abs, crlf ? out.replace(/\n/g, '\r\n') : out);
    console.log(`${file}: generated block updated (${(out.length / 1024).toFixed(0)} KB total)`);
  }
}
if (CHECK) {
  if (stale) process.exit(1);
  console.log('llms.txt and llms-full.txt are current');
}
