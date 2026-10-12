#!/usr/bin/env node
/**
 * Builds data/booking-reports.json for reports/bwstays-total-booking.html from
 * the booking calendar the site already publishes (data/bookingdata.js and
 * data/closeddata.js).
 *
 * The calendar only records which days are booked or closed. It has no guest
 * names, villa, party size or amounts, so none are invented: those fields are
 * null and the report shows them as "not recorded".
 *
 *   node scripts/build-booking-report.mjs
 *
 * Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (file, name) => {
  const ctx = vm.createContext({});
  vm.runInContext(`${fs.readFileSync(path.join(ROOT, file), 'utf8')}\n;this.__v = ${name};`, ctx, { filename: file });
  return ctx.__v;
};
const booked = load('data/bookingdata.js', 'booking');
const closed = load('data/closeddata.js', 'closed');

const pad = (n) => String(n).padStart(2, '0');
const iso = (s) => {
  const m = String(s ?? '').match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  return m ? `${m[1]}-${pad(m[2])}-${pad(m[3])}` : null;
};
const addDay = (d) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};
const nightsBetween = (from, toInclusive) => {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${toInclusive}T00:00:00Z`);
  return Math.round((b - a) / 86400000) + 1;
};

function rows(list, kind) {
  const out = [];
  for (const [from, to] of list) {
    const start = iso(from);
    const end = iso(to) ?? start;
    if (!start) continue;
    out.push({
      bookingId: `${kind === 'booked' ? 'CAL' : 'CLOSED'}-${start}`,
      propertyId: 'all',
      propertyName: 'All villas',
      guestName: null,
      checkIn: start,
      checkOut: addDay(end),
      nights: nightsBetween(start, end),
      guests: null,
      status: kind === 'booked' ? 'confirmed' : 'closed',
      amount: null,
      bookingDate: null,
    });
  }
  return out;
}

const bookings = [...rows(booked, 'booked'), ...rows(closed, 'closed')].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
const out = {
  generated: new Date().toISOString().slice(0, 10),
  source: 'data/bookingdata.js and data/closeddata.js (the booking calendar)',
  note: 'The calendar records booked and closed days only. Guest names, villa, party size and amounts are not recorded and are null.',
  latest_entry: bookings.length ? bookings[bookings.length - 1].checkIn : null,
  bookings,
};
fs.writeFileSync(path.join(ROOT, 'data/booking-reports.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`wrote data/booking-reports.json: ${bookings.length} calendar entries, latest ${out.latest_entry}`);
