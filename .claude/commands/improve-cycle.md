---
description: One full improvement cycle - links, data against Wayanad sources, enrichment, browsers and screen sizes - one after another, with a scoreboard row after each
argument-hint: [optional: only some loops, e.g. "links ui" ; default all four]
---

Run one improvement cycle of www.bwstays.com. The four loops run one after another, each as a
complete pass (find -> fix with evidence -> rebuild -> verify -> record). Loops to run: $ARGUMENTS
(empty = all, in this order): links, data, enrich, ui.

Start the cycle by numbering it: read `data/improvement-log.json` and use the highest `cycle` + 1
(1 if empty). Work on one branch for the whole cycle: `improve/cycle-<n>` from an up-to-date `main`
(`git switch main && git pull && git switch -c improve/cycle-<n>`). If the working tree is not clean,
stop and say so.

For each loop, follow its command file exactly (they hold the rules):
1. links  -> `.claude/commands/improve-links.md`
2. data   -> `.claude/commands/improve-data.md`
3. enrich -> `.claude/commands/improve-enrich.md`
4. ui     -> `.claude/commands/improve-ui.md`

After EACH loop, record it: `node scripts/loop-metrics.mjs --cycle <n> --loop <name> --note "<one line: what was fixed, what is left>"`
and commit that loop's work as its own commit(s) (trailer `Co-Authored-By: Claude <noreply@anthropic.com>`).

End of cycle:
1. Full build, in this order: `node scripts/minify-assets.mjs`, `node scripts/version-assets.mjs`,
   `node scripts/build-distances.mjs` (only if a coordinate or id changed), `node scripts/generate-mcp.mjs`,
   `node scripts/build-llmfeed.mjs`, `node scripts/build-llms.mjs`, `node scripts/build-search-index.mjs`,
   `node scripts/build-map-data.mjs`, `node scripts/prerender.mjs` (only the pages whose data changed, with
   `--page`; all pages if a shared script or data file changed), `node scripts/build-schema.mjs`,
   `node scripts/build-sitemap.mjs`, `node scripts/build-llms-full.mjs`, `node scripts/build-pwa.mjs`.
2. Gate - ALL must pass, else fix or revert the loop that broke it:
   `node scripts/check.mjs` (exit 0), `node tests/ui/links.test.mjs` (PASS), `node tests/ui/compat.test.mjs` (no new broken combination).
3. Merge: `git switch main && git merge --no-ff improve/cycle-<n>` and `git push`. The owner's standing rule is
   to merge to main once the build and checks pass. Never push when the gate failed.
4. Record the end: `node scripts/loop-metrics.mjs --cycle <n> --loop cycle-end --note "<summary>"`, commit
   `data/improvement-log.json` on main and push.
5. Report in a few lines: what each loop fixed, the scoreboard (`node scripts/loop-metrics.mjs --show`) and
   what is waiting for the owner (decisions are never taken by the loop: removals, renames, conflicts
   between official sources, prices of the stay, anything not backed by an official source).

To run cycles back to back in an open Claude Code session: `/loop /improve-cycle` (self-paced) or
`/loop 2h /improve-cycle`. Each cycle starts only after the previous one finished.
