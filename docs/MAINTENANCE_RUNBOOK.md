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
   The five Form 1040 penalty-rule pages and Texas, Alaska, Florida, and Utah are monitored
   automatically each week, but failures still require the playbooks below.

## IRS quarterly-rate fetch failure

Symptoms include zero parsed observations, missing quarters, or an HTTP failure for `irs-6621`.

1. Open the IRS URL defined in `pipeline/fetchers/irs.mjs` and confirm it is available.
2. If the page is temporarily limiting requests, wait and re-run; do not spoof a browser user agent.
3. If the markup changed, update the parser and add/adjust a fixture-level test.
4. Run `npm test` and `node run.mjs all` in `pipeline/`. Commit exports only after validation passes.

The calculators intentionally reject dates beyond the final published quarter. If a new quarter is
not in the official source yet, wait for the IRS publication and re-run; never copy the previous
rate forward as an estimate.

## IRS penalty-rule monitor failure

Symptoms name one of the five official pages or a missing calculation anchor, such as the monthly
rate, cap, partial-month rule, indexed minimum, penalty-interest start event, or AEP language.

1. Open the exact official URL in `pipeline/fetchers/irs-penalty-rules.mjs`. If it is temporarily
   unavailable, retain the committed exports and retry later. Do not substitute an unofficial page
   or bypass the shared robots/cache/throttle rules.
2. Decide whether the IRS changed only wording/layout or changed the rule itself. Do not loosen an
   anchor until that distinction is established from the official page.
3. For a wording-only change, update the narrow page assertion and its representative test while
   preserving every calculation-critical check.
4. For a substantive change, update the committed `IRS_PENALTY_RULES`, its validator, engine
   boundary tests, and user-facing explanation together. Preserve effective-date history for an
   indexed minimum; never silently replace a prior-year rule.
5. Run:

   ```bash
   cd pipeline
   node --test fetchers/irs-penalty-rules.test.mjs
   npm test
   node run.mjs all
   cd ..
   node --test shared/*.test.mjs
   ```

6. Inspect `irs-underpayment.metadata.penalty_rules` in the generated export and complete the full
   site/API build sequence below. Never hand-edit the generated export as the fix.

The monitor deliberately fails the refresh instead of scraping changed prose into calculator math.
The previous committed site remains the safe fallback while the new official language is reviewed.

## Federal Reserve H.15/FRED failure

Symptoms include a changed FRED CSV header, a weekday or weekly gap, a stale feed, a changed
historical anchor, a `DGS1`/`WGS1YR` mismatch, or a missing federal/CMT week in database validation.

1. Open the official FRED `DGS1` and `WGS1YR` series pages linked in
   `pipeline/fetchers/fed-h15.mjs`. Both feeds are mandatory; do not publish from only one.
2. Confirm FRED still returns the exact two-column `observation_date,<series>` CSV shape. `DGS1`
   may contain blank holiday values; `WGS1YR` may not contain a missing weekly value.
3. Do not restore the Federal Reserve “Build Your Package” endpoint. The Board announced its
   removal for November 2026 and directs users to FRED or full XML.
4. Preserve source ID `fed-h15` so durable-history hydration remains one provenance branch. Do not
   hand-edit exported federal weeks or substitute a nearby week.
5. Run `node --test fetchers/fed-h15.test.mjs`, the full pipeline suite, and `node run.mjs all`.
   The current-formula post-judgment series must begin with rate week `2000-12-11`; from that week
   forward it must have exact one-to-one dates and values with the CMT weekly series.

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

For the released Florida calculator, the latest verified CFO point controls two separate boundaries:
new entry dates are supported only before the next quarterly boundary, while an existing supported
judgment can run only through December 31 before an unpublished January 1 reset is required. The
public through-date is inclusive by default, so the UI maximum is the day before the engine's
exclusive coverage boundary. Test both included and excluded conventions after any boundary change.

## Calculator legal-rule review

Florida's reviewed calculation contract expires on **January 26, 2027** unless it is rechecked.
Forty-five days before any calculator contract expires, the weekly workflow opens one deduplicated
GitHub issue titled `[StatuteRates] Calculator legal-rule review due`. If the deadline passes,
pipeline and deployment validation fail closed with `calculator-ready rule review expired`.

To renew it:

1. Open the controlling statute and official rate source named in the entity metadata.
2. Confirm every monitored legal anchor, supported branch, excluded branch, accrual rule,
   compounding rule, day-count rule, and calculator explanation. A successful automated phrase
   check is evidence, but it does not replace this review.
3. If the rule changed, update the engine, metadata, page copy, and boundary tests together. If the
   review cannot be completed, change the contract to `reference_only`; never extend the date alone.
4. If the rule is unchanged, update `rule_verified_at` and set `rule_review_expires_at` no more than
   200 days later. Run the full pipeline, shared, site, API, and production verification gates.
5. Close the reminder issue only after the renewed contract is deployed.

## Validation failure

- **Range/type:** inspect the parser; a footnote or wrong column was probably captured.
- **Staleness:** distinguish a held policy rate from a source that was not checked. Inspect source
  retrieval metadata and cached response details.
- **Derivation mismatch:** fix the normalizer; never edit generated exports by hand.
- **State calculator rule:** return the entity to `reference_only` unless every required structured
  rule field is supported by a primary source and tests.

`build` validates the exact committed exports in a fresh in-memory database:

```bash
node pipeline/run.mjs build
```

For a full source-refresh repair, use a separate writable database:

```bash
DATA_MOAT_DB=/tmp/statuterates-repair.sqlite node pipeline/run.mjs all
DATA_MOAT_DB=/tmp/statuterates-repair.sqlite node pipeline/run.mjs validate
```

## Site or API build failure

```bash
cd site && npm test
cd .. && node --test shared/*.test.mjs
node machine/build-api.mjs
cd site && SITE_URL=https://statuterates.com npm run build && npm run verify-build
cd .. && node machine/check-api-conformance.mjs
```

The build verifier checks internal targets, homepage reachability for every sitemap URL, minimum
content-depth alarms, Astro whitespace regressions, state-calculator output, `noindex` gates, and
sitemap exclusions.

## Search Console machine-resource exclusions

Search Console can discover raw JSON, CSV, and RSS URLs through the public API, Dataset structured
data, visible download links, and RSS autodiscovery. “Crawled — currently not indexed” is the expected
classification for these non-HTML resources; it does not mean that an HTML sitemap page failed.
Review the **submitted sitemap pages** separately before treating an indexing report as a site defect.

Two narrow Cloudflare edge rules were deployed on 2026-08-08:

1. A Response Header Transform Rule matches:

   ```text
   (starts_with(http.request.uri.path, "/api/v1/")) or
   (http.request.uri.path eq "/changes.xml") or
   (starts_with(http.request.uri.path, "/rates/") and ends_with(http.request.uri.path, ".xml"))
   ```

   It sets `X-Robots-Tag: googlebot: noindex`. The Googlebot scope is intentional: these resources
   stay crawlable, `robots.txt` remains allow-all, and OAI, Anthropic, Perplexity, Bing, and other
   machine consumers do not receive a generic indexing prohibition. Do not expand the rule to the
   human `/api/` landing page, HTML pages, `llms.txt`, `llms-full.txt`, or `/openapi.yaml`.
2. An exact HTTP `301` redirects `/states/new-york-consumer-debt/` to
   `/rates/new-york-consumer-debt-judgment-rate/` and preserves the original query string. Do not turn
   this evidence-backed exception into a blanket redirect policy.

`machine/check-public-edge.mjs` fails a production release if representative API or feed resources
lose the Google-scoped header, if protected human/AI-discovery surfaces gain it, or if the exact
redirect stops preserving its destination and query string. Do not replace the response header with
a `robots.txt` disallow: Google must crawl a URL to observe `noindex`, and the machine interfaces must
remain accessible. Do not repeatedly use Search Console's “Validate Fix” for raw API or RSS URLs;
allow Google to recrawl and move them to its intentional `noindex` classification.

## State-law source review

State records live in `pipeline/fetchers/us-states.mjs`. Florida judgment interest is the sole
`ready` state contract; the other state entities remain `reference_only`, and most contain one
observation. Texas (515 monthly rows), Nebraska (275 change
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

Then add calculation tests for boundary dates and every branch, create a dedicated renderer, and add
one reviewed entry to `site/src/lib/state-calculators.mjs`. The entity's versioned `renderer_id`
must match that registry entry. Keep `STATE_CALCULATOR_RENDERER_READY` false and
`ENABLE_STATE_CALCULATORS` unset: those legacy switches must never mass-publish generic state pages.

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
- Never extend an IRS interest rate into an unpublished quarter or infer a missing IRS penalty rule.
