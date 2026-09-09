# StatuteRates risk register

**Reviewed:** 2026-09-08

This register separates controllable product quality from externally controlled outcomes. A passing
build does not prove indexing, rankings, backlinks, AdSense approval, RPM, or revenue. Likewise, an
accepted crawl or IndexNow request is not a search visit. Unknown provider evidence is recorded as
unknown rather than zero.

## Current business baseline

- StatuteRates has demonstrated early organic demand, but the latest finalized private comparison is
  still small in absolute terms: 122 clicks and 9,344 impressions in the July 25-August 21 window.
- AdSense currently shows `Getting ready`; a review was requested August 23. Approval, ad serving,
  page RPM, and StatuteRates revenue are not yet verified.
- There is no defensible fixed income forecast. If ads are approved, the calculation is
  `monetized pageviews / 1,000 * measured page RPM`; Cloudflare unique visitors are not monetized
  pageviews.
- API, MCP, RSS, and licensing are useful distribution options, but no paid demand is assumed.

## Risk table

| # | Risk | Likelihood | Impact | Current mitigation | Leading indicator / next gate |
|---|---|---|---|---|---|
| R1 | Organic visibility grows but rankings and clicks do not compound | Medium | High | Fast rendered pages, exact intent coverage, source citations, strong internal linking, and private finalized-window reporting | Two comparable 28-day Search Console periods; non-brand clicks, CTR, and landing-page gains |
| R2 | Thin or damaged templated content undermines trust or AdSense review | Medium | High | Visible-content/schema parity, minimum rendered-depth checks, selective ad eligibility, correction channel, and fail-closed legal-copy checks | AdSense decision; build alarms; sampled rendered-page review |
| R3 | An official source changes layout, blocks automation, or publishes late | Medium | High | Robots-aware throttled fetches, bounded retries, immutable last-good exports, strict parsers, and deduplicated failure issues | Refresh failure, stale-source age, or changed source checksum |
| R4 | A legal rate or date is numerically plausible but uses the wrong legal branch | Low-Medium | Very high | Official-source provenance, explicit effective-date semantics, reference-only defaults, calculator release registry, and fixture tests | Source/court mismatch, correction report, or invariant failure |
| R5 | Old manually reviewed state references become stale without a value change | Medium | High | Phase C1 registers all 102 active sources, warns 14 days before due, and maintains one reminder issue | Verify the first natural warning-window lifecycle on the September 23 run |
| R6 | External authority remains weak even though the product is technically good | High | High | Citable histories, CSV/JSON, OpenAPI, RSS, citation tools, and transparent methodology | Verified relevant referring domains and independent citations |
| R7 | AdSense remains pending or rejects the site again | Medium | High | Ads are limited to 113 eligible pages in the current build; legal/error/noindex/shallow pages are excluded; CMP messages are active | AdSense approval status, ads.txt recrawl, policy detail, measured serving |
| R8 | Ad density damages calculators, trust, or Core Web Vitals | Low-Medium after approval | Medium-High | Browser-local tools render before ads, slots reserve space, and Phase C1 tests eligible/ineligible routes with blocked external requests | Field CWV, engagement, RPM, and page-level exclusion experiments after approval |
| R9 | Supply-chain or provider configuration leaves a preventable security gap | Medium | Medium-High | Locked dependencies, CodeQL, secret scanning and push protection, least-privilege Actions; Phase C2 adds a separate pinned machine-contract lock and clears the September 8 Astro/Hono advisory set | Keep all four npm trees at zero known advisories; enable GitHub dependency graph/security updates without auto-merging upgrades; design protected release checks around the refresh bot |
| R10 | Robots/redirect/network behavior permits an unsafe source fetch | Medium until hardening ships | High | Central shared fetch layer and per-source caps | Mocked 5xx/network/redirect/oversize tests and successful hosted refresh |
| R11 | A platform or GitHub-account outage hides both site and monitor failure | Low | High | Static portable build, six-hour GitHub health, Phase C2 independent-heartbeat hooks, retained artifacts, and validate-first manual recovery | Activate the outside monitor, obtain heartbeat receipts, and pass a hosted validate-only recovery rehearsal |
| R12 | Broad page expansion creates doorway inventory without demand | Medium | High | Search Console-led queue, 194-URL sitemap freeze, and no generic state-calculator rollout | New URL requires measured intent, unique utility, primary sources, and an explicit release gate |
| R13 | An automatic or mistaken rollback restores stale legal data | Low after Phase C2 | Very high | No automatic rollback; exact source/run marker, safe archive validation, full owner confirmation, shared publication lock, and post-restore public check | Publish Phase C2 and pass a validate-only rehearsal; reserve real restore for a confirmed incident |

## Pre-committed decisions

1. **Do not broaden inventory because one short period slows down.** First confirm a technical issue,
   then compare two finalized 28-day periods, then improve an existing page whose query/page evidence
   identifies a real gap.
2. **Do not release a state payoff calculator from a headline rate.** It needs complete rate history,
   legal branches, accrual, date convention, compounding, payments, exceptions, a dedicated renderer,
   and exact fixtures.
3. **Do not repeatedly resubmit AdSense.** Wait for the pending review. If rejected, use the supplied
   reason, repair the relevant inventory, verify production, and submit once.
4. **Do not promise revenue from traffic counts.** Record approval, monetized pageviews, RPM, and net
   revenue separately from visits and impressions.
5. **Do not mass-outreach or buy links.** Publish a source-worthy asset only after reuse rights are
   explicit, then pursue a small relevant list of court, law-library, legal-aid, and developer
   resources.

## Reassessment triggers

- Weekly: source refresh, validation, deployment handoff, and public health.
- Monthly: finalized Search Console windows, Cloudflare analytics, relevant referring domains,
  AdSense status, page-level engagement, operating cost, and confirmed revenue.
- Quarterly: manually reviewed state sources, calculator legal contracts, dependency/provider
  security settings, and recovery documentation.
- Strategy pivot: only after at least two clean finalized periods show sustained decline or flat
  qualified demand with no technical/indexing cause and focused winner-page improvements also fail.
  The dataset and engine remain reusable; a short-term traffic dip is not a kill signal.
