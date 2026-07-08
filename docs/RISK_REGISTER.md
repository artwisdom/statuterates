# RISK_REGISTER.md

Honest risks, base rates, and pre-committed pivot thresholds. The point of writing thresholds **now** is
to decide with data later instead of emotion.

## Base rates (read this first)
- **Most projects of this class earn ~$0.** The realistic base case for a maintained, useful reference
  site is **$500–$3,000/month at months 12–18**, and only if it earns organic traffic. Many never do.
- **Machine-side revenue (API/MCP/pay-per-crawl) is unproven for solo builders today.** Treat it as free
  optionality, not the plan. Do not model revenue from it.
- **Licensing** (bulk-selling the dataset to an AI company) is a lottery ticket — documented, not built.

## Risk table

| # | Risk | Likelihood | Impact | Mitigation | Leading indicator |
|---|---|---|---|---|---|
| R1 | **No organic traffic** (the default outcome) | High | Fatal to revenue | Ship focused per-series pages, JSON-LD/FAQ rich results, honest E-E-A-T, exact-match intent ("post judgment interest rate [state]"); expand coverage to widen the keyword surface | Sessions by month 3/6 (see pivot) |
| R2 | **Source layout change breaks a fetcher** | Medium (per year, per source) | Data goes stale | Fail-loud validation blocks bad publishes; per-source runbook playbooks; only 2 fetchers today (small surface) | `refresh-data` run turns red |
| R3 | **Source blocks our bot** (403/WAF) | Low for chosen sources; higher for expansion (state/court hosts) | Lose that source | We only use clean official feeds (IRS, Fed H.15) and never spoof UAs; expansion prefers CMT-derived formulas over bot-hostile hosts | Fetch 403 in run log |
| R4 | **Derived value is subtly wrong** (post-judgment convention) | Low | Trust/legal-adjacent harm | Anchor site on published values; derived rate carries formula + "verify against your court; not advice" + medium confidence; unit-tested invariant | User correction / court-table mismatch |
| R5 | **A well-funded incumbent ships a free, structured, historized, API'd version** | Low–Medium | Erodes the moat | Our moat is coverage + freshness + as-of-date history + API/MCP; keep expanding jurisdictions faster than a generalist will bother to | A competitor appears in SERP with an API |
| R6 | **Niche too B2B/thin for ad volume** (known weakness) | Medium | Caps ad ceiling | High commercial intent offsets low volume; if traffic is thin but present, machine/licensing upside remains; pivot option below | Sessions high-value but low-count |
| R7 | **Platform dependency** (GitHub Pages / Actions / Cloudflare) | Low | Downtime / policy change | All free-tier; site is static and portable (any CDN serves `dist/`); Actions usage ~22 min/month vs 2,000 free; deploy is one `dist/` upload | Platform email / quota warning |
| R8 | **Ad-network rejection** (thin content / traffic minimums) | Medium early | Delays monetization | Start with Ezoic/AdSense (low bar); add substantive methodology/about content (done); reapply at scale to Mediavine/Raptive | Application rejected |
| R9 | **Legal/advice perception** (interest rates near legal money) | Low | Complaint risk | Pure factual reference values; disclaimers on every page + derived note; no advice, no personal data | Complaint / takedown |

## Pivot thresholds (decide with data, not features)
- **< 2,000 monthly sessions by month 3** → the pages aren't getting indexed/ranked. First expand
  coverage (more series/jurisdictions = more keyword entries) and shore up internal linking. Do **not**
  add features to a site nobody visits.
- **< 10,000 monthly sessions by month 6** → the *niche* is the problem, not the build. **Change niche,
  not features.** The runner-up **Passport & Travel-Document Fees** (research/NICHE_DECISION.md) is the
  pre-selected pivot: same engine, cleaner incumbent gap, consumer-mass tier-1 ad demand; the pipeline,
  schema, site, API, and MCP server are all reusable — only the fetchers change.
- **Any paying API/agent caller, or repeated agent traffic in logs** → invest in the machine skin:
  add per-call metering (Stripe usage-based or x402) and enable Cloudflare pay-per-crawl. Let real
  demand, not hope, trigger this.
- **Dataset becomes cited/canonical** (linked by other sites, pulled by models) → explore licensing
  conversations. Document inbound interest; don't chase it cold.

## What would make me kill the project
Sustained near-zero traffic across **two** different niches (winner + the passport pivot) by month ~9,
despite good coverage and clean SEO, means the "fast static reference + ads" thesis isn't working for
this operator's execution — stop, and reallocate the (reusable) engine to a different data class.
