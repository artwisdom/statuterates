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

## How to add a new source / rate series
1. Create `pipeline/fetchers/<name>.mjs` exporting an async function that returns
   `{ source, entities, observations }` (copy `irs.mjs` as a template). Use `politeGet` from
   `lib/http.mjs` so robots/rate-limit/cache are handled for you.
2. Register it in `pipeline/run.mjs` (`fetch` step + `loadBundleIntoDb`).
3. Add sane ranges/labels in `lib/validate.mjs` if the unit differs.
4. Add editorial copy in `site/src/lib/content.mjs` and (if a new group) `site/src/lib/data.mjs` GROUPS.
5. `node run.mjs all` → green; the site/API/MCP pick up the new series automatically (they read exports).

## How to expand coverage (roadmap, in priority order)
1. **UK statutory late-payment** — Bank of England Bank Rate (official database/CSV) + 8pp. Add
   `fetchers/boe.mjs` and a `uk-late-payment-commercial` derived series (medium confidence, formula note).
2. **EU Late Payment Directive** — ECB main refinancing rate via the ECB Data Portal REST API
   (`data-api.ecb.europa.eu`) + per-country statutory margins (a small static table with citations).
3. **US state judgment/legal rates** — start with the highest-search states (CA, NY, FL, TX). Many are
   `1-yr CMT + X%` (derivable from H.15) or fixed by statute (a small maintained table). Avoid the
   bot-hostile court hosts (see DECISIONS.md); prefer the clean CMT-derived formula where the statute allows.

## Do-not-touch rules (carried from the build)
- Honest User-Agent + robots.txt compliance are enforced in `lib/http.mjs`. Do not disable them.
- Never spoof a browser UA to defeat a site's anti-bot 403. If a source blocks bots, treat it as
  unavailable and use an alternative official feed.
