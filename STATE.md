# STATE.md — Live build state

> Resume file. A future session should read this first. It records what is complete, what is next,
> and any open threads, so work can continue with zero prior context.

**Last updated:** 2026-07-08 (Phase 8 complete — BUILD DONE, ready for owner review)
**Session mode:** Autonomous, sandboxed to `./data-moat-engine`. Section 0 hard rules in force
(no writes outside this dir; no remotes/deploys/accounts/spend; polite robots-respecting fetches only).

## Runtimes on this machine (verified Phase 0)
- node v20.19.6
- npm 10.8.2
- python3 3.9.6 (available but Node is the chosen stack)
- git 2.50.1
- sqlite3 3.51.0 (system CLI present; pipeline uses `node:sqlite` / better-sqlite3 locally)

## CHOSEN NICHE
**Winner:** Statutory, Judgment & Tax Interest Rates by Jurisdiction (working brand **"StatuteRates"**).
**Runner-up/fallback:** Passport & Travel-Document Fees by Country.
Anchor sources (verified fetchable by our pipeline): IRS §6621 quarterly rates (HTML), Fed H.15
1-yr CMT (CSV). Derived: US federal post-judgment rate (28 U.S.C. §1961). See research/NICHE_DECISION.md.

## Phase status
- [x] **Phase 0 — Workspace setup.** `phase-0` committed.
- [x] **Phase 1 — Research round.** 32 candidates, 14 scanned, 4 deep-audited. `research/RESEARCH_LOG.md`.
- [x] **Phase 2 — Niche selection.** 11 scored; winner 37/39, zero kills. `research/NICHE_DECISION.md`.
- [x] **Phase 3 — Data pipeline.** IRS + H.15 fetchers, normalizer, fail-loud validation; **444 records**.
- [x] **Phase 4 — Human skin.** Astro site, 12 pages, SEO + JSON-LD + freshness, ad placeholders.
- [x] **Phase 5 — Machine skin.** Static JSON API + OpenAPI + MCP server (5 tools, smoke passes) + llms.txt.
- [x] **Phase 6 — Automation blueprints.** `.github/workflows/refresh.yml` + `deploy.yml` (INACTIVE) + runbook.
- [x] **Phase 7 — QA gauntlet.** All green — `docs/QA_REPORT.md`.
- [x] **Phase 8 — Deliverables.** EXECUTION_REPORT, DEPLOYMENT_GUIDE, RISK_REGISTER, MAINTENANCE_RUNBOOK.

## BUILD COMPLETE
All 8 phases done + all Section-8 docs written. QA green. Committed through `phase-8`. No remote, no
deploys, no accounts, no spend, no leftover processes.

## Next action (OWNER)
Push to GitHub + enable Pages — `docs/DEPLOYMENT_GUIDE.md` steps 1–2 (~7 min). That activates free
hosting + the weekly self-updating pipeline. Everything else is optional/growth.

## Environment notes for a resuming session
- Local deps installed: `pipeline/node_modules` (better-sqlite3), `machine/mcp-server/node_modules`
  (@modelcontextprotocol/sdk), `site/node_modules` (astro). All gitignored; `npm install` in each to restore.
- Both anchor sources return 200 to our honest-UA pipeline. Do NOT fetch iowacourts.gov/michigan.gov/
  ECB human portal (403/503 to bots — use clean feeds only).

## Open threads
- UK (BoE base + 8pp) and EU (ECB) jurisdictions are designed-in but may be cut to expansion if time
  runs short — US (IRS + H.15 + post-judgment) is the committed core.
