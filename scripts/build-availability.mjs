#!/usr/bin/env node
/**
 * Builds the booking calendar data from calendar feeds (iCal / .ics), free.
 *
 *   data/bookingdata.js  -> var booking = [[from, to], ...]   (booked nights)
 *   data/closeddata.js   -> var closed  = [[from, to], ...]   (closed days)
 *   data/pendingdata.js  -> var pending = [[from, to], ...]   (requested, not yet confirmed)
 *
 * The page, the MCP files and the booking report already read these two files,
 * so nothing else changes. Only the window today .. today + 365 days is kept,
 * and no event titles, guest names or other details are written.
 *
 * Feeds come from the environment variable BW_ICAL_URLS (a GitHub Actions
 * secret, because a "secret iCal address" works like a password). One feed per
 * line or separated by spaces/commas, each optionally prefixed with its type:
 *
 *   booked|https://calendar.google.com/calendar/ical/.../basic.ics
 *   closed|https://calendar.google.com/calendar/ical/.../basic.ics
 *   pending|https://calendar.google.com/calendar/ical/.../basic.ics   (the "Booking requests" calendar)
 *   https://www.airbnb.com/calendar/ical/....ics        (type decided by title)
 *
 * Without a prefix an event counts as closed when its title contains
 * closed / block / maintenance / owner / not available, otherwise as booked.
 *
 * Fail safe: if any feed cannot be read, nothing is written and the exit code
 * is 1, so the last good files stay in place.
 *
 *   node scripts/build-availability.mjs            # fetch and write
 *   node scripts/build-availability.mjs --dry-run  # fetch and print only
 *   node scripts/build-availability.mjs --file a.ics[,b.ics]  # local files (testing)
 */
import fs from 'node:fs';

const DRY = process.argv.includes('--dry-run');
const fileArg = process.argv.indexOf('--file');
const DAYS = 365;
const CLOSED_RE = /closed|block|maintenance|owner|not available|unavailable/i;

const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (s) => new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));

function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

// Returns [{start: Date, end: Date, title}] where end is the last blocked day (inclusive).
function parseIcs(text) {
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('not an iCal feed');
  const events = [];
  let ev = null;
  let warnedRecurring = false;
  for (const line of unfold(text)) {
    if (/^BEGIN:VEVENT/i.test(line)) { ev = {}; continue; }
    if (/^END:VEVENT/i.test(line)) {
      if (ev && ev.start) {
        const start = parseDay(ev.start);
        let end;
        if (ev.end) {
          end = parseDay(ev.end);
          // DTEND is the check-out day, so the last blocked night is the day before;
          // a timed event that starts and ends on one day blocks just that day
          if (end > start) end.setDate(end.getDate() - 1);
        } else {
          end = new Date(start);
        }
        if (end < start) end = new Date(start);
        if (!ev.cancelled) events.push({ start, end, title: ev.title || '' });
      }
      ev = null;
      continue;
    }
    if (!ev) continue;
    const m = line.match(/^([A-Z-]+)((?:;[^:]*)?):(.*)$/i);
    if (!m) continue;
    const name = m[1].toUpperCase();
    const val = m[3].trim();
    if (name === 'DTSTART') ev.start = val.slice(0, 8);
    else if (name === 'DTEND') { ev.end = val.slice(0, 8); ev.endRaw = val; }
    else if (name === 'SUMMARY') ev.title = val;
    else if (name === 'STATUS' && /CANCELLED/i.test(val)) ev.cancelled = true;
    else if (name === 'RRULE' && !warnedRecurring) {
      warnedRecurring = true;
      console.warn('warning: repeating events are not expanded; add each block as its own event');
    }
  }
  return events;
}

function parseSources(raw) {
  return raw.split(/[\s,]+/).filter(Boolean).map((tok) => {
    const m = tok.match(/^(booked|closed|pending)\|(.+)$/i);
    return m ? { type: m[1].toLowerCase(), url: m[2] } : { type: null, url: tok };
  });
}

async function load() {
  if (fileArg > 0) {
    return process.argv[fileArg + 1].split(',').map((f) => ({
      type: null, label: f, text: fs.readFileSync(f, 'utf8'),
    }));
  }
  const raw = process.env.BW_ICAL_URLS || '';
  const sources = parseSources(raw);
  if (!sources.length) {
    console.error('BW_ICAL_URLS is empty: nothing to do (add the calendar iCal links as a repository secret).');
    process.exit(2);
  }
  const out = [];
  for (const s of sources) {
    const res = await fetch(s.url, { headers: { 'User-Agent': 'bwstays-availability/1.0' } });
    if (!res.ok) throw new Error(`feed ${out.length + 1} returned HTTP ${res.status}`);
    out.push({ type: s.type, label: `feed ${out.length + 1}`, text: await res.text() });
  }
  return out;
}

// Merge sorted day lists into [from, to] ranges of consecutive days.
function toRanges(daySet) {
  const days = [...daySet].sort();
  const ranges = [];
  for (const d of days) {
    const last = ranges[ranges.length - 1];
    if (last) {
      const next = new Date(last[1] + 'T00:00:00');
      next.setDate(next.getDate() + 1);
      if (iso(next) === d) { last[1] = d; continue; }
    }
    ranges.push([d, d]);
  }
  return ranges;
}

function render(varName, ranges, label) {
  const rows = ranges.map(([a, b]) => `\t["${a}", "${b === a ? '' : b}"]`).join(',\n');
  return `// ${label}\n// Generated by scripts/build-availability.mjs from the calendar feeds; do not edit by hand.\n` +
    `// Each entry is [from, to]; an empty "to" is a single day. Days from today to one year ahead only.\n` +
    `var ${varName} = [\n${rows}\n];\n`;
}

const sources = await load();
const today = new Date();
today.setHours(0, 0, 0, 0);
const limit = new Date(today);
limit.setDate(limit.getDate() + DAYS);

const booked = new Set();
const closed = new Set();
const pending = new Set();
let seen = 0;
for (const src of sources) {
  const events = parseIcs(src.text);
  seen += events.length;
  for (const e of events) {
    const type = src.type || (CLOSED_RE.test(e.title) ? 'closed' : 'booked');
    const target = type === 'closed' ? closed : type === 'pending' ? pending : booked;
    for (const d = new Date(e.start); d <= e.end; d.setDate(d.getDate() + 1)) {
      if (d >= today && d <= limit) target.add(iso(d));
    }
  }
}
// a day that is closed is shown as closed, not as booked
for (const d of closed) booked.delete(d);
// a requested day that is already booked or closed is shown as booked or closed
for (const d of [...booked, ...closed]) pending.delete(d);

const bookedRanges = toRanges(booked);
const closedRanges = toRanges(closed);
const pendingRanges = toRanges(pending);
console.log(`events read: ${seen} | booked ranges: ${bookedRanges.length} (${booked.size} days) | closed ranges: ${closedRanges.length} (${closed.size} days) | requested ranges: ${pendingRanges.length} (${pending.size} days)`);
console.log(`window: ${iso(today)} .. ${iso(limit)}`);

if (DRY) process.exit(0);
fs.writeFileSync('data/bookingdata.js', render('booking', bookedRanges, 'Booked nights'));
fs.writeFileSync('data/closeddata.js', render('closed', closedRanges, 'Closed days'));
fs.writeFileSync('data/pendingdata.js', render('pending', pendingRanges, 'Requested days (not yet confirmed)'));
console.log('wrote data/bookingdata.js, data/closeddata.js and data/pendingdata.js');
