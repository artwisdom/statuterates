# STATE.md — Live build state

> Resume file. A future session should read this first. It records what is complete, what is next,
> and any open threads, so work can continue with zero prior context.

**Last updated:** 2026-07-08 (Phase 0)
**Session mode:** Autonomous, sandboxed to `./data-moat-engine`. Section 0 hard rules in force
(no writes outside this dir; no remotes/deploys/accounts/spend; polite robots-respecting fetches only).

## Runtimes on this machine (verified Phase 0)
- node v20.19.6
- npm 10.8.2
- python3 3.9.6 (available but Node is the chosen stack)
- git 2.50.1
- sqlite3 3.51.0 (system CLI present; pipeline uses `node:sqlite` / better-sqlite3 locally)

## Phase status
- [x] **Phase 0 — Workspace setup.** Scaffold + `.gitignore` + git init + this file. `phase-0` committed.
- [ ] **Phase 1 — Independent research round** → `research/RESEARCH_LOG.md`
- [ ] **Phase 2 — Niche selection** → `research/NICHE_DECISION.md`
- [ ] **Phase 3 — Data pipeline** → `pipeline/`, `data/db.sqlite`, exports
- [ ] **Phase 4 — Human skin (static site)** → `site/`
- [ ] **Phase 5 — Machine skin (JSON API + MCP + llms.txt)** → `machine/`, `site/public/api`
- [ ] **Phase 6 — Automation blueprints** → `.github/workflows/`
- [ ] **Phase 7 — QA gauntlet** → `docs/QA_REPORT.md`
- [ ] **Phase 8 — Deliverables + final report**

## Next action
Run Phase 1 research: generate ≥20 candidate niches, incumbent-scan the shortlist, audit sources,
run the AI-failure test. Write findings to `research/RESEARCH_LOG.md` with URLs + access dates.

## Open threads
- None yet.
