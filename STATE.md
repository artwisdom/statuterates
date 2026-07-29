# Current project state

> Resume here. This file describes the current implementation; older execution and growth reports are
> historical snapshots and may contain superseded counts or assumptions.

**Updated:** 2026-07-28
**Production:** https://statuterates.com
**Repository:** https://github.com/artwisdom/statuterates
**Runtime:** Node 22.12+ (Node 24 also verified locally)

## Current product

- 114 rate-series entities and 4,949 recorded historical observations.
- 195 static HTML pages.
- 114 per-entity JSON endpoints, 114 CSV endpoints, and aggregate API endpoints.
- Weekly automated refresh for IRS, Federal Reserve, Bank of England, and E.C.B. data, plus live
  extension checks for Texas, Alaska, Nebraska, Iowa, Florida, Utah, and Georgia state schedules and
  an independent Maine annual-formula integrity check. Five official IRS pages are also checked
  against the committed Form 1040 penalty-rule contract.
- 102 state-law entities across post- and prejudgment interest.
- Calculator set in the current repository: general fixed-rate judgment/per-diem arithmetic,
  full-modern-history federal post-judgment, separate IRS underpayment/refund interest, U.K./E.U.
  late payment, Form 1040 penalty-and-interest, and the narrowly scoped Florida §55.03 calculator.
- State calculators: Florida is the only dedicated released state calculator. Legacy generic state
  comparison routes remain `noindex`; every other dedicated state calculator is absent from the
  build and sitemap.

## July 2026 safety baseline

The takeover audit found that the inherited project overstated state-history depth and source
freshness, and that prototype state calculators could apply invented 1990 anchors or incomplete legal
rules. Phase 1 corrected the foundation:

1. **Fail-closed state calculators.** Every state entity defaults to `reference_only`. A calculator
   cannot ship without primary-source-backed, structured history, branches, accrual, day count,
   reset behavior, and compounding metadata. A separate renderer-readiness flag is also hard-disabled,
   so setting the deployment environment variable alone cannot expose the inherited prototype.
2. **Durable automation history.** A clean CI database is rehydrated from committed exports before
   fetching. Weekly automation can no longer erase earlier observations.
3. **Truthful timestamps.** Curated state records use their actual source-check time, not the build
   time. Unchanged observations retain their original retrieval time.
4. **Source tiers.** Official primary, official secondary, third-party secondary, and unclassified
   sources are explicit. Third-party records are never labeled official.
5. **Data corrections.** Missouri and Tennessee prejudgment wording/rules were corrected; Arkansas,
   Colorado, New Mexico, and Oregon were moved to stronger cited sources; Wisconsin's malformed URL
   was fixed. Mississippi's misleading universal 8% value was replaced by its contract-or-court-set
   rule and a legislature-authorized code source.
6. **Content integrity.** Broken ellipsis fragments were removed without inventing missing prose.
   Public freshness, history, licensing, and source claims now match the data.
7. **Machine safety.** API links are root-absolute and the MCP file loader rejects traversal/non-slug
   input.
8. **Dependency/runtime hardening.** Astro is pinned to 7.1.1, better-sqlite3 to 12.11.1, the project
   uses Node 22.12+, and all three dependency trees audit clean.
9. **Build guardrails.** Deployment now tests the pipeline/site and checks internal links,
   calculator indexing gates, and rendered prose before publishing.
10. **Reliable refresh deployment.** `deploy-site` follows every successful `refresh-data` run through
    GitHub's native `workflow_run` event, because refresh commits made with `GITHUB_TOKEN` do not
    trigger a second push workflow.
11. **Single-beacon analytics.** Cloudflare Web Analytics is enabled through automatic edge
    injection with EU visitor collection excluded. The static site intentionally contains no
    analytics token or manual beacon, and the build rejects one to prevent duplicate counting.

## Phase 2 demand-led state milestone

- Private Search Console evidence was reviewed read-only to choose the order of work. Account-level
  metrics are intentionally not stored in this repository.
- Texas now has 515 official monthly postjudgment observations from September 1983 through July
  2026, plus a live OCCC current-month monitor.
- Nebraska now has all 275 change points in the Judicial Branch's published table from January 1987
  through July 2026, plus a live current-rate monitor.
- Iowa's inherited weekly-average model was legally incorrect and has been removed. Iowa now has 302
  exact monthly Judicial Branch selections from March 2001 through July 2026, including the court's
  confirmed 6.06% selection effective July 9. The retired 6.02% estimate is purged and rejected.
- Kentucky now preserves the official 12%-to-6% postjudgment change and correctly presents its 8%
  prejudgment figure as claim-dependent rather than automatic.
- Maine now has all 24 official annual prejudgment and post-judgment rows from July 2003 through
  2026, including the corrected 2025 rates. The pipeline independently reproduces the current annual
  values from the official H.15 inputs and can label a future unmatched year only as provisional.
- Georgia now has 59 exact prime-rate change periods from July 2003 through December 2025. A live
  Federal Reserve monitor verifies every baseline anchor and safely appends later changes; the
  general postjudgment rate is prime plus three percentage points.
- Mississippi prejudgment interest is now represented as a case-specific contract-or-court-set rule,
  with no fabricated universal numeric percentage.
- Utah now preserves all 34 exact State Courts annual rates from 1993 through 2026. Automation checks
  the official current and historical tables, verifies the federal-plus-two general formula and the
  federal-plus-ten under-$10,000 goods/services branch, and fails safely on an outage.
- Florida post-judgment and prejudgment references now each preserve all 78 official CFO periods
  from October 1981 through July 2026. Automation checks the live table, both daily fields, quarter
  cadence, historical anchors, and calculation-critical §55.03 text before a new period can enter
  both datasets.
- Alaska now preserves all 30 annual pre- and post-judgment rates in official Court System form
  ADM-505 from the August 7, 1997 transition through 2026. Its inherited January 2 prejudgment
  pseudo-effective date was corrected to January 1. A weekly PDF monitor verifies every anchor and
  can append a later year only when the court publishes it.
- Connecticut's inherited universal flat-10% postjudgment row was removed. The page and API now
  preserve its discretionary, negligence, hospital-debt, and condemnation branches as an
  `up to 10%` reference, with a durable migration preventing the retired row from returning.
- Washington, Maryland, Alaska, Wisconsin, Oklahoma, Utah, Florida, and Pennsylvania pages now carry
  fuller source-specific scope, accrual, history, and branch explanations.
- Existing state/rate URLs with demonstrated Search Console demand now use explicit year/rate titles,
  quick-answer panels, statutory labels, richer state tables, and stronger internal links. The
  implementation deliberately strengthens trusted URLs instead of creating thin statute doorway
  pages.
- Texas post- and prejudgment calculation rules are structured but remain `reference_only` because
  day count, payment allocation, and every supported branch are not yet deterministic.
- Nebraska, Iowa, Kentucky, Maine, Georgia, and Mississippi also remain `reference_only`; none of
  these state pages can expose a calculator.
- The full pipeline fetch/validation/export passes with no warning and no calculator-ready states.

## Phase 3 indexing and unattended-operation milestone

- Every indexable sitemap URL must now be reachable from the homepage through ordinary HTML links.
  A deployment fails if a future template creates an orphan.
- Every rate page must retain at least 200 visible words and every state hub at least 250. These are
  conservative regression alarms for broken templates or missing content, not ranking targets.
- State hubs now form an alphabetical previous/next crawl path in addition to the state indexes and
  hub-to-rate links. The underlinked statutory-interest guide also gains a contextual homepage link.
- Rate and state `lastmod`/Dataset modification dates can reflect a hand-recorded substantial
  editorial update without changing on every build.
- Alaska's official PDF is fetched through the shared robots, throttle, retry, cache, and fetch-cap
  layer. The parser rejects oversized input, disables PDF JavaScript evaluation, limits page count,
  validates every historical anchor, and falls back to committed verified data on any failure.
- The robots gate now evaluates the same `StatuteRatesBot` token that the public user agent
  advertises.
- Performance is not the current growth bottleneck. A production Texas rate page measured 85 ms
  lab LCP, 1 ms TTFB, and 0.00 CLS. Mobile audits scored 100 for accessibility, SEO, and agentic
  browsing; the remaining best-practices findings came from third-party AdSense behavior.
- Google AdSense Auto Ads is active. Manual ad units remain intentionally unconfigured rather than
  inventing a slot ID or adding page weight before traffic supports the tradeoff.

## Phase 4 Form 1040 calculator release

The Form 1040 penalty-and-interest calculator and its official-rule monitor are deployed and
verified in production.

- `/calculators/irs-penalty-and-interest/` models the common individual original Form 1040 case.
  It separates failure-to-file, failure-to-pay, tax interest, and failure-to-file-penalty interest
  instead of presenting one false payoff number.
- The calculation supports separate original payment and extended filing deadlines, dated partial
  tax payments, a qualifying installment-agreement start, and an applicable intent-to-levy date.
  Month-by-month tables expose the rate and balance used for each penalty period.
- Interest follows every published quarterly §6621 rate and §6622 daily compounding. The engine
  refuses an end date beyond the final published quarter instead of silently extrapolating the last
  rate.
- Failure-to-pay-penalty interest is explicitly excluded because its start depends on an
  account-specific IRS notice, assessment, or 23C date. The result is a planning estimate, not an
  official IRS payoff.
- The page shows a separate Automatic Exemption from Penalty comparison for a potentially eligible
  current return. It never decides eligibility; only the IRS can confirm AEP from its compliance
  records.
- `/calculators/irs-interest/` remains the dedicated interest/refund tool for personal and corporate
  underpayment and overpayment intent. It now links to the Form 1040 tool and displays the FAQs that
  its structured data describes.
- The weekly rules monitor checks the IRS failure-to-file, failure-to-pay, interest, administrative
  penalty-relief, and Internal Revenue Manual 20.1.2 pages. Calculator constants remain committed
  and reviewable; changed official anchors fail the refresh rather than being scraped directly into
  production math.
- The new calculator and companion guide are in the ordinary internal-link graph and sitemap.
  Build guards protect the page's core rules, AEP explanation, exclusions, and estimate language.
- Shared calculation tests now belong to the deployment gate, and changes under `shared/` trigger a
  deployment workflow run.

## Phase 5 federal durability and Florida calculator

- The federal H.15 ingestion no longer depends on the Federal Reserve Board's retiring “Build Your
  Package” download. It fetches complete official FRED `DGS1` daily history from January 2000,
  derives Monday-keyed weekly averages with exact decimal rounding, and requires every published
  `WGS1YR` week to reconcile before loading or exporting.
- The modern §1961 series now contains 1,337 weekly rate records beginning December 11, 2000—the
  preceding rate week needed for judgments entered when the current formula began on December 21.
  The calculator rejects earlier judgments and refuses to substitute an older rate when the exact
  preceding calendar week is absent.
- `/calculators/post-judgment-interest/` now explains the formula transition, full source history,
  daily computation, annual compounding, exclusions, and the dual-feed integrity check. It remains
  browser-local and fail-closed.
- `/calculators/florida-judgment-interest/` is the first state-specific release. It supports only an
  ordinary Florida money judgment entered/filed by the clerk on or after July 1, 2011, under the
  statutory CFO schedule, with no contract rate, excluded clerk category, payment, amendment,
  renewal, later fee, or cost event.
- Florida arithmetic selects the CFO rate in force on the entry date, holds it through December 31,
  then applies the exact CFO January 1 rate each later year. It uses simple principal-only interest,
  exact rational arithmetic, 365/366 calendar-year denominators, one final cent rounding, and a
  visible include/exclude through-date choice. It reproduces the official DFS 2013 comparison
  fixture and never carries a missing quarter or January reset forward.
- A code-controlled release registry plus matching entity metadata and renderer ID is required for
  every dedicated state calculator. The inherited mass-state prototype was removed, so an
  environment variable cannot generate unreviewed state pages.
- The Florida tool is linked from its rate page, state hub, calculator index, related federal page,
  and sitemap. It renders before advertisements, prints/copies a transparent period schedule, and
  sends no visitor-entered amount or date to a server.
- Pipeline changes now trigger deployment. The deploy workflow installs and tests pipeline
  dependencies and validates the exact committed exports in a fresh isolated database before
  building the API and site. Complete live snapshots can replace prior rows; partial feeds and
  source outages merge with or preserve the last verified history instead of erasing it.
- Current values, years, effective dates, branch rates, and history counts on the monitored
  variable-rate pages are observation-backed. The weekly workflow opens a deduplicated issue 45
  days before a calculator's legal review expires, and IndexNow runs only after production deploys.
- Sitemap `lastmod` values now advance only for a verified data, source-retrieval, release, or
  substantial editorial change. Build verification rejects invalid, pre-launch, and future dates.
- The weekly refresh reruns the complete test suite and exact-export build after fetching and before
  committing, so new official observations cannot silently make the repository's release gate stale.

## Verified checks

- Pipeline: 126 tests.
- Shared interest engine: 36 tests.
- Site data and copy contracts: 13 tests.
- MCP: 3 tests, including traversal protection and the full six-tool smoke test.
- API conformance: 114 entity endpoints and 5,063 latest/history records checked.
- Static build: 195 pages on Astro 7.
- Indexable sitemap: 192 URLs.
- Local mobile audits: 100 accessibility, 100 SEO, and 100 agentic browsing. Best practices is 77
  because of AdSense third-party-cookie/DevTools findings rather than first-party site code.
- npm audit: zero known vulnerabilities in site, pipeline, and MCP production dependencies.
- Production release `76748cb` (GitHub Actions `deploy-site` run 26) passed on 2026-07-26.
  The Cloudflare-served domain was verified across the priority state/rate pages, 189-URL sitemap,
  HSTS, and the 114-series/2,303-observation API. Google Search Console accepted the refreshed
  sitemap and started indexing validation; allow Google time to recrawl and update its reports.
- Phase 3 release `a3ab184` (GitHub Actions `deploy-site` run 27) passed on 2026-07-26. Production
  now serves the 30-point Alaska pre/post histories, 2,361-observation API, state crawl paths, honest
  Alaska `lastmod` dates, and stricter deployment safeguards. HTTPS/HSTS/`nosniff`, AdSense, and the
  single Cloudflare analytics beacon were reverified live.
- Phase 4 release `ca0a017` (GitHub Actions `deploy-site` run 28,
  [run 30217032320](https://github.com/artwisdom/statuterates/actions/runs/30217032320)) passed on
  2026-07-26. Production serves the Form 1040 penalty-and-interest calculator, companion guide,
  five-page IRS rule-monitor metadata, and 191-URL sitemap. A live browser calculation matched the
  tested `$11,218.50` result; HTTPS/HSTS/`nosniff`, redirects, canonical URL, structured data,
  AdSense, one Cloudflare analytics beacon, no horizontal overflow at the tested live viewport, and
  zero browser-console errors were reverified directly on the Cloudflare-served domain.
- Phase 5 and indexing-safety release `ca392a1` (GitHub Actions `deploy-site` run 31,
  [run 30413180531](https://github.com/artwisdom/statuterates/actions/runs/30413180531)) passed on
  2026-07-28. Production serves the audited Florida calculator, 1,337-week federal §1961 history,
  1,386-week Treasury history, truthful sitemap freshness signals, and 4,949-observation API. Both
  calculators, exact live calculations, desktop/mobile layout, canonical/schema markup, HTTP-to-HTTPS
  redirect, security headers, AdSense, one Cloudflare analytics beacon, and the public API were
  reverified directly. The live sitemap contains 192 unique URLs with no pre-launch or future
  `lastmod` date, and Search Console reports that sitemap as successful.

## Important files

- `pipeline/lib/seed-exports.mjs`: hydrates fresh SQLite from durable exports.
- `pipeline/lib/state-rules.mjs`: source tiers and calculator-readiness contract.
- `pipeline/fetchers/irs-penalty-rules.mjs`: committed Form 1040 rule contract and five-page
  official-source monitor.
- `pipeline/fetchers/fed-h15.mjs`: complete DGS1 ingestion and mandatory WGS1YR reconciliation.
- `pipeline/fetchers/us-states.mjs`: curated state values and source-check timestamps.
- `site/src/lib/data.mjs`: build-time data loader and fail-closed calculator check.
- `site/src/lib/sitemap.mjs`: truthful significant-change dates for sitemap entries.
- `site/scripts/check-build.mjs`: broken-link/indexing/rendered-output deployment guard.
- `docs/PHASE_1_AUDIT.md`: takeover findings, competitor research, keyword map, and growth priorities.
- `docs/PHASE_2_PROGRESS.md`: demand-led Texas, Nebraska, Iowa, Kentucky, Maine, Georgia, and
  Mississippi source research and the current state-verification roadmap.
- `docs/PHASE_3_PROGRESS.md`: indexing/performance audit, Alaska official history, crawl paths, and
  unattended-operation safeguards.
- `docs/PHASE_4_PROGRESS.md`: Form 1040 penalty-and-interest scope, source monitoring, tests, and
  deployed-release safeguards.
- `docs/PHASE_5_PROGRESS.md`: federal source migration, Florida calculation contract, and release
  verification.
- `shared/interest-calc.mjs`: calculation engine shared by the site and MCP.
- `.github/workflows/refresh.yml`: tested weekly data refresh.
- `.github/workflows/deploy.yml`: tested static deployment plus successful-refresh handoff.

## Known limitations / next phase

- Most state entities still have only one recorded observation. Texas, Alaska, Nebraska, Iowa,
  Kentucky, Maine, Georgia, Utah, and Florida have deeper verified histories. Florida's deliberately
  narrow modern scope is released; all other state calculators remain withheld pending complete
  arithmetic, legal-branch contracts, and dedicated renderers.
- Iowa's live court page can intermittently block automation. The system safely retains the last
  exact published history and never substitutes a Federal Reserve estimate.
- Florida CFO and Utah Courts can also be temporarily unreachable from some runners. Both monitors
  retain complete verified baselines and never estimate a replacement rate.
- Alaska's annual effective date can be more than 200 days old late in the calendar year without
  being stale. Validation uses an annual cadence threshold while the live PDF retrieval timestamp
  proves that the current table was checked.
- Georgia and Mississippi use legislature-authorized code portals classified as
  `official_secondary`; the Federal Reserve benchmark underlying Georgia is official primary data.
- Several government-hosted code reproductions are classified `official_secondary` because the
  online text is not itself the controlling enactment.
- State calculation metadata is not yet complete enough to enable another state calculator.
- The Form 1040 calculator does not determine penalty relief or compute failure-to-pay-penalty
  interest without account-specific IRS assessment events. It also excludes corporations,
  employment/deposit penalties, audit deficiencies, estimated-tax additions, disasters and other
  special deadlines.
- The 2026-07-19 follow-up live check verified Cloudflare **Always Use HTTPS** (`301` to HTTPS), the
  documented response-header rule, and HSTS with `max-age=15552000`. `includeSubDomains` and
  `preload` remain off intentionally. These controls live at the Cloudflare edge rather than in the
  static HTML.
- The 2026-07-26 Cloudflare check verified automatic Web Analytics/RUM injection, with EU visitor
  collection excluded and exactly one beacon on the live homepage. Analytics stays at the edge;
  there is intentionally no `CF_ANALYTICS_TOKEN` repository variable.
- Search Console's discovered-page validation remains in progress. The inspected redirect examples
  are expected old HTTP variants that already consolidate through a one-hop `301`; they are not a
  reason to change canonicals or request another validation. One isolated retired URL remains a
  legitimate `404` and is absent from internal links and the sitemap; a future exact redirect may
  be considered only if external-link evidence makes it worthwhile. Blanket 404 redirects remain
  prohibited.
- IndexNow currently submits the full sitemap on deploy; a later optimization can submit only changed
  URLs.

Continue source by source: measure the federal and Florida tool cluster, use demand evidence to
choose the next official state contract, preserve the code-controlled calculator gate, and let
search engines recrawl before generating more URLs. Do not return to speculative mass-state pages.
