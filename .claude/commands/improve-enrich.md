---
description: Enrich loop - fill missing facts from official sources and present every place in the same simple format
argument-hint: [optional: number of places, default 5, or ids]
---

Enrich loop of the BWStays improvement cycle. Goal: each place page answers a visitor's questions at a
glance - what it is, where, when open, what it costs, how long to spend, best season, how to get there,
whom to call - in the same simple format on phone and desktop, with nothing invented.
Scope: $ARGUMENTS (empty = the 5 places with the most missing facts).

1. Pick the places: `node scripts/verify-data.mjs` (section MISSING) and `data/verification.json`
   (places without `description_sources`, without `timing`/`fee` evidence). Prefer places many visitors
   see (index rows, popular categories).
2. For each place, research ONLY official or primary sources (see `.claude/commands/improve-data.md` for
   the list and the never-use list). Fill what they state: timing, holidays, fee, contact, duration
   guidance if the source gives it, how to reach (bus stand / nearest town distances the source gives),
   facilities. Leave "not published" where no official source states it - a wrong value is worse than a
   missing one. Write descriptions in your own words (no copying), short sentences, the facts first;
   add the "Sources:" line with the links used.
3. Same format everywhere: keep the standard place-page layout (the info list with Timing, Transportation,
   Seasons to Visit, Type, Fee, Holiday, Contact; then the description and Sources line). If a page
   deviates, bring it to the standard layout (see `scripts` history: the 900 Kandi / Pakshipathalam /
   Trikaipatta standardisation) without losing its content.
4. Update `data/sitedata.js`, the page, and `data/verification.json` (evidence per fact). Rebuild what the
   data feeds and prerender the pages that show these places (see improve-data step 5).
5. Check one changed page at phone and desktop size: `node tests/ui/compat.test.mjs --page <file> --browsers chrome --sizes phone,desktop`
   and look at the screenshots in `tests/ui/results/compat/`. Commit ("Enrich: ...").
