# MAINTENANCE_RUNBOOK.md

Target steady-state effort: **< 1 hour/week.** Once the GitHub Actions are active, most weeks require
zero action — the refresh runs, validates, and (only if green) commits + deploys automatically. You act
only when a run goes red.

## Weekly checklist (≤ 15 min, most weeks 2 min)
1. **Check the Actions tab** for the latest `refresh-data` run. Green ✓ → nothing to do.
2. If red ✗ → open the run, read the **failure summary** (auto-written to the run summary), and follow
   the matching playbook below.
3. Once a quarter (Feb/May/Aug/Nov, after the new IRS Internal Revenue Bulletin), open the site's
   `/rates/irs-underpayment/` page and confirm the current quarter appears. If not, run the IRS playbook.
4. Optional: skim `data/exports/meta.json` `generated_at` to confirm freshness.

## Failure playbooks

### A. IRS fetcher fails or returns 0 records
**Symptom:** run log shows `IRS: parsed 0 observations` or a fetch error for `irs-6621`.
**Likely cause:** the IRS changed the quarterly-rates page layout (table structure or year headings).
**Fix:**
1. `cd pipeline && node -e "import('./lib/http.mjs').then(m=>m.politeGet('https://www.irs.gov/payments/quarterly-interest-rates',{sourceId:'irs-6621',force:true}).then(r=>console.log(r.status)))"`
   — confirm a 200. A non-200/403 means IRS is rate-limiting; wait and re-run.
2. If 200 but parse is 0: the table/heading markup changed. Open `pipeline/fetchers/irs.mjs`; the parser
   keys off `<table>` blocks containing "Interest categories" and preceding `"YYYY interest rates by
   category"` headings. Adjust the regexes to the new markup.
3. Re-run `node run.mjs all`; validation must go green before committing.

### B. Fed H.15 fetcher fails or the 1-year column moves
**Symptom:** error `H15: could not locate 1-year CMT column` or a fetch error for `fed-h15`.
**Likely cause:** the Data Download series bundle changed, or the CSV header format changed.
**Fix:**
1. Fetch the CSV URL in `pipeline/fetchers/fed-h15.mjs` in a browser; confirm it still returns the
   1-year series (`RIFLGFCY01`). The parser locates the column by that id in the "Unique Identifier" row.
2. If the Fed retires that download bundle, rebuild a fresh CSV URL from
   https://www.federalreserve.gov/datadownload/ (H.15 → 1-year CMT → CSV) and update `CSV_URL`.
3. Re-run `node run.mjs all`.

### C. Validation fails (rates out of range / stale / derivation mismatch)
**Symptom:** `VALIDATION FAILED` with specifics.
- *Out of range:* a parser grabbed the wrong cell (e.g. a footnote). Inspect the offending series in
  `fetchers/`. The hard range is [-5, 30]% (`lib/validate.mjs`).
- *Stale (`freshest observation … days old`):* the source stopped updating or the fetch silently served
  cache. Delete `data/cache/<host>/` for that source and re-run to force a fresh fetch.
- *Derivation mismatch (`post-judgment != CMT`):* a bug in `lib/normalize.mjs`; the two must be equal by
  construction. Re-run the unit tests: `cd pipeline && node --test lib/`.

### D. Site build fails
**Symptom:** `deploy-site` red at the build step.
- Missing exports: run the pipeline first (`refresh-data` must have committed `data/exports`).
- Astro error: run `cd site && npm run build` locally to reproduce; fix the reported file.
- API conformance fail: `node machine/build-api.mjs && node machine/check-api-conformance.mjs` locally.

### E. Quarterly statute re-verification (statute-fixed state rates)
**Cadence:** once a quarter (~20 min), or immediately if a rate-change bill makes news.
The state rates are curated values in `pipeline/fetchers/us-states.mjs` (49 states + D.C. as of 2026-07-09;
Mississippi omitted — no fixed statutory default. Batch 1/2 are hand-written; batch 3 was generated from the
verified JSON by a one-off script — to re-verify batch 3, re-run the verification workflow and regenerate),
split into fixed-by-statute (high confidence) and variable/agency-set (medium, method `statute-variable`,
`VERIFIED_ON`/`EXP_VERIFIED_ON` date stamps). Re-verify the VARIABLE ones more often (TX/FL/GA/OH/MI/NJ/WA/AZ/TN/CO
change quarterly–annually via prime/Treasury/agency resets); fixed ones (PA/IL/NC/VA + CA/NY/MA) only on amendment.
The CA/NY/MA rates are curated values in `pipeline/fetchers/us-states.mjs`, verified against the
official statute texts on the date in `VERIFIED_ON`. To re-verify:
1. Open each `official_url` in the source list (leginfo.legislature.ca.gov CCP §685.010;
   nysenate.gov CPLR 5004; malegislature.gov c.231 §6B) and confirm the rate text is unchanged.
2. If unchanged: bump `VERIFIED_ON` in `us-states.mjs`, run `node run.mjs all`, commit.
3. If changed: update the value + `effective_date` + notes with the new session-law citation, run
   the pipeline, and consider a `/changes/` announcement — a statutory rate change is exactly the
   news moment this site exists for.
Watch items known today: Massachusetts has seen bills to peg its 12% to market rates (none enacted);
California's SB 1200 thresholds ($200k/$50k) could be amended.

### F. Prejudgment interest rates (per-state, second metric)
Per-state PREjudgment rates live in the same `us-states.mjs` file as a `PREJUDG` array (all 50 states +
D.C., verified 2026-07-09), pushed into `FIXED` alongside the post-judgment rates. They were generated
from a verified multi-agent JSON pass by `scratchpad/gen-prejudgment.mjs` (editorial copy incl. the
`applies`/`accrual`/`compound` fields lands in `site/src/lib/content.mjs`; the `/prejudgment/` index and
the restrictions-first layout in `rates/[slug].astro` read those). Kinds: `fixed`/`discretionary-with-default`
=> `statute-fixed` (high); `variable`/`same-as-postjudgment` => `statute-variable` (medium). Re-verify the
variable/same-as-post ones (AK, AZ, AR, CA, DE, FL, IA, ME, MI, MN, MO, NV, NH, OK, SD, WV + LA/NJ/OH/TX)
on the same quarterly cadence as the post-judgment variable rates; fixed/discretionary defaults only on
statutory amendment. The critical field to preserve on any edit is `restrictions` (liquidated-vs-unliquidated,
claim-type, discretionary, future-damages carve-outs) — it is the whole value of the metric.

**Full 51-jurisdiction statute audit (2026-07-11):** every state's post- AND prejudgment rate was
re-verified against its official statute by a multi-agent pass (scratchpad/verify-workflow.mjs). 21
were corrected. Key outcome: MANY states have a DUAL prejudgment rate — a general/liquidated rate and a
separate (often variable) tort/personal-injury rate — now shown as `value_text: "X% / Y%"` with the
split explained in `notes` + content `applies`/`body` (e.g. CA 7%/10%, GA 7%/9.75%, MT/KS/NE/UT/OK/NM/MN/NJ,
MO). The `value` numeric = the FIRST (general/liquidated) figure; the prejudgment CALCULATOR computes only
that fixed general/liquidated rate and says so. Stale variable rates were refreshed (KS post 8.25%, MI
4.959%, NE post 5.723% — note NE's 5.970% is FUTURE-dated to 7/16/2026, so don't let a future obs win
"latest"; the DB upserts by (entity,metric,effective_date,source_id) and picks max date). MA post cite →
M.G.L. c.235 §8. Re-run the audit workflow (resume from cache) after any statutory-rate news.

## How to add a new source / rate series
1. Create `pipeline/fetchers/<name>.mjs` exporting an async function that returns
   `{ source, entities, observations }` (copy `irs.mjs` as a template). Use `politeGet` from
   `lib/http.mjs` so robots/rate-limit/cache are handled for you.
2. Register it in `pipeline/run.mjs` (`fetch` step + `loadBundleIntoDb`).
3. Add sane ranges/labels in `lib/validate.mjs` if the unit differs.
4. Add editorial copy in `site/src/lib/content.mjs` and (if a new group) `site/src/lib/data.mjs` GROUPS.
5. `node run.mjs all` → green; the site/API/MCP pick up the new series automatically (they read exports).

## How to expand coverage (roadmap, in priority order)
UK, EU, and the first four US states (CA, NY, MA, IA) are BUILT. Next, in order of search value:
1. **Texas** post-judgment — floating: the consumer-credit commissioner publishes it monthly off the
   prime rate (floor 5%, cap 15%); prime is also in Fed H.15 (a different series id than our current
   CSV bundle — build a second H.15 download URL from federalreserve.gov/datadownload).
2. **Florida** — quarterly rate set by the CFO (§55.03); needs a myfloridacfo.com fetcher (check its
   bot-friendliness first; if hostile, the statutory formula is prime + 400bp set quarterly — derive
   and cite, per the same pattern as Iowa).
3. **Washington, New Jersey, Illinois** — mix of T-bill-linked formulas and fixed rates; same
   verify-then-curate pattern as CA/NY/MA (use a multi-agent official-source verification pass).
4. **Per-EU-country late-payment margins** — a small curated table (margin + national implementing
   law citation per member state) over the existing ECB reference series; unlocks 27 country pages.
5. **Prejudgment vs post-judgment split per state** — a second metric on existing entities.

## Do-not-touch rules (carried from the build)
- Honest User-Agent + robots.txt compliance are enforced in `lib/http.mjs`. Do not disable them.
- Never spoof a browser UA to defeat a site's anti-bot 403. If a source blocks bots, treat it as
  unavailable and use an alternative official feed.
