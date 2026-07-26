# Phase 1 takeover audit — 2026-07-19

This is the durable audit record for the July 2026 takeover. It separates what was fixed in the
repository from the research-backed growth work that should follow. Search-demand and difficulty
labels below are directional because no paid SEO platform or Google Search Console connection was
available; do not treat them as exact volume estimates.

## Executive summary

StatuteRates now has a strong static-site, data, and technical-SEO foundation, but its long-term moat
depends on trustworthy legal history rather than page count. Phase 1 made automation durable,
removed false freshness/history claims, classified source quality, withheld unsafe state calculators,
upgraded the framework/runtime, and added deployment checks. The strongest growth path is to verify
high-demand states one at a time, build real effective-date histories, and publish calculation tools
only after every legal branch passes a fail-closed rule model.

The initial live-platform issue was resolved on 2026-07-19. A follow-up check verified the HTTP-to-
HTTPS redirect, the four-response-header Transform Rule, and HSTS with a six-month max-age.
`includeSubDomains` and preload remain off intentionally; the exact edge configuration is recorded in
[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).

## Engineering assessment

| Dimension | Phase 1 result | Remaining limitation |
|---|---|---|
| Correctness | Strong fail-closed baseline; 49 tests and API/build conformance pass | State legal histories and calculation branches are incomplete |
| Security | Dependency audits are clean; MCP traversal is blocked; calculators are double-gated; Cloudflare edge hardening is live | A strict CSP remains deferred until AdSense and analytics compatibility is tested |
| Performance | Static output is exceptionally light; live trace measured 85 ms lab LCP and 0.0001 CLS | No real-user CrUX data yet; AdSense remains the main third-party cost |
| Maintainability | Locked Node/runtime versions, clean bootstrap, durable exports, current architecture/runbook | `pipeline/fetchers/us-states.mjs` is still a large curated-data module |
| Technical SEO | Local mobile Lighthouse: 100 accessibility, 100 best practices, 100 SEO; automated metadata/link checks | Search Console data is unavailable and the new pages are still early in indexation |

The code-review pass covered correctness, security, performance, and maintainability. No unresolved
repository defect is currently severe enough to justify publishing an unverified state calculator.

## Technical SEO checklist

| Check | Status | Evidence |
|---|---|---|
| Static build | Pass | 191 HTML pages build on Astro 7.1.1 |
| Titles and descriptions | Pass | 0 indexable titles over 65 characters and 0 descriptions over 165 after Phase 1 optimization |
| Canonicals | Pass | One unique absolute HTTPS canonical per HTML page |
| H1 structure | Pass | Exactly one H1 per HTML page |
| Structured data | Pass | Every indexable HTML page carries schema markup |
| Internal links | Pass | Every root-relative target resolves in the generated output |
| Sitemap | Pass | Indexable rate/state/guide pages included; withheld calculators excluded |
| Unsafe calculator indexation | Pass | Legacy state comparison routes are `noindex,follow`; no per-state calculator pages build |
| Mobile accessibility | Pass | Local Lighthouse accessibility score 100 |
| Mobile SEO | Pass | Local Lighthouse SEO score 100 |
| Layout stability | Pass | Live lab CLS 0.0001; font loading caused no material shift |
| Render blocking | Pass | One tiny CSS request; measured LCP/FCP savings from deferral were 0 ms |
| HTTPS redirect | Pass | Live plain HTTP returns a permanent `301` to HTTPS |
| Security headers | Pass | Homepage and API responses carry HSTS, nosniff, referrer, frame, and permissions headers |
| Real-user Web Vitals | Warning | No CrUX field data was available for the homepage |
| Indexation visibility | Warning | A public `site:` check surfaced the glossary, but Search Console is required for reliable coverage data |
| Ad/consent behavior | Warning | Live Lighthouse's only best-practice failures came from two Google advertising cookies |

## Search and competitor research

Three visible competitor patterns matter:

1. [PostJudgmentInterest.com](https://www.postjudgmentinterest.com/) sells office access for annual
   fees and differentiates on partial payments and saved records. StatuteRates can eventually offer a
   free, privacy-preserving alternative, but only after verified state rule histories exist.
2. [FloridaJudgmentInterest.com](https://floridajudgmentinterest.com/) emphasizes PDF/Excel export,
   period-by-period breakdowns, and state landing pages. Its crawled homepage still advertised Q2
   2026 while the [Florida CFO's Q3 memorandum](https://myfloridacfo.com/docs-sf/accounting-and-auditing-libraries/state-agencies/agency-memos/aam29---25-26.pdf)
   set the July 1 rate, illustrating why automated effective-date provenance can be a real advantage.
3. [Enforcement.uk](https://enforcement.uk/tools/interest-calculator) combines a focused calculator,
   primary legislation, a named expert, and a wider legal-resource cluster. StatuteRates' UK tool is
   fast and data-backed, but it needs comparable external authority signals over time.

The durable competitive position is not “more pages.” It is: cited sources, recorded history,
transparent formulas, useful exports/API access, fast static pages, and an honest refusal to calculate
when the legal model is incomplete.

## Keyword opportunity map

“Current coverage” means a relevant local page exists; it is not a claim about Google ranking.

| Keyword/topic | Demand signal | Difficulty | Opportunity | Current coverage | Best format |
|---|---|---:|---:|---|---|
| judgment interest rates by state | High | Moderate | High | Strong index page | Keep table current; add verified histories |
| prejudgment interest rates by state | High | Moderate | High | Strong index page | Expand claim-type explanations |
| `[state] judgment interest rate` | High aggregate | Moderate | High | 50 states + D.C. | Improve each page as source history is verified |
| `[state] prejudgment interest rate` | High aggregate | Moderate | High | 50 states + D.C. | Source-backed state reference pages |
| federal post judgment interest rate | High | Moderate | High | Rate page | Maintain weekly history and examples |
| federal post judgment interest calculator | High | Moderate | High | Calculator | Add partial-payment support later |
| post judgment interest calculator | High | Hard | High | Federal only | State rollout after rule verification |
| IRS interest calculator | High | Hard | High | Calculator | Clarify balance types and date examples |
| IRS underpayment interest rate 2026 | High seasonal | Moderate | High | Rate + guide | Automated year/quarter landing context |
| New York consumer debt judgment interest rate | Medium | Easier niche | High | Dedicated rate page | Defend with authoritative source/history |
| Florida judgment interest calculator | High | Hard | High | Reference only | Phase 2: quarterly history + exact branches |
| California judgment interest calculator | High | Moderate | High | Reference only | Phase 2 after consumer/government branches |
| Texas judgment interest calculator | High | Moderate | High | Reference only | Phase 2 after rate bands and lock rules |
| how to calculate judgment interest | Medium | Moderate | Medium | Guide | Add verified worked examples and partial payments |
| daily interest on judgment calculator | Medium | Moderate | Medium | Federal calculator | Add per-diem/export workflows |
| post judgment interest partial payments | Medium | Moderate | High | Gap | Calculator feature after state model |
| UK late payment interest calculator | High | Hard | Medium | Calculator | Strengthen authority/backlinks |
| EU late payment interest calculator | Medium | Moderate | Medium | Calculator | Country-margin caveat and source links |
| statutory interest rate API | Low but commercial | Easier | High | API | Documentation, examples, licensing inquiry path |
| judgment interest rate API | Low but commercial | Easier | High | API | Publish stable examples and changelog |
| federal Prompt Payment Act interest rate | Medium niche | Easier | Medium | Gap | Future sourced rate + calculator cluster |

## Content and product gaps

| Gap | Why it matters | Priority | Effort |
|---|---|---:|---:|
| Verified state effective-date histories | Unlocks correct calculators and defensible long-tail pages | Highest | Substantial |
| Claim/amount/government/consumer branches | Prevents legally wrong “one rate fits all” output | Highest | Substantial |
| Partial payments and recoverable-cost events | Strong competitor feature and real professional workflow | High after rule model | Substantial |
| PDF/CSV calculation export | Makes tools useful for demand letters and file records | High after rule model | Moderate |
| Per-period calculation breakdown | Builds trust and supports long-duration variable rates | High after rule model | Moderate |
| State-specific worked examples and FAQs | Improves usefulness and long-tail coverage without thin copy | High after verification | Moderate |
| Search Console reporting | Reveals actual impressions, queries, CTR, and index coverage | High | Quick |
| Earned links from legal librarians/accountants | Authority is the hardest-to-copy SEO moat | High | Ongoing |
| Prompt Payment Act rate/tool | Adjacent official-source niche with commercial intent | Medium | Moderate |

## Prioritized action plan

### Quick wins before or immediately after deployment

1. **Completed 2026-07-19:** enabled **Always Use HTTPS**, deployed the documented response-header
   rule, and enabled HSTS after live verification.
2. Deploy the Phase 1 branch only after review/commit authorization. Impact: high; effort: low.
3. Submit the new sitemap in Google Search Console and Bing Webmaster Tools, then record baseline
   indexed-page and impression counts. Impact: high; effort: under one hour.
4. Confirm Google's certified consent flow for EEA/U.K./Switzerland traffic because AdSense is live.
   Impact: high compliance value; effort: low to moderate.

### Strategic investments for Phase 2 and beyond

1. Start with Florida, California, New York, and Texas, but publish each state independently only when
   its primary sources, history, branches, accrual, day count, rate behavior, and compounding pass.
2. Add partial payments, event timelines, period breakdowns, and export only to calculator-ready
   states; these are more defensible and useful than another generic article cluster.
3. Use Search Console query data to choose the next state rather than relying on assumed volume.
4. Build genuine authority through correction transparency, citations, public API examples, and
   outreach to legal-information professionals—not paid links or mass-produced guest posts.
5. Keep infrastructure static and inexpensive until traffic proves a bottleneck. Current performance
   does not justify paid hosting or a new database service.

## Verification record

- Pipeline tests: 34/34.
- Shared calculation tests: 10/10.
- Site data-contract tests: 2/2.
- MCP tests/smoke: 3/3.
- API conformance: 114 entity endpoints and 960 latest/history records.
- Dependency audit: 0 known vulnerabilities in site, pipeline, and MCP trees.
- Local static output: 191 HTML pages; 188 indexable, 3 intentionally noindexed.
- Local mobile Lighthouse: 100 accessibility, 100 best practices, 100 SEO, 100 agentic browsing.
- Live performance trace: 85 ms lab LCP, 0.0001 CLS, no measurable render-blocking savings, and no
  CrUX field data available.
