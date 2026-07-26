# Phase 4 progress — Form 1040 penalties, interest, and rule monitoring

**Started:** 2026-07-26
**Status:** Implemented and locally verified; not yet deployed

## Why this phase

The existing IRS calculator served underpayment and refund-interest searches well, but deliberately
excluded penalties. Phase 4 adds the higher-intent Form 1040 penalty tool without weakening the
separate refund calculator or pretending that a public calculator can reproduce every event on an
IRS account transcript.

## Calculation contract

The new `/calculators/irs-penalty-and-interest/` page is limited to tax shown on an individual
original Form 1040. It models:

- failure to file at 5% for each month or partial month, normally capped at five months, coordinated
  with failure to pay during overlapping months;
- the indexed minimum filing penalty only when the return is **more than** 60 days late and only up
  to the unpaid filing-penalty base;
- failure to pay at the standard 0.5% monthly rate, with optional dated branches for a qualifying
  0.25% installment-agreement rate and the 1% rate after the applicable intent-to-levy period;
- separate original payment and extended filing deadlines;
- dated partial tax payments, which reduce later tax-interest and payment-penalty bases without
  rewriting the original filing-penalty base;
- quarterly §6621 underpayment rates with §6622 daily compounding on unpaid tax;
- interest on the final failure-to-file penalty from the applicable filing deadline; and
- month-by-month failure-to-file and failure-to-pay breakdowns, the quarterly rates used, assumptions,
  exclusions, and a printable input-and-results summary.

The interest engine now refuses to carry the latest known IRS rate into a quarter the IRS has not
published. This is intentional: waiting for the official quarter is safer than returning a plausible
but unsupported number.

Failure-to-pay-penalty interest is not calculated. The IRS starts that interest from an
account-specific notice, assessment, or 23C date, which the public inputs do not establish. The page
labels the exclusion prominently and calls the result a planning estimate, never an official payoff.
Estimated-tax additions, audit deficiencies, corporations, payroll/deposit penalties, relief
decisions, special postponements, and other account-specific allocation issues are also outside the
contract.

## Automatic Exemption from Penalty

The official IRS administrative-relief page added a new Automatic Exemption from Penalty (AEP)
program beginning in summer 2026 for potentially eligible 2025 tax-year and later original returns.
The calculator displays a separate comparison in which covered filing and payment penalties are
removed while tax and tax interest remain.

That comparison is conditional. The tool does not ask users to self-certify eligibility and never
states that AEP applies; only IRS records and the resulting IRS notice can confirm it.

## Official rule monitoring

The calculation uses committed, reviewable constants rather than scraping current page prose
directly into the math. A weekly integrity monitor fetches five official IRS sources through the
shared robots, cache, throttle, retry, and fetch-ceiling layer:

1. [Failure-to-file penalty](https://www.irs.gov/payments/failure-to-file-penalty)
2. [Failure-to-pay penalty](https://www.irs.gov/payments/failure-to-pay-penalty)
3. [Interest](https://www.irs.gov/payments/interest)
4. [Administrative penalty relief](https://www.irs.gov/payments/administrative-penalty-relief)
5. [Internal Revenue Manual 20.1.2](https://www.irs.gov/irm/part20/irm_20-001-002r)

The monitor checks calculation-critical anchors: rates, caps, partial-month treatment, penalty
coordination, the more-than-60-day boundary, the indexed minimum table, penalty-interest start
events, and the AEP scope. Any missing or changed anchor fails the refresh for human review. Pipeline
validation also requires the structured penalty rules, all IRS rate categories, quarter continuity,
and current published-quarter coverage before export.

## Search architecture

- `/calculators/irs-penalty-and-interest/` serves individual late-filing and late-payment intent.
- `/calculators/irs-interest/` remains the dedicated personal/corporate underpayment and refund tool.
  It retains all four selectable interest series and now visibly links users with penalties to the
  new calculator.
- The personal `irs-underpayment` rate page points to the Form 1040 tool. Corporate and overpayment
  rate pages still point to the interest/refund calculator.
- The calculator index, homepage, companion
  `/guides/irs-penalties-explained/` page, related IRS pages, and sitemap form an ordinary crawlable
  internal-link cluster.
- WebApplication, FAQ, and breadcrumb structured data match visible page content. Build-time demand
  guards protect the calculator title, filing rule, AEP explanation, omitted
  failure-to-pay-penalty interest, and “estimate, not an IRS payoff” language.

## Automation and local verification

- Changes under `shared/` now trigger the deploy workflow.
- The deployment gate runs the shared calculation suite in addition to pipeline and site tests.
- Pipeline: 94/94 tests.
- Shared calculation engine: 22/22 tests, including one-day lateness, on-time filing,
  last-day-of-month and payment-start boundaries, the exactly-60 versus more-than-60-day boundary,
  partial payments, filing extensions, installment/levy transitions, penalty caps, quarter changes,
  and unpublished-quarter refusal.
- Site data contract: 2/2 tests.
- Full pipeline/export: 114 entities and 2,361 observations.
- Static build: 194 HTML pages and 191 indexable sitemap URLs.
- Build verification: unique search metadata, valid internal links, homepage reachability, content
  floors, calculator indexing gates, and Phase 4 search-demand contracts all pass.

Deployment and production verification are intentionally not recorded here until the release clears
the hosted workflow and the Cloudflare-served pages are checked directly.
