#!/usr/bin/env node
/**
 * Checks the HTTP response headers of the LIVE site. GitHub Pages cannot set custom headers, so they are
 * set in Cloudflare (see docs/cloudflare-security-headers.md). Run after changing a Cloudflare rule.
 *
 *   node scripts/check-headers.mjs            report
 *   node scripts/check-headers.mjs --strict   exit 1 if a required header is missing
 */
const SITE = 'https://www.bwstays.com';
const STRICT = process.argv.includes('--strict');

const ALL = [
  ['strict-transport-security', /max-age=(\d+)/, (m) => Number(m[1]) >= 15552000, 'HSTS with a max-age of at least 180 days'],
  ['x-content-type-options', /nosniff/i, null, 'nosniff'],
  ['referrer-policy', /strict-origin|no-referrer|same-origin/i, null, 'a strict Referrer-Policy'],
  ['permissions-policy', /camera|microphone|geolocation/i, null, 'a Permissions-Policy'],
  ['x-frame-options', /sameorigin|deny/i, null, 'X-Frame-Options (or CSP frame-ancestors)'],
];
const HTML_ONLY = [
  ['content-security-policy', /default-src[^;]*'self'[\s\S]*frame-ancestors/i, null, "CSP header with default-src and frame-ancestors (scanners ignore the in-page meta CSP)"],
  ['cross-origin-opener-policy', /same-origin/i, null, 'Cross-Origin-Opener-Policy'],
];
const URLS = [
  { url: '/', html: true },
  { url: '/bwstays-booking.html', html: true },
  { url: '/sw.js', sw: true },
  { url: '/manifest.json', manifest: true },
  { url: '/js/pwa.min.js' },
];

let missing = 0;
for (const u of URLS) {
  let res;
  try {
    res = await fetch(SITE + u.url, { method: 'GET', headers: { 'user-agent': 'bwstays-header-check' } });
  } catch (e) {
    console.log(`${u.url}: request failed (${e.message})`);
    missing++;
    continue;
  }
  const h = res.headers;
  const problems = [];
  for (const [name, re, ok, what] of [...ALL, ...(u.html ? HTML_ONLY : [])]) {
    const v = h.get(name);
    const m = v && v.match(re);
    if (!v || !m || (ok && !ok(m))) problems.push(`missing or weak ${name}: want ${what}${v ? ` (got "${v.slice(0, 60)}")` : ''}`);
  }
  const cc = h.get('cache-control') || '';
  const age = Number((cc.match(/max-age=(\d+)/) || [])[1] || 0);
  if (u.sw && age > 900 && !/no-cache|no-store|must-revalidate/.test(cc)) problems.push(`sw.js is cacheable for ${age}s (${cc}); a new service worker can be delayed. Want 15 minutes or less (no-cache / bypass is best).`);
  if (u.sw && h.get('cf-cache-status') === 'HIT' && Number(h.get('age') || 0) > 900) problems.push('sw.js is served from the Cloudflare cache for a long time (HIT, age > 15 minutes); add a cache bypass rule for /sw.js');
  if (u.manifest && age > 86400) problems.push(`manifest.json is cacheable for ${age}s; want a day or less`);
  if (u.html && age > 900) problems.push(`HTML is cacheable in browsers for ${age}s; visitors will not see updates for that long`);
  console.log(`${u.url}  ${res.status}  ${problems.length ? 'ISSUES' : 'ok'}`);
  problems.forEach((p) => console.log('   - ' + p));
  missing += problems.length;
}
// AI crawlers (docs/cloudflare-security-headers.md, section 4): the AI search crawlers are allowed every day,
// the training crawlers only in one 24 hour window a week. This sends only the crawler's name; Cloudflare
// recognises the real crawlers by their network, so Security > Events shows what they actually got.
const weekSecond = Math.floor(Date.now() / 1000) % 604800;
const inWindow = weekSecond < 86400;
for (const ua of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) {
  const r = await fetch(SITE + '/llms.txt', { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${ua}/1.0)` } }).catch(() => null);
  const ok = r && r.status === 200;
  console.log(`AI search crawler ${ua}: ${r ? r.status : 'request failed'} (allowed every day, expect 200)${ok ? '' : '  ISSUE'}`);
  if (!ok) missing++;
}
for (const ua of ['GPTBot', 'ClaudeBot']) {
  const r = await fetch(SITE + '/llms.txt', { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${ua}/1.0)` } }).catch(() => null);
  console.log(`AI training crawler ${ua}: ${r ? r.status : 'request failed'} (weekly window is ${inWindow ? 'OPEN now, expect 200' : 'closed now, 403 is expected'})`);
}
console.log(missing ? `\n${missing} issue(s). See docs/cloudflare-security-headers.md` : '\nAll expected headers are present.');
if (STRICT && missing) process.exit(1);
