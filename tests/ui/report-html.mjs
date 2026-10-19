#!/usr/bin/env node
/**
 * Writes the HTML report from a links-report.json (links.test.mjs already does this after each run;
 * use this for an older report or a copied one).
 *
 *   node tests/ui/report-html.mjs                                  # tests/ui/results/links-report.json -> .html
 *   node tests/ui/report-html.mjs path/to/links-report.json out.html
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/site.mjs';
import { renderReport } from './lib/report-html.mjs';

const input = path.resolve(process.argv[2] ?? path.join(ROOT, 'tests', 'ui', 'results', 'links-report.json'));
const output = path.resolve(process.argv[3] ?? input.replace(/\.json$/i, '.html'));
const report = JSON.parse(fs.readFileSync(input, 'utf8'));

// reports written before the run details were recorded: take them from the Markdown report beside it
const fallback = {};
const md = input.replace(/\.json$/i, '.md');
if (!report.run && fs.existsSync(md)) {
  const t = fs.readFileSync(md, 'utf8');
  const m = t.match(/^Run: (\S+)\s+·\s+(\d+) s/m);
  if (m) {
    fallback.finished = m[1];
    fallback.seconds = Number(m[2]);
    fallback.started = new Date(Date.parse(m[1]) - Number(m[2]) * 1000).toISOString();
  }
  const o = t.match(/site pages linked: (\d+)\s+·\s+outside links: (\d+)( \(checked\))?/);
  if (o) { fallback.siteTargets = Number(o[1]); fallback.outsideLinks = Number(o[2]); fallback.outsideChecked = !!o[3]; }
  fallback.command = (report.external?.length ? 'node tests/ui/links.test.mjs --external' : 'node tests/ui/links.test.mjs');
}
fs.writeFileSync(output, renderReport(report, fallback));
console.log(`wrote ${path.relative(process.cwd(), output) || output}`);
