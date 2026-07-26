# Maintenance runbook

Target steady-state effort: under one hour per week. The weekly workflow should require no action
when green. State-law references require a separate, evidence-based review; automation does not make
them newly verified merely by rebuilding.

## Weekly checklist

1. Check the latest `refresh-data` and `deploy-site` runs in GitHub Actions.
2. If both are green, no code action is needed.
3. If refresh is red, use the source-specific playbook below. Never bypass validation.
4. Review `data/exports/meta.json` source `retrieved_at` values—not only `generated_at`. The latter is
   compilation time and does not prove that every source was freshly checked.
5. Once per quarter, review variable state rates and the IRS quarter against their cited sources.
   Texas, Alaska, Florida, and Utah are monitored automatically each week, but failures still
   require the playbooks below.

## IRS fetch failure

Symptoms include zero parsed observations, missing quarters, or an HTTP failure for `irs-6621`.

1. Open the IRS URL defined in `pipeline/fetchers/irs.mjs` and confirm it is available.
2. If the page is temporarily limiting requests, wait and re-run; do not spoof a browser user agent.
3. If the markup changed, update the parser and add/adjust a fixture-level test.
4. Run `npm test` and `node run.mjs all` in `pipeline/`. Commit exports only after validation passes.

## Federal Reserve H.15 failure

Symptoms include a missing 1-year CMT column or post-judgment/CMT derivation mismatch.

1. Confirm the configured CSV still includes series `RIFLGFCY01`.
2. If the Fed changed the bundle, create a replacement CSV URL through its official data-download
   interface and update `pipeline/fetchers/fed-h15.mjs`.
3. Run pipeline tests. The weekly post-judgment observation must equal the weekly CMT observation.

## Bank of England or E.C.B. failure

Confirm the configured official CSV endpoint still returns the expected columns and date formats.
Preserve the statutory half-year logic: U.K. late-payment rates use their relevant reference date,
and the E.U. reference uses the first day of each half-year. Do not substitute a live policy rate for
a legally fixed period rate.

## Texas OCCC monthly fetch failure

Symptoms include `current postjudgment rate and month were not found`, a rate outside 5%–15%, or a
published month that does not match the current month.

1. Open the OCCC URL in `pipeline/fetchers/texas-occc.mjs` and confirm the labeled current rate and
   month. Do not relax the 5%–15% statutory range gate.
2. If the OCCC has not rolled the page to a new month, do not relabel the prior rate as current. Wait
   for the official publication and re-run.
3. If markup changed, update `parseTexasCurrentRate` and its fixture tests without bypassing the
   shared robots/cache/throttle layer.
4. Confirm `texas-judgment-rate` remains contiguous from September 1983 through the new month and
   that Texas prejudgment's monthly value exactly matches it under §304.103.
5. Keep both calculation statuses `reference_only` unless the separate readiness contract passes.

## Alaska Court System PDF fetch failure

Symptoms include `ADM-505 response is not a PDF`, missing table boundaries, a changed verified
anchor, an annual gap, or an oversized-input rejection.

1. Open the official ADM-505 URL recorded in `pipeline/fetchers/alaska-interest-history.mjs`.
2. If the court has not published a new calendar year, retain the committed 1997-present schedule.
   Never derive or estimate a replacement from an unrelated Federal Reserve series.
3. If the PDF layout changed, update `extractAlaskaPdfText`/`parseAlaskaAdm505Text` and a
   representative test without removing the byte limit, page-count limit, disabled JavaScript
   evaluation, robots, cache, throttle, or historical-anchor checks.
4. A new row must continue on January 1 of the next year and match identically in both Alaska
   pre- and post-judgment series. The 1997 transition begins August 7; do not flatten the older
   complaint-date rule into this judgment-year table.
5. The monitor may log a fail-safe fallback and continue with the last verified schedule. A changed
   historical anchor must fail validation rather than overwrite committed legal-rate history.

## Florida CFO or Utah Courts fetch failure

Both sources have complete committed official-history baselines. A temporary network or WAF failure
must retain that baseline without estimating a replacement.

1. Open the source URL recorded in the relevant fetcher and confirm whether the government page is
   available.
2. If markup changed, update the parser and its representative fixture test; never weaken historical
   anchor, cadence, range, or statutory-formula checks.
3. Florida must continue quarterly from the last verified CFO period. Its October 1981–1994 row
   uses 360 days, the 1995–2011 annual schedule uses 365 days even in leap years, and the quarterly
   schedule uses 366 days in leap years beginning in 2012. Utah must continue annually and both
   current formula branches must reconcile to the published January 1 federal rate.
4. Run the full pipeline and build sequence. A source outage may log a fail-safe fallback; validation
   must still complete without invented observations.

## Validation failure

- **Range/type:** inspect the parser; a footnote or wrong column was probably captured.
- **Staleness:** distinguish a held policy rate from a source that was not checked. Inspect source
  retrieval metadata and cached response details.
- **Derivation mismatch:** fix the normalizer; never edit generated exports by hand.
- **State calculator rule:** return the entity to `reference_only` unless every required structured
  rule field is supported by a primary source and tests.

Use an isolated database for repair work:

```bash
DATA_MOAT_DB=/tmp/statuterates-repair.sqlite node pipeline/run.mjs build
DATA_MOAT_DB=/tmp/statuterates-repair.sqlite node pipeline/run.mjs validate
```

## Site or API build failure

```bash
cd site && npm test
cd .. && node machine/build-api.mjs
cd site && SITE_URL=https://statuterates.com npm run build && npm run verify-build
cd .. && node machine/check-api-conformance.mjs
```

The build verifier checks internal targets, homepage reachability for every sitemap URL, minimum
content-depth alarms, Astro whitespace regressions, state-calculator output, `noindex` gates, and
sitemap exclusions.

## State-law source review

State records live in `pipeline/fetchers/us-states.mjs`. All 102 state entities are currently
`reference_only`; most contain one observation. Texas (515 monthly rows), Nebraska (275 change
points), Iowa (302 monthly selections), Alaska (30 annual rows in each of its pre/post series),
Florida (78 official periods), Utah (34 annual rows), Maine, Kentucky, and Georgia have deeper
verified histories. A source review must not invent historical dates or change `retrieved_at` to the
build time.

For each state reviewed:

1. Open the cited URL and classify it with `pipeline/lib/state-rules.mjs`.
2. Prefer the controlling enactment or agency publication. If only a government/court reproduction
   or third-party mirror is available, retain the correct secondary tier.
3. Confirm the rate, effective period, claim-type branches, accrual rule, compounding, day count,
   reset/lock behavior, and exceptions.
4. Add a new effective-date observation when the law/rate changed; never overwrite the earlier point.
5. Update the source-check timestamp only when the source was actually reviewed.
6. Run all tests, isolated build/validation, export, site build, and API conformance.

Georgia and Mississippi now use the state legislatures' authorized LexisNexis code portals, which
are classified as `official_secondary` rather than controlling enactments. Georgia's changing prime
benchmark is independently verified from the official Federal Reserve series. North Carolina and
Oklahoma online code reproductions are likewise treated as official secondary sources.

## Enabling a state calculator

Do not enable a state solely because its current percentage looks simple. A state can become
calculator-ready only when its metadata passes the safety contract for:

- official primary source;
- complete effective-date history for the supported date range;
- fixed/reset/change behavior;
- simple/annual/daily compounding;
- day-count convention;
- complete claim/amount/government/consumer branches;
- verified accrual trigger; and
- explicit validity and verification dates.

Then add calculation tests for boundary dates and every branch. Keep
`STATE_CALCULATOR_RENDERER_READY` false and `ENABLE_STATE_CALCULATORS` unset in production until the
rendered page consumes the structured rule model rather than prototype assumptions.

## Adding a new source or series

1. Add a fetcher returning `{ source, entities, observations }` and use `politeGet`.
2. Register it in `pipeline/run.mjs`.
3. Add parser, validation, and derivation tests.
4. Add editorial copy/grouping only after the data contract is stable.
5. Run the complete local verification sequence in `README.md`.

## Non-negotiable rules

- Keep the honest user agent, robots checks, throttling, retry, and cache protections.
- Never evade an anti-bot block. Use another permitted primary source or keep the record secondary.
- Never call build time source freshness.
- Never manually edit generated API output or committed entity snapshots as the primary fix.
- Never deploy a state calculator with invented backfill dates or incomplete legal branches.
