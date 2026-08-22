// Curated official judgment-interest histories. These tables are copied from the named state
// publications rather than recomputed from market data, so historical rounding and transition
// periods remain exactly as the agencies published them.

export const IDAHO_LEGAL_RATE_URL = 'https://sto.idaho.gov/Banking/Legal-Rate-of-Interest';
export const IDAHO_HISTORY_VERIFIED_AT = '2026-08-20T00:00:00Z';
export const IDAHO_OFFICIAL_HISTORY_START = '1986-07-01';
export const IDAHO_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2027-06-30';

const IDAHO_ROWS = [
  ['1986-07-01', 18, '18.000%'],
  ['1987-07-01', 11.875, '11.875%'],
  ['1988-07-01', 12.625, '12.625%'],
  ['1989-07-01', 13.375, '13.375%'],
  ['1990-07-01', 13.25, '13.250%'],
  ['1991-07-01', 11.375, '11.375%'],
  ['1992-07-01', 9.125, '9.125%'],
  ['1993-07-01', 8.5, '8.500%'],
  ['1994-07-01', 10.5, '10.500%'],
  ['1995-07-01', 10.875, '10.875%'],
  ['1996-07-01', 10.875, '10.875%'],
  ['1997-07-01', 10.75, '10.750%'],
  ['1998-07-01', 10.5, '10.500%'],
  ['1999-07-01', 10.125, '10.125%'],
  ['2000-07-01', 11.25, '11.250%'],
  ['2001-07-01', 8.75, '8.750%'],
  ['2002-07-01', 7.25, '7.250%'],
  ['2003-07-01', 6, '6.000%'],
  ['2004-07-01', 7.125, '7.125%'],
  ['2005-07-01', 8.375, '8.375%'],
  ['2006-07-01', 10.125, '10.125%'],
  ['2007-07-01', 10, '10.000%'],
  ['2008-07-01', 7.625, '7.625%'],
  ['2009-07-01', 5.625, '5.625%'],
  ['2010-07-01', 5.375, '5.375%'],
  ['2011-07-01', 5.25, '5.250%'],
  ['2012-07-01', 5.25, '5.250%'],
  ['2013-07-01', 5.25, '5.250%'],
  ['2014-07-01', 5.125, '5.125%'],
  ['2015-07-01', 5.375, '5.375%'],
  ['2016-07-01', 5.625, '5.625%'],
  ['2017-07-01', 6.25, '6.250%'],
  ['2018-07-01', 7.375, '7.375%'],
  ['2019-07-01', 7.125, '7.125%'],
  ['2020-07-01', 5.25, '5.250%'],
  ['2021-07-01', 5.125, '5.125%'],
  ['2022-07-01', 7.375, '7.375%'],
  ['2023-07-01', 10.25, '10.250%'],
  ['2024-07-01', 10.125, '10.125%'],
  ['2025-07-01', 9.125, '9.125%'],
  ['2026-07-01', 8.875, '8.875%'],
];

export function buildIdahoOfficialHistory() {
  return IDAHO_ROWS.map(([effective_date, value, value_text]) => ({
    effective_date,
    value,
    value_text,
    source_url: IDAHO_LEGAL_RATE_URL,
  }));
}

export const LOUISIANA_JUDICIAL_RATE_URL =
  'https://ofi.la.gov/legal/statutes-rules-policies-opinions/judicial-interest-rates/';
export const LOUISIANA_HISTORY_VERIFIED_AT = '2026-08-20T00:00:00Z';
export const LOUISIANA_OFFICIAL_HISTORY_START = '1980-09-12';
export const LOUISIANA_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-12-31';
export const LOUISIANA_UNDATED_OLDER_PERIOD = Object.freeze({
  label: 'Prior to September 12, 1980',
  value: 7,
  value_text: '7.00%',
  source_url: LOUISIANA_JUDICIAL_RATE_URL,
});

// OFI also publishes a 7% row for "Prior to September 12, 1980" without a beginning date. It is
// preserved above as context but deliberately excluded from dated observations rather than given a
// fabricated effective date.
const LOUISIANA_ROWS = [
  ['1980-09-12', 10, '10.00%'],
  ['1981-09-11', 12, '12.00%'],
  ['1988-01-01', 9.75, '9.75%'],
  ['1989-01-01', 11.5, '11.50%'],
  ['1990-01-01', 11.5, '11.50%'],
  ['1991-01-01', 11, '11.00%'],
  ['1992-01-01', 9, '9.00%'],
  ['1993-01-01', 7, '7.00%'],
  ['1994-01-01', 7, '7.00%'],
  ['1995-01-01', 8.75, '8.75%'],
  ['1996-01-01', 9.75, '9.75%'],
  ['1997-01-01', 9.25, '9.25%'],
  ['1997-08-01', 7.9, '7.90%'],
  ['1998-01-01', 7.6, '7.60%'],
  ['1999-01-01', 6.73, '6.73%'],
  ['2000-01-01', 7.285, '7.285%'],
  ['2001-01-01', 8.241, '8.241%'],
  ['2002-01-01', 5.75, '5.75%'],
  ['2003-01-01', 4.5, '4.50%'],
  ['2004-01-01', 5.25, '5.25%'],
  ['2005-01-01', 6, '6.00%'],
  ['2006-01-01', 8, '8.00%'],
  ['2007-01-01', 9.5, '9.50%'],
  ['2008-01-01', 8.5, '8.50%'],
  ['2009-01-01', 5.5, '5.50%'],
  ['2010-01-01', 3.75, '3.75%'],
  ['2011-01-01', 4, '4.00%'],
  ['2012-01-01', 4, '4.00%'],
  ['2013-01-01', 4, '4.00%'],
  ['2014-01-01', 4, '4.00%'],
  ['2015-01-01', 4, '4.00%'],
  ['2016-01-01', 4, '4.00%'],
  ['2017-01-01', 4.25, '4.25%'],
  ['2018-01-01', 5, '5.00%'],
  ['2019-01-01', 6, '6.00%'],
  ['2020-01-01', 5.75, '5.75%'],
  ['2021-01-01', 3.5, '3.50%'],
  ['2022-01-01', 3.5, '3.50%'],
  ['2023-01-01', 6.5, '6.50%'],
  ['2024-01-01', 8.75, '8.75%'],
  ['2025-01-01', 8.25, '8.25%'],
  ['2026-01-01', 7.5, '7.50%'],
];

export function buildLouisianaOfficialHistory() {
  return LOUISIANA_ROWS.map(([effective_date, value, value_text]) => ({
    effective_date,
    value,
    value_text,
    source_url: LOUISIANA_JUDICIAL_RATE_URL,
  }));
}
