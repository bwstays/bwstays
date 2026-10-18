---
description: One evidence-based pass over the Wayanad place data (audit, research, fix on a branch, open a pull request)
argument-hint: [focus, e.g. "coordinates", "timings", "ids 30-40" or empty for the top issues]
---

You are running one pass of the BWStays data-quality loop. The goal is data that is correct and
sourced, so visitors and AI assistants can rely on bwstays.com. A wrong value is worse than a
missing one. Focus requested by the user: $ARGUMENTS

## Rules (never break these)
- Work on a branch `data/verify-YYYY-MM-DD` made from an up-to-date `main`. NEVER commit or push to `main`; open a pull request and stop. If the working tree is not clean, stop and say so.
- Change a value only with evidence you can cite: coordinates from OpenStreetMap (Nominatim https://nominatim.openstreetmap.org, Overpass; 1 request per second; User-Agent `bwstays-data-verification/1.0`), timings, fees and identity from official sources (dtpcwayanad.com, keralatourism.org, wayanad.gov.in, Kerala Forest Department, the place's own site). NEVER copy coordinates, hours or phone numbers from Google Maps or Google Search panels (licence). No guesses, no values "from memory".
- If sources disagree, do not pick one: leave the site value, record both in `data/verification.json` and list it in the pull request as a question for the owner.
- Never delete, rename or merge a place, never change an id, never remove a review exclusion in `data/mcp-review.json` on your own: those are owner decisions, list them in the pull request. A new place takes the next free id (highest id in `data/sitedata.js` + 1) and must also be added to `locations.names` in `data/nearbylocationsdata.js`.
- Existing matrix cells are never edited by hand: change a coordinate in `data/sitedata.js`, then run `node scripts/build-distances.mjs`, and check afterwards that only rows and columns of the places you touched changed.
- Do not invent phone numbers, ratings, hours, fees or durations. Leave them empty or "not published".

## Steps
1. `git switch main && git pull`, then `git switch -c data/verify-$(date +%F)`.
2. Run `node scripts/verify-data.mjs --online --out data-quality-report.md` (do not commit that file). Read it: ERRORS first, then PENDING, TO REVIEW, MISSING, STALE. If an open GitHub issue titled "Data quality report" exists you may read it instead of re-running.
3. Pick the most valuable items that can really be settled with evidence (at most 8 per pass, fewer if each needs deep research). Prefer: integrity errors, coordinates that are wrong, page text that contradicts the data, official timings/fees that differ, dead source links. Research each one with the sources above. Use subagents for independent places if there are many.
4. For each item you settle:
   - fix `data/sitedata.js` (latlong, distance = km by road from Kalpetta from OSRM, timing, holidays, fee) AND the hand-written `Timing:`, `Fee :`, `Holiday:` lines in that place's page, so page and data agree; when a coordinate moves, also replace the old coordinate in that page (`data-center`, JSON-LD geo);
   - record the evidence in `data/verification.json` (entry per place id: `checked` date, `coordinate.osm_ref`, `timing`/`fee` with `value`, `source_url`, `confidence`; keep earlier fields that are still true).
5. Rebuild and verify (all must pass): `node scripts/minify-assets.mjs`, `node scripts/version-assets.mjs`, `node scripts/build-distances.mjs` (only if a coordinate or id changed), `node scripts/generate-mcp.mjs`, `node scripts/build-llmfeed.mjs`, `node scripts/build-llms.mjs`, `node scripts/build-search-index.mjs`, `node scripts/build-map-data.mjs`, `node scripts/build-sitemap.mjs`, `node scripts/prerender.mjs` (needs playwright-core and Chrome, see CLAUDE.md; re-run it after changing any data the pages render), `node scripts/build-pwa.mjs`, then `node scripts/check.mjs`. Open one changed page in a real browser and look at it.
6. Commit in small commits (data fix, page text, regenerated files) with the trailer `Co-Authored-By: Claude <noreply@anthropic.com>`, push the branch, and open a pull request with `gh pr create`. The description must contain a table: place id and name | what changed | old value | new value | evidence URL or OSM id | confidence, followed by "Needs the owner" (conflicts, duplicates, renames, removals, missing contact numbers) and "Not settled" (what you could not verify).
7. Stop. Do not merge. Report the pull request link and the counts (fixed, left for the owner, not settled).

If nothing in the report can be settled with evidence, change nothing, do not open a pull request, and say what is blocking (for example "needs a field visit", "owner decision").
