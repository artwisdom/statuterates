// Curated official judgment-interest histories. These tables preserve the exact dates and values
// published by each state's judiciary; no missing year is inferred from a market benchmark.

export const NORTH_DAKOTA_JUDGMENT_HISTORY_URL =
  'https://www.ndcourts.gov/state-court-administration/interest-rate-on-judgments';
export const NORTH_DAKOTA_HISTORY_VERIFIED_AT = '2026-08-20T00:00:00Z';
export const NORTH_DAKOTA_OFFICIAL_HISTORY_START = '2006-01-01';
export const NORTH_DAKOTA_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-12-31';

const NORTH_DAKOTA_ROWS = [
  ['2006-01-01', 10, '10.0%'],
  ['2007-01-01', 11.5, '11.5%'],
  ['2008-01-01', 10.5, '10.5%'],
  ['2009-01-01', 7, '7.0%'],
  ['2010-01-01', 6.5, '6.5%'],
  ['2011-01-01', 6.5, '6.5%'],
  ['2012-01-01', 6.5, '6.5%'],
  ['2013-01-01', 6.5, '6.5%'],
  ['2014-01-01', 6.5, '6.5%'],
  ['2015-01-01', 6.5, '6.5%'],
  ['2016-01-01', 6.5, '6.5%'],
  ['2017-01-01', 6.5, '6.5%'],
  ['2018-01-01', 7.5, '7.5%'],
  ['2019-01-01', 8.5, '8.5%'],
  ['2020-01-01', 8, '8.0%'],
  ['2021-01-01', 6.5, '6.5%'],
  ['2022-01-01', 6.5, '6.5%'],
  ['2023-01-01', 10, '10%'],
  ['2024-01-01', 11.5, '11.50%'],
  ['2025-01-01', 11, '11.00%'],
  ['2026-01-01', 10, '10.00%'],
];

export function buildNorthDakotaOfficialHistory() {
  return NORTH_DAKOTA_ROWS.map(([effective_date, value, value_text]) => ({
    effective_date,
    value,
    value_text,
    source_url: NORTH_DAKOTA_JUDGMENT_HISTORY_URL,
  }));
}

export const WEST_VIRGINIA_JUDGMENT_HISTORY_URL =
  'https://www.courtswv.gov/legal-community/court-rules';
export const WEST_VIRGINIA_HISTORY_VERIFIED_AT = '2026-08-20T00:00:00Z';
export const WEST_VIRGINIA_OFFICIAL_HISTORY_START = '2007-01-02';
export const WEST_VIRGINIA_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-12-31';

const WV_PDF_ROOT = 'https://www.courtswv.gov/sites/default/pubfilesmnt/2026-02/';
const WEST_VIRGINIA_ROWS = [
  ['2007-01-02', 9.75, '9.75%', `${WV_PDF_ROOT}2007%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees_0.pdf`],
  ['2008-01-02', 8.25, '8.25%', `${WV_PDF_ROOT}2008%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2009-01-01', 7, '7.00%', `${WV_PDF_ROOT}2009%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2010-01-01', 7, '7.00%', `${WV_PDF_ROOT}2010%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2011-01-01', 7, '7.00%', `${WV_PDF_ROOT}2011%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2012-01-01', 7, '7.00%', `${WV_PDF_ROOT}2012%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2013-01-01', 7, '7.00%', `${WV_PDF_ROOT}2013%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2014-01-01', 7, '7.00%', `${WV_PDF_ROOT}2014%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2015-01-01', 7, '7.00%', `${WV_PDF_ROOT}2015%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2016-01-01', 7, '7.00%', `${WV_PDF_ROOT}2016%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees_0.pdf`],
  ['2017-01-01', 7, '7.00%', `${WV_PDF_ROOT}2017%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2018-01-01', 4.5, '4.5%', `${WV_PDF_ROOT}2018%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2019-01-01', 5.5, '5.5%', `${WV_PDF_ROOT}2019%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2020-01-01', 4.75, '4.75%', `${WV_PDF_ROOT}2020%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2021-01-01', 4, '4.00%', `${WV_PDF_ROOT}2021%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees_1.pdf`],
  ['2022-01-01', 4, '4.00%', `${WV_PDF_ROOT}2022%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees_0.pdf`],
  ['2023-01-01', 7, '7.00%', `${WV_PDF_ROOT}2023%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2024-01-01', 8, '8.00%', `${WV_PDF_ROOT}2024%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2025-01-01', 7, '7.00%', `${WV_PDF_ROOT}2025%20-%20Rate%20of%20Interest%20on%20Judgements%20and%20Decrees.pdf`],
  ['2026-01-01', 6.25, '6.25%', `${WV_PDF_ROOT}2026%20Interest%20Rates%20Order.pdf`],
];

export function buildWestVirginiaOfficialHistory() {
  return WEST_VIRGINIA_ROWS.map(([effective_date, value, value_text, source_url]) => ({
    effective_date,
    value,
    value_text,
    source_url,
  }));
}
