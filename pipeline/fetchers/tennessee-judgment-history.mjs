// Curated Tennessee Administrative Office of the Courts judgment-interest history.
//
// Tenn. Code §47-14-121 makes the AOC's published six-month selections authoritative for
// practical lookup. Preserve those selections exactly instead of recomputing them from the DFI's
// weekly formula-rate table: the DFI dates are publication/effective dates and do not by themselves
// identify which weekly observation the AOC treated as the rate "for" June or December.

export const TENNESSEE_AOC_HISTORY_URL =
  'https://www.tncourts.gov/tennessee-judgment-interest-rates';
export const TENNESSEE_DFI_FORMULA_HISTORY_URL =
  'https://www.tn.gov/content/tn/tdfi/tdfi-how-do-i/info/formula-rate/formula-rate-history.html';
export const TENNESSEE_PUBLIC_CHAPTER_1043_URL =
  'https://www.capitol.tn.gov/Bills/107/CCRReports/CC0016.pdf';
export const TENNESSEE_HISTORY_VERIFIED_AT = '2026-09-03T16:49:24Z';
export const TENNESSEE_OFFICIAL_HISTORY_START = '2012-07-01';
export const TENNESSEE_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-12-31';

// [effective date, official AOC judgment rate]
const TENNESSEE_ROWS = Object.freeze([
  ['2012-07-01', 5.25, '5.25%'],
  ['2013-01-01', 5.25, '5.25%'],
  ['2013-07-01', 5.25, '5.25%'],
  ['2014-01-01', 5.25, '5.25%'],
  ['2014-07-01', 5.25, '5.25%'],
  ['2015-01-01', 5.25, '5.25%'],
  ['2015-07-01', 5.25, '5.25%'],
  ['2016-01-01', 5.5, '5.50%'],
  ['2016-07-01', 5.5, '5.50%'],
  ['2017-01-01', 5.75, '5.75%'],
  ['2017-07-01', 6.25, '6.25%'],
  ['2018-01-01', 6.5, '6.50%'],
  ['2018-07-01', 7, '7.00%'],
  ['2019-01-01', 7.45, '7.45%'],
  ['2019-07-01', 7.5, '7.50%'],
  ['2020-01-01', 6.75, '6.75%'],
  ['2020-07-01', 5.25, '5.25%'],
  ['2021-01-01', 5.25, '5.25%'],
  ['2021-07-01', 5.25, '5.25%'],
  ['2022-01-01', 5.25, '5.25%'],
  ['2022-07-01', 6.75, '6.75%'],
  ['2023-01-01', 9.5, '9.50%'],
  ['2023-07-01', 10.25, '10.25%'],
  ['2024-01-01', 10.5, '10.50%'],
  ['2024-07-01', 10.5, '10.50%'],
  ['2025-01-01', 9.5, '9.50%'],
  ['2025-07-01', 9.5, '9.50%'],
  ['2026-01-01', 8.75, '8.75%'],
  ['2026-07-01', 8.75, '8.75%'],
].map(Object.freeze));

export function buildTennesseeOfficialHistory() {
  return TENNESSEE_ROWS.map(([effective_date, value, value_text]) => ({
    effective_date,
    value,
    value_text,
    source_url: TENNESSEE_AOC_HISTORY_URL,
  }));
}

export function validateTennesseeOfficialHistory(history) {
  const errors = [];
  const expected = buildTennesseeOfficialHistory();
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));

  if (sorted.length !== expected.length) {
    errors.push(`official Tennessee history must contain ${expected.length} half-year points, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== TENNESSEE_OFFICIAL_HISTORY_START) {
    errors.push(`history must begin ${TENNESSEE_OFFICIAL_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  if (sorted.at(-1)?.effective_date !== '2026-07-01') {
    errors.push(`history must end 2026-07-01, found ${sorted.at(-1)?.effective_date || 'nothing'}`);
  }

  const seen = new Set();
  for (let index = 0; index < sorted.length; index += 1) {
    const point = sorted[index];
    const expectedPoint = expected[index];
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-(01|07)-01$/.test(point.effective_date)) {
      errors.push(`invalid Tennessee half-year boundary ${point.effective_date}`);
    }
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    if (!expectedPoint
      || point.effective_date !== expectedPoint.effective_date
      || point.value !== expectedPoint.value
      || point.value_text !== expectedPoint.value_text
      || point.source_url !== expectedPoint.source_url) {
      errors.push(`official AOC row mismatch at position ${index + 1}`);
    }
  }
  return errors;
}
