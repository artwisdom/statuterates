// Original editorial copy per rate series (written here, not copied from any source). Keeps each
// page substantive for readers and search engines, and states plainly what the number means and how
// it is sourced/derived. `q` powers the FAQ rich-result and the human "what is it" line.

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
Reserve H.15 series and shows the weekly history.`,
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
    tagline: 'North Carolina’s 8% legal judgment rate.',
    q: 'What is the North Carolina judgment interest rate?',
    body: `North Carolina judgments carry interest at the state’s legal rate of 8% per year — N.C.G.S. §24-5 ties
judgment interest to the §24-1 legal rate — or the contract rate for a judgment on a contract. It’s a fixed
statutory rate applied as simple interest.`,
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
    body: `Arizona post-judgment interest under A.R.S. §44-1201 is the lesser of 10% per year or the Federal
Reserve prime rate plus 1 point — currently 7.75% — as simple interest. A written agreement can set a different rate.`,
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
      history: 'Section 47-14-121(b)(3) requires the Administrative Office of the Courts to publish every six-month rate back to July 1, 2012. The local dataset currently contains only one observation, so it does not claim a complete history. The July 1, 2026 value can be reproduced from the official June formula-rate history: 10.75% less two points equals 8.75%.',
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
    body: "Arkansas post-judgment interest is currently 5.75% — a statutory formula rate under Ark. Code Ann. § 16-65-114(a) that resets periodically. The old fixed 10% (or contract rate, whichever greater) was replaced by Act 995 of 2019 (effective 7/24/2019) with the current…",
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
    body: "Delaware post-judgment interest is currently 8.75% — a statutory formula rate under 6 Del. C. § 2301 that resets twice a year. Both pre-judgment and post-judgment interest use the same legal rate (5% over the discount rate). Per the official Delaware Courts guidance, the…",
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
    tagline: "Minnesota judgment interest — a formula rate, reset each year.",
    q: "What is the current Minnesota post-judgment interest rate?",
    body: "Minnesota post-judgment interest is currently {{current_rate_part_1}} / {{current_rate_part_2}} — a statutory formula rate under Minn. Stat. § 549.09, subd. 1(c) that resets each year. The standard variable Treasury-indexed rate (currently {{current_rate_part_1}}) applies to judgments/awards of $50,000 or less, and to ALL judgments/awards for or against the…",
  },
  "missouri-judgment-rate": {
    tagline: "Missouri judgment interest — a formula rate, reset periodically.",
    q: "What is the current Missouri post-judgment interest rate?",
    body: "Missouri post-judgment interest is currently 9% — a statutory formula rate under Mo. Rev. Stat. §408.040 that resets periodically. NON-TORT (contract and all other non-tort money judgments) = 9% flat, or the contract rate if the contract bears more than 9%. TORT = Fed Funds…",
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
    tagline: "Nevada judgment interest — a formula rate, reset twice a year.",
    q: "What is the current Nevada post-judgment interest rate?",
    body: "Nevada post-judgment interest is currently 8.75% — a statutory formula rate under Nev. Rev. Stat. 17.130(2) that resets twice a year. Interest runs from time of SERVICE of the summons and complaint until satisfied, EXCEPT amounts representing FUTURE damages, which draw interest only…",
  },
  "new-hampshire-judgment-rate": {
    tagline: "New Hampshire’s annual simple rate, fixed for a judgment at verdict or finding.",
    q: "What is the current New Hampshire post-judgment interest rate?",
    body: "New Hampshire’s {{current_year}} judgment-interest rate is {{current_rate}} per year. RSA 336:1, II sets an annual simple rate equal to the discount rate from the last 26-week Treasury-bill auction before September 30 of the prior year, plus two percentage points, rounded to one decimal place. RSA 336:2 fixes a particular judgment’s rate at the rate in effect when the verdict or finding for pecuniary damages is made.",
    postDetails: {
      scope: "RSA 336:1, II supplies the annual simple rate for judgments, including prejudgment interest. RSA 527:10 separately states that interest is payable on executions in civil actions from the time judgment is rendered. These provisions do not independently decide entitlement or every special statutory judgment.",
      accrual: "RSA 336:2, I locks the applicable rate when the verdict is rendered or the finding for pecuniary damages is made. RSA 527:10 states that post-judgment interest on a civil execution is payable from rendition. The statewide rate changes each January, but an existing judgment does not reprice each year.",
      compounding: "RSA 336:1, II expressly calls this an annual simple rate. The cited statutes do not supply a universal day-count denominator, partial-payment allocation method, or treatment for every nonstandard judgment, so the general calculator remains disabled.",
      history: "StatuteRates currently records only the {{current_rate}} rate effective January 1, {{current_year}}. The statutory formula dates to 1981, and a 2001 Act changed its benchmark from a 52-week to a 26-week Treasury bill. This page does not claim a complete annual history until every published year is imported and verified.",
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
    tagline: "Oklahoma’s annual 12 O.S. § 727.1 post-judgment rate.",
    q: "What is the current Oklahoma post-judgment interest rate?",
    body: "For judgments governed by 12 O.S. § 727.1, Oklahoma’s {{current_year}} post-judgment interest rate is {{current_rate}} per year. The annual post-judgment formula uses the prime rate listed in the first Wall Street Journal edition published for the calendar year, plus two percentage points. Oklahoma uses a different formula for qualifying prejudgment interest, and separate laws can govern other judgment categories.",
    postDetails: {
      scope: "The {{current_rate}} headline is the {{current_year}} § 727.1 general post-judgment reference. The statute contains distinct prejudgment provisions and does not replace a different rate supplied by another controlling law or judgment category.",
      accrual: "The formula is selected by calendar year: the first Wall Street Journal prime rate published for that year plus two percentage points. Confirm the rate for the judgment’s applicable year rather than applying the latest rate automatically to an older judgment.",
      compounding: "StatuteRates keeps the Oklahoma calculator disabled because the current data does not yet model every covered judgment branch, day-count convention, compounding treatment, and partial-payment rule at calculator-grade certainty.",
      history: "The page records the current verified annual reference and cites the controlling Oklahoma authority. Historical annual certifications are the next data-depth target; no missing years are inferred from market data.",
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
    tagline: "Rhode Island’s statutory judgment interest rate.",
    q: "What is the current Rhode Island post-judgment interest rate?",
    body: "Rhode Island money judgments carry a fixed statutory rate of 12% per year under R.I. Gen. Laws § 9-21-10, as simple interest. Carve-outs affect scope/accrual date, not the rate. (1) Pre- vs post-judgment: § 9-21-10(a) provides prejudgment interest at 12% from the date the…",
  },
  "south-carolina-judgment-rate": {
    tagline: "South Carolina judgment interest — a formula rate, reset twice a year.",
    q: "What is the current South Carolina post-judgment interest rate?",
    body: "South Carolina post-judgment interest is currently 10.75% — a statutory formula rate under S.C. Code Ann. § 34-31-20(B) that resets twice a year. This is the rate on money decrees and judgments under § 34-31-20(B), applicable to all judgments entered on or after July 1, 2005. TRANSITIONAL: for…",
  },
  "south-dakota-judgment-rate": {
    tagline: "South Dakota’s statutory judgment interest rate.",
    q: "What is the current South Dakota post-judgment interest rate?",
    body: "South Dakota money judgments carry a fixed statutory rate of 10% per year under SDCL § 54-3-5.1, as simple interest. Post-judgment default is Category B = 10% under SDCL 54-3-5.1. EXCLUSIONS from that section (these are NOT at the flat Category B judgment rate): (1)…",
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
      scope: "Section 815.05(8) governs interest after entry of a Wisconsin judgment. Prejudgment interest on a verdict, decision, or report is addressed separately in Wis. Stat. § 814.04(4), so the 7.75% post-judgment headline should not be treated as a universal prejudgment rate.",
      accrual: "The judgment-entry date selects the controlling half-year benchmark: use the H.15 bank prime rate in effect on the immediately preceding January 1 or July 1, then add one percentage point. Interest runs from entry until the judgment is paid.",
      compounding: "StatuteRates does not enable a Wisconsin payoff calculator yet because the dataset has not verified every day-count, compounding, partial-payment, and judgment-branch rule needed for a dependable result.",
      history: "The current half-year reference is recorded with its statute and official source. A complete historical half-year schedule remains a future data-depth project; missing periods are not backfilled from assumptions.",
    },
  },
  "wyoming-judgment-rate": {
    tagline: "Wyoming’s statutory judgment interest rate.",
    q: "What is the current Wyoming post-judgment interest rate?",
    body: "Wyoming money judgments carry a fixed statutory rate of 10% per year under Wyo. Stat. Ann. 1-16-102, as simple interest. POST-judgment only (this statute governs interest on decrees/judgments from date of rendition; prejudgment interest is a separate common-law/contract…",
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
    tagline: "Alabama’s prejudgment interest rate — when a court awards it.",
    q: "What is the Alabama prejudgment interest rate?",
    body: "Alabama prejudgment interest is 6% per year, as simple interest under Ala. Code § 8-8-1. Prejudgment interest is available ONLY on liquidated / reasonably ascertainable sums.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "alabama-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on liquidated / reasonably ascertainable sums.",
    applies: "Prejudgment interest is available ONLY on liquidated / reasonably ascertainable sums. (1) Contract claims (§ 8-8-8): recoverable as of right where the amount is certain or ascertainable at the time of breach; a bona fide dispute over the amount does not defeat it if the sum is computable by known standards.",
    accrual: "From the day the money should have been paid or the act performed (§ 8-8-8 — \"from the day such money… should have been paid\"), i.e., the date of breach. Noncontract/tort claims (where allowed): from the date of injury/loss, provided the property injured or destroyed has an ascertainable money value.",
    compound: "Simple.",
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
    tagline: "Arizona prejudgment interest — a formula rate, reset periodically.",
    q: "What is the Arizona prejudgment interest rate?",
    body: "Arizona prejudgment interest is currently 7.75% per year — a statutory formula rate under A.R.S. § 44-1201(A), & that resets periodically. Prejudgment interest is available ONLY on LIQUIDATED / readily-ascertainable claims — a claim is liquidated if the plaintiff provides a basis for precisely calculating the amount owed.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "arizona-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on LIQUIDATED / readily-ascertainable claims — a claim is liquidated if the plaintiff provides a basis for precisely calculating the amount owed.",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED / readily-ascertainable claims — a claim is liquidated if the plaintiff provides a basis for precisely calculating the amount owed. A.R.S. 44-1201(F) EXPRESSLY BARS a court from awarding prejudgment interest on (1) unliquidated damages, (2) future damages, (3) punitive damages, and (4) exemplary damages found by the trier of fact.",
    accrual: "Prejudgment interest accrues from the date the claim becomes liquidated / due and demandable — i.e., the date the amount owed became certain or capable of precise calculation (for a liquidated debt, typically the date of the demand or the date payment was due). It runs until entry of judgment.",
    compound: "Simple — Arizona applies simple (non-compounding) interest to judgments/prejudgment interest absent a written agreement providing otherwise.",
    formula: "Lesser of 10%/year or (1% + prime rate published in Federal Reserve statistical release H.15). Prime is currently 6.75%, so the applicable rate is 6.75% + 1% = 7.75%.",
  },
  "arkansas-prejudgment-rate": {
    tagline: "Arkansas prejudgment interest — a formula rate, reset periodically.",
    q: "What is the Arkansas prejudgment interest rate?",
    body: "Arkansas prejudgment interest is currently 5.75% per year — a statutory formula rate under Ark. Code Ann. § 16-65-114(a)(1) that resets periodically. Prejudgment interest is allowed ONLY when the amount of damages is definitely/reasonably ascertainable at the time of loss — i.e., fixed by a mathematical computation or by rules of…",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "arkansas-judgment-rate",
    appliesShort: "Prejudgment interest is allowed ONLY when the amount of damages is definitely/reasonably ascertainable at the time of loss — i.e., fixed by a mathematical computation or by rules of…",
    applies: "Prejudgment interest is allowed ONLY when the amount of damages is definitely/reasonably ascertainable at the time of loss — i.e., fixed by a mathematical computation or by rules of evidence/known standards WITHOUT reliance on opinion or the fact-finder's discretion (Woodline Motor Freight v. Troutman Oil, 327 Ark. 448 (1997)). So: liquidated/ascertainable contract debts, conversion of property with a market value, and similar claims DO get it.",
    accrual: "Accrues from the date of the loss/injury (the date the ascertainable amount was owed or the property was taken/damaged), running up to the date of judgment. It does not accrue until/unless damages became definitely ascertainable.",
    compound: "Simple.",
    formula: "Greater of (a) contract rate or (b) Federal Reserve primary credit rate on the judgment date + 2%. All other (non-contract/tort) actions: Federal Reserve primary credit rate on the judgment date + 2%.",
  },
  "california-prejudgment-rate": {
    tagline: "California prejudgment interest — 7% for tort/non-contract, 10% for contract (both simple).",
    q: "What is the California prejudgment interest rate?",
    body: "California prejudgment interest is a dual fixed rate: 7% per year for tort and other non-contract claims, including personal injury (Cal. Const. art. XV §1), and 10% for breach of a contract that stipulates no rate (Cal. Civ. Code §3289(b)) — both simple. Prejudgment interest is NOT automatic on all claims.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "california-judgment-rate",
    appliesShort: "Prejudgment interest is NOT automatic on all claims.",
    applies: "Prejudgment interest is NOT automatic on all claims. MANDATORY (as of right) only where damages are \"certain, or capable of being made certain by calculation\" and the right vested on a particular day — i.e., liquidated/readily ascertainable claims (Civ. Code sec. 3287(a)). UNLIQUIDATED tort claims: interest is BARRED as of right; it is DISCRETIONARY with the jury, and only in actions for breach of a non-contract obligation or cases of oppression, fraud, or malice (Civ. Code sec. 3288).",
    accrual: "For mandatory liquidated claims (sec. 3287(a)): from the day the right to recover vested / damages became certain (e.g., date of loss or breach). For contract default 10% (sec. 3289(b)): from the date of breach. For discretionary unliquidated contract interest (sec. 3287(b)): from a date fixed by the court, but no…",
    compound: "Simple. California prejudgment interest is computed as simple interest; compounding is not authorized absent a contract term providing for it.",
    formula: "Fixed statutory/constitutional percentages, not a published index. Contract w/o stipulated rate (post-1/1/1986): 10%/yr simple (Civ. Code 3289(b)). Other liquidated claims / discretionary tort: 7%/yr simple (Cal. Const. art. XV sec. 1).",
  },
  "colorado-prejudgment-rate": {
    tagline: "Colorado prejudgment interest — 8% general, 9% for personal injury, both compounded annually.",
    q: "What is the Colorado prejudgment interest rate?",
    body: "Colorado has two prejudgment interest rates, both compounded annually: 8% per year for general and contract claims and money or property wrongfully withheld (C.R.S. §5-12-102(1)(b)), and 9% per year for personal-injury actions (C.R.S. §13-21-101), which §5-12-102 expressly carves out. Colorado is unusually broad — prejudgment interest is NOT limited to liquidated or ascertainable sums.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "colorado-judgment-rate",
    appliesShort: "Prejudgment interest is NOT limited to liquidated/ascertainable sums.",
    applies: "Prejudgment interest is NOT limited to liquidated/ascertainable sums. Under 5-12-102, the claimant is entitled to interest on all moneys or property \"wrongfully withheld,\" and Colorado courts (e.g., Mesa Sand & Gravel v. Landfill) have held this covers UNLIQUIDATED claims and general contract/property damages — the amount need not be certain or ascertainable. So it is available on unliquidated claims, unlike most states.",
    accrual: "General (5-12-102): from the date the money/property was wrongfully withheld or the date it became due, running to date of payment or date judgment is entered, whichever occurs first. Personal injury (13-21-101): plaintiff may claim interest from the date the action accrued (for actions filed on/after 7/1/1979), or…",
    compound: "Compound — compounded annually under both 5-12-102 (8%) and 13-21-101 (9%, compounded annually for actions filed on/after 7/1/1979).",
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
    body: "Delaware prejudgment interest is currently 8.75% per year — a statutory formula rate under 6 Del. C. § 2301(a) that resets periodically. Prejudgment interest under Delaware law is awarded as a MATTER OF RIGHT (not discretionary) to a prevailing plaintiff on a liquidated or ascertainable money claim, most clearly in…",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "delaware-judgment-rate",
    appliesShort: "Prejudgment interest under Delaware law is awarded as a MATTER OF RIGHT (not discretionary) to a prevailing plaintiff on a liquidated or ascertainable money claim, most clearly in…",
    applies: "Prejudgment interest under Delaware law is awarded as a MATTER OF RIGHT (not discretionary) to a prevailing plaintiff on a liquidated or ascertainable money claim, most clearly in breach-of-contract actions where a sum is due. It compensates for the loss of use of money and is available even where damages were unliquidated/disputed, as long as a definite sum is ultimately owed; a contract (or contract-type money) claim generally must be pleaded for prejudgment interest to accrue (Superior Court has held a…",
    accrual: "From the date of breach / the date payment became due (when the money should have been paid). Tort compensatory damages under § 2301(d): from the date of injury, but only if the qualifying written settlement demand (valid 30+ days, below the final award) was made.",
    compound: "Simple by default. Delaware disfavors compound interest and courts award simple prejudgment interest absent an express contractual or statutory provision permitting compounding; compounding appears mainly in statutory appraisal actions (8…",
    formula: "Legal rate = Federal Reserve discount rate (including any surcharge) + 5%, measured \"as of the time from which interest is due\" (6 Del. C. § 2301(a)). Currently 3.75% Fed discount rate + 5% = 8.75%. Rate is locked at the date interest starts accruing and applied as simple interest by default.",
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
    tagline: "Idaho’s prejudgment interest rate — when a court awards it.",
    q: "What is the Idaho prejudgment interest rate?",
    body: "Idaho prejudgment interest is 12% per year, as simple interest under Idaho Code 28-22-104(1). Prejudgment interest is available ONLY where the claim is liquidated OR the amount is ascertainable by a mere mathematical process.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "idaho-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY where the claim is liquidated OR the amount is ascertainable by a mere mathematical process.",
    applies: "Prejudgment interest is available ONLY where the claim is liquidated OR the amount is ascertainable by a mere mathematical process. It is BARRED on unliquidated damages. Generally NOT available in tort cases unless the damages are reasonably ascertainable/liquidated (Davis v. Prof'l Bus. Servs.; Bouten Constr. v. H.F. Magnuson). Contract claims qualify when the sum due is fixed or mathematically determinable. If an express written contract sets a different interest rate, that rate applies instead of 12%.",
    accrual: "Interest accrues from the date the money became \"due\" (for contract, the date of breach), provided that at that point the amount was liquidated or ascertainable by mathematical computation.",
    compound: "Simple.",
  },
  "illinois-prejudgment-rate": {
    tagline: "Illinois’s prejudgment interest rate — when a court awards it.",
    q: "What is the Illinois prejudgment interest rate?",
    body: "Illinois prejudgment interest is 6% / 5% per year, as simple interest under 735 ILCS 5/2-1303(c). Interest Act (815 ILCS 205/2), 5%: available ONLY where the amount is LIQUIDATED or subject to easy computation — written instruments (bond, bill, promissory note), money lent/advanced,…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "illinois-judgment-rate",
    appliesShort: "Interest Act (815 ILCS 205/2), 5%: available ONLY where the amount is LIQUIDATED or subject to easy computation — written instruments (bond, bill, promissory note), money lent/advanced,…",
    applies: "Interest Act (815 ILCS 205/2), 5%: available ONLY where the amount is LIQUIDATED or subject to easy computation — written instruments (bond, bill, promissory note), money lent/advanced, money due on a settled/liquidated account, money received to another's use and retained, and money withheld by \"unreasonable and vexatious delay.\" BARRED on unliquidated damages where the amount is genuinely disputed until judgment (traditional Illinois rule: no prejudgment interest on unliquidated tort/damage claims outside a…",
    accrual: "Personal injury/wrongful death (735 ILCS 5/2-1303(c)): accrues from the date the action is FILED (tolled while voluntarily dismissed and refiled), capped at 5 years maximum.",
    compound: "Simple interest. 735 ILCS 5/2-1303(c) provides \"interest calculated at the rate of 6% per annum\" with no compounding language; the Interest Act 815 ILCS 205/2 likewise provides simple 5% per annum.",
  },
  "indiana-prejudgment-rate": {
    tagline: "Indiana prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Indiana prejudgment interest rate?",
    body: "In Indiana, prejudgment interest is discretionary: a court may award it, and when it does the rate is 8% per year under Contract/liquidated: IC 24-4.6-1-103. CONTRACT/liquidated money claims (IC 24-4.6-1-103): prejudgment interest at 8% is available AS A MATTER OF RIGHT (not discretionary) only where damages are complete and ascertainable as of…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "indiana-judgment-rate",
    appliesShort: "CONTRACT/liquidated money claims (IC 24-4.6-1-103): prejudgment interest at 8% is available AS A MATTER OF RIGHT (not discretionary) only where damages are complete and ascertainable as of…",
    applies: "CONTRACT/liquidated money claims (IC 24-4.6-1-103): prejudgment interest at 8% is available AS A MATTER OF RIGHT (not discretionary) only where damages are complete and ascertainable as of a fixed time by fixed rules of evidence/known standards of value (common-law Roper rule) — i.e., liquidated/readily-computable sums (written instruments not specifying a rate, accounts stated, closed accounts, money had and received). Unliquidated damages requiring judgment/discretion to fix the amount do NOT qualify.",
    accrual: "Contract (IC 24-4.6-1-103): accrues from the date money became due / date of demand — e.g., date of settlement on money due on a written instrument without a stated rate, or the date an itemized bill was rendered and payment demanded on accounts stated/closed accounts/money had and received.",
    compound: "Simple. Tort statute (IC 34-51-4-9) expressly requires the court to compute prejudgment interest \"at the simple rate.\" Contract-claim prejudgment interest (IC 24-4.6-1-103, 8%) is likewise applied as simple interest.",
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
    tagline: "Maryland prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Maryland prejudgment interest rate?",
    body: "In Maryland, prejudgment interest is discretionary: a court may award it, and when it does the rate is 6% per year under Md. Const. Art. III, sec. 57. Availability depends on claim type under the three-category common-law framework (Buxton v. Buxton): (1) AS OF RIGHT (mandatory) where \"the obligation to pay and the amount due had become…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "maryland-judgment-rate",
    appliesShort: "Availability depends on claim type under the three-category common-law framework (Buxton v. Buxton): (1) AS OF RIGHT (mandatory) where \"the obligation to pay and the amount due had become…",
    applies: "Availability depends on claim type under the three-category common-law framework (Buxton v. Buxton): (1) AS OF RIGHT (mandatory) where \"the obligation to pay and the amount due had become certain, definite, and liquidated by a specific date prior to judgment\" — e.g., written contracts to pay money on a day certain (bills of exchange, promissory notes), sums payable under leases as rent, bonds, and readily-ascertainable conversion claims.",
    accrual: "For \"as of right\" liquidated claims: from the date the sum became due/certain (the specific date prior to judgment on which the fixed amount was owed and withheld). For contract claims generally: from the date of breach/when payment was due.",
    compound: "Simple. The Court of Appeals in Buxton (following Md. Nat'l Bank v. Cummins, 322 Md. 570) limited prejudgment interest to simple interest at 6%.",
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
    tagline: "Missouri prejudgment interest — 9% for some non-tort claims; tort rules have two stages.",
    q: "What is the Missouri prejudgment interest rate?",
    body: "Missouri prejudgment interest is claim-specific. Liquidated or contract claims may use the 9% rule in §408.020. For qualifying tort claims, §408.040.3 awards prejudgment interest within the subsection that sets the tort judgment rate at the intended Federal Funds Rate plus 5 points; §408.040.4 separately sets a Federal Funds plus 3-point rate on the prejudgment-interest portion after it becomes part of the judgment.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "missouri-judgment-rate",
    appliesShort: "Prejudgment interest is NOT freely available; it is claim-type restricted.",
    applies: "Prejudgment interest is NOT freely available; it is claim-type restricted. (1) TORT actions (§ 408.040.2): available ONLY if the claimant made a written demand/settlement offer sent by certified mail return receipt, accompanied by a signed affidavit describing the claim, injuries, and a computation of damage categories with supporting documentation (medical provider list, bills, employer list and authorizations for PI/wrongful-death wage claims), the demand references § 408.040 and stays open 90 days, the suit is…",
    accrual: "TORT (§ 408.040.2): accrues from a date 90 days AFTER the demand/offer was received (per certified-mail return receipt), OR from the date the demand/offer was rejected without a counteroffer, whichever is earlier.",
    compound: "Simple. The statute states a per annum rate and does not authorize compounding; Missouri courts apply § 408.020 and § 408.040 prejudgment interest as simple interest.",
    formula: "Do not treat the two Missouri formulas as interchangeable. Section 408.040.3 uses intended Federal Funds Rate + 5 points for the tort judgment and contains the qualifying prejudgment-interest award. Section 408.040.4 separately applies Federal Funds + 3 points after the awarded prejudgment interest becomes part of the judgment.",
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
    tagline: "Nevada prejudgment interest — a formula rate, reset twice a year.",
    q: "What is the Nevada prejudgment interest rate?",
    body: "Nevada prejudgment interest is currently 8.75% per year — a statutory formula rate under NRS 99.040 that resets twice a year. Prejudgment interest in Nevada is generally limited to LIQUIDATED / readily ASCERTAINABLE sums.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "nevada-judgment-rate",
    appliesShort: "Prejudgment interest in Nevada is generally limited to LIQUIDATED / readily ASCERTAINABLE sums.",
    applies: "Prejudgment interest in Nevada is generally limited to LIQUIDATED / readily ASCERTAINABLE sums. NRS 99.040 grants interest on: (a) contracts express or implied (other than book accounts); (b) settlement of book or store accounts from the day the balance is ascertained; (c) money received to the use/benefit of another and detained without consent; (d) unpaid wages/salary after demand. For OPEN/STORE accounts, interest may be awarded only by a court in an action on the debt (AG Op. 98-20).",
    accrual: "Under NRS 17.130(2), interest on the money judgment (the prejudgment-to-postjudgment period) runs from the time of SERVICE OF THE SUMMONS AND COMPLAINT until satisfied — except any amount representing FUTURE damages, which draws interest only from entry of judgment.",
    compound: "Simple interest. The FID's official prime-rate publication (citing NRS 99.040 / AG Op. 98-20) states \"Simple interest may be imposed at the rate established in NRS 99.040.\" Nevada courts compute NRS 17.130 / 99.040 interest as simple, not…",
    formula: "Variable formula, published by the Nevada Commissioner of Financial Institutions (Financial Institutions Division): rate = (prime rate at the largest bank in Nevada on the immediately preceding Jan 1 or Jul 1) + 2 percentage points. FID publishes the ascertained prime rate semiannually.",
  },
  "new-hampshire-prejudgment-rate": {
    tagline: "New Hampshire prejudgment interest — a formula rate, reset each year.",
    q: "What is the New Hampshire prejudgment interest rate?",
    body: "New Hampshire prejudgment interest is currently 5.7% per year — a statutory formula rate under RSA 336:1, II that resets each year. Prejudgment interest is added by statute to essentially ALL pecuniary damage awards, NOT limited to liquidated or contract claims.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "new-hampshire-judgment-rate",
    appliesShort: "Prejudgment interest is added by statute to essentially ALL pecuniary damage awards, NOT limited to liquidated or contract claims.",
    applies: "Prejudgment interest is added by statute to essentially ALL pecuniary damage awards, NOT limited to liquidated or contract claims. RSA 524:1-b expressly extends it to \"all other civil proceedings\" awarding pecuniary damages — personal injury, wrongful death, consequential damages, property/business/reputation damage, and \"any other type of loss for which damages are recognized\" — so tort and unliquidated claims DO receive prejudgment interest (unlike many states).",
    accrual: "Two tracks. RSA 524:1-a: for an action on a debt, account stated, or where liquidated damages are sought, interest runs from the institution of suit (absent a pre-suit demand; inapplicable if the party pays the money into court under superior court rules).",
    compound: "Simple (RSA 336:1, II expressly specifies the \"annual simple rate of interest\").",
    formula: "26-week U.S. Treasury bill discount rate at last auction preceding Sept 30 + 2 percentage points, rounded to nearest 0.1%; State Treasurer determines by Dec 1, effective Jan 1–Dec 31 of following year.",
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
    tagline: "New Mexico prejudgment interest — up to 10% (discretionary) for tort, 15% for liquidated/contract.",
    q: "What is the New Mexico prejudgment interest rate?",
    body: "New Mexico prejudgment interest splits by claim type: up to 10% at the court's discretion for unliquidated claims like personal injury (NMSA 1978 §56-8-4(B)), and 15% as of right for liquidated/contract claims (§56-8-3). (A) MATTER OF RIGHT (Sec. 56-8-3, up to 15%): available only when the claim is LIQUIDATED / ascertainable with reasonable certainty by a mathematical standard fixed in the contract or by…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "new-mexico-judgment-rate",
    appliesShort: "(A) MATTER OF RIGHT (Sec. 56-8-3, up to 15%): available only when the claim is LIQUIDATED / ascertainable with reasonable certainty by a mathematical standard fixed in the contract or by…",
    applies: "(A) MATTER OF RIGHT (Sec. 56-8-3, up to 15%): available only when the claim is LIQUIDATED / ascertainable with reasonable certainty by a mathematical standard fixed in the contract or by established market prices — i.e., money due by contract for a definite sum, money received to the use of another and wrongfully retained, or money due upon settlement of matured accounts.",
    accrual: "Discretionary track (56-8-4(B)): from the date the complaint is served upon the defendant. As-of-right track (56-8-3): from the date the sum became due/ascertainable — e.g., money due by contract accrues from when payment was due; matured accounts accrue from the day the balance is ascertained.",
    compound: "Simple interest (statute specifies a per-annum rate with no compounding provision; New Mexico prejudgment interest is applied as simple interest).",
  },
  "new-york-prejudgment-rate": {
    tagline: "New York’s prejudgment interest rate — when a court awards it.",
    q: "What is the New York prejudgment interest rate?",
    body: "New York prejudgment interest is 9% per year, as simple interest under N.Y. C.P.L.R. 5004. Prejudgment (pre-verdict) interest under CPLR 5001 is available AS OF RIGHT only for (1) breach of contract and (2) an \"act or omission depriving or otherwise interfering with title to, or…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "new-york-judgment-rate",
    appliesShort: "Prejudgment (pre-verdict) interest under CPLR 5001 is available AS OF RIGHT only for (1) breach of contract and (2) an \"act or omission depriving or otherwise interfering with title to, or…",
    applies: "Prejudgment (pre-verdict) interest under CPLR 5001 is available AS OF RIGHT only for (1) breach of contract and (2) an \"act or omission depriving or otherwise interfering with title to, or possession or enjoyment of, property\" (i.e., property-damage/conversion/many economic torts). It is thus effectively limited to liquidated or ascertainable pecuniary damages. In actions \"of an equitable nature,\" interest and its rate/accrual date are DISCRETIONARY with the court (CPLR 5001(a)).",
    accrual: "Interest is computed \"from the earliest ascertainable date the cause of action existed\" (CPLR 5001(b)); for damages incurred later, from the date incurred; where damages arose at various times, interest may be computed on each item from its date or on all damages from \"a single reasonable intermediate date.\" The…",
    compound: "Simple.",
  },
  "north-carolina-prejudgment-rate": {
    tagline: "North Carolina’s prejudgment interest rate — when a court awards it.",
    q: "What is the North Carolina prejudgment interest rate?",
    body: "North Carolina prejudgment interest is 8% per year, as simple interest under N.C. Gen. Stat. 24-5. Prejudgment interest is claim-type-restricted, not universal.",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "north-carolina-judgment-rate",
    appliesShort: "Prejudgment interest is claim-type-restricted, not universal.",
    applies: "Prejudgment interest is claim-type-restricted, not universal. CONTRACT actions (G.S. 24-5(a)): the amount awarded on the contract bears prejudgment interest from date of breach; the fact finder must separate principal from interest. Excludes penal bonds (G.S. 24-5(a1)), which bear interest only from entry of judgment. NON-CONTRACT / TORT actions (G.S.",
    accrual: "From the DATE OF BREACH (G.S. 24-5(a)). Non-contract/tort actions: the compensatory-damages portion accrues from the DATE THE ACTION IS COMMENCED (filing), not the date of injury/loss, until the judgment is satisfied (G.S. 24-5(b)).",
    compound: "Simple (statutory legal rate applied per annum to the principal; no compounding provided by statute).",
  },
  "north-dakota-prejudgment-rate": {
    tagline: "North Dakota’s prejudgment interest rate — when a court awards it.",
    q: "What is the North Dakota prejudgment interest rate?",
    body: "North Dakota prejudgment interest is 6% per year, as simple interest under N.D.C.C. § 32-03-04. Two distinct tracks. (1) MANDATORY prejudgment interest as of right under § 32-03-04 ONLY for damages that are \"certain or capable of being made certain by calculation\" and where the right…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "north-dakota-judgment-rate",
    appliesShort: "Two distinct tracks. (1) MANDATORY prejudgment interest as of right under § 32-03-04 ONLY for damages that are \"certain or capable of being made certain by calculation\" and where the right…",
    applies: "Two distinct tracks. (1) MANDATORY prejudgment interest as of right under § 32-03-04 ONLY for damages that are \"certain or capable of being made certain by calculation\" and where the right to recover is vested on a \"particular day\" — i.e., liquidated / readily ascertainable claims (typically contract debts and sums calculable by fixed standards). Recovery of prejudgment interest is precluded on unliquidated damages that are not ascertainable by calculation.",
    accrual: "Under § 32-03-04, interest accrues from the \"particular day\" the right to recover vested — i.e., the date the liquidated/ascertainable debt became due or the date of breach for contract claims.",
    compound: "Simple. The 6% legal rate under § 47-14-05 is simple interest; North Dakota law generally prohibits compounding of interest (see § 47-14-09, interest may not be compounded), and prejudgment interest is computed as simple interest.",
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
    applies: "Two distinct tracks. (1) CONTRACT / LIQUIDATED claims under ORC 1343.03(A): prejudgment interest is a matter of RIGHT (not discretionary) on money due and payable upon a written contract, book account, settlement, or other instrument of writing — the creditor is entitled to interest at the 1343.03(A) statutory rate (or the contract rate if the written contract provides one). Ohio case law (Royal Elec. Constr.",
    accrual: "Contract/liquidated (1343.03(A)): interest accrues from the date the money became due and payable (e.g., breach/when payment was owed). Tort (1343.03(C)(1)): if awarded, interest is computed from the date the cause of action accrued (for cases of admitted/deliberate liability) or, otherwise, from the earlier of (a)…",
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
    tagline: "Pennsylvania’s prejudgment interest rate — when a court awards it.",
    q: "What is the Pennsylvania prejudgment interest rate?",
    body: "Pennsylvania prejudgment interest is 6% per year, as simple interest under 41 P.S. Sec. 202. Highly claim-type dependent. CONTRACT: prejudgment interest is awarded AS OF RIGHT only when damages are liquidated/ascertainable (e.g., a sum certain / definite invoice amount due at…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "pennsylvania-judgment-rate",
    appliesShort: "Highly claim-type dependent. CONTRACT: prejudgment interest is awarded AS OF RIGHT only when damages are liquidated/ascertainable (e.g., a sum certain / definite invoice amount due at…",
    applies: "Highly claim-type dependent. CONTRACT: prejudgment interest is awarded AS OF RIGHT only when damages are liquidated/ascertainable (e.g., a sum certain / definite invoice amount due at breach) at 6% under 41 P.S. Sec. 202; for unliquidated contract damages the award of prejudgment interest is DISCRETIONARY with the trial court (Pa. courts, Restatement (Second) of Contracts Sec. 354).",
    accrual: "CONTRACT (liquidated): from the date payment was due / the money became owed (e.g., invoice due date or date of breach). TORT (Rule 238): from a date ONE YEAR after the date original process was first served in the action, up to the date of the award, verdict, or decision.",
    compound: "Simple (not compounded) under both regimes; Rule 238 expressly states \"not compounded,\" and the 41 P.S. Sec. 202 legal rate is applied as simple interest.",
  },
  "rhode-island-prejudgment-rate": {
    tagline: "Rhode Island’s prejudgment interest rate — when a court awards it.",
    q: "What is the Rhode Island prejudgment interest rate?",
    body: "Rhode Island prejudgment interest is 12% per year, as simple interest under R.I. Gen. Laws § 9-21-10. Very broad but with key carve-outs. APPLIES to any civil action \"in which a verdict is rendered or a decision made for pecuniary damages\" — covers BOTH tort and contract, and both…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "rhode-island-judgment-rate",
    appliesShort: "Very broad but with key carve-outs. APPLIES to any civil action \"in which a verdict is rendered or a decision made for pecuniary damages\" — covers BOTH tort and contract, and both…",
    applies: "Very broad but with key carve-outs. APPLIES to any civil action \"in which a verdict is rendered or a decision made for pecuniary damages\" — covers BOTH tort and contract, and both liquidated AND unliquidated claims (RI is notable for allowing prejudgment interest on unliquidated tort damages such as personal injury). Added automatically by the clerk; not discretionary and not a component of the damage award.",
    accrual: "General rule (§ 9-21-10(a)): interest runs \"from the date the cause of action accrued\" (e.g., date of the accident/breach) to entry of judgment. Medical/dental malpractice (§ 9-21-10(b)): interest runs from the date of written notice of the claim by the claimant (or representative) to the malpractice liability insurer…",
    compound: "Simple. Prejudgment interest is computed as simple interest on the verdict/pecuniary-damages amount from accrual to judgment (statute directs the clerk to add interest \"to the amount of damages\").",
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
    tagline: "South Dakota prejudgment interest — a formula rate, reset periodically.",
    q: "What is the South Dakota prejudgment interest rate?",
    body: "South Dakota prejudgment interest is currently 10% per year — a statutory formula rate under SDCL 21-1-13.1 that resets periodically. Broad availability but with sharp claim-type carve-outs.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "south-dakota-judgment-rate",
    appliesShort: "Broad availability but with sharp claim-type carve-outs.",
    applies: "Broad availability but with sharp claim-type carve-outs. Any person entitled to recover damages (principal action, counterclaim, cross-claim, or third-party claim) is entitled to prejudgment interest. IMPORTANT: South Dakota does NOT limit prejudgment interest to liquidated or readily ascertainable sums — after the 1990 amendment, SDCL 21-1-13.1 allows prejudgment interest on unliquidated damages as well, with the accrual mechanism (verdict-specified date) handling uncertain loss dates.",
    accrual: "Interest accrues from the day the loss or damage occurred, except during any period the debtor is prevented by law, or by act of the creditor, from paying the debt.",
    compound: "Simple. The statute (SDCL 21-1-13.1 / 54-3-16) does not authorize compounding, and South Dakota courts apply simple interest for prejudgment interest.",
    formula: "Fixed statutory value. Default = Category B rate under SDCL 54-3-16 = 10% per year. Exception: contract claims take the contract's stated rate if the contract provides one (otherwise 10%).",
  },
  "tennessee-prejudgment-rate": {
    tagline: "Tennessee prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Tennessee prejudgment interest rate?",
    body: "In Tennessee, prejudgment interest is discretionary: a court may award it, and when it does the rate is 10% per year under Tenn. Code Ann. § 47-14-123. Discretionary, not mandatory — awarded \"in accordance with the principles of equity.\" NOT limited to contract claims: available for both contract and tort/other actions, but the key…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "tennessee-judgment-rate",
    appliesShort: "Discretionary, not mandatory — awarded \"in accordance with the principles of equity.\" NOT limited to contract claims: available for both contract and tort/other actions, but the key…",
    applies: "Discretionary, not mandatory — awarded \"in accordance with the principles of equity.\" NOT limited to contract claims: available for both contract and tort/other actions, but the key equitable factors are (1) whether the amount of the obligation is CERTAIN or ascertainable (existence and amount reasonably ascertainable by accepted standards of valuation), and (2) whether the defendant was reasonably able to know the amount owed. Uncertain/unliquidated or highly disputed damages weigh against an award.",
    accrual: "Discretionary as to accrual date; typically runs from the date the underlying obligation/claim became due and the amount was ascertainable (e.g., date of breach or date the debt was owed) up to the date of judgment. The court sets the accrual start based on equity; the statute does not fix a rigid accrual date.",
    compound: "Simple interest only — Tennessee case law holds statutorily awarded prejudgment interest under § 47-14-123 is simple, not compound.",
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
    tagline: "Vermont prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Vermont prejudgment interest rate?",
    body: "In Vermont, prejudgment interest is discretionary: a court may award it, and when it does the rate is 12% per year under 9 V.S.A. § 41a(a). Prejudgment interest is awarded AS OF RIGHT (mandatory) when the principal sum recovered is liquidated or capable of ready ascertainment (e.g., established market prices, contract amounts,…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "vermont-judgment-rate",
    appliesShort: "Prejudgment interest is awarded AS OF RIGHT (mandatory) when the principal sum recovered is liquidated or capable of ready ascertainment (e.g., established market prices, contract amounts,…",
    applies: "Prejudgment interest is awarded AS OF RIGHT (mandatory) when the principal sum recovered is liquidated or capable of ready ascertainment (e.g., established market prices, contract amounts, medical damages and lost wages in personal-injury cases). For other/unliquidated damages, it is DISCRETIONARY — awardable in the trier of fact's discretion where needed to make the plaintiff whole / avoid injustice.",
    accrual: "Interest accrues from the date the cause of action accrued (the time of the loss/breach/injury) to the date of entry of judgment. For liquidated/ascertainable sums, from when the sum became due/ascertainable; for other pecuniary harms, from the accrual of the cause of action to judgment.",
    compound: "Simple interest — 12% per annum applied to the principal from accrual to judgment; Vermont does not compound prejudgment interest.",
  },
  "virginia-prejudgment-rate": {
    tagline: "Virginia prejudgment interest is discretionary — here is the rate courts apply.",
    q: "What is the Virginia prejudgment interest rate?",
    body: "In Virginia, prejudgment interest is discretionary: a court may award it, and when it does the rate is 6% per year under Va. Code Ann. § 8.01-382. Prejudgment interest in Virginia is DISCRETIONARY as to both whether to award it and the date it commences — § 8.01-382 says the factfinder \"may provide for interest on any principal sum…",
    prejudgment: true,
    kind: "discretionary-with-default",
    kindLabel: "Discretionary",
    postSlug: "virginia-judgment-rate",
    appliesShort: "Prejudgment interest in Virginia is DISCRETIONARY as to both whether to award it and the date it commences — § 8.01-382 says the factfinder \"may provide for interest on any principal sum…",
    applies: "Prejudgment interest in Virginia is DISCRETIONARY as to both whether to award it and the date it commences — § 8.01-382 says the factfinder \"may provide for interest on any principal sum awarded… and fix the period at which the interest shall commence.\" It is not mandatory.",
    accrual: "Discretionary — the factfinder \"fixes the period at which the interest shall commence\" under § 8.01-382. It may be set as early as the date of loss/breach when interest is awarded, but there is no statutorily mandated accrual date; if no period is fixed, interest runs only from the date of entry of judgment / date the…",
    compound: "Simple (statutory judgment rate under § 6.2-302 is applied as simple interest; no statutory provision for compounding).",
  },
  "washington-prejudgment-rate": {
    tagline: "Washington’s prejudgment interest rate — when a court awards it.",
    q: "What is the Washington prejudgment interest rate?",
    body: "Washington prejudgment interest is 12% per year, as simple interest under RCW 19.52.010(1). Prejudgment interest is available ONLY on LIQUIDATED or readily-determinable claims — those where the evidence furnishes data that makes it possible to compute the amount with exactness,…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "washington-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on LIQUIDATED or readily-determinable claims — those where the evidence furnishes data that makes it possible to compute the amount with exactness,…",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED or readily-determinable claims — those where the evidence furnishes data that makes it possible to compute the amount with exactness, without reliance on opinion or discretion (Prier v. Refrigeration Eng'g; Hansen v. Rothaus). It is BARRED on UNLIQUIDATED claims requiring jury/court discretion or opinion evidence to fix the amount.",
    accrual: "Prejudgment interest accrues from the date the claim became liquidated / the amount became due and determinable (i.e., the date the liquidated sum could be computed), running until entry of judgment.",
    compound: "Simple.",
  },
  "west-virginia-prejudgment-rate": {
    tagline: "West Virginia prejudgment interest — a formula rate, reset twice a year.",
    q: "What is the West Virginia prejudgment interest rate?",
    body: "West Virginia prejudgment interest is currently 6.25% per year — a statutory formula rate under W. Va. Code § 56-6-31(b) that resets twice a year. Prejudgment interest is available ONLY on special damages and liquidated damages — NOT on general/unliquidated damages.",
    prejudgment: true,
    kind: "variable",
    kindLabel: "Formula rate",
    postSlug: "west-virginia-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on special damages and liquidated damages — NOT on general/unliquidated damages.",
    applies: "Prejudgment interest is available ONLY on special damages and liquidated damages — NOT on general/unliquidated damages. Per § 56-6-31(b), \"special damages\" means lost wages and income, medical expenses, damages to tangible personal property, and similar out-of-pocket expenditures. General damages (pain and suffering, emotional distress, and other unliquidated/non-economic damages) are EXCLUDED from prejudgment interest. Punitive damages are not eligible.",
    accrual: "Rate is fixed by reference to the Fifth Federal Reserve District secondary discount rate in effect on January 2 of the year in which the right to bring the action accrued, and that established rate remains constant for that particular judgment/decree notwithstanding later changes in the Fed rate.",
    compound: "Simple.",
    formula: "Fifth Federal Reserve District secondary discount rate on Jan 2 + 2 percentage points, capped 4%-9%. The Administrative Office of the Supreme Court of Appeals of West Virginia publishes the annual rate.",
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
    tagline: "Wyoming’s prejudgment interest rate — when a court awards it.",
    q: "What is the Wyoming prejudgment interest rate?",
    body: "Wyoming prejudgment interest is 7% per year, as simple interest under Wyo. Stat. Ann. Sec. 40-14-106(e). Prejudgment interest is available ONLY on LIQUIDATED claims — a claim that is \"readily computable by basic mathematical calculation.\" An otherwise-unliquidated claim qualifies only if it…",
    prejudgment: true,
    kind: "fixed",
    kindLabel: "Fixed by statute",
    postSlug: "wyoming-judgment-rate",
    appliesShort: "Prejudgment interest is available ONLY on LIQUIDATED claims — a claim that is \"readily computable by basic mathematical calculation.\" An otherwise-unliquidated claim qualifies only if it…",
    applies: "Prejudgment interest is available ONLY on LIQUIDATED claims — a claim that is \"readily computable by basic mathematical calculation.\" An otherwise-unliquidated claim qualifies only if it becomes determinable \"without reliance on opinion or discretion.\" BARRED on unliquidated claims and on amounts requiring the exercise of judicial discretion or opinion (e.g., attorney-fee awards, which are not a mathematical computation — Thorkildsen v. Belden LLC, 2012 WY 8).",
    accrual: "Accrues from the date the debtor receives notice of the amount due (i.e., when the liquidated sum becomes due and demand/notice is made), running until judgment.",
    compound: "Simple. The statute fixes a \"per annum\" rate with no compounding provision, and Wyoming courts apply prejudgment interest as simple interest.",
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
  'alaska-judgment-rate': '2026-07-26',
  'alaska-prejudgment-rate': '2026-07-26',
  'california-judgment-rate': '2026-08-21',
  'florida-judgment-rate': '2026-07-26',
  'florida-prejudgment-rate': '2026-07-26',
  'eu-late-payment-reference': '2026-08-16',
  'georgia-judgment-rate': '2026-07-26',
  'iowa-judgment-rate': '2026-07-26',
  'maine-judgment-rate': '2026-07-26',
  'maine-prejudgment-rate': '2026-07-26',
  'michigan-judgment-rate': '2026-08-21',
  'michigan-prejudgment-rate': '2026-08-21',
  'new-jersey-judgment-rate': '2026-08-21',
  'new-jersey-prejudgment-rate': '2026-08-21',
  'new-mexico-judgment-rate': '2026-08-16',
  'new-york-consumer-debt-judgment-rate': '2026-08-21',
  'new-york-judgment-rate': '2026-08-21',
  'ohio-judgment-rate': '2026-08-16',
  'ohio-prejudgment-rate': '2026-07-26',
  'oregon-judgment-rate': '2026-08-20',
  'idaho-judgment-rate': '2026-08-20',
  'indiana-judgment-rate': '2026-08-20',
  'louisiana-judgment-rate': '2026-08-20',
  'louisiana-prejudgment-rate': '2026-08-20',
  'new-hampshire-judgment-rate': '2026-08-20',
  'north-dakota-judgment-rate': '2026-08-20',
  'west-virginia-judgment-rate': '2026-08-20',
  'texas-judgment-rate': '2026-07-26',
  'texas-prejudgment-rate': '2026-07-26',
  'tennessee-judgment-rate': '2026-08-16',
  'us-federal-post-judgment': '2026-07-26',
  'uk-late-payment-commercial': '2026-08-16',
  'utah-judgment-rate': '2026-07-26',
  'washington-judgment-rate': '2026-07-26',
  'virginia-judgment-rate': '2026-08-16',
  'wisconsin-judgment-rate': '2026-07-26',
});

export function contentModifiedFor(slug) {
  return CONTENT_MODIFIED[slug] || null;
}
