# ARCHITECTURE.md — data model, pipeline, and the three skins

## 1. The asset
A normalized, provenance-tracked, **as-of-date** database of legally-mandated ("statutory") interest
rates. The interface code (site, API, MCP server) is disposable; the asset is the dataset + its
automated refresh pipeline.

## 2. Data model (SQLite is the single source of truth: `data/db.sqlite`)
The schema is intentionally generic — "observations of a metric's value for an entity, over time, each
row carrying full provenance" — so the same engine can extend to other rate/fee/price niches. Tables
(`pipeline/lib/db.mjs`):

- **`sources`** — every data source with `publisher`, `home_url`, `license`, `robots_status`, `retrieved_at`.
- **`entities`** — here, one row per **rate series** (e.g. `irs-underpayment`, `us-federal-post-judgment`).
  `slug` is the URL and API key. `jurisdiction` is ISO-3166 (`US`, `GB`, `EU`). This "entity = series"
  choice gives one focused, indexable page per rate (good SEO) instead of one giant page per country.
- **`observations`** — one row per `(entity, metric, effective_date)` with `value_numeric`, `unit`,
  `source_id`, `source_url`, `retrieved_at`, `confidence`, `method`, `notes`. History is preserved:
  a new `effective_date` is a new row, never an overwrite. Unique on
  `(entity_id, metric, effective_date, source_id)` → idempotent re-runs.
- **`run_log`** — audit of each pipeline run (freshness stamp + maintenance).

All rate observations use `metric = 'annual_rate'`, `unit = 'percent_per_annum'`.

## 3. Entities in the seed (rate series)

| slug | series | jurisdiction | source | confidence |
|---|---|---|---|---|
| `irs-underpayment` | IRS underpayment rate (§6621) | US | IRS quarterly page | high (published) |
| `irs-overpayment-noncorporate` | IRS non-corporate overpayment | US | IRS quarterly page | high |
| `irs-overpayment-corporate` | IRS corporate overpayment | US | IRS quarterly page | high |
| `irs-large-corporate-underpayment` | IRS large-corp underpayment (LCU) | US | IRS quarterly page | high |
| `irs-gatt` | GATT (corp overpayment > $10k) | US | IRS quarterly page | high |
| `irs-6603-federal-short-term` | IRC §6603 deposit / federal short-term | US | IRS quarterly page | high |
| `treasury-1-year-cmt` | 1-yr Treasury constant-maturity yield (weekly avg) | US | Fed H.15 CSV | high (published) |
| `us-federal-post-judgment` | Federal post-judgment rate (28 U.S.C. §1961) | US | derived from H.15 | **medium (derived)** |
| `boe-bank-rate` | Bank of England Bank Rate | GB | BoE IADB CSV | high (published) |
| `uk-late-payment-commercial` | UK late-payment interest (LPA 1998, semi-annual) | GB | derived from BoE | **medium (derived)** |
| `ecb-main-refinancing-rate` | ECB main refinancing rate | EU | ECB Data Portal CSV | high (published) |
| `eu-late-payment-reference` | EU Late Payment Directive reference (semi-annual) | EU | derived from ECB | **medium (derived)** |

**12 series across 3 jurisdictions (US/UK/EU), 4 official sources, 536 records.** The UK/EU statutory
series are correctly modeled as SEMI-ANNUAL (fixed on 31 Dec/30 Jun for the UK; 1 Jan/1 Jul for the EU),
not "live base + 8" — see `pipeline/lib/rates-intl.mjs` and its tests.

Designed-in further expansion (documented, not yet built): per-EU-country late-payment margins, US state
judgment/legal rates.

## 4. Provenance & honesty rules (baked into the pipeline)
- Every observation stores the exact `source_url` and `retrieved_at`.
- **Published** values (IRS categories, H.15 CMT) are `confidence = high`.
- The **derived** post-judgment rate is `confidence = medium`, `method = derived_weekly_avg_h15_1yr_cmt`,
  and carries a `notes` string with the statutory formula (28 U.S.C. §1961) and a "confirm the exact
  applicable week against your district court's table; not legal advice" caveat. No computed value is
  ever presented as authoritative without its formula and source.

## 5. Pipeline (`pipeline/`)
```
run.mjs  <cmd>         orchestrator: fetch | build | validate | export | all
  fetchers/irs.mjs     fetch IRS quarterly page -> raw quarter×category rows
  fetchers/fed-h15.mjs fetch Fed H.15 CSV -> daily 1-yr CMT observations
  lib/http.mjs         politeness layer (robots gate, 3s/host, cache, honest UA)
  lib/db.mjs           schema + idempotent upserts
  lib/normalize.mjs    raw -> schema records; derive weekly CMT + post-judgment
  lib/validate.mjs     type/range/staleness/cross-source/coverage checks (FAIL LOUD)
  lib/exporter.mjs     SQLite -> versioned JSON snapshots (data/exports/)
```
Flow: **fetch → normalize+load (SQLite) → validate (must be green) → export JSON**. The pipeline
FAILS LOUDLY on bad data and never publishes a failing dataset.

## 6. The three skins over this one asset
- **Human skin** (`site/`, Astro static): one page per rate series (current value + freshness stamp +
  history table + source), plus index/browse and an honest "How this data is collected" page. Built
  from `data/exports/` at `astro build` time.
- **Machine skin** (`machine/`): `build-api.mjs` emits `site/public/api/v1/*.json` (static API, no
  server); an MCP server (`machine/mcp-server/`) exposes `dataset_info`, `search_entities`,
  `get_entity`, `get_latest_value`, `compare_values` over the same exports; `llms.txt` at the site root.
- **Licensing skin**: documented only (EXECUTION_REPORT / RISK_REGISTER) — a lottery ticket, not built.

## 7. Refresh cadence
IRS updates quarterly (Feb/May/Aug/Nov IRBs); H.15 updates every business day; the derived
post-judgment rate updates weekly. The GitHub Actions blueprint (`.github/workflows/refresh.yml`,
INACTIVE) runs weekly, well inside cadence, and commits data only if validation passes.
