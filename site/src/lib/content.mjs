// Original editorial copy per rate series (written here, not copied from any source). Keeps each
// page substantive for readers and search engines, and states plainly what the number means and how
// it is sourced/derived. `q` supplies the plain-language question used by page metadata and copy.

import { removeTruncatedFragments } from '../../../shared/text-quality.mjs';

export const SERIES_COPY = {
  'irs-underpayment': {
    tagline: 'What the IRS charges on unpaid federal tax.',
    q: 'What is the current IRS underpayment interest rate?',
    body: `The IRS underpayment rate is the interest the IRS charges individuals and businesses on tax they
paid late or underpaid. Under Internal Revenue Code §6621 it equals the federal short-term rate plus 3
percentage points, and it is reset every calendar quarter — so a figure that was right last quarter is
often wrong today. This page tracks the published value each quarter with its effective date.`,
  },
  'irs-overpayment-noncorporate': {
    tagline: 'What the IRS pays individuals on refunds/overpayments.',
    q: 'What is the current IRS overpayment interest rate for individuals?',
    body: `The non-corporate overpayment rate is the interest the IRS pays individual taxpayers when it holds
an overpayment (for example, a delayed refund). It is set quarterly under §6621 and, for non-corporate
taxpayers, equals the federal short-term rate plus 3 percentage points.`,
  },
  'irs-overpayment-corporate': {
    tagline: 'What the IRS pays corporations on overpayments.',
    q: 'What is the current IRS corporate overpayment interest rate?',
    body: `The corporate overpayment rate is the interest the IRS pays corporations on overpaid federal tax.
It is set quarterly under §6621 and is generally one percentage point below the equivalent non-corporate
rate (federal short-term rate plus 2 percentage points).`,
  },
  'irs-large-corporate-underpayment': {
    tagline: 'The higher rate on large corporate tax underpayments.',
    q: 'What is the current IRS large corporate underpayment (LCU) rate?',
    body: `The large corporate underpayment rate ("LCU") is an elevated rate that applies to sizable corporate
underpayments. Under §6621(c) it equals the federal short-term rate plus 5 percentage points and is reset
each quarter — two points above the ordinary underpayment rate.`,
  },
  'irs-gatt': {
    tagline: 'The reduced rate on large corporate overpayments above $10,000.',
    q: 'What is the current IRS GATT rate?',
    body: `The "GATT" rate applies to the portion of a corporate overpayment that exceeds $10,000. It equals
the federal short-term rate plus 0.5 percentage points — materially lower than the ordinary corporate
overpayment rate — and is reset quarterly under §6621.`,
  },
  'irs-6603-federal-short-term': {
    tagline: 'The federal short-term rate underlying every §6621 rate.',
    q: 'What is the current federal short-term rate used for IRS interest?',
    body: `The federal short-term rate is the base from which every IRS §6621 interest rate is built (each
category adds a fixed spread). The IRS publishes it quarterly; it is also the rate used for IRC §6603
cash deposits. Tracking it explains why all the other IRS rates move together each quarter.`,
  },
  'treasury-1-year-cmt': {
    tagline: 'The 1-year Treasury yield that sets the federal post-judgment rate.',
    q: 'What is the current 1-year Treasury constant maturity yield?',
    body: `The 1-year Treasury constant maturity (CMT) yield is published every business day by the Federal
Reserve (H.15). Its weekly average is the legal basis for the U.S. federal post-judgment interest rate
under 28 U.S.C. §1961, which is why it is tracked here as a weekly series alongside that rate.`,
  },
  'us-federal-post-judgment': {
    tagline: 'The interest that accrues on federal court money judgments.',
    q: 'What is the current U.S. federal post-judgment interest rate?',
    body: `The federal post-judgment interest rate is the interest that accrues on money judgments entered in
U.S. federal courts. By statute (28 U.S.C. §1961) it equals the weekly-average 1-year Treasury constant
maturity yield for the calendar week preceding the judgment — a value the U.S. Courts publish only as a
formula, not a number, and that changes every week. This page computes it from the official Federal
Reserve H.15 series and records each value under the following judgment-applicability week.`,
  },
  'boe-bank-rate': {
    tagline: 'The Bank of England’s headline interest rate.',
    q: 'What is the current Bank of England base rate?',
    body: `The Bank of England Bank Rate (the "base rate") is the interest rate the Bank sets at each Monetary
Policy Committee meeting; it anchors UK borrowing costs and the statutory interest on late commercial
payments. This page tracks the official rate and every change, straight from the Bank's own data.`,
  },
  'uk-late-payment-commercial': {
    tagline: 'What UK businesses can charge on overdue B2B invoices.',
    q: 'What is the current UK statutory interest rate on late commercial payments?',
    body: `Under the Late Payment of Commercial Debts (Interest) Act 1998, a UK business can charge statutory
interest on an overdue commercial (B2B) invoice at the Bank of England base rate plus 8 percentage points.
Crucially, the rate is fixed for six-month periods using the base rate in force on 31 December (for debts
in Jan–Jun) or 30 June (for Jul–Dec) — not the live base rate. This page applies that rule and shows the
history so you can pick the right rate for the period your debt fell due.`,
  },
  'ecb-main-refinancing-rate': {
    tagline: 'The ECB’s main policy interest rate.',
    q: 'What is the current ECB main refinancing rate?',
    body: `The ECB main refinancing operations (MRO) rate is the European Central Bank's headline policy rate.
The Directive identifies an ECB reference for euro-area minimum-framework calculations, but member-state
statutory rates can use different national bases or more creditor-favourable rules. This page tracks the
official MRO rate and every change, straight from the ECB Data Portal.`,
  },
  'california-judgment-rate': {
    tagline: 'California’s 10% default, 5% qualifying-debt branches, and public-entity exceptions.',
    q: 'What is the current California post-judgment interest rate?',
    body: `California’s ordinary state-court money-judgment rate is 10% per year on unpaid principal. A 5%
branch applies to qualifying judgments against natural persons entered on or after January 1, 2023—or
renewed by an application filed on or after that date—when unsatisfied principal is under $200,000 for
medical-expense claims or under $50,000 for personal debt. Tort, fraud, and specified employee claims
are excluded. State and local public-entity judgments generally use 7%, but special timing and rate
rules govern several public branches. This page is a legal-rate reference, not a payoff calculator.`,
    postDetails: {
      scope: 'The 10% headline is California’s default state-court money-judgment rate. The 5% branch requires a natural-person debtor, a qualifying medical-expense or personal-debt claim, the statutory entry-or-renewal date, and unsatisfied principal strictly below the applicable threshold. Tort, fraud, and employee-wage, damages, or penalty judgments do not qualify. Public entities and special statutes require separate treatment.',
      accrual: 'Ordinary interest begins on judgment entry. Unless the judgment provides otherwise, an installment begins accruing when that installment becomes due. Interest stops on the satisfied portion at the statutory receipt, tender, deposit, performance, levy, or collection date. State judgments and settlements, local public-entity judgments, and public tax-or-fee claims have separate finality, enforceability, and accrual rules.',
      compounding: 'Ordinary interest is calculated daily at the annual rate divided by 365 on unsatisfied principal. It is simple between capitalization events, but allowed enforcement costs become principal and renewal adds unpaid accrued interest to renewed principal. For ordinary non-support judgments, payments generally apply to accrued interest before principal after specified officer and court costs. Because rounding and all exceptions are not modeled, the calculator remains disabled.',
      history: 'California’s default rate changed from 7% to 10% effective January 1, 1983, including interest accruing after that date on earlier judgments. The qualifying 5% branches began January 1, 2023. The January 1, 2024 amendment was nonsubstantive code maintenance and is not a rate-history change. The earlier 7% rate is disclosed without inventing an unsupported start date.',
    },
  },
  'new-york-judgment-rate': {
    tagline: 'New York’s general judgment rate and the branches that can displace it.',
    q: 'What is the current New York judgment interest rate?',
    body: `CPLR 5004(a) sets a 9% annual general rate, and CPLR 5003 starts post-judgment interest when a
money judgment is entered—or when a payment order is docketed as a judgment. This is a general branch,
not a universal answer: covered consumer-debt actions against natural persons use 2% from April 30,
2022, specific statutes can control, and an agreement must clearly preserve a different post-judgment
rate to displace the statutory rate.`,
    postDetails: {
      scope: 'The 9% headline is the CPLR 5004(a) general rate. A covered consumer-debt action against a natural person uses the separate 2% branch beginning April 30, 2022. A statute governing a particular claim or defendant can supersede the default, and a contract must clearly, unambiguously, and unequivocally preserve a different post-judgment rate to displace it.',
      accrual: 'CPLR 5003 starts interest on a money judgment when the judgment is entered, or when a payment order is docketed as a judgment. CPLR 5002 separately governs interest from a verdict, report, or decision until judgment entry; the legally relevant dates therefore depend on the procedural record.',
      compounding: 'New York appellate authority says CPLR 5001–5004 does not provide compound interest. The entered judgment can include pre-entry interest incorporated under CPLR 5002, but partial payments, tolling, contract survival, and special statutory branches still prevent a universal payoff calculator. StatuteRates therefore keeps this series reference-only.',
      history: 'Official published appellate authority identifies June 15, 1981 as the effective date of New York’s 9% rate. The Fair Consumer Judgment Interest Act created the 2% natural-person consumer-debt branch beginning April 30, 2022. The dataset does not claim a complete pre-1981 timeline.',
    },
  },
  'new-york-consumer-debt-judgment-rate': {
    tagline: 'The reduced New York branch for covered consumer debt against natural persons.',
    q: 'What is the interest rate on consumer debt judgments in New York?',
    body: `Beginning April 30, 2022, CPLR 5004 applies 2% per year in an action arising out of consumer debt
when the defendant is a natural person. Consumer debt turns on whether the transaction’s money,
property, insurance, or services were primarily personal, family, or household. The rate also applies
prospectively to unpaid portions of covered judgments entered earlier; it does not refund or reallocate
amounts paid before the change.`,
    postDetails: {
      scope: 'Both statutory conditions matter: the action must arise from consumer debt as CPLR 5004(b) defines it, and the defendant must be a natural person. Classification is transaction- and fact-specific; this page does not assume every credit, rent, medical, or household dispute qualifies. Another specific statute or legal branch can require separate analysis.',
      accrual: 'For a covered money judgment, CPLR 5003 supplies the entry-or-docketing post-judgment trigger. Official New York decisions have also applied the 2% branch to prejudgment interest in covered consumer-debt actions, but entitlement and the dates supplied by CPLR 5001 and 5002 must be resolved from the claim and record.',
      compounding: 'The CPLR framework provides simple rather than compound interest. The 2022 law does not refund interest accrued or paid before April 30, 2022, disturb satisfied judgments, or reallocate earlier payments. Consumer classification, payment allocation, tolling, and other-law interactions remain too fact-specific for a released calculator.',
      history: 'The recorded series shows the 9% general rate from June 15, 1981, followed by the special 2% branch on April 30, 2022. On that transition date, 2% began applying prospectively to the unpaid portion of an older covered judgment; earlier accrued or paid interest remained undisturbed.',
    },
  },
  'massachusetts-judgment-rate': {
    tagline: 'Interest on Massachusetts tort and contract judgments.',
    q: 'What is the current Massachusetts judgment interest rate?',
    body: `Massachusetts adds interest at 12% per year to damages in tort actions (M.G.L. c.231 §6B, from
commencement of the action) and contract actions (§6C, from breach or demand) — among the highest
statutory rates in the U.S. In contract cases an established contract rate displaces the 12% default,
and judgments against the commonwealth instead bear interest at a Treasury-linked rate capped at 10%.`,
  },
  'iowa-judgment-rate': {
    tagline: 'Iowa’s monthly published Treasury-linked judgment rate.',
    q: 'What is the current Iowa judgment interest rate?',
    body: `Iowa Code §§535.3 and 668.13 set the general noncontract judgment rate at the one-year Treasury
constant maturity selected from Federal Reserve H.15, plus 2 percentage points. State Court
Administration publishes the applicable selection in a monthly table; it is not the federal court
system’s weekly-average rate. The rate is selected as of judgment and interest is computed daily. A
qualifying contract rate, workers’ compensation award, support obligation, or structured judgment can
follow a different rule.`,
    postDetails: {
      scope: 'The headline applies to the general noncontract path under §§535.3(1)(a) and 668.13. If a contract fixes a lawful rate, §668.13(2) uses that rate subject to the §535.2 cap. Section 535.3 separately addresses workers’ compensation and child, spousal, and medical-support obligations.',
      accrual: 'Section 668.13 generally allows interest from commencement of the action, with future damages beginning only when judgment is entered. After entry, the rate selected as of the judgment continues while the amount remains unpaid. Section 625.21 also supplies a verdict-to-final-entry rule outside chapter 668.',
      compounding: 'Section 668.13(5) requires interest to be computed daily to payment, and Iowa authority treats the ordinary path as simple interest. The statute does not itself state the annual day-count denominator or every partial-payment rule, so the calculator remains withheld.',
      history: 'The dataset contains {{history_points}} exact Judicial Branch table selections from March 2001 through {{effective_date}}, including the current {{current_rate}} selection. The official 1982–2000 scan is linked but not digitized because damaged and handwritten rows need a second manual check. If the live table is temporarily blocked, automation retains the last verified court history instead of substituting an estimate.',
    },
  },
  'texas-judgment-rate': {
    tagline: 'Interest on Texas money judgments — tied to the prime rate.',
    q: 'What is the current Texas post-judgment interest rate?',
    body: `Texas post-judgment interest on most money judgments is the Federal Reserve prime rate, held within a
5% floor and 15% ceiling under Texas Finance Code §304.003 — currently {{current_rate}}. The rate locks in when the
judgment is entered and, unusually, compounds annually. Judgments on a contract that sets its own interest
rate follow §304.002 instead (the contract rate, capped at 18%). This page includes every monthly OCCC rate
from September 1983 through the latest published judgment month, including months when the rate did not change.`,
    postDetails: {
      scope: 'The headline rate applies under §304.003 when the money judgment is not governed by an interest-bearing contract. Section 304.002 instead uses the lesser of the contract rate or 18%. Chapter 304 separately excludes specified delinquent-tax and delinquent-child-support interest.',
      accrual: 'Under §304.005, interest generally runs from the date the judgment is rendered through the date it is satisfied. A granted extension of time for a trial claimant to file an appellate brief pauses accrual for that extension period.',
      compounding: 'Post-judgment interest compounds annually under §304.006. The rate itself remains the OCCC rate assigned to the calendar month in which the judgment was rendered.',
      history: 'The recorded monthly schedule begins September 1983. The official OCCC historical table and archived Texas Credit Letters supply the verified baseline, and the weekly pipeline merges each newly published current month without discarding earlier months.',
    },
  },
  'florida-judgment-rate': {
    tagline: 'Florida’s official quarterly CFO rate and 1981–present history.',
    q: 'What is the current Florida judgment interest rate?',
    body: `Florida’s post-judgment interest rate is reset every quarter by the state Chief Financial Officer
under Fla. Stat. §55.03 — the 12-month average of the New York Fed’s discount rate plus 4 points. The
current value and effective date shown above come directly from the monitored CFO schedule. The rate in
effect when judgment is obtained applies first, then the judgment adjusts to the CFO rate in effect each
January 1 until paid. This page tracks the official quarterly table instead of leaving an older quarter’s
number in place.`,
    postDetails: {
      scope: 'The headline follows the general statutory schedule in Fla. Stat. §55.03. The section expressly leaves an interest rate established by written contract or obligation unaffected. It also gives separate annual-adjustment treatment to clerk-entered judgments under §§55.141, 61.14, 938.29, and 938.30.',
      accrual: 'Use the CFO rate in effect when the judgment is obtained. Under §55.03(3), that rate adjusts annually on each January 1 to the CFO rate then in effect until the judgment is paid. The four listed clerk-judgment categories do not receive that annual adjustment.',
      compounding: 'The CFO publishes an annual percentage and official daily factors for each effective period. The dedicated calculator models simple daily interest for its stated ordinary-judgment scope, uses the entry rate through December 31, and applies the CFO rate in force at each January 1 reset. It deliberately excludes partial payments and special branches.',
      history: 'The dataset preserves every distinct CFO period from October 1, 1981 through the latest verified publication, including the quarterly schedule introduced in 2011. A weekly monitor parses the official HTML, verifies every overlapping rate and daily factor, and can append a plausible new quarter only after all integrity checks pass.',
    },
  },
  'georgia-judgment-rate': {
    tagline: 'Georgia judgment interest — prime rate plus 3 points.',
    q: 'What is the current Georgia post-judgment interest rate?',
    body: `Under O.C.G.A. §7-4-12, interest on a Georgia money judgment is the Federal Reserve prime rate on the
day of judgment plus 3 percentage points — currently {{current_rate}} — fixed for the life of that judgment. A judgment
on a written contract that specifies a rate carries the contract rate instead. The history below follows every
Federal Reserve prime-rate change since the current statutory scheme began on July 1, 2003.`,
    postDetails: {
      scope: 'For civil actions filed on or after July 1, 2003, §7-4-12(a) applies the prime-plus-three formula to the general money-judgment path. Under subsection (b), a judgment founded on a written contract that specifies an interest rate uses the contract rate instead.',
      accrual: 'The benchmark is the Federal Reserve prime rate in force on the date the judgment is entered. The resulting rate is fixed for that judgment rather than resetting whenever prime later changes.',
      compounding: 'The general rule is treated as simple interest. Calculator output remains withheld while day count, partial-payment allocation, amended judgments, and every supported exception are verified to calculator-grade certainty.',
      history: 'The recorded history begins July 1, 2003 with the 4.00% prime rate then in force, producing 7.00%. Each later row is an exact effective-date change from the Federal Reserve/FRED PRIME series. The weekly refresh validates the complete baseline and automatically appends a later change.',
    },
  },
  'pennsylvania-judgment-rate': {
    tagline: 'Pennsylvania’s flat 6% legal judgment rate.',
    q: 'What is the Pennsylvania judgment interest rate?',
    body: `Pennsylvania judgments carry interest at the state’s legal rate of 6% per year — 42 Pa.C.S. §8101 sets
judgment interest at "the lawful rate," which 41 P.S. §202 fixes at 6%. It’s simple interest and has been 6%
for decades. A judgment on a loan or contract can carry a higher lawful contract rate where the documents set one.`,
    postDetails: {
      scope: 'The 6% headline is the general lawful rate supplied by 42 Pa.C.S. §8101 and 41 P.S. §202. A judgment founded on an obligation with a different enforceable contract rate can require separate analysis.',
      accrual: 'Section 8101 runs interest from the date of the verdict or award, or from the date of the judgment if it is not entered on a verdict or award, until satisfaction.',
      compounding: 'The general statutory reference is treated as simple interest. StatuteRates keeps a general Pennsylvania calculator disabled until every day-count, payment-allocation, contract-rate, and judgment-type branch is verified.',
      history: 'The current 6% legal-rate reference is recorded with official statutory sources. The page does not present a manufactured amendment history when earlier effective-date texts have not been independently digitized.',
    },
  },
  'ohio-judgment-rate': {
    tagline: 'Ohio’s judgment rate, reset annually by the Tax Commissioner.',
    q: 'What is the current Ohio judgment interest rate?',
    body: `Ohio sets its general civil money-judgment rate once a year under R.C. §§1343.03(B) and
5703.47 — currently {{current_rate}} for judgments rendered in {{current_year}}. The selected annual
rate stays fixed until payment. A qualifying written instrument, another statute, specified tort
settlement conduct, state Court of Claims matter, or workers’ compensation case can follow a different rule.`,
    postDetails: {
      scope: 'The headline is the general R.C. 1343.03(B) rate for a civil money judgment rendered in {{current_year}} when no qualifying written contract or other statute supplies a different rate. Division (C) provides a separate path for specified tort actions involving failure to make a good-faith settlement effort. Division (D) excludes periods controlled by another law, actions against the state in the Court of Claims, and workers’ compensation cases.',
      accrual: 'Under R.C. 1343.03(B), the general rate runs from the date the judgment, decree, or order is rendered until payment. The rate in effect on the rendition date remains fixed until satisfaction. For a revived judgment, R.C. 2325.18(B) excludes the period from dormancy through revival.',
      compounding: 'The Supreme Court of Ohio states that, absent a statute or specific agreement authorizing compounding, only simple interest accrues under R.C. 1343.03. Written-instrument judgments can use the agreed rate and require separate terms analysis, so a full payoff calculator remains withheld.',
      history: 'The Tax Commissioner’s official {{current_year}} journal entry certifies {{current_rate}}. Ohio publishes annual journal entries rather than a verified consolidated history on the source reviewed here. The dataset currently contains only the {{current_year}} observation, so the page does not claim a complete historical series.',
    },
  },
  'illinois-judgment-rate': {
    tagline: 'Illinois’ 9% statutory judgment rate.',
    q: 'What is the Illinois post-judgment interest rate?',
    body: `Illinois judgments accrue interest at 9% per year under 735 ILCS 5/2-1303 — a flat statutory rate,
simple interest, charged only on the unpaid portion of the judgment. The main exception: judgments against a
unit of local government accrue 6%.`,
  },
  'north-carolina-judgment-rate': {
    tagline: 'North Carolina’s legal-rate and contract judgment branches.',
    q: 'What is the North Carolina judgment interest rate?',
    body: `N.C. Gen. Stat. §24-5 uses the §24-1 legal rate for the general judgment branch. A contract
award uses the contract rate after judgment only when the contract expressly provides that the rate
continues after judgment; otherwise the legal rate applies. A qualifying consumer-contract award uses
the lower of the contract and legal rates, and penal-bond and noncontract awards have separate timing rules.`,
  },
  'michigan-judgment-rate': {
    tagline: 'Michigan’s Treasury-based general branch, complaint-date rules, and exceptions.',
    q: 'What is the current Michigan judgment interest rate?',
    body: `For the general MCL 600.6013(8) branch, Michigan’s current rate is {{current_rate}}: the State
Treasurer’s five-year Treasury benchmark for the period beginning {{effective_date}}, plus one percentage
point. General interest usually runs from complaint filing through satisfaction and compounds annually.
Written instruments, future damages, tort settlement offers, medical-malpractice cases, and older complaint
dates can follow different rules, so this page is a verified reference rather than a payoff calculator.`,
    postDetails: {
      scope: 'The headline is Michigan’s general MCL 600.6013(8) branch. Complaint-date rules, written instruments, tort settlement offers, medical-malpractice provisions, and future damages can change the applicable treatment. For current written-instrument complaints, a specified lawful rate can govern, subject to the statutory 13% ceiling and other conditions.',
      accrual: 'The general statute runs interest from complaint filing through satisfaction. For covered complaints, subsection (1) excludes the future-damages component between complaint filing and judgment entry; that component begins accruing at judgment.',
      compounding: 'Interest under the general and current written-instrument branches compounds annually. The statute calculates the general path in six-month intervals from complaint filing using benchmark rates certified for January 1 and July 1. Exact interval, anniversary, day-count, partial-payment, and branch mechanics remain withheld from calculation.',
      history: 'Michigan Treasury publishes 80 semiannual five-year Treasury benchmark observations from January 1, 1987 through July 1, 2026. The general statutory rate is each benchmark plus one percentage point. Older complaint-date branches are documented separately rather than being flattened into this series.',
    },
  },
  'new-jersey-judgment-rate': {
    tagline: 'New Jersey’s two-tier judgment rate, set yearly by the courts.',
    q: 'What is the current New Jersey post-judgment interest rate?',
    body: `For calendar year {{current_year}}, New Jersey Rule 4:42-11 sets simple interest at
{{current_rate_part_1}} for a judgment not exceeding the Special Civil Part monetary limit at entry and
{{current_rate_part_2}} for a judgment exceeding it. The current limit is $20,000. These are
whole-judgment categories—not marginal brackets—and the annual schedule can change while a judgment
remains unpaid. Contracts, court orders, public entities, and specialized statutes can require different treatment.`,
    postDetails: {
      scope: 'For {{current_year}}, Rule 4:42-11 supplies {{current_rate_part_1}} for a judgment not exceeding the Special Civil Part monetary limit at entry and {{current_rate_part_2}} for a judgment exceeding it. The current limit is $20,000. These are whole-judgment categories, not marginal brackets.',
      accrual: 'Postjudgment interest presumptively begins when the judgment is entered. The applicable schedule changes by calendar year rather than locking permanently at entry, but another law, enforceable contract treatment, equitable ruling, or court order can alter the result.',
      compounding: 'Rule 4:42-11 specifies simple interest. The general rule includes judgments, awards, orders, taxed costs, and attorney fees, subject to contract, equitable, public-entity, and specialized statutory treatment. Partial-payment and exact day-count mechanics remain outside the calculator.',
      history: 'The official Judiciary schedule supplies 43 base-rate entries from April 1, 1975 through {{current_year}}. The dataset also records the September 1, 1996 start of the two-point over-limit branch as a separate effective-date transition. A 6% period before April 1, 1975 is disclosed without inventing a start date; historical monetary-limit changes still need separate curation.',
    },
  },
  'virginia-judgment-rate': {
    tagline: 'Virginia’s flat 6% judgment rate.',
    q: 'What is the Virginia judgment interest rate?',
    body: `Virginia’s general judgment interest rate is 6% per year under Va. Code §6.2-302. A money
judgment arising from a contract carries the lawfully charged contract rate or 6%, whichever is higher.
The rate in effect when judgment is entered remains fixed despite later statutory changes.`,
    postDetails: {
      scope: 'The 6% headline is Virginia’s general judgment rate. A money judgment arising from a contract carries the lawfully charged contract rate or 6%, whichever is higher. A negotiable instrument with a stated rate follows its separate statutory branch. Under §6.2-302(C), the rate in effect when judgment is entered remains fixed despite later changes to the statutory rate.',
      accrual: 'The final order, verdict, judgment, or decree may fix when interest begins. If it does not provide for interest, §8.01-382 runs interest from entry of the final order or judgment, or from the date the jury verdict was rendered, and continues until the principal sum is paid.',
      compounding: 'Virginia law describes interest on the principal sum awarded, and the Court of Appeals has said post-judgment interest does not accrue on prejudgment interest awarded to the plaintiff. The statutes do not provide every day-count, partial-payment, allocation, and special-judgment rule needed for a dependable payoff calculator, so StatuteRates does not describe a universal calculation method or enable a Virginia calculator.',
      history: 'Official Virginia records show that Chapter 646 of the 2004 Acts reduced the general judgment rate from 9% to 6%, effective July 1, 2004. Chapter 550 of the 2010 Acts added the rule fixing the applicable rate at judgment entry. Earlier amendments appear in the current Code history, but the page does not claim a complete earlier timeline until every effective period is independently digitized.',
    },
  },
  'washington-judgment-rate': {
    tagline: 'Washington’s claim-specific judgment rates under RCW 4.56.110.',
    q: 'What is the current Washington post-judgment interest rate?',
    body: `RCW 4.56.110 does not set one Washington rate for every judgment. General “all other” money judgments
use the RCW 19.52.020 maximum rate (currently {{current_rate_part_1}}); unpaid consumer-debt judgments use 9%; qualifying
private student-loan and non-public-agency tort judgments use the Federal Reserve prime rate from the
preceding month plus two points (currently {{current_rate_part_2}}). Written contracts, unpaid child support, and
public-agency tort judgments follow separate branches.`,
    postDetails: {
      scope: 'RCW 4.56.110 separates written contracts, unpaid child support, public-agency torts, other torts, private student-loan debt, consumer debt, and all remaining judgments. A contract rate must be stated in the judgment; child-support judgments use 12%; public-agency torts use a separate 26-week Treasury-bill formula.',
      accrual: 'The statute generally runs interest from entry of judgment. For specified verdicts later entered, affirmed, or reinstated on review, interest on the judgment or affirmed portion dates back to the verdict date.',
      compounding: 'StatuteRates keeps the Washington payoff calculator disabled because the page models several rate branches but not every day-count, compounding, appellate, payment-allocation, and historical benchmark input needed for a deterministic result.',
      history: 'The current page records the major §4.56.110 branches and their present references. A complete historical schedule would require separate prime, Treasury-bill, contract, consumer, and statutory-maximum timelines, so missing branch histories are not collapsed into one misleading series.',
    },
  },
  'arizona-judgment-rate': {
    tagline: 'Arizona judgment interest — lesser of 10% or prime + 1.',
    q: 'What is the current Arizona judgment interest rate?',
    body: `For the general non-medical-debt branch, Arizona’s recorded rate is {{current_rate}} effective
{{effective_date}}. A.R.S. §44-1201(B) uses the lesser of 10% per year or the Federal Reserve prime rate
plus one percentage point. A written agreement, qualifying medical debt, condemnation, or another
specific law can follow a different branch.`,
  },
  'colorado-judgment-rate': {
    tagline: 'Colorado’s 8% compounded judgment rate.',
    q: 'What is the Colorado judgment interest rate?',
    body: `Colorado money judgments accrue 8% per year, compounded annually, under C.R.S. §5-12-102(4)(b) when no
contract rate applies. Personal-injury judgments use a separate rate (§13-21-101), and judgments on appeal use a
variable rate certified each January by the Secretary of State.`,
  },
  'tennessee-judgment-rate': {
    tagline: 'Tennessee judgment interest — the formula rate minus 2 points.',
    q: 'What is the current Tennessee post-judgment interest rate?',
    body: `Tennessee’s general rate for a judgment entered from July 1 through December 31, 2026 is
8.75%. Tenn. Code §47-14-121 uses the Department of Financial Institutions formula rate for June
(10.75%) less two percentage points. A statute, note, contract, or other writing can supply a different lawful rate.`,
    postDetails: {
      scope: 'For a general judgment entered from July 1 through December 31, 2026, the rate is 8.75%. Tenn. Code §47-14-121(a)(1) uses the Department of Financial Institutions formula rate for June, less two percentage points; the official June 2026 history shows 10.75%. A statute, note, contract, or other writing can supply a different lawful rate under subsection (c).',
      accrual: 'The judgment-entry date selects the applicable six-month rate. Section 47-14-122 runs interest from the verdict. In a nonjury case, Tennessee appellate authority treats the practical equivalent of a verdict as the point when the court’s findings make the award sufficiently certain; that point can precede formal judgment entry. Remands and other procedural postures require separate analysis.',
      compounding: 'The selected rate is fixed for that judgment rather than changing with later six-month rates. Tennessee appellate opinions use the Code’s simple-interest definition in ordinary judgment-interest analysis, while contract cases require express agreement for compounding. The statutes do not state one universal postjudgment compounding method, so a payoff calculator remains withheld until day count, partial-payment allocation, and every exception branch are verified.',
      history: 'Section 47-14-121(b)(3) requires the Administrative Office of the Courts to publish every six-month rate back to July 1, 2012. The dataset preserves all {{history_points}} official AOC half-year selections from that date through the current period. Those published selections are retained directly rather than recomputed from the DFI weekly table; the July 1, 2026 value is also corroborated by the official June formula rate of 10.75% less two points.',
    },
  },
  "alabama-judgment-rate": {
    tagline: "Alabama’s statutory judgment interest rate.",
    q: "What is the current Alabama post-judgment interest rate?",
    body: "Alabama money judgments carry a fixed statutory rate of 7.5% per year under Ala. Code § 8-8-10(a), as simple interest. For a judgment \"based upon a contract action,\" interest runs \"at the same rate of interest as stated in the contract\" (the contract rate governs, not…",
  },
  "alaska-judgment-rate": {
    tagline: "Alaska’s annual AS 09.30.070 judgment rate, fixed at entry.",
    q: "What is the current Alaska post-judgment interest rate?",
    body: "For judgments entered in {{current_year}}, Alaska’s general pre- and post-judgment interest rate is {{current_rate}} under AS 09.30.070(a). The formula is three percentage points above the 12th Federal Reserve District discount rate in effect on January 2 of the judgment year. A contract or another statute can supply a different rate.",
    postDetails: {
      scope: "The {{current_rate}} headline is the general AS 09.30.070(a) path for a judgment entered in {{current_year}}. Use a contract rate when the contract controls, or the rate in another applicable statute; Alaska Courts lists child support, bank liquidation, eminent domain, and estate claims as examples of separate statutes.",
      accrual: "Alaska Courts states that post-judgment interest begins on the date the judge signs the judgment. The annual rate selected for that judgment does not change while an unpaid balance or payment plan continues into later years.",
      compounding: "The official rate table establishes the annual percentage and rate lock, but it does not state every day-count, compounding, partial-payment, or allocation rule needed for a dependable payoff calculator. StatuteRates therefore keeps the Alaska calculator disabled.",
      history: "The dataset preserves all {{history_points}} annual selections in Alaska Court System form ADM-505 from the August 7, 1997 statutory transition through {{current_year}}. The weekly pipeline reads the official PDF, verifies every historical anchor, and can append a later year only when the court publishes it.",
    },
  },
  "arkansas-judgment-rate": {
    tagline: "Arkansas judgment interest — a formula rate, reset periodically.",
    q: "What is the current Arkansas post-judgment interest rate?",
    body: "Arkansas’s recorded general judgment rate is {{current_rate}} for a judgment entered on or after {{effective_date}}. Ark. Code Ann. §16-65-114(a), as amended by Act 995 of 2019, uses the Federal Reserve primary-credit rate in effect on the judgment date plus two percentage points, subject to the constitutional maximum. Earlier judgment dates keep their own verified period; a contract or another controlling law can require a different result.",
  },
  "connecticut-judgment-rate": {
    tagline: "Connecticut’s branching judgment-interest rules and 10% ceiling.",
    q: "What is the current Connecticut post-judgment interest rate?",
    body: "Connecticut does not apply one automatic 10% rate to every judgment. Under Conn. Gen. Stat. §37-3a, a court may award up to 10% per year as damages for detention of money; qualifying hospital-service debt is capped at 5% and remains discretionary. Section 37-3b separately requires 10% in covered negligence actions, while §37-3c uses a Treasury-linked condemnation rule.",
    postDetails: {
      scope: "Section 37-3a supplies a discretionary rate of up to 10% for qualifying detention-of-money claims and a 5% cap for hospital-service debt. Section 37-3b governs covered negligence judgments. Section 37-3c governs condemnation awards, and §52-192a can create another offer-of-compromise path.",
      accrual: "For a negligence cause of action arising on or after May 27, 1997, §37-3b computes interest from the earlier of 20 days after judgment or 90 days after verdict. A plaintiff’s own postverdict motion or appeal can toll interest, subject to the statute’s response exception.",
      compounding: "Because entitlement, start date, percentage, tolling, claim type, and the condemnation calculation differ by branch, StatuteRates treats 10% as a ceiling/reference—not a universal calculator input—and keeps the Connecticut payoff calculator disabled.",
      history: "The page records the present branch structure from the official Connecticut General Assembly text. It does not manufacture a single historical series by merging discretionary, negligence, hospital, condemnation, and offer-of-compromise rules.",
    },
  },
  "delaware-judgment-rate": {
    tagline: "Delaware judgment interest — a formula rate, reset twice a year.",
    q: "What is the current Delaware post-judgment interest rate?",
    body: "Delaware’s recorded general legal rate is {{current_rate}} beginning {{effective_date}}. Under 6 Del. C. §2301(a), the legal rate is five percentage points above the Federal Reserve discount rate, including any surcharge, measured when interest becomes due. A contract can control before judgment, while post-judgment contract treatment and the §2301(d) tort settlement-demand branch require separate analysis.",
  },
  "dc-judgment-rate": {
    tagline: "District of Columbia judgment interest — a formula rate, reset each quarter.",
    q: "What is the current District of Columbia (D.C.) post-judgment interest rate?",
    body: "District of Columbia (D.C.) post-judgment interest is currently 5% — a statutory formula rate under D.C. Code § 28-3302(c) that resets each quarter. Judgments/decrees against the District of Columbia, its officers, or employees acting within scope of employment bear interest \"not exceeding 4% per…",
  },
  "hawaii-judgment-rate": {
    tagline: "Hawaii’s statutory judgment interest rate.",
    q: "What is the current Hawaii post-judgment interest rate?",
    body: "Hawaii money judgments carry a fixed statutory rate of 10% per year under Haw. Rev. Stat. 478-3. Related: 478-2, as simple interest. 478-3 governs POST-judgment interest on any civil judgment at a flat 10%. PREJUDGMENT interest is separate — HRS 636-16 lets the judge designate the…",
  },
  "idaho-judgment-rate": {
    tagline: "Idaho’s official fiscal-year judgment rate and complete published history.",
    q: "What is the current Idaho post-judgment interest rate?",
    body: "Idaho’s current post-judgment rate is {{current_rate}}. Idaho Code §28-22-104(2) sets the rate at five percentage points above the State Treasurer’s one-year Treasury base rate in effect when judgment is entered. The Treasurer publishes one selection for each July-to-June fiscal year, and the dataset preserves all {{history_points}} published selections beginning with fiscal year 1987.",
    postDetails: {
      scope: "Section 28-22-104(2) supplies the statutory rate for judgments. Idaho appellate authority describes that judgment rate as mandatory and applicable to all judgments; subsection (1)’s written-contract language concerns interest due before judgment and should not be presented as a general post-judgment exception.",
      accrual: "The entry date selects the Treasurer’s July-to-June rate in force at that time. The current statute and decisions reviewed establish that selection rule, but a judgment’s precise accrual event and any special judgment treatment still must be checked against the controlling order and law.",
      compounding: "The official sources reviewed do not establish one universal compounding, day-count, or partial-payment method for every Idaho judgment. StatuteRates therefore publishes the verified rate history but keeps a payoff calculator disabled rather than assume those mechanics.",
      history: "The official State Treasurer schedule contains {{history_points}} continuous fiscal-year selections from July 1, 1986 through the current published period. Historical values are copied from that table, not recomputed from market data.",
    },
  },
  "indiana-judgment-rate": {
    tagline: "Indiana’s 8% no-contract branch and capped contract-rate rule.",
    q: "What is the current Indiana post-judgment interest rate?",
    body: "Indiana Code §24-4.6-1-101 sets 8% per year for its no-contract money-judgment branch. When the original contract sued upon states a rate, that rate governs after judgment, capped at 8% even if a higher contract rate was valid before judgment. Unless another statute provides otherwise, interest runs from the return of the verdict or the court’s finding until satisfaction.",
    monetizationReady: false,
    postDetails: {
      scope: "Section 24-4.6-1-101 applies to judgments for money unless another statute supplies a different rule. It uses the original contract’s stated rate, capped at 8%, when that contract states a rate; otherwise its headline branch is 8% per year.",
      accrual: "Subject to statutory exceptions, §24-4.6-1-101 runs interest from the date the verdict is returned or the court makes its finding until satisfaction. Special statutory judgments and changed or reversed judgments can require separate authority.",
      compounding: "Do not apply one universal simple-interest rule. Section 24-4.6-1-104 can continue an agreed computation method after judgment for a loan or forbearance. Because this page cannot identify the underlying agreement, computation path, or partial-payment allocation, the calculator remains disabled.",
      history: "Indiana Code §24-4.6-1-0.1 states that the 1993 amendment to §24-4.6-1-101 applies to interest accruing after December 31, 1993, including unpaid portions of earlier judgments. The dataset therefore records January 1, 1994 as the verified change point for the current 8% ceiling and no-contract branch; it does not infer earlier rates.",
    },
  },
  "kansas-judgment-rate": {
    tagline: "Kansas judgment interest — a formula rate, reset each year.",
    q: "What is the current Kansas post-judgment interest rate?",
    body: "Kansas post-judgment interest is currently {{current_rate}} — a statutory formula rate under Kan. Stat. Ann. 16-204 that resets each year. This 16-204 rate is POST-judgment. Prejudgment interest is governed separately by K.S.A. 16-201 (10% per annum when no other rate agreed). CONTRACT:…",
  },
  "kentucky-judgment-rate": {
    tagline: "Kentucky’s general judgment rate, with the 2017 statutory change preserved.",
    q: "What is the current Kentucky post-judgment interest rate?",
    body: "Kentucky’s general rate is 6% per year for judgments entered on or after June 29, 2017, compounded annually from entry under KRS 360.040(1). The enrolled 2017 Act reduced the prior general rate from 12%. Important branches remain: unpaid child-support judgments bear 12%; a judgment on a contract, note, or other written obligation uses its stated rate; and a court may set an unliquidated judgment below 6% after notice and a hearing.",
    postDetails: {
      scope: "The 6% headline is the general KRS 360.040(1) path. Subsection (2) keeps unpaid child-support judgments at 12%. Subsection (3) uses the rate in a contract, promissory note, or other written obligation. Under subsection (4), an unliquidated judgment may bear less than 6% after notice and a hearing.",
      accrual: "The statute runs general post-judgment interest from the date the judgment is entered. The 2017 Act expressly applies the 6% amendment to judgments entered on or after June 29, 2017, so the judgment-entry date selects between the recorded 12% and 6% general rates.",
      compounding: "KRS 360.040 expressly requires annual compounding. A calculator is still withheld because the statute does not supply a complete day-count and partial-payment method, and the written-obligation, support, and unliquidated-judgment branches require separate inputs.",
      history: "The dataset records the 12% general rate from the July 15, 1982 amendment date and the 6% rate from June 29, 2017. Earlier enactments appear in the statute history but are not digitized as calculator data without their historical text.",
    },
  },
  "louisiana-judgment-rate": {
    tagline: "Louisiana’s annual judicial-interest rate and official published history.",
    q: "What is the current Louisiana post-judgment interest rate?",
    body: "Louisiana’s general judicial-interest rate for {{current_year}} is {{current_rate}}. La. R.S. 13:4202(B) directs the Commissioner of Financial Institutions to set a rate for each calendar year from the specified Federal Reserve benchmark plus 3.25 percentage points. The applicable rate can therefore change as a judgment remains unpaid; contracts, claim type, and special statutes can supply different rules.",
    postDetails: {
      scope: "R.S. 13:4202 supplies the general annual judicial-interest schedule. A monetary contractual obligation can use an agreed rate under Civil Code art. 2000, while tort, government-defendant, and other special statutory branches can change entitlement, rate, or timing.",
      accrual: "Louisiana does not have one universal start date. R.S. 13:4203 addresses interest from judicial demand for judgments sounding in damages ex delicto; Civil Code art. 2000 addresses qualifying monetary obligations from the time a sum is due. After judgment, the published judicial rate changes by calendar year rather than remaining fixed at the entry-year percentage.",
      compounding: "Do not compound automatically. Civil Code art. 2001 permits interest on accrued interest only through a new agreement made after that interest accrued. Day count, payment allocation, contractual terms, and special statutory branches remain outside the calculator model.",
      history: "The dataset preserves {{history_points}} dated periods from the official OFI schedule beginning September 12, 1980. OFI also lists 7% for the undated period before that day; it remains contextual only because no beginning date is published and StatuteRates will not invent one.",
    },
  },
  "maryland-judgment-rate": {
    tagline: "Maryland’s general 10% judgment rate and statutory exceptions.",
    q: "What is the current Maryland post-judgment interest rate?",
    body: "Maryland’s general judgment interest rate is 10% per year under Md. Code, Courts and Judicial Proceedings §11-107(a). Residential-rent judgments use 6%, and delinquent property-tax judgments use the greater of 10% or the combined statutory interest-and-penalty rates. Section 11-106 supplies a separate rule for qualifying contracts for the loan of money.",
    postDetails: {
      scope: "The 10% headline is the general §11-107(a) rate. Subsection (b) sets 6% for a money judgment for residential rent. Subsection (c) sets delinquent real- or personal-property tax judgments at the greater of 10% or the combined Tax–Property Article interest and penalty rates.",
      accrual: "For a qualifying action arising from a contract for the loan of money, §11-106 generally applies the contract rate to unpaid principal until the contract’s originally scheduled maturity. Mortgage and deed-of-trust loans are excluded, and student loans have an additional statutory caveat.",
      compounding: "The statutory percentages and major branches are recorded, but the dataset does not yet model every day-count, compounding, maturity, payment-allocation, tax, rent, and loan-contract rule needed for a dependable Maryland calculator.",
      history: "The current statutory branch structure is recorded from the official Maryland General Assembly text. StatuteRates does not invent a historical timeline from the present codification when amendment-effective dates have not been independently digitized.",
    },
  },
  "minnesota-judgment-rate": {
    tagline: "Minnesota’s annual general rate, fixed 10% branch, and child-support history.",
    q: "What is the current Minnesota post-judgment interest rate?",
    body: "Minnesota does not have one universal judgment-interest percentage. For 2026, the general rate under Minn. Stat. §549.09, subd. 1(c) is {{current_rate_part_1}}. A qualifying judgment or award over $50,000 can instead use {{current_rate_part_2}}, subject to entry-date and statutory exclusions. The general percentage resets by calendar year while the qualifying 10% branch is generally fixed at entry until paid.",
    postDetails: {
      scope: "The {{current_rate_part_2}} branch began August 1, 2009 for qualifying judgments or awards over $50,000, but it does not apply universally. The statute excludes specified public-party matters and later excluded family-court actions; tax, condemnation, arbitration, child-support, and other special paths require separate review. Beginning August 1, 2022, interest does not accrue on past, current, or future child-support judgments. The statute’s separate discretion to lower interest in other family-court actions expressly does not apply to child-support judgments.",
      accrual: "The general branch follows each calendar year’s published rate rather than staying at the percentage from entry. The qualifying-over-$50,000 branch generally keeps the 10% rate in effect when the judgment was entered until paid. Interest ordinarily runs from entry, but statutory exclusions and special judgment types can change the start date or applicable path.",
      compounding: "The official materials describe simple interest using a 365-day year and direct payments first to taxable disbursements, then accrued interest, then principal. StatuteRates still withholds a payoff calculator because it does not yet determine every entry-vintage, family-court, public-party, exception, and payment scenario safely.",
      history: "The dataset publishes {{history_points}} official dated general-rate change points from 1990 through 2026 and shows the qualifying-over-$50,000 branch in paired values from its August 2009 transition. The official tables leave the 1990–1992 child-support cells blank and later direct that branch to follow §549.09 subject to an 18% cap; those child-support details are disclosed here but are not flattened into a numeric historical lookup. The August 2022 zero-rate transition is recorded in the rule metadata. An official pre-1990 document is linked for research but is not machine-ingested until its older periods are independently verified.",
    },
  },
  "missouri-judgment-rate": {
    tagline: "Missouri judgment interest — a fixed non-tort branch and an unresolved tort benchmark.",
    q: "What is the current Missouri post-judgment interest rate?",
    seoDescription: "Missouri post-judgment interest: 9% for the verified non-tort branch; the current tort benchmark is withheld. See scope, formula, and official source.",
    body: "Missouri’s general non-tort money-judgment branch is 9% under Mo. Rev. Stat. §408.040, subject to its contract-rate rule. StatuteRates is not publishing a current numeric rate for the separate tort branch because the statute refers to the ‘intended Federal Funds Rate’ and the reviewed Federal Reserve series do not resolve whether that means a target-bound or effective-rate value. The tort branch remains unavailable rather than guessed.",
  },
  "montana-judgment-rate": {
    tagline: "Montana judgment interest — a formula rate, reset periodically.",
    q: "What is the current Montana post-judgment interest rate?",
    body: "Montana post-judgment interest is currently {{current_rate}} — a statutory formula rate under Mont. Code Ann. § 25-9-205 that resets periodically. For a judgment involving a contractual obligation that specifies an interest rate, post-judgment interest is paid at the rate specified in the…",
  },
  "nebraska-judgment-rate": {
    tagline: "Nebraska judgment interest — a quarterly formula rate fixed when judgment is entered.",
    q: "What is the current Nebraska post-judgment interest rate?",
    body: `Nebraska post-judgment interest is currently 5.970% under Neb. Rev. Stat. §45-103, effective
July 16, 2026. For judgments entered on or after July 20, 2002, the rate is the bond investment yield
from the first 26-week U.S. Treasury-bill auction of the quarter plus two percentage points. The rate
is fixed when judgment is entered, not reset on an existing judgment every quarter. This page includes
the Nebraska Judicial Branch's complete published change-point table from January 1, 1987 forward.`,
    postDetails: {
      scope: 'The headline §45-103 rate applies to decrees and judgments for payment of money. It does not apply when another law specifically provides the rate or when an oral or written contract agrees a different rate.',
      accrual: 'Section 45-103.01 runs interest from entry of judgment until satisfaction. An appeal does not by itself restart that date; for installment judgments, Nebraska case annotations say each installment begins accruing when it becomes due and payable.',
      compounding: 'The applicable rate is fixed on the judgment-entry date. Sections 45-103 and 45-103.01 do not state the day-count, compounding, or partial-payment mechanics needed for a dependable general calculator, so StatuteRates keeps the Nebraska calculator disabled pending further primary-source verification.',
      history: 'The official Judicial Branch table contains every published change point from January 1, 1987 through the latest effective date. It also preserves the source table’s gap between March 13, 2001 and the July 20, 2002 formula transition instead of inventing missing values. The weekly pipeline checks the current court page for each new quarter.',
    },
  },
  "nevada-judgment-rate": {
    tagline: "Nevada’s official semiannual prime-plus-two judgment-rate history.",
    q: "What is the current Nevada post-judgment interest rate?",
    body: "For the six-month period beginning {{effective_date}}, Nevada’s general judgment-interest rate is {{current_rate}}. Under NRS 17.130(2), the default path uses the Nevada Financial Institutions Division prime rate immediately preceding judgment plus two percentage points, then resets each January 1 and July 1 while the judgment remains unpaid. A lawful contract, another law, the judgment itself, or qualifying consumer-form debt can require a different path.",
    postDetails: {
      scope: "The headline is the general NRS 17.130(2) default when no contract, other law, or judgment-specified rate controls. NRS 97B.150 supplies a separate branch for qualifying consumer-form debt: it uses the lesser lawful contract rate or prime plus two, fixes that selected rate at judgment, bars compounding, and contains exemptions. Offer-of-judgment and other special rules also require separate analysis.",
      accrual: "General NRS 17.130 interest ordinarily runs from service of the summons and complaint until satisfaction. Amounts representing future damages begin accruing only when judgment is entered. The current formula applies to causes of action arising on or after July 1, 1987; earlier matters should not be forced into this history.",
      compounding: "Nevada Supreme Court authority treats the general NRS 17.130 path as simple interest, while its rate resets every January 1 and July 1. StatuteRates keeps the payoff calculator disabled because day count, partial-payment allocation, contracts, consumer debt, offer-of-judgment consequences, future damages, and every special-law branch are not calculator-complete.",
      history: "The official FID table supplies {{history_points}} dated six-month selections from July 1, 1987 through {{effective_date}}. Its January 1, 1987 row says Not Available, so StatuteRates preserves that gap instead of inventing a rate. Every stored general rate is the published prime value plus exactly two percentage points.",
    },
  },
  "new-hampshire-judgment-rate": {
    tagline: "New Hampshire’s statutory formula, with the unverified current schedule withheld.",
    q: "What is the current New Hampshire post-judgment interest rate?",
    body: "RSA 336:1, II sets New Hampshire’s annual simple judgment-interest formula from the last 26-week Treasury-bill auction before September 30 of the prior year, plus two percentage points, rounded to one decimal place. RSA 336:2 fixes a judgment’s rate at the rate in effect when the verdict or finding for pecuniary damages is made. StatuteRates is withholding the current numeric value until the official annual court schedule can be accessed and independently verified.",
    postDetails: {
      scope: "RSA 336:1, II supplies the annual simple rate for judgments, including prejudgment interest. RSA 527:10 separately states that interest is payable on executions in civil actions from the time judgment is rendered. These provisions do not independently decide entitlement or every special statutory judgment.",
      accrual: "RSA 336:2, I locks the applicable rate when the verdict is rendered or the finding for pecuniary damages is made. RSA 527:10 states that post-judgment interest on a civil execution is payable from rendition. The statewide rate changes each January, but an existing judgment does not reprice each year.",
      compounding: "RSA 336:1, II expressly calls this an annual simple rate. The cited statutes do not supply a universal day-count denominator, partial-payment allocation method, or treatment for every nonstandard judgment, so the general calculator remains disabled.",
      history: "The statutory formula dates to 1981, and a 2001 Act changed its benchmark from a 52-week to a 26-week Treasury bill. The annual court schedule reviewed for the current value was inaccessible, so StatuteRates does not publish that number or claim a complete annual history until the schedule is available and independently verified.",
    },
  },
  "new-mexico-judgment-rate": {
    tagline: "New Mexico’s statutory judgment interest rate.",
    q: "What is the current New Mexico post-judgment interest rate?",
    body: "New Mexico generally applies 8.75% per year from entry to judgments and decrees for payment of money under NMSA 1978 §56-8-4. A written instrument may supply a different rate no higher than the rate it states. Judgments based on tortious conduct—including negligence under published New Mexico decisions—bad faith, or intentional or willful acts use 15%. The state and its political subdivisions are exempt unless another statute or common-law rule provides otherwise.",
    postDetails: {
      scope: 'The general rate is 8.75% on judgments and decrees for the payment of money. A judgment rendered on a written instrument may use a different rate, but no higher than the instrument specifies. A judgment based on tortious conduct, bad faith, or intentional or willful acts uses 15%; published New Mexico authority says tortious conduct includes negligence. The state and its political subdivisions are exempt unless another statute or common-law rule provides otherwise.',
      accrual: 'Section 56-8-4(A) makes post-judgment interest run from entry of a judgment or decree for payment of money. Published New Mexico authority treats that award as mandatory for a qualifying money judgment, although another statute, common law, or a special payment schedule can alter the result for a particular judgment.',
      compounding: 'Section 56-8-4 states annual rates but does not specify a universal post-judgment compounding method, day-count denominator, or partial-payment allocation rule. Its official annotations reject monthly compounding for prejudgment interest and interest-on-interest before judgment without separate authorization, but those decisions do not establish every post-judgment calculation rule. The calculator remains disabled. An annotation about selecting the statutory rate when an action became pending concerns prejudgment interest and is not presented here as a universal post-judgment rule.',
      history: 'The official annotated statute says the amendment effective June 18, 1993 reduced the general rate from 15% to 8.75%. The May 19, 2004 amendment changed the unpaid-child-support proviso in the prejudgment subsection, not the general 8.75% post-judgment rate. NMOneSource provides historical statutory editions dating to 1989, but the page does not infer a complete older timeline until those editions and session laws are independently reviewed.',
    },
  },
  "north-dakota-judgment-rate": {
    tagline: "North Dakota’s annual judgment rate and official 2006–present history.",
    q: "What is the current North Dakota post-judgment interest rate?",
    body: "North Dakota’s {{current_year}} general judgment-interest rate is {{current_rate}} under N.D.C.C. §28-20-34. For judgments entered on or after January 1, 2006, the annual rate is the prime rate published on the first Monday in December plus three points, rounded up to the next one-half percentage point. A rate stated in the original instrument can govern instead.",
    postDetails: {
      scope: "Section 28-20-34 uses the original instrument’s rate when one is stated; otherwise it supplies the annual statutory formula for post-2005 judgments. A distinct transition rule applies to judgments entered before January 1, 2006, so the current headline should not be back-applied to older judgments.",
      accrual: "North Dakota’s Supreme Court held in Orwig v. Orwig that §28-20-34 does not require a post-2005 judgment to keep its entry-year statutory rate in later years. The published annual rates can therefore apply by calendar year. Partial payments require the separate allocation rule in §28-20-36.",
      compounding: "Section 28-20-34 bars compounding under the general statutory path. A general payoff calculator remains disabled because the original-instrument branch, pre-2006 transition, partial-payment sequence, and every special judgment path are not fully modeled.",
      history: "The official North Dakota Courts table supplies {{history_points}} annual observations from January 1, 2006 through {{current_year}}. Each value is copied from the court table; missing earlier periods are not inferred.",
    },
  },
  "oklahoma-judgment-rate": {
    tagline: "Oklahoma’s court-certified annual judgment rates, with calendar-year compounding.",
    q: "What is the current Oklahoma post-judgment interest rate?",
    body: "Oklahoma’s {{current_year}} general post-judgment rate is {{current_rate}}. Under 12 O.S. §727.1, a covered judgment begins at the certified rate for the calendar year in which it is rendered and reprices each January 1 while unpaid. Previously accrued post-judgment interest joins the interest-bearing balance, so the statutory path compounds annually rather than using simple interest.",
    postDetails: {
      scope: "The {{current_rate}} headline is the {{current_year}} general §727.1 reference. A lawful contract rate controls when it is stated in the judgment and accrues in the same annual manner. Judgments against Oklahoma or its political subdivisions remain subject to the Governmental Tort Claims Act total-liability cap, and a more specific statute or judgment category can displace the general path.",
      accrual: "General post-judgment interest begins on the earlier of the expressly stated rendition date or filing with the court clerk. Allowed costs and attorney fees use their own earlier-of-pronouncement-or-filing trigger. The balance then reprices each January 1 at the certified rate for the new calendar year.",
      compounding: "Section 727.1(C) expressly applies each new year’s rate to the judgment together with post-judgment interest previously accrued. That is annual compounding. StatuteRates keeps the calculator disabled because day count, partial-payment allocation, every special-law judgment, government-cap application, contract terms, and older statutory regimes are not calculator-complete.",
      history: "The official Oklahoma notices provide {{history_points}} post-judgment values from November 1, 1986 through {{current_year}}. Historical rows retain the values calculated under the statute then in effect; the current first-publication Wall Street Journal prime-plus-two formula is not back-applied to earlier years. Three 2013 legal periods are preserved as regime metadata, but because all publish the same 5.25% post-judgment rate they are not shown as false rate changes.",
    },
  },
  "oregon-judgment-rate": {
    tagline: "Oregon’s general 9% money-judgment rate and statutory exceptions.",
    q: "What is the current Oregon post-judgment interest rate?",
    body: "Oregon’s general rate on a judgment for payment of money is {{current_rate}} per year under ORS 82.010(2). Interest ordinarily runs from entry unless the judgment specifies another date, and it is simple unless a contract provides otherwise. The statute separately addresses higher-rate contracts, qualifying medical-professional-negligence judgments, prejudgment interest included in the judgment, attorney fees, and costs.",
    postDetails: {
      scope: "The {{current_rate}} headline is the general ORS 82.010(2) rate for a judgment for payment of money. A judgment on a contract bearing more than 9% uses the contract rate in effect at entry. A qualifying professional-negligence judgment involving an Oregon Medical Board or State Board of Nursing licensee uses the lesser of 5% or the Federal Reserve discount rate plus three points. Another statute can supply a different rule.",
      accrual: "Interest ordinarily accrues from entry unless the judgment specifies another date. The 9% amendment took effect in July 1979, but Oregon authority applies the rate selected when the judgment is entered rather than resetting an older judgment merely because the statute later changed.",
      compounding: "Section 82.010(2)(b) requires simple interest unless a contract provides otherwise. Post-entry interest can also accrue on prejudgment interest that accrued before entry and on attorney fees and costs entered as part of the judgment; the statute treats those amounts as part of the interest-bearing judgment rather than as automatic periodic compounding.",
      history: "The official 1977 Oregon statute archive shows the former 6% rule, and the 1979 replacement shows the amendment to 9%. The local dataset records the current 9% statutory regime but does not invent earlier change points beyond the verified archived enactments.",
    },
  },
  "rhode-island-judgment-rate": {
    tagline: "Rhode Island’s 12% judgment branch and statutory exceptions.",
    q: "What is the current Rhode Island post-judgment interest rate?",
    body: "R.I. Gen. Laws §9-21-10 generally adds 12% post-judgment interest to the amount of pecuniary damages plus the prejudgment interest entered by the clerk. The statute contains claim and contract exclusions and a separate medical-malpractice timing rule, so 12% should not be applied outside the covered branch without checking the judgment and governing subsection.",
  },
  "south-carolina-judgment-rate": {
    tagline: "South Carolina judgment interest — a formula rate, reset twice a year.",
    q: "What is the current South Carolina post-judgment interest rate?",
    body: "South Carolina post-judgment interest is currently 10.75% — a statutory formula rate under S.C. Code Ann. § 34-31-20(B) that resets twice a year. This is the rate on money decrees and judgments under § 34-31-20(B), applicable to all judgments entered on or after July 1, 2005. TRANSITIONAL: for…",
  },
  "south-dakota-judgment-rate": {
    tagline: "South Dakota’s fixed Category B judgment branch and exceptions.",
    q: "What is the current South Dakota post-judgment interest rate?",
    body: "SDCL §54-3-5.1 applies the fixed Category B rate—currently 10%—to its general judgment branch; it is not a periodically resetting formula. A lawful contract can control, inverse-condemnation awards follow a separate 4.5% branch, and excluded judgment categories require their own authority. Confirm the selected branch before calculating.",
  },
  "utah-judgment-rate": {
    tagline: "Utah’s official annual judgment rate and 1993–present court history.",
    q: "What is the current Utah post-judgment interest rate?",
    body: "Utah State Courts publishes a {{current_rate}} general civil and criminal post-judgment rate for {{current_year}} under Utah Code §15-1-4. It equals the federal post-judgment rate on January 1, {{current_year}} ({{rate_minus_2}}) plus two percentage points. A qualifying judgment under $10,000 involving the purchase of goods or services uses {{rate_plus_8}} instead, while a lawful contract can supply its agreed rate.",
    postDetails: {
      scope: "The {{current_rate}} headline applies to the general civil and criminal judgment branch unless another rate is specified. Section 15-1-4 separately addresses lawful contract judgments and qualifying judgments under $10,000 involving goods or services; the latter is {{rate_plus_8}} for {{current_year}}.",
      accrual: "The applicable annual rate is selected by the calendar year in which judgment is entered. Utah Courts’ renewal guidance instructs filers to use the post-judgment rate in effect when the judgment was entered for the life of that judgment.",
      compounding: "The official annual tables establish the percentage and major branches, but the dataset does not yet have calculator-grade day-count, compounding, partial-payment, and renewal mechanics for every Utah judgment. The calculator therefore remains safely disabled.",
      history: "The dataset now preserves all {{history_points}} annual rates in the official Utah Courts table from 1993 through {{current_year}}, including the court’s original display precision. The weekly pipeline checks both the current and historic court tables and can append a new year only after overlapping values and the published formulas reconcile.",
    },
  },
  "vermont-judgment-rate": {
    tagline: "Vermont’s statutory judgment interest rate.",
    q: "What is the current Vermont post-judgment interest rate?",
    body: "Vermont money judgments carry a fixed statutory rate of 12% per year under 9 V.S.A. § 41a(a), as simple interest. No pre- vs post-judgment split in the rate itself: Vermont applies the same 12% legal rate to prejudgment interest (as of right on…",
  },
  "west-virginia-judgment-rate": {
    tagline: "West Virginia’s annual simple rate, fixed for a judgment at entry.",
    q: "What is the current West Virginia post-judgment interest rate?",
    body: "West Virginia’s {{current_year}} judgment-interest rate is {{current_rate}} per year under W. Va. Code §56-6-31. The Supreme Court of Appeals sets one rate for each calendar year from the Federal Reserve secondary discount rate plus two percentage points, subject to the statutory floor and ceiling. The rate in effect when judgment is entered remains fixed for that judgment.",
    postDetails: {
      scope: "Section 56-6-31 supplies the general rate for judgments and decrees for payment of money and contains separate treatment for qualifying contracts. Another controlling statute or the judgment’s terms can require additional analysis.",
      accrual: "The entry date selects the annual post-judgment rate, and the statute keeps that rate for the duration of the judgment. Prejudgment interest uses a different selection point tied to the cause of action, so it should not be flattened into the post-judgment headline.",
      compounding: "The statute describes simple interest. StatuteRates keeps the payoff calculator disabled because partial-payment allocation, day count, contractual branches, and every special judgment category are not yet modeled at calculator-grade certainty.",
      history: "The dataset preserves {{history_points}} signed annual court orders from January 2, 2007 through {{current_year}}. It retains the court’s exact January 2 boundaries for 2007 and 2008 and the signed 7.00% order for 2025 rather than substituting a secondary summary.",
    },
  },
  "wisconsin-judgment-rate": {
    tagline: "Wisconsin’s § 815.05(8) judgment rate, selected by entry date.",
    q: "What is the current Wisconsin post-judgment interest rate?",
    body: "For judgments entered on or after {{effective_date}} in the current recorded half-year, Wisconsin’s post-judgment interest rate is {{current_rate}} per year under Wis. Stat. § 815.05(8). The rate is one percentage point above the Federal Reserve H.15 bank prime rate in effect on the January 1 or July 1 immediately preceding entry of judgment, and it runs from entry until the judgment is paid.",
    postDetails: {
      scope: "Section 815.05(8) supplies the general post-judgment rule. Wis. Stat. §807.01(4), another statute, or a distinct judgment category can supersede that path. Prejudgment interest on a verdict, decision, or report is addressed separately in §814.04(4), so the {{current_rate}} headline is not a universal prejudgment rate.",
      accrual: "The judgment-entry date selects the controlling half-year benchmark: for January through June entries, use the H.15 bank prime rate in effect on the immediately preceding January 1; for July through December entries, use the rate in effect on the immediately preceding July 1. Add one percentage point. That selected annual rate remains fixed from entry until the judgment is paid.",
      compounding: "The statute and official table establish the entry-date rate, but StatuteRates does not enable a Wisconsin payoff calculator because calculator-grade day count, compounding, partial-payment allocation, and every superseding branch have not been fully verified.",
      history: "The dataset preserves all {{history_points}} official half-year rows from the special December 2, 2011 Act 69 transition through the current period. The former 12% rule is retained only as pre-transition context, not as a machine history row, because its complete historical start was not established from the bounded official sources.",
    },
  },
  "wyoming-judgment-rate": {
    tagline: "Wyoming’s general 10% judgment branch and statutory exceptions.",
    q: "What is the current Wyoming post-judgment interest rate?",
    body: "Wyo. Stat. §1-16-102 supplies a 10% general post-judgment branch from rendition. A qualifying contract judgment can use the contract rate, and specified child-support or maintenance judgments can carry no interest. The statute does not establish one universal compounding, day-count, or payment-allocation method, so this page does not enable a general payoff calculator.",
  },
  "maine-judgment-rate": {
    tagline: "Maine’s official annual Treasury-linked post-judgment rate.",
    q: "What is the current Maine post-judgment interest rate?",
    body: "Maine post-judgment interest is currently {{current_rate}} for interest beginning in {{current_year}}. Under 14 M.R.S. §1602-C, the general rate is the weekly-average one-year Treasury constant maturity yield for the last full week of the prior calendar year, plus 6 percentage points. A contract or note with an interest provision uses the greater of its written rate and the statutory rate.",
    postDetails: {
      scope: "The Treasury-plus-6 rate applies to the general civil and small-claims path. If a contract or note contains an interest provision, §1602-C(1)(A) uses the greater of the written rate and the statutory general rate.",
      accrual: "Interest accrues from and after entry of judgment and includes the appeal period. A continuance longer than 30 days obtained at the prevailing party’s request suspends interest for that period, and the court may fully or partially waive interest for good cause on the nonprevailing party’s petition.",
      compounding: "The rate is selected by the calendar year in which post-judgment interest begins. Section 1602-C does not specify the calculator-grade compounding, day-count, or partial-payment mechanics, so StatuteRates does not publish a Maine payoff calculator yet.",
      history: "The dataset contains all 24 annual rows in the official Judicial Branch chart from July 2003 through 2026. The 2025 row uses the court’s corrected April 1, 2025 value of 10.23%, replacing the 10.88% value first published due to an administrative error. The pipeline independently checks the current chart against official H.15 data.",
    },
  },
  "alabama-prejudgment-rate": {
    tagline: "Alabama’s 6% legal-rate reference for qualifying prejudgment claims.",
    q: "What is the Alabama prejudgment interest rate?",
    body: "Ala. Code §8-8-1 supplies a 6% legal-rate reference when no written contract rate controls, but it does not itself make every prejudgment claim eligible. Section 8-8-8 supports interest on qualifying contract obligations from the time payment or performance was due. Other claim types require their own entitlement, rate, and accrual authority.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "alabama-judgment-rate",
    appliesShort: "The 6% figure is a legal-rate reference, not a universal award for every claim.",
    applies: "For a qualifying contract claim, §8-8-8 provides the clearest statutory entitlement when the amount and due date can be determined under the agreement. Section 8-8-1 supplies the legal rate when no written rate governs. This page does not extend that contract rule to tort, equitable, or other claims without separate controlling authority.",
    accrual: "For a qualifying contract claim, Ala. Code § 8-8-8 starts interest when the money or other thing should have been paid, or when the contracted act should have been performed. Other claim types require their own authority and accrual analysis; this page does not infer one universal start date.",
    compound: "The cited statutes establish the annual rate reference but do not establish one universal compounding rule for every prejudgment claim. Confirm the controlling contract, judgment, and case law before calculating.",
  },
  "alaska-prejudgment-rate": {
    tagline: "Alaska’s annual prejudgment rate under AS 09.30.070 and ADM-505.",
    q: "What is the Alaska prejudgment interest rate?",
    body: "For a judgment entered in {{current_year}}, Alaska Court System form ADM-505 publishes {{current_rate}} as the general pre- and post-judgment rate under AS 09.30.070. The percentage is selected by the year judgment is entered and stays attached to that judgment. A contract, another statute, the damages category, or the older transition rule can supply a different result.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "alaska-judgment-rate",
    appliesShort: "Alaska prejudgment interest can reach tort and unliquidated damages, but statutory exclusions, contracts, and special statutes can change entitlement or the rate.",
    applies: "Prejudgment interest is a general remedy in Alaska and is NOT limited to liquidated or contract claims — it is recoverable on tort and unliquidated damages as compensation for loss of use of money. However, by statute AS 09.30.070(c), prejudgment interest may NOT be awarded on: (1) future economic damages, (2) future noneconomic damages, or (3) punitive damages. Where a written contract specifies an interest rate, that contract rate controls instead of the statutory rate.",
    accrual: "ADM-505 explains that prejudgment interest starts when the claimant could first sue, giving notice of an injury and the first breach of a contract as examples. The exact statutory notice, damages, contract, and special-claim branches must still be confirmed for the case.",
    compound: "Confirm the governing rule. ADM-505 publishes the annual percentage and selection year but does not state one universal calculator-grade compounding and payment-allocation method.",
    formula: "Three percentage points above the 12th Federal Reserve District discount rate in effect on January 2 of the year in which the judgment or decree is entered (AS 09.30.070(a)). ADM-505 publishes the selected annual schedule; the dataset preserves all {{history_points}} listed years from the August 7, 1997 transition through {{current_year}}.",
  },
  "arizona-prejudgment-rate": {
    tagline: "Arizona prejudgment interest is claim- and obligation-specific.",
    q: "What is the Arizona prejudgment interest rate?",
    body: "Arizona does not have one safely reusable prejudgment percentage. A.R.S. §44-1201(A) addresses qualifying medical debt, obligations, and written agreements; subsection (B) supplies the default prime-plus-one rate for nonmedical judgments; subsection (C) addresses condemnation; subsection (D) bars specified prejudgment categories; and subsection (F) directs an awarded prejudgment rate to subsection (A) or (B). The governing branch must be identified before selecting a rate.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "arizona-judgment-rate",
    appliesShort: "Subsection (D) excludes specified unliquidated, future, punitive, and exemplary damages; subsection (F) then points an allowed award to (A) or (B).",
    applies: "A.R.S. §44-1201(D) bars prejudgment interest on unliquidated damages and on future, punitive, or exemplary damages found by the trier of fact. When an award is permitted, subsection (F) directs the rate to subsection (A) or (B), while condemnation follows subsection (C).",
    accrual: "A qualifying liquidated obligation generally requires a definite amount and legally relevant due date, but this page does not assign one start date to every subsection or claim. Confirm the instrument, demand, due date, and controlling authority.",
    compound: "No universal prejudgment compounding method is stated for every §44-1201 branch. Confirm the governing agreement and authority before calculating.",
    formula: "Subsection (F) points an allowed prejudgment award to subsection (A) or (B). Select the rate only after identifying the applicable medical-debt, obligation, written-agreement, default nonmedical-judgment, or condemnation branch.",
  },
  "arkansas-prejudgment-rate": {
    tagline: "Arkansas prejudgment interest under the judgment-date formula when an award is appropriate.",
    q: "What is the Arkansas prejudgment interest rate?",
    body: "Ark. Code Ann. §16-65-114(a), as amended by Act 995 of 2019, provides that a judgment bears post-judgment interest and, when appropriate on the facts, prejudgment interest under a judgment-date benchmark formula. The recorded formula result is {{current_rate}} for the benchmark period beginning {{effective_date}}, but the statute does not make prejudgment interest automatic for every claim.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "arkansas-judgment-rate",
    appliesShort: "An award still depends on claim-specific Arkansas law; the rate statute says prejudgment interest applies only when appropriate under the facts.",
    applies: "Act 995 supplies the rate framework but not a universal entitlement rule. A claimant must separately establish that prejudgment interest is recoverable for the particular obligation and damages; the page does not convert the post-judgment formula into an automatic prejudgment award.",
    accrual: "The legal start date depends on the claim and when the recoverable amount became due or ascertainable. The benchmark used by §16-65-114 is selected on the judgment date, which is distinct from the period over which any allowed prejudgment interest accrues.",
    compound: "The reviewed enactment does not supply every compounding and payment-allocation rule needed for a universal calculator, so no automatic method is asserted.",
    formula: "For the statutory no-contract branch, use the Federal Reserve primary-credit rate in effect on the judgment date plus two percentage points, subject to the constitutional maximum. A qualifying contract branch and entitlement rules require separate review.",
  },
  "california-prejudgment-rate": {
    tagline: "California prejudgment interest depends on certainty, claim type, and the governing obligation.",
    q: "What is the California prejudgment interest rate?",
    body: "California prejudgment interest is not one universal tort-versus-contract rate. Civil Code §3287 addresses certainty, vesting, and discretionary contract awards; §3288 permits a discretionary award in specified noncontract cases; and §3289(b) supplies 10% after breach for a contract with no stipulated legal rate. The constitutional 7% legal rate can be relevant to another qualifying branch, but eligibility and calculation must be established first.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "california-judgment-rate",
    appliesShort: "Prejudgment interest is NOT automatic on all claims.",
    applies: "Prejudgment interest is NOT automatic on all claims. MANDATORY (as of right) only where damages are \"certain, or capable of being made certain by calculation\" and the right vested on a particular day — i.e., liquidated/readily ascertainable claims (Civ. Code sec. 3287(a)). UNLIQUIDATED tort claims: interest is BARRED as of right; it is DISCRETIONARY with the jury, and only in actions for breach of a non-contract obligation or cases of oppression, fraud, or malice (Civ. Code sec. 3288).",
    accrual: "For mandatory liquidated claims under Civil Code §3287(a), interest starts on the day the right to recover vested and the damages were certain or calculable. For a qualifying contract with no stipulated legal rate, §3289(b) applies 10% after breach. For an unliquidated contract claim, §3287(b) lets the court choose a date before judgment, but never earlier than the filing date.",
    compound: "The cited provisions do not establish one universal compounding rule for every contract, tort, discretionary, and constitutional-rate branch. Confirm the governing obligation and award.",
    formula: "Section 3289(b) supplies 10% after breach for a qualifying contract with no stipulated legal rate. Do not treat the constitutional 7% reference as an automatic rate for every tort or other noncontract claim.",
  },
  "colorado-prejudgment-rate": {
    tagline: "Colorado prejudgment interest has general, personal-injury, and medical-debt branches.",
    q: "What is the Colorado prejudgment interest rate?",
    body: "Colorado’s general wrongfully-withheld-money branch uses 8% under C.R.S. §5-12-102, while §13-21-101 supplies a separate 9% personal-injury branch. A qualifying medical-debt claim can instead be capped at 3%, so the 8% and 9% figures are not universal. Entitlement, accrual, and compounding must be matched to the controlling branch.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "colorado-judgment-rate",
    appliesShort: "Prejudgment interest is NOT limited to liquidated/ascertainable sums.",
    applies: "Section 5-12-102 addresses money or property wrongfully withheld and is not limited to claims liquidated in advance. Section 13-21-101 separately governs qualifying personal-injury actions. Medical debt and other special statutes can displace those headline branches.",
    accrual: "The general branch looks to when money or property was wrongfully withheld or became due. Personal-injury and medical-debt matters use their own statutory timing, so this page does not assign one start date across all branches.",
    compound: "The general and personal-injury statutes contain annual-compounding rules, but the medical-debt cap and any other controlling branch must be checked before applying them.",
  },
  "connecticut-prejudgment-rate": {
    tagline: "Connecticut prejudgment interest is discretionary and capped at 10%.",
    q: "What is the Connecticut prejudgment interest rate?",
    body: "Under Conn. Gen. Stat. §37-3a, a court may award prejudgment interest of up to 10% per year as damages for detaining money after it becomes payable. It is not an automatic 10% award. For debt arising from hospital services, both pre- and post-judgment interest are capped at 5% and the award remains discretionary.",
    prejudgment: true,
    kind: "discretionary-with-cap",
    kindLabel: "Discretionary, capped",
    postSlug: "connecticut-judgment-rate",
    appliesShort: "Available only when the court finds a qualifying detention of money after it became payable.",
    applies: "§ 37-3a prejudgment interest is available ONLY as \"damages for the detention of money after it becomes payable\" — i.e., a LIQUIDATED or readily ascertainable sum that was wrongfully withheld after it became due (breach of contract, unpaid debts, wrongfully retained deposits/payments, ascertainable amounts).",
    accrual: "Interest runs from the date the money became due and payable / the date it was wrongfully withheld (i.e., the date the court determines the money was due), through the date of judgment. Not from date of filing.",
    compound: "The statute states an annual ceiling but does not itself supply a universal compounding and payment-allocation method. StatuteRates therefore keeps this discretionary branch out of the calculator.",
  },
  "delaware-prejudgment-rate": {
    tagline: "Delaware prejudgment interest — a formula rate, reset periodically.",
    q: "What is the Delaware prejudgment interest rate?",
    body: "Delaware’s recorded legal-rate observation is {{current_rate}} beginning {{effective_date}} under 6 Del. C. §2301(a). Entitlement and the date from which interest is due remain claim-specific. A contract can supply a different pre-judgment rate, and §2301(d) creates a separate tort settlement-demand branch.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "delaware-judgment-rate",
    appliesShort: "Entitlement depends on the claim; contract and qualifying tort-demand branches are not interchangeable.",
    applies: "Delaware decisions commonly award prejudgment interest on money due in contract matters, but the claim, obligation, and legally relevant due date still control. Section 2301(d) separately conditions tort interest on a qualifying written settlement demand and final award. This page does not describe either branch as automatic for every civil claim.",
    accrual: "From the date of breach / the date payment became due (when the money should have been paid). Tort compensatory damages under § 2301(d): from the date of injury, but only if the qualifying written settlement demand (valid 30+ days, below the final award) was made.",
    compound: "Delaware generally disfavors compound interest absent an express contract or statutory basis, but the governing obligation and specialized proceeding must be checked before calculating.",
    formula: "The legal rate is the Federal Reserve discount rate, including any surcharge, plus five percentage points, measured as of the time from which interest is due. The current displayed observation is {{current_rate}} effective {{effective_date}}.",
  },
  "florida-prejudgment-rate": {
    tagline: "Florida prejudgment interest — a formula rate, reset each quarter.",
    q: "What is the Florida prejudgment interest rate?",
    body: "Florida’s prejudgment reference uses the monitored quarterly rate schedule under Fla. Stat. § 55.03; the current value and effective date are shown above. Prejudgment interest is available ONLY on LIQUIDATED / readily ascertainable damages representing an actual out-of-pocket pecuniary loss fixed as of a date certain (Argonaut \"loss theory\").",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "florida-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on LIQUIDATED / readily ascertainable damages representing an actual out-of-pocket pecuniary loss fixed as of a date certain (Argonaut \"loss theory\").",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED / readily ascertainable damages representing an actual out-of-pocket pecuniary loss fixed as of a date certain (Argonaut \"loss theory\"). Neither the merit of the defense nor the disputed certainty of the amount defeats entitlement once the verdict liquidates the loss as of a prior date — computation is then a purely ministerial/mathematical duty.",
    accrual: "Accrues from the date the plaintiff suffered the pecuniary loss (date of loss). For breach of contract, typically the date payment/performance was due; for qualifying economic tort/out-of-pocket losses, the date the actual loss was incurred. Runs through the date of judgment.",
    compound: "Simple. Florida does not compound prejudgment interest; once computed it is added to principal and the total then bears post-judgment interest (avoiding \"interest on interest\").",
    formula: "Prejudgment interest accrues at the § 55.03 statutory rate in effect during each period from the date of loss to the date of judgment. § 55.03 rate = 12-month average of the Federal Reserve Bank of New York discount rate + 400 basis points, reset quarterly (Dec 1 / Mar 1 / Jun 1 / Sep 1) by the CFO.",
  },
  "georgia-prejudgment-rate": {
    tagline: "Georgia prejudgment interest — {{current_rate_part_1}} for liquidated claims, {{current_rate_part_2}} for the current tort benchmark.",
    q: "What is the Georgia prejudgment interest rate?",
    body: "Georgia has two different prejudgment paths. A qualifying liquidated demand uses the {{current_rate_part_1}} legal rate under O.C.G.A. §§7-4-2 and 7-4-15. A qualifying unliquidated tort demand under §51-12-14 instead uses the Federal Reserve prime rate on the benchmark-selection day plus 3 points — currently {{current_rate_part_2}}. The claim type and notice determine which path, if either, applies.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "georgia-judgment-rate",
    appliesShort: "A liquidated sum can use §§7-4-2 and 7-4-15; a qualifying unliquidated tort demand follows the separate §51-12-14 notice formula.",
    applies: "For the liquidated-demand path, the amount must be fixed or certain by agreement or otherwise; a genuine factual dispute over the amount can prevent §7-4-15 interest. Section 51-12-14 creates a separate path for qualifying unliquidated tort damages after the required written notice. It does not turn every tort claim into an automatic award.",
    accrual: "For a qualifying liquidated demand, interest runs from the legally relevant date the party became bound to pay, or from demand where the obligation is payable on demand. For the §51-12-14 tort path, interest begins on the 30th day after the last written notice, and the prime rate on that 30th day supplies the benchmark.",
    compound: "Both recorded paths are treated as simple interest. The calculator remains withheld because eligibility, notice, the exact accrual date, offsets, and payment mechanics depend on the claim.",
    formula: "The liquidated path remains 7%. The tort-demand path is Federal Reserve prime plus 3 percentage points; the history table records every benchmark change since the current scheme began and the weekly pipeline monitors FRED for the next change.",
  },
  "hawaii-prejudgment-rate": {
    tagline: "Hawaii prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Hawaii prejudgment interest rate?",
    body: "In Hawaii, prejudgment interest is discretionary: a court may award it, and when it does the rate is 10% per year under HRS 636-16. Prejudgment interest is DISCRETIONARY, not automatic.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "hawaii-judgment-rate",
    appliesShort: "Prejudgment interest is DISCRETIONARY, not automatic.",
    applies: "Prejudgment interest is DISCRETIONARY, not automatic. HRS 636-16 authorizes the judge to award interest and to designate the commencement date \"to conform with the circumstances of each case.\" It is available in BOTH tort and breach-of-contract cases (unlike many states, Hawaii does not limit prejudgment interest to liquidated/ascertainable contract claims).",
    accrual: "Discretionary commencement date set by the judge per HRS 636-16. Earliest permissible date: in tort, the date the injury first occurred; in breach of contract, the date the breach first occurred. The court may select a later date to fit the circumstances (e.g., to avoid rewarding a party for delay).",
    compound: "Simple. Compound interest is not recoverable in Hawaii (HRS 478-7), and prejudgment interest is not compounded; post-judgment interest is not allowed to accrue on the prejudgment-interest component.",
  },
  "idaho-prejudgment-rate": {
    tagline: "Idaho’s legal-rate reference for qualifying prejudgment claims.",
    q: "What is the Idaho prejudgment interest rate?",
    body: "Idaho Code §28-22-104(1) supplies a 12% legal-rate branch for money due on qualifying instruments, accounts, loans, and retained money when no written rate controls. It does not itself establish a universal prejudgment award for every claim. Idaho Code §12-301 and the State Treasurer’s settlement-offer rate create a separate procedural branch.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "idaho-judgment-rate",
    appliesShort: "The 12% branch covers listed obligations; claim entitlement and the separate settlement-offer branch require additional authority.",
    applies: "The 12% legal-rate branch applies only to the obligations listed in §28-22-104(1), subject to a written rate. Whether a damages claim receives prejudgment interest depends on controlling Idaho authority and ascertainability. Section 12-301 can create a distinct settlement-offer consequence and must not be collapsed into the 12% headline.",
    accrual: "Interest accrues from the date the money became \"due\" (for contract, the date of breach), provided that at that point the amount was liquidated or ascertainable by mathematical computation.",
    compound: "The cited rate statute does not establish one universal compounding method for every prejudgment claim or settlement-offer branch. Confirm the controlling authority before calculating.",
  },
  "illinois-prejudgment-rate": {
    tagline: "Illinois prejudgment interest has separate 6% injury and 5% Interest Act branches.",
    q: "What is the Illinois prejudgment interest rate?",
    body: "Illinois uses separate authorities rather than one blended rate. Section 2-1303(c) of the Code of Civil Procedure supplies 6% prejudgment interest for qualifying personal-injury and wrongful-death actions. Section 2 of the Interest Act supplies 5% for listed instruments, loans, settled accounts, retained money, and unreasonable-and-vexatious delay. Eligibility and timing differ by branch.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "illinois-judgment-rate",
    appliesShort: "The 6% and 5% figures come from different statutes with different covered claims.",
    applies: "The 6% §2-1303(c) branch is limited to qualifying personal-injury and wrongful-death actions and includes statutory exclusions and reductions. The 5% Interest Act branch covers only its listed obligation and delay categories. A claim must satisfy one branch on its own terms.",
    accrual: "The §2-1303(c) injury branch generally measures from filing, with statutory tolling, settlement-offer, fault, damages, and duration rules. Interest Act timing follows the applicable instrument, account, receipt, or delay category instead.",
    compound: "Both statutes state annual percentages, but exact calculation must follow the selected branch and its offsets and limitations; this page does not merge them into one calculator rule.",
  },
  "indiana-prejudgment-rate": {
    tagline: "Indiana prejudgment interest has distinct contract and tort branches.",
    q: "What is the Indiana prejudgment interest rate?",
    body: "Indiana’s contract/account branch under IC 24-4.6-1-103 uses 8% for listed obligations when no different rate controls. Tort actions follow the separate Prejudgment Interest Act, IC 34-51-4, which permits a court-selected simple rate from 6% to 10% only when its offer, timing, and procedural conditions are met. Neither figure is a universal statewide award.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "indiana-judgment-rate",
    appliesShort: "The 8% listed-obligation branch and discretionary 6%–10% tort branch have different prerequisites.",
    applies: "IC 24-4.6-1-103 covers specified instruments, accounts, and retained money, subject to the governing obligation. IC 34-51-4 separately governs tort prejudgment interest and requires compliance with its settlement-offer and timing conditions; the court chooses a rate within the statutory range.",
    accrual: "The listed-obligation branch uses the applicable due, settlement, demand, or receipt date. The tort statute uses its own filing and settlement-offer period. The correct start date cannot be selected until the branch is known.",
    compound: "The tort statute expressly uses simple interest. Do not assume that single tort instruction resolves every contract, account, agreement, or payment-allocation question.",
  },
  "iowa-prejudgment-rate": {
    tagline: "Iowa prejudgment interest — monthly published rate, selected at judgment.",
    q: "What is the Iowa prejudgment interest rate?",
    body: "Iowa’s general prejudgment rate uses the same Iowa Code §668.13 selection as post-judgment interest: the State Court Administrator’s monthly one-year Treasury CMT value plus 2 percentage points, selected as of the judgment. The published table changes monthly, but an individual judgment does not reset every month. Entitlement and the accrual start still depend on the claim and governing statute.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "iowa-judgment-rate",
    appliesShort: "The general §668.13 path can include interest before judgment, but future damages, contract-rate cases, non-chapter-668 verdict interest, support obligations, and workers’ compensation use important separate rules.",
    applies: "Sections 535.3 and 668.13 govern the general judgment-interest path, including interest for the period before entry. A lawful contract rate can control under §668.13(2). Future damages do not earn interest before judgment, and §625.21 separately addresses verdict-to-final-entry interest in actions outside chapter 668. Workers’ compensation and support obligations have their own §535.3 rules.",
    accrual: "The general §668.13(1) path begins on the date the action is commenced. Future damages begin only on entry of judgment under §668.13(4). Section 625.21 instead adds interest from verdict or report until final judgment in covered non-chapter-668 money cases, so the correct start date depends on the claim.",
    compound: "Ordinary §668.13 interest is computed daily to payment and treated as simple interest. Structured or periodic non-lump-sum judgments use annuity principles under §668.13(6). The statute does not itself specify every day-count and payment-allocation mechanic.",
    formula: "The State Court Administrator publishes a monthly one-year Treasury constant maturity selection from Federal Reserve H.15; §668.13 adds 2 percentage points and selects the rate as of judgment. It is not a weekly-average series and does not float month by month after judgment.",
  },
  "kansas-prejudgment-rate": {
    tagline: "Kansas prejudgment interest — {{current_rate_part_1}} general, or {{current_rate_part_2}} for the current recent-tort branch.",
    q: "What is the Kansas prejudgment interest rate?",
    body: "Kansas prejudgment interest is {{current_rate_part_1}} for general/contract claims (K.S.A. 16-201), but for civil tort actions filed on or after July 1, 2023 it is the judgment rate minus 2 points — currently {{current_rate_part_2}}. Prejudgment interest is available only on LIQUIDATED claims — where both the amount due and the date it became due are fixed and certain, or definitely ascertainable by mathematical…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "kansas-judgment-rate",
    appliesShort: "Prejudgment interest is available only on LIQUIDATED claims — where both the amount due and the date it became due are fixed and certain, or definitely ascertainable by mathematical…",
    applies: "Prejudgment interest is available only on LIQUIDATED claims — where both the amount due and the date it became due are fixed and certain, or definitely ascertainable by mathematical computation. It is generally BARRED on unliquidated claims (amount not fixed/ascertainable). A good-faith dispute over liability does not by itself defeat prejudgment interest once the claim is liquidated.",
    accrual: "Accrues from the date the claim became due / the amount became liquidated (the day the account is liquidated and the balance ascertained; for periodic obligations, from each date the respective amount became due), running until the date of judgment.",
    compound: "Simple.",
  },
  "kentucky-prejudgment-rate": {
    tagline: "Kentucky prejudgment interest depends on the claim; 8% is a legal reference, not a universal award.",
    q: "What is the Kentucky prejudgment interest rate?",
    body: "Kentucky’s legal rate is 8% per year under KRS 360.010(1), but that figure is not automatic for every prejudgment claim. Kentucky authority distinguishes liquidated or readily ascertainable sums from unliquidated damages. For an unliquidated claim, a court may award no prejudgment interest or select a rate up to the legal rate, and the court may choose simple or compound treatment.",
    prejudgment: true,
    kind: "claim-dependent",
    kindLabel: "Claim-dependent",
    postSlug: "kentucky-judgment-rate",
    appliesShort: "Liquidated claims and unliquidated claims follow different entitlement rules.",
    applies: "Prejudgment interest is generally available as a matter of right on a liquidated claim whose amount is fixed or readily ascertainable, while an award on unliquidated damages is equitable and discretionary. A written agreement or a claim-specific statute may supply a different rule or rate.",
    accrual: "For a qualifying liquidated claim, interest generally runs from the time the payment became due or the amount became fixed through entry of judgment. An unliquidated award depends on the court’s equitable findings, so the start date cannot be safely inferred from the 8% legal-rate statute alone.",
    compound: "Do not assume a single method. Kentucky appellate authority treats simple-versus-compound prejudgment interest on an unliquidated claim as part of the court’s discretion. The calculator remains withheld because entitlement, rate, start date, and compounding are not deterministic across claim types.",
    formula: "KRS 360.010(1) supplies an 8% annual legal reference rate. It is a ceiling/reference for the discretionary unliquidated path, not a promise that every successful claimant receives 8%.",
  },
  "louisiana-prejudgment-rate": {
    tagline: "Louisiana prejudgment interest has separate tort, contract, and government-defendant paths.",
    q: "What is the Louisiana prejudgment interest rate?",
    seoDescription: "2026 Louisiana prejudgment interest is claim-dependent. See tort, contract, government-defendant branches, accrual rules, limits, and official sources.",
    body: "Louisiana does not apply one universal prejudgment rate or start date. General ex delicto judgments ordinarily use the annual judicial-interest schedule under La. R.S. 13:4202 and accrue from judicial demand under R.S. 13:4203. For a personal-injury or wrongful-death claim against the state or a political subdivision governed by current R.S. 13:5112(C), prejudgment interest is instead the lesser of 6% or the applicable judicial rate. A monetary contract claim can use an agreed rate under Civil Code art. 2000.",
    prejudgment: true,
    kind: "claim-dependent",
    kindLabel: "Claim-dependent",
    postSlug: "louisiana-judgment-rate",
    appliesShort: "The applicable rate and start date depend on the claim and defendant.",
    applies: "General damages ex delicto use R.S. 13:4203. A monetary contract can use Civil Code art. 2000. Effective August 1, 2026, Act 13 amended R.S. 13:5112(C) for personal-injury and wrongful-death claims against the state or a political subdivision: the prejudgment rate is the lesser of 6% or the applicable R.S. 13:4202 judicial rate.",
    accrual: "General ex delicto judicial interest attaches from judicial demand under R.S. 13:4203. Civil Code art. 2000 measures delay on a qualifying monetary obligation from the time the sum is due, with R.S. 9:3500 resolving the legal-interest rate to R.S. 13:4202. For the covered government-defendant branch, R.S. 13:5112(C) separately labels the period from the request for service through the trial judge’s signature as prejudgment interest and the period after signature as post-judgment interest at the applicable judicial rate.",
    compound: "Do not compound automatically. Civil Code art. 2001 permits interest on accrued interest only when the parties add it to principal through a new agreement made after the interest accrued. Day count, payment allocation, and claim-specific branches remain outside the calculator model.",
    formula: "R.S. 13:4202(B) sets each following calendar year’s judicial rate from the specified Federal Reserve benchmark plus 3.25 percentage points. The R.S. 13:5112(C) government-defendant prejudgment branch uses the lesser of 6% or that applicable annual judicial rate.",
  },
  "maine-prejudgment-rate": {
    tagline: "Maine’s official annual Treasury-linked prejudgment rate.",
    q: "What is the Maine prejudgment interest rate?",
    body: "Maine prejudgment interest is currently {{current_rate}} for interest beginning in {{current_year}}. Under 14 M.R.S. §1602-B, the general rate is the prior year’s last-full-week average one-year Treasury constant maturity yield plus 3 percentage points. The official Judicial Branch chart supplies one rate for each year; the dataset preserves all {{history_points}} rows from July 2003 through {{current_year}}.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "maine-judgment-rate",
    appliesShort: "The general civil-action path is broad, with separate small-claims and written-contract branches.",
    applies: "For civil actions outside the small-claims and interest-bearing contract/note branches, §1602-B(3) allows the Treasury-plus-3 rate and does not state a liquidated-claim limitation. Small claims generally receive no prejudgment interest unless based on a contract or note with an interest provision; that writing supplies the rate for the contract/note branch.",
    accrual: "Interest starts when a sworn notice of claim is properly served, or from filing if no such notice was given, and runs until judgment. A prevailing party’s requested continuance longer than 30 days suspends interest for the continuance; the court may fully or partially waive an award for good cause.",
    compound: "Section 1602-B does not specify calculator-grade compounding or day-count mechanics. It does expressly prohibit adding prejudgment interest to the principal base on which post-judgment interest accrues. StatuteRates therefore withholds the Maine calculator rather than assume a method.",
    formula: "The general rate is the weekly-average one-year Treasury constant maturity yield for the last full week of the calendar year immediately before interest begins, plus 3 points. The corrected official 2025 rate is 7.23%, not the 7.88% value initially published in error.",
  },
  "maryland-prejudgment-rate": {
    tagline: "Maryland’s 6% legal-rate reference and claim-specific prejudgment rules.",
    q: "What is the Maryland prejudgment interest rate?",
    body: "Maryland Constitution Article III, §57 supplies a 6% legal-rate reference, but it does not by itself decide entitlement, accrual, or calculation for every prejudgment claim. Those questions depend on the governing obligation and Maryland case law, including the claim categories discussed in Buxton v. Buxton.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "maryland-judgment-rate",
    appliesShort: "Eligibility is controlled by Maryland case law and the obligation, not by the constitutional percentage alone.",
    applies: "Maryland decisions distinguish claims receiving interest as of right, claims where interest is forbidden, and claims left to the factfinder. A fixed obligation due on a definite date can fit the first category, but this page does not extend that result to every contract, tort, conversion, or equitable claim.",
    accrual: "For a claim that qualifies as of right, the legally relevant due date can control. Discretionary and excluded categories follow different rules, so the constitutional provision alone does not supply one start date.",
    compound: "The constitutional provision states the legal rate but not a universal prejudgment compounding method. Confirm the controlling opinion, instrument, and judgment before calculating.",
  },
  "massachusetts-prejudgment-rate": {
    tagline: "Massachusetts’s prejudgment interest rate — when a court awards it.",
    q: "What is the Massachusetts prejudgment interest rate?",
    body: "Massachusetts prejudgment interest is 12% per year, as simple interest under M.G.L. c. 231, § 6B. Prejudgment interest is mandatory and added automatically by the clerk (not discretionary) once damages are awarded.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "massachusetts-judgment-rate",
    appliesShort: "Prejudgment interest is mandatory and added automatically by the clerk (not discretionary) once damages are awarded.",
    applies: "Prejudgment interest is mandatory and added automatically by the clerk (not discretionary) once damages are awarded. § 6B covers pecuniary damages for personal injuries, consequential damages, and property damage in tort actions. § 6C covers actions based on contractual obligations. § 6H is a catch-all adding § 6B's rate to any damages award where interest is not otherwise provided by law.",
    accrual: "Tort (§ 6B): from the date of commencement of the action (filing). Contract (§ 6C): from the date of the breach or demand; if that date cannot be established, from the date of commencement of the action. Catch-all (§ 6H): from the date of commencement of the action.",
    compound: "Simple.",
  },
  "michigan-prejudgment-rate": {
    tagline: "Michigan complaint-to-judgment interest under the Treasury-based statutory formula.",
    q: "What is the Michigan prejudgment interest rate?",
    body: "Michigan uses MCL 600.6013 for the complaint-to-judgment portion as well as post-judgment interest. The general subsection (8) reference is currently {{current_rate}}: the official five-year Treasury benchmark plus one point, compounded annually. The statute applies calculation intervals from complaint filing; the January and July dates are certificate dates, not a complete payoff schedule.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "michigan-judgment-rate",
    appliesShort: "The general MCL 600.6013 path runs from complaint filing, but complaint vintage, written instruments, future damages, tort settlement offers, and medical-malpractice provisions can change the treatment.",
    applies: "For the general current branch, MCL 600.6013 runs interest from complaint filing through satisfaction and is not limited to liquidated claims. Complaint dates before July 1, 2002, qualifying written instruments, tort settlement offers, medical-malpractice cases, and future damages have separate statutory treatment.",
    accrual: "For covered complaints, subsection (1) does not allow interest on future damages from complaint filing through judgment entry. Interest on that future-damages component begins at judgment. Other covered amounts in the general subsection (8) path run from complaint filing through satisfaction.",
    compound: "Annual compounding is specified for the general subsection (8) and current written-instrument subsection (7) branches. Exact six-month application intervals, annual anniversaries, day count, payments, and every older complaint-vintage branch remain outside the calculator.",
    formula: "Michigan Treasury certifies a five-year Treasury benchmark for January 1 and July 1. The general subsection (8) rate adds one point, but the statute applies the rates in six-month intervals from complaint filing. Current certificate (effective {{effective_date}}): {{rate_minus_1}} + 1% = {{current_rate}}.",
  },
  "minnesota-prejudgment-rate": {
    tagline: "Minnesota prejudgment interest — {{current_rate_part_1}}, or {{current_rate_part_2}} on awards over $50,000.",
    q: "What is the Minnesota prejudgment interest rate?",
    body: "Minnesota preverdict interest is {{current_rate_part_1}} per year, but rises to {{current_rate_part_2}} on judgments/awards over $50,000 (Minn. Stat. §549.09, subd. 1(b)–(c)) — the same two-tier split as post-judgment interest. Preverdict interest is allowed broadly on \"pecuniary damages\" — it is NOT limited to liquidated or contract claims and DOES apply to tort/personal-injury claims (for past pecuniary…",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "minnesota-judgment-rate",
    appliesShort: "Preverdict interest is allowed broadly on \"pecuniary damages\" — it is NOT limited to liquidated or contract claims and DOES apply to tort/personal-injury claims (for past pecuniary…",
    applies: "Preverdict interest is allowed broadly on \"pecuniary damages\" — it is NOT limited to liquidated or contract claims and DOES apply to tort/personal-injury claims (for past pecuniary damages), even when damages were unliquidated/not readily ascertainable (Minnesota abolished the old ascertainability limit in 1984).",
    accrual: "(a) commencement of the action, (b) a demand for arbitration, or (c) the time of a written notice of claim — whichever occurs first. To use the written-notice-of-claim date, the notice must contain sufficient information/demand AND the action must be commenced within two years of that written notice; otherwise…",
    compound: "Simple. Subd. 1(c)(1) expressly specifies \"simple interest per annum.\".",
    formula: "Two tiers. (1) Judgments/awards not over $50,000: rate = max(one-year constant maturity Treasury yield rounded to nearest 1%, 4%). Set annually by the State Court Administrator by Dec. 20 (official annual notice at https://www.revisor.mn.gov/court_rules/rule/msinte/).",
  },
  "mississippi-prejudgment-rate": {
    tagline: "Mississippi uses the contract rate or a rate selected by the court.",
    q: "What is the Mississippi prejudgment interest rate?",
    body: "Mississippi does not set one universal prejudgment percentage. Under Miss. Code Ann. §75-17-7, a judgment founded on a sale or contract uses the rate supplied by the contract evidencing the debt. For other judgments, the judge selects a fair annual rate and a fair start date. The 8% legal contract rate in §75-17-1 may be relevant in some matters, but it is not a mandatory statewide prejudgment rate.",
    prejudgment: true,
    kind: "case-specific",
    kindLabel: "Case-specific",
    appliesShort: "The governing contract or the judge supplies the percentage; entitlement and timing depend on the claim and order.",
    applies: "Section 75-17-7 separates judgments founded on a sale or contract from all other judgments. Contract and sale matters look to the rate in the contract evidencing the debt. In the other category, the judge may include prejudgment interest and selects a rate considered fair. Entitlement still depends on Mississippi law and the facts; the record intentionally does not flatten those branches into 8%.",
    accrual: "For the 'all other judgments' category, §75-17-7 lets the judge select a fair start date but never a date before the complaint was filed. Contract or sale claims can follow the governing obligation and claim-specific authority, so there is no single statewide start date.",
    compound: "Case-specific. Mississippi authority recognizes that the governing contract or court may determine the method, and courts have approved different rates and simple-interest outcomes. Do not assume either simple or compound treatment without the controlling contract and order.",
    formula: "There is no universal formula: use the contract rate for the contract/sale branch, or the rate expressly selected by the judge for the other-judgment branch. This is why the machine-readable numeric value is intentionally null.",
  },
  "missouri-prejudgment-rate": {
    tagline: "Missouri prejudgment interest — a verified 9% non-tort branch and unresolved tort benchmark.",
    q: "What is the Missouri prejudgment interest rate?",
    seoDescription: "Missouri prejudgment interest: 9% for qualifying non-tort claims; the current tort benchmark is withheld. See eligibility, timing, and official sources.",
    body: "Missouri prejudgment interest is claim-specific. Qualifying non-tort obligations may use the 9% rule in §408.020. The current numeric tort rate is withheld because §408.040 refers to the ‘intended Federal Funds Rate’ and the reviewed Federal Reserve publications do not establish whether that means a target-bound or effective-rate value. StatuteRates will not substitute a plausible number.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "missouri-judgment-rate",
    appliesShort: "Prejudgment interest is NOT freely available; it is claim-type restricted.",
    applies: "Prejudgment interest is NOT freely available; it is claim-type restricted. (1) TORT actions (§ 408.040.2): available ONLY if the claimant made a written demand/settlement offer sent by certified mail return receipt, accompanied by a signed affidavit describing the claim, injuries, and a computation of damage categories with supporting documentation (medical provider list, bills, employer list and authorizations for PI/wrongful-death wage claims), the demand references § 408.040 and stays open 90 days, the suit is…",
    accrual: "TORT (§ 408.040.2): accrues from a date 90 days AFTER the demand/offer was received (per certified-mail return receipt), OR from the date the demand/offer was rejected without a counteroffer, whichever is earlier.",
    compound: "The current tort benchmark is unresolved, and this page does not provide a calculator method for that branch. Confirm the controlling order and statute for any non-tort calculation as well.",
    formula: "Do not treat the two Missouri formulas as interchangeable or choose a target-bound/effective-rate proxy. Section 408.040.3 refers to the intended Federal Funds Rate plus five points for the tort judgment; subsection .4 separately addresses the prejudgment-interest portion after judgment. The numeric tort result remains unavailable pending authoritative clarification.",
  },
  "montana-prejudgment-rate": {
    tagline: "Montana prejudgment interest — {{current_rate_part_1}} for liquidated claims, {{current_rate_part_2}} for the current tort benchmark.",
    q: "What is the Montana prejudgment interest rate?",
    body: "Montana prejudgment interest is {{current_rate_part_1}} simple for liquidated/contract claims (the legal rate, MCA §31-1-106), but tort prejudgment interest is prime + 3% — currently {{current_rate_part_2}} — under §27-1-210. Prejudgment interest is MANDATORY (not discretionary) under MCA 27-1-211 only when three criteria are met: (1) an underlying monetary obligation exists; (2) the amount of recovery is…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "montana-judgment-rate",
    appliesShort: "Prejudgment interest is MANDATORY (not discretionary) under MCA 27-1-211 only when three criteria are met: (1) an underlying monetary obligation exists; (2) the amount of recovery is…",
    applies: "Prejudgment interest is MANDATORY (not discretionary) under MCA 27-1-211 only when three criteria are met: (1) an underlying monetary obligation exists; (2) the amount of recovery is certain or capable of being made certain by calculation (liquidated/ascertainable); and (3) the right to recover vests on a particular day. Unliquidated/uncertain claims generally do NOT get mandatory prejudgment interest under 27-1-211.",
    accrual: "Non-tort/liquidated (MCA 27-1-211): interest runs from the day the right to recover vests (the day the sum became due/certain), except during any time the debtor is prevented by law or by the creditor's act from paying.",
    compound: "Simple. MCA 31-1-106 legal-rate prejudgment interest is applied as simple interest under Montana practice; MCA 27-1-210 tort interest and MCA 25-9-205 both expressly state interest may not be compounded.",
  },
  "nebraska-prejudgment-rate": {
    tagline: "Nebraska prejudgment interest — separate 12% and settlement-offer tracks.",
    q: "What is the Nebraska prejudgment interest rate?",
    body: "Nebraska prejudgment interest is not one automatic rate. Qualifying liquidated claims use the 12% §45-104 rate under §45-103.02(2). A qualifying unliquidated claim uses the current §45-103 judgment rate only when every settlement-offer condition in §45-103.02(1) is satisfied. The two figures above show these separate statutory paths.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Two statutory tracks",
    postSlug: "nebraska-judgment-rate",
    appliesShort: "Nebraska uses separate liquidated-claim, listed contract-obligation, and strictly conditioned unliquidated-claim paths; Chapter 42 and specified government claims are excluded.",
    applies: "Section 45-103.02(2) applies the 12% §45-104 rate to a liquidated claim when there is no reasonable controversy over the right to recover or the amount. Section 45-104 independently covers listed written instruments, settled accounts, retained money, loans, and money withheld by unreasonable delay unless otherwise agreed. For an unliquidated claim, §45-103.02(1) requires a written offer served by certified mail, proper filing and proof, statutory timing and nonacceptance, and a judgment exceeding the offer. Section 45-103.04 excludes Chapter 42 actions and specified claims involving Nebraska government bodies or employees.",
    accrual: "A qualifying liquidated claim under §45-103.02(2) accrues on its unpaid balance from the date the cause of action arose through entry of judgment. A qualifying unliquidated claim under §45-103.02(1) runs from the first qualifying offer that the judgment exceeds through entry. Section 45-104 has category-specific starting points, including the applicable due, settlement, receipt, delay, or billing date.",
    compound: "The cited statutes specify annual rates and unpaid-balance rules but do not state a universal calculator-grade day-count or compounding convention. StatuteRates therefore presents these as reference rates and does not enable automated Nebraska prejudgment arithmetic.",
    formula: "Liquidated path: 12% under §§45-103.02(2) and 45-104. Qualifying unliquidated path: the §45-103 rate in effect for the relevant judgment, subject to every settlement-offer condition. Under §45-103.03, payments made before trial are subtracted from the judgment before unliquidated-claim interest is added.",
  },
  "nevada-prejudgment-rate": {
    tagline: "Nevada prejudgment interest — the current branch is withheld pending source reconciliation.",
    q: "What is the Nevada prejudgment interest rate?",
    body: "Nevada prejudgment interest can depend on NRS 99.040 and the legally relevant January 1 or July 1 prime-rate selection. StatuteRates is not publishing a current numeric prejudgment value until the official NRS 99.040 benchmark publication is reconciled with the distinct verified NRS 17.130 judgment-rate notice. The two branches must not be assumed identical.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "nevada-judgment-rate",
    appliesShort: "Prejudgment interest in Nevada is generally limited to LIQUIDATED / readily ASCERTAINABLE sums.",
    applies: "Prejudgment interest in Nevada is generally limited to LIQUIDATED / readily ASCERTAINABLE sums. NRS 99.040 grants interest on: (a) contracts express or implied (other than book accounts); (b) settlement of book or store accounts from the day the balance is ascertained; (c) money received to the use/benefit of another and detained without consent; (d) unpaid wages/salary after demand. For OPEN/STORE accounts, interest may be awarded only by a court in an action on the debt (AG Op. 98-20).",
    accrual: "Under NRS 17.130(2), interest on the money judgment (the prejudgment-to-postjudgment period) runs from the time of SERVICE OF THE SUMMONS AND COMPLAINT until satisfied — except any amount representing FUTURE damages, which draws interest only from entry of judgment.",
    compound: "The Financial Institutions Division describes simple interest for qualifying NRS 99.040 debt, but this page does not apply a numeric rate while the current prejudgment source contract remains unresolved.",
    formula: "NRS 99.040 uses the Commissioner-ascertained prime rate at the largest Nevada bank on the immediately preceding January 1 or July 1, plus two percentage points. Do not substitute the separately verified NRS 17.130 post-judgment observation without source reconciliation.",
  },
  "new-hampshire-prejudgment-rate": {
    tagline: "New Hampshire’s prejudgment formula, with the current numeric schedule withheld.",
    q: "What is the New Hampshire prejudgment interest rate?",
    body: "RSA 336:1, II supplies New Hampshire’s annual simple-rate formula, but StatuteRates is withholding the current numeric value because the official annual court schedule could not be accessed and independently verified. RSA 524:1-a and 524:1-b provide separate entitlement and timing rules for debt/liquidated and other pecuniary-damages proceedings.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "new-hampshire-judgment-rate",
    appliesShort: "The statutes cover broad pecuniary-damages categories, but the current annual percentage is not independently verified.",
    applies: "RSA 524:1-b extends prejudgment interest to broad civil proceedings awarding pecuniary damages, while RSA 524:1-a separately addresses debt, account-stated, and liquidated-damages actions. Apply the correct entitlement and timing provision, and do not infer the current percentage from an inaccessible schedule.",
    accrual: "Two tracks. RSA 524:1-a: for an action on a debt, account stated, or where liquidated damages are sought, interest runs from the institution of suit (absent a pre-suit demand; inapplicable if the party pays the money into court under superior court rules).",
    compound: "Simple (RSA 336:1, II expressly specifies the \"annual simple rate of interest\").",
    formula: "RSA 336:1, II uses the discount rate from the last 26-week U.S. Treasury-bill auction before September 30, plus two percentage points and rounded to the nearest 0.1%. The official published annual selection must be verified before a numeric value is released.",
  },
  "new-jersey-prejudgment-rate": {
    tagline: "New Jersey tort prejudgment interest under the annual court schedule.",
    q: "What is the New Jersey prejudgment interest rate?",
    body: "For {{current_year}} tort actions under Rule 4:42-11(b), simple prejudgment interest uses {{current_rate_part_1}} when the resulting judgment does not exceed the Special Civil Part monetary limit at entry and {{current_rate_part_2}} when it exceeds that limit. The current limit is $20,000. These are whole-judgment categories, not marginal brackets.",
    prejudgment: true,
    kind: "same-as-postjudgment",
    kindLabel: "Same rate as post-judgment",
    postSlug: "new-jersey-judgment-rate",
    appliesShort: "Rule 4:42-11(b) generally directs simple prejudgment interest in tort actions, but future economic losses, exceptional-case suspension, contract claims, equitable claims, and specialized law require separate treatment.",
    applies: "Rule 4:42-11(b) generally directs the court to include simple prejudgment interest in tort actions, including products-liability actions. It excludes recovery for future economic losses. Contract and equitable prejudgment interest arise under different judicial principles and are not represented as an automatic tort-rule entitlement.",
    accrual: "From the date of institution of the action, OR from a date 6 months after the date the cause of action arises, whichever is LATER (R. 4:42-11(b)). Court may suspend the running in exceptional cases.",
    compound: "Simple.",
    formula: "The tort schedule uses the post-judgment base rate: the New Jersey Cash Management Fund’s prior fiscal-year average return, rounded to the nearest whole or half percent and subject to the rule’s floor. A judgment exceeding the applicable Special Civil Part limit receives the two-point addition as a whole-judgment category.",
  },
  "new-mexico-prejudgment-rate": {
    tagline: "New Mexico prejudgment interest — capped discretionary and up-to-15% obligation branches.",
    q: "What is the New Mexico prejudgment interest rate?",
    body: "New Mexico has separate prejudgment branches. NMSA 1978 §56-8-4(B) permits a court to award up to 10% in qualifying cases, subject to statutory exclusions. Section 56-8-3 says no more than 15% on its listed obligations; it does not make 15% an unconditional default. The obligation, agreement, defendant, and claim determine the usable rate.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "new-mexico-judgment-rate",
    appliesShort: "Neither the up-to-10% nor up-to-15% branch is an automatic statewide percentage.",
    applies: "Section 56-8-3 addresses listed contract, retained-money, and settled-account obligations and caps the rate at 15%, subject to the governing agreement and law. Section 56-8-4(B) is discretionary, excludes specified child-support and government matters, and requires the court to consider statutory factors.",
    accrual: "Discretionary track (56-8-4(B)): from the date the complaint is served upon the defendant. As-of-right track (56-8-3): from the date the sum became due/ascertainable — e.g., money due by contract accrues from when payment was due; matured accounts accrue from the day the balance is ascertained.",
    compound: "The statutes provide annual limits but do not establish one universal compounding and payment-allocation method across both branches. Confirm the selected rate and judgment before calculating.",
  },
  "new-york-prejudgment-rate": {
    tagline: "New York’s general 9% prejudgment rate and qualifying 2% consumer-debt branch.",
    q: "What is the New York prejudgment interest rate?",
    body: "CPLR 5004 supplies New York’s general 9% rate, but a qualifying consumer-debt action against a natural person uses the separate 2% rate beginning April 30, 2022. CPLR 5001 controls entitlement and timing before verdict or decision; equitable matters and other specific statutes can use different treatment.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "new-york-judgment-rate",
    appliesShort: "CPLR 5001 covers specified contract and property-interference damages; equitable actions remain discretionary.",
    applies: "CPLR 5001 provides interest on damages for breach of contract and acts or omissions interfering with title, possession, or enjoyment of property. In an equitable action, the court decides interest, rate, and timing. A covered consumer-debt action against a natural person uses the separate CPLR 5004 rate rather than the 9% headline.",
    accrual: "Under CPLR 5001(b), interest is computed from the earliest ascertainable date the cause of action existed. Damages incurred later run from the date incurred. If damages arose at various times, interest may be computed on each item from its date or on all damages from a single reasonable intermediate date.",
    compound: "Simple.",
  },
  "north-carolina-prejudgment-rate": {
    tagline: "North Carolina prejudgment interest differs for contract and noncontract awards.",
    q: "What is the North Carolina prejudgment interest rate?",
    body: "N.C. Gen. Stat. §24-5 does not use one rate for every award. A contract award generally bears the contract rate from breach when that rate is stated; otherwise the legal rate applies. A qualifying consumer contract uses the lower of the contract and legal rates. In a noncontract action, only compensatory damages receive pre-entry interest from filing.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "north-carolina-judgment-rate",
    appliesShort: "Contract, consumer-contract, penal-bond, and noncontract compensatory awards follow different branches.",
    applies: "Prejudgment interest is claim-type-restricted, not universal. In contract actions under G.S. 24-5(a), the contract award bears interest from breach and the factfinder must separate principal from interest. Penal bonds instead bear interest from judgment entry under G.S. 24-5(a1). In other actions, G.S. 24-5(b) limits pre-entry interest to the compensatory-damages portion and starts it when the action is filed.",
    accrual: "A qualifying contract award runs from breach. A penal-bond award starts only at judgment. In other actions, §24-5(b) runs interest on the compensatory-damages portion from filing; punitive damages and other noncompensatory amounts are not folded into that branch.",
    compound: "Section 24-5 supplies the branch and annual rate, but this page does not assert one universal compounding or payment-allocation method for every contract and noncontract judgment.",
  },
  "north-dakota-prejudgment-rate": {
    tagline: "North Dakota’s 6% reference for qualifying certain damages.",
    q: "What is the North Dakota prejudgment interest rate?",
    body: "N.D.C.C. §32-03-04 provides interest on qualifying damages that are certain or capable of calculation and vested on a particular day. The applicable legal-rate reference comes from §47-14-05 when no different written rate controls. The 6% figure is not a universal award for every claim.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "north-dakota-judgment-rate",
    appliesShort: "The damages must satisfy §32-03-04; the rate then depends on §47-14-05 and any controlling written agreement.",
    applies: "Section 32-03-04 requires damages that are certain or capable of being made certain by calculation and a right to recover vested on a particular day. The separate legal-rate statute and any written agreement determine the percentage. Uncertain damages do not become eligible merely because 6% is displayed.",
    accrual: "Under § 32-03-04, interest accrues from the \"particular day\" the right to recover vested — i.e., the date the liquidated/ascertainable debt became due or the date of breach for contract claims.",
    compound: "North Dakota restricts compounding under §47-14-09, but the governing written agreement and statutory exceptions must still be checked; this page does not claim one universal method for every obligation.",
  },
  "ohio-prejudgment-rate": {
    tagline: "Ohio prejudgment interest — the same rate as its post-judgment interest.",
    q: "What is the Ohio prejudgment interest rate?",
    body: "Ohio applies the same rate to prejudgment interest as to post-judgment interest — currently 7% per year under Ohio Rev. Code 1343.03. Two distinct tracks. (1) CONTRACT / LIQUIDATED claims under ORC 1343.03(A): prejudgment interest is a matter of RIGHT (not discretionary) on money due and payable upon a written contract,…",
    prejudgment: true,
    kind: "same-as-postjudgment",
    kindLabel: "Same rate as post-judgment",
    postSlug: "ohio-judgment-rate",
    appliesShort: "Two distinct tracks. (1) CONTRACT / LIQUIDATED claims under ORC 1343.03(A): prejudgment interest is a matter of RIGHT (not discretionary) on money due and payable upon a written contract,…",
    applies: "Two distinct tracks. Under ORC 1343.03(A), a creditor is entitled to interest when money becomes due and payable on a written instrument, book account, settlement, verbal contract, or other covered obligation; a written contract can provide a different rate. Tort actions follow the separate §1343.03(C) conditions, including the court's post-verdict good-faith-settlement findings.",
    accrual: "For a covered §1343.03(A) obligation, interest starts when the money becomes due and payable. For a qualifying tort award under §1343.03(C)(1), admitted-liability and deliberate-harm cases can run from accrual of the cause of action; other cases use the longer qualifying period measured from written notice or filing through judgment. Division (C)(2) excludes future damages.",
    compound: "Simple interest.",
    formula: "Federal short-term rate (IRC 1274) for July, rounded to nearest whole percent, plus 3% = statutory rate for the following calendar year (ORC 5703.47). Same as post-judgment rate. {{current_year}} rate = {{current_rate}}.",
  },
  "oklahoma-prejudgment-rate": {
    tagline: "Oklahoma prejudgment interest — {{current_rate_part_1}} for personal injury, {{current_rate_part_2}} for contract.",
    q: "What is the Oklahoma prejudgment interest rate?",
    body: "Oklahoma prejudgment interest splits across two statutes: a variable rate — currently {{current_rate_part_1}} — for personal-injury/personal-rights verdicts (12 O.S. §727.1), and {{current_rate_part_2}} fixed for contract/liquidated 'damages certain' claims (23 O.S. §6). Sharply restricted and claim-type dependent.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "oklahoma-judgment-rate",
    appliesShort: "Sharply restricted and split across two statutes.",
    applies: "Sharply restricted and split across two statutes. (1) 12 O.S. 727.1(E) authorizes prejudgment interest ONLY on a \"verdict for damages by reason of personal injuries or injury to personal rights\" (e.g., bodily restraint, personal insult, defamation, invasion of privacy, injury to personal relations) — accepted on/after Nov 1, 2009. It does NOT cover contract, property, or general commercial claims.",
    accrual: "Depends on claim type. For personal-injury/personal-rights verdicts (12 O.S. 727.1(E)): accrual begins the date 24 MONTHS AFTER the suit resulting in the judgment was commenced (not the date of injury), running until verdict acceptance/judgment.",
    compound: "Simple. Oklahoma prejudgment interest is computed as simple interest on the principal/verdict amount; the statute prescribes annual re-setting of the rate but does not compound accrued interest.",
    formula: "Variable, reset annually. Prejudgment rate = average U.S. Treasury Bill rate of the preceding calendar year, certified by the State Treasurer per 12 O.S. 727.1(I) and published by the Administrative Director of the Courts. {{current_year}} published prejudgment rate = {{current_rate_part_1}}.",
  },
  "oregon-prejudgment-rate": {
    tagline: "Oregon’s prejudgment interest rate — when a court awards it.",
    q: "What is the Oregon prejudgment interest rate?",
    body: "Oregon prejudgment interest is 9% per year, as simple interest under ORS 82.010(1)(a). Prejudgment interest is NOT automatically available on all claims.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "oregon-judgment-rate",
    appliesShort: "Prejudgment interest is NOT automatically available on all claims.",
    applies: "Prejudgment interest is NOT automatically available on all claims. It runs on \"all moneys after they become due\" (ORS 82.010(1)(a)) and Oregon courts have restricted it to claims where (1) the exact amount of damages is ASCERTAINED or ASCERTAINABLE by simple computation or by reference to generally recognized standards, AND (2) the time from which interest runs (when the money became due) is easily ascertained. Classic use: liquidated contract/debt claims, money had and received, open accounts.",
    accrual: "Interest accrues from the date the money became due / the loss was sustained, i.e., when the ascertainable sum first became payable. For open accounts, from the date of the last item. For services (quantum meruit), from the date service was rendered.",
    compound: "Simple interest. ORS 82.010 provides simple interest (subsection (2)(b) expressly makes judgment interest simple unless a contract provides otherwise; the (1) legal rate is likewise applied as simple interest per annum).",
  },
  "pennsylvania-prejudgment-rate": {
    tagline: "Pennsylvania’s 6% contract reference and 2026 Rule 238 delay-damages branch.",
    q: "What is the Pennsylvania prejudgment interest rate?",
    body: "Pennsylvania uses different prejudgment paths. The lawful-rate reference under 41 P.S. §202 is 6% for qualifying contract and liquidated obligations. Pa.R.C.P. 238 separately governs delay damages in covered bodily-injury, death, and property-damage actions; the official 2026 Rule 238 rate is 7.75%. The branches have different eligibility and timing rules.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "pennsylvania-judgment-rate",
    appliesShort: "The 6% legal-rate and 7.75% Rule 238 branches cover different claims and cannot be merged.",
    applies: "Highly claim-type dependent. CONTRACT: prejudgment interest is awarded AS OF RIGHT only when damages are liquidated/ascertainable (e.g., a sum certain / definite invoice amount due at breach) at 6% under 41 P.S. Sec. 202; for unliquidated contract damages the award of prejudgment interest is DISCRETIONARY with the trial court (Pa. courts, Restatement (Second) of Contracts Sec. 354).",
    accrual: "CONTRACT (liquidated): from the date payment was due / the money became owed (e.g., invoice due date or date of breach). TORT (Rule 238): from a date ONE YEAR after the date original process was first served in the action, up to the date of the award, verdict, or decision.",
    compound: "Rule 238 expressly states that delay damages are not compounded. The legal-rate branch must still be checked against the governing obligation and controlling Pennsylvania law before calculation.",
  },
  "rhode-island-prejudgment-rate": {
    tagline: "Rhode Island’s broad 12% prejudgment branch and statutory carve-outs.",
    q: "What is the Rhode Island prejudgment interest rate?",
    body: "R.I. Gen. Laws §9-21-10 generally directs the clerk to add 12% prejudgment interest in covered civil actions awarding pecuniary damages. The statute includes contract and claim exclusions and uses a separate notice-based start rule for qualifying medical or dental malpractice matters, so the cause-of-action date is not universal.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "rhode-island-judgment-rate",
    appliesShort: "The general pecuniary-damages rule is broad, but contract exclusions and the malpractice branch must be checked.",
    applies: "The general branch covers a verdict or decision for pecuniary damages, subject to the exclusions written into §9-21-10 and other controlling law. Interest already included by agreement or otherwise excluded should not be added again. Medical and dental malpractice use the statute’s separate branch.",
    accrual: "The general branch measures from accrual of the cause of action. Qualifying medical or dental malpractice instead uses the legally sufficient written-notice event and its statutory timing limits. Confirm the branch before selecting a start date.",
    compound: "The statute directs the clerk to add interest to the damages award, but this page does not assert a universal compounding or payment-allocation method beyond the covered statutory calculation.",
  },
  "south-carolina-prejudgment-rate": {
    tagline: "South Carolina’s prejudgment interest rate — when a court awards it.",
    q: "What is the South Carolina prejudgment interest rate?",
    body: "South Carolina prejudgment interest is 8.75% per year, as simple interest under S.C. Code Ann. § 34-31-20(A). LIQUIDATED / ASCERTAINABLE claims only. Prejudgment interest is recoverable \"as a matter of right\" only where the amount claimed is certain or capable of being reduced to certainty (e.g.,…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "south-carolina-judgment-rate",
    appliesShort: "LIQUIDATED / ASCERTAINABLE claims only. Prejudgment interest is recoverable \"as a matter of right\" only where the amount claimed is certain or capable of being reduced to certainty (e.g.,…",
    applies: "LIQUIDATED / ASCERTAINABLE claims only. Prejudgment interest is recoverable \"as a matter of right\" only where the amount claimed is certain or capable of being reduced to certainty (e.g., by a mathematical calculation or a fixed measure of recovery existing when the claim arose) — Butler Contracting; Smith-Hunter; Dixie Bell. The proper test is whether the MEASURE of recovery (not necessarily the amount) was fixed by conditions existing when the claim arose.",
    accrual: "Runs from the date the sum became due and demandable — the point at which, by agreement of the parties or operation of law, payment was demandable and the amount was certain or ascertainable (Butler Contracting; Smith-Hunter). For contracts, typically the date payment was owed under the agreement.",
    compound: "Simple. The 8.75% legal/prejudgment rate under subsection (A) is applied as simple interest; \"compounded annually\" is specified only for the separate post-judgment rate in subsection (B).",
  },
  "south-dakota-prejudgment-rate": {
    tagline: "South Dakota prejudgment interest uses a fixed Category B branch with exceptions.",
    q: "What is the South Dakota prejudgment interest rate?",
    body: "SDCL §21-1-13.1 uses the fixed Category B rate under §54-3-16—currently 10%—for its general prejudgment branch; it is not a periodically resetting formula. A contract can supply its stated rate, inverse condemnation follows a separate 4.5% branch, and statutory exclusions remain outside the headline.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "south-dakota-judgment-rate",
    appliesShort: "Broad availability but with sharp claim-type carve-outs.",
    applies: "Broad availability but with sharp claim-type carve-outs. Any person entitled to recover damages (principal action, counterclaim, cross-claim, or third-party claim) is entitled to prejudgment interest. IMPORTANT: South Dakota does NOT limit prejudgment interest to liquidated or readily ascertainable sums — after the 1990 amendment, SDCL 21-1-13.1 allows prejudgment interest on unliquidated damages as well, with the accrual mechanism (verdict-specified date) handling uncertain loss dates.",
    accrual: "Interest accrues from the day the loss or damage occurred, except during any period the debtor is prevented by law, or by act of the creditor, from paying the debt.",
    compound: "Simple. The statute (SDCL 21-1-13.1 / 54-3-16) does not authorize compounding, and South Dakota courts apply simple interest for prejudgment interest.",
    formula: "The general statutory branch uses the fixed Category B rate under SDCL §54-3-16. A contract rate, the 4.5% inverse-condemnation branch, and excluded claims must be handled separately.",
  },
  "tennessee-prejudgment-rate": {
    tagline: "Tennessee prejudgment interest is discretionary, capped at 10%.",
    q: "What is the Tennessee prejudgment interest rate?",
    body: "Tenn. Code §47-14-123 permits a court or jury to award prejudgment interest in accordance with equitable principles at a rate not exceeding 10% per year. Ten percent is a ceiling, not an automatic default. Entitlement, the chosen rate, and the start date remain discretionary and claim-specific.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "tennessee-judgment-rate",
    appliesShort: "The award and rate are discretionary; 10% is only the statutory ceiling.",
    applies: "Discretionary, not mandatory — awarded \"in accordance with the principles of equity.\" NOT limited to contract claims: available for both contract and tort/other actions, but the key equitable factors are (1) whether the amount of the obligation is CERTAIN or ascertainable (existence and amount reasonably ascertainable by accepted standards of valuation), and (2) whether the defendant was reasonably able to know the amount owed. Uncertain/unliquidated or highly disputed damages weigh against an award.",
    accrual: "Discretionary as to accrual date; typically runs from the date the underlying obligation/claim became due and the amount was ascertainable (e.g., date of breach or date the debt was owed) up to the date of judgment. The court sets the accrual start based on equity; the statute does not fix a rigid accrual date.",
    compound: "The cited statute sets a ceiling but not one universal calculation method. Confirm the court’s award, selected rate, period, and governing Tennessee authority before calculating.",
  },
  "texas-prejudgment-rate": {
    tagline: "Texas prejudgment interest — the same rate as its post-judgment interest.",
    q: "What is the Texas prejudgment interest rate?",
    body: "Texas applies the same rate to prejudgment interest as to post-judgment interest — currently 6.75% per year under Tex. Fin. Code Sec. 304.102. STATUTORY prejudgment interest (Tex. Fin. Code Subch. B) applies ONLY to wrongful death, personal injury, and property damage cases (Sec. 304.102).",
    prejudgment: true,
    kind: "same-as-postjudgment",
    kindLabel: "Same rate as post-judgment",
    postSlug: "texas-judgment-rate",
    appliesShort: "STATUTORY prejudgment interest (Tex. Fin. Code Subch. B) applies ONLY to wrongful death, personal injury, and property damage cases (Sec. 304.102).",
    applies: "STATUTORY prejudgment interest under Tex. Fin. Code Subchapter B applies only to wrongful-death, personal-injury, and property-damage cases (§§304.101–304.102). It may not be assessed on future damages (§304.1045). Qualifying written settlement offers can pause or reduce the amount on which interest accrues (§§304.105–304.107). Condemnation cases use a separate branch (§304.201), and other claims can depend on common law.",
    accrual: "Sec. 304.104: accrues beginning on the EARLIER of (a) the 180th day after the date the defendant receives written notice of a claim, or (b) the date suit is filed; and ends on the day preceding the date judgment is rendered. Common-law claims use the same accrual rule per Kenneco.",
    compound: "Simple. Sec. 304.104 expressly states prejudgment interest is computed as simple interest and does not compound. (Note: postjudgment interest under Sec. 304.006 compounds annually, but prejudgment interest is simple.).",
    formula: "Prime rate (per Fed Board of Governors) with a 5% minimum and 15% maximum; published monthly by the Texas OCCC. Rate is fixed as of the date of judgment. Current = {{current_rate}} (effective {{effective_date}}).",
  },
  "utah-prejudgment-rate": {
    tagline: "Utah prejudgment interest — {{current_rate_part_1}} general, {{current_rate_part_2}} for the current personal-injury branch.",
    q: "What is the Utah prejudgment interest rate?",
    body: "Utah prejudgment interest is {{current_rate_part_1}} for general/contract claims (Utah Code §15-1-1(2)), but personal-injury special damages accrue prime + 2% — currently {{current_rate_part_2}} — under §78B-5-824. General/contract cases (Track A): Utah does NOT strictly require damages to be \"liquidated,\" but prejudgment interest attaches ONLY where the loss is complete/fixed at a definite time and…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "utah-judgment-rate",
    appliesShort: "General/contract cases (Track A): Utah does NOT strictly require damages to be \"liquidated,\" but prejudgment interest attaches ONLY where the loss is complete/fixed at a definite time and…",
    applies: "General/contract cases (Track A): Utah does NOT strictly require damages to be \"liquidated,\" but prejudgment interest attaches ONLY where the loss is complete/fixed at a definite time and \"measurable by facts and figures\" (known standards of value). It is BARRED where damages are left to jury discretion, are general/non-economic, or depend on subjective estimation (e.g., pain and suffering, unascertainable damages) — the classic Utah rule that interest is denied where damages \"are not complete\" or cannot be…",
    accrual: "Track A (general/contract): from the date the loss became fixed/complete and measurable (the date of the loss/breach), not the date of judgment. Track B (personal injury, 78B-5-824(5)): for special damages incurred in the year of the occurrence, from the date the first special damages were actually incurred; for…",
    compound: "Simple. PI statute (78B-5-824(5)(a)) expressly requires simple interest; Utah prejudgment interest generally is computed as simple interest.",
  },
  "vermont-prejudgment-rate": {
    tagline: "Vermont’s 12% actuarial-rate reference and claim-specific prejudgment rules.",
    q: "What is the Vermont prejudgment interest rate?",
    body: "9 V.S.A. §41a supplies a 12% annual rate calculated by the actuarial method when no different rate is otherwise established. It does not by itself decide prejudgment entitlement for every claim. Vermont case law distinguishes readily ascertainable sums from discretionary awards, and 12 V.S.A. §2903 separately addresses judgment liens.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "vermont-judgment-rate",
    appliesShort: "Entitlement depends on the claim; the 12% statute is a rate reference, not a universal award.",
    applies: "Prejudgment interest is awarded AS OF RIGHT (mandatory) when the principal sum recovered is liquidated or capable of ready ascertainment (e.g., established market prices, contract amounts, medical damages and lost wages in personal-injury cases). For other/unliquidated damages, it is DISCRETIONARY — awardable in the trier of fact's discretion where needed to make the plaintiff whole / avoid injustice.",
    accrual: "Interest accrues from the date the cause of action accrued (the time of the loss/breach/injury) to the date of entry of judgment. For liquidated/ascertainable sums, from when the sum became due/ascertainable; for other pecuniary harms, from the accrual of the cause of action to judgment.",
    compound: "Section 41a specifies an actuarial method rather than supporting a blanket ‘simple interest’ description. Apply the method only after entitlement, principal, and the legally relevant dates are established.",
  },
  "virginia-prejudgment-rate": {
    tagline: "Virginia prejudgment interest is discretionary; 6% is the no-rate reference.",
    q: "What is the Virginia prejudgment interest rate?",
    body: "Va. Code §8.01-382 makes a prejudgment award and its start period discretionary. When an instrument does not state a rate, §6.2-302 supplies a 6% judgment-rate reference; contracts and instruments can require separate treatment. The statutes do not make 6% an automatic award for every claim.",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "virginia-judgment-rate",
    appliesShort: "Both the award and start period are discretionary under §8.01-382.",
    applies: "Section 8.01-382 permits the final order, jury verdict, judgment, or decree to award interest on all or part of a principal sum and choose the period when that interest begins. A prejudgment award and its start date are therefore discretionary rather than automatic.",
    accrual: "The factfinder or court chooses the prejudgment commencement period under § 8.01-382. If the final order, judgment, or decree does not provide for interest, the award or jury verdict instead bears judgment-rate interest from its entry or verdict date.",
    compound: "The cited statutes do not establish one universal prejudgment compounding and payment-allocation method. Confirm the instrument, verdict or order, selected rate, and period before calculating.",
  },
  "washington-prejudgment-rate": {
    tagline: "Washington’s general prejudgment reference and qualifying medical-debt cap.",
    q: "What is the Washington prejudgment interest rate?",
    body: "Washington’s general legal-rate reference under RCW 19.52.010 can be 12% for a qualifying liquidated or readily determinable claim. Qualifying medical debt is capped at 9%, so the 12% figure is not universal. A written agreement or another statute can also control.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "washington-judgment-rate",
    appliesShort: "The claim generally must be liquidated or readily determinable, and medical debt has a separate cap.",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED or readily-determinable claims — those where the evidence furnishes data that makes it possible to compute the amount with exactness, without reliance on opinion or discretion (Prier v. Refrigeration Eng'g; Hansen v. Rothaus). It is BARRED on UNLIQUIDATED claims requiring jury/court discretion or opinion evidence to fix the amount.",
    accrual: "Prejudgment interest accrues from the date the claim became liquidated / the amount became due and determinable (i.e., the date the liquidated sum could be computed), running until entry of judgment.",
    compound: "The general branch is treated as simple interest, but the governing agreement, medical-debt cap, and any special statute must be checked before calculation.",
  },
  "west-virginia-prejudgment-rate": {
    tagline: "West Virginia prejudgment interest uses an annual right-to-action rate.",
    q: "What is the West Virginia prejudgment interest rate?",
    body: "West Virginia’s published annual rate is {{current_rate}} for {{current_year}} under W. Va. Code §56-6-31. The rate resets annually, not twice a year, and the applicable prejudgment rate is selected by the year when the right to bring the action accrued. Eligibility is limited to the damages categories covered by the statute.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "west-virginia-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on special damages and liquidated damages — NOT on general/unliquidated damages.",
    applies: "Prejudgment interest is available ONLY on special damages and liquidated damages — NOT on general/unliquidated damages. Per § 56-6-31(b), \"special damages\" means lost wages and income, medical expenses, damages to tangible personal property, and similar out-of-pocket expenditures. General damages (pain and suffering, emotional distress, and other unliquidated/non-economic damages) are EXCLUDED from prejudgment interest. Punitive damages are not eligible.",
    accrual: "Rate is fixed by reference to the Fifth Federal Reserve District secondary discount rate in effect on January 2 of the year in which the right to bring the action accrued, and that established rate remains constant for that particular judgment/decree notwithstanding later changes in the Fed rate.",
    compound: "Simple.",
    formula: "The annual formula uses the Fifth Federal Reserve District secondary discount rate on January 2 plus two percentage points, subject to the statutory floor and ceiling. The Supreme Court of Appeals publishes the selected annual rate.",
  },
  "wisconsin-prejudgment-rate": {
    tagline: "Wisconsin’s prejudgment interest rate — when a court awards it.",
    q: "What is the Wisconsin prejudgment interest rate?",
    body: "Wisconsin prejudgment interest is 5% per year, as simple interest under Wis. Stat. 138.04. Prejudgment interest is NOT available on all claims.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "wisconsin-judgment-rate",
    appliesShort: "Prejudgment interest is NOT available on all claims.",
    applies: "Prejudgment interest is NOT available on all claims. It is allowed only where damages are LIQUIDATED or \"reasonably ascertainable\" by reference to a fixed standard, so the defendant could have computed and tendered the amount owed before judgment. It is generally BARRED where the amount of damages is genuinely disputed/unliquidated and depends on jury discretion (e.g., typical unliquidated tort claims such as pain-and-suffering personal injury damages, and other non-ascertainable damages).",
    accrual: "Common-law/138.04 prejudgment interest on a liquidated claim accrues from the time payment was due under the contract; if no time is specified, from the date demand was made or from commencement of the action (Estreen v. Bluhm, 79 Wis. 2d 142 (1977)).",
    compound: "Simple interest (both the 5% 138.04 rate and the 807.01(4)/815.05(8) statutory rate are computed as simple interest; Wisconsin does not compound judgment/prejudgment interest by default).",
  },
  "wyoming-prejudgment-rate": {
    tagline: "Wyoming’s 7% legal-rate reference is not a universal prejudgment award.",
    q: "What is the Wyoming prejudgment interest rate?",
    body: "Wyo. Stat. §40-14-106(e) supplies a 7% legal-rate reference when an agreement does not set a rate. Wyoming prejudgment entitlement arises from the governing obligation and case law, not from that percentage alone. A claim generally must be readily computable without opinion or discretion before the rate can be used.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "wyoming-judgment-rate",
    appliesShort: "The 7% figure is only a default legal-rate reference; entitlement and accrual require separate support.",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED claims — a claim that is \"readily computable by basic mathematical calculation.\" An otherwise-unliquidated claim qualifies only if it becomes determinable \"without reliance on opinion or discretion.\" BARRED on unliquidated claims and on amounts requiring the exercise of judicial discretion or opinion (e.g., attorney-fee awards, which are not a mathematical computation — Thorkildsen v. Belden LLC, 2012 WY 8).",
    accrual: "Accrues from the date the debtor receives notice of the amount due (i.e., when the liquidated sum becomes due and demand/notice is made), running until judgment.",
    compound: "The legal-rate provision does not establish one universal prejudgment compounding method. Confirm the agreement, controlling case law, and judgment before calculating.",
  },
  "dc-prejudgment-rate": {
    tagline: "D.C.’s prejudgment interest rate — when a court awards it.",
    q: "What is the The District of Columbia prejudgment interest rate?",
    body: "The District of Columbia prejudgment interest is 6% per year, as simple interest under D.C. Code § 15-108. Two-track system. (1) LIQUIDATED DEBTS — § 15-108: prejudgment interest is MANDATORY (\"the judgment for the plaintiff SHALL include interest\") on a liquidated debt on which interest is…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "dc-judgment-rate",
    appliesShort: "Two-track system. (1) LIQUIDATED DEBTS — § 15-108: prejudgment interest is MANDATORY (\"the judgment for the plaintiff SHALL include interest\") on a liquidated debt on which interest is…",
    applies: "Two-track system. (1) LIQUIDATED DEBTS — § 15-108: prejudgment interest is MANDATORY (\"the judgment for the plaintiff SHALL include interest\") on a liquidated debt on which interest is payable by contract, law, or usage, from the time it was due and payable. Rate = contract rate if any, else 6% legal rate.",
    accrual: "For liquidated debts (§ 15-108): interest runs \"from the time when it was due and payable\" (the date the debt became due/the breach), through entry of judgment.",
    compound: "Simple. The 6% legal rate under § 28-3302(a) is simple interest; DC prejudgment interest is not compounded absent a contract term providing otherwise.",
  },
  'eu-late-payment-reference': {
    tagline: 'The ECB benchmark used for a Directive-minimum late-payment illustration.',
    q: 'What is the current EU Late Payment Directive ECB reference benchmark?',
    body: `Directive 2011/7/EU sets a minimum framework for interest on qualifying overdue commercial debts.
This page records the ECB main refinancing rate in force on the first day of each half-year (1 January /
1 July) and shows it as a transparent benchmark. Adding eight points can illustrate the Directive's
minimum framework, but it does not produce every member state's statutory rate. National implementing
laws can use different reference bases or more creditor-favourable rules. Confirm the official EU
country-rate table and the governing national law before relying on a figure.`,
  },
};

function rateCopyTokens(observation, historyPoints) {
  if (!observation) return {};
  const effectiveDate = String(observation.effective_date || '');
  const rate = Number(observation.value);
  const parts = String(observation.value_text || '').split('/').map((part) => part.trim());
  const percent = (value) => Number.isFinite(value)
    ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(value)}%`
    : '';
  const prettyEffectiveDate = /^\d{4}-\d{2}-\d{2}$/.test(effectiveDate)
    ? new Date(`${effectiveDate}T00:00:00Z`).toLocaleDateString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : effectiveDate;
  return {
    current_rate: observation.value_text || '',
    current_rate_part_1: parts[0] || observation.value_text || '',
    current_rate_part_2: parts[1] || '',
    current_year: effectiveDate.slice(0, 4),
    effective_date: prettyEffectiveDate,
    history_points: Number.isInteger(historyPoints) ? String(historyPoints) : '',
    rate_minus_1: percent(rate - 1),
    rate_minus_2: percent(rate - 2),
    rate_plus_8: percent(rate + 8),
  };
}

function cleanAndMaterialize(value, tokens) {
  if (typeof value === 'string') {
    return removeTruncatedFragments(value).replace(
      /\{\{([a-z0-9_]+)\}\}/gi,
      (match, key) => Object.hasOwn(tokens, key) ? tokens[key] : match,
    );
  }
  if (Array.isArray(value)) return value.map((item) => cleanAndMaterialize(item, tokens));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanAndMaterialize(item, tokens)]),
    );
  }
  return value;
}

export function copyFor(slug, { observation = null, historyPoints = null } = {}) {
  const raw = SERIES_COPY[slug] || { tagline: '', q: `What is the current ${slug} rate?`, body: '' };
  const clean = cleanAndMaterialize(raw, rateCopyTokens(observation, historyPoints));
  if (!clean.body) clean.body = clean.tagline || 'See the cited source and current observation for details.';
  if (clean.prejudgment && !clean.applies) clean.applies = clean.appliesShort || clean.tagline;
  return clean;
}

// Hand-maintained dates for substantial editorial changes that do not alter the underlying rate.
// Sitemap lastmod must move for a real page improvement (for example, adding official history), but
// must not churn merely because Astro rebuilt. Add a slug here only when its rendered substance
// materially changes.
export const CONTENT_MODIFIED = Object.freeze({
  'alabama-prejudgment-rate': '2026-09-27',
  'alaska-judgment-rate': '2026-07-26',
  'alaska-prejudgment-rate': '2026-07-26',
  'arizona-judgment-rate': '2026-09-27',
  'arizona-prejudgment-rate': '2026-09-27',
  'arkansas-judgment-rate': '2026-09-27',
  'arkansas-prejudgment-rate': '2026-09-27',
  'california-judgment-rate': '2026-08-21',
  'california-prejudgment-rate': '2026-09-27',
  'colorado-prejudgment-rate': '2026-09-27',
  'delaware-judgment-rate': '2026-09-27',
  'delaware-prejudgment-rate': '2026-09-27',
  'florida-judgment-rate': '2026-07-26',
  'florida-prejudgment-rate': '2026-07-26',
  'eu-late-payment-reference': '2026-08-16',
  'georgia-judgment-rate': '2026-07-26',
  'idaho-prejudgment-rate': '2026-09-27',
  'illinois-prejudgment-rate': '2026-09-27',
  'indiana-prejudgment-rate': '2026-09-27',
  'iowa-judgment-rate': '2026-07-26',
  'maine-judgment-rate': '2026-07-26',
  'maine-prejudgment-rate': '2026-07-26',
  'maryland-prejudgment-rate': '2026-09-27',
  'michigan-judgment-rate': '2026-08-21',
  'michigan-prejudgment-rate': '2026-08-21',
  'minnesota-judgment-rate': '2026-08-22',
  'missouri-judgment-rate': '2026-09-27',
  'missouri-prejudgment-rate': '2026-09-27',
  'new-jersey-judgment-rate': '2026-08-21',
  'new-jersey-prejudgment-rate': '2026-08-21',
  'new-mexico-judgment-rate': '2026-08-16',
  'nevada-judgment-rate': '2026-08-22',
  'nevada-prejudgment-rate': '2026-09-27',
  'new-hampshire-judgment-rate': '2026-09-27',
  'new-hampshire-prejudgment-rate': '2026-09-27',
  'new-york-consumer-debt-judgment-rate': '2026-08-21',
  'new-york-judgment-rate': '2026-08-21',
  'new-mexico-prejudgment-rate': '2026-09-27',
  'new-york-prejudgment-rate': '2026-09-27',
  'north-carolina-judgment-rate': '2026-09-27',
  'north-carolina-prejudgment-rate': '2026-09-27',
  'north-dakota-prejudgment-rate': '2026-09-27',
  'ohio-judgment-rate': '2026-08-16',
  'ohio-prejudgment-rate': '2026-09-03',
  'oklahoma-judgment-rate': '2026-08-22',
  'oregon-judgment-rate': '2026-08-20',
  'pennsylvania-prejudgment-rate': '2026-09-27',
  'rhode-island-judgment-rate': '2026-09-27',
  'rhode-island-prejudgment-rate': '2026-09-27',
  'south-dakota-judgment-rate': '2026-09-27',
  'south-dakota-prejudgment-rate': '2026-09-27',
  'idaho-judgment-rate': '2026-08-20',
  'indiana-judgment-rate': '2026-08-20',
  'louisiana-judgment-rate': '2026-08-20',
  'louisiana-prejudgment-rate': '2026-08-20',
  'north-dakota-judgment-rate': '2026-08-20',
  'west-virginia-judgment-rate': '2026-08-20',
  'texas-judgment-rate': '2026-07-26',
  'texas-prejudgment-rate': '2026-07-26',
  'tennessee-judgment-rate': '2026-09-03',
  'tennessee-prejudgment-rate': '2026-09-27',
  'us-federal-post-judgment': '2026-07-26',
  'uk-late-payment-commercial': '2026-08-16',
  'utah-judgment-rate': '2026-07-26',
  'vermont-prejudgment-rate': '2026-09-27',
  'washington-judgment-rate': '2026-07-26',
  'washington-prejudgment-rate': '2026-09-27',
  'virginia-judgment-rate': '2026-08-16',
  'virginia-prejudgment-rate': '2026-09-27',
  'west-virginia-prejudgment-rate': '2026-09-27',
  'wisconsin-judgment-rate': '2026-08-22',
  'wyoming-judgment-rate': '2026-09-27',
  'wyoming-prejudgment-rate': '2026-09-27',
});

export function contentModifiedFor(slug) {
  return CONTENT_MODIFIED[slug] || null;
}
