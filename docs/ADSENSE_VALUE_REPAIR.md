# AdSense value repair and review gate

**Decision date:** 2026-08-16

**Trigger:** AdSense site review returned “Low value content.”

**Status:** Foundational code repair is complete locally. Deployment verification is necessary, but
AdSense re-review remains blocked until the sitewide content-quality checkpoint below also passes.

## What is confirmed

- AdSense verified site ownership.
- `/ads.txt` carries the correct direct Google publisher relationship.
- Public `robots.txt` allows search and AI crawlers.
- Google supplied only the broad “Low value content” category; it did not identify a failed URL or
  reveal the crawl date. The exact reviewer cause therefore cannot be presented as fact.
- Before this repair, the AdSense loader appeared sitewide, including the real 404 and two noindex
  calculator placeholders that said their verification was in progress.

Google's relevant primary guidance:

- [Google Publisher Policies: low-value and replicated content](https://support.google.com/adsense/answer/10502938)
- [Preparing pages for AdSense](https://support.google.com/adsense/answer/7299563)
- [AdSense site-rejection guidance](https://support.google.com/adsense/answer/81904)
- [Fix policy issues and request a review](https://support.google.com/adsense/answer/7003627)
- [Google Search: helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google Search spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

## Rendered inventory diagnosis

The pre-repair build contained 195 HTML pages and 192 indexable sitemap URLs:

- 114 rate pages;
- 51 state hubs;
- seven long guides;
- eight calculator pages, including two unfinished noindex placeholders;
- three other noindex/error pages.

The valuable foundation is real: all seven guides are distinct and substantial, six calculators
provide working original utility, the About and Methodology pages disclose a large cited source
system, and the deeper state/federal histories provide useful versioned data.

The risk is concentrated:

- 165 of 192 indexable pages are state/rate templates.
- 87 of 114 rate series currently contain only one observation.
- At audit time, 36 state post-judgment pages combined one observation with no structured
  jurisdiction-specific rule analysis. Seventeen rendered below 300 visible main-content words.
- State hubs reuse a large amount of structural language and previously required an extra click to
  reach an official authority.

Word count is not the approval target and Google publishes no preferred word count. These figures
are inventory evidence: they show where a cited reference becomes too dependent on its template and
where original analysis or verified history is still unfinished.

## Repair implemented

1. **Ads are opt-in.** `BaseLayout.astro` defaults to no monetization. The sitewide AdSense account
   meta remains available for ownership verification, while the executable loader appears only on
   explicitly eligible pages.
2. **Thin pages stay useful but ad-free.** After primary-source upgrades to Tennessee, Ohio,
   Virginia, and New Mexico, 32 one-observation post-judgment pages remain without structured rule
   analysis. They keep their canonical, internal links, citations, API exports, and search
   eligibility, but cannot load Auto Ads or a manual unit.
3. **Unfinished routes are gone.** `/calculators/prejudgment-interest/` and
   `/calculators/state-judgment-interest/` no longer produce public 200 pages. They remain absent from
   the sitemap and return the site's real 404 until a reviewed calculation model is completed.
4. **Editorial accountability is visible.** Monetized guides, calculators, and rate pages identify
   StatuteRates Editorial, state the source/review boundary, link the editorial policy, and provide a
   page-specific correction path. No lawyer or professional credential is implied.
5. **Sources are easier to inspect.** State hubs directly link their official authorities. Guides
   show curated official authorities. The late-payment tool now cites GOV.UK, U.K. legislation,
   EUR-Lex, and the official EU country-rate table next to its scope and limitation explanation.
6. **One observation is not called history.** A single-row page says “Current recorded observation”
   and explicitly states that the record is not a complete historical series.
7. **Regression is impossible by accident.** The built-output verifier enforces the route allowlist,
   disables ads on noindex/error/legal/navigation/state-hub/shallow pages, requires the ownership meta
   whenever the loader exists, and rejects a resurrected unfinished calculator.
8. **Money tools fail closed.** The U.K. late-payment calculator refuses dates beyond its recorded
   half-year coverage. Its E.U. mode is explicitly an ECB-plus-eight minimum-framework benchmark,
   not a member-state entitlement, and points readers to the official country table.
9. **Inherited legal-data dates were corrected.** Virginia's 6% record now begins July 1, 2004, and
   New Mexico's 8.75% general branch begins June 18, 1993. Source-check dates are no longer presented
   as legal effective dates, and incomplete compounding claims were removed.

## Why the 32 remaining pages were not redirected or noindexed

Search Console evidence must choose consolidation. An exact-query state page that already earns
impressions should be preserved and strengthened; a page with no durable independent demand may
later be merged into its state hub with a permanent redirect. A blanket action would discard useful
citations, APIs, long-tail demand, and future history without evidence.

Each future content upgrade must use primary sources and cover the actual jurisdiction: scope,
accrual date, rate selection/lock, compounding/day count, exceptions, and available official history.
Generic prose cannot earn monetization eligibility.

## Public release and re-review checklist

The deployment must first prove all of the following:

- the exact release marker is live;
- both removed calculator URLs return 404 and contain no AdSense loader;
- the 404, privacy, terms, About, state hubs, and sampled shallow rate pages contain no loader or ad
  unit;
- completed guides/calculators and sampled rich rate pages retain the account meta and eligible
  loader;
- visible editorial/source changes render correctly on desktop and mobile;
- `ads.txt`, `robots.txt`, sitemap, canonicals, HTTPS/security headers, API, and machine-discovery
  files still pass the public-edge verifier;
- GitHub deployment and independent verification workflows pass.

That public checklist is necessary but not sufficient. Google says it may review every page of a
site, not only URLs that carry ad code. After deployment, a fresh rendered-inventory checkpoint must
confirm that the remaining indexable state/rate pages are defensible as original, useful references;
otherwise the next evidence-led pages must be researched or low-demand pages consolidated with a
permanent redirect. Only after both checkpoints pass—or after the owner knowingly accepts the
residual rejection risk—should the owner select “I confirm I have fixed the issues” and request
review. Do not repeatedly resubmit while deployment or content repair is incomplete.

## Next content queue

The next controlled research phase covers the 32 unfinished post-judgment pages. Search Console
demand should continue to choose the order; Oregon is the strongest remaining near-page-one
opportunity from the current snapshot. Sixteen jurisdictions remain prioritized research candidates:

Alabama, Arkansas, Delaware, Hawaii, Idaho, Louisiana, Minnesota, Montana, Nevada, New Hampshire,
North Dakota, Rhode Island, South Dakota, Vermont, West Virginia, and Wyoming.

Eight of those rate pages currently render below 300 visible words: Alabama, Idaho, Montana, Nevada,
North Dakota, South Dakota, Vermont, and Wyoming. The other eight remain in the queue because their
jurisdiction-specific rule analysis is still unfinished, not because of a literal word-count alarm.

These are a research queue, not permission to invent text or publish an unsupported calculator.
