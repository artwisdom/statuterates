# Evidence-gated roadmap toward 100

**Planning baseline:** 74/100 composite readiness from the August 30, 2026 project review.

This score is an internal prioritization aid, not a prediction of rankings or income. Engineering,
data quality, crawlability, safety, and unattended operation are largely controllable. Search-engine
authority, traffic, AdSense approval, ad rates, and revenue depend on external systems and cannot be
made 100/100 by code alone.

## Scorecard rules

| Area | What a high score requires | Evidence required before calling it complete |
|---|---|---|
| Data accuracy and legal safety | Official-source history, explicit date semantics, complete supported branches, fail-closed validation | Source receipts, fixtures, validator coverage, and exact calculator tests |
| Automation and reliability | Scheduled refresh, idempotency, bounded retries, stale-data alarms, deployment handoff, recovery path | Successful scheduled runs, failure simulation, deduplicated alert, and runbook |
| Technical SEO and AI discovery | Canonicals, structured data, sitemap, crawl access, fast rendered HTML, linked machine formats | Build checks plus public-edge checks; provider acceptance is recorded separately |
| Content usefulness | Distinct, source-backed answers on pages with demonstrated demand; no doorway inventory | Search Console evidence, primary-source review, content-depth checks, and internal-link tests |
| Security and maintainability | Least-privilege automation, dependency monitoring, protected release path, documented disclosure | CI receipts, dependency/security scans, branch-rule evidence, and recovery test |
| Authority and distribution | Legitimate citations and relevant referring domains earned by a useful citable asset | Search Console/link evidence; submissions alone do not count as links |
| Monetization | Policy-compliant useful inventory, good tool UX, approval, and measured RPM | AdSense dashboard evidence and revenue reports; eligibility code is not approval |

## Now — protect correctness and remove operational risk

Target: bring controllable engineering categories into the 90–95 range before expanding inventory.

1. **Ship the federal date-semantics repair.** Keep each Treasury observation on its H.15 source
   week and each federal post-judgment observation on the following judgment-applicability week.
   Release only after the full pipeline, shared engine, API, MCP, site build, and public-edge checks
   pass against the exact commit.
2. **Harden the weekly refresh.** Run Wednesday at 12:00 UTC so a Monday holiday and Tuesday H.15
   release do not create an avoidable race. Reject a weekly input that is older than the allowed
   source window; never estimate or carry a missing federal week. Keep upstream fetch and parsing in
   a read-only job, and cross only a validated data artifact into a fresh commit job.
3. **Add read-only pull-request CI and repository security hygiene.** Test every interface, use
   least-privilege workflow permissions, enable supported dependency/code scanning, document private
   vulnerability reporting, and add a lightweight public-health monitor. Apply branch rules only
   after confirming the refresh bot can still perform its narrow validated commit path.
4. **Make documentation mechanically truthful.** Keep current counts and date semantics tied to
   generated artifacts; preserve dated milestone reports as historical receipts rather than silently
   rewriting them.

Exit gate: all local suites and builds pass, generated exports are deterministic except for explained
source/provenance updates, the production deployment matches the approved commit, three sampled rate
pages preserve their pre-release values except for the intended federal week-label correction, and a
manual refresh run passes after deployment.

## Next — deepen pages already earning impressions

Target: raise content usefulness and organic-growth readiness without creating thin URLs.

1. Use finalized Search Console page/query pairs to strengthen existing winners. The current research
   queue is Texas, Tennessee, Washington, and Arizona; ordering must be refreshed from current data.
2. Add only primary-source-backed substance: Texas branch navigation and historical-tool handoff,
   Tennessee official six-month history if the complete court table can be verified, Washington rule
   branches, and Arizona scope/exceptions. Preserve strong pages such as Maine unless new evidence
   identifies a real weakness.
3. Link historical pages directly into a preselected lookup experience so visitors can act on the
   period they searched for. Do not release another calculator until its legal scope, rate schedule,
   day count, compounding, payment allocation, and exceptions pass the Florida-grade contract.
4. Publish one citable aggregate data package only after schema and provenance checks pass: a
   50-state reference CSV, all-observations CSV, machine-readable data-package manifest, checksums,
   and citation metadata. Keep raw machine resources outside the HTML sitemap.

Exit gate: every changed claim cites an official source, no new indexable route is created without
measured demand and unique utility, build/link/schema checks pass, and Search Console is given a full
28-day comparison window before another broad content change.

## Later — earn authority, approval, and revenue

Target: improve the externally controlled categories with repeatable evidence rather than activity
counts.

1. Offer the citable dataset to a short, relevant list of legal-research, court-resource, librarian,
   and developer directories. No paid-link schemes, mass outreach, or fabricated endorsements.
2. Measure relevant referring domains, non-brand impressions, qualified calculator use, returning
   visitors, and API/download use. A submitted URL or accepted ping is not traffic, indexing, or a
   backlink.
3. Request AdSense review only after the current useful inventory is deployed, the sitewide quality
   checkpoint passes, and sufficient recrawl time has elapsed. Keep unfinished, shallow, legal, error,
   and noindex routes ad-free. Approval does not prove meaningful revenue.
4. Optimize ads only from measured page-level RPM and user-experience data. Protect calculators and
   source tables from intrusive placements; never trade trust or search usefulness for short-term ad
   density.
5. Consider paid/licensed API features only after repeat usage demonstrates demand. Preserve a useful
   free reference layer and keep costs capped, observable, and reversible.

External outcome goals should be tracked separately: relevant referring domains, indexed-page share,
28-day clicks/impressions, AdSense status, page RPM, monthly revenue, and operational cost. These can
move the business score toward 100, but none should be reported as achieved without provider or
revenue evidence.

## Permanent anti-goals

- No mass-generated state calculator or statute doorway pages.
- No rate, rule, authority, indexing, backlink, approval, traffic, or revenue claim without evidence.
- No guessed legal branch, invented historical date, stale-rate carry-forward, or silent source
  substitution.
- No deployment from an unverified commit and no broad Cloudflare/GitHub permission expansion.
- No promise that a technical release will produce rankings or passive income.

## Review cadence

- Every Wednesday: automated source refresh and fail-closed validation.
- After any growth release: exact-commit production verification and a 28-day observation window.
- Monthly: compare Search Console, analytics, uptime, referring domains, AdSense status, and operating
  cost; move an item forward only when the evidence gate is met.
- Semi-annually, or before expiry: re-review every released calculator's legal contract. Florida's
  current review expires January 26, 2027 unless reverified.
