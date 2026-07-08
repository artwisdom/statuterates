# NICHE_DECISION.md — Phase 2 scoring & selection

**Date:** 2026-07-08. Rubric per the brief (max 39). **Bar: ≥27 with zero kill flags.** Kill conditions:
Volatility ≤1 · Structured ≤2 · AI-failure ≤2 · Incumbent-gap ≤1 · Source-viability ≤2 · Automatable = 0.

## Scoring table (11 serious candidates scored; kills in **bold**)

| # | Candidate | Vol /5 | Struct /5 | Global /5 | AI-fail /5 | Incumb-gap /5 | Source /5 | Machine /3 | Money /3 | Auto /3 | **Total /39** | Kills |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|---|
| 1 | **Statutory/judgment/tax interest rates** ⭐ | 5 | 5 | 4 | 5 | 4 | 5 | 3 | 3 | 3 | **37** | none |
| 2 | **Passport & travel-document fees** (runner-up) | 3 | 5 | 5 | 5 | 5 | 5 | 3 | 3 | 3 | **37** | none |
| 3 | Regulated residential electricity tariffs | 5 | 5 | 5 | 4 | 4 | 4 | 3 | 3 | 2 | **35** | none |
| 4 | Statutory fee schedules (registry/IP/court) | 4 | 5 | 5 | 5 | 2 | 3 | 3 | 3 | **1** | 31 | none (near) |
| 5 | Postal/parcel rate cards | 4 | 5 | 4 | 3 | 2 | 4 | 3 | 2 | 2 | 29 | none |
| 6 | Central-bank reserve-requirement ratios | 4 | 5 | 3 | 4 | 2 | 3 | 2 | 1 | 1 | 25 | — |
| 7 | Retail motor-fuel & LPG prices | 5 | 5 | 5 | 4 | **1** | 4 | 2 | 2 | 2 | 30 | **incumbent-gap** |
| 8 | Statutory minimum wages | 2 | 5 | 5 | 3 | **1** | 4 | 2 | 3 | 2 | 27 | **incumbent-gap** |
| 9 | Central-bank policy interest rates | 4 | 5 | 4 | **2** | **1** | 5 | 2 | 2 | 3 | 28 | **AI-fail + incumbent-gap** |
| 10 | Public/statutory holidays | **1** | 5 | 5 | **1** | **1** | 5 | 2 | 2 | 3 | 25 | **vol + AI-fail + incumbent-gap** |
| 11 | Country statutory withholding-tax rates | 3 | 5 | 4 | 5 | 2 | **2** | 2 | 2 | 1 | 26 | **source-viability** |

Three candidates (#1, #2, #3) clear **≥27 with zero kills**. #4 is a near-miss (automatable = 1: the
open slice is PDF-heavy). #7–#11 are killed on incumbent-gap and/or AI-failure exactly as the thesis
predicts for "obvious" niches with strong incumbents.

## Kill-reason notes for the rejects
- **#7 Fuel/LPG (incumbent-gap 1):** GlobalPetrolPrices.com is a fast, structured, monetized,
  paid-API incumbent for this exact dataset — the thesis's explicit kill; World Bank duplicates it free.
- **#8 Minimum wages (incumbent-gap 1):** WageIndicator.org (GSMArena-class, monthly, sub-national) +
  Symmetry API + DA-heavy payroll SERP. Volatility only ~annual.
- **#9 Central-bank policy rates (AI-fail 2 + incumbent-gap 1):** BIS CBPOL is a free machine-readable
  canonical feed → zero moat; TradingEconomics/Investing.com answer it freshly, so LLMs-with-a-tool are
  not stale. Data is *exhaustively* answered, not badly.
- **#10 Public holidays (vol 1 + AI-fail 1 + incumbent-gap 1):** rule-based and computable years ahead;
  py-holidays/Nager.Date/timeanddate are canonical free incumbents. Fails the "volatile" premise itself.
- **#11 Withholding-tax rates (source-viability 2):** primary values are trapped in annual, unstructured
  Big-4 PDFs / OECD tables — not reliably refresh-automatable without heavy per-country PDF work.

## Top-3 deep verification (Phase 1 §3)
All three finalists had ≥2 official, robots-permitting, parseable sources verified with real fetches and
a 100%-or-near AI-failure test. For the **winner**, I additionally re-verified the two anchor sources
*through the project's own honest-UA pipeline* (not just the research tool): IRS quarterly-rates HTML
returned 200 with 12 parseable year-tables, and Fed H.15 returned 200 CSV with a clean 1-year CMT column
whose values match the audit. **This is the decisive practical fact: the winner is buildable tonight into
a complete, automatable, high-provenance pipeline from clean official machine-readable feeds.**

## The decision: a genuine 37–37 tie, broken deliberately

Candidates **#1 (statutory interest rates)** and **#2 (passport fees)** tie at **37/39** with zero kills.
They trade blows: passport fees win on incumbent-gap (5 vs 4), volatility notwithstanding; interest
rates win on volatility (5 vs 3, the sharpest "LLMs can't keep up" moat in the whole study). The tie was
broken on five factors:

| Tie-break factor | Winner |
|---|---|
| Verified buildable *tonight* into a ≥300-record automatable pipeline | **Interest rates** (both anchor feeds fetch+parse; passport needs ~190 heterogeneous adapters — "coverage is the work") |
| Sharpest volatility / AI-staleness moat (weekly federal post-judgment; 9/9 fail) | **Interest rates** |
| Fewer, more-stable adapters → lower hands-off maintenance (<1 hr/wk) | **Interest rates** (2–3 clean feeds vs ~20+ per-country pages) |
| Proven willingness-to-pay (paid incumbents already charging) | **Interest rates** |
| All-published values (zero derivation/correctness risk) | *Passport fees* |
| Cleanest incumbent gap; best consumer AdSense monetization | *Passport fees* |

**Winner: #1 — Statutory, Judgment & Tax Interest Rates by Jurisdiction.** Working brand **"StatuteRates"**
(domain to be chosen/purchased by the owner — see DEPLOYMENT_GUIDE). It is the sharpest expression of the
thesis (live/volatile, numeric, global, badly-answered-by-LLMs, no canonical incumbent) *and* the one I
can honestly build end-to-end tonight against clean, official, robots-permitting machine feeds.

**Runner-up / documented fallback: #2 — Passport & Travel-Document Fees by Country.** Marginally the
better *consumer-ad* business (cleaner incumbent gap, all-published values), and the correct pivot target
if the winner underperforms on organic traffic (see RISK_REGISTER pivot thresholds). It was not chosen
only because its value is gated behind coverage work that cannot be stood up honestly in one session.

## What "the asset" is, concretely
A normalized, provenance-tracked, **as-of-date** database of legally-mandated interest rates:
- **IRS §6621** quarterly rates (overpayment/underpayment, corporate/non-corporate, large-corp, GATT, 6603) — *published*.
- **US federal post-judgment interest** (28 U.S.C. §1961 = weekly-average 1-yr CMT) — *derived from Fed H.15, formula-cited*.
- **Fed H.15** 1-year Constant Maturity Treasury yield — *published Fed feed* (the driver series).
- Expansion (documented, not all built tonight): UK statutory late-payment (BoE base + 8pp), EU Late
  Payment Directive reference + per-country margins (ECB), US state judgment/legal rates.

Every value carries `effective_date`, `source_url`, `retrieved_at`, `confidence`, and (for derived
values) the exact statutory formula + a "verify against the controlling statute; not legal advice"
disclaimer. The moat is the **assembled, historized, cross-jurisdiction, API+MCP canonical DB** that no
incumbent, calculator, or LLM currently provides.
