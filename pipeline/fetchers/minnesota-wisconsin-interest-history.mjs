// Curated official judgment-interest histories for Minnesota and Wisconsin.
//
// These rows are reference data, not payoff calculators. Minnesota has annual-reset, fixed-at-entry,
// family-court, public-party, child-support, tax, arbitration, and condemnation branches. Wisconsin
// fixes the published half-year rate at entry, but calculator-grade day count, compounding, payment
// allocation, and every superseding statutory branch have not been verified.

export const MINNESOTA_HISTORY_VERIFIED_AT = '2026-08-22T23:11:04Z';
export const WISCONSIN_HISTORY_VERIFIED_AT = '2026-08-22T23:11:04Z';

export const MINNESOTA_STATUTE_549_09_URL = 'https://www.revisor.mn.gov/statutes/cite/549.09';
export const MINNESOTA_STATUTE_548_091_URL = 'https://www.revisor.mn.gov/statutes/cite/548.091';
export const MINNESOTA_CURRENT_RULE_URL = 'https://www.revisor.mn.gov/court_rules/rule/msinte/';
export const MINNESOTA_HISTORY_1990_2008_URL =
  'https://mncourts.gov/_media/migration/scao_library/1990-2008-interest-rates.pdf';
export const MINNESOTA_HISTORY_2009_2015_URL =
  'https://mncourts.gov/_media/migration/scao_library/2009-2015-interest-rates-on-state-court-judgements.pdf';
export const MINNESOTA_HISTORY_2016_2026_URL =
  'https://mncourts.gov/_media/migration/ciomedialibrary/news-and-public-notices/2026-Interest-Rates-on-State-Court-Judgements.pdf';
export const MINNESOTA_JUDGMENT_FAQ_URL =
  'https://mncourts.gov/_media/migration/ciomedialibrary/news-and-public-notices/2026-Judgement-Interest-FAQs-rev-2025.pdf';
export const MINNESOTA_PRE_1990_HISTORY_URL =
  'https://mncourts.gov/_media/migration/scao_library/documents/interest_1980.pdf';

export const WISCONSIN_STATUTE_815_05_URL =
  'https://docs.legis.wisconsin.gov/document/statutes/815.05(8)';
export const WISCONSIN_HISTORY_URL =
  'https://www.wicourts.gov/services/public/selfhelp/docs/interestrate.pdf';
export const WISCONSIN_2011_ACT_69_URL =
  'https://docs.legis.wisconsin.gov/2011/related/acts/69';
export const WISCONSIN_APPELLATE_SCOPE_URL =
  'https://www.wicourts.gov/ca/opinion/DisplayDocument.html?content=html&seqNo=112662';
export const FEDERAL_RESERVE_H15_URL = 'https://www.federalreserve.gov/releases/h15/';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze(row)));

// [period start, published general rate, qualifying >$50,000 rate, published child-support cell]
//
// A null third value means the 10% branch was not yet effective. A null fourth value preserves a
// blank cell in the official 1990-2008 table; it does not mean zero. For 2009-2015, the court table
// states that child support follows section 549.09 subject to an 18% cap. Keeping that formula token
// avoids falsely flattening an entry-date and amount-dependent branch to one percentage.
export const MINNESOTA_BRANCH_TUPLES = freezeRows([
  ['1990-01-01', 7, null, null], ['1991-01-01', 7, null, null],
  ['1992-01-01', 5, null, null], ['1993-01-01', 4, null, 6],
  ['1994-01-01', 3, null, 5], ['1995-01-01', 6, null, 8],
  ['1996-01-01', 5, null, 7], ['1997-01-01', 5, null, 7],
  ['1998-01-01', 5, null, 7], ['1999-01-01', 4, null, 6],
  ['2000-01-01', 5, null, 7], ['2001-01-01', 6, null, 8],
  ['2002-01-01', 2, null, 4], ['2003-01-01', 4, null, 6],
  ['2004-01-01', 4, null, 6], ['2005-01-01', 4, null, 6],
  ['2006-01-01', 4, null, 6], ['2007-01-01', 5, null, 7],
  ['2008-01-01', 4, null, 4],
  ['2009-01-01', 4, null, 'follow_549_09_capped_18'],
  ['2009-08-01', 4, 10, 'follow_549_09_capped_18'],
  ['2010-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2011-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2012-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2013-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2014-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2015-01-01', 4, 10, 'follow_549_09_capped_18'],
  ['2016-01-01', 4, 10, 4], ['2017-01-01', 4, 10, 4],
  ['2018-01-01', 4, 10, 4], ['2019-01-01', 4, 10, 4],
  ['2020-01-01', 4, 10, 4], ['2021-01-01', 4, 10, 4],
  ['2022-01-01', 4, 10, 4], ['2022-08-01', 4, 10, 0],
  ['2023-01-01', 5, 10, 0], ['2024-01-01', 5, 10, 0],
  ['2025-01-01', 4, 10, 0], ['2026-01-01', 4, 10, 0],
]);

export const MINNESOTA_SCOPE_EVENTS = freezeRows([
  ['2009-08-01', 'qualifying_over_50000_10_percent_branch_begins'],
  ['2010-04-16', 'state_or_political_subdivision_excluded_from_10_percent_branch'],
  ['2015-08-01', 'family_court_action_excluded_from_10_percent_branch'],
  ['2022-08-01', 'child_support_zero_percent_branch_begins'],
]);

export const MINNESOTA_BRANCH_TUPLES_SHA256 =
  '48332c43ffb05d1420da5297045ce32ee6b34d6e3202c2f5643eaecebb2e294c';
export const MINNESOTA_SCOPE_EVENTS_SHA256 =
  '652beacf7070be8b7122f08a231f4c61b30c85cc7b0f58a4400c02289607deda';
export const MINNESOTA_HISTORY_PROJECTION_SHA256 =
  '50a4df4216ce82d1ffa67f671c69f7e72be80ed0a62d1804ccb08a89eb510467';

// [effective date, official section 815.05(8) annual rate]
export const WISCONSIN_TUPLES = freezeRows([
  ['2011-12-02', 4.25], ['2012-01-01', 4.25], ['2012-07-01', 4.25],
  ['2013-01-01', 4.25], ['2013-07-01', 4.25], ['2014-01-01', 4.25],
  ['2014-07-01', 4.25], ['2015-01-01', 4.25], ['2015-07-01', 4.25],
  ['2016-01-01', 4.5], ['2016-07-01', 4.5], ['2017-01-01', 4.75],
  ['2017-07-01', 5.25], ['2018-01-01', 5.5], ['2018-07-01', 6],
  ['2019-01-01', 6.5], ['2019-07-01', 6.5], ['2020-01-01', 5.75],
  ['2020-07-01', 4.25], ['2021-01-01', 4.25], ['2021-07-01', 4.25],
  ['2022-01-01', 4.25], ['2022-07-01', 5.75], ['2023-01-01', 8.5],
  ['2023-07-01', 9.25], ['2024-01-01', 9.5], ['2024-07-01', 9.5],
  ['2025-01-01', 8.5], ['2025-07-01', 8.5], ['2026-01-01', 7.75],
  ['2026-07-01', 7.75],
]);

export const WISCONSIN_TUPLES_SHA256 =
  '1f02d53d546911cf5312251ecbf51c56ce843e998ca29e3b55f5c62433f5c13a';
export const WISCONSIN_HISTORY_PROJECTION_SHA256 =
  'f59bcc964ee650acf47abfe7177df390735fdd864361820c998a07843cc6e116';

const cleanPercent = (value) => `${value.toFixed(2).replace(/\.?0+$/, '')}%`;

function minnesotaSourceFor(effectiveDate) {
  if (effectiveDate <= '2008-12-31') return MINNESOTA_HISTORY_1990_2008_URL;
  if (effectiveDate <= '2015-12-31') return MINNESOTA_HISTORY_2009_2015_URL;
  return MINNESOTA_HISTORY_2016_2026_URL;
}

export function buildMinnesotaOfficialHistory() {
  const rows = MINNESOTA_BRANCH_TUPLES.map(([
    effective_date,
    value,
    qualifying_over_50000_value,
    child_support_cell,
  ]) => ({
    effective_date,
    value,
    value_text: qualifying_over_50000_value === null
      ? cleanPercent(value)
      : `${cleanPercent(value)} / ${cleanPercent(qualifying_over_50000_value)}`,
    qualifying_over_50000_value,
    child_support_cell,
    source_url: minnesotaSourceFor(effective_date),
  }));

  if (rows.length !== 39 || rows[0].effective_date !== '1990-01-01'
      || rows.at(-1).effective_date !== '2026-01-01') {
    throw new Error('Minnesota official history boundary or count changed');
  }
  if (rows.find((row) => row.effective_date === '2009-01-01')?.qualifying_over_50000_value !== null
      || rows.find((row) => row.effective_date === '2009-08-01')?.qualifying_over_50000_value !== 10
      || rows.find((row) => row.effective_date === '2022-08-01')?.child_support_cell !== 0) {
    throw new Error('Minnesota official branch transition changed');
  }
  return rows;
}

export function buildWisconsinOfficialHistory() {
  const rows = WISCONSIN_TUPLES.map(([effective_date, value]) => ({
    effective_date,
    value,
    value_text: cleanPercent(value),
    source_url: WISCONSIN_HISTORY_URL,
  }));
  if (rows.length !== 31 || rows[0].effective_date !== '2011-12-02'
      || rows.at(-1).effective_date !== '2026-07-01') {
    throw new Error('Wisconsin official history boundary or count changed');
  }
  return rows;
}

// Reference lookup only: this selects the published rate attached at entry; it does not calculate
// accrued interest, payments, or a payoff. Pre-Act-69 entries remain outside the machine history.
export function findPublishedWisconsinRateForEntryDate(entryDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) return null;
  if (entryDate < '2011-12-02') return null;
  if (entryDate < '2012-01-01') return buildWisconsinOfficialHistory()[0];

  const year = entryDate.slice(0, 4);
  const month = Number(entryDate.slice(5, 7));
  const selectedDate = `${year}-${month <= 6 ? '01-01' : '07-01'}`;
  return buildWisconsinOfficialHistory().find((row) => row.effective_date === selectedDate) || null;
}
