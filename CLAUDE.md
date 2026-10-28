# BWStays Static MCP Implementation

## Project Overview
Generate Static MCP JSON files for the BWStays website to enable AI assistants to understand and interact with the site's content and functionality.

## Static MCP Documentation

### What is Static MCP?
Static MCP is an approach to serving AI model context by pre-generating all responses as static JSON files that can be served from any CDN or static hosting provider. It's essentially "RSS for AI" - a standardized way to expose structured content for machine consumption.

### Core Principles
1. **Pre-generation**: All responses are computed at build time, not runtime
2. **Static hosting**: JSON files served from CDN (Vercel, Netlify, GitHub Pages)
3. **Zero computation**: No servers, databases, or runtime processing
4. **Global caching**: Instant responses via CDN edge servers

### File Structure
```
bwstays/
├── mcp.json                    # Main manifest file
├── resources/                  # Pre-built resource responses
│   ├── about.json             # About BWStays content
│   ├── properties.json        # Property listings
│   ├── amenities.json         # Available amenities
│   ├── booking.json           # Booking information
│   └── policies.json          # Terms and policies
└── tools/                      # Pre-built tool responses
    ├── search/
    │   ├── locations.json     # Location search results
    │   ├── dates.json         # Date availability
    │   └── properties.json    # Property search
    └── booking/
        ├── availability.json   # Check availability
        └── pricing.json        # Pricing calculations
```

### mcp.json Structure
The main manifest file that describes available resources and tools:
```json
{
  "name": "bwstays",
  "version": "1.0.0",
  "description": "AI context for BWStays vacation rental platform",
  "resources": [
    {
      "name": "about",
      "description": "Information about BWStays",
      "path": "/resources/about.json"
    },
    {
      "name": "properties",
      "description": "Available property listings",
      "path": "/resources/properties.json"
    }
  ],
  "tools": [
    {
      "name": "search_properties",
      "description": "Search for available properties",
      "path": "/tools/search/properties.json"
    }
  ]
}
```

### Resource JSON Format
Each resource file contains pre-generated content:
```json
{
  "name": "resource_name",
  "content": "Pre-generated content or data",
  "metadata": {
    "generated": "2024-01-01T00:00:00Z",
    "type": "markdown|json|text"
  }
}
```

### Tool JSON Format
Tool files contain pre-computed responses for various inputs:
```json
{
  "name": "tool_name",
  "responses": [
    {
      "input": {"param": "value"},
      "output": {"result": "pre-computed result"}
    }
  ]
}
```

## BWStays Implementation Plan

### Phase 1: Content Extraction
1. **Analyze existing website content** in `bwstays/` folder
2. **Identify key information** to expose to AI:
   - Property descriptions and amenities
   - Booking policies and procedures
   - Location information
   - Pricing structures
   - Contact information

### Phase 2: JSON Generation
1. **Create generation scripts** to:
   - Parse HTML/content from bwstays/ folder
   - Extract structured data
   - Generate JSON files in Static MCP format

2. **Content to extract**:
   - Homepage content → about.json
   - Property listings → properties.json
   - Amenities list → amenities.json
   - Booking policies → policies.json
   - FAQ/Help content → help.json

### Phase 3: Tool Implementation
1. **Define tool responses** for common queries:
   - Property search by location/date
   - Availability checking
   - Pricing calculations
   - Booking process information

### Phase 4: Deployment
1. **Build process**:
   - Generate all JSON files
   - Validate structure
   - Create mcp.json manifest

2. **Hosting**:
   - Deploy to `/mcp/` directory
   - Configure CDN caching
   - Set up bridge server connection

### Implementation Notes

#### Data Sources in bwstays/
- `index.html` - Main site content, property features
- CSS/JS files - UI components that may contain data
- Images - Property photos (reference in JSON)
- Any config files with site data

#### Generation Strategy
1. Parse HTML files for content
2. Extract text, structure, and metadata
3. Transform to Static MCP JSON format
4. Organize by logical categories
5. Pre-compute common query responses

#### Key Benefits for BWStays
- **Instant AI responses** about properties and bookings
- **No server costs** for AI context serving
- **Global availability** via CDN
- **Controlled information** - only expose what we choose
- **Version control** - update AI context with deployments

### Next Steps
1. Analyze current bwstays/ folder structure
2. Create JSON generation scripts
3. Generate initial Static MCP files
4. Test with MCP bridge
5. Deploy to production

### Bridge Server
Use hosted bridge at: `https://bridge.staticmcp.com`
Or self-host bridge for custom requirements

### References
- [Static MCP Website](https://staticmcp.com)
- [MCP Protocol Specification](https://modelcontextprotocol.org)
- Static MCP RFC and Standard documentation

## Implementation Status

The Static MCP files are **generated**, not hand-edited:

```
node scripts/generate-mcp.mjs           # regenerate mcp.json, .well-known/mcp.json, resources/, tools/
node scripts/generate-mcp.mjs --check   # exit 1 if committed files are stale (use in CI)
```

Sources (single source of truth): `data/sitedata.js`, `data/shopdata.js`,
`data/nearbylocationsdata.js`, `data/bookingdata.js`, `data/closeddata.js`,
`js/faq.js`, `index.html`, `bwstays-booking.html` (villa card, amenities, rate), `footer.html`. `villa1.html` is only a redirect to the booking page (old links); it is not linked from any page, sitemap, MCP or llms file.

Rules the generator follows:
- Only facts present on the site are emitted. Missing facts are reported as not published; nothing is invented.
- The placeholder `stays` category in `data/sitedata.js` is never published.
- Conflicts between pages (villa rate/capacity) are reported side by side with a note, not silently resolved.
- No verified phone number is published on the site, so `phone` is `null` in the MCP output.

## Refreshing the community data

Both datasets are built from OpenStreetMap, so the site keeps working on free static hosting with no runtime API.

```
node scripts/build-distances.mjs   # data/nearbylocationsdata.js: driving km between places (OSRM)
node scripts/build-food.mjs        # data/food-places.json + .csv: places to eat (Overpass + site list)
node scripts/generate-mcp.mjs      # then regenerate the MCP files
```

- Missing opening hours, phones or cuisines are left null. The fix is to add them on OpenStreetMap (each place carries an `osm_edit_url`) and re-run the script.
- Places whose coordinates cannot be trusted keep their historical distances or stay 0 (unknown); they are listed in `locations.meta`.
- Attribution: data (c) OpenStreetMap contributors, ODbL.

### Scheduled refreshes

**Stopped by the owner (2026-10-20):** only `refresh-availability.yml` still runs on a schedule. `refresh-rates.yml`, `refresh-data.yml` and `verify-data.yml` are disabled in GitHub Actions (their files keep the cron lines; turn one back on with `gh workflow enable <file>`), the Monday run of `ui-tests.yml` was removed, and no `/loop` or scheduled routine runs the improvement or verify-data loops. Do not re-enable or restart any of them unless the owner asks; until then run them by hand (workflow_dispatch or the slash command).

- `.github/workflows/refresh-rates.yml` (1st of the month, disabled): exchange rates, committed to main.
- `.github/workflows/refresh-availability.yml` (every 30 minutes): reads the calendar iCal feeds in the repository secret `BW_ICAL_URLS` (Google Calendar, Airbnb, Booking.com; optional `booked|` / `closed|` prefix per line) with `scripts/build-availability.mjs`, rewrites `data/bookingdata.js` and `data/closeddata.js` (today to +1 year, no guest details) and commits to main only when they changed. A feed failure leaves the last good files in place. Test locally with `node scripts/build-availability.mjs --dry-run --file sample.ics`.
- `.github/workflows/refresh-data.yml` (2nd of the month, disabled): food places and driving distances, then the booking report, MCP files, map data and search index. It opens a pull request (branch `data-refresh-YYYY-MM`) only when the OpenStreetMap data really changed; nothing reaches main without review. Run it by hand from the Actions tab (workflow_dispatch).

### Icons (Font Awesome)

Font Awesome Free 5.15.1 is self-hosted as a web font: `css/fontawesome.min.css` plus `assets/fonts/fontawesome/*.woff2` (solid, brands, regular), loaded by a `<link>` in each page's head. The old `all.min.js` (SVG-with-JS) is no longer used, so icons are plain `<i class="fas fa-...">` elements and CSS rules that target `i` apply. The css and fonts are a subset holding only the icons the site uses (about 7 KB css + 9 KB fonts instead of 58 KB + 170 KB). After adding an icon (`fa-...`) anywhere, run `python scripts/build-fontawesome.py` (needs `pip install fonttools brotli`) and then `node scripts/version-assets.mjs`. The unmodified Font Awesome 5.15.1 sources are kept in `scripts/fontawesome-src/`.

### Road distances and drive paths (no straight lines)

- `node scripts/build-road-near.mjs` (`--check` is part of `check.mjs`) writes `data/road-near.json`: road km and driving minutes (OSRM on OpenStreetMap data) from each place page's `data-center` to the places its food, EV and fuel widgets list. The selection rule (radius, max, fallback) is copied from `js/dynamic-foodmap.js` and `js/dynamic-evgas.js`: change both together. Re-run after `build-food.mjs`, `build-fuel.mjs`, an edit of `data/ev-stations.json` or a new place page (the monthly data workflow does), then `prerender.mjs`.
- `js/road-path.js` (loaded before those two widgets) gives them the road km (lists sorted by road distance; a missing value shows straight-line km with a ≈ sign) and draws the road path from the place to a row when it is tapped (public OSRM server, on demand, kept a week in the browser). The food map no longer draws a radius circle.
- Trails (`js/trails.js`): each day's stops take the order with the fewest road km (every order of up to 5 stops is tried); lunch is the place to eat that adds the least driving between its stop and the next one; the map's road route goes through the lunch stop, and every leg in the list shows the route's road km once it loads. The planner is a quick-start row of ready-made trails, then four numbered steps of tiles (days, area with "All of Wayanad", interests with "Everything", pace) and a summary bar; every stop and lunch has a "Go" directions link and each day an "Open day in Google Maps" link with all its stops in order; the map draws only road routes (no straight lines). New Font Awesome icons there need `python scripts/build-fontawesome.py`. The "Must-see highlights" choice (`?focus=highlights`, and the 2-day highlights ready-made trail) shares the must-see places over the fewest days with the least driving, across areas, then fills those days with places along the way; without it each day keeps to one area. `MUST_SEE` there lists the must-see place ids (owner's choice: Chembra Peak, Pookode Lake, Edakkal Caves, Banasura Sagar Dam).

### Types of place (one label, icon and photo each)

`data/categories.js` (`bwCategories`) is the single source for the name, Font Awesome icon and photo of each type of place (keys = the category keys of `data/sitedata.js`; photos = the home page row photos). Used by the home "Discover" row titles and the place pages ("Type", "... Places") through `js/knowmore-place-dynamic.js`, by `scripts/build-map-data.mjs` (labels, icons and photos in `data/map-places.json`), and through that by the all-locations map filters and the trails planner. `data/categories.js` is loaded before `sitedata` on every page that uses it. The `type` text inside each place in `sitedata.js` is no longer shown where a category label exists. After a change: build-map-data, minify-assets, version-assets, prerender (and build-fontawesome for a new icon).

`version-assets.mjs` also versions the icon font files (`assets/fonts/**.woff2?v=`), in `css/fontawesome.min.css` and in the font preload tags: the fonts are cached for a year, so without it a rebuilt icon subset reached returning visitors as blank icons.

### Other generated data and checks

```
node scripts/build-map-data.mjs      # data/map-places.json: all-locations map with category filters
node scripts/build-search-index.mjs  # data/search-index.json: search.html (run generate-mcp first)
node scripts/update-rates.mjs        # data/exchange-rates.json: dated fallback for the currency widget
node scripts/build-booking-report.mjs # data/booking-reports.json from the booking calendar (reports page)
node scripts/check.mjs               # syntax, JSON, JSON-LD, duplicate ids, MCP freshness (also runs in CI)
```

### Source of truth for front-end code

`js/` and `css/` are edited directly and are the source of truth. The old unminified copies (`scripts/*.js`, `styles/`, `scripts/min.ps1`) were removed because they were stale and re-running the minify script would have overwritten later fixes. `scripts/` now holds only the Node build and check scripts. The pages load minified copies (`name.min.css`, `name.min.js`, `data/name.min.js`, each with a `.map` source map, so browser dev tools show the readable source). Edit only the readable files. After changing anything under `css/`, `js/` or `data/*.js`, run `node scripts/minify-assets.mjs` (rebuilds the `.min` files and points the pages at them) and then `node scripts/version-assets.mjs` (fresh `?v=` hashes). `check.mjs` fails if a `.min` file is older than its source. To go back to the unminified files, check out the tag `restore-before-speed-pass`.

### Progressive Web App (installable, works offline)

```
node scripts/build-pwa.mjs           # regenerate /sw.js (service worker)
node scripts/build-pwa.mjs --check   # exit 1 if /sw.js is stale (also run by check.mjs)
```

- `manifest.json`: name, icons (192, 512, maskable 512 in `assets/img/pwa/`), theme colours, shortcuts (Book, Locations, Eatery).
- `scripts/pwa/sw.template.js` is the source of the service worker; **`/sw.js` is generated, never edit it**. It lives at the site root so it controls every page.
- Shell (css, js, fonts, vendor, small data, offline page, icons) is saved at install. After the first load the rest of the site (all HTML pages, data, images) is saved in the background, skipped on Save-Data/2G. Pages are network-first with a 4 s timeout, then the saved copy, then `/offline.html`. Availability data is network-first.
- `js/pwa.js` registers the worker, shows the update prompt, offline notice and install prompt (Android and an iOS hint).
- The worker VERSION only changes when a shell file changes, so booking updates do not make visitors re-download the shell. Run `build-pwa` after `minify-assets` and `version-assets`; the availability and data workflows already do.
- Needs a connection: live availability, booking submit (formsubmit), chat, weather, currency rates, map tile backgrounds, Tally embed.
- To go back: tag `restore-before-pwa`.

### Sitemap, LLMFeed and data worklists

```
node scripts/build-sitemap.mjs     # sitemap.xml, page-sitemap.xml, sitemap.txt, sitemap_index.xml (lastmod from git)
node scripts/build-llmfeed.mjs     # .well-known/mcp.llmfeed.json from mcp.json (run after generate-mcp)
node scripts/build-llms.mjs        # generated block at the end of llms.txt and llms-full.txt (run after generate-mcp)
node scripts/build-fuel.mjs        # data/fuel-places.json: Wayanad fuel stations from OpenStreetMap
node scripts/build-survey.mjs      # data/survey-food.csv and data/survey-coordinates.csv: what to verify on the ground
node scripts/probe-coords.mjs 3 6  # read-only OpenStreetMap lookup for places whose coordinate is not trusted
```

- IndexNow (Bing, Yandex, Seznam, Naver, Yep; not Google): `node scripts/indexnow.mjs --all | --since <ref> | --url <u>` (`--dry-run` to only list) submits pages from `sitemap.txt`, with the key file `db702d3939d94b42a7d3e5314ae2ca3e.txt` at the root. `.github/workflows/indexnow.yml` runs it after each push to main that changes a page (it waits 4 minutes for the Pages deploy); run it by hand with "all" to submit the whole site. See `docs/cloudflare-security-headers.md` section 5.
- AI crawlers: the AI search crawlers (OAI-SearchBot, Claude-SearchBot, PerplexityBot and the -User fetchers) must be allowed every day; only the training crawlers are on the Cloudflare weekly window (owner, 2026-10-27; `docs/cloudflare-security-headers.md` section 4, probed by `check-headers.mjs`).
- Cloudflare cache purge: `.github/workflows/purge-cache.yml` runs after every successful Pages deploy and purges the files changed since the previous deploy (`scripts/purge-cloudflare.mjs`, `--dry-run` to list). It needs the secrets `CLOUDFLARE_API_TOKEN` (Zone > Cache Purge > Purge) and `CLOUDFLARE_ZONE_ID`; without them it does nothing. Setup: `docs/cloudflare-security-headers.md` section 6.
- `check.mjs` verifies that the sitemap lists every indexable page and that the LLMFeed is current. The sitemap `lastmod` ignores site-wide edits (asset versions, plumbing, the same change committed page by page); the monthly workflow checks out full history so dates stay correct.
- `llms.txt` is hand-written except for the block between `BEGIN/END GENERATED: site-data`, which `build-llms.mjs` rewrites from the MCP data (booking rules, shopping places, EV and fuel stations); `llms-full.txt` ends with the same kind of block.
- The rest of `llms-full.txt` is generated: `node scripts/build-llms-full.mjs` (`--check` is part of `check.mjs`) turns every page in `sitemap.txt` (as committed, so after `prerender.mjs`) into Markdown, with the shared contact/about/footer blocks written once. It leaves out redirect pages, the guest review cards and placeholder phone numbers, and keeps the generated block. Re-run it after changing any page text or prerendering. The site chat reads `llms-full.txt`.
- `data/mcp-review.json` `coordinate_confirmations` lists hills/peaks whose coordinate is far from a road but matches an OpenStreetMap feature; `build-distances.mjs` trusts those.
- The two survey CSVs are the field checklist for issues #101 and #102. Never copy hours, phone numbers or coordinates from Google Maps into OpenStreetMap (licence).

### UI tests (every link clicked)

```
npm install                             # once: playwright-core and postcss from package.json (node_modules is not committed)
node tests/ui/links.test.mjs            # every page in Chrome, every link clicked; --external also requests outside links
```

`tests/ui/README.md` lists the checks. Pages are served from the git-tracked files with case-sensitive paths, as on GitHub Pages. `.github/workflows/ui-tests.yml` runs it on every push and pull request; a manual run (workflow_dispatch) with `external` also checks outside links. The weekly Monday run was removed (2026-10-20). Report: `tests/ui/results/links-report.md` (not committed). When long jobs get stopped, `node tests/ui/run-batches.mjs` runs both UI tests in short batches and combines them into one full report (see the README).

### Browsers and screen sizes

`node tests/ui/compat.test.mjs` opens one page of each kind (`--all`: every page) in Chrome, Edge, Firefox and WebKit (Safari's engine) at phone 390 px, tablet 820 px and desktop 1366 px. Broken: sideways scrolling, images not loading, JavaScript errors, phone menu not opening. To look at: tap targets under 24 x 24 px on phones, text under 11 px. Report with a grid and screenshots: `tests/ui/results/compat-report.html`. Firefox and WebKit are Playwright's builds: `npx playwright-core install firefox webkit` once.

### DTPC Wayanad check and the improvement loops

- `node scripts/check-dtpc.mjs` fetches every DTPC Wayanad page (www.dtpcwayanad.com, 1 request per second), reads its Entry Time / Ticket Fare / Contact blocks and compares them with `data/sitedata.js` through `data/dtpc-map.json` (DTPC page -> place ids). `data/dtpc-snapshot.json` keeps what DTPC said, so the next run reports what DTPC changed. `--offline` compares with the snapshot only. It changes nothing. The owner chose DTPC Wayanad as the reference for timings, fees and contacts (2026-10-19).
- Loops (slash commands in `.claude/commands/`): `/improve-links`, `/improve-data`, `/improve-enrich`, `/improve-ui`, and `/improve-cycle`, which runs the four one after another on a branch `improve/cycle-<n>`, gates on `check.mjs` + both UI tests, merges to main and pushes. They can be run back to back with `/loop /improve-cycle`, but the owner stopped the loops on 2026-10-20: run a cycle only when asked. Owner decisions (removals, renames, conflicts between non-DTPC sources, new places) are never taken by a loop; they are listed.
- Guard rails: `node scripts/loop-guard.mjs --start` (stops after 6 cycles a day, 2 failed gates or 2 cycles without progress in a row) and `--merge` (no protected files - rates, booking, availability, terms/FAQ, workflows; at most 10 place records and 20 hand-edited pages per cycle; every changed fact has evidence; creates the restore tag `restore-before-cycle-<n>`). Cycles merge to main automatically when the gate and the guard pass (owner's choice, 2026-10-19).
- `node scripts/loop-metrics.mjs --cycle <n> --loop <name>` appends a scoreboard row to `data/improvement-log.json` (links broken, browser problems, tap targets, small text, data errors / to review / missing, DTPC differences); `--show` prints the table and the trend.

### Build-time prerender

```
node scripts/prerender.mjs            # open every page in headless Chrome and write the script-built blocks into the HTML
node scripts/prerender.mjs --verify   # no browser: check the blocks are present (also run by check.mjs)
```

- Crawlers that do not run JavaScript (AI crawlers, social previews) now get the Discover rows, place details, other places, nearby places, food list and EV/fuel lists in the HTML. No new files; only the containers listed in `TARGETS` are changed, between `<!--prerender:begin-->` and `<!--prerender:end-->`.
- Each target is a container that its script clears and rebuilds, so visitors see the same page as before. Re-run it after changing `data/sitedata.js`, the distance, food, fuel or EV data, or the scripts that render these blocks (the monthly data workflow does).
- Needs `npm i --no-save playwright-core` and Chrome (`CHROME_PATH`, `PLAYWRIGHT_CORE` for a non-local install). Commit subjects starting "Prerender" are ignored by the sitemap `lastmod` logic.
- Cloudflare: the HTML served to every client already contains this content, so no bot-specific worker is involved. The pages are cached at the Cloudflare edge (cache rule, 4 h); purge the cache after a deploy to see changes at once. No third-party prerender service is used.

### Booking requests and the calendar

- The booking form is a request: it emails bwstays@gmail.com (formsubmit.co) and says so. Nothing is blocked until the host confirms and adds the dates to the Google Calendar that `BW_ICAL_URLS` points at.
- Optional: `apps-script/booking-requests.gs` (deployed by the owner as a Google Apps Script web app, see `apps-script/README.md`) also writes each request into a separate "BWStays Booking Requests" calendar. Set `BW_REQUEST_ENDPOINT` in `js/booking.js` to its URL and add `pending|<that calendar's secret iCal address>` to the `BW_ICAL_URLS` secret.
- `build-availability.mjs` writes `data/pendingdata.js` for `pending|` feeds; the booking calendar shows those dates as "Requested" (amber, still selectable). Booked or closed dates win over requested ones.
- `js/pdfgen.js` builds the one-page request summary PDF (reference number, guest, stay, price estimate, status box, next steps).

### Theme colour

One teal for every filled control (buttons, Know More, dropdowns, floating circles, selected calendar days, pills): `var(--bw-teal)` = `#3f7f7b` (white text 4.6:1), hover and pressed `var(--bw-teal-dark)` = `#2f6f6b`, focus rings `var(--bw-teal-soft)`. They are defined in `css/styles.css` and `css/details-page.css`. Use the variables, not new hex values. The lighter `#64a19d` stays only for teal text, icons and thin lines on dark backgrounds, where it reads better.

### FAQ

The Frequently Asked Questions live in the card `#section-faq` of `footer.html` (the Rules & Regulations page, next to the terms and cancellation policy), as collapsible questions with Expand all / Collapse all and FAQPage structured data. They are generated from `js/faq.js` (the single source, also read by the MCP generator): edit `js/faq.js`, then run `node scripts/build-faq.mjs` (`--check` is part of `check.mjs`). The booking page only links to `footer.html#faq`.

### SEO, PWA and security checks

```
node scripts/audit-site.mjs            # every page: title, description, canonical, hreflang, Open Graph, JSON-LD, CSP, referrer, noopener, manifest, security.txt (errors fail check.mjs)
node scripts/check-headers.mjs         # the LIVE response headers (HSTS, Referrer-Policy, Permissions-Policy, frame-ancestors, cache of /sw.js)
```

GitHub Pages cannot set response headers: they are set in Cloudflare, see `docs/cloudflare-security-headers.md` (header rule and cache rules). Every page carries a CSP meta (no `unsafe-eval`, `object-src 'none'`, `base-uri 'self'`) and a referrer-policy meta. The service worker serves manifest, translations, MCP/AI files and sitemaps network-first (`LIVE_FILES` in `scripts/pwa/sw.template.js`) so they never stay stale; it registers with `updateViaCache: 'none'`. The manifest has screenshots (`assets/img/pwa/screenshot-*.jpg`, made from the real pages).

### Structured data (generated)

`node scripts/build-schema.mjs` (`--check` is part of `check.mjs`) writes the VacationRental block of the villa on `bwstays-booking.html` from the page itself (rate, up to N adults, beds, bath, amenity chips, gallery photos; address and coordinates from the home page LocalBusiness) and a BreadcrumbList on every place page (Home > Places to visit in Wayanad > place) and the booking page. Re-run it after changing the villa card, the amenity list or the gallery. No phone number or rating is published in the markup until a real one exists (the home and booking LocalBusiness `telephone` placeholder was removed).

### Rates

`data/rates.js` is the single source of the rates: nightly rate (INR 2,100, GST included), the 4 adults and 1 child included, the extra child charge (INR 400 per extra child per night) and the booking limits (4 adults, 4 children; the booking form counters enforce them, `data-min` / `data-max` on the counter inputs). The request PDF (`js/pdfgen.js`) reads it (no GST line is added; the estimate is the nightly rate plus extra child charges). The booking page card and its `rate-note`, `js/faq.js`, and the generated MCP, llms and structured data must agree with it: `build-faq.mjs`, `build-schema.mjs` and `generate-mcp.mjs` stop with an error when they do not (`check.mjs` runs them). To change a price or a limit: edit `data/rates.js`, the card and counters in `bwstays-booking.html` and the numbers in `js/faq.js`, then run the build. The hand-written top of `llms.txt` also states the rate, capacity and cancellation rules: update it too.

### Brand name, titles and "Good to know"

- The main brand name is **Black & White Workations** (owner's choice, 2026-10-21). Every page title is `<subject> | Black & White Workations` (the home page: `Black & White Workations | Villa Stay in Kalpetta, Wayanad`); `og:title` and `twitter:title` match the title. Place pages use `<place>, Wayanad | Black & White Workations`. Keep titles under 70 characters (`audit-site.mjs` warns). "Black and White Stays" / "BWStays" are the other names; `llms.txt` lists them as aliases. The structured-data business name was not changed (it should match the Google Business Profile).
- The booking page has a "Good to Know Before You Book" block (`#good-to-know`, after Premium Amenities): the stay, how booking works, cancellation summary, nearest airport (Calicut International, about 80 km) and railway station (Kozhikode, about 72 km), bus and taxi. Distances are OpenStreetMap (OSRM) road distances from Kalpetta town (2026-10-21). If the cancellation policy changes, update this block. Check-in from 2 PM and check-out by 11 AM (owner, 2026-10-21) are `checkIn` / `checkOut` in `data/rates.js`; the block, `js/faq.js`, `js/chat.js` and `llms.txt` say the same, `build-schema.mjs` stops if the booking page does not, and writes `checkinTime` / `checkoutTime` into the VacationRental. A phone number and ratings are not published yet; add them here and in `llms.txt` when the owner gives them.

### Maps and page scrolling

`js/map-guard.js` is loaded right after `vendor/leaflet/leaflet-src.min.js` on every page that has a map. It is a Leaflet init hook, so it covers every map (all-locations, food, EV/fuel, footer) without touching their scripts: the mouse-wheel zoom is OFF until the visitor clicks or drags the map and goes OFF again when the pointer leaves, focus is lost or Escape is pressed; a wheel turn over an inactive map shows a short hint (`.bw-map-hint`). Dragging, +/- buttons, double click, pinch and keyboard zoom are unchanged. Add the script tag after leaflet on any new page with a map.

### Bootstrap CSS (trimmed)

Pages load `css/bootstrap-lite.css` (about 28 KB), not the full `vendor/bootstrap/bootstrap.min.css` (160 KB, about 10% used). It is generated: `node scripts/build-bootstrap-lite.mjs` keeps every Bootstrap rule whose classes all appear in the site's own files (HTML, `js/*.js`, `data/*.js|json`), plus the classes Bootstrap's JavaScript adds (`SAFELIST` in the script). `check.mjs` fails when a page starts using a Bootstrap class that is not in the file: re-run the script (needs `npm i --no-save postcss`), then `minify-assets` and `version-assets`. A class built only by string concatenation must be written in full somewhere in the source or added to `SAFELIST`. The full vendor file stays in the repository as the source.

### Menu and scroll-spy (no Bootstrap JavaScript)

`js/nav.js` replaces the 84 KB Bootstrap JavaScript bundle: the menu button (`data-toggle="collapse"`, same classes and transition as Bootstrap 4) and the scroll-spy that sets `.active` on the menu link of the section being read (hash links of `#mainNav`). `js/scripts.js` calls `bwNav.hideMenu()` and `bwNav.refreshSpy()`. jQuery is still loaded for the other scripts. If a page needs another Bootstrap plugin (modal, dropdown, tooltip), add it here or load the bundle on that page.

### Place ids and the distance matrix

Every place in `data/sitedata.js` has a numeric `id` that must be unique across ALL categories (`check.mjs` fails on a duplicate). Take the next free id (highest id + 1), not a number you assume. The same id must be listed in `locations.names` of `data/nearbylocationsdata.js`; then run `node scripts/build-distances.mjs` (OpenStreetMap routing) to fill its row and column. The matrix exists in three places: `data/nearbylocationsdata.js` (source, with its `.min` copy used by the pages) and the generated `resources/distances.json` and `tools/search/nearby.json` (`generate-mcp.mjs`); there is no spreadsheet copy. A place without a trusted coordinate keeps 0 (unknown) in its row; `locations.meta.places_without_trusted_coordinates` lists them with the reason, and `data/survey-coordinates.csv` is the field checklist. Existing cells are never rewritten by hand. `build-distances.mjs` has three documented lists for special cases: `SAME_PLACE` (records that may share one coordinate, e.g. the Gandhi Museum beside the Jain temple), `ALIAS_OF` (a record that is another record's place under a second name copies that record's distances) and `DISCARD_LEGACY` (old distances proven wrong, set to unknown; each with the reason).

### Adding a new place (checklist: every step, so all the data stays in sync)

New places are owner requests; the place must be identifiable (an OpenStreetMap feature of that name and an official or first-party source). Generic names ("Coffee Plantation") were removed for that reason (`data/verification.json` `removed`).

1. Research: OpenStreetMap (Overpass / Nominatim) for the coordinate, DTPC Wayanad first for timing, fee and phone (`data/dtpc-map.json` `not_on_site` lists DTPC pages still without a place), then Kerala Tourism or the operator's own site. Road km from Kalpetta with OSRM. Never Google Maps. A fact no official source publishes stays empty ("not published"), including the visit length (`hrs`; the trails planner then assumes 2 h).
2. Photo: only freely licensed (Wikimedia Commons CC BY / CC BY-SA / public domain), never a DTPC or Kerala Tourism photo ("All rights reserved"). Convert to WebP (about 900 px, under 100 KB) in `assets/img/<category>/`, and credit photographer, licence and Commons link in the page's Sources line. If no photo shows that exact place, use one of the area and say so in the evidence notes.
3. `data/sitedata.js`: a record in its category with the next free id (highest id + 1, unique across all categories), `knowmore` = the new page.
4. `data/nearbylocationsdata.js`: add the id and name to `locations.names` only; `node scripts/build-distances.mjs` fills the row and column (check that no existing cell changed).
5. `data/verification.json`: an entry for the id (coordinate with `osm_ref` and evidence, timing/fee/phone with `source_url` and confidence, notes, `description_sources`); for a DTPC place also move it from `not_on_site` to `pages` in `data/dtpc-map.json`.
6. The page `bw-<name>-<category>-wayanad.html`: copy a page of the same category, then change title, description, canonical/hreflang/og/twitter URLs and text, the TouristAttraction JSON-LD (name, description, url, geo, image), the hero h1 (the place name), the hand-written details block (distance, info list, text, Sources with the photo credit), every `data-center` (food, EV, fuel), `getCurrentPageId` and `getCurrentCatagoryId`, and empty the `prerender` blocks. `git add` the page and photo before the sitemap step (the sitemap lists tracked pages).
7. `llms.txt` (hand-written part) when the place is worth listing.
8. Build: `build-map-data` (all-locations map and trails planner), `generate-mcp`, `build-llmfeed`, `build-llms`, `build-schema` (breadcrumb), `build-road-near` (food/EV/fuel road km), `minify-assets`, `version-assets`, `build-sitemap`, `prerender` (nearby cards, same-type lists and the home Discover row on every page), `build-llms-full`, `build-search-index`, `build-survey`, `build-pwa`, then `check.mjs`, `audit-site.mjs`, `verify-data.mjs`. After the push the IndexNow workflow submits the new page.

### Data quality loop (keeping the place data correct and sourced)

The facts about Wayanad places (coordinates, distance from Kalpetta, timing, fee, holiday, identity) are kept honest by a loop that finds problems automatically and fixes them only with evidence and review. Nothing changes `main` by itself.

```
node scripts/verify-data.mjs                 # offline audit (seconds); also run by check.mjs with --strict (integrity errors fail)
node scripts/verify-data.mjs --online        # + OSRM routes, OpenStreetMap objects, dead source links
node scripts/verify-data.mjs --online --out data-quality-report.md
```

- `data/verification.json` is the provenance registry: per place id the date checked, the OpenStreetMap object, official timing/fee with `source_url` and `confidence` (high/medium = official source, low = third party and never applied to the site). `generate-mcp.mjs` publishes the medium/high facts as `verification` on every attraction in `resources/attractions.json`, so AI assistants can see where a fact comes from and when it was checked.
- `.github/workflows/verify-data.yml` ran the online audit every Monday (disabled 2026-10-20; run it by hand from the Actions tab) and creates or updates ONE issue "Data quality report" (sections ERRORS, TO REVIEW, PENDING, MISSING, STALE). It commits nothing.
- `/verify-data [focus]` (`.claude/commands/verify-data.md`) is one careful pass: read the report, research the items that can be settled, fix `data/sitedata.js` and the page text, record evidence in `data/verification.json`, rebuild, and open a pull request on a branch `data/verify-YYYY-MM-DD`. It can be repeated with `/loop 1d /verify-data` while a Claude Code session is open, but the owner stopped the loops on 2026-10-20: run it only when asked. Running it unattended in GitHub Actions needs an Anthropic API key (a paid service) and is not enabled.
- Rules: sources are OpenStreetMap (coordinates) and official pages (DTPC Wayanad, Kerala Tourism, Forest Department, the place's own site); never copy coordinates, hours or phone numbers from Google Maps; no guesses; a conflict between sources is left for the owner; ids are never changed and a new place takes the next free id; existing matrix cells are never edited by hand (`build-distances.mjs` recomputes them); renames, removals and review exclusions are owner decisions.
- Discoverability by AI assistants is not something a site can force. What helps, and is maintained here: accurate sourced facts, `llms.txt` / `llms-full.txt`, the MCP and LLMFeed files, structured data, sitemaps, and the `verification` provenance. Keep them regenerated and committed.

