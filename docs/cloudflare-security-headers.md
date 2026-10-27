# Security headers and cache rules (Cloudflare)

The site is static files on GitHub Pages behind Cloudflare. GitHub Pages cannot add custom response headers, so
the headers below must be set in Cloudflare. Check the result at any time with:

```
node scripts/check-headers.mjs            # report
node scripts/check-headers.mjs --strict   # exit 1 when something is missing
```

Already sent today (GitHub Pages / Cloudflare): `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, HTTPS only.
Already in every page (meta tag): a Content-Security-Policy (no `unsafe-eval`, `object-src 'none'`, `base-uri 'self'`,
`form-action` limited) and `referrer: strict-origin-when-cross-origin`.

## 1. Response header rule (Rules > Transform Rules > Modify Response Header > Create rule)

Name: `Security headers`. When incoming requests match: **All incoming requests** (or `Hostname equals www.bwstays.com`).
Then **Set static** each header:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), payment=(), usb=(), geolocation=(self)` |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` |
| `Content-Security-Policy` | `upgrade-insecure-requests; default-src 'self'; script-src cdnjs.cloudflare.com overpass-api.de unpkg.com analytics.ahrefs.com cdn.inspectlet.com static.cloudflareinsights.com 'self' 'unsafe-inline' www.googletagmanager.com *.google-analytics.com wati-integration-prod-service.clare.ai bwstays.com requirejs.org maps.googleapis.com www.google-analytics.com use.fontawesome.com code.jquery.com tally.so cdn.cookie-script.com; style-src cdnjs.cloudflare.com unpkg.com 'self' 'unsafe-inline' blogs.bwstays.com bwstays.com fonts.googleapis.com; img-src 'self' data: https:; media-src 'self'; frame-src bwstays.com youtube.com tally.so; connect-src api.frankfurter.dev cdnjs.cloudflare.com api.groq.com router.project-osrm.org overpass-api.de analytics.ahrefs.com ws.inspectlet.com hn.inspectlet.com 'self' www.googletagmanager.com *.google-analytics.com analytics.google.com *.analytics.google.com stats.g.doubleclick.net www.google.com bwstays.com maps.googleapis.com api.open-meteo.com mapsresources-pa.googleapis.com formsubmit.co script.google.com script.googleusercontent.com; font-src 'self' fonts.gstatic.com use.fontawesome.com; base-uri 'self'; object-src 'none'; form-action 'self' https://formsubmit.co; frame-ancestors 'self'` |

Notes
- `Content-Security-Policy` must be sent as a **header**: Mozilla Observatory (and similar scanners) ignore the CSP meta tag in the page, so with only `frame-ancestors 'self'` in the header they report no policy (grade C, 50/100). The value above is the union of the CSP meta tags of every page (plus `frame-ancestors`), so it never blocks anything a page already allows; the browser applies the header and the page meta together. If a page gets a new third-party host, add it to that page's meta and to this header. It still allows `'unsafe-inline'` scripts (the pages use inline scripts), which a scanner marks down; removing it needs a hash for every inline script.
- HSTS: add `; preload` and submit the domain at hstspreload.org only when every subdomain is HTTPS-only. Cloudflare also has
  SSL/TLS > Edge Certificates > HTTP Strict Transport Security (HSTS), which does the same job.
- Also turn on: SSL/TLS mode **Full (strict)**, **Always Use HTTPS**, **Automatic HTTPS Rewrites**, **Minimum TLS 1.2**.

## 2. Cache rules (Caching > Cache Rules)

The service worker and the manifest must not stay stale, and visitors must see page updates within minutes.

1. `/sw.js` : **Bypass cache** (or Edge TTL: respect origin; Browser TTL: no-cache). Today it is cached 4 hours (`cf-cache-status: HIT`),
   so a new site version can take hours to reach installed apps.
2. `/manifest.json` : Edge TTL 1 hour, Browser TTL 1 hour.
3. HTML (the existing 4 hour rule): keep **Edge TTL 4 hours**, but set **Browser TTL to 5 minutes** (or "Respect origin"). Purge the cache after a deploy
   (Caching > Configuration > Purge Everything) to see changes at once.
4. `/data/bookingdata*.js`, `/data/closeddata*.js`, `/data/pendingdata*.js` : Edge TTL 5 minutes (booking availability).
5. **Versioned CSS, JS and fonts, long cache.** Every stylesheet and script is linked with `?v=<hash>` (`version-assets.mjs` changes the hash when a file changes), so a changed file is a new URL and a long cache is safe.
   Expression: `(http.request.uri.query contains "v=" and (ends_with(http.request.uri.path, ".css") or ends_with(http.request.uri.path, ".js"))) or ends_with(http.request.uri.path, ".woff2")`.
   Setting: Cache eligibility **Eligible for cache**, Edge TTL **1 year**, Browser TTL **1 year**. Put this rule above rule 4 and keep rule 4 (the booking availability files, which also carry `?v=`) later in the list so its 5 minute TTL wins.
6. **Images, medium cache.** Image file names are not hashed, so do not give them a year: Edge TTL **30 days**, Browser TTL **7 days**. Expression: `ends_with(http.request.uri.path, ".webp") or ends_with(http.request.uri.path, ".avif") or ends_with(http.request.uri.path, ".png") or ends_with(http.request.uri.path, ".jpg") or ends_with(http.request.uri.path, ".svg") or ends_with(http.request.uri.path, ".ico")`.
   When a photo is replaced under the same name, either purge that URL in Cloudflare or add `?v=2` to its `src` (the service worker also keeps images by URL, so a new query string is what makes returning visitors fetch the new file).
7. Check afterwards with `curl -I https://www.bwstays.com/css/styles.min.css?v=x`: `cache-control: max-age=31536000` and `cf-cache-status: HIT` on the second request.

## 3. Other settings worth checking

- AI crawlers: see the next section.
- Security > WAF > Managed rules: on. Security > Settings > Security Level: Medium.
- Speed > Optimization: Early Hints on, Brotli on. Auto Minify is not needed (the build already minifies).
- Email Address Obfuscation: leave on (the site also hides its address in the page).

## What the pages do themselves

- Content-Security-Policy meta: `default-src 'self'`; scripts, styles, images, frames and connections only from the listed hosts; `upgrade-insecure-requests`;
  `block-all-mixed-content`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self' https://formsubmit.co`.
- Referrer policy meta on every page; `rel="noopener"` on links that open a new tab; no plain `http://` resources.
- `/.well-known/security.txt` tells researchers where to report a problem.

## 4. AI crawlers: search crawlers every day, training crawlers once a week

There are two kinds of AI crawler:

- **Search crawlers** fetch pages so an AI assistant can find and cite them in a live answer: `OAI-SearchBot` (ChatGPT search),
  `Claude-SearchBot`, `PerplexityBot`, and the on-demand fetchers `ChatGPT-User`, `Claude-User`, `Perplexity-User`. Blocking them
  keeps the site out of AI answers, so they are **allowed every day** (changed 2026-10-27, after an AI-visibility audit showed the
  site was almost never mentioned).
- **Training crawlers** collect text for future models: `GPTBot`, `ClaudeBot`, `anthropic-ai`, `CCBot`, `Amazonbot`, `Bytespider`.
  They are heavier and do not help today's answers, so they stay on a **weekly window**.

`robots.txt` allows all of them. A crawler cannot be told "come once a week" in robots.txt (`Crawl-delay` is a delay between
requests, and most AI crawlers ignore it), so the weekly rhythm is enforced in Cloudflare with a time window.

1. **Security > Bots**: set **Block AI bots** to **Do not block (allow crawlers)**. If your dashboard shows **AI Crawl Control**, set the crawlers to **Allow**.
2. **Security > WAF > Custom rules**: open the rule `AI crawlers: weekly window` (or **Create rule** with that name), **Edit expression** and paste:

```
(http.user_agent contains "GPTBot" or http.user_agent contains "ClaudeBot" or http.user_agent contains "anthropic-ai" or http.user_agent contains "CCBot" or http.user_agent contains "Amazonbot" or http.user_agent contains "Bytespider") and not (http.request.timestamp.sec % 604800 < 86400)
```

   Action: **Block**. Save / Deploy. `OAI-SearchBot`, `Claude-SearchBot` and `PerplexityBot` are no longer in this list.

   What it does: the training crawlers get through for 24 hours each week (every **Thursday, 00:00 to 24:00 UTC**, which is Thursday 05:30 to Friday 05:30 IST)
   and get `403` the rest of the week. Search engines (Googlebot, Bingbot), the AI search crawlers and visitors are not affected. To move the day, change `< 86400` to
   `>= 86400 and < 172800` (Friday), `>= 172800 and < 259200` (Saturday), and so on (the epoch started on a Thursday).
3. If Cloudflare rejects the `%` operator on your plan, tell me; the fallback is a rate-limiting rule for the same user agents.
4. Test: `node scripts/check-headers.mjs` requests `/llms.txt` as each crawler. The search crawlers must get `200` at any time; `GPTBot` and `ClaudeBot`
   get `200` inside the window and `403` outside it. A test from your own computer only sends the crawler's name; Cloudflare recognises the real
   crawlers by their network, so **Security > Events** (filter by user agent) or **AI Crawl Control** shows what the real ones got.
5. Bytespider (TikTok) is often aggressive and ignores robots.txt; it is only in the block list above on purpose, so it is also blocked outside its window.

## 5. IndexNow (Bing, Yandex and others re-crawl changed pages at once)

The key file `db702d3939d94b42a7d3e5314ae2ca3e.txt` at the site root holds the key. `.github/workflows/indexnow.yml` runs after every push
to main that changes a page: it waits 4 minutes for the GitHub Pages deploy, then `scripts/indexnow.mjs` sends the changed pages
(only those in `sitemap.txt`). Nothing to set up in Cloudflare. Notes:

- HTML is cached at the Cloudflare edge for 4 hours: purge the cache after a deploy so the crawler fetches the new page.
- To submit the whole site (first time, or after a big change): Actions tab > IndexNow > Run workflow with **all** ticked,
  or `node scripts/indexnow.mjs --all` locally.
- Google does not use IndexNow; it reads `sitemap.xml` (submit it once in Google Search Console). Also add the site and the
  sitemap in **Bing Webmaster Tools**, which shows the IndexNow submissions it received.


## 6. Automatic cache purge after each deploy

HTML is cached at the Cloudflare edge for 4 hours (section 2), so without a purge a change can take hours to show.
`.github/workflows/purge-cache.yml` runs after every successful GitHub Pages deploy and removes from the cache only the
files that changed since the previous deploy (`scripts/purge-cloudflare.mjs`; a page is purged at its address, `index.html`
also as `/`; more than 300 files purge everything). Versioned CSS/JS (`?v=`) are new URLs anyway and keep their long cache.

One-time setup:

1. Cloudflare dashboard > **My Profile > API Tokens > Create Token > Create Custom Token**.
   Name `bwstays cache purge`; Permissions: **Zone > Cache Purge > Purge**; Zone Resources: **Include > Specific zone > bwstays.com**.
   Create it and copy the token (it is shown once).
2. Cloudflare > **bwstays.com > Overview**: copy the **Zone ID** (right-hand column, API section).
3. GitHub > the repository > **Settings > Secrets and variables > Actions > New repository secret**:
   `CLOUDFLARE_API_TOKEN` = the token, `CLOUDFLARE_ZONE_ID` = the zone ID.
4. Test: Actions tab > **Purge Cloudflare cache** > Run workflow (tick **all** for everything). The log lists the purged URLs.

Without the secrets the workflow prints a notice and does nothing, so it never fails a deploy.
Locally: `node scripts/purge-cloudflare.mjs --since HEAD~1 --dry-run` lists what would be purged.
