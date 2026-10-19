#!/usr/bin/env node
/**
 * Scoreboard of the improvement loops: reads the latest reports and appends one row to
 * data/improvement-log.json, so each cycle shows what it found, fixed and what is left.
 *
 *   node scripts/loop-metrics.mjs --cycle 3 --loop links --note "fixed 2 links"
 *   node scripts/loop-metrics.mjs --show          # the table of all rows so far (and the trend)
 *
 * Sources (whatever exists; missing reports are left empty, never guessed):
 *   tests/ui/results/links-report.json   broken / to look at, links clicked
 *   tests/ui/results/compat-report.json  browser x size combinations broken / to look at, small targets, small text
 *   node scripts/verify-data.mjs         data errors / to review / pending / missing / stale (run here, offline)
 *   node scripts/check-dtpc.mjs --offline  site vs DTPC differences (last snapshot)
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG = path.join(ROOT, 'data', 'improvement-log.json');
const argv = process.argv.slice(2);
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };
const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : { _comment: 'One row per loop pass (scripts/loop-metrics.mjs). Lower numbers are better except clicks and places.', rows: [] };

const COLS = [
  ['links_broken', 'link broken'], ['links_look', 'link look-at'], ['clicks', 'clicks'],
  ['compat_broken', 'browser broken'], ['compat_look', 'browser look-at'], ['small_targets', 'small tap targets'], ['small_text', 'small text'],
  ['data_errors', 'data errors'], ['data_review', 'to review'], ['data_missing', 'missing facts'], ['dtpc_differs', 'DTPC differs'],
];

function show() {
  const rows = log.rows;
  if (!rows.length) { console.log('no rows yet'); return; }
  const head = ['#', 'when', 'cycle', 'loop', ...COLS.map(([, h]) => h)];
  const fmt = (r, i) => [i + 1, r.at.slice(5, 16).replace('T', ' '), r.cycle ?? '', r.loop ?? '', ...COLS.map(([k]) => r[k] ?? '–')];
  const table = [head, ...rows.map(fmt)];
  const w = head.map((_, c) => Math.max(...table.map((r) => String(r[c]).length)));
  for (const r of table) console.log(r.map((x, c) => String(x).padStart(w[c])).join('  '));
  const first = rows[0], last = rows[rows.length - 1];
  const hours = (Date.parse(last.at) - Date.parse(first.at)) / 3.6e6;
  const moved = COLS.filter(([k]) => typeof first[k] === 'number' && typeof last[k] === 'number' && first[k] !== last[k]).map(([k, h]) => `${h} ${first[k]} -> ${last[k]}`);
  console.log(`\n${rows.length} passes over ${hours.toFixed(1)} h. ${moved.length ? 'Change: ' + moved.join(', ') : 'No change yet.'}`);
}
if (argv.includes('--show')) { show(); process.exit(0); }

const readJson = (p) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')); } catch { return null; } };
const row = { at: new Date().toISOString(), cycle: opt('--cycle') ? Number(opt('--cycle')) : null, loop: opt('--loop') ?? null, note: opt('--note') ?? null };

const links = readJson('tests/ui/results/links-report.json');
if (links) { row.links_broken = links.failures.length; row.links_look = links.warnings.length; row.clicks = links.stats.clicked; row.links_report_at = links.run?.finished ?? null; }
const compat = readJson('tests/ui/results/compat-report.json');
if (compat) {
  row.compat_broken = compat.results.filter((r) => r.status === 'broken').length;
  row.compat_look = compat.results.filter((r) => r.status === 'look').length;
  const count = (what) => compat.results.reduce((n, r) => n + r.problems.filter((p) => p.what.startsWith(what)).reduce((m, p) => m + (Number((p.detail.match(/^(\d+)/) || [])[1]) || 1), 0), 0);
  row.small_targets = count('tap target');
  row.small_text = count('text smaller');
  row.compat_report_at = compat.run?.finished ?? null;
}
const vd = spawnSync(process.execPath, [path.join(ROOT, 'scripts/verify-data.mjs')], { encoding: 'utf8' });
const m = (vd.stdout || '').match(/errors (\d+) \| to review (\d+) \| pending (\d+) \| missing (\d+) \| stale (\d+)/);
if (m) { row.data_errors = +m[1]; row.data_review = +m[2]; row.data_pending = +m[3]; row.data_missing = +m[4]; row.data_stale = +m[5]; }
const dt = spawnSync(process.execPath, [path.join(ROOT, 'scripts/check-dtpc.mjs'), '--offline'], { encoding: 'utf8' });
const d = (dt.stdout || '').match(/\*\*Differs: (\d+)\*\*/);
if (d) row.dtpc_differs = +d[1];

log.rows.push(row);
fs.writeFileSync(LOG, JSON.stringify(log, null, 1) + '\n');
show();
