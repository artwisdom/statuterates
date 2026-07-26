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

The current snapshot contains 114 series and 2,193 observations:

- IRS §6621/§6603 categories and related federal tax rates.
- Federal Reserve 1-year Treasury CMT and derived 28 U.S.C. §1961 post-judgment rates.
- Bank of England and E.C.B. policy series plus U.K./E.U. late-payment references.
- Post-judgment references for 49 states plus D.C. (Mississippi has no uniform statutory default).
- Prejudgment references for all 50 states plus D.C.
- A complete official Texas judgment-month schedule from September 1983 through July 2026.
- Nebraska's complete published change-point table from January 1987 through July 2026.
- Iowa's exact monthly Judicial Branch table from March 2001 through July 2026, including the
  confirmed 6.06% selection effective July 9, 2026.
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

All 102 state-law entities currently have `metadata.calculation.status = "reference_only"`.
`pipeline/lib/state-rules.mjs` and the validator require an official primary source plus structured
rate behavior, compounding, day count, validity date, complete branches, and verified accrual rules
before a state rule can become `ready`. Missing metadata is unsafe by default.

The state calculator routes have four independent protections:

1. The prototype renderer has a hard-disabled code-level readiness flag.
2. They require an explicit build environment switch.
3. They require calculator-ready entity metadata.
4. Withheld comparison pages render `noindex` and are excluded from the sitemap.

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

- Human site: Astro 7 static build in `site/dist/` (191 HTML pages in the current baseline).
- Static API: `machine/build-api.mjs` writes `site/public/api/v1/` from committed exports.
- MCP: six read/calculation tools over the same snapshots, with slug validation before file access.
- Search discovery: sitemap, robots, RSS changes feed, `llms.txt`, and `llms-full.txt`.

`site/scripts/check-build.mjs` fails deployment on broken internal targets, unsafe calculator output,
missing `noindex` gates, or prose whitespace damage after framework upgrades.

## 7. Runtime and automation

The repository is standardized on Node 22.12+. Both GitHub workflows install from lockfiles with
`npm ci`. The refresh workflow runs pipeline tests before fetching, and the deploy workflow runs site
data-contract tests plus static-output verification before publishing.
