// US state judgment-interest rates.
//
// Two kinds of series here:
//   1. STATUTE-FIXED (CA, NY, NY-consumer, MA): the rate is a number written into the statute. These
//      are curated values, each verified against the OFFICIAL statute text (leginfo.legislature.ca.gov,
//      nysenate.gov, malegislature.gov) on the date in `VERIFIED_ON`, with the citation and carve-outs
//      recorded in notes. method='statute-fixed'. They change only when the legislature acts — the
//      MAINTENANCE_RUNBOOK schedules a quarterly re-verification.
//   2. OFFICIAL TABLE + DISCLOSED FALLBACK (IA): Iowa Code §668.13(3) uses the one-year Treasury
//      constant maturity + 2 points, but State Court Administration selects and distributes the
//      applicable value monthly. Never substitute the federal judgment rate's weekly average.
//
// Verification provenance (multi-agent check against official sources, 2026-07-08):
//   CA:  CCP §685.010(a)(1) 10% default; (a)(2) 5% for certain medical (<$200k) / personal (<$50k)
//        debt judgments vs natural persons entered/renewed on/after 2023-01-01 (SB 1200); 7% where
//        the debtor is a state/local government entity (Cal. Const. art. XV §1). Simple, daily, /365.
//   NY:  CPLR 5004: 9% general; 2% for consumer-debt judgments vs natural persons (eff. 2022-04-30).
//   MA:  M.G.L. c.231 §6B (tort) and §6C (contract) both 12%; contract rate displaces §6C default;
//        judgments against the commonwealth use §6I (1-yr CMT weekly avg, capped 10%).
//   IA:  Iowa Code §668.13(3): 1-yr Treasury CMT (H.15) "settled immediately prior to the date of
//        judgment" + 2 points; State Court Administration publishes the selection monthly; computed
//        daily (§668.13(5)); contract rate governs if fixed (subsec. 2).

import { classifyStateSource, stateEntityWithSafety } from '../lib/state-rules.mjs';
import { removeTruncatedFragments } from '../../shared/text-quality.mjs';
import {
  buildTexasOfficialMonthlyHistory,
  TEXAS_HISTORY_VERIFIED_AT,
  TEXAS_OCCC_CURRENT_URL,
} from './texas-occc-history.mjs';
import {
  buildNebraskaOfficialHistory,
  NEBRASKA_HISTORY_VERIFIED_AT,
  NEBRASKA_JUDICIAL_CURRENT_URL,
} from './nebraska-judgment-history.mjs';
import {
  buildIowaOfficialHistory,
  IOWA_CURATED_HISTORY_COMPLETE_THROUGH,
  IOWA_CURATED_HISTORY_START,
  IOWA_HISTORY_1982_2000_PDF_URL,
  IOWA_HISTORY_VERIFIED_AT,
  IOWA_JUDICIAL_TABLE_URL,
  IOWA_STATUTE_668_13_URL,
  IOWA_STATUTE_535_URL,
} from './iowa-judgment-history.mjs';
import {
  buildKentuckyPostJudgmentHistory,
  KENTUCKY_2017_ACT_URL,
  KENTUCKY_APPELLATE_PREJUDGMENT_URL,
  KENTUCKY_HISTORY_VERIFIED_AT,
  KENTUCKY_KRS_360_010_URL,
  KENTUCKY_KRS_360_040_URL,
} from './kentucky-interest-history.mjs';
import {
  buildMaineOfficialHistory,
  deriveMaineAnnualRateFromH15,
  MAINE_2025_CORRECTION_URL,
  MAINE_H15_SOURCE_URL,
  MAINE_HISTORY_VERIFIED_AT,
  MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  MAINE_OFFICIAL_HISTORY_START,
  MAINE_POSTJUDGMENT_CHART_URL,
  MAINE_POSTJUDGMENT_STATUTE_URL,
  MAINE_PREJUDGMENT_CHART_URL,
  MAINE_PREJUDGMENT_STATUTE_URL,
} from './maine-interest-history.mjs';
import {
  buildGeorgiaPrimeHistory,
  GEORGIA_CODE_PORTAL_URL,
  GEORGIA_CURRENT_SCHEME_START,
  GEORGIA_CURATED_PRIME_COMPLETE_THROUGH,
  GEORGIA_HISTORY_VERIFIED_AT,
  GEORGIA_PRIME_SERIES_URL,
} from './georgia-interest-history.mjs';

const VERIFIED_ON = '2026-07-08';

export const STATE_SOURCES = [
  { id: 'ca-leginfo', name: 'California Code of Civil Procedure §685.010', publisher: 'California Legislative Information (official)', home_url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CCP&sectionNum=685.010', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ny-senate', name: 'New York CPLR 5004', publisher: 'New York State Senate (official statute text)', home_url: 'https://www.nysenate.gov/legislation/laws/CVP/5004', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ma-legislature', name: 'Massachusetts G.L. c.231 §§6B–6C', publisher: 'Massachusetts Legislature (official)', home_url: 'https://malegislature.gov/Laws/GeneralLaws/PartIII/TitleII/Chapter231/Section6B', license: 'Government edict — not subject to copyright.', robots_status: `curated statutory value; official text verified ${VERIFIED_ON}`, retrieved_at: `${VERIFIED_ON}T00:00:00Z` },
  { id: 'ia-jud', name: 'Iowa §668.13 post-judgment interest table', publisher: 'Iowa Judicial Branch (official)', home_url: IOWA_JUDICIAL_TABLE_URL, license: 'Government edict — not subject to copyright.', robots_status: `official HTML/PDF history verified through ${IOWA_CURATED_HISTORY_COMPLETE_THROUGH}; live page rechecked ${IOWA_HISTORY_VERIFIED_AT.slice(0, 10)}`, retrieved_at: IOWA_HISTORY_VERIFIED_AT },
  { id: 'me-h15-provisional', name: 'Maine annual judgment-interest provisional H.15 calculation', publisher: 'Federal Reserve Board and Maine Legislature (official inputs)', home_url: MAINE_H15_SOURCE_URL, license: 'U.S. government publication and government edict.', robots_status: `future-year fallback only after the official Maine Judicial Branch chart ends; formula verified ${MAINE_HISTORY_VERIFIED_AT.slice(0, 10)}`, retrieved_at: MAINE_HISTORY_VERIFIED_AT },
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
    entity: { slug: 'massachusetts-judgment-rate', name: 'Massachusetts Judgment Interest Rate', entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: 'MA', statute: 'M.G.L. c. 235 §8', basis: 'statute-fixed' } },
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

// ---- Expansion batch: 14 states, each checked 2026-07-09 against its recorded source.
// Fixed-by-statute = high confidence; variable/agency-set current values = medium confidence +
// method 'statute-variable' (re-checked on the runbook schedule). Source tiers are explicit below.
const EXP_VERIFIED_ON = '2026-07-09';
const TEXAS_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The official monthly rate schedule and core Chapter 304 branches are modeled, but Texas Finance Code Chapter 304 does not specify the day-count convention or partial-payment allocation mechanics needed for a deterministic calculator. The renderer remains disabled until those rules and every supported exception are verified.',
  rate_behavior: 'fixed_at_entry',
  rate_schedule: 'monthly_by_judgment_month',
  compounding: 'annual',
  day_count: 'not_specified_in_chapter_304',
  history_start: '1983-09-01',
  curated_history_complete_through: '2026-07-01',
  current_period_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: TEXAS_HISTORY_VERIFIED_AT,
  branches: {
    general_noncontract: '§304.003 monthly OCCC rate; prime with a 5% floor and 15% ceiling',
    interest_bearing_contract: '§304.002 lesser of the contract rate or 18%',
    accrual: '§304.005 from rendition through satisfaction, excluding a qualifying appeal brief-extension period',
    exclusions: 'Chapter 304 excludes specified delinquent-tax and delinquent-child-support interest',
  },
};
const TEXAS_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The statutory rate, simple-interest rule, and base accrual window are verified, but settlement-offer adjustments, damages exclusions, common-law entitlement, day count, and all supported claim branches are not yet deterministic.',
  rate_behavior: 'fixed_at_judgment',
  rate_schedule: 'same_as_postjudgment_rate_at_judgment',
  compounding: 'simple',
  day_count: 'not_specified_in_chapter_304',
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: TEXAS_HISTORY_VERIFIED_AT,
};
const NEBRASKA_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The official 1987-present rate table, rate-lock rule, exceptions, and accrual window are modeled, but Nebraska law does not state the day-count convention or a calculator-grade compounding and partial-payment allocation method. The renderer remains disabled until those mechanics and all supported judgment branches are verified.',
  rate_behavior: 'fixed_at_entry',
  rate_schedule: 'official_change_points_quarterly_since_2002',
  compounding: 'not_verified',
  day_count: 'not_specified_in_sections_45_103_and_45_103_01',
  history_start: '1987-01-01',
  curated_history_complete_through: '2026-07-16',
  current_period_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: NEBRASKA_HISTORY_VERIFIED_AT,
  branches: {
    general: '§45-103 rate in effect when the judgment is entered',
    other_law: 'The §45-103 rate does not apply when another law specifically provides the rate',
    agreed_contract: 'The §45-103 rate does not apply when an oral or written contract agrees a different rate',
    accrual: '§45-103.01 from entry of judgment until satisfaction; installment judgments accrue as installments become due',
  },
};
const NEBRASKA_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'Nebraska prejudgment interest has separate liquidated, unliquidated-settlement-offer, and contract-obligation paths with statutory exclusions. Entitlement, payment offsets, day count, and compounding are not yet deterministic across every branch.',
  rate_behavior: 'claim_branch_specific',
  rate_schedule: '12_percent_liquidated_or_section_45_103_rate_for_qualifying_unliquidated_claims',
  compounding: 'not_verified',
  day_count: 'not_specified_in_sections_45_103_02_through_45_104',
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: NEBRASKA_HISTORY_VERIFIED_AT,
};
const KENTUCKY_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The official statutory change points, annual-compounding rule, and primary branches are modeled, but day count, partial-payment allocation, the unliquidated-damages hearing outcome, and every contract and support exception are not deterministic.',
  rate_behavior: 'fixed_at_entry',
  rate_schedule: 'statutory_change_points',
  compounding: 'annual',
  day_count: 'not_specified_in_krs_360_040',
  history_start: '1982-07-15',
  curated_history_complete_through: '2017-06-29',
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: KENTUCKY_HISTORY_VERIFIED_AT,
  branches: {
    general: 'KRS 360.040(1): 6%, compounded annually, from entry for judgments entered on or after June 29, 2017',
    child_support: 'KRS 360.040(2): unpaid child-support judgments bear 12%, compounded annually',
    written_obligation: 'KRS 360.040(3): the contract, note, or other written obligation rate controls',
    unliquidated: 'KRS 360.040(4): the court may set a rate below 6% after notice and a hearing',
  },
};
const KENTUCKY_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'Kentucky entitlement differs for liquidated and unliquidated claims, and an unliquidated award, its rate up to the legal rate, and simple-versus-compound treatment can be discretionary. Contract terms and claim-specific law can also control.',
  rate_behavior: 'claim_branch_specific',
  rate_schedule: 'legal_rate_or_contract_and_court_selected_rate',
  compounding: 'court_discretion_for_unliquidated_claims',
  day_count: 'not_verified_across_claim_branches',
  branches_complete: false,
  accrual_rule_verified: false,
  renderer_supported: false,
  rule_verified_at: KENTUCKY_HISTORY_VERIFIED_AT,
};
const MAINE_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The official 2003-present annual chart, statutory formula, rate selection, accrual start, appeal treatment, continuance suspension, and waiver branch are modeled, but compounding, day count, partial-payment allocation, and contract-specific inputs are not deterministic.',
  rate_behavior: 'fixed_at_entry',
  rate_schedule: 'annual_prior_year_last_full_week_one_year_cmt_plus_6',
  compounding: 'not_specified_in_section_1602_c',
  day_count: 'not_specified_in_section_1602_c',
  history_start: MAINE_OFFICIAL_HISTORY_START,
  curated_history_complete_through: MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  future_period_formula_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: MAINE_HISTORY_VERIFIED_AT,
  branches: {
    general: '14 M.R.S. §1602-C(1)(B): prior-year last-full-week one-year CMT plus 6 points',
    contract_or_note: '§1602-C(1)(A): greater of the written rate and the statutory general rate',
    accrual: '§1602-C(2): from and after entry, including appeal, subject to continuance suspension and possible waiver',
  },
};
const MAINE_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The official annual chart, formula, notice-or-complaint accrual start, suspension, waiver, and principal-base rule are modeled, but claim eligibility, compounding, day count, offsets, historical pre-July-2003 branches, and contract inputs prevent deterministic calculation.',
  rate_behavior: 'fixed_when_interest_begins',
  rate_schedule: 'annual_prior_year_last_full_week_one_year_cmt_plus_3',
  compounding: 'not_specified_in_section_1602_b',
  day_count: 'not_specified_in_section_1602_b',
  history_start: MAINE_OFFICIAL_HISTORY_START,
  curated_history_complete_through: MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  future_period_formula_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: MAINE_HISTORY_VERIFIED_AT,
};
const GEORGIA_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_secondary',
  reason: 'The current statutory formula, Federal Reserve change-point history, rate lock, and contract branch are modeled. The authorized online Code portal is official-secondary, and day count, payment allocation, amended-judgment treatment, and every exception still need primary-text and case-law verification before calculation.',
  rate_behavior: 'fixed_at_entry',
  rate_schedule: 'federal_reserve_prime_on_judgment_date_plus_3',
  compounding: 'simple',
  day_count: 'not_verified_for_calculator',
  history_start: GEORGIA_CURRENT_SCHEME_START,
  curated_history_complete_through: GEORGIA_CURATED_PRIME_COMPLETE_THROUGH,
  current_benchmark_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: GEORGIA_HISTORY_VERIFIED_AT,
  branches: {
    general: 'O.C.G.A. §7-4-12(a): Federal Reserve prime rate on the judgment date plus three percentage points',
    written_contract: '§7-4-12(b): a written contract specifying a rate uses the contract rate instead',
    transition: 'Current scheme applies to civil actions filed on or after July 1, 2003',
  },
};
const GEORGIA_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_secondary',
  reason: 'Georgia has separate liquidated-demand and unliquidated-tort-demand paths. The rate histories are modeled, but entitlement, notice sufficiency, exact loss dates, offsets, day count, payment allocation, and every claim branch require case-specific facts.',
  rate_behavior: 'claim_branch_specific',
  rate_schedule: '7_percent_liquidated_or_prime_plus_3_on_tort_demand_selection_day',
  compounding: 'simple',
  day_count: 'not_verified_for_calculator',
  history_start: GEORGIA_CURRENT_SCHEME_START,
  curated_history_complete_through: GEORGIA_CURATED_PRIME_COMPLETE_THROUGH,
  current_benchmark_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: GEORGIA_HISTORY_VERIFIED_AT,
};
const MISSISSIPPI_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_secondary',
  reason: 'Mississippi does not provide one statewide prejudgment percentage. A sale or contract can use its governing contract rate, while other judgments use a fair rate and date selected by the judge. Entitlement, the percentage, accrual, and simple-versus-compound treatment are case-specific.',
  rate_behavior: 'contract_or_court_selected',
  rate_schedule: 'no_uniform_statewide_percentage',
  compounding: 'contract_or_court_specific',
  day_count: 'contract_or_court_specific',
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: '2026-07-19T00:00:00Z',
};
const STATES_2 = [
  { code: 'TX', name: 'Texas', slug: 'texas-judgment-rate', value: 6.75, kind: 'variable', asof: '2026-07-01',
    statute: 'Tex. Fin. Code §304.003', srcId: 'tx-occc', srcName: 'Texas post-judgment interest rate (Fin. Code §304.003)',
    publisher: 'Texas Office of Consumer Credit Commissioner (official)', url: TEXAS_OCCC_CURRENT_URL,
    verifiedOn: '2026-07-19', confidence: 'high', method: 'statute-variable-official-table', calculation: TEXAS_POSTJUDGMENT_CALCULATION,
    notes: 'Texas OCCC published 6.75% for money judgments rendered during July 2026. Under Texas Finance Code §§304.003, 304.005, and 304.006, the general noncontract rate is fixed at judgment, accrues from rendition through satisfaction (subject to the appeal-extension exception), and compounds annually. An interest-bearing contract instead uses §304.002 (the lesser of its rate or 18%); specified tax and child-support interest are outside Chapter 304. Verify applicability; not legal advice.' },
  { code: 'FL', name: 'Florida', slug: 'florida-judgment-rate', value: 8.06, kind: 'variable', asof: '2026-07-01',
    statute: 'Fla. Stat. §55.03', srcId: 'fl-cfo', srcName: 'Florida judgment interest rate (Fla. Stat. §55.03)',
    publisher: 'Florida Chief Financial Officer (official)', url: 'https://myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates',
    notes: 'Post-judgment interest on judgments and decrees, set quarterly by the Florida Chief Financial Officer under Fla. Stat. §55.03 (12-month average of the New York Fed discount/primary-credit rate + 4 percentage points) — currently 8.06% for the quarter beginning July 1, 2026. Simple interest; a judgment’s rate re-adjusts each January 1 to the then-current CFO rate (§55.03(3)). Verify the current quarter at myfloridacfo.com; not legal advice.' },
  { code: 'GA', name: 'Georgia', slug: 'georgia-judgment-rate', value: 9.75, kind: 'variable', asof: '2025-12-11',
    statute: 'O.C.G.A. §7-4-12', srcId: 'ga-code', srcName: 'Georgia judgment interest (O.C.G.A. §7-4-12)',
    publisher: 'Georgia General Assembly-authorized Code portal (LexisNexis); Federal Reserve prime benchmark via FRED', url: GEORGIA_CODE_PORTAL_URL,
    verifiedOn: '2026-07-19', confidence: 'high', method: 'derived_ga_7_4_12_prime_plus_3', calculation: GEORGIA_POSTJUDGMENT_CALCULATION,
    metadata: { official_statute_url: GEORGIA_CODE_PORTAL_URL, official_benchmark_url: GEORGIA_PRIME_SERIES_URL },
    license: 'Georgia statutory text is a government edict; the FRED PRIME series requests citation to its Federal Reserve source.',
    notes: 'For civil actions filed on or after July 1, 2003, O.C.G.A. §7-4-12(a) uses the Federal Reserve prime rate on the day judgment is entered plus three percentage points, fixed for that judgment. The prime rate has been 6.75% since December 11, 2025, producing a 9.75% general reference. A judgment on a written contract that specifies a rate uses the contract rate instead under §7-4-12(b). Verify applicability; not legal advice.' },
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
    notes: 'Post-judgment interest at 9% per annum under 735 ILCS 5/2-1303 for general judgments — fixed by statute, computed as simple interest on the unsatisfied portion of the judgment. Carve-outs: 6% per annum where the judgment debtor is a unit of local government, and 5% for consumer-debt judgments of $25,000 or less (735 ILCS 5/2-1303). Verify against the statute; not legal advice.' },
  { code: 'NC', name: 'North Carolina', slug: 'north-carolina-judgment-rate', value: 8, kind: 'fixed', asof: '2016-12-01',
    statute: 'N.C.G.S. §24-5 / §24-1', srcId: 'nc-ncleg', srcName: 'North Carolina judgment interest (N.C.G.S. §24-5 / §24-1)',
    publisher: 'North Carolina General Assembly (official)', url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_24/GS_24-5.html',
    notes: 'Post-judgment interest at North Carolina’s legal rate of 8% per annum — N.C.G.S. §24-5 pegs judgment interest to the §24-1 legal rate (8%), or the contract rate for judgments on a contract. Fixed by statute; simple interest. Verify against the statute; not legal advice.' },
  { code: 'MI', name: 'Michigan', slug: 'michigan-judgment-rate', value: 4.959, kind: 'variable', asof: '2026-07-01',
    statute: 'MCL §600.6013', srcId: 'mi-legislature', srcName: 'Michigan judgment interest (MCL §600.6013)',
    publisher: 'Michigan Legislature (official)', url: 'https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-6013',
    notes: 'Post-judgment interest under MCL §600.6013 (Michigan’s judgment interest runs from the filing of the complaint): the general rate is 1 percentage point above the six-month average of 5-year U.S. Treasury note auctions, certified by the State Treasurer and reset each January 1 and July 1, COMPOUNDED ANNUALLY — currently 4.959% (period beginning July 1, 2026). Judgments on a written instrument use a separate rate (the instrument’s rate, capped at 13%). Verify the current period at legislature.mi.gov; not legal advice.' },
  { code: 'NJ', name: 'New Jersey', slug: 'new-jersey-judgment-rate', value: 4.5, value_text: '4.5% / 6.5%', kind: 'variable', asof: '2026-01-01',
    statute: 'N.J. Court Rule R. 4:42-11', srcId: 'nj-courts', srcName: 'New Jersey post-judgment interest (R. 4:42-11)',
    publisher: 'New Jersey Courts (official)', url: 'https://www.njcourts.gov/notices/notice-post-judgment-interest-rate-calendar-year-2026-rule-442-11',
    notes: 'Post-judgment interest set annually by the New Jersey Judiciary under Court Rule R. 4:42-11: a base rate tied to the State Cash Management Fund’s prior-year return — for 2026, 4.5% on judgments up to $20,000, and 6.5% (base + 2%) on judgments over $20,000. Simple interest. Verify the current year’s Notice to the Bar at njcourts.gov; not legal advice.' },
  { code: 'VA', name: 'Virginia', slug: 'virginia-judgment-rate', value: 6, kind: 'fixed', asof: EXP_VERIFIED_ON,
    statute: 'Va. Code §6.2-302 / §8.01-382', srcId: 'va-code', srcName: 'Virginia judgment interest (Va. Code §6.2-302)',
    publisher: 'Virginia General Assembly (official)', url: 'https://law.lis.virginia.gov/vacode/title6.2/chapter3/section6.2-302/',
    notes: 'Post-judgment interest at Virginia’s judgment rate of 6% per annum — Va. Code §6.2-302 (with §8.01-382) fixes 6% for judgments that do not specify a rate. Simple interest. A judgment on a contract carries the higher of the lawful contract rate or 6%. Verify against the statute; not legal advice.' },
  { code: 'WA', name: 'Washington', slug: 'washington-judgment-rate', value: 12, value_text: '12% / 8.75%', kind: 'variable', asof: '2026-07-08',
    statute: 'RCW 4.56.110', srcId: 'wa-rcw', srcName: 'Washington post-judgment interest (RCW 4.56.110)',
    publisher: 'Washington State Legislature (official)', url: 'https://app.leg.wa.gov/rcw/default.aspx?cite=4.56.110',
    notes: 'Post-judgment interest under RCW 4.56.110 sets DISTINCT rates by claim type: general "all other" money judgments carry the statutory maximum under RCW 19.52.020 (currently 12%); consumer-debt judgments 9% (fixed); tort judgments against individuals/entities carry the federal prime rate + 2% (currently 8.75%); child-support judgments 12%; judgments on a written contract carry the contract’s rate. Simple interest. Verify at app.leg.wa.gov; not legal advice.' },
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
  const sourceTier = classifyStateSource({ publisher: st.publisher, home_url: st.url });
  const verifiedOn = st.verifiedOn || EXP_VERIFIED_ON;
  STATE_SOURCES.push({
    id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url,
    license: st.license || (sourceTier === 'third_party_secondary' ? 'Statutory text is a government edict; third-party page terms may apply.' : 'Government edict — not subject to copyright.'),
    robots_status: `curated ${st.kind} value; ${sourceTier === 'official_primary' ? 'official' : 'secondary'} source checked ${verifiedOn}`,
    retrieved_at: `${verifiedOn}T00:00:00Z`,
  });
  FIXED.push({
    entity: { slug: st.slug, name: `${st.name} Judgment Interest Rate`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: st.code, statute: st.statute, basis: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable', ...(st.metadata || {}), ...(st.calculation ? { calculation: st.calculation } : {}) } },
    value: st.value,
    value_text: st.value_text || `${st.value}%`,
    effective_date: st.asof,
    source_id: st.srcId,
    source_url: st.url,
    confidence: st.confidence || (st.kind === 'fixed' ? 'high' : 'medium'),
    method: st.method || (st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable'),
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
  { code: "DC", name: "District of Columbia", slug: "dc-judgment-rate", value: 5, value_text: "5%", kind: "variable", asof: "2026-07-01", statute: "D.C. Code § 28-3302(c)", srcId: "dc-jud", srcName: "District of Columbia judgment interest (D.C. Code § 28-3302(c))", publisher: "District of Columbia — code.dccouncil.gov", url: "https://code.dccouncil.gov/us/dc/council/code/sections/28-3302",
    notes: "Post-judgment interest under D.C. Code § 28-3302(c), currently 5% (Q3 2026, effective July 1, 2026). Rate = 70% of the rate set by the U.S. Secretary of the Treasury under IRC §6621 (26 U.S.C. §6621) for underpayments of tax, rounded to the nearest full percent — with the current 7% federal underpayment rate, 70% × 7% = 4.9% rounds to 5%. Simple interest. Judgments/decrees against the District of Columbia, its officers, or employees acting within scope of employment bear interest \"not exceeding 4% per… Verify the current value at code.dccouncil.gov; not legal advice." },
  { code: "HI", name: "Hawaii", slug: "hawaii-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Haw. Rev. Stat. 478-3. Related: 478-2", srcId: "hi-jud", srcName: "Hawaii judgment interest (Haw. Rev. Stat. 478-3. Related: 478-2)", publisher: "Hawaii — capitol.hawaii.gov", url: "https://www.capitol.hawaii.gov/hrscurrent/Vol11_Ch0476-0490/HRS0478/HRS_0478-0003.htm",
    notes: "Post-judgment interest under Haw. Rev. Stat. 478-3. Related: 478-2 — 10% per year, fixed by statute (simple interest). 478-3 governs POST-judgment interest on any civil judgment at a flat 10%. PREJUDGMENT interest is separate — HRS 636-16 lets the judge designate the… Verify against the statute; not legal advice." },
  { code: "ID", name: "Idaho", slug: "idaho-judgment-rate", value: 8.875, value_text: "8.875%", kind: "variable", asof: "2026-07-01", statute: "Idaho Code § 28-22-104(2)", srcId: "id-jud", srcName: "Idaho judgment interest (Idaho Code § 28-22-104(2))", publisher: "Idaho — sto.idaho.gov", url: "https://sto.idaho.gov/Banking/Legal-Rate-of-Interest",
    notes: "Post-judgment interest under Idaho Code § 28-22-104(2), currently 8.875% (as of July 1, 2026). Judgment rate = 5% + base rate in effect at time of entry of judgment. Base rate = weekly average yield on U.S. Treasury securities adjusted to a constant maturity of one (1)… Simple interest. § 28-22-104(2) applies \"unless the judgment is rendered on a written contract or agreement providing for a different rate of interest, in which case… Verify the current value at sto.idaho.gov; not legal advice." },
  { code: "IN", name: "Indiana", slug: "indiana-judgment-rate", value: 8, value_text: "8%", kind: "fixed", asof: "2026-01-01", statute: "Ind. Code § 24-4.6-1-101", srcId: "in-jud", srcName: "Indiana judgment interest (Ind. Code § 24-4.6-1-101)", publisher: "Indiana — iga.in.gov", url: "https://iga.in.gov/laws/2025/ic/titles/24",
    notes: "Post-judgment interest under Ind. Code § 24-4.6-1-101 — 8% per year, fixed by statute (simple interest). This 8% is POST-judgment (from verdict/finding to satisfaction). Prejudgment interest is separate — under the Tort Prejudgment Interest Statute, Ind.… Verify against the statute; not legal advice." },
  { code: "KS", name: "Kansas", slug: "kansas-judgment-rate", value: 7.75, value_text: "7.75%", kind: "variable", asof: "2026-07-01", statute: "Kan. Stat. Ann. 16-204", srcId: "ks-jud", srcName: "Kansas judgment interest (Kan. Stat. Ann. 16-204)", publisher: "Kansas — sos.ks.gov", url: "https://sos.ks.gov/general-services/finance-rates.html",
    notes: "Post-judgment interest under Kan. Stat. Ann. 16-204, currently 7.75% for July 1, 2026–June 30, 2027 (four percentage points above the federal discount rate as of July 1, recomputed each July 1). Simple interest. Prejudgment interest is separate — see the Kansas prejudgment page (10% general; a lower tort rate for recent tort actions). Verify at sos.ks.gov; not legal advice." },
  { code: "KY", name: "Kentucky", slug: "kentucky-judgment-rate", value: 6, value_text: "6%", kind: "fixed", asof: "2017-06-29", verifiedOn: "2026-07-19", statute: "KRS 360.040", srcId: "ky-jud", srcName: "Kentucky judgment interest history (KRS 360.040 and 2017 Ky. Acts ch. 17)", publisher: "Kentucky General Assembly (official)", url: KENTUCKY_2017_ACT_URL, confidence: "high", method: "statute-fixed-official-history", calculation: KENTUCKY_POSTJUDGMENT_CALCULATION,
    metadata: { official_statute_urls: [KENTUCKY_KRS_360_040_URL], official_act_url: KENTUCKY_2017_ACT_URL },
    notes: "For general judgments entered on or after June 29, 2017, KRS 360.040(1) sets 6% interest compounded annually from entry. The enrolled 2017 Act changed the prior 12% general rate and expressly applies the change by judgment-entry date. Unpaid child-support judgments remain 12%; a written contract, note, or obligation uses its stated rate; an unliquidated judgment may receive less than 6% after notice and a hearing. Verify applicability; not legal advice." },
  { code: "LA", name: "Louisiana", slug: "louisiana-judgment-rate", value: 7.5, value_text: "7.5%", kind: "variable", asof: "2026-01-01", statute: "La. R.S. 13:4202(B)", srcId: "la-jud", srcName: "Louisiana judgment interest (La. R.S. 13:4202(B))", publisher: "Louisiana — ofi.la.gov", url: "https://ofi.la.gov/legal/statutes-rules-policies-opinions/judicial-interest-rates/",
    notes: "Post-judgment interest under La. R.S. 13:4202(B), currently 7.5% (as of January 1, 2026). . Formula: Federal Reserve Board of Governors approved \"discount rate\" (published daily in the Wall Street Journal), ascertained by the Commissioner on the first business day… Simple interest. Louisiana uses one unified \"judicial interest\" (= \"legal interest\") rate; La. R.S. 13:4203 provides interest attaches from the date of judicial… Verify the current value at ofi.la.gov; not legal advice." },
  { code: "MD", name: "Maryland", slug: "maryland-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Md. Code, Courts & Judicial Proceedings Section 11-107(a)", srcId: "md-jud", srcName: "Maryland judgment interest (Md. Code, Courts & Judicial Proceedings Section 11-107(a))", publisher: "Maryland — mgaleg.maryland.gov", url: "https://mgaleg.maryland.gov/mgawebsite/laws/StatuteText?article=gcj&section=11-107",
    notes: "Post-judgment interest under Md. Code, Courts & Judicial Proceedings Section 11-107(a) — 10% per year, fixed by statute (simple interest). Under the \"except as provided in Section 11-106\" clause, a money judgment on a contract for a loan of money carries interest at the RATE CHARGED IN… Verify against the statute; not legal advice." },
  { code: "MN", name: "Minnesota", slug: "minnesota-judgment-rate", value: 4, value_text: "4% / 10%", kind: "variable", asof: "2026-01-01", statute: "Minn. Stat. § 549.09, subd. 1(c)", srcId: "mn-jud", srcName: "Minnesota judgment interest (Minn. Stat. § 549.09, subd. 1(c))", publisher: "Minnesota — revisor.mn.gov", url: "https://www.revisor.mn.gov/court_rules/rule/msinte/",
    notes: "Post-judgment interest under Minn. Stat. § 549.09, subd. 1(c), currently 4% / 10% (as of January 1, 2026). , set annually by the Minnesota State Court Administrator by December 20 for the succeeding calendar year. Rate = the secondary market yield / one-year constant maturity… Simple interest. Standard variable Treasury-indexed rate (4% floor) applies to judgments/awards of $50,000 or less, and to ALL judgments/awards for or against the… Verify the current value at revisor.mn.gov; not legal advice." },
  { code: "MO", name: "Missouri", slug: "missouri-judgment-rate", value: 9, value_text: "9% / 8.75%", kind: "variable", asof: "2026-07-09", statute: "Mo. Rev. Stat. §408.040", srcId: "mo-jud", srcName: "Missouri judgment interest (Mo. Rev. Stat. §408.040)", publisher: "Missouri — revisor.mo.gov", url: "https://revisor.mo.gov/main/OneSection.aspx?section=408.040",
    notes: "Post-judgment interest under Mo. Rev. Stat. §408.040: NON-TORT/contract judgments bear 9% fixed (or the contract rate if higher); TORT judgments bear the intended Federal Funds rate + 5% — currently about 8.75% (variable). Simple interest. Verify at revisor.mo.gov; not legal advice." },
  { code: "MT", name: "Montana", slug: "montana-judgment-rate", value: 9.75, value_text: "9.75%", kind: "variable", asof: "2026-01-01", statute: "Mont. Code Ann. § 25-9-205", srcId: "mt-jud", srcName: "Montana judgment interest (Mont. Code Ann. § 25-9-205)", publisher: "Montana — mca.legmt.gov", url: "https://mca.legmt.gov/bills/mca/title_0250/chapter_0090/part_0020/section_0050/0250-0090-0020-0050.html",
    notes: "Post-judgment interest under Mont. Code Ann. § 25-9-205, currently 9.75% (as of January 1, 2026). Rate = (bank prime loan rate published in the Federal Reserve System's H.15 \"Selected Interest Rates\" release, or any superseding publication, on the day judgment is entered)… Simple interest. For a judgment involving a contractual obligation that specifies an interest rate, post-judgment interest is paid at the rate specified in the… Verify the current value at mca.legmt.gov; not legal advice." },
  { code: "NE", name: "Nebraska", slug: "nebraska-judgment-rate", value: 5.970, value_text: "5.970%", kind: "variable", asof: "2026-07-16", statute: "Neb. Rev. Stat. §§ 45-103 and 45-103.01", srcId: "ne-jud", srcName: "Nebraska judgment interest rate and official history (Neb. Rev. Stat. §45-103)", publisher: "Nebraska Judicial Branch (official)", url: NEBRASKA_JUDICIAL_CURRENT_URL,
    verifiedOn: "2026-07-19", confidence: "high", method: "statute-variable-official-table", calculation: NEBRASKA_POSTJUDGMENT_CALCULATION,
    notes: "The Nebraska Judicial Branch publishes a 5.970% judgment rate effective July 16, 2026. For judgments entered on or after July 20, 2002, Neb. Rev. Stat. §45-103 fixes the rate at the first quarterly 26-week Treasury-bill bond investment yield plus two percentage points; the court's notice becomes effective two weeks after publication. Section 45-103.01 runs interest from entry until satisfaction. Another law or an agreed contract rate can control instead. The statute does not state the day-count or calculator-grade compounding mechanics; verify applicability. Not legal advice." },
  { code: "NV", name: "Nevada", slug: "nevada-judgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", asof: "2026-07-01", statute: "Nev. Rev. Stat. 17.130(2)", srcId: "nv-jud", srcName: "Nevada judgment interest (Nev. Rev. Stat. 17.130(2))", publisher: "Nevada — fid.nv.gov", url: "https://fid.nv.gov/uploadedFiles/fidnvgov/content/Resources/Prime%20Interest%20Rate%20July%201,%202026.pdf",
    notes: "Post-judgment interest under Nev. Rev. Stat. 17.130(2), currently 8.75% (as of July 1, 2026). Post-judgment rate = (prime rate at the largest bank in Nevada as ascertained by the Commissioner of Financial Institutions on the Jan 1 or Jul 1 immediately preceding the… Simple interest. Interest runs from time of SERVICE of the summons and complaint until satisfied, EXCEPT amounts representing FUTURE damages, which draw interest only… Verify the current value at fid.nv.gov; not legal advice." },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire-judgment-rate", value: 5.7, value_text: "5.7%", kind: "variable", asof: "2026-01-01", statute: "N.H. Rev. Stat. Ann. 336:1, II", srcId: "nh-jud", srcName: "New Hampshire judgment interest (N.H. Rev. Stat. Ann. 336:1, II)", publisher: "New Hampshire — courts.nh.gov", url: "https://www.courts.nh.gov/our-courts/superior-court/civil/civil-interest-rates",
    notes: "Post-judgment interest under N.H. Rev. Stat. Ann. 336:1, II, currently 5.7% (as of January 1, 2026). , reset annually. Formula (RSA 336:1, II): prevailing discount rate on 26-week U.S. Treasury bills at the last auction preceding the last day of September of the prior year,… Simple interest. RSA 336:1, II applies the SAME rate to \"judgments, including prejudgment interest\" — one unified statutory rate covers both; no tort/contract… Verify the current value at courts.nh.gov; not legal advice." },
  { code: "NM", name: "New Mexico", slug: "new-mexico-judgment-rate", value: 8.75, value_text: "8.75% / 15%", kind: "fixed", asof: "2026-07-09", statute: "N.M. Stat. Ann. § 56-8-4", srcId: "nm-jud", srcName: "New Mexico judgment interest (N.M. Stat. Ann. § 56-8-4)", publisher: "New Mexico Compilation Commission — NMOneSource (official)", url: "https://nmonesource.com/nmos/en/nav.do",
    notes: "Post-judgment interest under N.M. Stat. Ann. § 56-8-4 — 8.75% per year, fixed by statute (simple interest). If the judgment is based on tortious conduct, bad faith, or intentional or willful acts, post-judgment interest is 15% (not 8.75%); plaintiff… Verify against the statute; not legal advice." },
  { code: "ND", name: "North Dakota", slug: "north-dakota-judgment-rate", value: 10, value_text: "10%", kind: "variable", asof: "2026-01-01", statute: "N.D.C.C. § 28-20-34", srcId: "nd-jud", srcName: "North Dakota judgment interest (N.D.C.C. § 28-20-34)", publisher: "North Dakota — ndcourts.gov", url: "https://www.ndcourts.gov/state-court-administration/interest-rate-on-judgments",
    notes: "Post-judgment interest under N.D.C.C. § 28-20-34, currently 10% (as of January 1, 2026). , reset annually. Rate = (U.S. prime rate as published/reported in the Wall Street Journal on the first Monday in December of the prior year) + 3 percentage points, then… Simple interest. Contract rate governs first — if the original instrument on which the action was based specifies an interest rate, judgment interest accrues at THAT… Verify the current value at ndcourts.gov; not legal advice." },
  { code: "OK", name: "Oklahoma", slug: "oklahoma-judgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", asof: "2026-01-01", statute: "12 O.S. Sec. 727.1", srcId: "ok-jud", srcName: "Oklahoma judgment interest (12 O.S. Sec. 727.1)", publisher: "Oklahoma — oscn.net", url: "https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=551111",
    notes: "Post-judgment interest under 12 O.S. Sec. 727.1, currently 8.75% (as of January 1, 2026). . Postjudgment rate = the prime rate as listed in the FIRST edition of the Wall Street Journal published for the calendar year, certified to the Administrative Director of… Simple interest. Different formulas. Postjudgment = WSJ prime + 2% (8.75% for 2026). Prejudgment = average U.S. Treasury Bill rate of the preceding calendar year,… Verify the current value at oscn.net; not legal advice." },
  { code: "OR", name: "Oregon", slug: "oregon-judgment-rate", value: 9, value_text: "9%", kind: "fixed", asof: "2026-07-09", statute: "ORS 82.010(2)", srcId: "or-jud", srcName: "Oregon judgment interest (ORS 82.010(2))", publisher: "Oregon — oregonlegislature.gov", url: "https://www.oregonlegislature.gov/bills_laws/ors/ors082.html",
    notes: "Post-judgment interest under ORS 82.010(2) — 9% per year, fixed by statute (simple interest). 9%/yr simple (ORS 82.010(2)(a)). Applies to money judgments; also accrues on pre-judgment interest that accrued before entry, and on attorney fees. Carve-out: judgments for professional negligence of Oregon Medical Board or State Board of Nursing licensees bear the lesser of 5% or the federal discount rate + 3% (ORS 82.010(2)(f)), not 9%. Verify against the statute; not legal advice." },
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
  { code: "WI", name: "Wisconsin", slug: "wisconsin-judgment-rate", value: 7.75, value_text: "7.75%", kind: "variable", asof: "2026-07-09", statute: "Wis. Stat. § 815.05(8)", srcId: "wi-jud", srcName: "Wisconsin judgment interest (Wis. Stat. § 815.05(8))", publisher: "Wisconsin — docs.legis.wisconsin.gov", url: "https://docs.legis.wisconsin.gov/document/statutes/815.05(8)",
    notes: "Post-judgment interest under Wis. Stat. § 815.05(8), currently 7.75% (as of July 9, 2026). Annual rate = 1% + prime rate. Prime rate is the bank prime loan rate published by the Federal Reserve Board in statistical release H.15… Simple interest. § 815.05(8) governs POST-judgment interest (from date of entry until paid); prejudgment interest on the verdict/costs is under § 814.04(4), which… Verify the current value at docs.legis.wisconsin.gov; not legal advice." },
  { code: "WY", name: "Wyoming", slug: "wyoming-judgment-rate", value: 10, value_text: "10%", kind: "fixed", asof: "2026-07-09", statute: "Wyo. Stat. Ann. 1-16-102", srcId: "wy-jud", srcName: "Wyoming judgment interest (Wyo. Stat. Ann. 1-16-102)", publisher: "Wyoming — wyoleg.gov", url: "https://wyoleg.gov/statutes/compress/title01.pdf",
    notes: "Post-judgment interest under Wyo. Stat. Ann. 1-16-102 — 10% per year, fixed by statute (simple interest). POST-judgment only (this statute governs interest on decrees/judgments from date of rendition; prejudgment interest is a separate common-law/contract… Verify against the statute; not legal advice." },
  { code: "ME", name: "Maine", slug: "maine-judgment-rate", value: 9.51, value_text: "9.51%", kind: "variable", asof: "2026-01-01", verifiedOn: "2026-07-19", statute: "14 M.R.S. §1602-C", srcId: "me-jud", srcName: "Maine post-judgment interest official annual chart (OTH-156)", publisher: "Maine Judicial Branch (official)", url: MAINE_POSTJUDGMENT_CHART_URL, confidence: "high", method: "derived_me_1602_c_official_judicial_chart", calculation: MAINE_POSTJUDGMENT_CALCULATION,
    metadata: { official_statute_urls: [MAINE_POSTJUDGMENT_STATUTE_URL], correction_2025_url: MAINE_2025_CORRECTION_URL },
    notes: "The Maine Judicial Branch publishes 9.51% for judgments beginning to accrue in 2026. Under 14 M.R.S. §1602-C, the general rate is the prior calendar year's last-full-week average one-year Treasury CMT plus six points. A contract or note with an interest provision uses the greater of its rate and the statutory rate. Interest begins after entry and includes appeal, subject to continuance suspension and possible waiver. The statute does not specify calculator-grade compounding or day-count mechanics. Not legal advice." },
];
for (const st of STATES_3) {
  const sourceTier = classifyStateSource({ publisher: st.publisher, home_url: st.url });
  const verifiedOn = st.verifiedOn || EXP_VERIFIED_ON;
  STATE_SOURCES.push({ id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url, license: sourceTier === 'third_party_secondary' ? 'Statutory text is a government edict; third-party page terms may apply.' : 'Government edict — not subject to copyright.', robots_status: `curated ${st.kind} value; ${sourceTier === 'official_primary' ? 'official' : 'secondary'} source checked ${verifiedOn}`, retrieved_at: `${verifiedOn}T00:00:00Z` });
  FIXED.push({ entity: { slug: st.slug, name: `${st.name} Judgment Interest Rate`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States', metadata: { state: st.code, statute: st.statute, basis: st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable', ...(st.metadata || {}), ...(st.calculation ? { calculation: st.calculation } : {}) } }, value: st.value, value_text: st.value_text, effective_date: st.asof, source_id: st.srcId, source_url: st.url, confidence: st.confidence || (st.kind === 'fixed' ? 'high' : 'medium'), method: st.method || (st.kind === 'fixed' ? 'statute-fixed' : 'statute-variable'), notes: st.notes });
}



// ---- Per-state PREJUDGMENT interest rates, each verified 2026-07-09 against its official
// statute/agency/court source (multi-agent pass). Prejudgment interest differs sharply from
// post-judgment: availability turns on claim type (liquidated vs. unliquidated, contract vs. tort)
// and in some states is discretionary. fixed/discretionary => high; variable/same-as-post => medium.
const PREJUDG = [
  { code: "AL", name: "Alabama", slug: "alabama-prejudgment-rate", value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Ala. Code § 8-8-1", srcId: "al-prejud", srcName: "Alabama prejudgment interest (Ala. Code § 8-8-1)", publisher: "Alabama — alison.legislature.state.al.us", url: "https://alison.legislature.state.al.us/code-of-alabama?section=8-8-1",
    notes: "Prejudgment interest under Ala. Code § 8-8-1 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Alabama’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "AK", name: "Alaska", slug: "alaska-prejudgment-rate", value: 6.75, value_text: "6.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-02", statute: "AS 09.30.070", srcId: "ak-prejud", srcName: "Alaska prejudgment interest (AS 09.30.070)", publisher: "Alaska — public.courts.alaska.gov", url: "https://public.courts.alaska.gov/web/forms/docs/adm-505.pdf",
    notes: "Prejudgment interest under AS 09.30.070 — 6.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Alaska’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-02; verify at public.courts.alaska.gov. Not legal advice." },
  { code: "AZ", name: "Arizona", slug: "arizona-prejudgment-rate", value: 7.75, value_text: "7.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-08", statute: "A.R.S. § 44-1201(A), &", srcId: "az-prejud", srcName: "Arizona prejudgment interest (A.R.S. § 44-1201(A), &)", publisher: "Arizona — azleg.gov", url: "https://www.azleg.gov/ars/44/01201.htm",
    notes: "Prejudgment interest under A.R.S. § 44-1201(A), & — 7.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Arizona’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-08; verify at azleg.gov. Not legal advice." },
  { code: "AR", name: "Arkansas", slug: "arkansas-prejudgment-rate", value: 5.75, value_text: "5.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Ark. Code Ann. § 16-65-114(a)(1)", srcId: "ar-prejud", srcName: "Arkansas Act 995 of 2019 (§ 16-65-114)", publisher: "Arkansas General Assembly (official enacted act)", url: "https://www.arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2019R%2FPublic%2FACT995.pdf",
    notes: "Arkansas Act 995 of 2019 amended § 16-65-114 to use the Federal Reserve primary-credit rate plus 2 percentage points, subject to the constitutional maximum. The displayed 5.75% is a current formula value, not a permanent fixed rate. Confirm the current codified statute and benchmark before use. Not legal advice." },
  { code: "CA", name: "California", slug: "california-prejudgment-rate", value: 7, value_text: "7% / 10%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Cal. Const. art. XV §1 (7% tort/general); Cal. Civ. Code §3289(b) (10% contract)", srcId: "ca-prejud", srcName: "California prejudgment interest (Cal. Civ. Code sec. 3287)", publisher: "California — leginfo.legislature.ca.gov", url: "https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?sectionNum=3289.&lawCode=CIV",
    notes: "California has a DUAL prejudgment rate, both simple: 7% for tort and other non-contract claims (including personal injury) — the constitutional default legal rate (Cal. Const. art. XV §1; discretionary tort interest under Civ. Code §3288 also runs at this 7%); and 10% for breach of a contract that stipulates no rate (Civ. Code §3289(b)). Entitlement to interest on liquidated/certain damages is Civ. Code §3287. Verified against the statutes 2026-07-11. Not legal advice." },
  { code: "CO", name: "Colorado", slug: "colorado-prejudgment-rate", value: 8, value_text: "8% / 9%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "C.R.S. §5-12-102 (8% general); §13-21-101 (9% personal injury)", srcId: "co-prejud", srcName: "Colorado Revised Statutes, Titles 5 and 13", publisher: "Colorado General Assembly — Office of Legislative Legal Services (official)", url: "https://content.leg.colorado.gov/agencies/office-legislative-legal-services/2025-crs-titles-download",
    notes: "Colorado has TWO prejudgment rates, both compounded annually: 8% for general/contract claims and money or property wrongfully withheld (C.R.S. §5-12-102(1)(b)), and 9% for personal-injury actions (C.R.S. §13-21-101, from the date suit was filed, for actions filed on/after July 1, 1979). §5-12-102 opens \"Except as provided in section 13-21-101,\" carving personal-injury cases out to the 9% rate. Verified against the statute text 2026-07-09. This is PREjudgment interest, separate from Colorado’s post-judgment rate. Not legal advice." },
  { code: "CT", name: "Connecticut", slug: "connecticut-prejudgment-rate", value: 10, value_text: "10%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Conn. Gen. Stat. § 37-3a(a)", srcId: "ct-prejud", srcName: "Connecticut prejudgment interest (Conn. Gen. Stat. § 37-3a(a))", publisher: "Connecticut — portal.ct.gov", url: "https://portal.ct.gov/wcc/statutes-and-regulations/do-not-use-related-statutes/2021-related-statutes/37-3a",
    notes: "Prejudgment interest under Conn. Gen. Stat. § 37-3a(a) — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Connecticut’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "DE", name: "Delaware", slug: "delaware-prejudgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "6 Del. C. § 2301(a)", srcId: "de-prejud", srcName: "Delaware prejudgment interest (6 Del. C. § 2301(a))", publisher: "Delaware — delcode.delaware.gov", url: "https://delcode.delaware.gov/title6/c023/",
    notes: "Prejudgment interest under 6 Del. C. § 2301(a) — 8.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Delaware’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at delcode.delaware.gov. Not legal advice." },
  { code: "FL", name: "Florida", slug: "florida-prejudgment-rate", value: 8.06, value_text: "8.06%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Fla. Stat. § 55.03", srcId: "fl-prejud", srcName: "Florida prejudgment interest (Fla. Stat. § 55.03)", publisher: "Florida — myfloridacfo.com", url: "https://myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates",
    notes: "Prejudgment interest under Fla. Stat. § 55.03 — 8.06% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Florida’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at myfloridacfo.com. Not legal advice." },
  { code: "GA", name: "Georgia", slug: "georgia-prejudgment-rate", value: 7, value_text: "7% / 9.75%", kind: "fixed", method: "composite_ga_7_4_2_7_4_15_and_51_12_14", confidence: "high", asof: "2025-12-11", verifiedOn: "2026-07-19", statute: "O.C.G.A. §§7-4-2, 7-4-15, and 51-12-14", srcId: "ga-prejud", srcName: "Georgia prejudgment-interest rules and Federal Reserve prime benchmark", publisher: "Georgia General Assembly-authorized Code portal (LexisNexis); Federal Reserve prime benchmark via FRED", url: GEORGIA_CODE_PORTAL_URL, calculation: GEORGIA_PREJUDGMENT_CALCULATION,
    metadata: { official_statute_url: GEORGIA_CODE_PORTAL_URL, official_benchmark_url: GEORGIA_PRIME_SERIES_URL },
    notes: "Georgia has two prejudgment paths. A qualifying liquidated demand uses the 7% legal rate under O.C.G.A. §§7-4-2 and 7-4-15 from the legally relevant due or demand date. Qualifying unliquidated tort damages under §51-12-14 instead use the Federal Reserve prime rate on the 30th day after the last written notice plus three points; the current benchmark produces 9.75%. Both paths are treated as simple interest, but notice, entitlement, and the correct branch are case-specific. Not legal advice." },
  { code: "HI", name: "Hawaii", slug: "hawaii-prejudgment-rate", value: 10, value_text: "10%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "HRS 636-16", srcId: "hi-prejud", srcName: "Hawaii prejudgment interest (HRS 636-16)", publisher: "Hawaii — data.capitol.hawaii.gov", url: "https://data.capitol.hawaii.gov/sessions/session2017/HRS-Chapter-PDF's/HRS_0478.pdf",
    notes: "Prejudgment interest under HRS 636-16 — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Hawaii’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "ID", name: "Idaho", slug: "idaho-prejudgment-rate", value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Idaho Code §28-22-104(1) (12% general); §12-301 / §28-22-104(2) (tort)", srcId: "id-prejud", srcName: "Idaho prejudgment interest (Idaho Code 28-22-104(1))", publisher: "Idaho — legislature.idaho.gov", url: "https://legislature.idaho.gov/statutesrules/idstat/title28/t28ch22/sect28-22-104/",
    notes: "Idaho general/contract prejudgment interest is 12% simple (Idaho Code §28-22-104(1)). SEPARATELY, in tort actions for personal injury, property damage, or wrongful death where the claimant serves an offer of settlement, prejudgment interest accrues at the §28-22-104(2) variable rate (currently 8.875%) under §12-301 — not the 12% general rate. Verified 2026-07-11. Not legal advice." },
  { code: "IL", name: "Illinois", slug: "illinois-prejudgment-rate", value: 6, value_text: "6% / 5%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "735 ILCS 5/2-1303(c)", srcId: "il-prejud", srcName: "Illinois prejudgment interest (735 ILCS 5/2-1303(c))", publisher: "Illinois — ilga.gov", url: "https://ilga.gov/documents/legislation/ilcs/documents/081502050K2.htm",
    notes: "Prejudgment interest under 735 ILCS 5/2-1303(c) — 6% / 5% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Illinois’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "IN", name: "Indiana", slug: "indiana-prejudgment-rate", value: 8, value_text: "8%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "IC 24-4.6-1-103 (8% contract/account); IC 34-51-4-9 (tort, 6–10% discretionary)", srcId: "in-prejud", srcName: "Indiana prejudgment interest (Contract/liquidated: IC 24-4.6-1-103)", publisher: "Indiana — iga.in.gov", url: "https://iga.in.gov/laws/2024/ic/titles/24#24-4.6-1-103",
    notes: "Indiana prejudgment interest is 8% for contract, written-instrument, and account claims (IC 24-4.6-1-103). SEPARATELY, tort/personal-injury prejudgment interest is set at the court's discretion within a 6%–10% per-year band (simple) under IC 34-51-4-9 — the 8% figure does not apply to tort claims. Verified 2026-07-11. Not legal advice." },
  { code: "KS", name: "Kansas", slug: "kansas-prejudgment-rate", value: 10, value_text: "10% / 5.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-01", statute: "K.S.A. 16-201 (10% general); 16-201(b)/16-204(e)(1) (tort filed ≥7/1/2023)", srcId: "ks-prejud", srcName: "Kansas prejudgment interest (K.S.A. 16-201)", publisher: "Kansas — ksrevisor.gov", url: "https://ksrevisor.gov/statutes/chapters/ch16/016_002_0001.html",
    notes: "Kansas general/contract prejudgment interest is 10% fixed (K.S.A. 16-201(a)). For civil TORT actions filed on or after July 1, 2023, prejudgment interest is instead two percentage points below the K.S.A. 16-204(e)(1) judgment rate — currently 5.75% (7.75% − 2 for July 1, 2026–June 30, 2027), variable, recomputed each July 1 (K.S.A. 16-201(b)). Verified 2026-07-18. Not legal advice." },
  { code: "KY", name: "Kentucky", slug: "kentucky-prejudgment-rate", value: 8, value_text: "up to 8%", kind: "claim-dependent", method: "statute-fixed", confidence: "high", asof: "2018-07-14", verifiedOn: "2026-07-19", statute: "KRS 360.010(1) and Kentucky case law", srcId: "ky-prejud", srcName: "Kentucky legal rate and official appellate prejudgment-interest authority", publisher: "Kentucky General Assembly and Kentucky Court of Appeals (official)", url: KENTUCKY_KRS_360_010_URL, calculation: KENTUCKY_PREJUDGMENT_CALCULATION,
    metadata: { official_case_url: KENTUCKY_APPELLATE_PREJUDGMENT_URL },
    notes: "KRS 360.010(1) states an 8% annual legal rate, but 8% is not an automatic prejudgment award for every claim. Kentucky authority distinguishes liquidated claims from unliquidated damages; for an unliquidated claim, the court may award no interest or select a rate up to the legal rate, and may choose simple or compound treatment. A written agreement or claim-specific statute can control. The headline is a ceiling/reference rate, not a guaranteed recovery. Not legal advice." },
  { code: "LA", name: "Louisiana", slug: "louisiana-prejudgment-rate", value: 7.5, value_text: "7.5%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "La. R.S. 13:4202", srcId: "la-prejud", srcName: "Louisiana prejudgment interest (La. R.S. 13:4202)", publisher: "Louisiana — ofi.la.gov", url: "https://ofi.la.gov/legal/statutes-rules-policies-opinions/judicial-interest-rates/",
    notes: "Prejudgment interest under La. R.S. 13:4202 — 7.5% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Louisiana’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-01; verify at ofi.la.gov. Not legal advice." },
  { code: "ME", name: "Maine", slug: "maine-prejudgment-rate", value: 6.51, value_text: "6.51%", kind: "variable", method: "derived_me_1602_b_official_judicial_chart", confidence: "high", asof: "2026-01-01", verifiedOn: "2026-07-19", statute: "14 M.R.S. §1602-B", srcId: "me-prejud", srcName: "Maine prejudgment interest official annual chart (OTH-155)", publisher: "Maine Judicial Branch (official)", url: MAINE_PREJUDGMENT_CHART_URL, calculation: MAINE_PREJUDGMENT_CALCULATION,
    metadata: { official_statute_urls: [MAINE_PREJUDGMENT_STATUTE_URL], correction_2025_url: MAINE_2025_CORRECTION_URL },
    notes: "The Maine Judicial Branch publishes 6.51% for prejudgment interest beginning to accrue in 2026. Under 14 M.R.S. §1602-B, the general rate is the prior calendar year's last-full-week average one-year Treasury CMT plus three points. A contract or note with an interest provision uses its written rate; small claims generally exclude prejudgment interest unless based on such a writing. Accrual starts with qualifying sworn notice or, absent notice, filing, and can be suspended or waived. Prejudgment interest is excluded from the principal base for post-judgment interest. Not legal advice." },
  { code: "MD", name: "Maryland", slug: "maryland-prejudgment-rate", value: 6, value_text: "6%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Md. Const. Art. III, sec. 57", srcId: "md-prejud", srcName: "Maryland prejudgment interest (Md. Const. Art. III, sec. 57)", publisher: "Maryland — mgaleg.maryland.gov", url: "https://mgaleg.maryland.gov/Pubs/LegisLegal/2025-constitution-maryland-us.pdf",
    notes: "Prejudgment interest under Md. Const. Art. III, sec. 57 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Maryland’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "MA", name: "Massachusetts", slug: "massachusetts-prejudgment-rate", value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "M.G.L. c. 231, § 6B", srcId: "ma-prejud", srcName: "Massachusetts prejudgment interest (M.G.L. c. 231, § 6B)", publisher: "Massachusetts — malegislature.gov", url: "https://malegislature.gov/Laws/GeneralLaws/PartIII/TitleII/Chapter231/Section6B",
    notes: "Prejudgment interest under M.G.L. c. 231, § 6B — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Massachusetts’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "MI", name: "Michigan", slug: "michigan-prejudgment-rate", value: 4.959, value_text: "4.959%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-01", statute: "MCL 600.6013", srcId: "mi-prejud", srcName: "Michigan prejudgment interest (MCL 600.6013)", publisher: "Michigan — legislature.mi.gov", url: "https://www.legislature.mi.gov/Laws/MCL?objectName=mcl-600-6013",
    notes: "Prejudgment interest under MCL §600.6013 (Michigan interest runs from the filing of the complaint), COMPOUNDED ANNUALLY: the general rate is 1% above the six-month average of 5-year Treasury auctions, reset each Jan 1 / Jul 1 — currently 4.959% (period beginning July 1, 2026 = 1% + 3.959%). Judgments on a written instrument use a separate rate (the instrument's rate, capped at 13%, also compounded). Verify the current period at legislature.mi.gov. Not legal advice." },
  { code: "MN", name: "Minnesota", slug: "minnesota-prejudgment-rate", value: 4, value_text: "4% / 10%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Minn. Stat. § 549.09, subd. 1(b)–(c)", srcId: "mn-prejud", srcName: "Minnesota prejudgment interest (Minn. Stat. § 549.09, subd. 1(b))", publisher: "Minnesota — revisor.mn.gov", url: "https://www.revisor.mn.gov/statutes/cite/549.09",
    notes: "Minnesota preverdict interest under Minn. Stat. §549.09 subd. 1(b) is computed per subd. 1(c): the default rate (currently 4%) applies, but judgments/awards OVER $50,000 (other than certain categories) accrue 10% — the same two-tier split as post-judgment interest. Current value as of 2026-07-09; verify at revisor.mn.gov. Not legal advice." },
  { code: "MS", name: "Mississippi", slug: "mississippi-prejudgment-rate", value: null, value_text: "contract rate / court-set", kind: "case-specific", method: "court-or-contract-rate", confidence: "high", asof: "1989-07-01", verifiedOn: "2026-07-19", statute: "Miss. Code Ann. §§75-17-7 and 75-17-1", srcId: "ms-prejud", srcName: "Mississippi judgment and prejudgment interest rules (Miss. Code Ann. §§75-17-7 and 75-17-1)", publisher: "Mississippi Legislature-authorized Code portal (LexisNexis)", url: "https://www.lexisnexis.com/hottopics/mscode/", calculation: MISSISSIPPI_PREJUDGMENT_CALCULATION,
    metadata: { official_code_portal_url: "https://www.lexisnexis.com/hottopics/mscode/", appellate_crosscheck_url: "https://law.justia.com/cases/mississippi/court-of-appeals/2025/2024-ca-00023-coa.html" },
    notes: "Mississippi does not set one statewide prejudgment percentage. Under §75-17-7, a judgment founded on a sale or contract bears the rate supplied by the contract evidencing the debt. For all other judgments, the judge selects a fair annual rate and a fair start date, never before the complaint was filed; prejudgment interest can be included in that category. Section 75-17-1's 8% legal contract rate may inform some matters, but current appellate authority confirms that 8% is not mandatory and that the court can select another rate and method. Verify the claim and order; not legal advice." },
  { code: "MO", name: "Missouri", slug: "missouri-prejudgment-rate", value: 9, value_text: "9% non-tort; tort rule varies", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Mo. Rev. Stat. §§ 408.020, 408.040.3–.4", srcId: "mo-prejud", srcName: "Missouri prejudgment interest (Mo. Rev. Stat. § 408.040)", publisher: "Missouri — revisor.mo.gov", url: "https://revisor.mo.gov/main/OneSection.aspx?section=408.040",
    notes: "Liquidated or contract claims may bear 9% under § 408.020. For qualifying tort claims, § 408.040.3 awards prejudgment interest within the subsection that sets the tort judgment rate at the intended Federal Funds Rate plus 5 points. Section 408.040.4 separately says the judgment for prejudgment interest bears Federal Funds plus 3 points after entry. Because those are distinct stages, this reference record does not flatten the tort rule into one headline percentage. Not legal advice." },
  { code: "MT", name: "Montana", slug: "montana-prejudgment-rate", value: 10, value_text: "10% / 9.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "MCA 31-1-106 (10% legal, via 27-1-211); 27-1-210 (tort, prime+3%)", srcId: "mt-prejud", srcName: "Montana prejudgment interest (MCA 27-1-211)", publisher: "Montana — mca.legmt.gov", url: "https://mca.legmt.gov/bills/mca/title_0270/chapter_0010/part_0020/section_0110/0270-0010-0020-0110.html",
    notes: "Montana prejudgment interest is 10% simple for liquidated/contract-type claims — the legal rate (MCA §31-1-106), applied via the right-to-interest statute §27-1-211. TORT prejudgment interest is instead prime + 3% — currently 9.75% (variable, reset each Jan 1) under §27-1-210. Verified 2026-07-11. Not legal advice." },
  { code: "NE", name: "Nebraska", slug: "nebraska-prejudgment-rate", value: 12, value_text: "12% / 5.970%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-16", verifiedOn: "2026-07-19", statute: "Neb. Rev. Stat. §§45-103.02–45-104", srcId: "ne-prejud", srcName: "Nebraska prejudgment interest statutes (§§45-103.02–45-104)", publisher: "Nebraska Legislature (official)", url: "https://nebraskalegislature.gov/laws/laws-index/chap45-full.html", calculation: NEBRASKA_PREJUDGMENT_CALCULATION,
    notes: "Nebraska uses distinct prejudgment paths. Section 45-103.02(2) uses the 12% §45-104 rate on the unpaid balance of qualifying liquidated claims from the cause-of-action date. Section 45-103.02(1) uses the variable §45-103 judgment rate—currently 5.970%—for an unliquidated claim only when the plaintiff satisfies every written-offer, certified-mail, filing, timing, nonacceptance, and judgment-exceeds-offer condition. Section 45-103.04 excludes Chapter 42 actions and specified government-related claims. Verify entitlement and applicability; not legal advice." },
  { code: "NV", name: "Nevada", slug: "nevada-prejudgment-rate", value: 8.75, value_text: "8.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "NRS 99.040", srcId: "nv-prejud", srcName: "Nevada prejudgment interest (NRS 99.040)", publisher: "Nevada — leg.state.nv.us", url: "https://www.leg.state.nv.us/NRS/NRS-099.html",
    notes: "Prejudgment interest under NRS 99.040 — 8.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Nevada’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at leg.state.nv.us. Not legal advice." },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire-prejudgment-rate", value: 5.7, value_text: "5.7%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "RSA 336:1, II", srcId: "nh-prejud", srcName: "New Hampshire prejudgment interest (RSA 336:1, II)", publisher: "New Hampshire — courts.nh.gov", url: "https://www.courts.nh.gov/our-courts/superior-court/civil/civil-interest-rates",
    notes: "Prejudgment interest under RSA 336:1, II — 5.7% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from New Hampshire’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-01; verify at courts.nh.gov. Not legal advice." },
  { code: "NJ", name: "New Jersey", slug: "new-jersey-prejudgment-rate", value: 4.5, value_text: "4.5% / 6.5%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "N.J. Ct. R. 4:42-11(b)", srcId: "nj-prejud", srcName: "New Jersey prejudgment interest (N.J. Ct. R. 4:42-11(b))", publisher: "New Jersey — njcourts.gov", url: "https://www.njcourts.gov/sites/default/files/courts/civil/postprejudgmentrates.pdf",
    notes: "New Jersey tort prejudgment interest is calculated 'in the same amount and manner' as post-judgment interest (R. 4:42-11(b)): for 2026, 4.5% on amounts up to the Special Civil Part limit ($20,000) and 6.5% (base + 2%) above it. Simple interest. Verify the current Notice to the Bar at njcourts.gov. Not legal advice." },
  { code: "NM", name: "New Mexico", slug: "new-mexico-prejudgment-rate", value: 10, value_text: "10% / 15%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "NMSA 1978 §56-8-4(B) (≤10% discretionary); §56-8-3 (15% liquidated/contract)", srcId: "nm-prejud", srcName: "New Mexico prejudgment interest (NMSA 1978 §§ 56-8-3, 56-8-4)", publisher: "New Mexico Compilation Commission — NMOneSource (official)", url: "https://nmonesource.com/nmos/en/nav.do",
    notes: "New Mexico prejudgment interest splits by claim type: for unliquidated claims (e.g. personal injury) a court may award UP TO 10% in its discretion (NMSA 1978 §56-8-4(B)); for liquidated/contract 'money due by contract' claims, 15% applies as of right (§56-8-3). Verified 2026-07-11. Not legal advice." },
  { code: "NY", name: "New York", slug: "new-york-prejudgment-rate", value: 9, value_text: "9%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "N.Y. C.P.L.R. 5004", srcId: "ny-prejud", srcName: "New York prejudgment interest (N.Y. C.P.L.R. 5004)", publisher: "New York — nysenate.gov", url: "https://www.nysenate.gov/legislation/laws/CVP/5004",
    notes: "Prejudgment interest under N.Y. C.P.L.R. 5004 — 9% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from New York’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "NC", name: "North Carolina", slug: "north-carolina-prejudgment-rate", value: 8, value_text: "8%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "N.C. Gen. Stat. 24-5", srcId: "nc-prejud", srcName: "North Carolina prejudgment interest (N.C. Gen. Stat. 24-5)", publisher: "North Carolina — ncleg.net", url: "https://www.ncleg.net/EnactedLegislation/Statutes/PDF/BySection/Chapter_24/GS_24-5.pdf",
    notes: "Prejudgment interest under N.C. Gen. Stat. 24-5 — 8% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from North Carolina’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "ND", name: "North Dakota", slug: "north-dakota-prejudgment-rate", value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "N.D.C.C. § 32-03-04", srcId: "nd-prejud", srcName: "North Dakota prejudgment interest (N.D.C.C. § 32-03-04)", publisher: "North Dakota — ndlegis.gov", url: "https://ndlegis.gov/cencode/t32c03.pdf",
    notes: "Prejudgment interest under N.D.C.C. § 32-03-04 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from North Dakota’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "OH", name: "Ohio", slug: "ohio-prejudgment-rate", value: 7, value_text: "7%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "Ohio Rev. Code 1343.03", srcId: "oh-prejud", srcName: "Ohio prejudgment interest (Ohio Rev. Code 1343.03)", publisher: "Ohio — codes.ohio.gov", url: "https://codes.ohio.gov/ohio-revised-code/section-1343.03",
    notes: "Prejudgment interest under Ohio Rev. Code 1343.03 — 7% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Ohio’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-01; verify at codes.ohio.gov. Not legal advice." },
  { code: "OK", name: "Oklahoma", slug: "oklahoma-prejudgment-rate", value: 4.13, value_text: "4.13% / 6%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-02", statute: "12 O.S. §727.1 (4.13% personal injury); 23 O.S. §6 + 15 O.S. §266 (6% contract)", srcId: "ok-prejud", srcName: "Oklahoma prejudgment interest (12 O.S. Sec. 727.1)", publisher: "Oklahoma — oscn.net", url: "https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=551111",
    notes: "Oklahoma prejudgment interest splits by claim type: personal-injury / personal-rights verdicts bear a variable rate (currently 4.13%) set annually under 12 O.S. §727.1; contract / liquidated 'damages certain' claims bear 6% fixed (23 O.S. §6; 15 O.S. §266). Current PI value as of 2026-01-02; verify at oscn.net. Not legal advice." },
  { code: "OR", name: "Oregon", slug: "oregon-prejudgment-rate", value: 9, value_text: "9%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "ORS 82.010(1)(a)", srcId: "or-prejud", srcName: "Oregon prejudgment interest (ORS 82.010)", publisher: "Oregon Legislature (official)", url: "https://www.oregonlegislature.gov/bills_laws/ors/ors082.html",
    notes: "ORS 82.010 supplies a 9% rate for qualifying amounts, but the section does not itself create entitlement to prejudgment interest. Availability and the accrual date depend on the underlying claim and Oregon case law. Simple-interest reference only; confirm the controlling rule. Not legal advice." },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania-prejudgment-rate", value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "41 P.S. §202 (6% contract); 231 Pa. Code Rule 238 (tort delay damages, prime+1%)", srcId: "pa-prejud", srcName: "Pennsylvania prejudgment interest (41 P.S. Sec. 202)", publisher: "Pennsylvania — pacodeandbulletin.gov", url: "https://www.pacodeandbulletin.gov/secure/pacode/data/231/chapter200/s238.html",
    notes: "Pennsylvania prejudgment interest is 6% simple, as of right, on contract and other liquidated claims (41 P.S. §202). In tort actions for bodily injury, death, or property damage, the operative figure is instead Pa.R.C.P. 238 'delay damages' — the prime rate (first Wall Street Journal edition each January) + 1%, simple, not compounded (231 Pa. Code Rule 238), a variable rate. Verified 2026-07-11. Not legal advice." },
  { code: "RI", name: "Rhode Island", slug: "rhode-island-prejudgment-rate", value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "R.I. Gen. Laws § 9-21-10", srcId: "ri-prejud", srcName: "Rhode Island prejudgment interest (R.I. Gen. Laws § 9-21-10)", publisher: "Rhode Island — webserver.rilegislature.gov", url: "https://webserver.rilegislature.gov/Statutes/TITLE9/9-21/9-21-10.HTM",
    notes: "Prejudgment interest under R.I. Gen. Laws § 9-21-10 — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Rhode Island’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "SC", name: "South Carolina", slug: "south-carolina-prejudgment-rate", value: 8.75, value_text: "8.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "S.C. Code Ann. § 34-31-20(A)", srcId: "sc-prejud", srcName: "South Carolina prejudgment interest (S.C. Code Ann. § 34-31-20(A))", publisher: "South Carolina — scstatehouse.gov", url: "https://www.scstatehouse.gov/code/t34c031.php",
    notes: "Prejudgment interest under S.C. Code Ann. § 34-31-20(A) — 8.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from South Carolina’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "SD", name: "South Dakota", slug: "south-dakota-prejudgment-rate", value: 10, value_text: "10%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "SDCL 21-1-13.1", srcId: "sd-prejud", srcName: "South Dakota prejudgment interest (SDCL 21-1-13.1)", publisher: "South Dakota — sdlegislature.gov", url: "https://sdlegislature.gov/Statutes/21-1-13.1",
    notes: "Prejudgment interest under SDCL 21-1-13.1 — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from South Dakota’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at sdlegislature.gov. Not legal advice." },
  { code: "TN", name: "Tennessee", slug: "tennessee-prejudgment-rate", value: 10, value_text: "up to 10%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "medium", asof: "2026-07-09", statute: "Tenn. Code Ann. § 47-14-123", srcId: "tn-prejud", srcName: "Tennessee prejudgment interest (§ 47-14-123, discussed by Tennessee Court of Appeals)", publisher: "Tennessee Courts (official judicial source)", url: "https://www.tncourts.gov/sites/default/files/OPINIONS/TCA/PDF/014/willselectric.pdf",
    notes: "Tenn. Code Ann. § 47-14-123 permits a judge or jury to award prejudgment interest as an element of damages at a rate not exceeding 10% per year. The award and rate are discretionary; 10% is a ceiling, not an automatic default. Confirm the current statute and controlling case law. Not legal advice." },
  { code: "TX", name: "Texas", slug: "texas-prejudgment-rate", value: 6.75, value_text: "6.75%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "high", asof: "2026-07-01", verifiedOn: "2026-07-19", statute: "Tex. Fin. Code §§304.101–304.107", srcId: "tx-prejud", srcName: "Texas prejudgment interest (Finance Code Chapter 304 + OCCC rate)", publisher: "Texas Legislature and Office of Consumer Credit Commissioner (official)", url: "https://statutes.capitol.texas.gov/Docs/FI/pdf/FI.304.pdf", calculation: TEXAS_PREJUDGMENT_CALCULATION,
    notes: "For a judgment rendered in July 2026, Texas Finance Code §§304.101–304.104 use the 6.75% OCCC postjudgment rate for qualifying wrongful-death, personal-injury, and property-damage prejudgment interest. It is simple interest from the statutory start date through the day before judgment. Settlement offers can reduce accrual, future damages are excluded, condemnation and common-law claims follow separate branches. Verify applicability; not legal advice." },
  { code: "UT", name: "Utah", slug: "utah-prejudgment-rate", value: 10, value_text: "10% / 8.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Utah Code §15-1-1(2) (10% general); §78B-5-824 (PI special damages, prime+2%)", srcId: "ut-prejud", srcName: "Utah prejudgment interest (Utah Code Ann. 15-1-1(2))", publisher: "Utah — le.utah.gov", url: "https://le.utah.gov/xcode/Title15/Chapter1/15-1-S1.html",
    notes: "Utah general/contract prejudgment interest is 10% fixed (Utah Code §15-1-1(2)). For personal-injury actions (causes arising on/after July 1, 2014), prejudgment interest on SPECIAL damages is instead prime + 2% (5% floor, 10% cap) — currently 8.75%, simple — under §78B-5-824. Current PI value as of July 2026; verify at le.utah.gov. Not legal advice." },
  { code: "VT", name: "Vermont", slug: "vermont-prejudgment-rate", value: 12, value_text: "12%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "9 V.S.A. § 41a(a)", srcId: "vt-prejud", srcName: "Vermont prejudgment interest (9 V.S.A. § 41a(a))", publisher: "Vermont — legislature.vermont.gov", url: "https://legislature.vermont.gov/statutes/section/09/004/00041a",
    notes: "Prejudgment interest under 9 V.S.A. § 41a(a) — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Vermont’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "VA", name: "Virginia", slug: "virginia-prejudgment-rate", value: 6, value_text: "6%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Va. Code Ann. § 8.01-382", srcId: "va-prejud", srcName: "Virginia prejudgment interest (Va. Code Ann. § 8.01-382)", publisher: "Virginia — law.lis.virginia.gov", url: "https://law.lis.virginia.gov/vacode/title8.01/chapter13/section8.01-382/",
    notes: "Prejudgment interest under Va. Code Ann. § 8.01-382 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Virginia’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "WA", name: "Washington", slug: "washington-prejudgment-rate", value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "RCW 19.52.010(1)", srcId: "wa-prejud", srcName: "Washington prejudgment interest (RCW 19.52.010(1))", publisher: "Washington — app.leg.wa.gov", url: "https://app.leg.wa.gov/rcw/default.aspx?cite=19.52.010",
    notes: "Prejudgment interest under RCW 19.52.010(1) — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Washington’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "WV", name: "West Virginia", slug: "west-virginia-prejudgment-rate", value: 6.25, value_text: "6.25%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "W. Va. Code § 56-6-31(b)", srcId: "wv-prejud", srcName: "West Virginia prejudgment interest (W. Va. Code § 56-6-31(b))", publisher: "West Virginia — code.wvlegislature.gov", url: "https://code.wvlegislature.gov/56-6-31/",
    notes: "Prejudgment interest under W. Va. Code § 56-6-31(b) — 6.25% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from West Virginia’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at code.wvlegislature.gov. Not legal advice." },
  { code: "WI", name: "Wisconsin", slug: "wisconsin-prejudgment-rate", value: 5, value_text: "5%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Wis. Stat. 138.04", srcId: "wi-prejud", srcName: "Wisconsin prejudgment interest (Wis. Stat. 138.04)", publisher: "Wisconsin — docs.legis.wisconsin.gov", url: "https://docs.legis.wisconsin.gov/statutes/statutes/138/04",
    notes: "Prejudgment interest under Wis. Stat. 138.04 — 5% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Wisconsin’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "WY", name: "Wyoming", slug: "wyoming-prejudgment-rate", value: 7, value_text: "7%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Wyo. Stat. Ann. Sec. 40-14-106(e)", srcId: "wy-prejud", srcName: "Wyoming prejudgment interest (Wyo. Stat. Ann. Sec. 40-14-106(e))", publisher: "Wyoming — wyoleg.gov", url: "https://wyoleg.gov/statutes/compress/title40.pdf",
    notes: "Prejudgment interest under Wyo. Stat. Ann. Sec. 40-14-106(e) — 7% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Wyoming’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
  { code: "DC", name: "D.C.", slug: "dc-prejudgment-rate", value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "D.C. Code § 15-108", srcId: "dc-prejud", srcName: "D.C. prejudgment interest (D.C. Code § 15-108)", publisher: "D.C. — code.dccouncil.gov", url: "https://code.dccouncil.gov/us/dc/council/code/sections/15-108",
    notes: "Prejudgment interest under D.C. Code § 15-108 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from D.C.’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice." },
];
for (const st of PREJUDG) {
  const sourceTier = classifyStateSource({ publisher: st.publisher, home_url: st.url });
  const verifiedOn = st.verifiedOn || '2026-07-09';
  STATE_SOURCES.push({ id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url, license: sourceTier === 'third_party_secondary' ? 'Statutory text is a government edict; third-party page terms may apply.' : 'Government edict — not subject to copyright.', robots_status: `curated ${st.kind} prejudgment value; ${sourceTier === 'official_primary' ? 'official' : 'secondary'} source checked ${verifiedOn}`, retrieved_at: `${verifiedOn}T00:00:00Z` });
  FIXED.push({ entity: { slug: st.slug, name: `${st.name} Prejudgment Interest Rate`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States — Prejudgment', metadata: { state: st.code, statute: st.statute, basis: st.method, metric: 'prejudgment', kind: st.kind, ...(st.metadata || {}), ...(st.calculation ? { calculation: st.calculation } : {}) } }, value: st.value, value_text: st.value_text, effective_date: st.asof, source_id: st.srcId, source_url: st.url, confidence: st.confidence, method: st.method, notes: st.notes });
}

const IOWA_POSTJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The monthly Judicial Branch selections, rate-lock rule, daily-computation direction, and major statutory branches are structured. The statute does not fully specify the day-count denominator, partial-payment allocation, amended-judgment treatment, or every supported exception.',
  rate_behavior: 'fixed_at_judgment',
  rate_schedule: 'monthly_state_court_administration_notice',
  compounding: 'simple',
  day_count: 'computed_daily_denominator_not_specified_in_section_668_13',
  history_start: IOWA_CURATED_HISTORY_START,
  curated_history_complete_through: IOWA_CURATED_HISTORY_COMPLETE_THROUGH,
  older_official_scan_url: IOWA_HISTORY_1982_2000_PDF_URL,
  current_value_status: 'official_judicial_branch_table',
  current_period_monitored: true,
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: IOWA_HISTORY_VERIFIED_AT,
  branches: {
    general_noncontract: '§668.13(3) court-administered one-year Treasury CMT selection plus two percentage points',
    interest_bearing_contract: '§668.13(2) contract rate, subject to the §535.2 cap',
    accrual: '§668.13(5) computed daily to payment; §668.13(4) future damages begin at judgment',
    structured_judgment: '§668.13(6) uses annuity principles for periodic or structured payments',
    separate_statutory_paths: '§535.3 contains distinct workers-compensation and support-obligation rules',
  },
};

const IOWA_PREJUDGMENT_CALCULATION = {
  status: 'reference_only',
  source_tier: 'official_primary',
  reason: 'The §668.13 rate and base accrual window are verified, but entitlement, future-damage treatment, the separate §625.21 verdict-to-entry path, contract caps, structured judgments, day count, offsets, and payment allocation are not deterministic across every claim branch.',
  rate_behavior: 'rate_selected_at_judgment',
  rate_schedule: 'same_section_668_13_monthly_notice_as_postjudgment',
  compounding: 'simple',
  day_count: 'computed_daily_denominator_not_specified_in_section_668_13',
  current_value_status: 'official_judicial_branch_table',
  branches_complete: false,
  accrual_rule_verified: true,
  renderer_supported: false,
  rule_verified_at: IOWA_HISTORY_VERIFIED_AT,
};

const IA_ENTITY = {
  slug: 'iowa-judgment-rate',
  name: 'Iowa Judgment Interest Rate',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'US States',
  metadata: {
    state: 'IA',
    statute: 'Iowa Code §§535.3 and 668.13',
    basis: 'Iowa Judicial Branch monthly 1-year Treasury CMT selection + 2pp',
    official_statute_urls: [IOWA_STATUTE_535_URL, IOWA_STATUTE_668_13_URL],
    calculation: IOWA_POSTJUDGMENT_CALCULATION,
  },
};

const IA_PREJUDGMENT_ENTITY = {
  slug: 'iowa-prejudgment-rate',
  name: 'Iowa Prejudgment Interest Rate',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'US States — Prejudgment',
  metadata: {
    state: 'IA',
    statute: 'Iowa Code §§535.3, 625.21, and 668.13',
    basis: 'same §668.13 monthly rate selected at judgment',
    metric: 'prejudgment',
    kind: 'variable',
    official_statute_urls: [IOWA_STATUTE_535_URL, IOWA_STATUTE_668_13_URL],
    calculation: IOWA_PREJUDGMENT_CALCULATION,
  },
};

export function buildStateFixed({
  texasCurrent = null,
  nebraskaCurrent = null,
  georgiaPrimeChanges = [],
  georgiaRetrievedAt = null,
  daily = [],
  today = new Date().toISOString().slice(0, 10),
  retrievedAt = null,
} = {}) {
  const maineYear = Number(String(today).slice(0, 4));
  let maineDerived = null;
  if (daily.length) {
    const postjudgment = deriveMaineAnnualRateFromH15(daily, { year: maineYear, kind: 'postjudgment' });
    const prejudgment = deriveMaineAnnualRateFromH15(daily, { year: maineYear, kind: 'prejudgment' });
    if (!postjudgment || !prejudgment) {
      throw new Error(`Maine annual formula requires the complete last full H.15 week of ${maineYear - 1}`);
    }
    maineDerived = { postjudgment, prejudgment };
    for (const [kind, point] of Object.entries(maineDerived)) {
      const official = buildMaineOfficialHistory(kind).find((candidate) => candidate.effective_date === point.effective_date);
      if (official && Math.abs(official.value - point.value) > 1e-9) {
        throw new Error(`Maine ${kind} H.15 integrity check failed for ${point.effective_date}: official ${official.value_text}, derived ${point.value_text}`);
      }
    }
  }

  const entities = FIXED.map((f) => {
    const source = STATE_SOURCES.find((candidate) => candidate.id === f.source_id);
    return stateEntityWithSafety(f.entity, source);
  });
  const observations = FIXED.flatMap((f) => {
    const source = STATE_SOURCES.find((candidate) => candidate.id === f.source_id);
    if (!source?.retrieved_at) throw new Error(`${f.entity.slug}: source verification time is missing`);
    const baseObservation = {
      entitySlug: f.entity.slug,
      metric: 'annual_rate',
      value_numeric: f.value,
      value_text: f.value_text || `${f.value}%`,
      unit: 'percent_per_annum',
      effective_date: f.effective_date,
      source_id: f.source_id,
      source_url: f.source_url,
      // Curated state data is not fetched during a pipeline run. Use the recorded source-check time,
      // never the current build time, so freshness claims remain auditable.
      retrieved_at: source.retrieved_at,
      confidence: f.confidence || 'high',
      method: f.method || 'statute-fixed',
      notes: removeTruncatedFragments(f.notes),
    };

    if (f.entity.slug === 'georgia-judgment-rate') {
      const history = buildGeorgiaPrimeHistory(georgiaPrimeChanges.length ? georgiaPrimeChanges : undefined);
      return history.map((point) => ({
        ...baseObservation,
        value_numeric: point.value,
        value_text: point.value_text,
        effective_date: point.effective_date,
        source_url: point.source_url,
        retrieved_at: georgiaRetrievedAt || source.retrieved_at,
        confidence: 'high',
        method: 'derived_ga_7_4_12_prime_plus_3',
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : `For civil actions filed on or after July 1, 2003, O.C.G.A. §7-4-12(a) uses the Federal Reserve prime rate in force on the judgment date (${point.prime_rate.toFixed(2)}%) plus three percentage points, producing ${point.value_text}. The rate then stays fixed for that judgment; a written-contract rate can control under subsection (b). Not legal advice.`,
      }));
    }

    if (f.entity.slug === 'georgia-prejudgment-rate') {
      const history = buildGeorgiaPrimeHistory(georgiaPrimeChanges.length ? georgiaPrimeChanges : undefined);
      return history.map((point) => ({
        ...baseObservation,
        value_numeric: 7,
        value_text: `7% / ${point.value_text}`,
        effective_date: point.effective_date,
        source_url: point.source_url,
        retrieved_at: georgiaRetrievedAt || source.retrieved_at,
        confidence: 'high',
        method: 'composite_ga_7_4_2_7_4_15_and_51_12_14',
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : `Georgia's qualifying liquidated-demand path remains 7% under O.C.G.A. §§7-4-2 and 7-4-15. For a qualifying §51-12-14 unliquidated-tort demand whose benchmark-selection day fell in this period, Federal Reserve prime (${point.prime_rate.toFixed(2)}%) plus three points produced ${point.value_text}. Entitlement, notice, and the correct branch remain case-specific. Not legal advice.`,
      }));
    }

    if (f.entity.slug === 'texas-judgment-rate') {
      const monthly = buildTexasOfficialMonthlyHistory().map((point) => ({
        ...baseObservation,
        value_numeric: point.value,
        value_text: `${point.value}%`,
        effective_date: point.effective_date,
        source_url: point.source_url,
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : 'Official Texas OCCC monthly postjudgment rate for money judgments rendered during the indicated month. The governing formula and exceptions changed during the historical span; verify the law applicable to the judgment date. Not legal advice.',
      }));
      if (texasCurrent) {
        if (texasCurrent.entitySlug !== f.entity.slug || texasCurrent.source_id !== f.source_id) {
          throw new Error('Texas OCCC current observation has an unexpected entity or source id');
        }
        const byMonth = new Map(monthly.map((observation) => [observation.effective_date, observation]));
        byMonth.set(texasCurrent.effective_date, { ...texasCurrent, notes: removeTruncatedFragments(texasCurrent.notes) });
        return [...byMonth.values()].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
      }
      return monthly;
    }

    if (f.entity.slug === 'nebraska-judgment-rate') {
      const history = buildNebraskaOfficialHistory().map((point) => ({
        ...baseObservation,
        value_numeric: point.value,
        value_text: point.value_text,
        effective_date: point.effective_date,
        source_url: point.source_url,
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : 'Official Nebraska Judicial Branch judgment-interest rate effective on the indicated date. The governing Treasury-bill formula changed on July 20, 2002; use the law applicable when the judgment was entered. Other-law and agreed contract-rate exceptions may apply. Not legal advice.',
      }));
      if (nebraskaCurrent) {
        if (nebraskaCurrent.entitySlug !== f.entity.slug || nebraskaCurrent.source_id !== f.source_id) {
          throw new Error('Nebraska Judicial Branch current observation has an unexpected entity or source id');
        }
        const byDate = new Map(history.map((observation) => [observation.effective_date, observation]));
        byDate.set(nebraskaCurrent.effective_date, { ...nebraskaCurrent, notes: removeTruncatedFragments(nebraskaCurrent.notes) });
        return [...byDate.values()].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
      }
      return history;
    }

    if (f.entity.slug === 'kentucky-judgment-rate') {
      return buildKentuckyPostJudgmentHistory().map((point) => ({
        ...baseObservation,
        value_numeric: point.value,
        value_text: point.value_text,
        effective_date: point.effective_date,
        source_url: point.source_url,
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : 'The enrolled 2017 Kentucky Act shows the former 12% general judgment rate that applied before the 6% amendment took effect on June 29, 2017. KRS 360.040 contains separate child-support, written-obligation, and unliquidated-judgment branches. Verify the law applicable when the judgment was entered. Not legal advice.',
      }));
    }

    if (f.entity.slug === 'maine-judgment-rate' || f.entity.slug === 'maine-prejudgment-rate') {
      const kind = f.entity.slug === 'maine-judgment-rate' ? 'postjudgment' : 'prejudgment';
      const official = buildMaineOfficialHistory(kind).map((point) => ({
        ...baseObservation,
        value_numeric: point.value,
        value_text: point.value_text,
        effective_date: point.effective_date,
        source_url: point.source_url,
        notes: point.effective_date === f.effective_date
          ? baseObservation.notes
          : kind === 'postjudgment'
            ? `Official Maine Judicial Branch annual post-judgment rate: ${point.index_value.toFixed(2)}% prior-year one-year Treasury CMT plus six points equals ${point.value_text}. Contract/note, continuance, and waiver branches may alter the result. The 2025 row uses the court's corrected April 1, 2025 value. Not legal advice.`
            : `Official Maine Judicial Branch annual prejudgment rate: ${point.index_value.toFixed(2)}% prior-year one-year Treasury CMT plus three points equals ${point.value_text}. Contract/note, small-claims, accrual, continuance, and waiver branches may alter entitlement or the result. The 2025 row uses the court's corrected April 1, 2025 value. Not legal advice.`,
      }));
      const provisional = maineDerived?.[kind];
      if (provisional && provisional.effective_date > MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
        const provisionalSource = STATE_SOURCES.find((candidate) => candidate.id === 'me-h15-provisional');
        official.push({
          ...baseObservation,
          value_numeric: provisional.value,
          value_text: provisional.value_text,
          effective_date: provisional.effective_date,
          source_id: provisionalSource.id,
          source_url: provisional.source_url,
          retrieved_at: retrievedAt || provisionalSource.retrieved_at,
          confidence: 'medium',
          method: `derived_me_1602_${kind === 'postjudgment' ? 'c' : 'b'}_provisional_h15`,
          notes: `Provisional Maine ${kind === 'postjudgment' ? 'post-judgment' : 'prejudgment'} reference pending the next Judicial Branch chart: ${provisional.observation_count} official H.15 observations from ${provisional.week_start} through ${provisional.week_end} average ${provisional.index_value.toFixed(2)}%; adding ${kind === 'postjudgment' ? 'six' : 'three'} points produces ${provisional.value_text}. Verify against the new court chart before relying on it. Not legal advice.`,
        });
      }
      return official;
    }

    if (f.entity.slug === 'texas-prejudgment-rate' && texasCurrent) {
      return [{
        ...baseObservation,
        value_numeric: texasCurrent.value_numeric,
        value_text: texasCurrent.value_text,
        effective_date: texasCurrent.effective_date,
        source_url: texasCurrent.source_url,
        retrieved_at: texasCurrent.retrieved_at,
        confidence: 'high',
        method: 'derived_tx_304_103_from_occc_postjudgment',
        notes: `For a judgment rendered during ${texasCurrent.effective_date.slice(0, 7)}, Texas Finance Code §304.103 uses the OCCC postjudgment rate (${texasCurrent.value_text}) for qualifying statutory prejudgment interest. Sections 304.101–304.107 limit scope, set simple interest and the accrual window, and adjust for qualifying settlement offers; future damages are excluded. Verify applicability; not legal advice.`,
      }];
    }

    if (f.entity.slug === 'nebraska-prejudgment-rate' && nebraskaCurrent) {
      return [{
        ...baseObservation,
        value_numeric: 12,
        value_text: `12% / ${nebraskaCurrent.value_text}`,
        effective_date: nebraskaCurrent.effective_date,
        retrieved_at: nebraskaCurrent.retrieved_at,
        confidence: 'high',
        method: 'composite_ne_45_104_and_45_103_02',
        notes: `Nebraska uses distinct prejudgment paths. Qualifying liquidated claims use the 12% §45-104 rate under §45-103.02(2). Qualifying unliquidated claims use the current §45-103 judgment rate (${nebraskaCurrent.value_text} effective ${nebraskaCurrent.effective_date}) only after every settlement-offer condition in §45-103.02(1) is met. Section 45-103.04 contains exclusions. Verify entitlement and applicability; not legal advice.`,
      }];
    }

    return [baseObservation];
  });
  return { entities, observations };
}

export function buildIowa({ courtPoints = [], courtRetrievedAt = null } = {}) {
  const byDate = new Map(buildIowaOfficialHistory().map((point) => [point.effective_date, {
    ...point,
    source_id: 'ia-jud',
    confidence: 'high',
    method: 'derived_ia_668_13_official_court_table_plus_2',
    retrieved_at: IOWA_HISTORY_VERIFIED_AT,
    provenance: 'curated_official_table',
  }]));
  for (const point of courtPoints) {
    byDate.set(point.effective_date, {
      ...point,
      source_id: 'ia-jud',
      confidence: 'high',
      method: 'derived_ia_668_13_official_court_table_plus_2',
      retrieved_at: courtRetrievedAt || IOWA_HISTORY_VERIFIED_AT,
      provenance: 'live_official_table',
    });
  }

  const points = [...byDate.values()].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const observationsFor = (slug, prejudgment = false) => points.map((point) => {
    const notes = prejudgment
      ? `Iowa's §668.13 rate selected at judgment is also used for qualifying prejudgment interest. The Judicial Branch table selected a ${point.index_value}% one-year Treasury CMT for this date; adding two points gives ${point.value_text}. Interest generally begins at commencement, while future damages begin at judgment. Contract and other statutory paths may differ. Not legal advice.`
      : `Official Iowa Judicial Branch table selection: ${point.index_value}% one-year Treasury CMT plus two percentage points under Iowa Code §668.13 equals ${point.value_text}. The rate is selected at judgment and computed daily; a qualifying contract rate and other statutory branches can control. Not legal advice.`;
    return {
      entitySlug: slug,
      metric: 'annual_rate',
      value_numeric: point.value,
      value_text: point.value_text,
      unit: 'percent_per_annum',
      effective_date: point.effective_date,
      source_id: point.source_id,
      source_url: point.source_url,
      retrieved_at: point.retrieved_at,
      confidence: point.confidence,
      method: point.method,
      notes,
    };
  });

  const source = STATE_SOURCES.find((candidate) => candidate.id === 'ia-jud');
  return {
    entities: [stateEntityWithSafety(IA_ENTITY, source), stateEntityWithSafety(IA_PREJUDGMENT_ENTITY, source)],
    observations: [...observationsFor(IA_ENTITY.slug), ...observationsFor(IA_PREJUDGMENT_ENTITY.slug, true)],
  };
}
