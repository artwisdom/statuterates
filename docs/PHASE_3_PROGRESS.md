# Phase 3 progress — indexing, automation, and Alaska official history

**Started:** 2026-07-26  
**Status:** Release candidate verified locally; production deployment pending

## What the audit found

The previous release is fast, technically indexable, and already monetization-enabled. The next
constraint is Google discovery and trust, not raw page speed or a lack of page count.

- A production Texas rate page measured 85 ms lab LCP, 1 ms TTFB, and 0.00 CLS. There is no CrUX
  field dataset yet.
- Mobile audits scored 100 for accessibility, SEO, and agentic browsing. The best-practices score of
  77 is explained by third-party AdSense cookie/DevTools findings, not first-party code.
- Google AdSense Auto Ads is loading in production. Auto Ads requires the account code already on
  the site; a manual ad unit would additionally require a real slot ID from AdSense. No slot was
  invented and no extra script was added.
- All rendered pages have unique titles, descriptions, canonicals, and H1s. The remaining SEO
  opportunity is stronger discovery of existing useful pages plus deeper primary-source assets,
  not mass generation of thin state/statute variants.
- Several sitemap pages had relatively few inbound links even though they were reachable. State
  hubs now form an additional crawl path, and the underlinked statutory-interest guide has a
  contextual homepage link.

This follows Google's guidance that a sitemap helps discovery but does not guarantee indexing, and
that ordinary crawlable internal links and genuinely useful content still matter.

## Alaska official history

### Official sources reviewed

- [Alaska Court System form ADM-505](https://public.courts.alaska.gov/web/forms/docs/adm-505.pdf)
- [Alaska Stat. §09.30.070](https://www.akleg.gov/basis/statutes.asp#09.30.070)

ADM-505 publishes the same annual rate schedule for general pre- and post-judgment interest,
selected by the year the judgment is entered. The verified table contains 30 annual selections from
the August 7, 1997 statutory transition through January 1, 2026. The form separately describes an
older complaint-date transition, so the implementation does not flatten that branch into the
judgment-year table.

### Implemented

- Expanded both Alaska series from one current observation to all 30 official annual values.
- Corrected the inherited prejudgment pseudo-effective date from January 2 to January 1. January 2
  is the formula's benchmark-selection date, not the table's annual effective date.
- Added structured rate-lock, accrual, contract, and special-statute metadata while keeping both
  calculators `reference_only`. Day count, compounding, partial-payment allocation, and every legal
  branch are not complete enough for safe automated case calculations.
- Added a live weekly ADM-505 monitor using Mozilla PDF.js. It verifies every committed anchor and
  accepts only contiguous annual extensions published by the court.
- Added a durable migration that removes the superseded January 2 row from old exports and local
  databases so it cannot return.

## Automation and sandboxing

- Binary sources now use the same honest user agent, robots check, three-second host throttle,
  retry/backoff, two-day cache, and per-source fetch cap as text sources.
- The robots evaluator now uses the advertised `StatuteRatesBot` token instead of the project's old
  internal name.
- Alaska PDF parsing is limited to 5 MB and one to three pages, disables PDF JavaScript evaluation,
  and stops on parser errors.
- An outage, wrong content type, redesigned PDF, changed historical value, missing year, implausible
  future year, or invalid rate retains the committed verified baseline rather than publishing an
  estimate.
- Annual schedules use an annual freshness threshold. A January 1 rate is not mislabeled stale in
  late summer when the live source was just rechecked.

## Organic-search safeguards

- Every sitemap URL must be reachable from the homepage through crawlable HTML links.
- Every rate page must retain at least 200 visible words and every state hub at least 250. These are
  regression alarms for missing data/template failures, not word-count ranking claims.
- Every state hub links to the alphabetically previous and next state plus the complete state index.
- The homepage links contextually to the statutory-interest guide.
- Alaska's high-value title, 30-point history, 1997 transition, and monitoring explanation are
  protected by build-time search-demand contracts.
- Rate and hub structured data/sitemap dates can use a manually recorded substantial editorial
  modification date without creating build-date churn.

## Verified release candidate

- Full live source fetch, hydration, validation, and export: 114 entities, 2,361 observations, no
  validation errors and no warnings.
- Pipeline: 84/84 tests.
- Shared interest engine: 10/10 tests.
- Site data contract: 2/2 tests.
- MCP server: 3/3 tests, including its six-tool smoke test.
- Static site: 192 HTML pages and 189 indexable sitemap URLs.
- API: 114 JSON and 114 CSV entity endpoints; 2,475 latest/history records.
- Build verification: unique search metadata, internal links, homepage reachability, content floors,
  and calculator indexing gates all pass.

## Next highest-return work

1. Let Search Console recrawl this stronger release and use fresh query/page evidence to choose the
   next state history. New Jersey is promising, but its court PDF blocks ordinary automated fetches;
   the project will not evade that restriction or publish guessed history.
2. Continue one official, demand-proven state history at a time. Avoid mass thin page expansion.
3. Keep Auto Ads while traffic is still developing. Consider a manual in-content ad unit only after
   AdSense page-level revenue data shows a clear opportunity and a real slot ID is available.
4. Keep state calculators withheld until an individual state's full legal and arithmetic contract
   passes the existing safety gate.

This phase spends no new money and does not require an owner action.
