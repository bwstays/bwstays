#!/usr/bin/env node
/**
 * Writes the Frequently Asked Questions into footer.html (the "Rules & Regulations of Stay" page) from
 * the single source js/faq.js: a collapsible card whose questions each expand and collapse, plus the
 * FAQPage structured data. Static HTML, so crawlers and the offline copy have it too.
 *
 *   node scripts/build-faq.mjs           rewrite the generated blocks in footer.html
 *   node scripts/build-faq.mjs --check   exit 1 if footer.html is out of date (also run by check.mjs)
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const src = fs.readFileSync(path.join(ROOT, 'js/faq.js'), 'utf8');
const m = src.match(/const faqData\s*=\s*(\[[\s\S]*?\r?\n\]);/);
if (!m) throw new Error('build-faq: faqData array not found in js/faq.js');
const faqData = vm.runInNewContext(m[1]);

// the answers quote the nightly rate and the capacity: they must match the booking page
{
  const booking = fs.readFileSync(path.join(ROOT, 'bwstays-booking.html'), 'utf8');
  const rate = Number(((booking.match(/price-tag[^>]*>\s*(?:₹|&#8377;)\s*([\d,]+)\s*\/\s*night/i) || [])[1] || '').replace(/,/g, ''));
  const adults = Number((booking.match(/fa-user-friends[\s\S]{0,120}?Up to (\d+)\s*Adults?/i) || [])[1]); // the card (the JSON-LD also says 'up to')
  const all = faqData.map((f) => f.answer).join(' ');
  if (!rate || !adults) throw new Error('build-faq: could not read the rate and capacity from bwstays-booking.html');
  const money = 'INR ' + rate.toLocaleString('en-IN');
  if (!all.includes(money)) throw new Error(`build-faq: js/faq.js must mention "${money}" (the rate on the booking page)`);
  const rates = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'data/rates.js'), 'utf8') + ';bwRates');
  if (rates.perNight !== rate) throw new Error(`build-faq: bwstays-booking.html shows INR ${rate} but data/rates.js says INR ${rates.perNight}`);
  const allowed = new Set([rate, rates.extraChildPerNight]);
  const otherRates = [...all.matchAll(/INR ([\d,]+)/g)].map((m) => m[1]).filter((v) => !allowed.has(Number(v.replace(/,/g, ''))));
  if (otherRates.length) throw new Error('build-faq: js/faq.js quotes an amount that is not in data/rates.js: INR ' + otherRates.join(', '));
  for (const v of [rates.extraChildPerNight]) {
    const fmt = v.toLocaleString('en-IN');
    if (!all.includes('INR ' + fmt)) throw new Error(`build-faq: js/faq.js must mention the extra bed charge INR ${fmt}`);
    if (!booking.includes('₹' + fmt)) throw new Error(`build-faq: the booking page card (rate-note) must mention the extra bed charge ₹${fmt}`);
  }
  if (adults !== rates.maxAdults) throw new Error(`build-faq: the booking page card says up to ${adults} adults but data/rates.js allows ${rates.maxAdults}`);
  if (!all.includes(`up to ${rates.maxAdults} adults`)) throw new Error(`build-faq: js/faq.js must say "up to ${rates.maxAdults} adults"`);
  if (!all.includes(`up to ${rates.maxChildren} children`)) throw new Error(`build-faq: js/faq.js must say "up to ${rates.maxChildren} children"`);
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const items = faqData
  .map((f, i) => `                                <details class="faq-qa" id="faq-${i + 1}">
                                    <summary><span>${esc(f.question)}</span></summary>
                                    <p>${esc(f.answer)}</p>
                                </details>`)
  .join('\n');

const card = `<!--faq:begin-->
                    <section class="legal-card" id="section-faq">
                        <details open>
                            <summary><h2 class="legal-card-title"><i class="fas fa-question-circle" aria-hidden="true"></i><span>Frequently Asked Questions</span></h2></summary>
                            <div class="legal-body">
                                <div class="faq-tools">
                                    <span class="faq-count">${faqData.length} questions</span>
                                    <span>
                                        <button type="button" class="faq-expand-all">Expand all</button>
                                        <button type="button" class="faq-collapse-all">Collapse all</button>
                                    </span>
                                </div>
${items}
                            </div>
                        </details>
                    </section>
                    <!--faq:end-->`;

const jsonld = `<!--faq-jsonld:begin--><script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqData.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
}, null, 2)}
</script><!--faq-jsonld:end-->`;

const file = path.join(ROOT, 'footer.html');
const raw = fs.readFileSync(file, 'utf8');
const crlf = raw.includes('\r\n');
let t = raw.replace(/\r\n/g, '\n');

const swap = (text, begin, end, block, anchor, where) => {
  const re = new RegExp(`${begin}[\\s\\S]*?${end}`);
  if (re.test(text)) return text.replace(re, () => block);
  if (!text.includes(anchor)) throw new Error('build-faq: anchor not found: ' + anchor);
  return where === 'before' ? text.replace(anchor, () => block + '\n' + anchor) : text.replace(anchor, () => anchor + '\n' + block);
};

// the card goes after the privacy card, inside the same column
t = swap(t, '<!--faq:begin-->', '<!--faq:end-->', card, '                    <section class="legal-card" id="section-privacy">', 'before');
// structured data in the head
t = swap(t, '<!--faq-jsonld:begin-->', '<!--faq-jsonld:end-->', jsonld, '</head>', 'before');
// table-of-contents link
if (!t.includes('href="#section-faq"')) {
  t = t.replace('<li><a href="#section-privacy">Cookies &amp; Privacy</a></li>', (s) => s + '\n                            <li><a href="#section-faq">Frequently Asked Questions</a></li>');
}

const out = crlf ? t.replace(/\n/g, '\r\n') : t;
if (CHECK) {
  if (out !== raw) {
    console.error('footer.html FAQ block is stale: run node scripts/build-faq.mjs');
    process.exit(1);
  }
  console.log('footer.html FAQ block is current (' + faqData.length + ' questions)');
} else {
  fs.writeFileSync(file, out);
  console.log('footer.html: wrote ' + faqData.length + ' questions');
}
