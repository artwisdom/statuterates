# STATE.md — Live build state

> Resume file. A future session should read this first. It records what is complete, what is next,
> and any open threads, so work can continue with zero prior context.

**Last updated:** 2026-07-08 (Phase 2 complete)
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
- [~] **Reusable engine core built early** (during Phase 1): `pipeline/lib/{http,db,exporter}.mjs`
  (+9 passing robots tests), `machine/build-api.mjs`, `machine/mcp-server/` (5 tools + smoke test),
  `machine/openapi.yaml`, Astro installed + configured. Not yet committed (goes in phase-3/4/5).
- [ ] **Phase 3 — Data pipeline.** Build fetchers (IRS, H.15), normalizer, validation; run to ≥300 records.
- [ ] **Phase 4 — Human skin (static site).** Astro pages generated from the dataset.
- [ ] **Phase 5 — Machine skin.** Wire build-api + MCP + llms.txt to real data; run smoke test.
- [ ] **Phase 6 — Automation blueprints** → `.github/workflows/`
- [ ] **Phase 7 — QA gauntlet** → `docs/QA_REPORT.md`
- [ ] **Phase 8 — Deliverables + final report**

## Next action
Phase 3: write `pipeline/fetchers/irs.mjs` (parse the 12 year-tables) + `pipeline/fetchers/fed-h15.mjs`
(parse 1-yr CMT CSV), a normalizer that derives the post-judgment rate, `pipeline/run.mjs`
(fetch→build→validate→export orchestrator), and a validation suite. Target 300–2,000 records.

## Environment notes for a resuming session
- Local deps installed: `pipeline/node_modules` (better-sqlite3), `machine/mcp-server/node_modules`
  (@modelcontextprotocol/sdk), `site/node_modules` (astro). All gitignored; `npm install` in each to restore.
- Both anchor sources return 200 to our honest-UA pipeline. Do NOT fetch iowacourts.gov/michigan.gov/
  ECB human portal (403/503 to bots — use clean feeds only).

## Open threads
- UK (BoE base + 8pp) and EU (ECB) jurisdictions are designed-in but may be cut to expansion if time
  runs short — US (IRS + H.15 + post-judgment) is the committed core.
