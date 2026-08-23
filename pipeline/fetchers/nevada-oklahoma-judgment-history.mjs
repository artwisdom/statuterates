// Curated official post-judgment histories for Nevada and Oklahoma.
//
// These rows are reference data, not payoff calculators. Nevada reprices the general statutory
// path every January 1 and July 1 and has contract, judgment-specified, other-law, consumer-form-
// debt, and future-damages branches. Oklahoma reprices each January 1 and adds previously accrued
// post-judgment interest to the interest-bearing balance, but contract, government, special-law,
// costs-and-fees, day-count, and payment-allocation branches remain calculator-incomplete.

export const NEVADA_HISTORY_VERIFIED_AT = '2026-08-22T00:00:00Z';
export const OKLAHOMA_HISTORY_VERIFIED_AT = '2026-08-22T00:00:00Z';

export const NEVADA_FID_HISTORY_URL =
  'https://fid.nv.gov/Resources/Fees_and_Prime_Interest_Rate/';
export const NEVADA_FID_2026_JULY_NOTICE_URL =
  'https://fid.nv.gov/uploadedFiles/fidnvgov/content/Resources/Prime%20Interest%20Rate%20July%201%2C%202026.pdf';
export const NEVADA_NRS_17_URL = 'https://www.leg.state.nv.us/nrs/nrs-017.html';
export const NEVADA_1987_ACT_URL =
  'https://www.leg.state.nv.us/Statutes/64th/Stats198704.html#Stats1987page940';
export const NEVADA_NRS_97B_URL = 'https://www.leg.state.nv.us/NRS/NRS-097B.html#NRS097BSec150';
export const NEVADA_TORRES_OPINION_URL =
  'https://nvcourts.gov/__data/assets/pdf_file/0013/11245/130_nevada_reports_pages_1-40.pdf';

export const OKLAHOMA_NOTICE_INDEX_URL =
  'https://www.oscn.net/applications/oscn/index.asp?ftdb=STOKIN&level=1';
export const OKLAHOMA_2026_NOTICE_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=551111';
export const OKLAHOMA_2025_HISTORY_NOTICE_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=547755';
export const OKLAHOMA_SECTION_727_1_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=440618';
export const OKLAHOMA_SECTION_727_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=440617';
export const OKLAHOMA_2013_NOTICE_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=468525';
export const OKLAHOMA_2013_AMENDED_NOTICE_URL =
  'https://www.oscn.net/applications/oscn/DeliverDocument.asp?CiteID=470813';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze(row)));

// [effective date, Nevada FID prime rate, general NRS 17.130 default rate (prime + 2 points)]
//
// The official FID table displays January 1, 1987 as "Not Available." That unavailable row is
// preserved separately below and is deliberately not assigned a synthetic percentage.
export const NEVADA_TUPLES = freezeRows([
  ['1987-07-01', 8.25, 10.25], ['1988-01-01', 8.75, 10.75],
  ['1988-07-01', 9, 11], ['1989-01-01', 10.5, 12.5],
  ['1989-07-01', 11, 13], ['1990-01-01', 10.5, 12.5],
  ['1990-07-01', 10, 12], ['1991-01-01', 10, 12],
  ['1991-07-01', 8.5, 10.5], ['1992-01-01', 6.5, 8.5],
  ['1992-07-01', 6.5, 8.5], ['1993-01-01', 6, 8],
  ['1993-07-01', 6, 8], ['1994-01-01', 6, 8],
  ['1994-07-01', 7.25, 9.25], ['1995-01-01', 8.5, 10.5],
  ['1995-07-01', 9, 11], ['1996-01-01', 8.5, 10.5],
  ['1996-07-01', 8.25, 10.25], ['1997-01-01', 8.25, 10.25],
  ['1997-07-01', 8.5, 10.5], ['1998-01-01', 8.5, 10.5],
  ['1998-07-01', 8.5, 10.5], ['1999-01-01', 7.75, 9.75],
  ['1999-07-01', 7.75, 9.75], ['2000-01-01', 8.25, 10.25],
  ['2000-07-01', 9.5, 11.5], ['2001-01-01', 9.5, 11.5],
  ['2001-07-01', 6.75, 8.75], ['2002-01-01', 4.75, 6.75],
  ['2002-07-01', 4.75, 6.75], ['2003-01-01', 4.25, 6.25],
  ['2003-07-01', 4, 6], ['2004-01-01', 4, 6],
  ['2004-07-01', 4.25, 6.25], ['2005-01-01', 5.25, 7.25],
  ['2005-07-01', 6.25, 8.25], ['2006-01-01', 7.25, 9.25],
  ['2006-07-01', 8.25, 10.25], ['2007-01-01', 8.25, 10.25],
  ['2007-07-01', 8.25, 10.25], ['2008-01-01', 7.25, 9.25],
  ['2008-07-01', 5, 7], ['2009-01-01', 3.25, 5.25],
  ['2009-07-01', 3.25, 5.25], ['2010-01-01', 3.25, 5.25],
  ['2010-07-01', 3.25, 5.25], ['2011-01-01', 3.25, 5.25],
  ['2011-07-01', 3.25, 5.25], ['2012-01-01', 3.25, 5.25],
  ['2012-07-01', 3.25, 5.25], ['2013-01-01', 3.25, 5.25],
  ['2013-07-01', 3.25, 5.25], ['2014-01-01', 3.25, 5.25],
  ['2014-07-01', 3.25, 5.25], ['2015-01-01', 3.25, 5.25],
  ['2015-07-01', 3.25, 5.25], ['2016-01-01', 3.5, 5.5],
  ['2016-07-01', 3.5, 5.5], ['2017-01-01', 3.75, 5.75],
  ['2017-07-01', 4.25, 6.25], ['2018-01-01', 4.5, 6.5],
  ['2018-07-01', 5, 7], ['2019-01-01', 5.5, 7.5],
  ['2019-07-01', 5.5, 7.5], ['2020-01-01', 4.75, 6.75],
  ['2020-07-01', 3.25, 5.25], ['2021-01-01', 3.25, 5.25],
  ['2021-07-01', 3.25, 5.25], ['2022-01-01', 3.25, 5.25],
  ['2022-07-01', 4.75, 6.75], ['2023-01-01', 7.5, 9.5],
  ['2023-07-01', 8.25, 10.25], ['2024-01-01', 8.5, 10.5],
  ['2024-07-01', 8.5, 10.5], ['2025-01-01', 8, 10],
  ['2025-07-01', 7.5, 9.5], ['2026-01-01', 6.75, 8.75],
  ['2026-07-01', 6.75, 8.75],
]);

export const NEVADA_UNAVAILABLE_OFFICIAL_ROWS = freezeRows([
  ['1987-01-01', 'not_available'],
]);

export const NEVADA_TUPLES_SHA256 =
  '14454eb178bad294597fa8395fe273cba8b6a43ac124e4d1c6c252d8bf3b2366';
export const NEVADA_HISTORY_PROJECTION_SHA256 =
  '48e7ddaaa6ebad1b06e1a2bc9522a79437ef5d07adabeebc2dc94c6b90735685';

// [effective date, Administrative Director-certified general post-judgment rate]
//
// The official history begins November 1, 1986. The 2013 notices also preserve procedural-law
// transitions on July 1 and November 1; because all three 2013 post-judgment periods publish 5.25%,
// those legal events are metadata below, not duplicate observations that imply false rate changes.
export const OKLAHOMA_TUPLES = freezeRows([
  ['1986-11-01', 11.65], ['1987-01-01', 10.03], ['1988-01-01', 9.95],
  ['1989-01-01', 10.92], ['1990-01-01', 12.35], ['1991-01-01', 11.71],
  ['1992-01-01', 9.58], ['1993-01-01', 7.42], ['1994-01-01', 6.99],
  ['1995-01-01', 8.31], ['1996-01-01', 9.55], ['1997-01-01', 9.15],
  ['1998-01-01', 9.22], ['1999-01-01', 8.87], ['2000-01-01', 8.73],
  ['2001-01-01', 9.95], ['2002-01-01', 7.48], ['2003-01-01', 5.63],
  ['2004-01-01', 5.01], ['2005-01-01', 7.25], ['2006-01-01', 9.25],
  ['2007-01-01', 10.25], ['2008-01-01', 9.25], ['2009-01-01', 5.25],
  ['2010-01-01', 5.25], ['2011-01-01', 5.25], ['2012-01-01', 5.25],
  ['2013-01-01', 5.25], ['2014-01-01', 5.25], ['2015-01-01', 5.25],
  ['2016-01-01', 5.5], ['2017-01-01', 5.75], ['2018-01-01', 6.5],
  ['2019-01-01', 7.5], ['2020-01-01', 6.75], ['2021-01-01', 5.25],
  ['2022-01-01', 5.25], ['2023-01-01', 9.5], ['2024-01-01', 10.5],
  ['2025-01-01', 9.5], ['2026-01-01', 8.75],
]);

export const OKLAHOMA_2013_REGIME_EVENTS = freezeRows([
  ['2013-01-01', 'original_2013_notice_period_begins', 5.25],
  ['2013-07-01', 'amended_notice_2004_section_727_1_period_begins', 5.25],
  ['2013-11-01', 'reenacted_section_727_1_current_formula_period_begins', 5.25],
]);

export const OKLAHOMA_TUPLES_SHA256 =
  '80f9edae54eae46d9ec2299144a83e142496f6fc1b93557f4bd5d70ecf50e900';
export const OKLAHOMA_HISTORY_PROJECTION_SHA256 = OKLAHOMA_TUPLES_SHA256;

const cleanPercent = (value) => `${value.toFixed(2).replace(/\.?0+$/, '')}%`;

export function buildNevadaOfficialHistory() {
  const rows = NEVADA_TUPLES.map(([effective_date, prime_rate, value]) => {
    if (Math.abs(value - (prime_rate + 2)) > 1e-9) {
      throw new Error(`Nevada history formula mismatch at ${effective_date}`);
    }
    return {
      effective_date,
      prime_rate,
      value,
      value_text: cleanPercent(value),
      source_url: effective_date === '2026-07-01'
        ? NEVADA_FID_2026_JULY_NOTICE_URL
        : NEVADA_FID_HISTORY_URL,
    };
  });
  if (rows.length !== 79 || rows[0].effective_date !== '1987-07-01'
      || rows.at(-1).effective_date !== '2026-07-01') {
    throw new Error('Nevada official history boundary or count changed');
  }
  return rows;
}

export function buildOklahomaOfficialHistory() {
  const rows = OKLAHOMA_TUPLES.map(([effective_date, value]) => ({
    effective_date,
    value,
    value_text: cleanPercent(value),
    source_url: effective_date === '2026-01-01'
      ? OKLAHOMA_2026_NOTICE_URL
      : OKLAHOMA_2025_HISTORY_NOTICE_URL,
  }));
  if (rows.length !== 41 || rows[0].effective_date !== '1986-11-01'
      || rows.at(-1).effective_date !== '2026-01-01') {
    throw new Error('Oklahoma official history boundary or count changed');
  }
  return rows;
}
