# StatuteRates

StatuteRates is a static legal-rate reference site and data pipeline for statutory, judgment, tax,
and late-payment interest rates. The same versioned dataset powers three interfaces:

1. A fast Astro website for people and organic search.
2. A static JSON/CSV API plus an MCP server for software and AI tools.
3. A future licensing layer if the dataset earns enough trust and demand.

Production: [statuterates.com](https://statuterates.com)
Repository: [github.com/artwisdom/statuterates](https://github.com/artwisdom/statuterates)

## Current baseline

- 114 rate series and 2,361 recorded observations across U.S. federal/state, U.K., and E.U. sources.
- 192 static pages plus 114 JSON and 114 CSV entity endpoints.
- Automated weekly refresh for machine-readable federal, U.K., and E.U. sources; live Texas OCCC,
  Alaska Court System, Nebraska Judicial Branch, Iowa Judicial Branch, Florida CFO, Utah State
  Courts, and Federal Reserve prime-rate checks extend or verify state schedules, while Maine's
  annual court-chart rate is independently checked against official H.15 inputs.
- Curated state references carry explicit source tiers and source-check dates.
- A general fixed-rate judgment/per-diem calculator plus federal §1961, IRS, and U.K./E.U.
  late-payment calculators are available.
- State calculators are intentionally withheld and excluded from the sitemap until complete rate
  histories, branches, accrual rules, day counts, and compounding rules pass validation.

The July 2026 safety baseline also makes committed JSON exports the durable history bootstrap for a
fresh CI database. A clean automation run can no longer erase older observations.

## Local setup

Node 22.12 or newer is required. Version files are included for common Node version managers.

```bash
./setup.sh
```

That command installs locked dependencies, runs tests, refreshes the remote data sources, builds the
API and site, and verifies the final static output. For an offline/code-only verification, run:

```bash
cd pipeline && npm ci && npm test
cd ../site && npm ci && npm test
cd .. && node machine/build-api.mjs
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
[docs/MAINTENANCE_RUNBOOK.md](docs/MAINTENANCE_RUNBOOK.md) for operational recovery.
