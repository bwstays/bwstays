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

## 4. AI crawlers: allowed once a week

GPTBot, ClaudeBot, CCBot, Amazonbot and Bytespider were getting `403` from Cloudflare's "Block AI bots" setting, so `llms.txt` and the MCP files
could not be read. `robots.txt` now allows the main AI crawlers. A crawler cannot be told "come once a week" in robots.txt (`Crawl-delay` is a delay
between requests, and most AI crawlers ignore it), so the weekly rhythm is enforced in Cloudflare with a time window.

1. **Security > Bots**: set **Block AI bots** to **Do not block (allow crawlers)**. If your dashboard shows **AI Crawl Control**, set the crawlers to **Allow**.
2. **Security > WAF > Custom rules > Create rule**, name `AI crawlers: weekly window`, **Edit expression** and paste:

```
(http.user_agent contains "GPTBot" or http.user_agent contains "OAI-SearchBot" or http.user_agent contains "ClaudeBot" or http.user_agent contains "Claude-SearchBot" or http.user_agent contains "anthropic-ai" or http.user_agent contains "PerplexityBot" or http.user_agent contains "CCBot" or http.user_agent contains "Amazonbot" or http.user_agent contains "Bytespider") and not (http.request.timestamp.sec % 604800 < 86400)
```

   Action: **Block**. Deploy.

   What it does: these crawlers get through for 24 hours each week (every **Thursday, 00:00 to 24:00 UTC**, which is Thursday 05:30 to Friday 05:30 IST)
   and get `403` the rest of the week. Search engines (Googlebot, Bingbot) and visitors are not affected. To move the day, change `< 86400` to
   `>= 86400 and < 172800` (Friday), `>= 172800 and < 259200` (Saturday), and so on (the epoch started on a Thursday).
3. If Cloudflare rejects the `%` operator on your plan, tell me; the fallback is a rate-limiting rule for the same user agents.
4. Test: `curl -s -o /dev/null -w "%{http_code}" -A "GPTBot" https://www.bwstays.com/llms.txt` gives `200` inside the window and `403` outside it
   (`node scripts/check-headers.mjs` prints this probe).
5. Bytespider (TikTok) is often aggressive and ignores robots.txt; it is only in the block list above on purpose, so it is also blocked outside its window.

