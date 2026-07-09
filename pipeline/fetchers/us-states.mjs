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
