// Georgia's current judgment-interest scheme uses the Federal Reserve bank prime loan rate on the
// legally relevant day plus three percentage points. FRED's PRIME series is purpose-built for this
// use: unlike a daily series, it contains the effective date of each actual prime-rate change.
//
// The current version of O.C.G.A. §7-4-12 applies to civil actions filed on or after July 1, 2003.
// Start the public history there, carrying forward the 4.00% prime rate that became effective on
// June 27, 2003. The separate live fetcher validates this complete baseline and may append later
// Federal Reserve changes without rewriting history.

export const GEORGIA_CODE_PORTAL_URL = 'https://www.lexisnexis.com/hottopics/gacode';
export const GEORGIA_PRIME_SERIES_URL = 'https://fred.stlouisfed.org/series/PRIME';
export const GEORGIA_PRIME_CSV_URL = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=PRIME&cosd=2003-06-01';
export const GEORGIA_HISTORY_VERIFIED_AT = '2026-07-19T00:00:00Z';
export const GEORGIA_CURRENT_SCHEME_START = '2003-07-01';
export const GEORGIA_CURATED_PRIME_COMPLETE_THROUGH = '2025-12-11';

const CURATED_PRIME_CHANGES = Object.freeze([
  ['2003-06-27', 4.00],
  ['2004-07-01', 4.25],
  ['2004-08-11', 4.50],
  ['2004-09-21', 4.75],
  ['2004-11-10', 5.00],
  ['2004-12-15', 5.25],
  ['2005-02-02', 5.50],
  ['2005-03-22', 5.75],
  ['2005-05-03', 6.00],
  ['2005-06-30', 6.25],
  ['2005-08-09', 6.50],
  ['2005-09-20', 6.75],
  ['2005-11-01', 7.00],
  ['2005-12-13', 7.25],
  ['2006-01-31', 7.50],
  ['2006-03-28', 7.75],
  ['2006-05-10', 8.00],
  ['2006-06-29', 8.25],
  ['2007-09-18', 7.75],
  ['2007-10-31', 7.50],
  ['2007-12-11', 7.25],
  ['2008-01-22', 6.50],
  ['2008-01-30', 6.00],
  ['2008-03-18', 5.25],
  ['2008-04-30', 5.00],
  ['2008-10-08', 4.50],
  ['2008-10-29', 4.00],
  ['2008-12-16', 3.25],
  ['2015-12-17', 3.50],
  ['2016-12-15', 3.75],
  ['2017-03-16', 4.00],
  ['2017-06-15', 4.25],
  ['2017-12-14', 4.50],
  ['2018-03-22', 4.75],
  ['2018-06-14', 5.00],
  ['2018-09-27', 5.25],
  ['2018-12-20', 5.50],
  ['2019-08-01', 5.25],
  ['2019-09-19', 5.00],
  ['2019-10-31', 4.75],
  ['2020-03-04', 4.25],
  ['2020-03-16', 3.25],
  ['2022-03-17', 3.50],
  ['2022-05-05', 4.00],
  ['2022-06-16', 4.75],
  ['2022-07-28', 5.50],
  ['2022-09-22', 6.25],
  ['2022-11-03', 7.00],
  ['2022-12-15', 7.50],
  ['2023-02-02', 7.75],
  ['2023-03-23', 8.00],
  ['2023-05-04', 8.25],
  ['2023-07-27', 8.50],
  ['2024-09-19', 8.00],
  ['2024-11-08', 7.75],
  ['2024-12-20', 7.50],
  ['2025-09-17', 7.25],
  ['2025-10-30', 7.00],
  ['2025-12-11', 6.75],
].map(([effective_date, value]) => Object.freeze({ effective_date, value })));

export function buildGeorgiaCuratedPrimeChanges() {
  return CURATED_PRIME_CHANGES.map((point) => ({ ...point }));
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateGeorgiaPrimeChanges(points, {
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const errors = [];
  const sorted = [...(points || [])].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const byDate = new Map();

  for (const point of sorted) {
    if (!isIsoDate(point.effective_date)) errors.push(`invalid prime-rate date ${point.effective_date}`);
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 25) {
      errors.push(`invalid prime rate ${point.value} at ${point.effective_date}`);
    }
    if (point.effective_date > today) errors.push(`future prime-rate date ${point.effective_date}`);
    if (byDate.has(point.effective_date)) errors.push(`duplicate prime-rate date ${point.effective_date}`);
    byDate.set(point.effective_date, point.value);
  }

  for (const expected of CURATED_PRIME_CHANGES) {
    const actual = byDate.get(expected.effective_date);
    if (actual === undefined) {
      errors.push(`missing verified prime-rate change ${expected.effective_date}`);
    } else if (Math.abs(actual - expected.value) > 1e-9) {
      errors.push(`prime rate at ${expected.effective_date} must remain ${expected.value.toFixed(2)}%, found ${actual}%`);
    }
  }

  if (sorted.at(-1)?.effective_date < GEORGIA_CURATED_PRIME_COMPLETE_THROUGH) {
    errors.push(`prime-rate history ends before ${GEORGIA_CURATED_PRIME_COMPLETE_THROUGH}`);
  }
  return errors;
}

export function buildGeorgiaPrimeHistory(points = buildGeorgiaCuratedPrimeChanges()) {
  const sorted = [...points]
    .filter((point) => isIsoDate(point.effective_date) && Number.isFinite(point.value))
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const opening = sorted.filter((point) => point.effective_date <= GEORGIA_CURRENT_SCHEME_START).at(-1);
  if (!opening) throw new Error(`Georgia prime-rate history lacks a value in force on ${GEORGIA_CURRENT_SCHEME_START}`);

  const history = [{ effective_date: GEORGIA_CURRENT_SCHEME_START, prime_rate: opening.value }];
  for (const point of sorted) {
    if (point.effective_date > GEORGIA_CURRENT_SCHEME_START) {
      history.push({ effective_date: point.effective_date, prime_rate: point.value });
    }
  }
  return history.map((point) => ({
    ...point,
    value: Math.round((point.prime_rate + 3 + Number.EPSILON) * 100) / 100,
    value_text: `${(point.prime_rate + 3).toFixed(2)}%`,
    source_url: GEORGIA_PRIME_SERIES_URL,
  }));
}

export function validateGeorgiaRateHistory(history) {
  const errors = [];
  const expected = buildGeorgiaPrimeHistory();
  const expectedByDate = new Map(expected.map((point) => [point.effective_date, point.value]));
  const sorted = [...(history || [])].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const seen = new Set();

  if (sorted.length < expected.length) {
    errors.push(`current-scheme history must contain at least ${expected.length} change points, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== GEORGIA_CURRENT_SCHEME_START) {
    errors.push(`history must begin ${GEORGIA_CURRENT_SCHEME_START}`);
  }
  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate derived date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!Number.isFinite(point.value) || point.value < 3 || point.value > 28) {
      errors.push(`invalid derived rate ${point.value} at ${point.effective_date}`);
    }
    if (expectedByDate.has(point.effective_date)
      && Math.abs(expectedByDate.get(point.effective_date) - point.value) > 1e-9) {
      errors.push(`derived rate at ${point.effective_date} must remain ${expectedByDate.get(point.effective_date).toFixed(2)}%`);
    }
  }
  const current = sorted.find((point) => point.effective_date === '2025-12-11');
  if (!current || Math.abs(current.value - 9.75) > 1e-9) {
    errors.push('verified current anchor must remain 9.75% effective 2025-12-11');
  }
  return errors;
}
