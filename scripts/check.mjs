#!/usr/bin/env node
/**
 * Repository sanity checks, run by CI and runnable locally:
 *
 *   node scripts/check.mjs
 *
 *  - every .js/.mjs file parses (an earlier "cleanup" commit once left
 *    js/worker.js and js/pdfgen.js unparseable)
 *  - every .json file parses
 *  - every JSON-LD block and every inline script in every HTML page parses
 *  - no HTML page repeats an element id
 *  - the ?v= content hashes on local CSS/JS URLs are current
 *  - the generated MCP files are up to date
 *
 * Zero dependencies, Node >= 18.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'blogs']);
const problems = [];

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

let js = 0, json = 0, html = 0;
for (const file of walk(ROOT)) {
  const r = rel(file);
  if (/\.(m?js)$/.test(r)) {
    js++;
    let target = file;
    // js/worker.js is an ES module (Cloudflare Worker); check it as one
    const src = fs.readFileSync(file, 'utf8');
    if (/^\s*export\s/m.test(src) && file.endsWith('.js')) {
      target = path.join(os.tmpdir(), `check-${path.basename(file)}.mjs`);
      fs.writeFileSync(target, src);
    }
    const res = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
    if (res.status !== 0) problems.push(`${r}: ${(res.stderr.match(/SyntaxError.*/) ?? [res.stderr.slice(0, 120)])[0]}`);
  } else if (r.endsWith('.json')) {
    json++;
    try {
      JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
      problems.push(`${r}: invalid JSON (${e.message.slice(0, 80)})`);
    }
  } else if (r.endsWith('.html') && !r.includes('/')) {
    html++;
    const s = fs.readFileSync(file, 'utf8');
    for (const m of s.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        JSON.parse(m[1]);
      } catch (e) {
        problems.push(`${r}: invalid JSON-LD (${e.message.slice(0, 60)})`);
      }
    }
    // inline scripts: a stripped log statement once left `err => )` and silently
    // disabled the whole block on three pages
    for (const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attrs = m[1];
      if (/\bsrc\s*=/.test(attrs) || !m[2].trim()) continue;
      const type = (attrs.match(/type\s*=\s*["']([^"']+)/i) ?? [])[1]?.toLowerCase();
      if (type && !/^(text|application)\/javascript$/.test(type)) continue;
      try {
        new vm.Script(m[2]);
      } catch (e) {
        const line = s.slice(0, m.index).split('\n').length;
        problems.push(`${r}: inline script near line ${line}: ${e.message}`);
      }
    }
    const body = s
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    const seen = new Map();
    for (const m of body.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)) seen.set(m[1], (seen.get(m[1]) ?? 0) + 1);
    const dups = [...seen].filter(([, c]) => c > 1).map(([k]) => k);
    if (dups.length) problems.push(`${r}: duplicate ids: ${dups.slice(0, 5).join(', ')}`);
  }
}

const ver = spawnSync(process.execPath, [path.join(ROOT, 'scripts/version-assets.mjs'), '--check'], { encoding: 'utf8' });
if (ver.status !== 0) problems.push(`asset versions are stale: ${(ver.stderr || ver.stdout).trim().split('\n')[0]}`);
const mcp = spawnSync(process.execPath, [path.join(ROOT, 'scripts/generate-mcp.mjs'), '--check'], { encoding: 'utf8' });
if (mcp.status !== 0) problems.push(`MCP files are stale: ${(mcp.stderr || mcp.stdout).trim().split('\n').slice(-2).join(' | ')}`);

console.log(`checked ${js} scripts, ${json} json files, ${html} pages`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('all checks passed');
