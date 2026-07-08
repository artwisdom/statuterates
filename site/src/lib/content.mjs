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
