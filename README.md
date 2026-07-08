# Data Moat Engine

A zero-capital, solo-operable **data business foundation**: one canonical, constantly-changing,
provenance-tracked dataset in a narrow global niche, monetized through three interfaces ("skins")
over a single data asset:

1. **Human skin** — a fast static reference website (display-ad monetization later).
2. **Machine skin** — the same data as a static JSON API + an MCP server for AI agents, plus `llms.txt`.
3. **Licensing skin** — bulk licensing if the dataset becomes canonical (documented, not built).

The interface code is disposable. The asset is the **normalized, provenance-tracked dataset and its
automated refresh pipeline**.

## Status

**Niche:** StatuteRates — statutory, judgment & tax interest rates across the **US (federal + states),
UK and EU**, plus **statutory-interest calculators** (federal §1961, IRS, state judgment, UK/EU late
payment) and a free JSON/CSV API + MCP server for AI agents.
**Dataset:** ~650 provenance-tracked records · 17 rate series · 8 official sources · 28 pages.
Code-complete and QA-green (31 unit tests, browser-verified calculators, MCP smoke incl.
`calculate_interest`, API conformance). **Nothing is deployed yet** — going live is a ~15-minute owner
action (push + Pages + Search Console).

See [`STATE.md`](STATE.md) for live build state, [`EXECUTION_REPORT.md`](EXECUTION_REPORT.md) for the
full report, [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md) to go live, and
[`research/NICHE_DECISION.md`](research/NICHE_DECISION.md) for why this niche.

## Quickstart
```bash
./setup.sh          # install deps, run pipeline, build API + site, verify MCP (one command)
```
Or step by step — see the "Local dev quickstart" in [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md).

## Layout

| Path | Purpose |
|---|---|
| `research/` | Research log + niche decision |
| `pipeline/` | Node.js fetchers, politeness layer, normalizer, validation |
| `data/` | SQLite source of truth (`db.sqlite`) + versioned JSON exports |
| `site/` | Astro static site (human skin) |
| `machine/` | Static JSON API build + MCP server + `llms.txt` (machine skin) |
| `docs/` | Architecture, QA report, deployment guide, runbook, risk register |
| `.github/workflows/` | INACTIVE automation blueprints (activate only on owner push) |

## Local-only

This repository has **no git remote**, is **not deployed anywhere**, and requires **no accounts or
spend** to build. Every step that would need a credential, deployment, or account is a documented
manual step in `docs/DEPLOYMENT_GUIDE.md`, marked with an `<<OWNER_PROVIDES>>` placeholder.
