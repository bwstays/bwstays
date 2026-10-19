#!/usr/bin/env node
/**
 * The two UI tests split into short runs, for machines or sessions that stop long jobs. Each call is one
 * batch (a few minutes); --combine writes one full report from all batches, which counts as a full run
 * for scripts/loop-metrics.mjs.
 *
 *   node tests/ui/run-batches.mjs links <i> <n>      link test on every n-th page starting at i (0..n-1)
 *   node tests/ui/run-batches.mjs links --combine <n>
 *   node tests/ui/run-batches.mjs compat <browser>    browser test in one browser (chrome, edge, firefox, safari)
 *   node tests/ui/run-batches.mjs compat --combine
 *
 * Batch reports are kept in tests/ui/results/batches/ (not committed).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ROOT, deployedFiles } from './lib/site.mjs';

const RESULTS = path.join(ROOT, 'tests', 'ui', 'results');
const SAVE = path.join(RESULTS, 'batches');
fs.mkdirSync(SAVE, { recursive: true });
const BROWSERS = ['chrome', 'edge', 'firefox', 'safari'];
// the same page list as links.test.mjs
const NOT_PAGES = /^(google[0-9a-f]+|yandex_[0-9a-f]+)\.html$|^(apps-script|scripts|docs|setup|vendor|tests|node_modules)\//;
const pages = [...deployedFiles()].filter((f) => f.endsWith('.html') && !NOT_PAGES.test(f)).sort();
const [kind, ...rest] = process.argv.slice(2);
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const run = (args) => {
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
  console.log((r.stdout || '').trim().split('\n').slice(-6).join('\n'));
  if (r.stderr) console.error(r.stderr.trim().slice(-800));
  return r.status ?? 1;
};

if (kind === 'links' && rest[0] === '--combine') {
  const n = Number(rest[1]);
  const parts = Array.from({ length: n }, (_, i) => readJson(path.join(SAVE, `links-${i}.json`)));
  const covered = new Set(parts.flatMap((p) => p.run.only ?? []));
  const missing = pages.filter((p) => !covered.has(p));
  if (missing.length) { console.error(`pages not covered by the batches: ${missing.join(', ')}`); process.exit(2); }
  const sum = (k) => parts.reduce((a, p) => a + (p.stats?.[k] ?? 0), 0);
  const out = {
    ...parts[0],
    run: { ...parts[0].run, command: `node tests/ui/run-batches.mjs links (all ${pages.length} pages in ${n} batches)`, only: null, batches: parts.map((p) => p.run), finished: parts.at(-1).run.finished },
    stats: { pages: sum('pages'), links: sum('links'), clicked: sum('clicked'), redirects: sum('redirects') },
    pages: parts.flatMap((p) => p.pages ?? []),
    failures: parts.flatMap((p) => p.failures),
    warnings: parts.flatMap((p) => p.warnings),
    external: parts.flatMap((p) => p.external ?? []),
  };
  fs.writeFileSync(path.join(RESULTS, 'links-report.json'), JSON.stringify(out, null, 1));
  run(['tests/ui/report-html.mjs']);
  console.log(`links: ${out.stats.pages} pages, ${out.stats.clicked} clicks, broken ${out.failures.length}, to look at ${out.warnings.length}`);
  process.exit(out.failures.length ? 1 : 0);
}

if (kind === 'links') {
  const [i, n] = rest.map(Number);
  if (!(n > 0 && i >= 0 && i < n)) { console.error('usage: links <i> <n> (0 <= i < n)'); process.exit(2); }
  const mine = pages.filter((_, k) => k % n === i);
  const status = run(['tests/ui/links.test.mjs', '--concurrency', '3', '--page', mine.join(',')]);
  fs.copyFileSync(path.join(RESULTS, 'links-report.json'), path.join(SAVE, `links-${i}.json`));
  console.log(`batch ${i + 1}/${n}: ${mine.length} pages`);
  process.exit(status);
}

if (kind === 'compat' && rest[0] === '--combine') {
  const parts = BROWSERS.map((b) => readJson(path.join(SAVE, `compat-${b}.json`)));
  const out = {
    ...parts[0],
    run: { ...parts[0].run, command: 'node tests/ui/run-batches.mjs compat (4 browsers, one after another)', batches: parts.map((p) => p.run), finished: parts.at(-1).run.finished },
    results: parts.flatMap((p) => p.results),
  };
  fs.writeFileSync(path.join(RESULTS, 'compat-report.json'), JSON.stringify(out, null, 1));
  const { renderCompatReport } = await import(pathToFileURL(path.join(ROOT, 'tests/ui/lib/compat-html.mjs')).href);
  fs.writeFileSync(path.join(RESULTS, 'compat-report.html'), renderCompatReport(out));
  const count = (s) => out.results.filter((r) => r.status === s).length;
  console.log(`browsers: ${out.results.length} combinations, ok ${count('ok')}, to look at ${count('look')}, broken ${count('broken')}`);
  process.exit(count('broken') ? 1 : 0);
}

if (kind === 'compat') {
  const b = rest[0];
  if (!BROWSERS.includes(b)) { console.error(`usage: compat <${BROWSERS.join('|')}>`); process.exit(2); }
  const status = run(['tests/ui/compat.test.mjs', '--browsers', b]);
  fs.copyFileSync(path.join(RESULTS, 'compat-report.json'), path.join(SAVE, `compat-${b}.json`));
  process.exit(status);
}

console.error('usage: node tests/ui/run-batches.mjs links <i> <n> | links --combine <n> | compat <browser> | compat --combine');
process.exit(2);
