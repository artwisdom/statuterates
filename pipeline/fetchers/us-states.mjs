// US state judgment-interest rates.
//
// Two kinds of series here:
//   1. STATUTE-FIXED (CA, NY, NY-consumer, MA): the rate is a number written into the statute. These
//      are curated values, each verified against the OFFICIAL statute text (leginfo.legislature.ca.gov,
//      nysenate.gov, malegislature.gov) on the date in `VERIFIED_ON`, with the citation and carve-outs
//      recorded in notes. method='statute-fixed'. They change only when the legislature acts — the
//      MAINTENANCE_RUNBOOK schedules a quarterly re-verification.
//   2. FORMULA-DERIVED (IA): Iowa Code §668.13(3) sets judgment interest at the 1-year Treasury
//      constant maturity (Fed H.15) + 2 points, so the series derives weekly from the same H.15 data
//      the federal post-judgment series uses. method carries the statutory formula.
//
// Verification provenance (multi-agent check against official sources, 2026-07-08):
//   CA:  CCP §685.010(a)(1) 10% default; (a)(2) 5% for certain medical (<$200k) / personal (<$50k)
//        debt judgments vs natural persons entered/renewed on/after 2023-01-01 (SB 1200); 7% where
//        the debtor is a state/local government entity (Cal. Const. art. XV §1). Simple, daily, /365.
//   NY:  CPLR 5004: 9% general; 2% for consumer-debt judgments vs natural persons (eff. 2022-04-30).
//   MA:  M.G.L. c.231 §6B (tort) and §6C (contract) both 12%; contract rate displaces §6C default;
//        judgments against the commonwealth use §6I (1-yr CMT weekly avg, capped 10%).
//   IA:  Iowa Code §668.13(3): 1-yr Treasury CMT (H.15) "settled immediately prior to the date of
//        judgment" + 2 points; computed daily (§668.13(5)); contract rate governs if fixed (subsec. 2).

const VERIFIED_ON = '2026-07-08';

export const STATE_SOURCES = [
  { id: 'ca-leginfo', name: 'California Code of Civil Procedure §685.010', publisher: 'California Legislative Information (official)', home_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=685.010', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ny-senate', name: 'New York CPLR 5004', publisher: 'New York State Senate (official statute text)', home_url: 'https://www.nysenate.gov/legislation/laws/CVP/5004', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ma-legislature', name: 'Massachusetts G.L. c.231 §§6B–6C', publisher: 'Massachusetts Legislature (official)', home_url: 'https://malegislature.gov/Laws/GeneralLaws/PartIII/TitleII/Chapter231/Section6B', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ia-legis', name: 'Iowa Code §668.13', publisher: 'Iowa Legislature (official)', home_url: 'https://www.legis.iowa.gov/docs/code/668.13.pdf', license: 'Government edict — not subject to copyright.', robots_status: `formula from official text verified ${VERIFIED_ON}; values derived from Fed H.15`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
];

const FIXED = [
  {
    entity: { slug: 'california-judgment-rate', name: 'California Post-Judgment Interest Rate', entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: 'CA', statute: 'CCP §685.010', basis: 'statute-fixed' } },
    value: 10,
    effective_date: '2024-01-01', // current statutory text (as amended by Stats. 2023 ch. 131, eff. Jan 1, 2024); the 10% default long predates this
    source_id: 'ca-leginfo',
    source_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=685.010',
    notes:
      'Default rate on money judgments under CCP §685.010(a)(1); simple interest, accruing daily (/365) on unpaid principal from entry of judgment. ' +
      'Carve-outs: 5% under §685.010(a)(2) for judgments entered/renewed on or after Jan 1, 2023 against a natural person on medical debt (principal < $200,000) or personal debt (< $50,000) — SB 1200 (2022); ' +
      '7% where the judgment debtor is a state or local government entity (Cal. Const. art. XV §1). ' +
      'Effective date shown is the current statutory text (amended eff. Jan 1, 2024); the 10% default has applied since the early 1980s. Verify against the statute; not legal advice.',
  },
  {
    entity: { slug: 'new-york-judgment-rate', name: 'New York Judgment Interest Rate', entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: 'NY', statute: 'CPLR 5004(a)', basis: 'statute-fixed' } },
    value: 9,
    effective_date: '2022-04-30', // current statutory scheme (Fair Consumer Judgment Interest Act took effect); the 9% general rate long predates this
    source_id: 'ny-senate',
    source_url: 'https://www.nysenate.gov/legislation/laws/CVP/5004',
    notes:
      'General rate under CPLR 5004(a): 9% per annum "except where otherwise provided by statute". Treated as simple interest in NY practice. ' +
      'For judgments arising out of CONSUMER DEBT against a natural person the rate is 2% (see the companion consumer-debt series). ' +
      'Effective date shown is when the current statutory scheme took effect (L.2021 ch.831, eff. Apr 30, 2022); the 9% general rate long predates it. Verify against the statute; not legal advice.',
  },
  {
    entity: { slug: 'new-york-consumer-debt-judgment-rate', name: 'New York Consumer-Debt Judgment Interest Rate', entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: 'NY', statute: 'CPLR 5004(b)', basis: 'statute-fixed' } },
    value: 2,
    effective_date: '2022-04-30',
    source_id: 'ny-senate',
    source_url: 'https://www.nysenate.gov/legislation/laws/CVP/5004',
    notes:
      'CPLR 5004 as amended by the Fair Consumer Judgment Interest Act (L.2021 ch.831, eff. Apr 30, 2022): 2% per annum where a natural person is a defendant in an action arising out of consumer debt ' +
      '(obligations from transactions primarily for personal, family or household purposes). Also applies from Apr 30, 2022 forward to the unpaid portion of earlier consumer-debt judgments. Verify against the statute; not legal advice.',
  },
  {
    entity: { slug: 'massachusetts-judgment-rate', name: 'Massachusetts Judgment Interest Rate', entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: 'MA', statute: 'M.G.L. c.231 §§6B–6C', basis: 'statute-fixed' } },
    value: 12,
    effective_date: VERIFIED_ON, // official pages show no amendment dates; rate stable since the early 1980s — see notes
    source_id: 'ma-legislature',
    source_url: 'https://malegislature.gov/Laws/GeneralLaws/PartIII/TitleII/Chapter231/Section6B',
    notes:
      '12% per annum under both M.G.L. c.231 §6B (tort; from commencement of the action) and §6C (contract; from breach/demand, or commencement if not established). Applied as simple interest in MA practice. ' +
      'Carve-outs: an established contract rate displaces the §6C default; judgments against the commonwealth bear interest per §6I (weekly-average 1-yr Treasury CMT, capped at 10%). ' +
      `The official statute pages show no amendment history; the 12% figure has been stable since the early 1980s. Date shown is when the current text was verified (${VERIFIED_ON}). Verify against the statute; not legal advice.`,
  },
];

// ---- Expansion batch: 14 states, each verified 2026-07-09 against its official statute/agency source
// (multi-agent verification pass). Fixed-by-statute = high confidence; variable/agency-set current
// values = medium confidence + method 'statute-variable' (re-verified on the runbook schedule).
const EXP_VERIFIED_ON = '2026-07-09';
const STATES_2 = [
  { code: 'TX', name: 'Texas', slug: 'texas-judgment-rate', value: 6.75, kind: 'variable', asof: '2026-07-01',
    statute: 'Tex. Fin. Code §304.003', srcId: 'tx-occc', srcName: 'Texas post-judgment interest rate (Fin. Code §304.003)',
    publisher: 'Texas Office of Consumer Credit Commissioner (official)', url: 'https://occc.texas.gov/publications/interest-rates/',
    notes: 'Post-judgment interest on money judgments not on an interest-bearing contract, under Tex. Fin. Code §304.003: the Federal Reserve prime rate with a 5% floor and 15% cap — currently 6.75% (July 2026, published by the Texas OCCC). The rate is fixed at entry for the life of the judgment and COMPOUNDS ANNUALLY (§304.006). Judgments on a contract that sets interest instead use §304.002 (lesser of the contract rate or 18%). Verify the current period at occc.texas.gov; not legal advice.' },
  { code: 'FL', name: 'Florida', slug: 'florida-judgment-rate', value: 8.06, kind: 'variable', asof: '2026-07-01',
    statute: 'Fla. Stat. §55.03', srcId: 'fl-cfo', srcName: 'Florida judgment interest rate (Fla. Stat. §55.03)',
    publisher: 'Florida Chief Financial Officer (official)', url: 'https://myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates',
    notes: 'Post-judgment interest on judgments and decrees, set quarterly by the Florida Chief Financial Officer under Fla. Stat. §55.03 (12-month average of the New York Fed discount/primary-credit rate + 4 percentage points) — currently 8.06% for the quarter beginning July 1, 2026. Simple interest; a judgment’s rate re-adjusts each January 1 to the then-current CFO rate (§55.03(3)). Verify the current quarter at myfloridacfo.com; not legal advice.' },
  { code: 'GA', name: 'Georgia', slug: 'georgia-judgment-rate', value: 9.75, kind: 'variable', asof: '2026-07-08',
    statute: 'O.C.G.A. §7-4-12', srcId: 'ga-code', srcName: 'Georgia judgment interest (O.C.G.A. §7-4-12)',
    publisher: 'Official Code of Georgia Annotated', url: 'http://ga.elaws.us/law/section7-4-12',
    notes: 'Post-judgment interest under O.C.G.A. §7-4-12: the Federal Reserve prime rate (published in Fed release H.15) on the day of judgment + 3 percentage points, fixed for the life of the judgment — currently about 9.75% (prime ~6.75% + 3). Simple interest. A judgment on a written contract that specifies a rate carries the contract rate instead (§7-4-12(b)). Verify against the current prime rate; not legal advice.' },
  { code: 'PA', name: 'Pennsylvania', slug: 'pennsylvania-judgment-rate', value: 6, kind: 'fixed', asof: EXP_VERIFIED_ON,
    statute: '42 Pa.C.S. §8101 / 41 P.S. §202', srcId: 'pa-statutes', srcName: 'Pennsylvania judgment interest (42 Pa.C.S. §8101; 41 P.S. §202)',
    publisher: 'Pennsylvania General Assembly (official)', url: 'https://www.legis.state.pa.us/WU01/LI/LI/CT/HTM/42/00.081.001.000..HTM',
    notes: 'Post-judgment interest at Pennsylvania’s legal rate of 6% per annum — 42 Pa.C.S. §8101 sets judgment interest at "the lawful rate," which 41 P.S. §202 fixes at 6%. Simple interest; written into statute and unchanged for decades. A contract judgment can carry a higher lawful contract rate if the documents set one. Verify against the statute; not legal advice.' },
  { code: 'OH', name: 'Ohio', slug: 'ohio-judgment-rate', value: 7, kind: 'variable', asof: '2026-01-01',
    statute: 'Ohio Rev. Code §1343.03(B) / §5703.47', srcId: 'oh-tax', srcName: 'Ohio judgment interest (R.C. §1343.03 / §5703.47)',
    publisher: 'Ohio Department of Taxation (official)', url: 'https://tax.ohio.gov/individual/resources/annual-interest-rates',
    notes: 'Post-judgment interest under Ohio Rev. Code §1343.03(B), at the rate the Ohio Tax Commissioner sets annually under §5703.47 (the federal short-term rate for the year, rounded, + 3 percentage points) — currently 7% for 2026. Simple interest. A written contract specifying a different rate controls (§1343.03(A)). Verify the current year at tax.ohio.gov; not legal advice.' },
  { code: 'IL', name: 'Illinois', slug: 'illinois-judgment-rate', value: 9, kind: 'fixed', asof: '2021-07-01',
    statute: '735 ILCS 5/2-1303', srcId: 'il-ilcs', srcName: 'Illinois judgment interest (735 ILCS 5/2-1303)',
    publisher: 'Illinois General Assembly (official)', url: 'https://www.ilga.gov/legislation/ilcs/fulltext?DocName=073500050K2-1303',
    notes: 'Post-judgment interest at 9% per annum under 735 ILCS 5/2-1303 for general judgments — fixed by statute, computed as simple interest on the unsatisfied portion of the judgment. Carve-out: 6% per annum where the judgment debtor is a unit of local government. Verify against the statute; not legal advice.' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina-judgment-rate', value: 8, kind: 'fixed', asof: '2016-12-01',
    statute: 'N.C.G.S. §24-5 / §24-1', srcId: 'nc-ncleg', srcName: 'North Carolina judgment interest (N.C.G.S. §24-5 / §24-1)',
    publisher: 'North Carolina General Assembly (official)', url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_24/GS_24-5.html',
    notes: 'Post-judgment interest at North Carolina’s legal rate of 8% per annum — N.C.G.S. §24-5 pegs judgment interest to the §24-1 legal rate (8%), or the contract rate for judgments on a contract. Fixed by statute; simple interest. Verify against the statute; not legal advice.' },
  { code: 'MI', name: 'Michigan', slug: 'michigan-judgment-rate', value: 4.725, kind: 'variable', asof: '2026-01-01',
    statute: 'MCL §600.6013', srcId: 'mi-legislature', srcName: 'Michigan judgment interest (MCL §600.6013)',
    publisher: 'Michigan Legislature (official)', url: 'https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-6013',
    notes: 'Post-judgment interest under MCL §600.6013 (Michigan’s judgment interest runs from the filing of the complaint): the general rate is 1 percentage point above the six-month average of 5-year U.S. Treasury note auctions, certified by the State Treasurer and reset each January 1 and July 1, COMPOUNDED ANNUALLY — currently 4.725% (period beginning Jan 1, 2026). Judgments on a written instrument use a separate rate (the instrument’s rate, capped at 13%). Verify the current period at legislature.mi.gov; not legal advice.' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey-judgment-rate', value: 4.5, value_text: '4.5% / 6.5%', kind: 'variable', asof: '2026-01-01',
    statute: 'N.J. Court Rule R. 4:42-11', srcId: 'nj-courts', srcName: 'New Jersey post-judgment interest (R. 4:42-11)',
    publisher: 'New Jersey Courts (official)', url: 'https://www.njcourts.gov/notices/notice-post-judgment-interest-rate-calendar-year-2026-rule-442-11',
    notes: 'Post-judgment interest set annually by the New Jersey Judiciary under Court Rule R. 4:42-11: a base rate tied to the State Cash Management Fund’s prior-year return — for 2026, 4.5% on judgments up to $20,000, and 6.5% (base + 2%) on judgments over $20,000. Simple interest. Verify the current year’s Notice to the Bar at njcourts.gov; not legal advice.' },
  { code: 'VA', name: 'Virginia', slug: 'virginia-judgment-rate', value: 6, kind: 'fixed', asof: EXP_VERIFIED_ON,
    statute: 'Va. Code §6.2-302 / §8.01-382', srcId: 'va-code', srcName: 'Virginia judgment interest (Va. Code §6.2-302)',
    publisher: 'Virginia General Assembly (official)', url: 'https://law.lis.virginia.gov/vacode/title6.2/chapter3/section6.2-302/',
    notes: 'Post-judgment interest at Virginia’s judgment rate of 6% per annum — Va. Code §6.2-302 (with §8.01-382) fixes 6% for judgments that do not specify a rate. Simple interest. A judgment on a contract carries the higher of the lawful contract rate or 6%. Verify against the statute; not legal advice.' },
  { code: 'WA', name: 'Washington', slug: 'washington-judgment-rate', value: 8.75, kind: 'variable', asof: '2026-07-08',
    statute: 'RCW 4.56.110', srcId: 'wa-rcw', srcName: 'Washington post-judgment interest (RCW 4.56.110)',
    publisher: 'Washington State Legislature (official)', url: 'https://app.leg.wa.gov/rcw/default.aspx?cite=4.56.110',
    notes: 'Post-judgment interest under RCW 4.56.110 (amended 2019): judgments on a written contract carry the contract’s rate; tort judgments and the general catch-all carry a rate tied to the federal prime rate (Fed H.15) — currently about 8.75%. Simple interest. Verify the current rate at app.leg.wa.gov and the Fed H.15 prime; not legal advice.' },
  { code: 'AZ', name: 'Arizona', slug: 'arizona-judgment-rate', value: 7.75, kind: 'variable', asof: '2026-07-08',
    statute: 'A.R.S. §44-1201(B)', srcId: 'az-ars', srcName: 'Arizona judgment interest (A.R.S. §44-1201)',
    publisher: 'Arizona State Legislature (official)', url: 'https://www.azleg.gov/ars/44/01201.htm',
    notes: 'Post-judgment interest under A.R.S. §44-1201(B): the lesser of 10% per annum or the Federal Reserve prime rate (Fed H.15) + 1 percentage point — currently 7.75% (prime ~6.75% + 1). Simple interest. A written agreement may set a different rate. Verify against the current prime rate; not legal advice.' },
  { code: 'CO', name: 'Colorado', slug: 'colorado-judgment-rate', value: 8, kind: 'fixed', asof: '2026-01-01',
    statute: 'C.R.S. §5-12-102(4)(b)', srcId: 'co-sos', srcName: 'Colorado judgment interest (C.R.S. §5-12-102 / §13-21-101)',
    publisher: 'Colorado Secretary of State (official rate certification)', url: 'https://www.coloradosos.gov/pubs/info_center/files/interest_rates.pdf',
    notes: 'Post-judgment interest under C.R.S. §5-12-102(4)(b): 8% per annum COMPOUNDED ANNUALLY on general money judgments absent a contract rate. Personal-injury/tort judgments use a separate rate under §13-21-101, and appealed money judgments a variable rate under §5-12-106 (certified each January 1 by the Colorado Secretary of State). Verify the current variable rates at coloradosos.gov; not legal advice.' },
  { code: 'TN', name: 'Tennessee', slug: 'tennessee-judgment-rate', value: 8.75, kind: 'variable', asof: '2026-07-01',
    statute: 'Tenn. Code §47-14-121', srcId: 'tn-courts', srcName: 'Tennessee post-judgment interest (Tenn. Code §47-14-121)',
    publisher: 'Tennessee Courts / Dept. of Financial Institutions (official)', url: 'https://www.tncourts.gov/tennessee-judgment-interest-rates',
    notes: 'Post-judgment interest under Tenn. Code §47-14-121: the "formula rate" (the weekly-average prime loan rate published by the Fed, announced by the TN Commissioner of Financial Institutions) minus 2 percentage points, fixed at judgment — currently 8.75% (judgments entered in the quarter beginning July 1, 2026). Simple interest. Verify the current rate at tncourts.gov; not legal advice.' },
];

for (const st of STATES_2) {
  STATE_SOURCES.push({
    id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url,
    license: 'Government edict — not subject to copyright.',
    robots_status: `curated ${st.kind} value; official source verified ${EXP_VERIFIED_ON}`,
    retrieved_at: `${EXP_VERIFIED_ON}T00:00:00Z`,
  });
  FIXED.push({
    entity: { slug: st.slug, name: `${st.name} Judgment Interest Rate`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: st.code, statute: st.statute, basis: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable' } },
    value: st.value,
    value_text: st.value_text || `${st.value}%`,
    effective_date: st.asof,
    source_id: st.srcId,
    source_url: st.url,
    confidence: st.kind === 'fixed' ? 'high' : 'medium',
    method: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable',
    notes: st.notes,
  });
}


// ---- Expansion batch 3: remaining states + DC, each verified 2026-07-09 against its official
// statute/agency source (multi-agent pass). Fixed = high confidence; variable/agency-set = medium.
const STATES_3 = [
  { code: "AL", name: "Alabama", slug: "alabama-judgment-rate", value: 7.5, value_text: "7.5%", kind: "fixed", asof: "2026-07-09", statute: "Ala. Code § 8-8-10(a)", srcId: "al-jud", srcName: "Alabama judgment interest (Ala. Code § 8-8-10(a))", publisher: "Alabama — alison.legislature.state.al.us", url: "https://alison.legislature.state.al.us/code-of-alabama?section=8-8-10",
    notes: "Post-judgment interest under Ala. Code § 8-8-10(a) — 7.5% per year, fixed by statute (simple interest). For a judgment \"based upon a contract action,\" interest runs \"at the same rate of interest as stated in the contract\" (the contract rate governs, not… Verify against the statute; not legal advice." },
  { code: "AK", name: "Alaska", slug: "alaska-judgment-rate", value: 6.75, value_text: "6.75%", kind: "variable", asof: "2026-01-01", statute: "Alaska Stat. 09.30.070(a)", srcId: "ak-jud", srcName: "Alaska judgment interest (Alaska Stat. 09.30.070(a))", publisher: "Alaska — public.courts.alaska.gov", url: "https://public.courts.alaska.gov/web/forms/docs/adm-505.pdf",
    notes: "Post-judgment interest under Alaska Stat. 09.30.070(a), currently 6.75% (as of January 1, 2026). Three (3) percentage points above the 12th Federal Reserve District discount rate in effect on January 2 of the year in which the judgment or decree is entered. The 12th FRD… Simple interest. A judgment founded on a written contract that specifies an interest rate (not exceeding the legal maximum) bears the contract rate if that rate is… Verify the current value at public.courts.alaska.gov; not legal advice." },
  { code: "AR", name: "Arkansas", slug: "arkansas-judgment-rate", value: 5.75, value_text: "5.75%", kind: "variable", asof: "2026-07-08", statute: "Ark. Code Ann. § 16-65-114(a)", srcId: "ar-jud", srcName: "Arkansas judgment interest (Ark. Code Ann. § 16-65-114(a))", publisher: "Arkansas — federalreserve.gov", url: "https://www.federalreserve.gov/releases/h15/",
    notes: "Post-judgment interest under Ark. Code Ann. § 16-65-114(a), currently 5.75% (as of July 8, 2026). Judgment interest rate = Federal Reserve primary credit rate (discount window primary credit rate) in effect on the date the judgment is entered + 2%. The primary credit rate… Simple interest. The old fixed 10% (or contract rate, whichever greater) was replaced by Act 995 of 2019 (effective 7/24/2019) with the current… Verify the current value at federalreserve.gov; not legal advice." },
  { code: "CT", name: "Connecticut", slug: "connecticut-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-01-01", statute: "Conn. Gen. Stat. §37-3a", srcId: "ct-jud", srcName: "Connecticut judgment interest (Conn. Gen. Stat. §37-3a)", publisher: "Connecticut — cga.ct.gov", url: "https://www.cga.ct.gov/current/pub/chap_673.htm",
    notes: "Post-judgment interest under Conn. Gen. Stat. §37-3a — 10% per year, fixed by statute (simple interest). §37-3a covers both prejudgment and postjudgment interest as damages for detention of money; §37-3b postjudgment interest runs from the earlier of 20… Verify against the statute; not legal advice." },
  { code: "DE", name: "Delaware", slug: "delaware-judgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", asof: "2026-07-08", statute: "6 Del. C. § 2301", srcId: "de-jud", srcName: "Delaware judgment interest (6 Del. C. § 2301)", publisher: "Delaware — delcode.delaware.gov", url: "https://delcode.delaware.gov/title6/c023/",
    notes: "Post-judgment interest under 6 Del. C. § 2301, currently 8.75% (as of July 8, 2026). Legal/post-judgment rate = Federal Reserve discount rate (in practice the Fed's \"primary credit rate,\" which replaced the old adjustment-credit discount rate in Jan 2003) + 5… Simple interest. Both pre-judgment and post-judgment interest use the same legal rate (5% over the discount rate). Per the official Delaware Courts guidance, the… Verify the current value at delcode.delaware.gov; not legal advice." },
  { code: "DC", name: "District of Columbia", slug: "dc-judgment-rate", value: 5, value_text: "5%", kind: "variable", asof: "2026-04-01", statute: "D.C. Code § 28-3302(c)", srcId: "dc-jud", srcName: "District of Columbia judgment interest (D.C. Code § 28-3302(c))", publisher: "District of Columbia — code.dccouncil.gov", url: "https://code.dccouncil.gov/us/dc/council/code/sections/28-3302",
    notes: "Post-judgment interest under D.C. Code § 28-3302(c), currently 5% (as of April 1, 2026). . Rate = 70% of the rate set by the U.S. Secretary of the Treasury under IRC section 6621 (26 U.S.C. § 6621) for underpayments of tax, rounded to the nearest full percent (if… Simple interest. Judgments/decrees against the District of Columbia, its officers, or employees acting within scope of employment bear interest \"not exceeding 4% per… Verify the current value at code.dccouncil.gov; not legal advice." },
  { code: "HI", name: "Hawaii", slug: "hawaii-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Haw. Rev. Stat. 478-3. Related: 478-2", srcId: "hi-jud", srcName: "Hawaii judgment interest (Haw. Rev. Stat. 478-3. Related: 478-2)", publisher: "Hawaii — capitol.hawaii.gov", url: "https://www.capitol.hawaii.gov/hrscurrent/Vol11_Ch0476-0490/HRS0478/HRS_0478-0003.htm",
    notes: "Post-judgment interest under Haw. Rev. Stat. 478-3. Related: 478-2 — 10% per year, fixed by statute (simple interest). 478-3 governs POST-judgment interest on any civil judgment at a flat 10%. PREJUDGMENT interest is separate — HRS 636-16 lets the judge designate the… Verify against the statute; not legal advice." },
  { code: "ID", name: "Idaho", slug: "idaho-judgment-rate", value: 8.875, value_text: "8.875%", kind: "variable", asof: "2026-07-01", statute: "Idaho Code § 28-22-104(2)", srcId: "id-jud", srcName: "Idaho judgment interest (Idaho Code § 28-22-104(2))", publisher: "Idaho — sto.idaho.gov", url: "https://sto.idaho.gov/Banking/Legal-Rate-of-Interest",
    notes: "Post-judgment interest under Idaho Code § 28-22-104(2), currently 8.875% (as of July 1, 2026). Judgment rate = 5% + base rate in effect at time of entry of judgment. Base rate = weekly average yield on U.S. Treasury securities adjusted to a constant maturity of one (1)… Simple interest. § 28-22-104(2) applies \"unless the judgment is rendered on a written contract or agreement providing for a different rate of interest, in which case… Verify the current value at sto.idaho.gov; not legal advice." },
  { code: "IN", name: "Indiana", slug: "indiana-judgment-rate", value: 8, value_text: "8%", kind: "fixed", asof: "2026-01-01", statute: "Ind. Code § 24-4.6-1-101", srcId: "in-jud", srcName: "Indiana judgment interest (Ind. Code § 24-4.6-1-101)", publisher: "Indiana — iga.in.gov", url: "https://iga.in.gov/laws/2025/ic/titles/24",
    notes: "Post-judgment interest under Ind. Code § 24-4.6-1-101 — 8% per year, fixed by statute (simple interest). This 8% is POST-judgment (from verdict/finding to satisfaction). Prejudgment interest is separate — under the Tort Prejudgment Interest Statute, Ind.… Verify against the statute; not legal advice." },
  { code: "KS", name: "Kansas", slug: "kansas-judgment-rate", value: 7.75, value_text: "7.75%", kind: "variable", asof: "2026-07-01", statute: "Kan. Stat. Ann. 16-204", srcId: "ks-jud", srcName: "Kansas judgment interest (Kan. Stat. Ann. 16-204)", publisher: "Kansas — sos.ks.gov", url: "https://sos.ks.gov/general-services/finance-rates.html",
    notes: "Post-judgment interest under Kan. Stat. Ann. 16-204, currently 7.75% (as of July 1, 2026). . Formula = New York Federal Reserve Bank discount rate (charge on loans to depository institutions, as reported in the \"Money Rates\" column of the Wall Street Journal) as of… Simple interest. This 16-204 rate is POST-judgment. Prejudgment interest is governed separately by K.S.A. 16-201 (10% per annum when no other rate agreed). CONTRACT:… Verify the current value at sos.ks.gov; not legal advice." },
  { code: "KY", name: "Kentucky", slug: "kentucky-judgment-rate", value: 6, value_text: "6%", kind: "fixed", asof: "2026-07-09", statute: "KRS 360.040", srcId: "ky-jud", srcName: "Kentucky judgment interest (KRS 360.040)", publisher: "Kentucky — apps.legislature.ky.gov", url: "https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=45719",
    notes: "Post-judgment interest under KRS 360.040 — 6% per year, fixed by statute, compounded annually. Default (tort/general/unpaid money judgments, and prejudgment interest once reduced to judgment): 6% compounded annually [KRS 360.040(1)]. CHILD… Verify against the statute; not legal advice." },
  { code: "LA", name: "Louisiana", slug: "louisiana-judgment-rate", value: 7.5, value_text: "7.5%", kind: "variable", asof: "2026-01-01", statute: "La. R.S. 13:4202(B)", srcId: "la-jud", srcName: "Louisiana judgment interest (La. R.S. 13:4202(B))", publisher: "Louisiana — ofi.la.gov", url: "https://ofi.la.gov/legal/statutes-rules-policies-opinions/judicial-interest-rates/",
    notes: "Post-judgment interest under La. R.S. 13:4202(B), currently 7.5% (as of January 1, 2026). . Formula: Federal Reserve Board of Governors approved \"discount rate\" (published daily in the Wall Street Journal), ascertained by the Commissioner on the first business day… Simple interest. Louisiana uses one unified \"judicial interest\" (= \"legal interest\") rate; La. R.S. 13:4203 provides interest attaches from the date of judicial… Verify the current value at ofi.la.gov; not legal advice." },
  { code: "MD", name: "Maryland", slug: "maryland-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Md. Code, Courts & Judicial Proceedings Section 11-107(a)", srcId: "md-jud", srcName: "Maryland judgment interest (Md. Code, Courts & Judicial Proceedings Section 11-107(a))", publisher: "Maryland — mgaleg.maryland.gov", url: "https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gcj&section=11-107",
    notes: "Post-judgment interest under Md. Code, Courts & Judicial Proceedings Section 11-107(a) — 10% per year, fixed by statute (simple interest). Under the \"except as provided in Section 11-106\" clause, a money judgment on a contract for a loan of money carries interest at the RATE CHARGED IN… Verify against the statute; not legal advice." },
  { code: "MN", name: "Minnesota", slug: "minnesota-judgment-rate", value: 4, value_text: "4% / 10%", kind: "variable", asof: "2026-01-01", statute: "Minn. Stat. § 549.09, subd. 1(c)", srcId: "mn-jud", srcName: "Minnesota judgment interest (Minn. Stat. § 549.09, subd. 1(c))", publisher: "Minnesota — revisor.mn.gov", url: "https://www.revisor.mn.gov/court_rules/rule/msinte/",
    notes: "Post-judgment interest under Minn. Stat. § 549.09, subd. 1(c), currently 4% / 10% (as of January 1, 2026). , set annually by the Minnesota State Court Administrator by December 20 for the succeeding calendar year. Rate = the secondary market yield / one-year constant maturity… Simple interest. Standard variable Treasury-indexed rate (4% floor) applies to judgments/awards of $50,000 or less, and to ALL judgments/awards for or against the… Verify the current value at revisor.mn.gov; not legal advice." },
  { code: "MO", name: "Missouri", slug: "missouri-judgment-rate", value: 9, value_text: "9%", kind: "variable", asof: "2026-07-09", statute: "Mo. Rev. Stat. §408.040", srcId: "mo-jud", srcName: "Missouri judgment interest (Mo. Rev. Stat. §408.040)", publisher: "Missouri — revisor.mo.gov", url: "https://revisor.mo.gov/main/OneSection.aspx?section=408.040",
    notes: "Post-judgment interest under Mo. Rev. Stat. §408.040, currently 9% (as of July 9, 2026). 040: - NON-TORT judgments: fixed by statute at 9% per annum; but \"judgments and orders for money upon contracts bearing more than nine percent interest shall bear the same… Simple interest. NON-TORT (contract and all other non-tort money judgments) = 9% flat, or the contract rate if the contract bears more than 9%. TORT = Fed Funds… Verify the current value at revisor.mo.gov; not legal advice." },
  { code: "MT", name: "Montana", slug: "montana-judgment-rate", value: 9.75, value_text: "9.75%", kind: "variable", asof: "2026-01-01", statute: "Mont. Code Ann. § 25-9-205", srcId: "mt-jud", srcName: "Montana judgment interest (Mont. Code Ann. § 25-9-205)", publisher: "Montana — mca.legmt.gov", url: "https://mca.legmt.gov/bills/mca/title_0250/chapter_0090/part_0020/section_0050/0250-0090-0020-0050.html",
    notes: "Post-judgment interest under Mont. Code Ann. § 25-9-205, currently 9.75% (as of January 1, 2026). Rate = (bank prime loan rate published in the Federal Reserve System's H.15 \"Selected Interest Rates\" release, or any superseding publication, on the day judgment is entered)… Simple interest. For a judgment involving a contractual obligation that specifies an interest rate, post-judgment interest is paid at the rate specified in the… Verify the current value at mca.legmt.gov; not legal advice." },
  { code: "NE", name: "Nebraska", slug: "nebraska-judgment-rate", value: 5.97, value_text: "5.97%", kind: "variable", asof: "2026-07-16", statute: "Neb. Rev. Stat. § 45-103", srcId: "ne-jud", srcName: "Nebraska judgment interest (Neb. Rev. Stat. § 45-103)", publisher: "Nebraska — nebraskajudicial.gov", url: "https://nebraskajudicial.gov/rules/administrative-policies-schedules/judgment-interest-rate",
    notes: "Post-judgment interest under Neb. Rev. Stat. § 45-103, currently 5.97% (as of July 16, 2026). Rate = (bond investment yield of the average accepted auction price for the first auction of each annual quarter of the 26-week U.S. Treasury bill, as published by the U.S.… Simple interest. Statutory rate does NOT apply where (1) the interest rate is specifically provided by other law, or (2) the action is founded on an oral or written… Verify the current value at nebraskajudicial.gov; not legal advice." },
  { code: "NV", name: "Nevada", slug: "nevada-judgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", asof: "2026-07-01", statute: "Nev. Rev. Stat. 17.130(2)", srcId: "nv-jud", srcName: "Nevada judgment interest (Nev. Rev. Stat. 17.130(2))", publisher: "Nevada — fid.nv.gov", url: "https://fid.nv.gov/uploadedFiles/fidnvgov/content/Resources/Prime%20Interest%20Rate%20July%201,%202026.pdf",
    notes: "Post-judgment interest under Nev. Rev. Stat. 17.130(2), currently 8.75% (as of July 1, 2026). Post-judgment rate = (prime rate at the largest bank in Nevada as ascertained by the Commissioner of Financial Institutions on the Jan 1 or Jul 1 immediately preceding the… Simple interest. Interest runs from time of SERVICE of the summons and complaint until satisfied, EXCEPT amounts representing FUTURE damages, which draw interest only… Verify the current value at fid.nv.gov; not legal advice." },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire-judgment-rate", value: 5.7, value_text: "5.7%", kind: "variable", asof: "2026-01-01", statute: "N.H. Rev. Stat. Ann. 336:1, II", srcId: "nh-jud", srcName: "New Hampshire judgment interest (N.H. Rev. Stat. Ann. 336:1, II)", publisher: "New Hampshire — courts.nh.gov", url: "https://www.courts.nh.gov/our-courts/superior-court/civil/civil-interest-rates",
    notes: "Post-judgment interest under N.H. Rev. Stat. Ann. 336:1, II, currently 5.7% (as of January 1, 2026). , reset annually. Formula (RSA 336:1, II): prevailing discount rate on 26-week U.S. Treasury bills at the last auction preceding the last day of September of the prior year,… Simple interest. RSA 336:1, II applies the SAME rate to \"judgments, including prejudgment interest\" — one unified statutory rate covers both; no tort/contract… Verify the current value at courts.nh.gov; not legal advice." },
  { code: "NM", name: "New Mexico", slug: "new-mexico-judgment-rate", value: 8.75, value_text: "8.75%", kind: "fixed", asof: "2026-07-09", statute: "N.M. Stat. Ann. § 56-8-4", srcId: "nm-jud", srcName: "New Mexico judgment interest (N.M. Stat. Ann. § 56-8-4)", publisher: "New Mexico — law.justia.com", url: "https://law.justia.com/codes/new-mexico/chapter-56/article-8/section-56-8-4/",
    notes: "Post-judgment interest under N.M. Stat. Ann. § 56-8-4 — 8.75% per year, fixed by statute (simple interest). If the judgment is based on tortious conduct, bad faith, or intentional or willful acts, post-judgment interest is 15% (not 8.75%); plaintiff… Verify against the statute; not legal advice." },
  { code: "ND", name: "North Dakota", slug: "north-dakota-judgment-rate", value: 10, value_text: "10%", kind: "variable", asof: "2026-01-01", statute: "N.D.C.C. § 28-20-34", srcId: "nd-jud", srcName: "North Dakota judgment interest (N.D.C.C. § 28-20-34)", publisher: "North Dakota — ndcourts.gov", url: "https://www.ndcourts.gov/state-court-administration/interest-rate-on-judgments",
    notes: "Post-judgment interest under N.D.C.C. § 28-20-34, currently 10% (as of January 1, 2026). , reset annually. Rate = (U.S. prime rate as published/reported in the Wall Street Journal on the first Monday in December of the prior year) + 3 percentage points, then… Simple interest. Contract rate governs first — if the original instrument on which the action was based specifies an interest rate, judgment interest accrues at THAT… Verify the current value at ndcourts.gov; not legal advice." },
  { code: "OK", name: "Oklahoma", slug: "oklahoma-judgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", asof: "2026-01-01", statute: "12 O.S. Sec. 727.1", srcId: "ok-jud", srcName: "Oklahoma judgment interest (12 O.S. Sec. 727.1)", publisher: "Oklahoma — oscn.net", url: "https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=551111",
    notes: "Post-judgment interest under 12 O.S. Sec. 727.1, currently 8.75% (as of January 1, 2026). . Postjudgment rate = the prime rate as listed in the FIRST edition of the Wall Street Journal published for the calendar year, certified to the Administrative Director of… Simple interest. Different formulas. Postjudgment = WSJ prime + 2% (8.75% for 2026). Prejudgment = average U.S. Treasury Bill rate of the preceding calendar year,… Verify the current value at oscn.net; not legal advice." },
  { code: "OR", name: "Oregon", slug: "oregon-judgment-rate", value: 9, value_text: "9%", kind: "fixed", asof: "2026-07-09", statute: "ORS 82.010(2)", srcId: "or-jud", srcName: "Oregon judgment interest (ORS 82.010(2))", publisher: "Oregon — oregonlegislature.gov", url: "https://www.oregonlegislature.gov/bills_laws/ors/ors082.html",
    notes: "Post-judgment interest under ORS 82.010(2) — 9% per year, fixed by statute (simple interest). 9%/yr simple (ORS 82.010(2)(a)). Applies to money judgments; also accrues on pre-judgment interest that accrued before entry, and on attorney fees… Verify against the statute; not legal advice." },
  { code: "RI", name: "Rhode Island", slug: "rhode-island-judgment-rate", value: 12, value_text: "12%", kind: "fixed", asof: "2026-07-09", statute: "R.I. Gen. Laws § 9-21-10", srcId: "ri-jud", srcName: "Rhode Island judgment interest (R.I. Gen. Laws § 9-21-10)", publisher: "Rhode Island — webserver.rilegislature.gov", url: "https://webserver.rilegislature.gov/Statutes/TITLE9/9-21/9-21-10.HTM",
    notes: "Post-judgment interest under R.I. Gen. Laws § 9-21-10 — 12% per year, fixed by statute (simple interest). Carve-outs affect scope/accrual date, not the rate. (1) Pre- vs post-judgment: § 9-21-10(a) provides prejudgment interest at 12% from the date the… Verify against the statute; not legal advice." },
  { code: "SC", name: "South Carolina", slug: "south-carolina-judgment-rate", value: 10.75, value_text: "10.75%", kind: "variable", asof: "2026-01-15", statute: "S.C. Code Ann. § 34-31-20(B)", srcId: "sc-jud", srcName: "South Carolina judgment interest (S.C. Code Ann. § 34-31-20(B))", publisher: "South Carolina — scstatehouse.gov", url: "https://www.scstatehouse.gov/code/t34c031.php",
    notes: "Post-judgment interest under S.C. Code Ann. § 34-31-20(B), currently 10.75% (as of January 15, 2026). Legal rate = (prime rate as listed in the first edition of the Wall Street Journal published for the calendar year for which damages are awarded) + 4 percentage points,… Compounded annually. This is the rate on money decrees and judgments under § 34-31-20(B), applicable to all judgments entered on or after July 1, 2005. TRANSITIONAL: for… Verify the current value at scstatehouse.gov; not legal advice." },
  { code: "SD", name: "South Dakota", slug: "south-dakota-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "SDCL § 54-3-5.1", srcId: "sd-jud", srcName: "South Dakota judgment interest (SDCL § 54-3-5.1)", publisher: "South Dakota — sdlegislature.gov", url: "https://sdlegislature.gov/Statutes/54-3-5.1",
    notes: "Post-judgment interest under SDCL § 54-3-5.1 — 10% per year, fixed by statute (simple interest). Post-judgment default is Category B = 10% under SDCL 54-3-5.1. EXCLUSIONS from that section (these are NOT at the flat Category B judgment rate): (1)… Verify against the statute; not legal advice." },
  { code: "UT", name: "Utah", slug: "utah-judgment-rate", value: 5.51, value_text: "5.51%", kind: "variable", asof: "2026-01-01", statute: "Utah Code Ann. Sec. 15-1-4", srcId: "ut-jud", srcName: "Utah judgment interest (Utah Code Ann. Sec. 15-1-4)", publisher: "Utah — utcourts.gov", url: "https://www.utcourts.gov/en/court-records-publications/resources/interest-rates/interestrates.html",
    notes: "Post-judgment interest under Utah Code Ann. Sec. 15-1-4, currently 5.51% (as of January 1, 2026). (federal postjudgment interest rate as of January 1 of the year the judgment is entered) + 2%. The \"federal postjudgment interest rate\" is defined by Sec. 15-1-4(1) as the… Simple interest. Contract judgments (Sec. 15-1-4(2)(a)): a judgment rendered on a lawful contract conforms to the contract and bears the interest rate agreed by the… Verify the current value at utcourts.gov; not legal advice." },
  { code: "VT", name: "Vermont", slug: "vermont-judgment-rate", value: 12, value_text: "12%", kind: "fixed", asof: "2026-07-09", statute: "9 V.S.A. § 41a(a)", srcId: "vt-jud", srcName: "Vermont judgment interest (9 V.S.A. § 41a(a))", publisher: "Vermont — legislature.vermont.gov", url: "https://legislature.vermont.gov/statutes/section/09/004/00041a",
    notes: "Post-judgment interest under 9 V.S.A. § 41a(a) — 12% per year, fixed by statute (simple interest). No pre- vs post-judgment split in the rate itself: Vermont applies the same 12% legal rate to prejudgment interest (as of right on… Verify against the statute; not legal advice." },
  { code: "WV", name: "West Virginia", slug: "west-virginia-judgment-rate", value: 6.25, value_text: "6.25%", kind: "variable", asof: "2026-01-01", statute: "W. Va. Code § 56-6-31", srcId: "wv-jud", srcName: "West Virginia judgment interest (W. Va. Code § 56-6-31)", publisher: "West Virginia — courtswv.gov", url: "https://www.courtswv.gov/public-resources/news-publications/press-page/press-releases/supreme-court-sets-2026-interest-rate",
    notes: "Post-judgment interest under W. Va. Code § 56-6-31, currently 6.25% (as of January 1, 2026). 2 percentage points above the Fifth Federal Reserve District SECONDARY DISCOUNT rate in effect on January 2 of the year the judgment/decree is entered, with a statutory floor… Simple interest. Formula and rate apply to both (unified by 2017 amendment eff. Jan 1, 2018) — pre-judgment keyed to the rate on Jan 2 of the year the CAUSE OF ACTION… Verify the current value at courtswv.gov; not legal advice." },
  { code: "WI", name: "Wisconsin", slug: "wisconsin-judgment-rate", value: 7.75, value_text: "7.75%", kind: "variable", asof: "2026-07-09", statute: "Wis. Stat. § 815.05(8)", srcId: "wi-jud", srcName: "Wisconsin judgment interest (Wis. Stat. § 815.05(8))", publisher: "Wisconsin — docs.legis.wisconsin.gov", url: "https://docs.legis.wisconsin.gov/document/statutes/815.05(8",
    notes: "Post-judgment interest under Wis. Stat. § 815.05(8), currently 7.75% (as of July 9, 2026). Annual rate = 1% + prime rate. Prime rate is the bank prime loan rate published by the Federal Reserve Board in statistical release H.15… Simple interest. § 815.05(8) governs POST-judgment interest (from date of entry until paid); prejudgment interest on the verdict/costs is under § 814.04(4), which… Verify the current value at docs.legis.wisconsin.gov; not legal advice." },
  { code: "WY", name: "Wyoming", slug: "wyoming-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Wyo. Stat. Ann. 1-16-102", srcId: "wy-jud", srcName: "Wyoming judgment interest (Wyo. Stat. Ann. 1-16-102)", publisher: "Wyoming — wyoleg.gov", url: "https://wyoleg.gov/statutes/compress/title01.pdf",
    notes: "Post-judgment interest under Wyo. Stat. Ann. 1-16-102 — 10% per year, fixed by statute (simple interest). POST-judgment only (this statute governs interest on decrees/judgments from date of rendition; prejudgment interest is a separate common-law/contract… Verify against the statute; not legal advice." },
  { code: "ME", name: "Maine", slug: "maine-judgment-rate", value: 9.51, value_text: "9.51%", kind: "variable", asof: "2026-01-01", statute: "14 M.R.S. §1602-C", srcId: "me-jud", srcName: "Maine judgment interest (14 M.R.S. §1602-C)", publisher: "Maine — legislature.maine.gov", url: "https://legislature.maine.gov/statutes/14/title14sec1602-C.html",
    notes: "Post-judgment interest under 14 M.R.S. §1602-C, currently 9.51% (as of January 1, 2026). The weekly-average one-year Treasury constant maturity yield (Fed H.15) for the last full week of the prior calendar year, plus 6 percentage points, fixed for the year. For… Simple interest. Contract or note actions with an interest provision use the greater of the contract rate or the statutory Treasury-plus-6 rate; all other actions use… Verify the current value at legislature.maine.gov; not legal advice." },
];
for (const st of STATES_3) {
  STATE_SOURCES.push({ id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url, license: 'Government edict — not subject to copyright.', robots_status: `curated ${st.kind} value; official source verified ${EXP_VERIFIED_ON}`, retrieved_at: `${EXP_VERIFIED_ON}T00:00:00Z` });
  FIXED.push({ entity: { slug: st.slug, name: `${st.name} Judgment Interest Rate`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: st.code, statute: st.statute, basis: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable' } }, value: st.value, value_text: st.value_text, effective_date: st.asof, source_id: st.srcId, source_url: st.url, confidence: st.kind === 'fixed' ? 'high' : 'medium', method: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable', notes: st.notes });
}

const IA_ENTITY = {
  slug: 'iowa-judgment-rate',
  name: 'Iowa Judgment Interest Rate',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'US States',
  metadata: { state: 'IA', statute: 'Iowa Code §668.13(3)', basis: '1-yr Treasury CMT (H.15) + 2pp' },
};

const IA_NOTE =
  'Derived: Iowa Code §668.13(3) sets judgment interest at the 1-year Treasury constant maturity (Fed H.15) ' +
  '"settled immediately prior to the date of the judgment" + 2 percentage points, computed daily (§668.13(5)). ' +
  'This series applies the weekly-average H.15 value + 2pp for each week. A contract rate governs if the judgment ' +
  'is on a contract that fixes one (§668.13(2)). Confirm against the Iowa Judicial Branch table; not legal advice.';

export function buildStateFixed({ retrieved_at }) {
  const entities = FIXED.map((f) => f.entity);
  const observations = FIXED.map((f) => ({
    entitySlug: f.entity.slug,
    metric: 'annual_rate',
    value_numeric: f.value,
    value_text: f.value_text || `${f.value}%`,
    unit: 'percent_per_annum',
    effective_date: f.effective_date,
    source_id: f.source_id,
    source_url: f.source_url,
    retrieved_at,
    // Fixed-by-statute values are 'high'; variable/agency-set values curated as the current period
    // are 'medium' with method 'statute-variable' (re-verified on a schedule; see MAINTENANCE_RUNBOOK).
    confidence: f.confidence || 'high',
    method: f.method || 'statute-fixed',
    notes: f.notes,
  }));
  return { entities, observations };
}

export function buildIowa(weeks, { retrieved_at }) {
  const observations = weeks.map((w) => ({
    entitySlug: IA_ENTITY.slug,
    metric: 'annual_rate',
    value_numeric: Math.round((w.avg + 2) * 100) / 100,
    value_text: `${Math.round((w.avg + 2) * 100) / 100}%`,
    unit: 'percent_per_annum',
    effective_date: w.week,
    source_id: 'ia-legis',
    source_url: 'https://www.legis.iowa.gov/docs/code/668.13.pdf',
    retrieved_at,
    confidence: 'medium',
    method: 'derived_ia_668_13_weekly_cmt_plus_2',
    notes: IA_NOTE,
  }));
  return { entity: IA_ENTITY, observations };
}
