#!/usr/bin/env node
/**
 * Removes changed files from the Cloudflare cache, so visitors see a deploy at once instead of after the
 * 4 hour HTML cache rule. Run by .github/workflows/purge-cache.yml after each GitHub Pages deploy.
 *
 *   node scripts/purge-cloudflare.mjs --since <git-ref>   # the site files changed since that commit
 *   node scripts/purge-cloudflare.mjs --url <url> [...]   # just these URLs
 *   node scripts/purge-cloudflare.mjs --all               # everything (purge_everything)
 *   add --dry-run to print what would be purged without calling Cloudflare
 *
 * Needs CLOUDFLARE_API_TOKEN (a token with Zone > Cache Purge > Purge on bwstays.com) and CLOUDFLARE_ZONE_ID.
 * Without them it prints a notice and exits 0, so the workflow never fails a deploy.
 * - A changed page is purged at its address (index.html also as /), other files at their path; files
 *   loaded with ?v= are new URLs anyway, but their plain URL is purged too.
 * - Cloudflare takes at most 30 URLs per request; more than 300 changed files purge everything.
 * - Only files the site serves count (not scripts/, tests/, docs/, .github/, apps-script/ ...).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://www.bwstays.com';
const API = 'https://api.cloudflare.com/client/v4/zones/';
const args = process.argv.slice(2);
const opt = (name) => args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []));
const DRY = args.includes('--dry-run');
const NOT_SERVED = /^(scripts|tests|docs|\.github|apps-script|node_modules|reports\/raw)\/|^(package(-lock)?\.json|CLAUDE\.md|README\.md|\.gitignore|\.nojekyll)$/;
const MAX_URLS = 300;

const token = process.env.CLOUDFLARE_API_TOKEN;
const zone = process.env.CLOUDFLARE_ZONE_ID;

let urls = [];
let everything = args.includes('--all');
for (const u of opt('--url')) urls.push(u);
for (const ref of opt('--since')) {
  const r = spawnSync('git', ['diff', '--name-only', `${ref}..HEAD`], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.warn(`purge: git diff from ${ref} failed (${r.stderr.trim()}); purging everything instead`);
    everything = true;
    break;
  }
  for (const f of r.stdout.split('\n').map((s) => s.trim()).filter(Boolean)) {
    if (NOT_SERVED.test(f)) continue;
    urls.push(`${ORIGIN}/${f}`);
    if (f === 'index.html') urls.push(`${ORIGIN}/`);
    else if (f.endsWith('/index.html')) urls.push(`${ORIGIN}/${f.slice(0, -'index.html'.length)}`);
  }
}
urls = [...new Set(urls)];
if (!everything && urls.length > MAX_URLS) {
  console.log(`purge: ${urls.length} changed files, more than ${MAX_URLS}: purging everything`);
  everything = true;
}
if (!everything && !urls.length) {
  console.log('purge: no served file changed; nothing to purge');
  process.exit(0);
}
console.log(everything ? 'purge: everything' : `purge: ${urls.length} URL(s)`);
if (!everything) urls.forEach((u) => console.log('  ' + u));
if (DRY) process.exit(0);
if (!token || !zone) {
  console.log('purge: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID are not set; skipped (see docs/cloudflare-security-headers.md section 6)');
  process.exit(0);
}

async function purge(body) {
  const res = await fetch(`${API}${zone}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.success) throw new Error(`HTTP ${res.status} ${JSON.stringify(j.errors || j).slice(0, 300)}`);
}
try {
  if (everything) await purge({ purge_everything: true });
  else for (let i = 0; i < urls.length; i += 30) await purge({ files: urls.slice(i, i + 30) });
  console.log('purge: done');
} catch (e) {
  console.error('purge: Cloudflare refused: ' + e.message);
  process.exit(1);
}
