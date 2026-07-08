# QA_REPORT.md — Phase 7 gauntlet

**Date:** 2026-07-08. All checks run locally on the owner's machine. Result: **all green.**

## 1. Full pipeline from empty cache → validation green ✅
Cleared `data/cache/` and `data/db.sqlite`, then `node run.mjs all`:
- Real, robots-respecting fetches of both sources (IRS, Fed H.15). Completed in **6.3 s**.
- **444 observations** loaded across **8 rate series** from **2 sources**.
- Validation **OK**: provenance-complete, all rates within range, **105 post-judgment↔CMT consistency
  checks passed**, no staleness errors.
- Cache proof of politeness — one `robots.txt` snapshot + one data snapshot cached **per host**:
  ```
  www.federalreserve.gov/<robots>.json   www.federalreserve.gov/<h15>.json
  www.irs.gov/<robots>.json              www.irs.gov/<quarterly-rates>.json
  ```
  (robots.txt was fetched and evaluated before the data fetch on every host.)

## 1b. Unit tests ✅
`node --test` in `pipeline/`: **13 passed, 0 failed** — robots.txt allow/disallow logic (9) and the
derivation/weekly-average invariants (4), including the post-judgment == weekly-CMT invariant.

## 2. Full site build → zero errors ✅
`astro build`: **12 pages built**, no errors.
- Per-page HTML sizes **4.9–13.6 KB** (budget < 200 KB, met with wide margin; CSS inlined, **zero
  external scripts/stylesheets**, no web fonts → fast on slow connections).
- **JSON-LD:** all **25** `application/ld+json` blocks across the 12 pages parse as valid JSON
  (0 invalid). Types present: `Dataset` (site + per-series), `FAQPage`, `BreadcrumbList`.
- Every page has a unique `<title>`, `<meta name="description">`, and `rel="canonical"`.
- **sitemap.xml:** well-formed, 11 URLs (home, about, methodology, + 8 series; 404 excluded).
- **10-page spot check** (home, about, methodology, all 8 series pages, 404): all HTTP 200 with correct
  content and freshness stamps; 404 route serves the custom 404 page.
- `robots.txt` allow-all + sitemap ref; `llms.txt` renders dataset description, cadence, API scheme.

## 3. Static API conforms to openapi.yaml ✅
`node machine/check-api-conformance.mjs`: **8 entity endpoints + index/meta/metrics/entities**;
**452 observations** checked. Every enveloped endpoint has `api_version`/`generated_at`/`data`; every
observation has `metric`/`value`/`unit`/`effective_date`/`source_url`/`retrieved_at`/`confidence`;
`effective_date` matches `YYYY-MM-DD`, `source_url` is a URL, `confidence` ∈ {high,medium,low}.

## 4. MCP smoke test ✅
`node machine/mcp-server/test/smoke.mjs`: launches the server over stdio and asserts **all 5 tools**:
`dataset_info` (8 entities, 1 metric, ≥1 source), `search_entities` (query "treasury" → resolves the
entity by its own token), `get_latest_value` (value + `source_url` + `effective_date`), `get_entity`
(latest + 105 history points), `compare_values` (4 series ranked high→low). **PASSED.**

## 5. Secret / placeholder sweep ✅
- **No secrets** anywhere (grep for api-key/secret/password/token/AKIA/BEGIN → only benign matches: the
  word "token" in generic search code, package names, a "secret" path in a robots test).
- **No `<<OWNER_PROVIDES>>`/`<<OWNER_…>>` placeholder in any functional code path** (`.mjs/.js/.astro`).
  The UA contact was refactored to the `STATUTERATES_CONTACT` env var (neutral default). The only
  remaining placeholder is `<<OWNER_DOMAIN>>` in `machine/openapi.yaml` — a spec/config file, which is
  the sanctioned location for a documented server-URL placeholder.
- `.env.example` present; documents that **no credentials exist** in this project.

## 6. Containment & hygiene ✅
- `git remote -v` → **empty** (no remote, by design).
- **No leftover processes**: the only server started (a throwaway static server for the site spot-check)
  was killed; `lsof`/`ps` confirm nothing on 8791/4321 and no `astro dev/preview` running.
- **Nothing persists outside** `./data-moat-engine`: a few scratch files written to `/tmp` during the
  build were removed at QA time (going forward, the session scratchpad is the correct location).
- DB state: 2 sources, 8 entities, 444 observations, 1 successful run in `run_log`.

## Summary
| Check | Result |
|---|---|
| Pipeline from empty cache + validation | ✅ 444 records, green |
| Unit tests | ✅ 13/13 |
| Site build + SEO/JSON-LD/sitemap | ✅ 12 pages, 25 valid JSON-LD blocks |
| API conformance | ✅ 452 observations |
| MCP smoke (5 tools) | ✅ passed |
| Secret/placeholder sweep | ✅ clean |
| Containment (remote/processes/files) | ✅ clean |
