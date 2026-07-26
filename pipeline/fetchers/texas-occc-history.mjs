// Official Texas OCCC postjudgment-interest history.
//
// The OCCC table records the rate for judgments rendered in each calendar month. The published
// history begins in September 1983. Its current DOCX was reviewed structurally and visually on
// 2026-07-19; the archived 2026 Texas Credit Letters fill February-July 2026, which the DOCX had
// not yet rolled into its table. Keep every month, including unchanged values: Texas locks the rate
// to the judgment month, so a complete monthly schedule is the legally meaningful representation.

export const TEXAS_OCCC_CURRENT_URL = 'https://occc.texas.gov/publications/interest-rates/';
export const TEXAS_OCCC_HISTORY_PAGE_URL = 'https://occc.texas.gov/publications/interest-rates/historical-interest-rate-summaries/';
export const TEXAS_OCCC_HISTORY_DOCX_URL = 'https://occc.texas.gov/wp-content/uploads/2025/12/PostjudgmentInterestRate_History.docx';
export const TEXAS_OCCC_2026_LETTERS_URL = 'https://occc.texas.gov/wp-content/uploads/2026/07/Texas_Credit_Letters_2026-1.pdf';
export const TEXAS_HISTORY_VERIFIED_AT = '2026-07-19T00:00:00Z';

const allMonths = (value) => Array(12).fill(value);
const rows = new Map();
const set = (year, values) => {
  if (values.length !== 12) throw new Error(`Texas OCCC ${year}: expected 12 month slots`);
  rows.set(year, values);
};
const setRange = (start, end, value) => {
  for (let year = start; year <= end; year++) set(year, allMonths(value));
};

// Null means the official table contains no rate for that month.
set(1983, [null, null, null, null, null, null, null, null, 10, 10, 10, 10]);
set(1984, [10, 10, 10, 10, 10, 10, 10.92, 10.99, 10.79, 10.84, 10.32, 10]);
setRange(1985, 2002, 10);
set(2003, [10, 10, 10, 10, 10, 10, 10, 5, 5, 5, 5, 5]);
set(2004, allMonths(5));
set(2005, [5.25, 5.25, 5.5, 5.5, 5.75, 6, 6, 6.25, 6.5, 6.5, 6.75, 7]);
set(2006, [7.25, 7.25, 7.5, 7.5, 7.75, 8, 8, 8.25, 8.25, 8.25, 8.25, 8.25]);
set(2007, [8.25, 8.25, 8.25, 8.25, 8.25, 8.25, 8.25, 8.25, 8.25, 8.25, 7.75, 7.5]);
set(2008, [7.25, 7.25, 6, 6, 5.25, 5, 5, 5, 5, 5, 5, 5]);
set(2009, allMonths(5));
setRange(2010, 2017, 5);
set(2018, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5.25, 5.25]);
set(2019, [5.25, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.25, 5.25, 5, 5]);
setRange(2020, 2021, 5);
set(2022, [5, 5, 5, 5, 5, 5, 5, 5, 5.5, 5.5, 6.25, 7]);
set(2023, [7.5, 7.5, 7.75, 7.75, 8, 8.25, 8.25, 8.25, 8.5, 8.5, 8.5, 8.5]);
set(2024, [8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8, 7.75]);
set(2025, [7.75, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.5, 7.25, 7]);
set(2026, [6.75, 6.75, 6.75, 6.75, 6.75, 6.75, 6.75, null, null, null, null, null]);

function sourceUrl(year, month) {
  if (year === 2026 && month >= 2 && month <= 7) return TEXAS_OCCC_2026_LETTERS_URL;
  return TEXAS_OCCC_HISTORY_DOCX_URL;
}

export function buildTexasOfficialMonthlyHistory() {
  const history = [];
  for (const [year, values] of [...rows.entries()].sort(([a], [b]) => a - b)) {
    for (let index = 0; index < values.length; index++) {
      const value = values[index];
      if (value === null) continue;
      const month = index + 1;
      history.push({
        effective_date: `${year}-${String(month).padStart(2, '0')}-01`,
        value,
        source_url: sourceUrl(year, month),
      });
    }
  }
  return history;
}

export function nextMonthStart(isoDate) {
  const [year, month] = isoDate.slice(0, 7).split('-').map(Number);
  return month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

export function validateTexasMonthlyHistory(history) {
  const errors = [];
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (sorted[0]?.effective_date !== '1983-09-01') {
    errors.push(`history must begin 1983-09-01, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  const seen = new Set();
  for (let index = 0; index < sorted.length; index++) {
    const point = sorted[index];
    if (seen.has(point.effective_date)) errors.push(`duplicate month ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-01$/.test(point.effective_date)) {
      errors.push(`invalid month start ${point.effective_date}`);
    }
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    if (index > 0) {
      const expected = nextMonthStart(sorted[index - 1].effective_date);
      if (point.effective_date !== expected) {
        errors.push(`monthly gap after ${sorted[index - 1].effective_date}; found ${point.effective_date}`);
      }
    }
  }
  return errors;
}
