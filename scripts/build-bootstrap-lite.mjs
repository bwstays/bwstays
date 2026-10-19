#!/usr/bin/env node
/**
 * Bootstrap CSS, trimmed to what the site uses: css/bootstrap-lite.css
 *
 *   node scripts/build-bootstrap-lite.mjs           # write css/bootstrap-lite.css
 *   node scripts/build-bootstrap-lite.mjs --check   # no postcss needed: exit 1 if it is stale
 *
 * vendor/bootstrap/bootstrap.min.css is 160 KB and the pages use about 10% of it. This keeps
 * every rule of it whose class names ALL appear somewhere in the site's own files (HTML pages,
 * js/*.js, data/*.js and data/*.json, reports/), so a class that a script builds into the page
 * is kept as long as its full name is written in the source. Rules without a class (element,
 * attribute and :root selectors, i.e. Bootstrap's reboot) are kept as they are, and so are the
 * classes Bootstrap's own JavaScript adds (SAFELIST).
 *
 * The header of the file carries a hash of the Bootstrap classes the site uses, so --check (also
 * run by check.mjs) fails when a new Bootstrap class is used on a page and this script was not
 * re-run. Re-run it, then minify-assets and version-assets.
 *
 * A class that is only ever built by string concatenation (for example 'btn-' + type) is not
 * seen: write it in full somewhere in the source, or add it to SAFELIST.
 *
 * Needs postcss to write the file: npm i --no-save postcss   (or POSTCSS=/path/to/postcss/lib/postcss.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SRC = 'vendor/bootstrap/bootstrap.min.css';
const OUT = 'css/bootstrap-lite.css';
// classes that Bootstrap's own JavaScript or its states add at run time
const SAFELIST = new Set(['collapse', 'collapsing', 'collapsed', 'show', 'fade', 'active', 'disabled', 'dropdown-menu', 'was-validated', 'is-valid', 'is-invalid', 'sr-only', 'sr-only-focusable']);

// ------------------------------------------------------------------ the site's own source
function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (fs.statSync(p).isDirectory()) {
      if (/^(node_modules|\.git|\.github|vendor|scripts|docs|assets|apps-script|resources|tools|setup|tests|\.well-known)$/.test(name)) continue;
      walk(p, out);
    } else if (/\.(html|js|json)$/.test(name) && !/\.min\./.test(name) && !/^(sw\.js|mcp\.json|assets-min\.json)$/.test(name) && !/^data\/(search-index|map-places)\.json$/.test(rel)) {
      out.push(p);
    }
  }
  return out;
}
const corpus = walk(ROOT).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const tokens = new Set(corpus.match(/[A-Za-z0-9_-]+/g));

const css = fs.readFileSync(path.join(ROOT, SRC), 'utf8');
const bootstrapClasses = [...new Set([...css.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]))];
const used = bootstrapClasses.filter((c) => tokens.has(c) || SAFELIST.has(c)).sort();
const hash = crypto.createHash('sha256').update(used.join(',')).digest('hex').slice(0, 10);

if (CHECK) {
  const file = path.join(ROOT, OUT);
  const head = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').slice(0, 200) : '';
  const m = head.match(/bootstrap-lite:([a-f0-9]+)/);
  if (!m) { console.error(`${OUT} is missing. Run: node scripts/build-bootstrap-lite.mjs`); process.exit(1); }
  if (m[1] !== hash) { console.error(`${OUT} is stale (the site now uses different Bootstrap classes). Run: node scripts/build-bootstrap-lite.mjs`); process.exit(1); }
  console.log(`${OUT} is current (${used.length} Bootstrap classes in use)`);
  process.exit(0);
}

// ------------------------------------------------------------------ build
let postcss;
try { postcss = (await import('postcss')).default; } catch (e) {
  if (!process.env.POSTCSS) { console.error('postcss is needed: npm i --no-save postcss (or set POSTCSS)'); process.exit(2); }
  postcss = (await import(pathToFileURL(process.env.POSTCSS).href)).default;
}
const usedSet = new Set(used);
const out = postcss.root();
const animations = new Set();
let kept = 0, dropped = 0;
function copy(parent, target) {
  parent.each((node) => {
    if (node.type === 'rule') {
      const selectors = node.selectors.filter((s) => {
        const classes = [...s.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map((m) => m[1]);
        return classes.every((c) => usedSet.has(c));
      });
      if (selectors.length) {
        const c = node.clone();
        c.selectors = selectors;
        target.append(c);
        kept++;
        c.walkDecls(/^animation(-name)?$/i, (d) => d.value.split(/[\s,]+/).forEach((v) => animations.add(v)));
      } else dropped++;
    } else if (node.type === 'atrule') {
      if (/^(media|supports)$/i.test(node.name)) {
        const shell = node.clone({ nodes: [] });
        copy(node, shell);
        if (shell.nodes && shell.nodes.length) target.append(shell);
      } else if (/keyframes$/i.test(node.name)) {
        // appended after the rules, when the animations in use are known
      } else target.append(node.clone());
    } else if (node.type === 'comment') {
      // drop Bootstrap's licence banner here; the header below names the source
    } else target.append(node.clone());
  });
}
const ast = postcss.parse(css);
copy(ast, out);
ast.walkAtRules(/keyframes$/i, (a) => { if (animations.has(a.params)) out.append(a.clone()); });
const body = out.toString();
const header = `/*bootstrap-lite:${hash} generated by scripts/build-bootstrap-lite.mjs from ${SRC} (Bootstrap 4.5.3, MIT, https://getbootstrap.com): only the classes the site uses. Do not edit. */\n`;
fs.writeFileSync(path.join(ROOT, OUT), header + body + '\n');
console.log(`${OUT}: ${(body.length / 1024).toFixed(1)} KB from ${(css.length / 1024).toFixed(1)} KB (${kept} rules kept, ${dropped} dropped, ${used.length} Bootstrap classes in use)`);
