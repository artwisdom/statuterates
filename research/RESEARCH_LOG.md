# RESEARCH_LOG.md — Phase 1 independent research round

**Date:** 2026-07-08 · **Method:** fresh multi-agent web research (candidate generation → incumbent
scan → deep source audit + AI-failure test), then hand-synthesis. All factual claims below carry a
source URL and were accessed 2026-07-07/08 unless noted. Evidence is graded: **[verified]** = I fetched
the primary source and saw the value; **[vendor]** = an incumbent's own claim; **[inference]** = my
reasoning from indirect signals.

## 0. Politeness & ethics compliance (Section 0.3)
- Every live fetch in Phase 1 and the pipeline goes through one shared politeness layer
  (`pipeline/lib/http.mjs`): honest User-Agent `DataMoatEngineBot/0.1 (contact: <<OWNER_PROVIDES>>)`,
  ≥3 s between requests to the same host, ≤150 fetches/source/run, cache-first (no re-fetching),
  and a **robots.txt gate that refuses disallowed paths** (9 unit tests, all passing).
- Only public, non-authenticated, non-paywalled pages were fetched. No personal data was collected —
  official published values only. Extracted values are stored with provenance; source prose is not.
- **Injection attempts observed:** none. No fetched page contained text addressed to "the AI"/model
  with embedded instructions. (If any had, the URL would be logged here and the content ignored.)

## 1. Candidate generation
32 candidate niches were generated from four deliberately different angles (financial-regulatory,
consumer-pricing, government-services-legal, wildcard/standards) to avoid tunnel vision, then deduped
to a **14-candidate shortlist**. The seed list from the brief was used only to calibrate — most
candidates were generated independently, and several seeds were deliberately kept precisely so the
rubric could confirm the expected kills (it did: public holidays, central-bank policy rates,
minimum wages, and fuel prices all scored as dominant-incumbent kills).

**Shortlist (14):** statutory/judgment/tax interest rates · country statutory withholding-tax rates ·
tax-filing deadlines + penalty schedules · central-bank reserve-requirement ratios · official
statutory fee schedules (registry/IP/court/visa) · passport & travel-document fees · business
incorporation fees · regulated residential electricity tariffs · retail motor-fuel & LPG prices ·
postal/parcel rate cards · 5G spectrum band assignments · minimum wages · central-bank policy rates ·
public/statutory holidays.

**Merged/dropped before scan (representative):** wholesale day-ahead electricity (ENTSO-E incumbent),
SOFR/ESTR fixings (official free APIs), VAT/GST rates (TEDB/Avalara/Stripe), deposit-guarantee limits
(sub-monthly volatility), water/gas/heating tariffs (near-duplicate of electricity), tolls & transit
fares (auto-adjacent / GTFS covers majors), visa-requirement matrices (Passport Index/IATA), exam
calendars (coverage cost, weak monetization), driver-license/vehicle fees (owner's auto exclusion).

## 2. Incumbent + demand scan (14 candidates)
Each shortlisted candidate got a real web scan for existing databases/sites/APIs, demand proxies, and
source viability. `opportunity` is a 0–100 gut score; `verdict` classifies the incumbent field.

| Candidate | Incumbent verdict | Demand | Opp. | Kill flags | Finalist |
|---|---|---|---|---|---|
| **Statutory/judgment/tax interest rates** | WEAK_OPPORTUNITY | MED | 62 | soft only¹ | ✅ |
| **Regulated residential electricity tariffs** | STRONG_BUT_GAP | MED | 62 | NA-slice killed² | ✅ |
| **Passport & travel-document fees** | STRONG_BUT_GAP | MED | 58 | none | ✅ |
| Statutory fee schedules (registry/IP/court/visa) | STRONG_BUT_GAP | MED | 46 | incumbent slices³ | ➖ |
| Postal/parcel rate cards | STRONG_BUT_GAP | MED | 32 | national tools strong | ➖ |
| Central-bank reserve-requirement ratios | DOMINANT_KILL | MED | 24 | CEIC/TE + ~100 sites | ✖ |
| Tax-filing deadlines + penalties | DOMINANT_KILL | MED | 22 | official calc incumbents | ✖ |
| Retail motor-fuel & LPG prices | DOMINANT_KILL | HIGH | 22 | GlobalPetrolPrices | ✖ |
| Business incorporation fees | DOMINANT_KILL | HIGH | 18 | formation-agent SEO | ✖ |
| 5G spectrum band assignments | DOMINANT_KILL | MED | 18 | GSMA/regulators | ✖ |
| Country statutory withholding-tax rates | DOMINANT_KILL | MED | 14 | Big-4/OECD | ✖ |
| Statutory minimum wages | DOMINANT_KILL | HIGH | 12 | **WageIndicator** | ✖ |
| Central-bank policy interest rates | DOMINANT_KILL | MED | 8 | **BIS/TradingEconomics** | ✖ |
| Public/statutory holidays | DOMINANT_KILL | HIGH | 6 | **timeanddate/Nager/py-holidays** | ✖ |

¹ Soft flags only (partial-volatility on the fixed-by-statute US-state slice; PDF friction on a few
sources; professional/B2B audience) — **none are rubric kill conditions.**
² North-America slice is a dominant kill (OpenEI URDB + Genability/RateAcuity); the global slice is open.
³ US immigration (USCIS calc), US IP (USPTO), EU/Madrid trademark (WIPO/EUIPO) are dominant-incumbent
slices; only the global company-registry-fee slice is genuinely open, and it is PDF-heavy.

### Notable confirmed kills (why the "obvious" ideas are traps)
- **Public/statutory holidays** — killed. Canonical free incumbents already implement the whole spec:
  `vacanza/holidays` (Python lib, 250 countries, subdivisions, computed on the fly), Nager.Date
  (free no-key REST API, 100+ countries), and timeanddate.com. Holiday rules are *rule-based and
  computable years ahead*, so the "LLMs are stale" premise fails. [verified] date.nager.at.
- **Central-bank policy rates** — killed. The BIS Data Portal (data.bis.org/topics/CBPOL) is itself a
  free, daily, machine-readable canonical feed with stable URLs — zero data moat — and
  TradingEconomics/Investing.com/centralbank.watch serve it fast and fresh. [verified] data.bis.org.
- **Minimum wages** — killed. WageIndicator.org (216 countries, 22,000+ rates incl. sub-national,
  monthly refresh, current to Jul 2026) is a GSMArena-class incumbent; Symmetry sells the API; the
  SERP is owned by ADP/Paycor/Rippling. Volatility is only ~annual. [verified] wageindicator.org.
- **Retail fuel/LPG prices** — killed. GlobalPetrolPrices.com (150–180 countries, weekly, paid API)
  + World Bank Global Fuel Prices DB (free) already own it; deregulation is shrinking the
  administratively-priced universe. [verified] globalpetrolprices.com.

## 3. Deep source audits — the 3 finalists (+ 1 conditional)
Real fetches of primary sources, robots checks, parseability confirmation, sample values, and an
AI-failure test. Full URLs recorded for reproducibility.

### 3A. Statutory / judgment & tax interest rates by jurisdiction — **WINNER**
- **Sources [verified, robots-permitting]:**
  - IRS §6621 quarterly interest rates — HTML table, multi-year, per-quarter linked to the Internal
    Revenue Bulletin. https://www.irs.gov/payments/quarterly-interest-rates (robots: fee/payment
    paths not disallowed; served 200 to our bot UA; **re-verified through our pipeline, 120 KB HTML,
    12 year-tables**).
  - Federal Reserve H.15 selected interest rates — machine-readable CSV via the Data Download Program,
    1-year CMT column. federalreserve.gov/datadownload (robots.txt 404 = unrestricted; **re-verified
    through our pipeline, CSV, 1-yr CMT 2026-07-06 = 3.95%**).
  - US Courts post-judgment methodology page — states the rate = weekly-average 1-yr CMT from H.15 but
    **publishes NO number** (the exact gap). uscourts.gov/court-programs/fees/post-judgment-interest-rate
  - Per-district weekly tables, e.g. txs.uscourts.gov (verified weekly values 01/02=3.48%, 07/03=3.98%).
  - gov.uk late-commercial-payments (BoE base + 8pp); service-public.gouv.fr (French *taux légal*).
- **Robots:** no robots-level kill on any core source. Caveat: some *state/court* hosts (iowacourts.gov,
  michigan.gov) and the ECB human portal return 403/503 to generic bots — an anti-scraper edge quirk,
  **not** a robots disallow. **Our build avoids those hosts entirely and uses only the clean feeds.**
- **Parseability:** ideal profile — the *volatile* inputs are the *cleanest* (Fed H.15 CSV, ECB
  data-api), and the messy PDFs are the *slow-changing* tail. Most rates can be **computed from two
  machine feeds + published formulas** rather than scraped.
- **Sample values [verified]:** IRS Q3-2026 non-corp under/overpayment 7%, large-corp underpayment 9%,
  GATT 4.5%; H.15 1-yr CMT 2026-07-06 = 3.95%; US federal post-judgment week of 07/03/2026 = 3.98%
  (vs 02/13/2026 = 3.43%); EU Late Payment H2-2026 = 10.40% (ECB 2.40% + 8pp); France = ECB + 10pp.
- **AI-failure: 9/9 (100%).** Every current-value query failed from parametric memory:

  | Query | Model guess (no search) | Verified truth | ✗ |
  |---|---|---|---|
  | IRS underpayment rate Q3-2026 | ~8% (2024 level) | 7% | ✗ |
  | US federal post-judgment rate this week | ~5% | 3.98% (wk 07/03/2026) | ✗ |
  | EU Late Payment rate H2-2026 | ~12% | 10.40% | ✗ |
  | Florida post-judgment rate now | 4–6% | 8.25%/yr (Q2-2026) | ✗ |
  | IRS large-corp underpayment Q3-2026 | ~10% | 9% | ✗ |
  | UK B2B late-payment rate today | ~13% | BoE base + 8pp (materially lower) | ✗ |
  | Iowa judgment rate & basis | fixed ~10% | 1-yr CMT + 2% (~6%, floats) | ✗ |
  | France late-payment margin over ECB | +8pp | +10pp (Art. L441-10) | ✗ |
  | US fed post-judgment Feb vs Jul 2026 | flat ~4–5% | 3.43% → 3.98% | ✗ |

- **Geography/monetization:** US (50 states + DC + ~94 federal districts + IRS) + EU-27 + UK + CA —
  tier-1 geographies, high commercial intent (litigation, collections, accounting, invoicing).
  **Paid** incumbents exist (Margill software; postjudgmentinterest.com $75–199/yr) → proven WTP.
- **Incumbent gap:** no dominant, structured, maintained, free DB with history + API. Field = paid
  desktop software, single-jurisdiction free calculators (interest.law UK-only), thin per-state SEO
  farms, and static law-firm PDF charts. uscourts.gov publishes only the *formula*, and ~94 districts
  each re-publish fragmented tables — assembling a historized, as-of-date, cross-jurisdiction DB is
  the moat.
- **Regulatory:** low — pure factual reference (published statutory/Treasury/IRS values), inside the
  owner's "factual VALUES are fine" carve-out. Not legal/financial advice.

### 3B. Regulated residential electricity tariffs — strong, but heterogeneous
- Sources [verified]: Spain REE `apidatos.ree.es` (clean JSON, PVPC EUR/MWh hourly); UK Ofgem price-cap
  HTML tables + Annex-9 XLSX; Eskom PDF schedule. Robots permit all data paths.
- AI-failure 6/9 (every failure is a live numeric value; the 3 "correct" are non-changing structural facts).
- **Kill on the North-America slice** (OpenEI URDB + Genability/RateAcuity own it with APIs). The open
  global slice is real but the moat is per-country PDF/schema engineering, and the two cleanest sources
  (Spain JSON, UK XLSX) are the easiest for a fast follower to copy. Advice-adjacent (bill estimation).

### 3C. Passport & travel-document fees — **RUNNER-UP (documented fallback)**
- Sources [verified, robots-permitting]: travel.state.gov (static HTML, $ inline, "Last Updated
  2026-03-19"), gov.uk/passport-fees, canada.ca, passports.gov.au, passportindia.gov.in (JS-rendered).
- **AI-failure 8/8 (100%).** Every 2026 value was stale (AU 412→422 Jan 1; CA 160→163.50 Mar 31;
  US 1-3 day delivery now $23.36; UK online adult £102; India 60-page tatkal ₹4,000), plus a common
  misconception (no $35 execution fee on mail/online renewals).
- **Incumbent gap: the cleanest of all candidates** — the "leading" resource (passport-collector.com)
  is a static, USD-only, single-fee blog table with no adult/child, expedited, validity, sort, export,
  or API; every existing passport *API* serves visa-requirements, **none serve fees**.
- Weakness vs the winner: **volatility is annual-ish per country** (predictable CPI/scheduled cadence),
  and value scales with **coverage (~190 heterogeneous per-country adapters)** — genuinely the work.

### 3D. Statutory fee schedules (registry/IP/court/visa) — conditional; not selected
- AI-failure 8/9 (~89%). But it is really 4–5 niches: US immigration (USCIS calc), US IP (USPTO),
  EU/Madrid trademark (WIPO/EUIPO) are **dominant-incumbent kills**; only global company-registry fees
  are open, and that slice is PDF-heavy/multilingual — contradicting "fully refresh-automatable."

## 4. Demand proxies (method note)
No paid keyword tools were used. Demand was graded from: (a) the number and funding of competing
commercial sites bidding a SERP (proxy for CPC/commercial intent); (b) existence of *paid* incumbents
(direct willingness-to-pay evidence); (c) recurring high-intent query patterns surfaced in search;
(d) presence of dedicated machine/agent APIs (proxy for programmatic demand). For the winner, the
decisive signal is **paid** incumbents ($75–199/yr calculators, enterprise software) — the strongest
form of demand evidence — combined with an unserved *canonical historized API* surface.

## 5. Conclusion
Three candidates clear the bar with zero rubric kills. The winner and runner-up, with the full 39-point
scoring, are decided in [`NICHE_DECISION.md`](NICHE_DECISION.md).
