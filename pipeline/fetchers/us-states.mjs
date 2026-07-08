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
    value_text: `${f.value}%`,
    unit: 'percent_per_annum',
    effective_date: f.effective_date,
    source_id: f.source_id,
    source_url: f.source_url,
    retrieved_at,
    confidence: 'high',
    method: 'statute-fixed',
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
