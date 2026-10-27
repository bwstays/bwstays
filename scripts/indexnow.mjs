#!/usr/bin/env node
/**
 * Tells IndexNow search engines (Bing, Yandex, Seznam, Naver, Yep) which pages changed, so they
 * re-crawl them within hours instead of waiting for their next visit. Google does not use IndexNow
 * (it reads sitemap.xml). Bing's index also feeds ChatGPT search and Copilot.
 *
 *   node scripts/indexnow.mjs --all                  # every URL in sitemap.txt (first submission, or after a big change)
 *   node scripts/indexnow.mjs --since <git-ref>      # pages changed since that commit (what the workflow sends)
 *   node scripts/indexnow.mjs --url <url> [--url ..] # just these URLs
 *   add --dry-run to print the list without sending
 *
 * The key is the file <key>.txt at the site root, whose content is the key itself. The live site must
 * serve the changed pages before they are submitted: .github/workflows/indexnow.yml waits for the
 * GitHub Pages deploy. Only URLs listed in sitemap.txt are sent (redirect and noindex pages are not).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'www.bwstays.com';
const ORIGIN = `https://${HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const args = process.argv.slice(2);
const opt = (name) => args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []));
const DRY = args.includes('--dry-run');

const keyFiles = fs.readdirSync(ROOT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f) && fs.readFileSync(path.join(ROOT, f), 'utf8').trim() === f.slice(0, 32));
if (keyFiles.length !== 1) {
  console.error(`indexnow: expected one key file <32 hex>.txt at the site root holding its own name, found ${keyFiles.length}`);
  process.exit(2);
}
const key = keyFiles[0].slice(0, 32);

const listed = fs.readFileSync(path.join(ROOT, 'sitemap.txt'), 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
const listedSet = new Set(listed);
const urlOf = (file) => (file === 'index.html' ? `${ORIGIN}/` : `${ORIGIN}/${file}`);

let urls = [];
if (args.includes('--all')) urls = listed;
for (const u of opt('--url')) urls.push(u);
for (const ref of opt('--since')) {
  const r = spawnSync('git', ['diff', '--name-only', `${ref}..HEAD`, '--', '*.html'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`indexnow: git diff from ${ref} failed: ${r.stderr.trim()}`);
    process.exit(2);
  }
  for (const f of r.stdout.split('\n').filter((f) => f && !f.includes('/'))) urls.push(urlOf(f));
}
urls = [...new Set(urls)].filter((u) => listedSet.has(u));
if (!urls.length) {
  console.log('indexnow: no indexable page changed; nothing to send');
  process.exit(0);
}
console.log(`indexnow: ${urls.length} URL(s)`);
urls.forEach((u) => console.log('  ' + u));
if (DRY) process.exit(0);

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `${ORIGIN}/${key}.txt`, urlList: urls.slice(0, 10000) }),
});
// 200 = accepted, 202 = accepted while the key is being checked; anything else is an error
console.log(`indexnow: ${res.status} ${res.statusText} ${(await res.text()).slice(0, 300)}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
