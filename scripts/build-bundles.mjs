#!/usr/bin/env node
/**
 * Bundles the CSS and JavaScript files a page loads one after another into a single file,
 * so the page makes fewer requests. The readable sources and their .min copies are not
 * touched; a bundle is only a concatenation of the .min files, rebuilt from them.
 *
 * Each bundle is written in the page as a comment that lists its files, followed by the one
 * tag that loads the bundle:
 *
 *   <!--bundle css/fontawesome.min.css css/bootstrap-lite.min.css css/styles.min.css-->
 *   <link rel="stylesheet" href="https://www.bwstays.com/css/bundle/b-1a2b3c4d5e.min.css?v=...">
 *   <!--/bundle-->
 *
 * The comment is the source of truth: to add, remove or reorder a file on a page, edit the
 * list and run the build. Pages with the same list share one bundle file (its name is a hash
 * of the list). The tag's other attributes (defer, type="bw-lazy", media...) are kept.
 *
 *   node scripts/build-bundles.mjs            # (re)build bundles, point tags at them, delete unused ones
 *   node scripts/build-bundles.mjs --check    # exit 1 if a bundle or a tag is out of date
 *   node scripts/build-bundles.mjs --migrate  # turn runs of separate tags into bundle blocks
 *                                             # (run once for a new page, then build)
 *
 * minify-assets.mjs runs the build as its last step; check.mjs runs --check. Run
 * version-assets.mjs afterwards for the ?v= hashes. Each bundle has a source map (an index map
 * of the files' own maps), so browser dev tools still show the readable sources.
 *
 * What --migrate bundles: in <head>, the local stylesheets (a Leaflet stylesheet loaded with
 * the media="print" swap becomes a normal member, in its place); anywhere, consecutive local
 * <script src> tags with the same loading attributes and nothing but whitespace between them.
 * Never bundled: other sites' files, the availability data that changes every 30 minutes
 * (data/bookingdata, closeddata, pendingdata) and tags with extra attributes (id, onload...).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.bwstays.com/';
const CHECK = process.argv.includes('--check');
const MIGRATE = process.argv.includes('--migrate');
const NEVER = /^data\/(bookingdata|closeddata|pendingdata)(\.min)?\.js$/;
const BLOCK_RE = /<!--bundle\s+([^>]*?)\s*-->(\s*)(<(?:link|script)\b[^>]*>(?:\s*<\/script>)?)(\s*)<!--\/bundle-->/g;

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
if (fs.existsSync(path.join(ROOT, 'reports'))) {
  for (const f of fs.readdirSync(path.join(ROOT, 'reports'))) if (f.endsWith('.html')) pages.push(`reports/${f}`);
}
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// a site URL or path -> repo-relative file, or null when it is not a local file
function localFile(url) {
  const p = url.replace(/^https:\/\/www\.bwstays\.com\//, '').replace(/^\//, '').split(/[?#]/)[0];
  if (/^[a-z]+:/i.test(p) || p.startsWith('//')) return null;
  return exists(p) ? p : null;
}
// a listed file: a readable css/js/data source stands for its .min copy
function member(rel) {
  const m = rel.match(/^((?:css|js|data)\/[A-Za-z0-9_\-.]+?)\.(css|js)$/);
  if (m && !rel.includes('.min.') && exists(`${m[1]}.min.${m[2]}`)) return `${m[1]}.min.${m[2]}`;
  return rel;
}

// ---------------------------------------------------------------- --migrate
// remove a tag together with the line break and indent in front of it, so no blank line is left
function drop(tokens, i) {
  tokens[i] = '';
  const prev = tokens[i - 1];
  if (i > 0 && /^\s*$/.test(prev) && /\n[ \t]*$/.test(prev)) tokens[i - 1] = prev.replace(/\r?\n[ \t]*$/, '');
}
function migrate(html) {
  // existing blocks are left alone and break runs
  const kept = [];
  let text = html.replace(BLOCK_RE, (all) => `\u0000${kept.push(all) - 1}\u0000`);
  const TOKEN = /\u0000\d+\u0000|<!--[\s\S]*?-->|<noscript\b[\s\S]*?<\/noscript>|<script\b[^>]*>[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]+>|[^<\u0000]+|[\s\S]/gi;
  const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1];

  // stylesheets: only inside <head>
  const headStart = text.search(/<head\b[^>]*>/i);
  const headEnd = text.search(/<\/head>/i);
  if (headStart >= 0 && headEnd > headStart) {
    const head = text.slice(headStart, headEnd);
    const tokens = head.match(TOKEN) || [];
    const runs = [];
    let run = [];
    const flush = () => { if (run.length >= 2) runs.push(run); run = []; };
    tokens.forEach((t, i) => {
      if (/^<link\b/i.test(t) && /rel\s*=\s*["']stylesheet["']/i.test(t)) {
        const file = localFile(attr(t, 'href') || '');
        const media = (attr(t, 'media') || 'all').toLowerCase();
        const swap = media === 'print' && /onload\s*=/.test(t); // the async "print then all" trick
        const plain = media === 'all' || media === 'screen';
        if (file && file.endsWith('.css') && (plain || swap) && !/\s(id|integrity|crossorigin)\s*=/i.test(t)) { run.push({ i, file, swap }); return; }
        flush();
        return;
      }
      if (/^<noscript\b/i.test(t)) {
        // <noscript> copy of a swapped stylesheet: dropped with it
        const inner = t.match(/href\s*=\s*["']([^"']+)["']/i);
        const prev = run[run.length - 1];
        if (prev && prev.swap && inner && localFile(inner[1]) === prev.file) { prev.noscript = i; return; }
        flush();
        return;
      }
      if (/^\s*$/.test(t) || /^<!--/.test(t) || /^<(meta|title|link|base)\b/i.test(t) || /^<\/title>/i.test(t) || (!/^</.test(t) && !/^\u0000/.test(t))) return; // neutral
      flush();
    });
    flush();
    for (const r of runs) {
      const list = r.map((m) => m.file).join(' ');
      tokens[r[0].i] = `<!--bundle ${list}-->\n<link rel="stylesheet" href="${SITE}css/bundle/pending.min.css" type="text/css" media="all"/>\n<!--/bundle-->`;
      for (const m of r.slice(1)) drop(tokens, m.i);
      for (const m of r) if (m.noscript !== undefined) drop(tokens, m.noscript);
    }
    text = text.slice(0, headStart) + tokens.join('') + text.slice(headEnd);
  }

  // scripts: anywhere, strictly consecutive, same loading attributes
  {
    const tokens = text.match(TOKEN) || [];
    const runs = [];
    let run = [];
    const flush = () => { if (run.length >= 2) runs.push(run); run = []; };
    tokens.forEach((t, i) => {
      if (/^<script\b/i.test(t)) {
        const open = t.slice(0, t.indexOf('>') + 1);
        const src = attr(open, 'src');
        const file = src && localFile(src);
        const extra = open.replace(/<script|>|\s(src|type|defer|async|data-cfasync)(\s*=\s*["'][^"']*["'])?/gi, '').trim();
        const key = [attr(open, 'type') || 'text/javascript', /\sdefer\b/i.test(open), /\sasync\b/i.test(open), attr(open, 'data-cfasync') || ''].join('|');
        const body = t.slice(open.length).replace(/<\/script>$/i, '').trim();
        if (file && file.endsWith('.js') && !NEVER.test(file) && !extra && !body) {
          if (run.length && run[0].key !== key) flush();
          run.push({ i, file, key, open });
          return;
        }
        flush();
        return;
      }
      if (/^\s*$/.test(t) || /^<!--/.test(t)) return; // whitespace and comments only
      flush();
    });
    flush();
    for (const r of runs) {
      const list = r.map((m) => m.file).join(' ');
      const tag = r[0].open.replace(/\ssrc\s*=\s*["'][^"']*["']/i, ` src="${SITE}js/bundle/pending.min.js"`);
      tokens[r[0].i] = `<!--bundle ${list}-->\n${tag}</script>\n<!--/bundle-->`;
      for (const m of r.slice(1)) drop(tokens, m.i);
    }
    text = tokens.join('');
  }
  return text.replace(/\u0000(\d+)\u0000/g, (_, n) => kept[Number(n)]);
}

// ---------------------------------------------------------------- bundle contents
function sourceMapFor(rel) {
  const mapRel = `${rel}.map`;
  if (!exists(mapRel)) return null;
  const map = JSON.parse(read(mapRel));
  const base = path.posix.join(path.posix.dirname(rel), map.sourceRoot || '');
  map.sources = (map.sources || []).map((s) => (/^[a-z]+:/i.test(s) ? s : SITE + path.posix.normalize(path.posix.join(base, s))));
  delete map.sourceRoot;
  delete map.file;
  return map;
}
function build(files, ext, name) {
  const sections = [];
  let out = ext === 'css' ? '@charset "UTF-8";\n' : '';
  for (const rel of files) {
    let text = read(rel).replace(/\r\n/g, '\n');
    if (ext === 'css') {
      text = text
        .replace(/@charset\s+["'][^"']*["'];?/gi, '')
        .replace(/\/\*#\s*sourceMappingURL=[^*]*\*\//g, '')
        .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/g, (all, q, u) => {
          if (/^(data:|https?:|\/|#)/i.test(u)) return all;
          return `url(${q}${SITE}${path.posix.normalize(path.posix.join(path.posix.dirname(rel), u))}${q})`;
        });
    } else {
      text = text.replace(/\n?\/\/[#@]\s*sourceMappingURL=\S*\s*$/, '');
    }
    const line = (out.match(/\n/g) || []).length;
    const map = sourceMapFor(rel);
    if (map) sections.push({ offset: { line, column: 0 }, map });
    out += text.replace(/\s+$/, '') + (ext === 'js' ? '\n;\n' : '\n');
  }
  out += ext === 'js' ? `//# sourceMappingURL=${name}.map\n` : `/*# sourceMappingURL=${name}.map */\n`;
  const index = JSON.stringify({ version: 3, file: name, sections });
  return { code: out, map: index };
}

// ---------------------------------------------------------------- main
const problems = [];
const wanted = new Map(); // bundle rel path -> { code, map }
let changedPages = 0;
let blocks = 0;
for (const page of pages) {
  const abs = path.join(ROOT, page);
  let html = read(page);
  if (MIGRATE && !CHECK) html = migrate(html);
  const out = html.replace(BLOCK_RE, (all, list, ws1, tag, ws2) => {
    blocks++;
    const files = list.split(/\s+/).filter(Boolean).map(member);
    const missing = files.filter((f) => !exists(f));
    if (missing.length) { problems.push(`${page}: bundle lists missing file(s): ${missing.join(', ')}`); return all; }
    const exts = new Set(files.map((f) => path.extname(f).slice(1)));
    if (exts.size !== 1 || !['css', 'js'].includes([...exts][0])) { problems.push(`${page}: a bundle must list only .css or only .js files: ${list}`); return all; }
    const ext = [...exts][0];
    const id = 'b-' + crypto.createHash('sha1').update(files.join('\n')).digest('hex').slice(0, 10);
    const rel = `${ext}/bundle/${id}.min.${ext}`;
    if (!wanted.has(rel)) wanted.set(rel, build(files, ext, `${id}.min.${ext}`));
    const url = SITE + rel;
    const attrName = ext === 'css' ? 'href' : 'src';
    const re = new RegExp(`(\\s${attrName}\\s*=\\s*["'])([^"']*)(["'])`, 'i');
    const cur = (tag.match(re) || [])[2] || '';
    const newTag = cur.split('?')[0] === url ? tag : tag.replace(re, `$1${url}$3`);
    return `<!--bundle ${list}-->${ws1}${newTag}${ws2}<!--/bundle-->`;
  });
  if (out !== read(page)) {
    changedPages++;
    if (CHECK) problems.push(`${page}: bundle tag is out of date`);
    else fs.writeFileSync(abs, out);
  }
}

// bundle files: write what changed, remove what no page uses
for (const [rel, { code, map }] of wanted) {
  const cur = exists(rel) ? read(rel).replace(/\r\n/g, '\n') : null;
  const curMap = exists(`${rel}.map`) ? read(`${rel}.map`) : null;
  if (cur === code && curMap === map) continue;
  if (CHECK) { problems.push(`${rel} is stale`); continue; }
  fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), code);
  fs.writeFileSync(path.join(ROOT, `${rel}.map`), map);
}
let removed = 0;
for (const dir of ['css/bundle', 'js/bundle']) {
  if (!exists(dir)) continue;
  for (const f of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = `${dir}/${f}`;
    if (wanted.has(rel) || wanted.has(rel.replace(/\.map$/, ''))) continue;
    if (CHECK) { problems.push(`${rel} is not used by any page`); continue; }
    fs.unlinkSync(path.join(ROOT, rel));
    removed++;
  }
}

if (problems.length) {
  console.error(`bundles: ${problems.length} problem(s)${CHECK ? '; run: node scripts/minify-assets.mjs (or build-bundles.mjs)' : ''}`);
  for (const p of problems.slice(0, 15)) console.error('  ' + p);
  process.exit(1);
}
console.log(CHECK
  ? `bundles current (${wanted.size} bundles, ${blocks} blocks)`
  : `bundles: ${wanted.size} files for ${blocks} blocks; updated ${changedPages} pages; removed ${removed} unused files`);
