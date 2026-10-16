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
| `Content-Security-Policy` | `frame-ancestors 'self'` |

Notes
- `Content-Security-Policy: frame-ancestors 'self'` only adds clickjacking protection. It does not replace the CSP in the page: the browser applies both.
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

## 3. Other settings worth checking

- Security > Bots: AI crawlers (GPTBot, ClaudeBot, CCBot, Amazonbot, Bytespider) get 403 today. Decide whether the site wants to be readable by them; `llms.txt` and the MCP files assume yes.
- Security > WAF > Managed rules: on. Security > Settings > Security Level: Medium.
- Speed > Optimization: Early Hints on, Brotli on. Auto Minify is not needed (the build already minifies).
- Email Address Obfuscation: leave on (the site also hides its address in the page).

## What the pages do themselves

- Content-Security-Policy meta: `default-src 'self'`; scripts, styles, images, frames and connections only from the listed hosts; `upgrade-insecure-requests`;
  `block-all-mixed-content`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self' https://formsubmit.co`.
- Referrer policy meta on every page; `rel="noopener"` on links that open a new tab; no plain `http://` resources.
- `/.well-known/security.txt` tells researchers where to report a problem.
