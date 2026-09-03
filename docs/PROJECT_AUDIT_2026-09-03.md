# StatuteRates project audit — September 3, 2026

## Executive conclusion

StatuteRates is a strong early asset and should continue. It is already much more defensible than a
typical programmatic SEO site: source provenance, static rendered pages, complete federal histories,
selected deep state histories, tested calculators, machine-readable APIs, RSS, automated refreshes,
and fail-closed release gates are real advantages.

It is not yet a proven passive-income business. The latest finalized search evidence is encouraging,
but absolute traffic is still early; relevant external authority is weak or unverified; AdSense is
pending; and no page RPM or revenue evidence is available. The rational strategy is to protect
quality, deepen demonstrated winners, and measure commercial results—not multiply shallow pages.

## Evidence snapshot

- Production commit at audit time: `ebce83f324e353df65c04fba18eea1943141158d`.
- Public release marker: `33703000224-1`.
- Dataset: 114 series and 5,518 observations.
- Site: 195 generated HTML pages, including the real 404; 194 canonical sitemap URLs.
- Machine surfaces: 114 JSON entity endpoints, 114 CSV entity endpoints, aggregates, OpenAPI, MCP,
  RSS, `llms.txt`, and `llms-full.txt`.
- Latest finalized private Search Console comparison, July 25–August 21 versus June 27–July 24:
  clicks 55 to 122, impressions 4,246 to 9,344, CTR 1.3% to 1.3%, and average position 13.4 to 23.0.
  This proves growing discovery and clicks, while also showing that broader impressions arrived at
  weaker average positions. Tennessee judgment rate was the largest page-level click gainer.
- Submitted sitemap snapshot: 194 discovered URLs; 178 indexed and 14 not indexed among submitted
  URLs. The larger all-known exclusion report includes intentional redirects, canonicals, noindex
  machine resources, and the real 404 and must not be mistaken for 128 broken HTML pages.
- Lab performance on the homepage: LCP 265 ms, TTFB 1 ms, CLS 0.00; Lighthouse scored 100 for
  accessibility, SEO, and agentic browsing. No CrUX field sample was available. Best Practices 77
  was attributable to AdSense/third-party browser findings in the trace, not a detected first-party
  functional failure.
- AdSense on September 3: ownership verified, review requested August 23, status `Getting ready`, no
  current policy detail shown. European and U.S. state consent messages are active. Public
  `/ads.txt` is correct; the dashboard's `Not found` value is a stale crawler indicator until Google
  rechecks it.
- GitHub: production health, deployment, refresh, and CodeQL runs are green. Secret scanning and push
  protection are enabled. Vulnerability alerts, automated security fixes, protected `main`, and
  private vulnerability reporting are not currently evidenced as enabled.

## What the September candidate changes

This work is local until it is approved, pushed, deployed, and verified at the public edge.

### Content and search integrity

- Repairs seven damaged or blank source-backed prejudgment explanations: Alabama, California,
  Nevada, New York, North Carolina, Ohio, and Virginia.
- Removes hidden generated FAQ structured data from rate pages. The two legitimate FAQ pages now
  render the exact questions and answers represented in their markup.
- Prevents duplicated rate-hero labels after Unicode/whitespace normalization.
- Adds build alarms for those regressions and for known truncated fragments.
- Makes prejudgment ad eligibility require complete visible applicability, accrual, and compounding
  text instead of treating the page category itself as sufficient value.
- Deduplicates the repeated Alaska source presentation on About and Methodology pages.

### Automation and security

- Makes source collection retry and then fail closed when robots.txt is unavailable through network
  failure, HTTP 429, or server error.
- Applies one absolute deadline across response headers and the complete streamed body, including
  fail-closed handling for a stalled robots body whose cancellation hook never returns.
- Rechecks destination robots policy and host throttling at each data redirect, caps redirects at
  five, caps robots at 512 KiB and data bodies at 10 MiB, expires robots decisions after 24 hours,
  and charges real retries/redirects against source request budgets.
- Raises the shared HTTP layer from 43.04% to 81.72% line coverage through deterministic network-free
  tests.
- Updates the MCP production lockfile from two known transitive advisories to zero reported npm
  advisories.
- Adds the complete official Tennessee general judgment-rate history from July 2012 through July
  2026 only if its exact 29 rows, snapshot checksum, entry-date semantics, and release fixtures pass.
  It does not enable a Tennessee calculator or automated guesswork.

## Why this is the right amount of change now

Google's current guidance asks whether content is created primarily to help people, demonstrates
first-hand expertise or sourcing, and gives visitors a satisfying answer. It does not provide a
minimum word count or reward page multiplication. Its structured-data rules also require markup to
represent content visible to readers. The September candidate fixes concrete violations of those
principles while preserving URLs and numerical rate values.

Google also states that the same foundational SEO practices apply to AI features. StatuteRates
already exposes accessible server-rendered text, official citations, canonical URLs, Dataset
metadata, APIs, feeds, a sitemap, and unrestricted verified crawler access. Additional invented
AI-only schema or crawler-specific pages would add risk without evidence of benefit.

Relevant guidance:

- [Google: creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: structured data general guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google: AI features and your website](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
- [Google: preparing pages for AdSense](https://support.google.com/adsense/answer/7299563)

## Highest-return remaining opportunities

1. **Prove this candidate in production.** This removes known quality/security defects; it does not
   claim rankings or revenue.
2. **Mechanize manual-source freshness.** The largest controllable data risk is a legally changed
   state rate whose manually reviewed page still looks plausible.
3. **Add high-risk browser journeys to CI.** Static verification is strong, but calculator inputs,
   result tables, copy/print actions, and mobile interaction deserve a real browser gate.
4. **Create one licensable/citable data package after a rights review.** A versioned manifest,
   checksums, complete observations, and citation metadata can earn legitimate links and reuse. The
   rights decision must precede publication.
5. **Strengthen only demonstrated winners.** Tennessee is the current first candidate; future work
   should come from the next finalized page/query evidence, not a preconceived 50-state expansion.
6. **Close GitHub provider gaps.** Dependency alerts/security updates and release protection improve
   unattended safety but require a separate owner-authorized provider change.
7. **Let AdSense finish.** Repeated resubmission now would not accelerate review. After a decision,
   use real pageviews, RPM, and revenue to choose ad experiments or the next network.

## Income reality

The site has a plausible path to meaningful revenue because legal/financial reference intent can be
valuable and the marginal serving cost is very low. It is not possible to responsibly convert early
Cloudflare visitors or Search Console clicks into a fixed income forecast. Until AdSense approves and
serves ads, advertising revenue can remain zero. After approval, the only defensible baseline is:

`monthly monetized pageviews / 1,000 * actual page RPM`

Retirement-level income requires either very large recurring search volume, unusually strong RPM,
valuable paid/API demand, or a combination. The code can maximize reliability, usefulness, and
conversion opportunities; it cannot guarantee those external outcomes. The scorecard and roadmap in
`docs/ROADMAP_TO_100.md` deliberately track each layer separately.
