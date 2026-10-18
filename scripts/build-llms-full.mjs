#!/usr/bin/env node
/**
 * Writes llms-full.txt (everything before the generated site-data block) from the pages themselves.
 *
 * Every page listed in sitemap.txt is read as committed (prerendered, so the script-built lists
 * are in the HTML) and turned into plain Markdown: headings, paragraphs, lists and links. The
 * blocks every page shares (menu, contact form, "About us", footer) are written once, from the
 * home page. Only what the pages show is used; nothing is added. Not copied: the guest review
 * cards (they are not verified reviews) and placeholder contact numbers.
 *
 *   node scripts/build-llms-full.mjs           # rewrite llms-full.txt (keeps the generated block)
 *   node scripts/build-llms-full.mjs --check   # exit 1 if llms-full.txt is stale
 *
 * Run it after node scripts/prerender.mjs and before node scripts/build-llms.mjs.
 * The site chat (js/chat.js) reads this file, so keep it current.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SITE = 'https://www.bwstays.com';
const BEGIN = '<!-- BEGIN GENERATED: site-data -->';
const OUT = path.join(ROOT, 'llms-full.txt');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

// ------------------------------------------------------------------ tiny HTML reader
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
// elements dropped with everything inside them
const DROP_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'template', 'iframe', 'form', 'select', 'button-group', 'canvas', 'video', 'audio', 'picture', 'map', 'dialog']);
const SHARED_IDS = new Set(['mainNav', 'testimonial', 'signup']); // written once from the home page
const NEVER_IDS = new Set(['reviews-grid', 'chat-widget', 'chatbot', 'chat-container', 'bw-chat', 'wati-widget', 'google_translate_element', 'lang-switch']);
const BLOCK = new Set(['p', 'div', 'section', 'article', 'header', 'main', 'footer', 'aside', 'ul', 'ol', 'table', 'tr', 'blockquote', 'figure', 'figcaption', 'details', 'summary', 'dl', 'dt', 'dd', 'nav', 'small', 'address']);

const INLINE = new Set(['b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'abbr', 'mark', 'q', 'cite', 'code', 's']);
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', copy: '©', reg: '®', deg: '°', middot: '·', bull: '•', times: '×', rarr: '→', larr: '←', amp_: '&' };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
  return ENT[e.toLowerCase()] ?? m;
});
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? decode(m[2] ?? m[3] ?? m[4] ?? '') : null; };

/** HTML fragment -> Markdown. `skipIds` are element ids left out (with their content). */
function toMarkdown(html, { skipIds = new Set(), headingShift = 0, base = SITE + '/' } = {}) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const out = [];
  let buf = '';
  const flush = () => { const t = buf.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').trim(); if (t) out.push(t); buf = ''; };
  const stack = []; // {tag, skip, kind, href, text}
  let skipDepth = 0;
  let link = null;
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[4] !== undefined) {
      if (skipDepth) continue;
      const t = decode(m[4]).replace(/\s+/g, ' ');
      if (link) link.text += t; else buf += t;
      continue;
    }
    const close = m[1] === '/', tag = m[2].toLowerCase(), full = m[0];
    if (!close) {
      if (VOID.has(tag) || full.endsWith('/>')) {
        if (skipDepth) continue;
        if (tag === 'br') { if (link) link.text += ' '; else buf += '\n'; }
        continue;
      }
      const id = attr(full, 'id');
      const cls = attr(full, 'class') || '';
      const hidden = /\shidden(\s|>|=)/i.test(full) || /aria-hidden\s*=\s*"true"/i.test(full) || /display\s*:\s*none/i.test(attr(full, 'style') || '');
      const skip = skipDepth > 0 || DROP_TAGS.has(tag) || (id && (skipIds.has(id) || NEVER_IDS.has(id))) || hidden || /\b(sr-only|visually-hidden|carousel|bw-map-hint|leaflet)\b/.test(cls);
      stack.push({ tag, skip });
      if (skip) { skipDepth++; continue; }
      if (/^h[1-6]$/.test(tag)) { flush(); buf = '#'.repeat(Math.min(6, Number(tag[1]) + headingShift)) + ' '; }
      else if (tag === 'li') { flush(); buf = '- '; }
      else if (BLOCK.has(tag) || tag === 'td' || tag === 'th') { if (tag === 'td' || tag === 'th') buf += ' '; else flush(); }
      else if (tag === 'a') {
        const href = attr(full, 'href');
        link = { href, text: '' };
      }
      else if (!INLINE.has(tag)) { if (link) link.text += ' '; else buf += ' '; } // spans, labels: keep words apart
      continue;
    }
    // closing tag: pop to the matching open element (tolerates sloppy HTML)
    let i = stack.length - 1;
    while (i >= 0 && stack[i].tag !== tag) i--;
    if (i < 0) continue;
    const popped = stack.splice(i);
    const wasSkipped = popped.filter((e) => e.skip).length;
    if (wasSkipped) { skipDepth -= wasSkipped; if (popped[0].skip) continue; }
    if (skipDepth) continue;
    if (tag === 'a' && link) {
      const text = link.text.replace(/\s+/g, ' ').trim();
      let href = link.href || '';
      link = null;
      if (!text) continue;
      if (/^(#|javascript:|mailto:\s*$|tel:\s*$)/i.test(href) || !href) { buf += text; continue; }
      try { href = new URL(href, base).href; } catch { buf += text; continue; }
      if (/9{6,}/.test(href)) { continue; } // placeholder phone numbers are not published
      buf += href === text ? `<${href}>` : `[${text}](${href})`;
      continue;
    }
    if (/^h[1-6]$/.test(tag) || tag === 'li' || BLOCK.has(tag)) flush();
    else if (!INLINE.has(tag)) { if (link) link.text += ' '; else buf += ' '; }
  }
  flush();
  // tidy: drop empty headings/list items, collapse repeated lines
  const lines = [];
  for (const l of out.join('\n\n').split('\n')) {
    const t = l.trim();
    if (/^#+\s*$/.test(t) || /^-\s*$/.test(t) || /^-\s*[^:]+:\s*$/.test(t)) continue; // empty heading, item or "Label :"
    if (NOISE.test(t.replace(/\s+(?=°|INR)|(?<=USD =)\s+/g, ''))) continue;
    lines.push(t.replace(/(\S) +([:;,.])(?=\s|$)/g, '$1$2')); // "Pookode Lake : " (span boundary) -> "Pookode Lake: "
  }
  const blocks = lines.join('\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const kept = [];
  for (const b of blocks) {
    if (kept.length && kept[kept.length - 1] === b) continue;
    kept.push(b);
  }
  // a heading directly followed by another heading of the same or higher level has no content
  const real = kept.filter((b, i) => {
    const h = b.match(/^(#+) /);
    if (!h) return true;
    const next = kept[i + 1];
    if (!next) return false;
    const n = next.match(/^(#+) /);
    return !(n && n[1].length <= h[1].length);
  });
  // a heading and the facts under it stay in one paragraph (the site chat splits on blank lines,
  // so "Fee: ..." must sit next to the place name); a long paragraph or a size cap ends the group
  const grouped = [];
  let group = null;
  for (const b of real) {
    if (/^#+ /.test(b)) { if (group) grouped.push(group.join('\n')); group = [b]; continue; }
    if (!group) { grouped.push(b); continue; }
    group.push(b);
    if (b.length > 200 || group.join('\n').length > 1200) { grouped.push(group.join('\n')); group = null; }
  }
  if (group) grouped.push(group.join('\n'));
  return grouped.join('\n\n');
}

// widgets filled in the browser (weather, currency, protected email and phone) and the skip link
const NOISE = /^(Skip to main content|Reservation|Loading weather|H:--° L:--°|--°|1 USD =--INR|\[email-hidden\]|\+-- --- --- ----|Email|Phone|Loading\.\.\.|View places within 15 Kms)$/;

const between = (html, open, closeTag) => {
  const a = html.search(open);
  if (a < 0) return '';
  // find the matching close tag for the element that starts at `a`
  const tag = html.slice(a).match(/^<([a-z0-9]+)/i)[1].toLowerCase();
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = a;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[1]) { depth--; if (depth === 0) return html.slice(a, m.index + m[0].length); }
    else if (!m[0].endsWith('/>')) depth++;
  }
  return html.slice(a);
};

// ------------------------------------------------------------------ pages
const urls = read('sitemap.txt').split('\n').map((s) => s.trim()).filter(Boolean);
const files = urls.map((u) => (u.replace(SITE + '/', '') || 'index.html'));
const FIRST = ['index.html', 'bwstays-booking.html', 'footer.html', 'all-locations-wayanad.html', 'all-fooding-wayanad.html'];
const order = [...FIRST.filter((f) => files.includes(f)), ...files.filter((f) => !FIRST.includes(f)).sort()];

const meta = (html, name) => { const m = html.match(new RegExp(`<meta\\s+(?:name|property)="${name}"\\s+content="([^"]*)"`, 'i')); return m ? decode(m[1]).trim() : ''; };
const titleOf = (html) => decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1]).replace(/\s+/g, ' ').trim();
const bodyOf = (html) => { const a = html.search(/<body\b/i); const b = html.lastIndexOf('</body>'); return html.slice(a < 0 ? 0 : a, b < 0 ? undefined : b); };

const parts = [];
const home = read('index.html');
parts.push(`# ${SITE} llms-full.txt`);
parts.push(`> ${meta(home, 'description')}`);
parts.push([
  'This file is generated from the pages of www.bwstays.com (scripts/build-llms-full.mjs): one section per page, in the order of the sitemap,',
  'with the blocks every page shares (contact, about, footer) written once at the start. Facts about places come from the site data,',
  'which is checked against OpenStreetMap and official sources (see the verification notes in the MCP files). Where a page says',
  '"not published", the fact is unknown to BWStays; please do not fill it in from elsewhere.',
].join('\n'));

// shared blocks, once
const shared = [
  between(home, /<section[^>]*id="testimonial"/i),
  between(home, /<section[^>]*id="signup"/i),
  between(home, /<footer\b/i),
].join('\n');
parts.push('## Contact, about and location (shown on every page)\n\n' + toMarkdown(shared, { headingShift: 1 }).replace(/^## (Get in touch with us)$/m, '### $1'));

let pages = 0;
for (const f of order) {
  if (!fs.existsSync(path.join(ROOT, f))) continue;
  const html = read(f);
  if (/http-equiv="refresh"/i.test(html)) continue; // redirect pages
  let body = bodyOf(html);
  // shared blocks already written above
  for (const re of [/<section[^>]*id="testimonial"/i, /<section[^>]*id="signup"/i, /<footer\b/i, /<nav\b[^>]*id="mainNav"/i]) {
    const blk = between(body, re);
    if (blk) body = body.replace(blk, '');
  }
  const md = toMarkdown(body, { headingShift: 2 });
  const url = f === 'index.html' ? SITE + '/' : `${SITE}/${f}`;
  const title = titleOf(html);
  const desc = meta(html, 'description');
  parts.push([`## ${title}`, '', `URL: ${url}`, desc ? `\n${desc}` : '', '', md].join('\n').replace(/\n{3,}/g, '\n\n').trim());
  pages++;
}

const generated = parts.join('\n\n') + '\n';

// keep the block owned by build-llms.mjs
const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
const crlf = cur.includes('\r\n');
const norm = cur.replace(/\r\n/g, '\n');
const at = norm.indexOf(BEGIN);
const tail = at >= 0 ? norm.slice(at) : '';
const next = generated + (tail ? '\n' + tail : '');

if (CHECK) {
  if (norm !== next) { console.error('llms-full.txt is stale: run node scripts/build-llms-full.mjs'); process.exit(1); }
  console.log('llms-full.txt is current');
} else {
  fs.writeFileSync(OUT, crlf ? next.replace(/\n/g, '\r\n') : next);
  console.log(`llms-full.txt: ${pages} pages, ${(next.length / 1024).toFixed(0)} KB`);
}
