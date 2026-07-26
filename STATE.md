# Current project state

> Resume here. This file describes the current implementation; older execution and growth reports are
> historical snapshots and may contain superseded counts or assumptions.

**Updated:** 2026-07-25
**Production:** https://statuterates.com
**Repository:** https://github.com/artwisdom/statuterates
**Runtime:** Node 22.12+ (Node 24 also verified locally)

## Current product

- 114 rate-series entities and 2,193 recorded historical observations.
- 192 static HTML pages.
- 114 per-entity JSON endpoints, 114 CSV endpoints, and aggregate API endpoints.
- Weekly automated refresh for IRS, Federal Reserve, Bank of England, and E.C.B. data, plus live
  extension checks for Texas, Nebraska, Iowa, and Georgia state schedules and an independent Maine
  annual-formula integrity check.
- 102 state-law entities across post- and prejudgment interest.
- Available calculators: general fixed-rate judgment/per-diem arithmetic, federal post-judgment,
  IRS interest, and U.K./E.U. late payment.
- State calculators: intentionally disabled, `noindex` where legacy comparison routes exist, and
  omitted from the sitemap.

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
- Texas post- and prejudgment calculation rules are structured but remain `reference_only` because
  day count, payment allocation, and every supported branch are not yet deterministic.
- Nebraska, Iowa, Kentucky, Maine, Georgia, and Mississippi also remain `reference_only`; none of
  these state pages can expose a calculator.
- The full pipeline fetch/validation/export passes with no warning and no calculator-ready states.

## Verified checks

- Pipeline: 63 tests.
- Shared interest engine: 10 tests.
- Site data contract: 2 tests.
- MCP: 3 tests, including traversal protection and the full six-tool smoke test.
- API conformance: 114 entity endpoints and 2,307 latest/history records checked.
- Static build: 192 pages on Astro 7.
- Local mobile Lighthouse: 100 accessibility, 100 best practices, 100 SEO, and 100 agentic browsing.
- npm audit: zero known vulnerabilities in site, pipeline, and MCP production dependencies.

## Important files

- `pipeline/lib/seed-exports.mjs`: hydrates fresh SQLite from durable exports.
- `pipeline/lib/state-rules.mjs`: source tiers and calculator-readiness contract.
- `pipeline/fetchers/us-states.mjs`: curated state values and source-check timestamps.
- `site/src/lib/data.mjs`: build-time data loader and fail-closed calculator check.
- `site/scripts/check-build.mjs`: broken-link/indexing/rendered-output deployment guard.
- `docs/PHASE_1_AUDIT.md`: takeover findings, competitor research, keyword map, and growth priorities.
- `docs/PHASE_2_PROGRESS.md`: demand-led Texas, Nebraska, Iowa, Kentucky, Maine, Georgia, and
  Mississippi source research and the current state-verification roadmap.
- `shared/interest-calc.mjs`: calculation engine shared by the site and MCP.
- `.github/workflows/refresh.yml`: tested weekly data refresh.
- `.github/workflows/deploy.yml`: tested static deployment plus successful-refresh handoff.

## Known limitations / next phase

- Most state entities still have only one recorded observation. Texas, Nebraska, Iowa, Kentucky,
  Maine, and Georgia now have deeper verified histories, but their calculators remain withheld
  pending complete arithmetic and legal-branch contracts.
- Iowa's live court page can intermittently block automation. The system safely retains the last
  exact published history and never substitutes a Federal Reserve estimate.
- Georgia and Mississippi use legislature-authorized code portals classified as
  `official_secondary`; the Federal Reserve benchmark underlying Georgia is official primary data.
- Several government-hosted code reproductions are classified `official_secondary` because the
  online text is not itself the controlling enactment.
- State calculation metadata is not yet complete enough to enable any state calculator.
- The 2026-07-19 follow-up live check verified Cloudflare **Always Use HTTPS** (`301` to HTTPS), the
  documented response-header rule, and HSTS with `max-age=15552000`. `includeSubDomains` and
  `preload` remain off intentionally. These controls live at the Cloudflare edge rather than in the
  static HTML.
- IndexNow currently submits the full sitemap on deploy; a later optimization can submit only changed
  URLs.

Phase 2 continues source by source. More demand-led official histories and stronger controlling-law
citations are next. Calculator pages remain gated until individual states pass the full readiness
contract.
