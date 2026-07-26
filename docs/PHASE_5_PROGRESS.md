# Phase 5 progress — durable federal history and the first audited state calculator

**Started:** 2026-07-26  
**Status:** Implementation and local release gate complete; production deployment pending

## Why this phase

Search Console and traffic evidence favor strengthening pages that already answer judgment-interest
intent. Phase 5 therefore adds two durable tools instead of generating dozens of speculative state
pages:

1. Protect the federal calculator from the announced retirement of its inherited data-download
   transport and give it the complete modern §1961 history.
2. Release one state calculator only where the official history, supported legal path, arithmetic,
   source monitor, and dedicated renderer have all been reviewed: Florida.

This preserves the project's passive-income strategy—useful tool pages, unattended updates, and
compounding internal authority—without trading trust for URL count.

## Federal H.15 migration

The Federal Reserve Board’s July 16, 2026 announcement scheduled its older “Build Your Package”
option for removal during the week of November 9, 2026. The pipeline uses two official FRED series:

- `DGS1`: daily 1-year Treasury constant-maturity observations from January 2000 forward;
- `WGS1YR`: the independently published weekly average used as a mandatory cross-check.

The fetcher validates exact CSV schemas, every weekday/weekly calendar position, historical anchors,
freshness, observation counts, and complete cross-feed equality. Either request or any integrity
failure aborts before export. The stable `fed-h15` source ID is retained so a fresh CI database
hydrates one continuous provenance branch.

The derived CMT history contains 1,385 Monday-keyed weeks. The modern §1961 history contains 1,336
weeks beginning December 11, 2000, which is the rate week required for judgments entered when the
current formula took effect on December 21. Database validation requires one-to-one dates and values
between those modern post-judgment rows and the CMT series and rejects any calendar gap.

The public federal calculator now:

- supports judgments entered on or after December 21, 2000;
- selects only the exact preceding calendar week;
- refuses to substitute an older available rate;
- computes daily interest and annual compounding in the shared engine;
- explains the formula transition, source migration, exclusions, and full modern history; and
- keeps all visitor inputs inside the browser.

## Florida calculation contract

The dedicated Florida tool is intentionally narrower than the 1981-present reference table. It
supports only:

- a final ordinary Florida money judgment governed by Fla. Stat. §55.03;
- entered/filed by the clerk on or after July 1, 2011;
- the statutory CFO schedule rather than a written-contract or special rate;
- none of the listed clerk-entered categories under §§55.141, 61.14, 938.29, or 938.30; and
- no partial payment, amended judgment, renewal, tender, satisfaction, later fee/cost, or
  account-specific allocation event.

For that scope, the engine selects the CFO rate in force on the clerk-entry date and holds it through
December 31. Each later January 1 uses the exact CFO rate published for that date; April, July, and
October changes do not re-price an existing judgment during the year.

Interest is simple on principal only. The engine represents principal cents, rate hundredths, days,
and calendar-year denominators as exact integer fractions, sums unrounded periods, and rounds the
final result once. Leap-year periods use 366; other periods use 365. A test reproduces the official
DFS comparison fixture: $18,935,964.29 at 4.75% for 275 included days produces $677,674.06.

Florida's general sources do not establish one universal payment-boundary convention. The form
therefore exposes a visible choice to include or exclude the calculate-through date, defaults to the
plain-language included convention, and prints the selection, inclusive period dates, and exact day
count. It calls the output a reference estimate, never an official or court-ready payoff.

The latest CFO schedule is published through July 1, 2026. The calculator will not accept a new
judgment in an unpublished quarter and will not cross an unpublished January 1 reset. A new verified
CFO quarter automatically updates the metadata coverage gate; no future rate is guessed.

## Safe release architecture

The inherited dynamic mass-state calculator template was deleted. A state page can now exist only
when all three controls agree:

1. versioned entity metadata says the narrow calculation contract is `ready`;
2. that metadata names a supported dedicated renderer; and
3. the code-controlled release registry contains the same entity and renderer ID.

Florida is the only registry entry. Build verification fails if any unapproved state-calculator page
appears, if the Florida page is missing, if it falls below its content floor, if the core scope
language disappears, or if an advertisement renders before the tool.

The Florida rate page, Florida state hub, calculator index, federal calculator, and sitemap all link
to the new page. The calculator renders browser-local results with an auditable period schedule,
copy action, print/PDF stylesheet, privacy statement, and responsive controls.

Only a successfully fetched, complete official history may replace a prior database snapshot.
Current-value-only feeds merge new periods, and a monitored source outage preserves the last
committed history and calculator coverage metadata. Deploy validation hydrates and checks the exact
committed exports in an isolated database, including future official periods, instead of rebuilding
an older code baseline over them.

## Automation and verification

- Pipeline: 125/125 tests passed.
- Shared calculation engine: 36/36 tests passed.
- Site data and copy contracts: 7/7 tests passed.
- MCP server: 3/3 tests passed, including the six-tool smoke test.
- Full official refresh/export: 114 entities and 4,947 observations.
- API conformance: 114 entity endpoints and 5,061 latest/history records checked.
- Static build: 195 HTML pages.
- Indexable sitemap: 192 URLs.
- Build verification: unique titles/descriptions/canonicals, internal links, homepage reachability,
  depth floors, calculator allowlist, noindex exclusions, search-demand contracts, and ad order all
  passed.
- The federal export is approximately 1.1 MB and remains well below repository/hosting file limits.
- Pipeline changes now trigger deployment, and deployment runs pipeline tests plus an isolated
  hydrated-database validation before site publication.
- Monitored variable-rate copy derives its current rate, year, branch values, effective date, and
  history count from the selected observation. A 45-day workflow reminder opens before a published
  calculator's legal-review window expires, and IndexNow now runs only after deployment is live.

## Remaining after deployment

- Verify both calculators on the Cloudflare-served production domain at desktop and mobile widths.
- Confirm HTTP→HTTPS, HSTS, security headers, canonical/schema, one Cloudflare Analytics beacon,
  AdSense behavior, sitemap inclusion, no horizontal overflow, and no browser-console errors.
- Submit or inspect the new Florida URL in Search Console only after production is confirmed.
- Measure impressions, clicks, calculator engagement, and page RPM over several recrawls before
  selecting another state. Do not mass-create state pages.
