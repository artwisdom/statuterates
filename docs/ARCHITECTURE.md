# Architecture

## 1. The asset

The durable asset is a normalized, provenance-tracked collection of legally relevant interest-rate
observations. The website, API, and MCP server are separate interfaces over that same dataset.

## 2. Storage and durability

`pipeline/lib/db.mjs` defines four SQLite tables:

- `sources`: publisher, source URL, reuse notes, robots status, and latest real source-check time.
- `entities`: one row per rate series and its structured metadata.
- `observations`: values keyed by entity, metric, effective date, and source, with full provenance.
- `run_log`: pipeline run status and diagnostics.

`data/db.sqlite` is an ignored runtime database. The committed snapshots in `data/exports/` are the
durable automation history. Before any refresh, `pipeline/lib/seed-exports.mjs` hydrates a fresh
SQLite database from those exports. This makes CI idempotent and prevents a clean runner from
silently replacing multi-period history with only the current fetch.

An unchanged observation keeps its original retrieval time. A changed observation records the new
retrieval time. Source timestamps cannot move backward.

## 3. Coverage

The 2026-08-30 release baseline contains 114 series and 5,508 observations. The generated
`data/exports/meta.json` is authoritative for the live count after automatic refreshes:

- IRS §6621/§6603 categories and related federal tax rates.
- Federal Reserve 1-year Treasury CMT and derived 28 U.S.C. §1961 post-judgment rates. Treasury
  observations retain the H.15 source-week Monday; each derived §1961 observation is keyed to the
  following Monday when the rate applies to supported judgments.
- Bank of England and E.C.B. policy series plus U.K./E.U. late-payment references.
- Post-judgment references for 49 states plus D.C. (Mississippi has no uniform statutory default).
- Prejudgment references for all 50 states plus D.C.
- A complete official Texas judgment-month schedule from September 1983 through August 2026.
- Nebraska's complete published change-point table from January 1987 through July 2026.
- Iowa's exact monthly Judicial Branch table from March 2001 through August 2026, including the
  confirmed 6.06% selection effective August 10, 2026.
- Kentucky's official general-rate change points from the 12% era to the 6% amendment effective
  June 29, 2017.
- Maine's complete official prejudgment and post-judgment annual charts from July 2003 through 2026,
  including the corrected 2025 values and an independent H.15 formula check.
- Georgia's 59 exact prime-rate periods from July 2003 through December 2025, independently verified
  against the Federal Reserve's PRIME series.
- Mississippi prejudgment interest represented as a nonnumeric contract-or-court-set rule instead
  of a misleading universal percentage.

Automated feeds accumulate real history. Texas OCCC, Nebraska Judicial Branch, Iowa Judicial Branch,
and Federal Reserve PRIME monitors verify or extend state schedules, and Maine can safely disclose a
future H.15-derived provisional period pending its next court chart. Most other state-law series still
contain one curated observation, so they are reference pages—not complete historical datasets.

## 4. Source and calculator safety

Every observation stores a source URL, effective date, retrieval/source-check time, confidence, and
method. State sources are classified as `official_primary`, `official_secondary`,
`third_party_secondary`, or `unclassified`.

Of the 102 state-law entities, 101 currently have
`metadata.calculation.status = "reference_only"`. Florida post-judgment is the sole `ready` state
entity and the sole state-specific calculator release. `pipeline/lib/state-rules.mjs` and the
validator require an official primary source plus structured rate behavior, compounding, day count,
validity date, complete branches, and verified accrual rules before another state rule can become
`ready`. Missing metadata is unsafe by default.

State-specific calculator routes have four independent protections:

1. The code-controlled release registry must name a dedicated renderer and route.
2. The matching entity must carry calculator-ready metadata.
3. The entity renderer ID must exactly match the registry entry.
4. Build and shared-contract checks reject an unapproved state calculator route.

## 5. Pipeline

```text
committed exports → hydrate SQLite → fetch allowed feeds → normalize/load
                  → validate (fail closed) → export versioned JSON
```

Important modules:

- `pipeline/run.mjs`: `fetch`, `build`, `validate`, `export`, and `all` orchestration.
- `pipeline/lib/http.mjs`: honest user agent, robots checks, throttling, retry, and cache.
- `pipeline/lib/seed-exports.mjs`: durable-history hydration.
- `pipeline/lib/validate.mjs`: schema, range, derivation, freshness, and calculator-rule checks.
- `pipeline/fetchers/us-states.mjs`: curated state values and source-check provenance.
- `pipeline/fetchers/texas-occc.mjs`: fail-closed current-month OCCC monitor.
- `pipeline/fetchers/texas-occc-history.mjs`: audited official Texas monthly history.
- `pipeline/fetchers/nebraska-judicial.mjs`: fail-closed current Nebraska court-rate monitor.
- `pipeline/fetchers/nebraska-judgment-history.mjs`: audited official Nebraska history.
- `pipeline/fetchers/iowa-judicial.mjs`: safe Iowa court-table monitor with graceful WAF fallback.
- `pipeline/fetchers/iowa-judgment-history.mjs`: audited monthly Iowa court history.
- `pipeline/fetchers/kentucky-interest-history.mjs`: audited statutory Kentucky change points.
- `pipeline/fetchers/maine-interest-history.mjs`: audited court charts, 2025 correction anchors, and
  fail-closed annual H.15 reproduction.
- `pipeline/fetchers/georgia-interest-history.mjs`: audited Georgia prime-plus-three history.
- `pipeline/fetchers/georgia-prime.mjs`: exact Federal Reserve PRIME change-point monitor.

## 6. Outputs

- Human site: Astro 7 static build in `site/dist/` (195 HTML pages, including the real 404 page, and
  194 indexable sitemap URLs in the current local baseline).
- Static API: `machine/build-api.mjs` writes `site/public/api/v1/` from committed exports.
- MCP: six read/calculation tools over the same snapshots, with slug validation before file access.
- Search discovery: sitemap, robots, RSS changes feed, `llms.txt`, and `llms-full.txt`.

`site/scripts/check-build.mjs` fails deployment on broken internal targets, unsafe calculator output,
missing `noindex` gates, or prose whitespace damage after framework upgrades.

## 7. Runtime and automation

The repository is standardized on Node 24+. Both GitHub workflows install from lockfiles with
`npm ci`. The refresh workflow runs each Wednesday at 12:00 UTC, tests before fetching, and tests the
newly generated snapshot again in a read-only job. An immutable, data-only artifact then crosses to
a fresh commit job that installs no dependencies, executes no fetched content, validates artifact
shape/scope, and has narrowly job-scoped repository-write permission. Its pinned, non-persisting
checkout uses that permission internally, while `GH_TOKEN` is exposed to a shell only in the final
commit/push step. Issue access is isolated in separate notification jobs. The deploy workflow runs
site data-contract tests plus static-output verification before publishing.
