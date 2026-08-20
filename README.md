# StatuteRates

StatuteRates is a static legal-rate reference site and data pipeline for statutory, judgment, tax,
and late-payment interest rates. The same versioned dataset powers three interfaces:

1. A fast Astro website for people and organic search.
2. A static JSON/CSV API plus an MCP server for software and AI tools.
3. A future licensing layer if the dataset earns enough trust and demand.

Production: [statuterates.com](https://statuterates.com)
Repository: [github.com/artwisdom/statuterates](https://github.com/artwisdom/statuterates)

## Current baseline

- 114 rate series and 4,957 recorded observations across U.S. federal/state, U.K., and E.U. sources.
- 193 static pages plus 114 JSON and 114 CSV entity endpoints. The two inherited unfinished
  calculator placeholders are deliberately absent and return a real 404 until their legal models
  pass the same release gate as Florida.
- Automated weekly refresh for machine-readable federal, U.K., and E.U. sources; live Texas OCCC,
  Alaska Court System, Nebraska Judicial Branch, Iowa Judicial Branch, Florida CFO, Utah State
  Courts, and Federal Reserve prime-rate checks extend or verify state schedules, while Maine's
  annual court-chart rate is independently checked against official H.15 inputs. Federal DGS1
  history is independently reconciled against WGS1YR before publication. A separate five-page IRS
  integrity monitor protects the Form 1040 penalty rules used by the calculator.
- Curated state references carry explicit source tiers and source-check dates.
- The repository includes general fixed-rate judgment/per-diem, full-modern-history federal §1961,
  fail-closed U.K. late-payment plus a clearly labeled E.U. Directive benchmark, IRS
  interest/refund, individual Form 1040 penalty-and-interest, and a narrowly audited Florida §55.03
  judgment calculator.
- Florida is the only released state-specific calculator. Every other state remains withheld until
  its history, legal branches, accrual rule, day count, compounding, and dedicated renderer pass the
  same fail-closed release contract.

The July 2026 safety baseline also makes committed JSON exports the durable history bootstrap for a
fresh CI database. A clean automation run can no longer erase older observations. IRS calculations
also fail closed instead of carrying the last published quarterly interest rate into an unpublished
quarter.

The August 2026 machine-discovery baseline publishes a permanent OpenAPI contract, separates values
currently in force from officially announced future periods, applies the same state-calculator gate
to the website and MCP server, and verifies every human and machine surface at the public edge.

The August 16 AdSense value repair makes advertising opt-in by page. Error, noindex, legal,
navigation, state-hub, and shallow one-observation pages cannot load the AdSense script; build
verification enforces that boundary. Completed calculators, distinct guides, useful indexes, and
rate pages with meaningful history or jurisdiction-specific analysis remain eligible.
This allowlist does not by itself clear an AdSense site review; the public artifact and remaining
indexable inventory must pass the separate content-quality checkpoint documented in the repair gate.

## Local setup

Node 24 or newer is required. Version files are included for common Node version managers.

```bash
./setup.sh
```

That command installs locked dependencies, runs tests, refreshes the remote data sources, builds the
API and site, and verifies the final static output. For an offline/code-only verification, run:

```bash
cd pipeline && npm ci && npm test
cd ../site && npm ci && npm test
cd .. && node --test shared/*.test.mjs
node machine/build-api.mjs
cd site && SITE_URL=https://statuterates.com npm run build && npm run verify-build
cd ../machine/mcp-server && npm ci && npm test
```

## Project layout

| Path | Purpose |
|---|---|
| `pipeline/` | Fetchers, durable-history hydration, normalization, validation, and export |
| `data/exports/` | Versioned, deployable JSON snapshots and automation history bootstrap |
| `site/` | Astro static site, SEO pages, safe calculators, and build verification |
| `shared/` | Dependency-free interest calculation engine and tests |
| `machine/` | Static API generator, OpenAPI contract, and MCP server |
| `docs/` | Architecture, deployment, maintenance, risk, and historical planning records |
| `.github/workflows/` | Weekly data refresh and GitHub Pages deployment automation |

Start with [STATE.md](STATE.md) for the current handoff,
[docs/PHASE_1_AUDIT.md](docs/PHASE_1_AUDIT.md) for the research-backed growth roadmap, and
[docs/PHASE_2_PROGRESS.md](docs/PHASE_2_PROGRESS.md) for the demand-led state-history and
Search Console page-strengthening milestone,
[docs/PHASE_3_PROGRESS.md](docs/PHASE_3_PROGRESS.md) for the indexing, automation, performance, and
Alaska-history release, and
[docs/PHASE_4_PROGRESS.md](docs/PHASE_4_PROGRESS.md) for the Form 1040 penalty calculator and
IRS rule-monitor milestone,
[docs/PHASE_5_PROGRESS.md](docs/PHASE_5_PROGRESS.md) for the federal-history migration and first
audited state calculator, and
[docs/PHASE_7_AI_DISCOVERY.md](docs/PHASE_7_AI_DISCOVERY.md) for the AI-search, public OpenAPI, and
machine-interface safety release, and
[docs/ADSENSE_VALUE_REPAIR.md](docs/ADSENSE_VALUE_REPAIR.md) for the low-value-content diagnosis,
inventory policy, and re-review gate, and
[docs/MAINTENANCE_RUNBOOK.md](docs/MAINTENANCE_RUNBOOK.md) for operational recovery.
