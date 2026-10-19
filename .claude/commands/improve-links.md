---
description: Links loop - click every link on every page (script, mouse, phone), fix what is broken
argument-hint: [optional pages, e.g. "index.html,footer.html"]
---

Links loop of the BWStays improvement cycle. Goal: every link on every page works for a visitor, on
desktop and phone. Pages: $ARGUMENTS (empty = all).

1. Run `node tests/ui/links.test.mjs` (add `--page <list>` if pages were given; add `--external` once a
   day, it also requests outside links). Read `tests/ui/results/links-report.md` (or the .json).
2. Learn from the report before fixing: group the broken items by cause (wrong case in a URL, page removed,
   #section renamed, script that builds the link, element covering a button, menu not opening...). One
   cause usually explains many items: fix the cause, not each symptom (the data in `data/*.js`, the script
   in `js/`, or the template part of the pages), and search all pages for the same mistake
   (`grep` the bad pattern) so it does not come back elsewhere.
3. Rules: never delete a page or a place (owner decision) - point a dead link to the right existing page,
   or to `all-locations-wayanad.html` for a place without its own page; GitHub Pages paths are
   case-sensitive; outside links that "could not be verified" (403/429/timeouts) are not broken - only
   replace an outside link when it is really gone (404/410/DNS) and an official replacement exists.
   Placeholder phone/WhatsApp numbers are owner items: list them, do not invent numbers.
4. If a page's data or a rendering script changed: `node scripts/minify-assets.mjs`, `node scripts/version-assets.mjs`
   and `node scripts/prerender.mjs --page <changed pages>`.
5. Re-run the test for the pages you touched until they PASS. Commit ("Links: ...").
6. Note for the scoreboard: broken before -> after, and causes found.
