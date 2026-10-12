#!/usr/bin/env node
/**
 * Writes data/exchange-rates.json: how many Indian rupees one unit of each
 * currency buys, from the ECB reference rates published by Frankfurter
 * (free, no key). The currency widget shows this dated snapshot immediately
 * and then tries the live API; if the live call fails the snapshot is still a
 * real, dated figure and not a hard-coded guess.
 *
 *   node scripts/update-rates.mjs
 *
 * AED is not an ECB currency. It is pegged to the US dollar at 3.6725, so it
 * is derived from USD/INR. Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'CNY'];
const AED_PER_USD = 3.6725; // official peg
const UA = 'bwstays-data-builder/1.0 (https://www.bwstays.com)';

const rates = {};
let date = null;
for (const code of CURRENCIES) {
  const url = `https://api.frankfurter.dev/v1/latest?base=${code}&symbols=INR`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const j = await res.json();
  const inr = j.rates?.INR;
  if (!(inr > 0)) throw new Error(`${code}: no INR rate`);
  rates[code] = Number(inr.toFixed(4));
  date = date && date > j.date ? date : j.date;
}
rates.AED = Number((rates.USD / AED_PER_USD).toFixed(4));

const out = {
  base: 'INR',
  meaning: 'rates[X] is the number of Indian rupees for 1 unit of X',
  date,
  source: 'ECB reference rates via https://frankfurter.dev (AED derived from USD at the 3.6725 peg)',
  rates: Object.fromEntries(['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'CNY', 'AED'].map((c) => [c, rates[c]])),
};
fs.writeFileSync(path.join(ROOT, 'data/exchange-rates.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out, null, 2));
