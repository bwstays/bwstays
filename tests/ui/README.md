# UI tests

Browser tests that open the site in real Chrome. Nothing here is published by GitHub Pages in a way
visitors see; the folder only holds test code.

```
npm install                                     # once, in the project folder (Chrome itself must be installed)
node tests/ui/links.test.mjs                    # every page, every link clicked (about 15 minutes)
node tests/ui/links.test.mjs --external         # + request every outside link (about 11 minutes)
node tests/ui/links.test.mjs --page index.html,footer.html
node tests/ui/links.test.mjs --concurrency 2    # fewer pages at a time (default 4) when memory is short
```

On Windows, open a Command Prompt and go to the project folder first:

```
cd /d C:\personal\mybusi\land_homestay\kalpatta\bwstays\bwstays
npm install
node tests\ui\links.test.mjs
notepad tests\ui\results\links-report.md
```

`npm run test:links` and `npm run test:links:external` do the same. `npm install` reads `package.json`
and puts playwright-core (and postcss, for `scripts/build-bootstrap-lite.mjs`) in `node_modules`,
which is not committed. "playwright-core is not installed" means `npm install` was not run in this folder.

Set `CHROME_PATH` if Chrome is not in a standard place and `PLAYWRIGHT_CORE` (path to
`playwright-core/index.mjs`) if it is installed outside the repository, as for `scripts/prerender.mjs`.

## links.test.mjs: every link on every page

The repository is served as `https://www.bwstays.com` inside the browser, so absolute links work
offline. Only files tracked by git are served and paths are case-sensitive, exactly like GitHub Pages
(a link to `...-Wayanad.html` when the file is `...-wayanad.html` is a 404 on the live site even
though it opens on Windows). Outside requests are blocked while pages load.

For each published page (redirect pages are checked without a browser):

| Check | Broken when |
|---|---|
| Page loads | not 200 |
| Every `<a href>` is clicked (after the page scripts have built their lists) | a click starts no navigation, or leads to a page that does not exist |
| Menu items, Know More / View Attractions buttons and nearby-place cards are also clicked with the real mouse (scrolled into view), and the menu is opened with its Menu button and every item tapped at phone size (390 px) | the link is hidden or covered, or the click does not lead to its page |
| Link to another page of the site | the page does not exist, or its `#section` is not on that page once rendered (a `#name` the page script maps, like `footer.html#tc`, must scroll the page) |
| `#section` link on the same page | no element with that id, and clicking does not scroll anywhere |
| `#` / `javascript:` links (menus, toggles) | clicking throws a JavaScript error |
| `mailto:`, `tel:` | no valid address / number |
| Images, scripts, styles, icons, manifest, canonical / hreflang / `og:url` / `og:image` | the file does not exist |
| Redirect pages | the target does not exist |
| JavaScript errors while loading | an uncaught error (reported only as "to look at" when an outside script was blocked, since the error may come from that) |
| `--external`: outside links | DNS failure, refused connection, 404/410 and similar. 401/403/429/999, timeouts, certificate problems and social sites are "could not verify", not broken |

"To look at" (not failures): placeholder phone or WhatsApp numbers, a click that opens a different
address than the link shows, outside links that could not be verified.

Results (not committed): `tests/ui/results/links-report.html` (verdict, totals, broken, to look at, every page, outside links, run details), `links-report.md` and `links-report.json`. `node tests/ui/report-html.mjs [report.json]` rebuilds the HTML from a saved JSON. Step-by-step instructions for a manual run on Windows: `tests/ui/TEST-RUN-STEPS.txt`.
Exit code 1 when anything is broken.

The workflow `.github/workflows/ui-tests.yml` runs it on every push and pull request and, with
`--external`, every Monday.

## Short runs (batches)

When long jobs get stopped, run both tests in pieces of a few minutes each; the combined report counts as
a full run for the scoreboard (`scripts/loop-metrics.mjs`):

```
node tests/ui/run-batches.mjs links 0 8     # ... up to links 7 8 (every 8th page each)
node tests/ui/run-batches.mjs links --combine 8
node tests/ui/run-batches.mjs compat chrome # then edge, firefox, safari
node tests/ui/run-batches.mjs compat --combine
```
