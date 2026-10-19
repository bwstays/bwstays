// HTML version of the link test report (tests/ui/results/links-report.html).
// One self-contained file: no outside fonts, styles or scripts, opens from disk in any browser.

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://www.bwstays.com';
const num = (n) => (typeof n === 'number' ? n.toLocaleString('en-IN') : '–');
const dur = (s) => (typeof s === 'number' ? (s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`) : '–');

const CHECKS = [
  ['Page loads', 'Every published page opens in Chrome with status 200.'],
  ['Every link is clicked', 'After the page scripts have built their lists, each link is clicked; it must start a navigation (or open a tab) to exactly its address.'],
  ['Links to other pages', 'The page must exist on GitHub Pages (case-sensitive, git-tracked files only). A #section on it must exist once that page is rendered, or the page must scroll to it.'],
  ['#section links on the same page', 'An element with that id must exist, or clicking must scroll the page to the section.'],
  ['Menus and toggles (#, javascript:)', 'Clicking must not throw a JavaScript error.'],
  ['E-mail and phone links', 'mailto: needs a valid address, tel: a valid number. Placeholder numbers are listed under "To look at".'],
  ['Files the page loads', 'Images, scripts, styles, icons, manifest, canonical, hreflang, og:url and og:image addresses must exist.'],
  ['Redirect pages', 'The page they forward to must exist.'],
  ['Outside links (only with --external)', 'Requested over the network. DNS errors, refused connections and 404/410 are broken; 401/403/429, timeouts, certificate problems and social sites are "could not verify".'],
];

function groups(list) {
  const m = new Map();
  for (const x of list ?? []) { if (!m.has(x.what)) m.set(x.what, []); m.get(x.what).push(x); }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
}

function issueSection(id, title, list, kind) {
  if (!list?.length) {
    return kind === 'broken'
      ? `<section id="${id}"><h2>${esc(title)}</h2><p class="ok-note">Nothing is broken. Every link that was clicked worked.</p></section>`
      : `<section id="${id}"><h2>${esc(title)}</h2><p class="muted">Nothing to look at.</p></section>`;
  }
  const body = groups(list).map(([what, items], i) => `
    <details class="group ${kind}"${kind === 'broken' || i === 0 ? ' open' : ''}>
      <summary><span class="count">${items.length}</span> ${esc(what)}</summary>
      <ul>${items.map((x) => `<li><a class="page" href="${esc(`${SITE}/${x.page}`)}">${esc(x.page)}</a><span class="detail">${esc(x.detail)}</span></li>`).join('')}</ul>
    </details>`).join('');
  return `<section id="${id}"><h2>${esc(title)} <span class="pill ${kind}">${list.length}</span></h2>${body}</section>`;
}

/**
 * report: the object written to links-report.json. An older report without `run` or `pages`
 * can be given `fallback` ({ finished, seconds, outsideLinks, outsideChecked, command }).
 */
export function renderReport(report, fallback = {}) {
  const run = { ...fallback, ...(report.run ?? {}) };
  const s = { outsideLinks: fallback.outsideLinks, outsideChecked: fallback.outsideChecked, siteTargets: fallback.siteTargets, ...(report.stats ?? {}) };
  const failures = report.failures ?? [];
  const warnings = report.warnings ?? [];
  const pass = failures.length === 0;
  const byPage = (list) => { const m = new Map(); for (const x of list) m.set(x.page, (m.get(x.page) ?? 0) + 1); return m; };
  const fb = byPage(failures), wb = byPage(warnings);
  const finished = run.finished ? new Date(run.finished) : null;
  const when = finished ? finished.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC') : '–';

  const cards = [
    ['Result', pass ? 'PASS' : 'FAIL', pass ? 'good' : 'bad'],
    ['Broken', num(failures.length), failures.length ? 'bad' : 'good'],
    ['To look at', num(warnings.length), warnings.length ? 'warn' : ''],
    ['Pages tested', num(s.pages), ''],
    ['Redirect pages', num(s.redirects), ''],
    ['Links found', num(s.links), ''],
    ['Links clicked', num(s.clicked), ''],
    ['Site pages linked', num(s.siteTargets), ''],
    ['Outside links', `${num(s.outsideLinks)}${s.outsideChecked ? ' checked' : ' (not checked)'}`, ''],
    ['Duration', dur(run.seconds), ''],
  ].map(([k, v, c]) => `<div class="card ${c}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`).join('');

  const details = [
    ['Finished', `<time data-iso="${esc(run.finished ?? '')}">${esc(when)}</time>`],
    ['Started', run.started ? esc(run.started.replace('T', ' ').replace(/\.\d+Z$/, ' UTC')) : '–'],
    ['Command', `<code>${esc(run.command ?? 'node tests/ui/links.test.mjs')}</code>`],
    ['Outside links checked', run.external ?? s.outsideChecked ? 'yes (--external)' : 'no (run with --external to check them)'],
    ['Pages at a time', esc(run.concurrency ?? 4)],
    ['Pages selected', run.only ? esc(run.only.join(', ')) : 'all published pages'],
    ['Chrome', esc(run.chrome ?? '–')],
    ['Node.js', esc(run.node ?? '–')],
    ['Computer', esc(run.platform ?? '–')],
    ['Site served as', `${SITE} (from the local repository, git-tracked files, case-sensitive paths; outside requests blocked while pages load)`],
  ].map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`).join('');

  const rows = report.pages?.length
    ? report.pages.map((p) => {
      const b = fb.get(p.file) ?? 0, w = wb.get(p.file) ?? 0;
      const status = b ? '<span class="tag bad">broken</span>' : w ? '<span class="tag warn">look at</span>' : '<span class="tag good">ok</span>';
      const what = p.kind === 'redirect' ? `redirect → ${esc((p.target ?? '').replace(`${SITE}/`, ''))}` : esc(p.title);
      return `<tr><td><a href="${esc(`${SITE}/${p.file}`)}">${esc(p.file)}</a></td><td class="t">${what}</td><td class="n">${num(p.links)}</td><td class="n">${num(p.clicked)}</td><td class="n">${num(p.resources)}</td><td class="n">${b || ''}</td><td class="n">${w || ''}</td><td class="n">${p.ms ? (p.ms / 1000).toFixed(1) + ' s' : ''}</td><td>${status}</td></tr>`;
    }).join('')
    : null;
  const pagesSection = rows
    ? `<section id="pages"><h2>Pages <span class="pill">${report.pages.length}</span></h2>
      <div class="scroll"><table class="pages"><thead><tr><th>Page</th><th>Title</th><th class="n">Links</th><th class="n">Clicked</th><th class="n">Files</th><th class="n">Broken</th><th class="n">Look at</th><th class="n">Time</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></section>`
    : `<section id="pages"><h2>Pages</h2><p class="muted">This run was made before the test recorded figures per page; the next run adds a table of every page (links, clicks, files, time).</p></section>`;

  const ext = report.external?.length
    ? `<section id="outside"><h2>Outside links <span class="pill">${report.external.length}</span></h2>
      <div class="scroll"><table><thead><tr><th>Address</th><th>Result</th><th>Detail</th><th class="n">Linked from</th></tr></thead><tbody>${
        [...report.external].sort((a, b) => ({ broken: 0, unverified: 1, ok: 2 }[a.verdict] - { broken: 0, unverified: 1, ok: 2 }[b.verdict]) || a.url.localeCompare(b.url))
          .map((e) => `<tr><td class="url"><a href="${esc(e.url)}" rel="noopener noreferrer nofollow">${esc(e.url)}</a></td><td><span class="tag ${e.verdict === 'ok' ? 'good' : e.verdict === 'broken' ? 'bad' : 'warn'}">${esc(e.verdict === 'unverified' ? 'could not verify' : e.verdict)}</span></td><td>${esc(e.detail)}</td><td class="n">${num(e.refs?.length)}</td></tr>`).join('')
      }</tbody></table></div></section>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Link Test Report</title>
<style>
:root{--bg:#f6f7f7;--panel:#fff;--text:#1d2524;--muted:#5b6765;--line:#dfe4e3;--teal:#3f7f7b;--good:#1f7a4d;--good-bg:#e5f4ec;--bad:#b3261e;--bad-bg:#fbe9e7;--warn:#8a5a00;--warn-bg:#fdf3dc;--code:#eef1f0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121615;--panel:#1b2120;--text:#e3e8e7;--muted:#9aa6a4;--line:#2d3634;--teal:#64a19d;--good:#5cc28d;--good-bg:#173527;--bad:#ff8a80;--bad-bg:#3a1c1a;--warn:#f0c062;--warn-bg:#3a2e12;--code:#252d2b}}
:root[data-theme="dark"]{--bg:#121615;--panel:#1b2120;--text:#e3e8e7;--muted:#9aa6a4;--line:#2d3634;--teal:#64a19d;--good:#5cc28d;--good-bg:#173527;--bad:#ff8a80;--bad-bg:#3a1c1a;--warn:#f0c062;--warn-bg:#3a2e12;--code:#252d2b}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:24px 16px 48px}
header{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:20px}
h1{font-size:1.6rem;margin:0}
h2{font-size:1.15rem;margin:0 0 12px;display:flex;align-items:center;gap:8px}
.sub{color:var(--muted);margin:2px 0 0}
.verdict{font-weight:700;font-size:1rem;padding:6px 14px;border-radius:999px}
.verdict.good{background:var(--good-bg);color:var(--good)}.verdict.bad{background:var(--bad-bg);color:var(--bad)}
nav{display:flex;flex-wrap:wrap;gap:6px 14px;margin:0 0 20px;font-size:.92rem}
a{color:var(--teal)}
section{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:18px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.card .k{color:var(--muted);font-size:.82rem}.card .v{font-size:1.35rem;font-weight:650;margin-top:2px;overflow-wrap:anywhere}
.card.good .v{color:var(--good)}.card.bad .v{color:var(--bad)}.card.warn .v{color:var(--warn)}
table{border-collapse:collapse;width:100%;font-size:.9rem}
th,td{text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
thead th{color:var(--muted);font-weight:600;white-space:nowrap}
table.kv th{width:210px;color:var(--muted);font-weight:500}
td.n,th.n{text-align:right;white-space:nowrap}
td.t{color:var(--muted);min-width:180px}
td.url{overflow-wrap:anywhere;max-width:460px}
.scroll{overflow-x:auto}
code{background:var(--code);padding:1px 6px;border-radius:4px;font-size:.88em;overflow-wrap:anywhere}
.tag,.pill{display:inline-block;font-size:.78rem;font-weight:600;padding:1px 9px;border-radius:999px;background:var(--code);color:var(--muted);white-space:nowrap}
.tag.good,.pill.good{background:var(--good-bg);color:var(--good)}.tag.bad,.pill.broken{background:var(--bad-bg);color:var(--bad)}.tag.warn,.pill.look{background:var(--warn-bg);color:var(--warn)}
details.group{border:1px solid var(--line);border-radius:8px;margin:8px 0;padding:0 12px}
details.group summary{cursor:pointer;padding:10px 0;font-weight:600}
details.group .count{display:inline-block;min-width:2.2em;text-align:center;border-radius:999px;padding:0 8px;margin-right:6px;background:var(--warn-bg);color:var(--warn)}
details.group.broken .count{background:var(--bad-bg);color:var(--bad)}
details.group ul{margin:0 0 12px;padding:0;list-style:none}
details.group li{padding:6px 0;border-top:1px solid var(--line);display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:4px 14px}
details.group .detail{overflow-wrap:anywhere;color:var(--text)}
.checks{margin:0;padding-left:18px}.checks li{margin:4px 0}
.ok-note{background:var(--good-bg);color:var(--good);padding:10px 14px;border-radius:8px;margin:0;font-weight:600}
.muted{color:var(--muted);margin:0}
pre{background:var(--code);padding:12px 14px;border-radius:8px;overflow-x:auto;font-size:.88rem;margin:8px 0 0}
@media (max-width:640px){details.group li{grid-template-columns:1fr}table.kv th{width:auto}h1{font-size:1.3rem}}
</style>
</head>
<body>
<div class="wrap">
<header>
  <div>
    <h1>Link Test Report</h1>
    <p class="sub">www.bwstays.com · every link on every page clicked in Chrome · finished <time data-iso="${esc(run.finished ?? '')}">${esc(when)}</time></p>
  </div>
  <span class="verdict ${pass ? 'good' : 'bad'}">${pass ? 'PASS · no broken links' : `FAIL · ${failures.length} broken`}</span>
</header>
<nav aria-label="Sections"><a href="#broken">Broken</a><a href="#look">To look at</a><a href="#pages">Pages</a>${ext ? '<a href="#outside">Outside links</a>' : ''}<a href="#run">Run details</a><a href="#checks">What is checked</a><a href="#again">Run it again</a></nav>
<div class="cards">${cards}</div>
${issueSection('broken', 'Broken', failures, 'broken')}
${issueSection('look', 'To look at', warnings, 'look')}
${pagesSection}
${ext}
<section id="run"><h2>Run details</h2><div class="scroll"><table class="kv"><tbody>${details}</tbody></table></div></section>
<section id="checks"><h2>What is checked</h2><ul class="checks">${CHECKS.map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')}</ul></section>
<section id="again"><h2>Run it again</h2>
<p class="muted">In a Command Prompt (steps in tests\\ui\\TEST-RUN-STEPS.txt):</p>
<pre>cd /d C:\\personal\\mybusi\\land_homestay\\kalpatta\\bwstays\\bwstays
npm install
node tests\\ui\\links.test.mjs              (site links, about 9 minutes)
node tests\\ui\\links.test.mjs --external   (also outside links, about 11 minutes)
start tests\\ui\\results\\links-report.html</pre>
</section>
</div>
<script>
// show the finish time in the viewer's own time zone
document.querySelectorAll('time[data-iso]').forEach(function (t) {
  var d = new Date(t.getAttribute('data-iso'));
  if (!isNaN(d)) t.textContent = d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
});
</script>
</body>
</html>
`;
}
