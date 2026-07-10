// Original editorial copy per rate series (written here, not copied from any source). Keeps each
// page substantive for readers and search engines, and states plainly what the number means and how
// it is sourced/derived. `q` powers the FAQ rich-result and the human "what is it" line.

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
It is the reference from which the EU Late Payment Directive statutory interest rate is built. This page
tracks the official MRO rate and every change, straight from the ECB Data Portal.`,
  },
  'california-judgment-rate': {
    tagline: 'Interest on money judgments in California courts.',
    q: 'What is the current California post-judgment interest rate?',
    body: `California money judgments accrue simple interest at 10% per year on unpaid principal under Code of
Civil Procedure §685.010 — but the right rate depends on the case: judgments entered or renewed since
January 1, 2023 against individuals accrue only 5% when the debt is medical (under $200,000) or personal
(under $50,000), and judgments against state or local government entities accrue 7%. Interest accrues
daily (annual rate ÷ 365) from entry of judgment.`,
  },
  'new-york-judgment-rate': {
    tagline: 'The default interest rate on New York judgments.',
    q: 'What is the current New York judgment interest rate?',
    body: `New York judgments generally accrue interest at 9% per year under CPLR 5004 — one of the highest
statutory rates in the country. The major exception: since April 30, 2022, judgments arising out of
consumer debt against individuals accrue only 2% (see the companion consumer-debt series). Other
statutes can set different rates for specific defendants, so always check the governing provision.`,
  },
  'new-york-consumer-debt-judgment-rate': {
    tagline: 'The reduced rate on NY consumer-debt judgments since 2022.',
    q: 'What is the interest rate on consumer debt judgments in New York?',
    body: `Since April 30, 2022 (the Fair Consumer Judgment Interest Act), New York judgments arising out of
consumer debt against a natural person accrue interest at 2% per year instead of the general 9% —
"consumer debt" meaning obligations from transactions primarily for personal, family, or household
purposes. The 2% rate also applies from that date forward to the unpaid portion of consumer-debt
judgments entered earlier. LLMs and older guides routinely still quote 9% for these cases.`,
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
    tagline: 'Iowa’s market-linked judgment interest rate.',
    q: 'What is the current Iowa judgment interest rate?',
    body: `Unlike fixed-rate states, Iowa ties judgment interest to the market: Iowa Code §668.13 sets it at
the 1-year Treasury constant maturity yield (Federal Reserve H.15) published immediately before the
judgment, plus 2 percentage points, computed daily. That means the rate changes every week — this page
computes it from the same official H.15 series that drives the federal post-judgment rate. A contract
rate governs instead if the judgment is on a contract that fixes one.`,
  },
  'texas-judgment-rate': {
    tagline: 'Interest on Texas money judgments — tied to the prime rate.',
    q: 'What is the current Texas post-judgment interest rate?',
    body: `Texas post-judgment interest on most money judgments is the Federal Reserve prime rate, held within a
5% floor and 15% ceiling under Texas Finance Code §304.003 — currently 6.75%. The rate locks in when the
judgment is entered and, unusually, compounds annually. Judgments on a contract that sets its own interest
rate follow §304.002 instead (the contract rate, capped at 18%).`,
  },
  'florida-judgment-rate': {
    tagline: 'Florida’s quarterly judgment rate, set by the CFO.',
    q: 'What is the current Florida judgment interest rate?',
    body: `Florida’s post-judgment interest rate is reset every quarter by the state Chief Financial Officer
under Fla. Stat. §55.03 — the 12-month average of the New York Fed’s discount rate plus 4 points — currently
8.06% for the quarter beginning July 1, 2026. It’s simple interest, and a judgment’s rate re-adjusts each
January 1. Many sites still quote last quarter’s number; this page tracks the current one.`,
  },
  'georgia-judgment-rate': {
    tagline: 'Georgia judgment interest — prime rate plus 3 points.',
    q: 'What is the current Georgia post-judgment interest rate?',
    body: `Under O.C.G.A. §7-4-12, interest on a Georgia money judgment is the Federal Reserve prime rate on the
day of judgment plus 3 percentage points — about 9.75% today — fixed for the life of that judgment, as simple
interest. A judgment on a written contract that specifies a rate carries the contract rate instead.`,
  },
  'pennsylvania-judgment-rate': {
    tagline: 'Pennsylvania’s flat 6% legal judgment rate.',
    q: 'What is the Pennsylvania judgment interest rate?',
    body: `Pennsylvania judgments carry interest at the state’s legal rate of 6% per year — 42 Pa.C.S. §8101 sets
judgment interest at "the lawful rate," which 41 P.S. §202 fixes at 6%. It’s simple interest and has been 6%
for decades. A judgment on a loan or contract can carry a higher lawful contract rate where the documents set one.`,
  },
  'ohio-judgment-rate': {
    tagline: 'Ohio’s judgment rate, reset annually by the Tax Commissioner.',
    q: 'What is the current Ohio judgment interest rate?',
    body: `Ohio sets its judgment interest rate once a year: under R.C. §1343.03(B) and §5703.47 it’s the federal
short-term rate plus 3 points, rounded — currently 7% for 2026 — computed as simple interest. A written contract
that specifies a different rate controls instead.`,
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
    tagline: 'Michigan’s judgment rate — 5-year Treasury + 1 point, compounded.',
    q: 'What is the current Michigan judgment interest rate?',
    body: `Michigan is unusual: interest runs from the day you file the complaint, not just after judgment. Under
MCL §600.6013 the general rate is 1 point above the six-month average of 5-year Treasury auctions, reset every
January 1 and July 1 and compounded annually — currently 4.725%. Judgments on a written instrument use a separate
rate capped at 13%.`,
  },
  'new-jersey-judgment-rate': {
    tagline: 'New Jersey’s two-tier judgment rate, set yearly by the courts.',
    q: 'What is the current New Jersey post-judgment interest rate?',
    body: `New Jersey’s post-judgment interest is set annually by the Judiciary under Court Rule R. 4:42-11, based
on the State Cash Management Fund’s prior-year return. For 2026 it’s 4.5% on judgments up to $20,000 and 6.5%
(the base plus 2 points) on judgments over $20,000 — simple interest.`,
  },
  'virginia-judgment-rate': {
    tagline: 'Virginia’s flat 6% judgment rate.',
    q: 'What is the Virginia judgment interest rate?',
    body: `Virginia judgments carry 6% per year by default under Va. Code §6.2-302 (applied via §8.01-382), as
simple interest. A judgment on a contract carries the higher of the lawful contract rate or 6%.`,
  },
  'washington-judgment-rate': {
    tagline: 'Washington judgment interest — prime-linked since 2019.',
    q: 'What is the current Washington post-judgment interest rate?',
    body: `Since a 2019 amendment to RCW 4.56.110, Washington ties tort and general judgment interest to the
federal prime rate — currently about 8.75% — while judgments on a written contract carry the contract’s own rate.
It’s simple interest.`,
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
    body: `Tennessee post-judgment interest under Tenn. Code §47-14-121 is the "formula rate" (the weekly-average
prime rate announced by the state Commissioner of Financial Institutions) minus 2 percentage points, fixed when
the judgment is entered — currently 8.75%, as simple interest.`,
  },
  "alabama-judgment-rate": {
    tagline: "Alabama’s statutory judgment interest rate.",
    q: "What is the current Alabama post-judgment interest rate?",
    body: "Alabama money judgments carry a fixed statutory rate of 7.5% per year under Ala. Code § 8-8-10(a), as simple interest. For a judgment \"based upon a contract action,\" interest runs \"at the same rate of interest as stated in the contract\" (the contract rate governs, not…",
  },
  "alaska-judgment-rate": {
    tagline: "Alaska judgment interest — a formula rate, reset twice a year.",
    q: "What is the current Alaska post-judgment interest rate?",
    body: "Alaska post-judgment interest is currently 6.75% — a statutory formula rate under Alaska Stat. 09.30.070(a) that resets twice a year. A judgment founded on a written contract that specifies an interest rate (not exceeding the legal maximum) bears the contract rate if that rate is…",
  },
  "arkansas-judgment-rate": {
    tagline: "Arkansas judgment interest — a formula rate, reset periodically.",
    q: "What is the current Arkansas post-judgment interest rate?",
    body: "Arkansas post-judgment interest is currently 5.75% — a statutory formula rate under Ark. Code Ann. § 16-65-114(a) that resets periodically. The old fixed 10% (or contract rate, whichever greater) was replaced by Act 995 of 2019 (effective 7/24/2019) with the current…",
  },
  "connecticut-judgment-rate": {
    tagline: "Connecticut’s statutory judgment interest rate.",
    q: "What is the current Connecticut post-judgment interest rate?",
    body: "Connecticut money judgments carry a fixed statutory rate of 10% per year under Conn. Gen. Stat. §37-3a, as simple interest. §37-3a covers both prejudgment and postjudgment interest as damages for detention of money; §37-3b postjudgment interest runs from the earlier of 20…",
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
    tagline: "Idaho judgment interest — a formula rate, reset each year.",
    q: "What is the current Idaho post-judgment interest rate?",
    body: "Idaho post-judgment interest is currently 8.875% — a statutory formula rate under Idaho Code § 28-22-104(2) that resets each year. § 28-22-104(2) applies \"unless the judgment is rendered on a written contract or agreement providing for a different rate of interest, in which case…",
  },
  "indiana-judgment-rate": {
    tagline: "Indiana’s statutory judgment interest rate.",
    q: "What is the current Indiana post-judgment interest rate?",
    body: "Indiana money judgments carry a fixed statutory rate of 8% per year under Ind. Code § 24-4.6-1-101, as simple interest. This 8% is POST-judgment (from verdict/finding to satisfaction). Prejudgment interest is separate — under the Tort Prejudgment Interest Statute, Ind.…",
  },
  "kansas-judgment-rate": {
    tagline: "Kansas judgment interest — a formula rate, reset each year.",
    q: "What is the current Kansas post-judgment interest rate?",
    body: "Kansas post-judgment interest is currently 7.75% — a statutory formula rate under Kan. Stat. Ann. 16-204 that resets each year. This 16-204 rate is POST-judgment. Prejudgment interest is governed separately by K.S.A. 16-201 (10% per annum when no other rate agreed). CONTRACT:…",
  },
  "kentucky-judgment-rate": {
    tagline: "Kentucky’s statutory judgment interest rate.",
    q: "What is the current Kentucky post-judgment interest rate?",
    body: "Kentucky money judgments carry a fixed statutory rate of 6% per year under KRS 360.040, compounded annually. Default (tort/general/unpaid money judgments, and prejudgment interest once reduced to judgment): 6% compounded annually [KRS 360.040(1)]. CHILD…",
  },
  "louisiana-judgment-rate": {
    tagline: "Louisiana judgment interest — a formula rate, reset each year.",
    q: "What is the current Louisiana post-judgment interest rate?",
    body: "Louisiana post-judgment interest is currently 7.5% — a statutory formula rate under La. R.S. 13:4202(B) that resets each year. Louisiana uses one unified \"judicial interest\" (= \"legal interest\") rate; La. R.S. 13:4203 provides interest attaches from the date of judicial…",
  },
  "maryland-judgment-rate": {
    tagline: "Maryland’s statutory judgment interest rate.",
    q: "What is the current Maryland post-judgment interest rate?",
    body: "Maryland money judgments carry a fixed statutory rate of 10% per year under Md. Code, Courts & Judicial Proceedings Section 11-107(a), as simple interest. Under the \"except as provided in Section 11-106\" clause, a money judgment on a contract for a loan of money carries interest at the RATE CHARGED IN…",
  },
  "minnesota-judgment-rate": {
    tagline: "Minnesota judgment interest — a formula rate, reset each year.",
    q: "What is the current Minnesota post-judgment interest rate?",
    body: "Minnesota post-judgment interest is currently 4% / 10% — a statutory formula rate under Minn. Stat. § 549.09, subd. 1(c) that resets each year. Standard variable Treasury-indexed rate (4% floor) applies to judgments/awards of $50,000 or less, and to ALL judgments/awards for or against the…",
  },
  "missouri-judgment-rate": {
    tagline: "Missouri judgment interest — a formula rate, reset periodically.",
    q: "What is the current Missouri post-judgment interest rate?",
    body: "Missouri post-judgment interest is currently 9% — a statutory formula rate under Mo. Rev. Stat. §408.040 that resets periodically. NON-TORT (contract and all other non-tort money judgments) = 9% flat, or the contract rate if the contract bears more than 9%. TORT = Fed Funds…",
  },
  "montana-judgment-rate": {
    tagline: "Montana judgment interest — a formula rate, reset periodically.",
    q: "What is the current Montana post-judgment interest rate?",
    body: "Montana post-judgment interest is currently 9.75% — a statutory formula rate under Mont. Code Ann. § 25-9-205 that resets periodically. For a judgment involving a contractual obligation that specifies an interest rate, post-judgment interest is paid at the rate specified in the…",
  },
  "nebraska-judgment-rate": {
    tagline: "Nebraska judgment interest — a formula rate, reset each quarter.",
    q: "What is the current Nebraska post-judgment interest rate?",
    body: "Nebraska post-judgment interest is currently 5.97% — a statutory formula rate under Neb. Rev. Stat. § 45-103 that resets each quarter. Statutory rate does NOT apply where (1) the interest rate is specifically provided by other law, or (2) the action is founded on an oral or written…",
  },
  "nevada-judgment-rate": {
    tagline: "Nevada judgment interest — a formula rate, reset twice a year.",
    q: "What is the current Nevada post-judgment interest rate?",
    body: "Nevada post-judgment interest is currently 8.75% — a statutory formula rate under Nev. Rev. Stat. 17.130(2) that resets twice a year. Interest runs from time of SERVICE of the summons and complaint until satisfied, EXCEPT amounts representing FUTURE damages, which draw interest only…",
  },
  "new-hampshire-judgment-rate": {
    tagline: "New Hampshire judgment interest — a formula rate, reset each year.",
    q: "What is the current New Hampshire post-judgment interest rate?",
    body: "New Hampshire post-judgment interest is currently 5.7% — a statutory formula rate under N.H. Rev. Stat. Ann. 336:1, II that resets each year. RSA 336:1, II applies the SAME rate to \"judgments, including prejudgment interest\" — one unified statutory rate covers both; no tort/contract…",
  },
  "new-mexico-judgment-rate": {
    tagline: "New Mexico’s statutory judgment interest rate.",
    q: "What is the current New Mexico post-judgment interest rate?",
    body: "New Mexico money judgments carry a fixed statutory rate of 8.75% per year under N.M. Stat. Ann. § 56-8-4, as simple interest. If the judgment is based on tortious conduct, bad faith, or intentional or willful acts, post-judgment interest is 15% (not 8.75%); plaintiff…",
  },
  "north-dakota-judgment-rate": {
    tagline: "North Dakota judgment interest — a formula rate, reset each year.",
    q: "What is the current North Dakota post-judgment interest rate?",
    body: "North Dakota post-judgment interest is currently 10% — a statutory formula rate under N.D.C.C. § 28-20-34 that resets each year. Contract rate governs first — if the original instrument on which the action was based specifies an interest rate, judgment interest accrues at THAT…",
  },
  "oklahoma-judgment-rate": {
    tagline: "Oklahoma judgment interest — a formula rate, reset each year.",
    q: "What is the current Oklahoma post-judgment interest rate?",
    body: "Oklahoma post-judgment interest is currently 8.75% — a statutory formula rate under 12 O.S. Sec. 727.1 that resets each year. Different formulas. Postjudgment = WSJ prime + 2% (8.75% for 2026). Prejudgment = average U.S. Treasury Bill rate of the preceding calendar year,…",
  },
  "oregon-judgment-rate": {
    tagline: "Oregon’s statutory judgment interest rate.",
    q: "What is the current Oregon post-judgment interest rate?",
    body: "Oregon money judgments carry a fixed statutory rate of 9% per year under ORS 82.010(2), as simple interest. 9%/yr simple (ORS 82.010(2)(a)). Applies to money judgments; also accrues on pre-judgment interest that accrued before entry, and on attorney fees…",
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
    tagline: "Utah judgment interest — a formula rate, reset each year.",
    q: "What is the current Utah post-judgment interest rate?",
    body: "Utah post-judgment interest is currently 5.51% — a statutory formula rate under Utah Code Ann. Sec. 15-1-4 that resets each year. Contract judgments (Sec. 15-1-4(2)(a)): a judgment rendered on a lawful contract conforms to the contract and bears the interest rate agreed by the…",
  },
  "vermont-judgment-rate": {
    tagline: "Vermont’s statutory judgment interest rate.",
    q: "What is the current Vermont post-judgment interest rate?",
    body: "Vermont money judgments carry a fixed statutory rate of 12% per year under 9 V.S.A. § 41a(a), as simple interest. No pre- vs post-judgment split in the rate itself: Vermont applies the same 12% legal rate to prejudgment interest (as of right on…",
  },
  "west-virginia-judgment-rate": {
    tagline: "West Virginia judgment interest — a formula rate, reset twice a year.",
    q: "What is the current West Virginia post-judgment interest rate?",
    body: "West Virginia post-judgment interest is currently 6.25% — a statutory formula rate under W. Va. Code § 56-6-31 that resets twice a year. Formula and rate apply to both (unified by 2017 amendment eff. Jan 1, 2018) — pre-judgment keyed to the rate on Jan 2 of the year the CAUSE OF ACTION…",
  },
  "wisconsin-judgment-rate": {
    tagline: "Wisconsin judgment interest — a formula rate, reset twice a year.",
    q: "What is the current Wisconsin post-judgment interest rate?",
    body: "Wisconsin post-judgment interest is currently 7.75% — a statutory formula rate under Wis. Stat. § 815.05(8) that resets twice a year. § 815.05(8) governs POST-judgment interest (from date of entry until paid); prejudgment interest on the verdict/costs is under § 814.04(4), which…",
  },
  "wyoming-judgment-rate": {
    tagline: "Wyoming’s statutory judgment interest rate.",
    q: "What is the current Wyoming post-judgment interest rate?",
    body: "Wyoming money judgments carry a fixed statutory rate of 10% per year under Wyo. Stat. Ann. 1-16-102, as simple interest. POST-judgment only (this statute governs interest on decrees/judgments from date of rendition; prejudgment interest is a separate common-law/contract…",
  },
  "maine-judgment-rate": {
    tagline: "Maine judgment interest — a formula rate, reset each year.",
    q: "What is the current Maine post-judgment interest rate?",
    body: "Maine post-judgment interest is currently 9.51% — a statutory formula rate under 14 M.R.S. §1602-C that resets each year. Contract or note actions with an interest provision use the greater of the contract rate or the statutory Treasury-plus-6 rate; all other actions use…",
  },
  'eu-late-payment-reference': {
    tagline: 'The EU reference rate for late-payment interest.',
    q: 'What is the current EU Late Payment Directive reference rate?',
    body: `Under EU Late Payment Directive 2011/7/EU, the statutory interest rate on overdue commercial debts is
a "reference rate" plus at least 8 percentage points. The reference rate is the ECB main refinancing rate
in force on the first day of each half-year (1 January / 1 July). This page tracks that semi-annual
reference; a member state's actual statutory rate is the reference plus its national margin (the 8-point
floor in most states — for example France adds 10 points, Germany 9).`,
  },
};

export function copyFor(slug) {
  return SERIES_COPY[slug] || { tagline: '', q: `What is the current ${slug} rate?`, body: '' };
}
