---
description: Data loop - compare timings, fees, contacts, coordinates with Wayanad sources (DTPC first) and fix with evidence
argument-hint: [optional focus, e.g. "fees", "ids 40-50"]
---

Data loop of the BWStays improvement cycle. Goal: every fact on the site about a Wayanad place agrees
with the official source, with the evidence recorded. Focus: $ARGUMENTS (empty = top issues).

Sources, in this order of authority (the owner chose DTPC Wayanad as the reference for timings and fees,
2026-10-19):
1. DTPC Wayanad - www.dtpcwayanad.com (places run by the District Tourism Promotion Council)
2. Kerala Forest Department / Kerala Forest ecotourism (forest treks, sanctuaries, safaris)
3. Kerala Tourism - keralatourism.org (descriptions; timings when DTPC is silent)
4. wayanad.gov.in (district administration), the place's own official site
5. OpenStreetMap (coordinates only; Nominatim/Overpass, 1 request per second)
Never Google Maps or Google Search panels (hours, phones, coordinates), never travel blogs for a value
that is shown as fact (a blog may only point you to an official source), no values from memory.

Steps:
1. `node scripts/check-dtpc.mjs --out dtpc-report.md` (fetches DTPC, compares with the site, keeps
   `data/dtpc-snapshot.json`; reports what DTPC CHANGED since the last run and DTPC pages that are not
   mapped). `node scripts/verify-data.mjs --online --out data-quality-report.md`. Do not commit the two reports.
2. Settle what the evidence settles (at most 10 items per pass):
   - site differs from DTPC -> the site takes DTPC's value (timing, fee, contact), in `data/sitedata.js`
     AND the page's own `Timing:` / `Fee :` / `Holiday:` / `Contact:` line;
   - DTPC changed since the last run -> update the site the same way, mention it in the commit;
   - a new DTPC page that matches a site place -> add it to `data/dtpc-map.json` (mapping sure/uncertain);
     a DTPC place the site does not have -> list it for the owner (adding a place is an owner decision);
   - a fact in data-quality-report PENDING/TO REVIEW that an official source settles.
   Record each change in `data/verification.json` (value, `source_url`, `confidence`, `checked` date,
   the source's words). Keep earlier fields that are still true.
3. If two official sources disagree and DTPC is one of them, the site follows DTPC and the other value is
   recorded as an alternative. If neither is DTPC, leave the site value and list it for the owner.
4. Never: delete/rename/merge places, change ids, edit distance-matrix cells by hand (change the
   coordinate, then `node scripts/build-distances.mjs`), invent phone numbers, ratings or prices.
5. Rebuild what the data feeds (`node scripts/minify-assets.mjs`, `node scripts/version-assets.mjs`,
   `node scripts/generate-mcp.mjs`, `node scripts/prerender.mjs --page <pages that show the changed places>`),
   then `node scripts/verify-data.mjs --strict` and `node scripts/check-dtpc.mjs --offline` (Differs: 0 for
   the items you settled). Commit ("Data: ...") with the source of every change in the message.
