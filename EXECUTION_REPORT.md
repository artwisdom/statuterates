# EXECUTION_REPORT.md — Data Moat Engine

**Autonomous build, 2026-07-08.** One canonical, provenance-tracked dataset in a narrow global niche,
wrapped in three "skins" (human site, machine API + MCP, licensing-later). Built end-to-end, verified,
and documented, entirely inside `./data-moat-engine` under the Section 0 hard rules — **no remote, no
deploys, no accounts, no spend, robots-respecting fetches only.** Nothing is live; every step that needs
a credential/account/deploy is a documented manual action for you.

## The single next action
**Push this repo to GitHub and enable Pages** — [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md)
steps 1–2 (≈7 minutes). That activates the free hosting and the self-updating pipeline. Everything else
is optional/growth.

## What was built
A working **data business foundation** for **StatuteRates** — U.S. statutory, judgment & tax interest
rates:
- **Pipeline** (`pipeline/`): polite, robots-respecting fetchers → normalizer → fail-loud validation →
  SQLite source-of-truth → versioned JSON exports. Two live sources; runs empty-cache→green in ~6 s.
- **Human skin** (`site/`, Astro): 16 static pages — one indexable page per rate series (current value,
  freshness stamp, effective-date history, provenance link), homepage (with a featured current-rates
  strip + jurisdiction grouping), an honest "how the data is collected" page, methodology, 404,
  `robots.txt`, `sitemap.xml`, SVG favicon + web manifest. Every page < 14 KB, zero external requests,
  full JSON-LD (Dataset + FAQPage + BreadcrumbList). Two reserved (empty) ad slots per page.
- **Machine skin** (`machine/`): a **static JSON API** (prebuilt files, zero server cost) + an **OpenAPI
  3.1 spec** + an **MCP server** (5 tools) so AI agents can query it + `llms.txt`.
- **Automation** (`.github/workflows/`, INACTIVE): weekly refresh (fetch→validate→commit-if-green,
  ~13 min/month) and deploy, with self-healing failure diagnostics and a maintenance runbook.

## The niche, and why
Chosen by a fresh 32-candidate research round scored on the brief's 9-dimension rubric
([research/RESEARCH_LOG.md](research/RESEARCH_LOG.md), [research/NICHE_DECISION.md](research/NICHE_DECISION.md)).

**Winner: Statutory, Judgment & Tax Interest Rates — 37/39, zero kill flags.** It is the sharpest form
of the thesis: live/volatile (the federal post-judgment rate changes **weekly**), numeric, globally
needed, and **badly answered by LLMs (9/9 test queries wrong or stale)**, with **no dominant structured
incumbent** (the field is paid desktop software, single-jurisdiction free calculators, and thin SEO
farms) and clean, official, robots-permitting machine-readable sources.

It was a genuine **37–37 tie** with the runner-up, **Passport & Travel-Document Fees**, broken toward
interest rates because I *verified* both anchor sources fetch and parse through the project's own
honest-UA pipeline (so a complete pipeline was buildable tonight), it has the sharpest volatility moat,
and it needs far fewer, more-stable fetchers for hands-off upkeep. Passport fees is the pre-committed
**pivot target** if traffic disappoints (same engine, different fetchers).

Notably, the "obvious" ideas were **correctly killed** by the rubric for having dominant incumbents:
central-bank rates (BIS/TradingEconomics), minimum wages (WageIndicator), public holidays
(timeanddate/Nager), fuel prices (GlobalPetrolPrices).

## Dataset stats
- **536 observations**, **12 rate series**, **4 official sources**, **3 jurisdictions (US / UK / EU)**.
- **US:** IRS §6621 quarterly rates (234 published, 6 categories); Fed H.15 1-year Treasury CMT
  (published weekly); derived US federal post-judgment rate (28 U.S.C. §1961). **UK:** Bank of England
  Bank Rate (published) + derived statutory late-commercial-payment interest (Late Payment Act 1998).
  **EU:** ECB main refinancing rate (published) + derived EU Late Payment Directive reference rate.
- The UK & EU statutory rates are correctly modeled as **semi-annual** (fixed on the 31 Dec/30 Jun
  reference dates for the UK; 1 Jan/1 Jul for the EU) rather than a naive "live base + 8pp" — the exact
  domain rigor generic aggregators miss, and it's unit-tested.
- Every value carries `effective_date`, `source_url`, `retrieved_at`, and `confidence`. **Published**
  values are `high` confidence; **derived** values are `medium` and store the exact statutory formula
  plus a "verify against the controlling statute/court; not legal advice" note.

## How it was verified (all green — [docs/QA_REPORT.md](docs/QA_REPORT.md))
Full pipeline from an empty cache → validation green (536 records, incl. 105 post-judgment↔CMT
consistency checks + 195 IRS §6621-spread integrity checks); 22 unit tests (robots logic, US and UK/EU
derivation invariants, and validator fail-loud behavior); 16-page site
build with valid JSON-LD and a spot check; static API conformance to the OpenAPI spec (12 endpoints);
MCP smoke test exercising all 5 tools; a secret/placeholder sweep (clean); and containment checks (no
remote, no leftover processes, nothing outside the project dir).

## What is intentionally NOT done (and why)
- **Anything requiring an account, deploy, credential, purchase, or remote** — forbidden by Section 0.
  All of it is a numbered manual step in [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md).
- **The bot-hostile state/court sources** (some return 403 to bots) — not scraped, because spoofing a
  browser UA to defeat anti-bot measures is against the data-ethics rules. They're documented as
  formula-derivable expansion in the runbook instead.
- **Per-EU-country late-payment margins and US state judgment rates** — the next expansion layer
  (documented in the runbook). The US core plus UK + EU jurisdictions are built and live in the dataset.
- **Ad code, pay-per-crawl, per-call billing, licensing** — placeholders/optionality only; activate on
  real demand (see DEPLOYMENT_GUIDE steps 6–8 and RISK_REGISTER).

## Honest first-90-days plan
- **Week 1:** push + Pages + custom domain (optional ~$10/yr); confirm `refresh-data` runs; apply to
  Ezoic/AdSense; submit the MCP server to PulseMCP/mcp.so/Glama/Smithery.
- **Weeks 2–6:** expand coverage where it widens the keyword surface cheaply — per-EU-country
  late-payment margins (a small maintained table over the ECB reference) and the top-search US states'
  judgment rates (many are CMT-derivable). Each new series is a new indexable page. (US + UK + EU are
  already live.)
- **Weeks 6–12:** watch Search Console indexing and sessions against the RISK_REGISTER pivot thresholds.
  Add ad code once a network approves. Do **not** add features to a site with no traffic.

## Honest revenue expectations
Most projects of this class earn **~$0**. A maintained, genuinely useful reference site's realistic base
case is **$500–$3,000/month at months 12–18**, and only if it earns organic traffic — which is the hard
part, not the build. Machine-side revenue is **unproven for solos** (free optionality, not the plan);
licensing is a lottery ticket. This niche skews professional/B2B, which means **high commercial intent
but lower raw volume** than a consumer niche — the main reason passport fees is the ready pivot. Steady-
state maintenance target is **< 1 hour/week** once the automation is live.

## Where everything is
`STATE.md` (resume state) · `DECISIONS.md` (every judgment call) · `research/` (research + niche
scoring) · `docs/ARCHITECTURE.md` · `docs/QA_REPORT.md` · `docs/DEPLOYMENT_GUIDE.md` ·
`docs/MAINTENANCE_RUNBOOK.md` · `docs/RISK_REGISTER.md`.
