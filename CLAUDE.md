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

- `.github/workflows/refresh-rates.yml` (1st of the month): exchange rates, committed to main.
- `.github/workflows/refresh-availability.yml` (every 30 minutes): reads the calendar iCal feeds in the repository secret `BW_ICAL_URLS` (Google Calendar, Airbnb, Booking.com; optional `booked|` / `closed|` prefix per line) with `scripts/build-availability.mjs`, rewrites `data/bookingdata.js` and `data/closeddata.js` (today to +1 year, no guest details) and commits to main only when they changed. A feed failure leaves the last good files in place. Test locally with `node scripts/build-availability.mjs --dry-run --file sample.ics`.
- `.github/workflows/refresh-data.yml` (2nd of the month): food places and driving distances, then the booking report, MCP files, map data and search index. It opens a pull request (branch `data-refresh-YYYY-MM`) only when the OpenStreetMap data really changed; nothing reaches main without review. Run it by hand from the Actions tab (workflow_dispatch).

### Icons (Font Awesome)

Font Awesome Free 5.15.1 is self-hosted as a web font: `css/fontawesome.min.css` plus `assets/fonts/fontawesome/*.woff2` (solid, brands, regular), loaded by a `<link>` in each page's head. The old `all.min.js` (SVG-with-JS) is no longer used, so icons are plain `<i class="fas fa-...">` elements and CSS rules that target `i` apply. The css and fonts are a subset holding only the icons the site uses (about 7 KB css + 9 KB fonts instead of 58 KB + 170 KB). After adding an icon (`fa-...`) anywhere, run `python scripts/build-fontawesome.py` (needs `pip install fonttools brotli`) and then `node scripts/version-assets.mjs`. The unmodified Font Awesome 5.15.1 sources are kept in `scripts/fontawesome-src/`.

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

- `check.mjs` verifies that the sitemap lists every indexable page and that the LLMFeed is current. The sitemap `lastmod` ignores site-wide edits (asset versions, plumbing, the same change committed page by page); the monthly workflow checks out full history so dates stay correct.
- `llms.txt` and `llms-full.txt` are hand-written except for the block between `BEGIN/END GENERATED: site-data`, which `build-llms.mjs` rewrites from the MCP data (booking rules, shopping places, EV and fuel stations). The site chat reads `llms-full.txt`.
- `data/mcp-review.json` `coordinate_confirmations` lists hills/peaks whose coordinate is far from a road but matches an OpenStreetMap feature; `build-distances.mjs` trusts those.
- The two survey CSVs are the field checklist for issues #101 and #102. Never copy hours, phone numbers or coordinates from Google Maps into OpenStreetMap (licence).

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

`data/rates.js` is the single source of the rates: nightly rate (INR 2,100, GST included), the 4 adults and 1 child included, the extra child charge (INR 800 per extra child per night) and the booking limits (4 adults, 4 children; the booking form counters enforce them, `data-min` / `data-max` on the counter inputs). The request PDF (`js/pdfgen.js`) reads it (no GST line is added; the estimate is the nightly rate plus extra child charges). The booking page card and its `rate-note`, `js/faq.js`, and the generated MCP, llms and structured data must agree with it: `build-faq.mjs`, `build-schema.mjs` and `generate-mcp.mjs` stop with an error when they do not (`check.mjs` runs them). To change a price or a limit: edit `data/rates.js`, the card and counters in `bwstays-booking.html` and the numbers in `js/faq.js`, then run the build.

### Maps and page scrolling

`js/map-guard.js` is loaded right after `vendor/leaflet/leaflet-src.min.js` on every page that has a map. It is a Leaflet init hook, so it covers every map (all-locations, food, EV/fuel, footer) without touching their scripts: the mouse-wheel zoom is OFF until the visitor clicks or drags the map and goes OFF again when the pointer leaves, focus is lost or Escape is pressed; a wheel turn over an inactive map shows a short hint (`.bw-map-hint`). Dragging, +/- buttons, double click, pinch and keyboard zoom are unchanged. Add the script tag after leaflet on any new page with a map.
