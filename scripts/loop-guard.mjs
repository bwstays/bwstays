#!/usr/bin/env node
/**
 * Guard rails of the improvement loops (/improve-cycle). Run it at the two points the cycle names:
 *
 *   node scripts/loop-guard.mjs --start            # before a cycle: may it run today?
 *   node scripts/loop-guard.mjs --merge            # before merging the cycle branch: is the change within limits?
 *
 * Exit code 0 = go, 1 = stop (the reason is printed). The loop must stop, not work around it.
 *
 * --start   stops when: today already has MAX_CYCLES_PER_DAY finished cycles; the last 2 cycles ended
 *           with a failed gate; the last 2 finished cycles changed nothing on the scoreboard; the working
 *           tree is not clean.
 * --merge   compares the current branch with main and stops when: a protected file changed (rates,
 *           booking, availability, policies, FAQ, terms, workflows, this script); more than
 *           MAX_DATA_CHANGES place records changed in data/sitedata.js; more than MAX_PAGES hand-edited
 *           pages changed (pages whose only change is regenerated content - prerendered blocks, asset
 *           versions, structured data, sitemap dates - are not counted); a published fact (timing, fee,
 *           Contact, latlong, holidays) changed without the place's entry in data/verification.json
 *           changing in the same branch.
 *           On success it creates the restore tag restore-before-cycle-<n> on main (one step back).
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_CYCLES_PER_DAY = 6;
const MAX_DATA_CHANGES = 10;
const MAX_PAGES = 20;
const PROTECTED = [
  /^data\/rates\.js$/, /^data\/bookingdata\.js$/, /^data\/closeddata\.js$/, /^data\/pendingdata\.js$/,
  /^bwstays-booking\.html$/, /^footer\.html$/, /^js\/faq\.js$/, /^js\/booking\.js$/, /^js\/pdfgen\.js$/,
  /^apps-script\//, /^\.github\/workflows\//, /^CNAME$/, /^robots\.txt$/, /^scripts\/loop-guard\.mjs$/,
];
// generated files: never count as hand edits
const GENERATED = /(\.min\.(js|css)(\.map)?$|^sw\.js$|^assets-min\.json$|^mcp\.json$|^\.well-known\/|^resources\/|^tools\/|sitemap|^llms(-full)?\.txt$|^data\/(search-index|map-places|improvement-log|dtpc-snapshot)\.json$)/;
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim();
const stop = (msg) => { console.error(`STOP: ${msg}`); process.exit(1); };
const argv = process.argv.slice(2);

const logPath = path.join(ROOT, 'data', 'improvement-log.json');
const rows = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')).rows : [];
const ends = rows.filter((r) => r.loop === 'cycle-end');

if (argv.includes('--start')) {
  if (git('status', '--porcelain')) stop('the working tree is not clean');
  const today = new Date().toISOString().slice(0, 10);
  const doneToday = ends.filter((r) => r.at.startsWith(today)).length;
  if (doneToday >= MAX_CYCLES_PER_DAY) stop(`${doneToday} cycles already finished today (limit ${MAX_CYCLES_PER_DAY})`);
  const last2 = ends.slice(-2);
  if (last2.length === 2 && last2.every((r) => /gate failed/i.test(r.note ?? ''))) stop('the last 2 cycles ended with a failed gate: a person should look first');
  const KEYS = ['links_broken', 'links_look', 'compat_broken', 'compat_look', 'small_targets', 'small_text', 'data_errors', 'data_review', 'data_missing', 'dtpc_differs'];
  if (ends.length >= 3) {
    const [a, b, c] = ends.slice(-3);
    const same = (x, y) => KEYS.every((k) => (x[k] ?? null) === (y[k] ?? null));
    if (same(a, b) && same(b, c)) stop('the last 2 cycles changed nothing on the scoreboard: the loops have run out of work they can do alone (see the owner items)');
  }
  const next = Math.max(0, ...rows.map((r) => r.cycle ?? 0)) + 1;
  console.log(`GO: cycle ${next} may start (${doneToday}/${MAX_CYCLES_PER_DAY} today)`);
  process.exit(0);
}

if (argv.includes('--merge')) {
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  const m = branch.match(/^improve\/cycle-(\d+)$/);
  if (!m) stop(`not on an improve/cycle-<n> branch (on ${branch})`);
  const base = git('merge-base', 'main', 'HEAD');
  const changed = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean);
  // hand-edited pages: a page whose diff is only regenerated content does not count
  // the page with every regenerated part removed: prerendered blocks, ?v= asset versions, breadcrumbs
  const strip = (html) => html.replace(/\r\n/g, '\n')
    .replace(/<!--prerender:begin-->[\s\S]*?<!--prerender:end-->/g, '')
    .replace(/<!--breadcrumb-jsonld:begin-->[\s\S]*?<!--breadcrumb-jsonld:end-->/g, '')
    .replace(/<!--lodging-jsonld:begin-->[\s\S]*?<!--lodging-jsonld:end-->/g, '')
    .replace(/\?v=[0-9a-f]+/g, '');
  const show = (rev, f) => { try { return git('show', `${rev}:${f}`); } catch { return ''; } };
  const handEdited = (f) => (f.endsWith('.html') ? strip(show(base, f)) !== strip(show('HEAD', f)) : true);
  const prot = changed.filter((f) => PROTECTED.some((re) => re.test(f)) && handEdited(f));
  if (prot.length) stop(`protected files changed: ${prot.join(', ')}`);

  // place records changed in data/sitedata.js, and facts changed without evidence
  const load = (rev) => {
    let src;
    try { src = git('show', `${rev}:data/sitedata.js`); } catch { return {}; }
    const ctx = vm.createContext({});
    vm.runInContext(`${src}\n;this.__v = siteData;`, ctx);
    return Object.fromEntries(Object.values(ctx.__v).flat().map((r) => [r.id, r]));
  };
  const before = load(base), after = load('HEAD');
  const changedIds = Object.keys({ ...before, ...after }).filter((id) => JSON.stringify(before[id]) !== JSON.stringify(after[id]));
  if (changedIds.length > MAX_DATA_CHANGES) stop(`${changedIds.length} place records changed (limit ${MAX_DATA_CHANGES}): ${changedIds.join(', ')}`);
  const vb = (() => { try { return JSON.parse(git('show', `${base}:data/verification.json`)).places; } catch { return {}; } })();
  const va = (() => { try { return JSON.parse(git('show', 'HEAD:data/verification.json')).places; } catch { return {}; } })();
  const FACTS = ['timing', 'fee', 'Contact', 'latlong', 'holidays'];
  const noEvidence = changedIds.filter((id) => FACTS.some((k) => JSON.stringify(before[id]?.[k]) !== JSON.stringify(after[id]?.[k])) && JSON.stringify(vb[id]) === JSON.stringify(va[id]));
  if (noEvidence.length) stop(`facts changed without evidence in data/verification.json for place(s) ${noEvidence.join(', ')}`);

  const pages = changed.filter((f) => f.endsWith('.html') && !GENERATED.test(f) && handEdited(f));
  if (pages.length > MAX_PAGES) stop(`${pages.length} pages edited by hand (limit ${MAX_PAGES}): ${pages.slice(0, 30).join(', ')}`);

  const tag = `restore-before-cycle-${m[1]}`;
  if (!git('tag', '-l', tag)) git('tag', tag, 'main');
  console.log(`GO: merge allowed (${changedIds.length} place records, ${pages.length} hand-edited pages, no protected files). Restore point: tag ${tag} on main (push it with the merge: git push origin ${tag}).`);
  process.exit(0);
}

console.log('usage: node scripts/loop-guard.mjs --start | --merge');
process.exit(2);
