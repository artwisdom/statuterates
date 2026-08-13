// Iowa Judicial Branch one-year Treasury CMT selections used by Iowa Code §668.13.
//
// IMPORTANT: these are monthly court-table selections, not weekly H.15 averages. The judgment
// interest rate is the selected index value plus two percentage points. The 2001-2017 points were
// transcribed from the Judicial Branch's official PDF and every PDF page was visually checked. The
// 2018-2026 points were transcribed from the official Judicial Branch HTML table and rechecked live
// through August 2026. Two obvious source-format typos are normalized: 3/5/2012 in the 2002 column is stored
// as 2002-03-05, and 4//23/2018 is stored as 2018-04-23.

export const IOWA_JUDICIAL_TABLE_URL = 'https://www.iowacourts.gov/iowa-courts/district-court/post-judgment-interest-table/';
export const IOWA_HISTORY_1982_2000_PDF_URL = 'https://www.iowacourts.gov/static/media/cms/post_judgment_interest_rate_table_1_A923F446F2AE4.pdf';
export const IOWA_HISTORY_2001_2017_PDF_URL = 'https://www.iowacourts.gov/static/media/cms/post_judgment_interest_rate_table_2_D0E292E4AF18C.pdf';
export const IOWA_STATUTE_668_13_URL = 'https://www.legis.iowa.gov/docs/code/668.13.pdf';
export const IOWA_STATUTE_535_URL = 'https://www.legis.iowa.gov/docs/code/535.pdf';
export const IOWA_HISTORY_VERIFIED_AT = '2026-08-13T00:00:00Z';

// The older 1982-2000 PDF is an image-only scan with several damaged/handwritten rows. It remains
// linked as an official source but is deliberately not converted into calculator data until each
// row receives a second manual verification. Publishing a shorter exact history is safer than
// silently turning OCR guesses into legal-rate data.
export const IOWA_CURATED_HISTORY_START = '2001-03-05';
export const IOWA_CURATED_HISTORY_COMPLETE_THROUGH = '2026-08-10';

function parseRows(text) {
  return text.trim().split(/\s+/).map((token) => {
    const separator = token.lastIndexOf(':');
    if (separator < 1) throw new Error(`Invalid Iowa history token: ${token}`);
    const effective_date = token.slice(0, separator);
    const indexText = token.slice(separator + 1);
    const index_value = Number(indexText);
    const value = Math.round((index_value + 2) * 1000) / 1000;
    return { effective_date, index_value, value };
  });
}

const OFFICIAL_INDEX_ROWS = parseRows(`
2001-03-05:4.442 2001-07-10:4.586 2001-08-07:4.554 2001-09-04:4.279 2001-10-02:3.804 2001-11-14:3.481 2001-12-13:3.408
2002-01-14:3.617 2002-02-13:3.563 2002-03-05:3.369 2002-04-12:3.704 2002-05-08:3.609 2002-06-04:3.518 2002-07-05:3.333 2002-08-09:3.097 2002-09-04:2.8 2002-10-08:2.619 2002-11-12:2.606 2002-12-06:2.532
2003-01-10:2.49 2003-02-10:2.458 2003-03-22:2.369 2003-04-11:2.303 2003-05-09:2.37 2003-06-09:2.131 2003-07-07:1.01 2003-08-06:1.12 2003-09-03:1.31 2003-10-09:1.24 2003-11-12:1.25 2003-12-08:1.34
2004-01-05:1.31 2004-02-03:1.24 2004-03-08:1.24 2004-04-06:1.19 2004-05-11:1.43 2004-06-08:1.78 2004-07-08:2.12 2004-08-05:2.1 2004-09-07:2.02 2004-10-08:2.12 2004-11-08:2.23 2004-12-08:2.5
2005-01-06:2.67 2005-02-08:2.86 2005-03-08:3.03 2005-04-07:3.3 2005-05-10:3.32 2005-06-08:3.33 2005-07-11:3.36 2005-08-08:3.64 2005-09-14:3.87 2005-10-06:3.85 2005-11-08:4.18 2005-12-06:4.33
2006-01-11:4.35 2006-02-14:4.45 2006-03-09:4.68 2006-04-10:4.77 2006-05-10:4.9 2006-06-08:5 2006-07-11:5.16 2006-08-08:5.22 2006-09-11:5.08 2006-10-09:4.97 2006-11-14:5.01 2006-12-15:5.01
2007-01-08:4.94 2007-02-12:5.06 2007-03-07:5.05 2007-04-11:4.92 2007-05-09:4.93 2007-06-11:4.82 2007-07-12:4.96 2007-08-14:4.96 2007-09-06:4.47 2007-10-09:4.14 2007-11-07:4.1 2007-12-12:3.5
2008-01-09:3.26 2008-02-11:2.71 2008-03-12:2.05 2008-04-09:1.54 2008-05-06:1.74 2008-06-11:2.06 2008-07-17:2.42 2008-08-18:2.28 2008-09-09:2.18 2008-10-08:1.91 2008-11-05:1.42 2008-12-09:1.07
2009-01-09:0.49 2009-02-09:0.44 2009-03-10:0.62 2009-04-08:0.64 2009-05-12:0.55 2009-06-09:0.5 2009-07-14:0.51 2009-08-11:0.48 2009-09-14:0.46 2009-10-20:0.4 2009-11-09:0.37 2009-12-16:0.31
2010-01-07:0.37 2010-02-10:0.32 2010-03-15:0.35 2010-04-09:0.4 2010-05-13:0.45 2010-06-11:0.37 2010-07-09:0.32 2010-08-17:0.29 2010-09-09:0.26 2010-10-14:0.26 2010-11-10:0.23 2010-12-20:0.25
2011-01-14:0.29 2011-02-08:0.27 2011-03-07:0.29 2011-04-05:0.26 2011-05-10:0.25 2011-06-07:0.19 2011-07-07:0.18 2011-08-10:0.19 2011-09-06:0.11 2011-10-11:0.1 2011-11-15:0.11 2011-12-16:0.11
2012-01-05:0.12 2012-02-13:0.12 2012-03-14:0.16 2012-04-06:0.19 2012-05-08:0.18 2012-06-08:0.19 2012-07-17:0.19 2012-08-08:0.19 2012-09-12:0.18 2012-10-08:0.17 2012-11-15:0.18 2012-12-14:0.18
2013-01-23:0.16 2013-02-08:0.15 2013-03-06:0.16 2013-04-08:0.15 2013-05-07:0.12 2013-06-06:0.12 2013-07-09:0.14 2013-08-06:0.12 2013-09-06:0.13 2013-10-11:0.12 2013-11-07:0.12 2013-12-06:0.12
2014-01-09:0.13 2014-02-14:0.12 2014-03-13:0.12 2014-04-09:0.13 2014-05-14:0.11 2014-06-19:0.10 2014-07-10:0.10 2014-08-13:0.11 2014-09-22:0.11 2014-10-09:0.11 2014-11-18:0.10 2014-12-22:0.13
2015-01-08:0.21 2015-02-12:0.20 2015-03-10:0.22 2015-04-08:0.25 2015-05-12:0.23 2015-06-09:0.24 2015-07-10:0.28 2015-08-10:0.28 2015-09-15:0.38 2015-10-08:0.37 2015-11-10:0.26 2015-12-11:0.48
2016-01-11:0.65 2016-02-22:0.54 2016-03-21:0.53 2016-04-12:0.66 2016-05-10:0.56 2016-06-13:0.59 2016-07-15:0.55 2016-08-09:0.51 2016-09-13:0.57 2016-10-11:0.59 2016-11-09:0.62 2016-12-07:0.82
2017-01-10:0.85 2017-02-08:0.79 2017-03-08:0.97 2017-04-11:1.08 2017-05-10:1.12 2017-06-12:1.19 2017-07-10:1.23 2017-08-21:1.24 2017-09-07:1.21 2017-10-09:1.35 2017-11-08:1.50 2017-12-18:1.70
2018-01-11:1.78 2018-02-22:2.01 2018-03-12:2.05 2018-04-23:2.21 2018-05-21:2.32 2018-06-12:2.24 2018-07-16:2.39 2018-08-27:2.44 2018-09-26:2.58 2018-10-08:2.63 2018-11-13:2.74 2018-12-11:2.68
2019-01-11:2.59 2019-02-12:2.54 2019-03-12:2.53 2019-04-09:2.43 2019-05-13:2.37 2019-06-11:1.97 2019-07-19:1.95 2019-08-13:1.78 2019-09-10:1.73 2019-10-11:1.59 2019-11-13:1.58 2019-12-10:1.57
2020-01-14:1.53 2020-02-11:1.49 2020-03-24:0.15 2020-04-10:0.25 2020-05-12:0.15 2020-06-09:0.18 2020-07-10:0.15 2020-08-11:0.14 2020-09-11:0.14 2020-10-09:0.13 2020-11-10:0.12 2020-12-23:0.09
2021-01-19:0.10 2021-02-09:0.06 2021-03-10:0.09 2021-04-12:0.06 2021-05-12:0.05 2021-06-11:0.05 2021-07-07:0.08 2021-08-11:0.08 2021-09-08:0.08 2021-10-12:0.10 2021-11-20:0.16 2021-12-08:0.28
2022-01-12:0.46 2022-02-15:1.13 2022-03-18:1.35 2022-04-13:1.78 2022-05-10:2.08 2022-06-20:2.88 2022-07-08:2.82 2022-08-12:3.26 2022-09-08:3.61 2022-10-20:4.50 2022-11-08:4.76 2022-12-08:4.73
2023-01-09:4.78 2023-02-07:4.79 2023-03-08:5.22 2023-04-10:4.51 2023-05-08:4.59 2023-06-08:5.20 2023-07-13:5.44 2023-08-09:5.30 2023-09-13:5.40 2023-10-09:5.39 2023-11-08:5.33 2023-12-13:5.14
2024-01-09:4.84 2024-02-12:4.83 2024-03-22:5.04 2024-04-09:5.05 2024-05-15:5.10 2024-06-12:5.16 2024-07-09:4.97 2024-08-12:4.48 2024-09-09:4.10 2024-10-09:4.24 2024-11-12:4.28 2024-12-09:4.23
2025-01-09:4.19 2025-02-07:4.17 2025-03-10:4.02 2025-04-09:3.86 2025-05-09:4.00 2025-06-09:4.08 2025-07-09:4.11 2025-08-11:3.92 2025-09-10:3.64 2025-10-07:3.64 2025-11-10:3.65 2025-12-09:3.61
2026-01-08:3.48 2026-02-09:3.44 2026-03-09:3.56 2026-04-07:3.72 2026-05-07:3.77 2026-06-08:3.88 2026-07-09:4.06 2026-08-10:4.06
`);

function sourceUrlFor(date) {
  return date < '2018-01-01' ? IOWA_HISTORY_2001_2017_PDF_URL : IOWA_JUDICIAL_TABLE_URL;
}

export function buildIowaOfficialHistory() {
  return OFFICIAL_INDEX_ROWS.map((point) => ({
    ...point,
    value_text: `${point.value}%`,
    source_url: sourceUrlFor(point.effective_date),
  }));
}

export function validateIowaOfficialHistory(history) {
  const errors = [];
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (sorted.length < 303) errors.push(`official history must contain at least 303 points, found ${sorted.length}`);
  if (sorted[0]?.effective_date !== IOWA_CURATED_HISTORY_START) {
    errors.push(`history must begin ${IOWA_CURATED_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  const seen = new Set();
  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.effective_date)) errors.push(`invalid date ${point.effective_date}`);
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
  }
  const anchors = new Map([
    ['2001-03-05', 6.442],
    ['2018-04-23', 4.21],
    ['2020-02-11', 3.49],
    ['2026-03-09', 5.56],
    ['2026-07-09', 6.06],
    ['2026-08-10', 6.06],
  ]);
  const byDate = new Map(sorted.map((point) => [point.effective_date, point.value]));
  for (const [date, expected] of anchors) {
    if (Math.abs((byDate.get(date) ?? Number.NaN) - expected) > 1e-9) {
      errors.push(`expected ${expected}% at ${date}`);
    }
  }
  return errors;
}
