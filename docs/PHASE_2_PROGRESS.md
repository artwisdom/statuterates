# Phase 2 progress — demand-led state verification

**Started:** 2026-07-19
**Status:** Demand-led histories and Search Console page strengthening complete; calculators withheld
**Deployment status:** production verified 2026-07-26 (`76748cb`, `deploy-site` run 26)

## Demand-led order without publishing private account data

Authenticated Google Search Console evidence was reviewed read-only to prioritize the first state
upgrades. Texas, Nebraska, and Iowa were selected because the live site showed real demand while the
existing pages lacked the official history and legal detail needed to become durable search assets.
Kentucky, Maine, Georgia, Mississippi, Utah, and Florida followed as source-accuracy and
official-history upgrades. Existing pages already earning impressions were strengthened in place;
no thin statute-only doorway pages were created.
Private account metrics, queries, and index-coverage counts are intentionally not stored in this
repository.

The production site contains the verified implementations described below. The release was deployed
through the tested GitHub Pages workflow and verified through Cloudflare at https://statuterates.com.

## Texas

### Official sources reviewed

- [Texas OCCC current interest-rate page](https://occc.texas.gov/publications/interest-rates/)
- [Texas OCCC historical summaries](https://occc.texas.gov/publications/interest-rates/historical-interest-rate-summaries/)
- [Official OCCC postjudgment-rate history DOCX](https://occc.texas.gov/wp-content/uploads/2025/12/PostjudgmentInterestRate_History.docx)
- [Archived 2026 Texas Credit Letters](https://occc.texas.gov/wp-content/uploads/2026/07/Texas_Credit_Letters_2026-1.pdf)
- [Texas Finance Code Chapter 304](https://statutes.capitol.texas.gov/Docs/FI/pdf/FI.304.pdf)

The OCCC history document was rendered and visually inspected as well as extracted structurally.
Its table begins in September 1983. The archived 2026 letters fill February–July 2026, which were not
yet populated in the history document's current revision.

Verified core rules include the monthly OCCC rate and statutory floor/ceiling, the separate
interest-bearing-contract branch, accrual from rendition through satisfaction, annual compounding,
and the separate personal-injury/property-damage prejudgment provisions and exceptions in Chapter
304.

### Implemented and deployed

- Added all 515 official monthly observations from September 1983 through July 2026. Unchanged
  months are retained because the judgment month selects the locked rate.
- Added a robots-respecting, cache-first OCCC monitor for each newly published month.
- Added fail-closed parsing for the labeled rate, statutory range, and current publication month.
- Synchronized the Texas prejudgment reference while preserving its distinct legal scope.
- Added contiguous-history, post/pre consistency, and source-provenance validation.
- Added structured calculation metadata and source-specific page explanations.

## Nebraska

### Official sources reviewed

- [Nebraska Judicial Branch current judgment rate](https://nebraskajudicial.gov/rules/administrative-policies-schedules/judgment-interest-rate)
- [Nebraska Judicial Branch historical table](https://nebraskajudicial.gov/sites/default/files/judgment-interest-rate.pdf)
- [Neb. Rev. Stat. §45-103](https://www.nebraskalegislature.gov/laws/statutes.php?statute=45-103)
- [Nebraska Chapter 45 full text](https://nebraskalegislature.gov/laws/laws-index/chap45-full.html)

The complete court PDF was extracted and visually checked. It contains 275 exact change points from
January 1, 1987 through July 16, 2026, including the source's documented 2001–2002 gap. The data does
not invent values to fill that gap.

The current postjudgment rate is 5.970%. For judgments entered on or after July 20, 2002, §45-103
uses the first quarterly 26-week Treasury-bill auction plus two percentage points, with the court
notice effective two weeks after publication. Section 45-103.01 governs the general entry-to-
satisfaction accrual window. Prejudgment interest has separate liquidated-claim, contract, and
strict settlement-offer branches under §§45-103.02–45-104.

### Implemented and deployed

- Added all 275 published Nebraska change points and preserved their exact effective dates.
- Added a live Judicial Branch monitor with anchor, date, and rate validation.
- Added exact-history checks, including the formula-change anchor and intentional historical gap.
- Added structured postjudgment and prejudgment branch metadata and richer page explanations.
- Kept both Nebraska entities at `reference_only` because the universal day-count, compounding,
  partial-payment, and exception behavior is not deterministic enough for a dependable calculator.

## Iowa

### Official sources reviewed

- [Iowa Judicial Branch postjudgment-interest table](https://www.iowacourts.gov/iowa-courts/district-court/post-judgment-interest-table/)
- [Official 1982–2000 history scan](https://www.iowacourts.gov/static/media/cms/post_judgment_interest_rate_table_1_A923F446F2AE4.pdf)
- [Official 2001–2017 history table](https://www.iowacourts.gov/static/media/cms/post_judgment_interest_rate_table_2_D0E292E4AF18C.pdf)
- [Iowa Code §668.13](https://www.legis.iowa.gov/docs/code/668.13.pdf)
- [Iowa Code Chapter 535](https://www.legis.iowa.gov/docs/code/535.pdf)
- [Iowa Code Chapter 625](https://www.legis.iowa.gov/docs/code/625.pdf)

The inherited implementation treated Iowa as a federal weekly-average series. That was legally
wrong: State Court Administration publishes a monthly selection table for the one-year Treasury CMT
used by §668.13. The weekly model and its stale rows were removed.

Every page of both official history PDFs was rendered and visually reviewed. The 2001–2017 table and
the later official court table supply 302 exact selections from March 2001 through July 2026. The
1982–2000 PDF is an image-only scan with damaged and handwritten rows, so it is linked but not
digitized; uncertain OCR guesses are not acceptable legal-rate data.

The live court table supplied four additional official rows for April through July 2026. The July 9
row selects a 4.06% index and therefore confirms a 6.06% judgment rate. This supersedes and disproves
the earlier 6.02% H.15 estimate; the pipeline now purges that estimate from old exports and rejects it
if it ever reappears.

### Implemented and deployed

- Replaced the weekly derivation with the monthly Judicial Branch selection model.
- Added all 302 exact published selections to both the postjudgment and matching prejudgment series.
- Added a live court-table parser that degrades safely when the WAF blocks access.
- Added validation that rejects every legacy weekly Iowa method, checks exact official anchors,
  requires post/pre consistency, and protects the official 6.06% July row.
- Added source-specific page copy, titles, history labels, caveats, and structured legal branches.
- Kept Iowa at `reference_only` because day-count denominator, partial-payment allocation, structured
  judgments, and separate statutory paths remain unresolved for automated arithmetic.

## Kentucky

### Official sources reviewed

- [KRS 360.040 — interest on judgments](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=45719)
- [2017 Kentucky Acts chapter 17 (HB 223)](https://apps.legislature.ky.gov/law/acts/17RS/documents/0017.pdf)
- [KRS 360.010 — legal rate](https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=47989)
- [Official Kentucky appellate prejudgment-interest opinion](https://appellatepublic.kycourts.net/api/api/v1/publicaccessdocuments/2d3b5274367f7348db02a0e286f793cef3d6e859562960a3253fa37fe5ea07ea/download)

The enrolled 2017 Act shows the exact change from a 12% general judgment rate to 6% for judgments
entered on or after June 29, 2017. KRS 360.040 requires annual compounding and contains separate
branches for unpaid child support, written obligations, and unliquidated judgments. The current
statute records the earlier July 15, 1982 amendment date; the curated history intentionally begins
there instead of assigning undocumented rates to older judgments.

Kentucky's 8% legal rate is not a universal prejudgment award. Official appellate authority confirms
that unliquidated prejudgment interest can be denied or set below the legal rate, and that the court's
equitable discretion can include simple-versus-compound treatment.

### Implemented and deployed

- Replaced the fake July 2026 source-review-date row with the exact 12% and 6% statutory change points.
- Corrected the prejudgment reference to `up to 8%`, effective with the current statutory text, and
  separated liquidated, unliquidated, and written-agreement paths.
- Added validation that rejects the retired review-date placeholders and protects both legal anchors.
- Added source-specific Kentucky page content and structured calculation metadata.
- Kept both series `reference_only` because day count, payment allocation, court-selected terms, and
  all written-obligation and support branches are not deterministic.

## Maine

### Official sources reviewed

- [14 M.R.S. §1602-B — interest before judgment](https://legislature.maine.gov/statutes/14/title14sec1602-B.html)
- [14 M.R.S. §1602-C — interest after judgment](https://legislature.maine.gov/statutes/14/title14sec1602-C.html)
- [Maine Judicial Branch prejudgment chart (OTH-155)](https://mjbportal.courts.maine.gov/CourtForms/FormsLists/DownloadForm?strFormNumber=OTH-155)
- [Maine Judicial Branch post-judgment chart (OTH-156)](https://mjbportal.courts.maine.gov/CourtForms/FormsLists/DownloadForm?strFormNumber=OTH-156)
- [April 1, 2025 correction order](https://www.courts.maine.gov/adminorders/so-2025-judgment-interest-rates.pdf)

Both one-page court charts were rendered and visually inspected. They contain 24 annual values from
July 2003 through 2026. The general prejudgment formula is the prior year's last-full-week average
one-year Treasury CMT plus three points; post-judgment uses the same index plus six points. The
April 2025 standing order corrects an administrative error: the 2025 rates are 7.23% and 10.23%, not
the initially published 7.88% and 10.88%.

### Implemented and deployed

- Added every exact annual row to both Maine series and corrected the inherited prejudgment
  effective date from July 2026 to January 1, 2026.
- Added cross-series validation requiring the post-judgment chart to remain exactly three points
  above the prejudgment chart for every shared year.
- Added an independent H.15 reproduction of the statutory last-full-week formula. It verifies the
  official current row and can add a medium-confidence future-year provisional point only after the
  court-chart history ends; it can never relabel that calculation as court-published.
- Added validation for the corrected 2025 anchor, future provisional labeling, source separation,
  and fail-closed incomplete-week handling.
- Added detailed page copy covering written agreements, small claims, notice/filing accrual,
  continuance suspension, waiver, appeal, and the post-judgment principal-base rule.
- Kept both series `reference_only` because the statutes do not specify complete compounding,
  day-count, payment-allocation, and claim-input mechanics.

## Georgia

### Authoritative sources reviewed

- [Georgia General Assembly-authorized Code portal](https://www.lexisnexis.com/hottopics/gacode)
- [Federal Reserve Bank Prime Loan Rate series](https://fred.stlouisfed.org/series/PRIME)

The current version of O.C.G.A. §7-4-12 applies its Federal Reserve prime-plus-three scheme to civil
actions filed on or after July 1, 2003. The official Federal Reserve series supplies the exact dates
when prime changed. The general current result is 9.75%, based on the 6.75% prime rate effective
December 11, 2025. Prejudgment interest remains a composite rule: Georgia's 7% legal-rate provisions,
prime-plus-three demand provision, written agreements, and tort-demand rules do not collapse into one
universal percentage.

### Implemented and deployed

- Added all 59 exact current-scheme rate periods from July 1, 2003 through December 11, 2025.
- Added a live Federal Reserve monitor that validates every curated anchor before appending a later
  change, and fails closed on missing or conflicting history.
- Replaced non-authoritative Georgia citations with the legislature-authorized Code portal and the
  official Federal Reserve benchmark.
- Removed fake July 2026 source-review-date observations and added validation preventing their return.
- Added structured postjudgment and composite prejudgment metadata, while keeping both series
  `reference_only` until every claim branch and calculation convention is deterministic.

## Mississippi

### Authoritative sources reviewed

- [Mississippi Legislature-authorized Code portal](https://www.lexisnexis.com/hottopics/mscode/)
- [J.T.S. v. M.L.S., Mississippi Court of Appeals (Dec. 16, 2025)](https://law.justia.com/cases/mississippi/court-of-appeals/2025/2024-ca-00023-coa.html)

Mississippi does not impose one universal prejudgment rate. Under Miss. Code Ann. §75-17-7, a
judgment founded on a sale or contract uses the rate in the contract evidencing the debt. For other
judgments, the judge may select a fair rate and a fair accrual date, but not a date before the filing
of the complaint. The 8% legal contract rate in §75-17-1 can matter in particular disputes; it is not
a mandatory statewide prejudgment percentage. The current appellate decision cross-check confirms
the court's discretion and affirms a 4% simple-interest award in its particular context.

### Implemented and deployed

- Replaced the misleading universal 8% record with a nonnumeric `contract rate / court-set` rule.
- Updated human pages, JSON-LD, API output, rankings, and machine-readable summaries so the rule is
  never displayed or sorted as a universal percentage.
- Added narrowly scoped validation permitting a null numeric value only for this exact case-specific
  Mississippi series; all other rate observations must remain numeric.
- Removed the fake July 2026 source-review-date observation and added a regression guard.
- Kept the series `reference_only`; a calculator cannot safely infer the contract or judicial choice.

## Utah

### Official sources reviewed

- [Utah State Courts current judgment rates](https://www.utcourts.gov/en/court-records-publications/resources/interest-rates/interestrates.html)
- [Utah State Courts historical judgment rates](https://www.utcourts.gov/en/court-records-publications/resources/interest-rates/historic.html)
- [Utah Code §15-1-4](https://le.utah.gov/xcode/Title15/Chapter1/15-1-S4.html)

The State Courts table provides 34 exact annual rates from 1993 through 2026. For 2026, the general
rate is the January 1 federal postjudgment rate of 3.51% plus two points, or 5.51%. A qualifying
judgment under $10,000 involving goods or services uses the federal rate plus ten points, or 13.51%;
a lawful written contract can supply a different rate.

### Implemented

- Added every official annual row with the court's exact displayed precision.
- Added separate parsers for the current and historical court tables.
- Added integrity gates for every historical anchor and both current statutory formulas.
- Added a weekly fail-safe monitor that can append a new annual row only after the current and
  historical publications reconcile.
- Added full scope, accrual/rate-lock, branch, and history explanations to the rate and state pages.

## Florida

### Official sources reviewed

- [Florida CFO current and historical judgment rates](https://myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates)
- [Fla. Stat. §55.03](https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0000-0099/0055/Sections/0055.03.html)

The CFO publishes every distinct period from October 1, 1981 through the current quarter. The
current July 1, 2026 rate is 8.06%. Section 55.03 selects the rate in effect when judgment is
obtained, adjusts it annually each January 1, preserves written-contract rates, and excludes four
listed clerk-judgment categories from the annual adjustment.

### Implemented

- Added all 78 official effective periods without collapsing repeated quarterly values.
- Added an HTML parser for the current and historical tables, including legacy date ranges.
- Reconciled the oldest 360-day factor, the annual schedule's 365-day factors, and the quarterly
  schedule's leap-year factors without inventing extra precision.
- Added baseline, cadence, range, and changed-anchor validation before a new quarter can publish.
- Added a weekly fail-safe monitor and complete source-specific page explanations.

## Search Console page strengthening and legal corrections

- State and rate pages now lead with the year, exact rate/rule, effective date, authority, basis, and
  recorded-history depth while keeping their existing canonical URLs.
- Prejudgment pages now receive the same state/year title treatment as postjudgment pages.
- Washington's RCW 4.56.110 branches, Maryland §§11-106–11-107, Alaska's ADM-505 formula,
  Wisconsin §815.05(8), Oklahoma §727.1, Pennsylvania §8101, and Connecticut §§37-3a–37-3c now have
  fuller source-specific explanations.
- Search-demand regression contracts protect the Texas, Iowa, Nebraska, Washington, Oklahoma, Utah,
  Florida, Maryland, Wisconsin, Connecticut, state-table, and IRS/refund page language at build time.
- Every rendered page has a unique title, description, canonical, and H1; state calculators remain
  withheld.

## Automation and safety outcome

The weekly pipeline attempts official current updates for Texas, Nebraska, Iowa, Florida, and Utah, verifies
Georgia's exact history against the Federal Reserve PRIME feed, and independently reproduces Maine's
current annual formula from the official H.15 feed. Each live parser is strict about labels, dates,
ranges, and known historical anchors. A blocked page or unexpected format cannot silently become a
new legal rate: the refresh retains the last validated data, reports the condition, and leaves
calculators disabled. Iowa specifically retains court-published history and never substitutes an
H.15 estimate.

This creates durable search pages and historical API assets without taking on the legal and trust
risk of a calculator that only appears complete.

## Verification

- Pipeline: 78/78 tests pass.
- Shared interest engine: 10/10 tests pass.
- Site data contract: 2/2 tests pass.
- MCP server: 3/3 tests pass, including traversal protection and full smoke coverage.
- Full fetch → hydrate → validate → export: 114 entities and 2,303 observations, no warnings.
- API conformance: 114 entity endpoints and 2,417 latest/history records checked.
- Static build: 192 HTML pages; 189 indexable sitemap URLs; SEO metadata, internal links, and
  calculator-indexing gates pass.
- All 102 state-law entities remain `reference_only`; no unsafe state calculator is generated.
- Production: the Cloudflare-served priority pages, sitemap, HSTS, and 114-series/2,303-observation
  API were verified after the successful GitHub Pages deployment. Search Console accepted the
  refreshed sitemap and indexing validation requests; crawl/indexing changes remain under Google's
  control and should be reviewed after its reports update.

## Next work

The next source-hardening targets are additional demand-led official histories and stronger
controlling-law citations for official-secondary reproductions. Every future release should pass the
same test, validation, build, API-conformance, deployment, and live-site verification gate.
