// HTML report of tests/ui/compat.test.mjs: a grid of pages x browser/size, the problems and the screenshots.
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://www.bwstays.com';
const LABEL = { chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox', safari: 'Safari (WebKit)', phone: 'phone 390', tablet: 'tablet 820', desktop: 'desktop 1366' };

export function renderCompatReport(rep) {
  const { results, pages, sizes } = rep;
  const browsers = rep.browsers.filter((b) => !rep.run.skipped?.some((s) => s.browser === b));
  const cols = browsers.flatMap((b) => sizes.map((s) => [b, s]));
  const get = (p, b, s) => results.find((r) => r.page === p && r.browser === b && r.size === s);
  const n = (st) => results.filter((r) => r.status === st).length;
  const broken = n('broken'), look = n('look'), ok = n('ok');
  const pass = broken === 0;
  const finished = rep.run.finished;

  const grid = `<div class="scroll"><table class="grid"><thead><tr><th rowspan="2">Page</th>${browsers.map((b) => `<th colspan="${sizes.length}" class="c">${esc(LABEL[b] ?? b)}<div class="ver">${esc(rep.run.versions?.[b] ?? '')}</div></th>`).join('')}</tr>
    <tr>${cols.map(([, s]) => `<th class="c small">${esc(s)}</th>`).join('')}</tr></thead><tbody>${
    pages.map((p) => `<tr><td><a href="${esc(`${SITE}/${p}`)}">${esc(p.replace(/^bw-|-wayanad\.html$|\.html$/g, ''))}</a></td>${cols.map(([b, s]) => {
      const r = get(p, b, s);
      if (!r) return '<td class="c">–</td>';
      const title = r.problems.map((x) => `${x.what}${x.detail ? ': ' + x.detail : ''}`).join('\n') || 'no problems';
      const sym = r.status === 'ok' ? '✓' : r.status === 'look' ? '!' : '✗';
      return `<td class="c"><a class="dot ${r.status}" href="#${esc(`r-${b}-${s}-${p}`)}" title="${esc(title)}">${sym}</a></td>`;
    }).join('')}</tr>`).join('')
  }</tbody></table></div>`;

  // problems grouped by what, with the combinations that show them
  const groups = new Map();
  for (const r of results) for (const x of r.problems) {
    const k = `${x.level}|${x.what}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ r, x });
  }
  const problemList = [...groups.entries()].sort((a, b) => (a[0].startsWith('broken') ? 0 : 1) - (b[0].startsWith('broken') ? 0 : 1) || b[1].length - a[1].length).map(([k, list]) => {
    const [level, what] = k.split('|');
    return `<details class="group ${level}"${level === 'broken' ? ' open' : ''}><summary><span class="count">${list.length}</span> ${esc(what)}</summary><ul>${
      list.map(({ r, x }) => `<li><span class="where">${esc(LABEL[r.browser] ?? r.browser)} · ${esc(r.size)} · <a href="#${esc(`r-${r.browser}-${r.size}-${r.page}`)}">${esc(r.page)}</a></span><span class="detail">${esc(x.detail)}</span></li>`).join('')
    }</ul></details>`;
  }).join('') || '<p class="ok-note">No problems in any browser or screen size.</p>';

  const shots = pages.map((p) => `<details class="group shots"><summary>${esc(p)}</summary><div class="thumbs">${
    cols.map(([b, s]) => { const r = get(p, b, s); return r ? `<figure id="${esc(`r-${b}-${s}-${p}`)}" class="${r.status}">${r.shot ? `<a href="${esc(r.shot)}"><img loading="lazy" src="${esc(r.shot)}" alt="${esc(`${p} in ${LABEL[b]} at ${s} size`)}"></a>` : '<div class="noshot">no screenshot</div>'}<figcaption>${esc(LABEL[b] ?? b)} · ${esc(s)}${r.problems.length ? `<br><span class="${r.status}">${esc(r.problems.map((x) => x.what).join('; '))}</span>` : ''}</figcaption></figure>` : ''; }).join('')
  }</div></details>`).join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>Browser Test Report</title>
<style>
:root{--bg:#f6f7f7;--panel:#fff;--text:#1d2524;--muted:#5b6765;--line:#dfe4e3;--teal:#3f7f7b;--good:#1f7a4d;--good-bg:#e5f4ec;--bad:#b3261e;--bad-bg:#fbe9e7;--warn:#8a5a00;--warn-bg:#fdf3dc;--code:#eef1f0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121615;--panel:#1b2120;--text:#e3e8e7;--muted:#9aa6a4;--line:#2d3634;--teal:#64a19d;--good:#5cc28d;--good-bg:#173527;--bad:#ff8a80;--bad-bg:#3a1c1a;--warn:#f0c062;--warn-bg:#3a2e12;--code:#252d2b}}
:root[data-theme="dark"]{--bg:#121615;--panel:#1b2120;--text:#e3e8e7;--muted:#9aa6a4;--line:#2d3634;--teal:#64a19d;--good:#5cc28d;--good-bg:#173527;--bad:#ff8a80;--bad-bg:#3a1c1a;--warn:#f0c062;--warn-bg:#3a2e12;--code:#252d2b}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px 48px}a{color:var(--teal)}
header{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;margin-bottom:18px}h1{font-size:1.6rem;margin:0}h2{font-size:1.15rem;margin:0 0 12px}
.sub{color:var(--muted);margin:2px 0 0}.verdict{font-weight:700;padding:6px 14px;border-radius:999px}.verdict.good{background:var(--good-bg);color:var(--good)}.verdict.bad{background:var(--bad-bg);color:var(--bad)}
section{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:18px}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:18px}.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.card .k{color:var(--muted);font-size:.82rem}.card .v{font-size:1.35rem;font-weight:650}.card.good .v{color:var(--good)}.card.bad .v{color:var(--bad)}.card.warn .v{color:var(--warn)}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.88rem}th,td{padding:5px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:middle}
th.c,td.c{text-align:center}th.small{font-weight:500;color:var(--muted);font-size:.78rem}.ver{font-weight:400;color:var(--muted);font-size:.72rem}
.grid td:first-child{white-space:nowrap;max-width:240px;overflow:hidden;text-overflow:ellipsis}
.dot{display:inline-block;width:24px;height:24px;line-height:24px;border-radius:50%;text-decoration:none;font-weight:700}
.dot.ok{background:var(--good-bg);color:var(--good)}.dot.look{background:var(--warn-bg);color:var(--warn)}.dot.broken{background:var(--bad-bg);color:var(--bad)}
details.group{border:1px solid var(--line);border-radius:8px;margin:8px 0;padding:0 12px}details.group summary{cursor:pointer;padding:10px 0;font-weight:600}
.count{display:inline-block;min-width:2.2em;text-align:center;border-radius:999px;padding:0 8px;margin-right:6px;background:var(--warn-bg);color:var(--warn)}details.broken .count{background:var(--bad-bg);color:var(--bad)}
details.group ul{margin:0 0 12px;padding:0;list-style:none}details.group li{padding:6px 0;border-top:1px solid var(--line);display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:4px 14px}
.detail{overflow-wrap:anywhere}.where{color:var(--muted)}
.thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding-bottom:12px}
figure{margin:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--bg)}figure.broken{border-color:var(--bad)}figure.look{border-color:var(--warn)}
figure img{display:block;width:100%;height:220px;object-fit:cover;object-position:top}figcaption{font-size:.78rem;padding:6px 8px;color:var(--muted)}
figcaption .broken{color:var(--bad)}figcaption .look{color:var(--warn)}.noshot{height:220px;display:grid;place-items:center;color:var(--muted)}
.ok-note{background:var(--good-bg);color:var(--good);padding:10px 14px;border-radius:8px;margin:0;font-weight:600}.muted{color:var(--muted)}
code{background:var(--code);padding:1px 6px;border-radius:4px;overflow-wrap:anywhere}
@media (max-width:640px){details.group li{grid-template-columns:1fr}}
</style></head><body><div class="wrap">
<header><div><h1>Browser Test Report</h1><p class="sub">www.bwstays.com · ${esc(browsers.map((b) => LABEL[b] ?? b).join(', '))} · ${esc(sizes.map((s) => LABEL[s] ?? s).join(', '))} · finished <time data-iso="${esc(finished)}">${esc(finished)}</time></p></div>
<span class="verdict ${pass ? 'good' : 'bad'}">${pass ? 'PASS · nothing broken' : `FAIL · ${broken} broken`}</span></header>
<div class="cards">
<div class="card ${pass ? 'good' : 'bad'}"><div class="k">Result</div><div class="v">${pass ? 'PASS' : 'FAIL'}</div></div>
<div class="card"><div class="k">Combinations</div><div class="v">${results.length}</div></div>
<div class="card good"><div class="k">No problems</div><div class="v">${ok}</div></div>
<div class="card warn"><div class="k">To look at</div><div class="v">${look}</div></div>
<div class="card ${broken ? 'bad' : 'good'}"><div class="k">Broken</div><div class="v">${broken}</div></div>
<div class="card"><div class="k">Pages</div><div class="v">${pages.length}</div></div>
<div class="card"><div class="k">Duration</div><div class="v">${Math.floor(rep.run.seconds / 60)} min ${rep.run.seconds % 60} s</div></div>
</div>
${rep.run.skipped?.length ? `<section><h2>Browsers not tested</h2><ul>${rep.run.skipped.map((s) => `<li><b>${esc(LABEL[s.browser] ?? s.browser)}</b>: ${esc(s.reason)}</li>`).join('')}</ul></section>` : ''}
<section><h2>Pages × browsers × screen sizes</h2><p class="muted">✓ no problems · ! something to look at · ✗ broken. Hover for the problem, click for the screenshot.</p>${grid}</section>
<section><h2>Problems</h2>${problemList}</section>
<section><h2>Screenshots</h2><p class="muted">Top of each page as the browser showed it.</p>${shots}</section>
<section><h2>What is checked</h2><ul>
<li><b>Broken:</b> the page does not load; it scrolls sideways (wider than the screen); a site image fails to load; an uncaught JavaScript error; on a phone the Menu button does not open the menu or menu items stick out of the screen.</li>
<li><b>To look at:</b> text smaller than 11 px; on a phone, links and buttons smaller than 24 × 24 px (WCAG 2.2 target size; links inside sentences are exempt); JavaScript errors that may come from outside scripts, which are blocked in the test.</li>
<li>Chrome and Edge are the installed browsers; Firefox and Safari's engine (WebKit) are Playwright's builds. WebKit is close to Safari but is not Safari itself.</li>
</ul><p class="muted">Command: <code>${esc(rep.run.command)}</code> · Node ${esc(rep.run.node)} · ${esc(rep.run.platform)}</p></section>
</div>
<script>document.querySelectorAll('time[data-iso]').forEach(function(t){var d=new Date(t.getAttribute('data-iso'));if(!isNaN(d))t.textContent=d.toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});});</script>
</body></html>
`;
}
