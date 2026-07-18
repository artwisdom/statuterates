# GROWTH_PLAN.md — StatuteRates long-term traffic & revenue plan

**Written 2026-07-16 by the research phase (Fable 5). Implementation owner: Opus 4.8.**
This document is self-contained: everything needed to execute is in here + the repo. Do not rely on
prior conversation context. Repo: `data-moat-engine/` (site = Astro static → GitHub Pages behind
Cloudflare, pipeline = Node data refresh nightly via `.github/workflows/refresh.yml`, deploy via
`deploy.yml` on push). Live: https://statuterates.com (190 pages).

---

## 0. Strategy in one paragraph

The research says the winning posture for this exact site in 2026 is: **be the always-current,
statute-cited TOOL layer** for judgment/prejudgment/IRS/late-payment interest. Short tool-intent
queries ("texas judgment interest calculator") almost never trigger AI Overviews (~8% for 1–2-word
queries vs 53% for long questions — Pew) and are the highest-intent, best-RPM traffic; long
informational queries now lose ~half their clicks to AI Overviews (Ahrefs Feb-2026: −58% CTR at #1;
Pew: 8% vs 15% click rate). The per-state calculator long-tail is **provably winnable**: the only
dedicated per-state competitor (judgmentinterestrate.com + EMD shells) is anonymous, unmonetized,
renders its rate tables client-side (empty `<tbody>` in HTML), shows stale rates (hero "Q2 2026" in
Q3), and self-contradicts (calls Texas "Fixed 5%" while its own FAQ says ~8.5%; the verified truth is
prime-based, currently 6.75%). The subscription competitor (interest.law) has NO per-state pages at
all. Our moat — nightly-verified data with statute citations and full provenance — is exactly the
E-E-A-T substance Google says matters most for anonymous YMYL sites ("trust is the most important"
E-E-A-T member — Google's own docs). Execution = protect signal integrity (fix date churn), surface
the trust story, ship the per-state tool layer, let the pipeline self-generate freshness, and climb
the ad-network ladder (AdSense → Mediavine Journey at 1k sessions → Official/Raptive).

---

## 1. External research findings (deep-research pass, 2026-07-16)

Confidence key: [P] = primary source (Google docs / first-party pages, fetched & quoted),
[S] = reputable study (Ahrefs/Pew/Seer, fetched), [B] = practitioner blog (directionally reliable).
The adversarial-verification phase was rate-limited, so treat numbers as reported-by-source.

### 1.1 AI Overviews & the 2026 SERP
- [S] AIO presence ≈ −58% desktop CTR for the #1 result on informational queries (Ahrefs, Feb 2026
  update; was −34.5% in Apr 2025 — worsening).
- [S] Pew (Mar 2025, 68,879 real searches): with an AI summary, users click a result in 8% of visits
  vs 15% without; links *inside* the AIO get clicked in just 1% of visits.
- [S] AIO triggers: 36% of informational queries vs 8% commercial / 5% transactional (Seer,
  5.47M queries); 8% of 1–2-word queries vs 53% of 10+-word queries (Pew). **Tools/calculators are
  the defended asset class; long Q&A prose is the exposed class.**
- [S] Seer: being cited inside an AIO ≈ 2.2× clicks-per-impression vs not cited (but still −38% vs
  no-AIO SERPs). Being AI-citable matters (llms.txt, quotable data, clean tables) — it recovers,
  not restores, CTR.
- Implication: **prioritize calculator/data pages over new guide prose.** Keep guides for topical
  authority + internal linking, but the growth engine is tools + live data.

### 1.2 E-E-A-T for an anonymous YMYL data site
- [P] Google: YMYL (financial impact) gets heightened scrutiny; of E-E-A-T, **Trust is the most
  important**; for data sites, verifiable accuracy + transparency substitute for named authors.
- [P] interest.law (successful niche competitor) is fully anonymous and builds trust with: statute
  citations hyperlinked to official legislation, a /methodology page, explicit not-legal-advice
  disclaimers, and an /llms.txt for AI crawlers. This is the proven pattern — we already do most of
  it; we need to *surface* it (see Phase 2).
- [P] Google flags "changing dates without substantive content change" as a search-engine-first
  (spam-adjacent) signal, and "extensive automation to produce content on many topics" as an
  unhelpful-content signal. **Programmatic pages must carry genuinely unique per-state substance**
  (we have it: verified rates, statutes, carve-outs, accrual rules per state).

### 1.3 Freshness-signal integrity (directly actionable bugs)
- [P] Gary Illyes (multiple statements, incl. July 2026): sitemap `lastmod` trust is **binary per
  site** — Google either trusts your dates or ignores them wholesale; verified by comparing declared
  dates to detected content changes; if inaccurate, "you're better off without the lastmods."
  Build-stamped static sites are a *named failure pattern*.
- [B] Practical rule: `lastmod` only moves on real content change; omit when unknowable.

### 1.4 Schema in 2026
- [S] **FAQ rich results were dropped by Google May 7, 2026** (HowTo dead earlier). Existing FAQPage
  markup is harmless (AI systems still read it) but earns no SERP treatment — stop investing in it.
- Still rendering/valuable: Article, Breadcrumb, Organization, WebSite, Dataset. Competitor uses
  SoftwareApplication+WebApplication on calculators — cheap to add, plausible AI-comprehension win.

### 1.5 Ad monetization ladder (2026 state)
- [B] Niche RPM: legal/finance is top-tier for AdSense (roughly $10–30 US-traffic RPM reported;
  treat as directional).
- [B] **Mediavine Journey**: entry at just **1,000 monthly sessions**; 70% rev share; avg RPM
  ≈ $11.15 (some $30+); requires running the **Grow** JS snippet for 30 days before applying
  (works via script tag on non-WP sites — verify at implementation); Net-65 payouts.
- [B] Mediavine "Official": income-based entry (> $5k/yr ad revenue), 75%+ share.
- [B] **Raptive**: minimum now 25k pageviews/mo (was 100k), ≥50% tier-1 geo at that tier, flat 75%.
- [B] Ezoic: $5–12 RPMs reported + site-speed/UX complaints — **skip; go AdSense → Journey**.
- [B] CWV: injected Auto-Ads placements cause CLS; reserve fixed heights for units (our AdSlot
  already reserves min-height) and lazy-load below-the-fold units.
- Current site state: AdSense approval pending; `ADSENSE_CLIENT` live (script + ads.txt);
  GDPR/CCPA consent messages published; two-switch manual units already implemented
  (`ADSENSE_SLOT` repo var → labeled, reserved-height responsive units at existing AdSlot spots).

### 1.6 Links & citations
- [P] Widget/embed attribution links must be **nofollow/sponsored** (Google guidance) — embeds are a
  brand/traffic play, not link equity. Deprioritize.
- The real passive link plays for a data site: **be the citable source** — "cite this page" blocks,
  clearly licensed free data (competitor licenses its dataset CC-BY 4.0), CSV downloads, and a
  how-to-cite page. Journalists/lawyers link to sources that make citation effortless.

### 1.7 Bing / IndexNow / other engines
- [S] Bing ≈ 9.8% of US search, **13.7% of US desktop** — legal professionals disproportionately
  search from work desktops (Edge/Bing defaults). Non-trivial for this niche.
- [B] Google does NOT support IndexNow; Bing/DDG/Yandex/Naver do; ~17–22% of newly clicked Bing URLs
  arrive via IndexNow; up to 10k URLs per free POST. → Add IndexNow ping for changed URLs on deploy
  + verify Bing Webmaster Tools (owner, 5 min).

### 1.8 Competitor cheat-sheet
| Competitor | Model | Strengths | Exploitable weaknesses |
|---|---|---|---|
| judgmentinterestrate.com (+ floridajudgmentinterest.com EMD) | free, per-state URLs | per-state pages, rate+cite in `<title>`, IP auto-detect, CC-BY dataset, monthly FL auto-ingest, PDF/Excel export | anonymous; **zero monetization**; client-side tables (empty HTML tbody); stale (Q2 hero in Q3); self-contradicting rates (TX "5%" vs "8.5%" — truth 6.75%) |
| interest.law | £100–£3,500/yr subscriptions | daily sync, statute links, methodology, llms.txt | **no per-state pages** (single /usa calculator); gates breakdowns/exports behind paywall |
| State .gov (e.g. nccourts.gov calculator) | official | authority | NC tool states no rate, no statute, no prejudgment — informational intent unserved |
| BigLaw articles (Steptoe etc.) | thought-leadership | domain authority | episodic (2021), no tables/tools, tells readers to research each state |

Adopt from them: rate + statute cite in per-state `<title>` (proven CTR tactic — and our nightly
data keeps it *true*, their weakness); WebApplication schema; CC-BY-style data licensing note;
court-filing-friendly print/PDF output (later phase). Beat them on: freshness (nightly), correctness
(statute-verified, dual-rate aware), server-rendered tables, transparency (methodology + provenance),
and actually being monetized tastefully.

---

## 2. Internal audit findings (verified in-repo 2026-07-16)

1. **STALE RATES RIGHT NOW**: Nebraska post-judgment rose to **5.970% effective 2026-07-16** (site
   shows 5.723%); **Kansas** 16-204 reset July 1, 2026 (site shows 2025-26's 8.25%). Root cause:
   nightly refresh only auto-updates IRS/H.15/BoE/ECB-derived series (+ Iowa both metrics); all
   agency-set state rates (~28 post + ~16 pre) are static curated values in
   `pipeline/fetchers/us-states.mjs` until manually re-verified (runbook §E).
2. **lastmod churn**: `site/src/pages/sitemap.xml.js` gives every static path + all guides
   `lastmod = build date` → ~23 URLs claim daily change; risks binary distrust of ALL our lastmod
   (see §1.3). Rates/hubs already use real data dates (correct — keep).
3. **Description churn**: 16 templates embed `prettyDate(meta.generated_at)` ("Updated <today>") in
   meta descriptions → nightly churn on ~180 URLs, decoupled from real data change.
4. **Guide schema churn**: `guides/[slug].astro` sets `dateModified: meta.generated_at` (nightly).
5. **No analytics at all** — cannot measure pages/queries that earn. Privacy page already discloses
   "privacy-respecting aggregate measurement": Cloudflare Web Analytics (free, cookieless,
   consent-free, zero-maintenance; domain already on Cloudflare) fits exactly.
6. **No per-state calculator pages** — the #1 gap vs the money queries (see §1.1, §1.8). One combined
   state calculator covers only 19 fixed-simple states + CO dual.
7. **No IRS penalty math** — "IRS penalty and interest calculator" family is the biggest-volume
   adjacent query set; failure-to-file (5%/mo, 25% cap, FTF−FTP offset), failure-to-pay (0.5%/mo,
   25% cap; 0.25% in installment agreement, 1% post levy-notice) are exact statutory formulas.
   IRS calculator page currently says "not covered: penalties."
8. **/changes is one page + RSS; rate changes aren't individually indexable.** The pipeline already
   detects every observation change nightly → per-change permalink pages = self-writing fresh,
   QDF-capturing content forever.
9. **E-E-A-T story untold**: no editorial/verification-process page, no how-to-cite, no corrections
   policy — although the substance (multi-source statute verification, nightly refresh, provenance
   on every value, 10/10-test calc engine) already exists. Surface it.
10. **State hubs thin** (~450–600 words): no worked example, no statute-history table (data exists in
    DB/exports), no neighboring-state comparison.
11. IndexNow/Bing absent (see §1.7). FAQPage everywhere (fine to keep; stop adding).
12. Ad slots: 2/page (top+bottom). No mid-content unit on 1,000+-word guides; no multiplex at ends.
13. Assets already in place (do NOT rebuild): 190 pages, hub↔spoke mesh, Dataset/Article/Breadcrumb/
    Org/WebSite schema, per-entity lastmod for rates, robots+sitemap+GSC, llms.txt + llms-full.txt,
    free JSON API + CSV, RSS, shared 10/10-test calc engine, nightly pipeline + auto-deploy,
    fintech design system in `BaseLayout.astro` tokens, a11y pass, privacy/terms, consent published,
    two-switch ads, og-image, 404.

---

## 3. Phased implementation plan (for Opus 4.8)

Ground rules for every phase: keep the design system (tokens in `BaseLayout.astro`) — no visual
regressions; every new page needs unique substantive content (no thin shells — §1.2); never state a
current rate in prose that isn't rendered from the dataset (stale-proofing); all math goes through
`shared/interest-calc.mjs` with unit tests; run the full gate before push
(`cd pipeline && node run.mjs all` green → `node machine/build-api.mjs` → `cd site && npm run build` →
`node machine/check-api-conformance.mjs` → engine tests `cd shared && node --test`); verify live
after deploy. Commit per phase.

### Phase 0 — Correctness & signal integrity (do first, ~1 session)
0.1 Fix stale rates: Nebraska post-judgment → 5.970% effective 2026-07-16 (nebraskajudicial.gov);
    verify Kansas 16-204 rate for Jul 1 2026–Jun 30 2027 at sos.ks.gov and update value/notes/asof
    (in `pipeline/fetchers/us-states.mjs`; delete any superseded future-dated DB rows as done before
    — see runbook §F gotcha). Sweep: re-check the other annual-reset states (NJ Jan-1, MI Jul-1 ✓
    already 4.959%, NH, SD, LA Oct) for period boundaries just crossed.
0.2 lastmod integrity (`site/src/pages/sitemap.xml.js`): static paths get fixed hand-set dates
    (bump only on real edits); guides get a `dateModified` field in `site/src/lib/guides.mjs`
    (set once now, update only on real edits) used by BOTH sitemap and Article schema
    (`guides/[slug].astro`). Rates/hubs unchanged (already data-driven).
0.3 Description churn: replace build-date "Updated <today>" in the 16 templates with either the
    entity's real latest `effective_date` ("As of <date>") on data pages, or no date on
    guides/static. Keep title tags date-free.
0.4 Analytics: add Cloudflare Web Analytics beacon (single script tag in `BaseLayout.astro` head;
    token from CF dashboard — owner creates in 2 min, or ship commented + document). Update privacy
    page "Analytics" section to name it.
0.5 IndexNow: generate a key file into `site/public/`, add a deploy step that POSTs changed URLs
    (diff sitemap vs previous build, or all URLs — ≤10k free) to api.indexnow.org. Document Bing
    Webmaster verification as an owner step.
0.6 Add `dateModified`-accurate `<meta name="last-modified">`? No — skip (not a real signal). Done.

### Phase 1 — Trust layer (E-E-A-T surface, ~1 session)
1.1 `/editorial-policy/` page: how rates are verified (multi-source vs official statute text),
    update cadence per series type (nightly derived / quarterly re-verified curated), corrections
    contact (hello@statuterates.com), data licensing (facts are public-domain government edicts; our
    compilation free to cite with attribution — CC-BY-style language), and the "what we are not"
    disclaimer. Link from footer + methodology + about.
1.2 "Cite this page" block on every rate page + state hub (`rates/[slug].astro`,
    `states/[state].astro`): pre-formatted citation (site name, page, URL, accessed date, "data
    verified against <statute>") + copy button. Lightweight `<details>` to keep pages clean.
1.3 Organization schema enrichment in `BaseLayout.astro`: `publishingPrinciples` → /editorial-policy/,
    `contactPoint` (hello@), `foundingDate: '2026'`, `knowsAbout` array. WebSite `potentialAction`
    SearchAction? Skip (no site search).
1.4 Surface verification badges: on rate pages the "statute verified <date>" line exists for fixed
    rates — extend a subtle "✓ Verified against <cite>, <date>" line to ALL rate pages (variable ones
    say "current published value, checked nightly").
1.5 Homepage + hub trust strip: one-line "Every rate verified against the official statute — read
    how" linking to editorial policy.

### Phase 2 — The tool layer (biggest traffic lever, 1–2 sessions)
2.1 **Per-state calculator pages** `/calculators/[state]-judgment-interest/` (51 pages via
    `getStaticPaths` over the states dataset — new template file):
    - Fixed-rate states: exact computation (engine `fixedSimpleInterest` / `fixedCompoundInterest`).
    - Variable states: compute at the current published rate with honest framing ("applies the
      <X>% rate in effect for judgments entered <period>; older judgments may carry a different
      locked rate — see the rate page"). The DB accumulates every nightly observation going forward,
      so variable-state historical accuracy improves automatically; wire `historyFor(slug)` in so
      segment math activates as history accrues.
    - Dual-rate states (CA/IL/CO-PI etc.): render BOTH series as selectable options with claim-type
      labels (pattern exists in `state-judgment-interest.astro` for CO).
    - Each page's unique substance (all from existing verified data — no new research): current
      rate hero, statute cite + link, accrual rule, simple/compound note, carve-outs, one worked
      example at the real current rate (computed at build), 3–4 state-specific FAQs (keep FAQPage
      markup minimal or skip — §1.4), cross-links (state hub, rate pages, prejudgment page).
    - `<title>` pattern (proven CTR, kept true by nightly builds):
      `"<State> Judgment Interest Calculator — <rate>% (<statute cite>)"`.
    - Add WebApplication (+SoftwareApplication) JSON-LD; Breadcrumb; NO new FAQ schema reliance.
    - Update `/calculators/` index (group "By state" grid), state hubs (link to their calculator),
      sitemap (data-driven lastmod = state's latest effective_date), CALC_FOR map in
      `rates/[slug].astro` so rate pages link to their own state calculator instead of the combined
      one. Keep the combined page as a comparison tool (canonical stays self).
2.2 **IRS penalty + interest calculator** `/calculators/irs-penalty-and-interest/`:
    - Engine additions in `shared/interest-calc.mjs` (+ tests): failure-to-file (5%/mo or part-month,
      25% cap, reduced by concurrent FTP; minimum penalty for 60+ days late — use current statutory
      minimum with a data-sourced constant), failure-to-pay (0.5%/mo or part-month, 25% cap;
      0.25% installment-agreement variant, 1% post-levy variant as toggles), interest on tax +
      penalties per §6621/§6622 daily compounding from the existing quarterly history.
    - Page: mode toggle (filed-late / paid-late / both), month-by-month breakdown table, prominent
      "estimates — IRS bills control" disclaimer, links to IRS rate pages + guide.
    - Companion guide `/guides/irs-penalties-explained/` (add to `guides.mjs` with real
      dateModified; guide content rules: no hardcoded current rates, link live pages).
2.3 Calculator UX polish for ads era: ensure result region never overlaps future ad slots; keep the
    top of every calculator ad-free above the fold on mobile (tool usability = the AIO moat).

### Phase 3 — Self-writing freshness (1 session)
3.1 Per-change announcement pages: pipeline emits `data/exports/changes.json` (it already computes
    changes for /changes + RSS — check `site/src/pages/changes.astro` + `changes.xml.js` source);
    extend to a permanent log (append-only JSON in `data/exports/changelog/` committed by the nightly
    workflow). New template `/changes/[id].astro` → one page per material change:
    "<Series> rises|falls to <new>% (<effective date>)" with old→new, statute, what it means (one
    templated-but-parameterized paragraph per series *type*, not identical boilerplate), links.
    /changes becomes the index of these permalinks. RSS items link to permalinks.
    Sitemap: lastmod = change date (immutable → perfect lastmod integrity).
3.2 Quarterly IRS announcement page auto-generated the same way ("IRS interest rates for Q4 2026")
    — these capture recurring "IRS interest rates <quarter> <year>" QDF searches every quarter,
    automatically, forever.

### Phase 4 — Data moat automation (1–2 sessions)
4.1 Agency fetchers (extend the nightly pipeline, one per source, using `politeGet` + parsers with
    fail-loud validation like `fed-h15.mjs`): TX OCCC (monthly judgment-rate page), FL CFO
    (myfloridacfo.com quarterly page — check robots; else derive per formula like Iowa),
    NJ courts (annual rate PDF/page), MI Treasury (semiannual certification page), NE judicial
    branch page, KS SOS page. Each replaces a static curated value with an auto-updating series
    (region/metadata unchanged so pages/API/hubs pick them up transparently). Update runbook §E/F.
4.2 Staleness tripwire: extend `pipeline/lib/validate.mjs` with per-series `max_age_days` for
    curated variable states (e.g., 200 days for annual resets, 120 for semiannual, 40 for monthly);
    nightly run FAILS LOUD listing which curated rates are past due for re-verification → the
    Actions failure email becomes the automatic quarterly reminder (no silent staleness ever again).
4.3 Print/court-filing output: `@media print` stylesheet for calculator results + a "Print / save
    as PDF" button (no server, no deps — beats the competitor's gated PDF export for free).

### Phase 5 — Compounding content (ongoing, low cadence)
5.1 Hub enrichment (template-driven from existing data): worked example at current rate, statute
    rate-history table (from `history` in exports), "compare with neighbors" row, per-state FAQ from
    the verified restrictions/carve-out fields.
5.2 Next guides (only after Phases 0–4; AIO headwinds make these secondary): "Interest on unpaid
    invoices (small business, state-aware)", "How to collect post-judgment interest step-by-step",
    "IRS payment plans vs paying the balance", each funneling to calculators. Real dateModified.
5.3 EU per-country late-payment pages (27) over the existing ECB series + small curated margin
    table (roadmap item in MAINTENANCE_RUNBOOK). UK/EU AdSense RPMs are lower but additive.
5.4 Glossary → auto-link first occurrences of glossary terms inside guide bodies (build-time
    transform, capped 3–5 links/guide to avoid spam).

### Ad-revenue ladder (owner actions at milestones — document in DEPLOYMENT_GUIDE §7)
- Now: AdSense approval pending → on approval, create ONE "Display / responsive" ad unit, set repo
  var `ADSENSE_SLOT` → intentional in-content units render (already built). In AdSense: turn OFF
  vignette + anchor formats at least for /calculators/* (Auto Ads "Page exclusions") — tool UX is
  the moat. Keep density modest: ~3 units/page max on long pages (top slot exists; Opus adds ONE
  mid-content slot to guide template + multiplex-style related-content unit at article end using
  the same AdSlot component pattern).
- At ~1,000 sessions/mo (check Cloudflare Analytics): install Mediavine **Grow** script site-wide
  (BaseLayout, env-gated like AdSense), run 30 days, apply to **Journey** (~$11 avg RPM vs AdSense,
  70% share). Journey replaces AdSense units (remove ADSENSE_SLOT, keep ads.txt updated per their
  instructions).
- At >$5k/yr revenue → Mediavine Official (75%+). At 25k+ pageviews/mo with ≥50% tier-1 geo,
  compare **Raptive** (flat 75%).

### Success metrics (check monthly, Cloudflare Analytics + GSC + AdSense)
- Indexed pages (GSC) ≥ 90% of sitemap; impressions trend on "[state] judgment interest calculator"
  family; clicks on calculator pages vs guide pages (expect tools to dominate); page RPM by
  template type once ads serve; zero stale-rate incidents (tripwire green).

### Explicit non-goals (decided)
- No subscriptions/paywall (owner decision 2026-07-16: pure ad-supported).
- No followed-link embed widgets (Google policy — §1.6). Cite-this + free data instead.
- No mass thin programmatic pages beyond the per-state set backed by real per-state data.
- Don't remove existing FAQPage markup; just stop relying on it for SERP features.

---

## 4. Owner (Michael) quick actions — 15 minutes total, anytime
1. Cloudflare → Web Analytics → create site token → put it in the repo variable `CF_ANALYTICS_TOKEN`
   (Opus will wire the beacon to read it like ADSENSE_CLIENT).
2. Cloudflare → Email Routing → forward hello@ + privacy@statuterates.com → your inbox.
3. Bing Webmaster Tools → import the site from Google Search Console (one click) — pairs with
   IndexNow.
4. When the AdSense approval email arrives: create 1 display unit → set `ADSENSE_SLOT` repo var →
   in AdSense, exclude vignettes/anchors on /calculators/* → rerun deploy.
