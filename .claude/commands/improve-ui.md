---
description: UI loop - Chrome, Edge, Firefox and Safari (WebKit) on phone, tablet and desktop; fix layout, tap targets and small text
argument-hint: [optional: --all for every page, or pages]
---

UI loop of the BWStays improvement cycle. Goal: every page is simple and comfortable to use in the
popular browsers on phone and desktop. Scope: $ARGUMENTS (empty = one page of each kind).

1. Run `node tests/ui/compat.test.mjs` (add `--all` or `--page <list>` from the scope). Firefox and WebKit
   need `npx playwright-core install firefox webkit` once. Open `tests/ui/results/compat-report.html`
   (grid, problems, screenshots).
2. Broken first (sideways scrolling, images not loading, JavaScript errors, phone menu not opening), then
   "to look at": tap targets under 24 x 24 px on phones (WCAG 2.2), text under 11 px. Find the shared
   cause (one CSS rule or one script usually explains a whole column of the grid) and fix it in the
   source: `css/*.css` (not `.min`), `js/*.js`, or the page template part. Look at the screenshots of the
   pages you change in every browser before and after.
3. Rules: keep the look of the site (theme colour variables `--bw-teal...`, fonts, layout) - make things
   bigger, wrap or stack, do not redesign; no new outside libraries; keep the CSP; after a CSS/JS change run
   `node scripts/minify-assets.mjs`, `node scripts/version-assets.mjs`, and
   `node scripts/build-bootstrap-lite.mjs` if a new Bootstrap class is used; `node scripts/build-pwa.mjs`.
   A change in a script that builds page content needs `node scripts/prerender.mjs`.
4. Re-run the compat test (same scope) and `node tests/ui/links.test.mjs --page <changed pages>`; nothing
   may break that worked before. Commit ("UI: ...") with the numbers before -> after.
