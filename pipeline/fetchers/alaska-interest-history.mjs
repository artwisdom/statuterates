// Official Alaska Court System pre- and post-judgment interest history.
//
// Form ADM-505 publishes the annual AS 09.30.070(a) rate selected by the year a judgment is
// entered. The current schedule begins with the August 7, 1997 statutory transition; the form
// separately warns that complaints filed from July 1, 1980 through August 6, 1997 used a 10.5%
// transition rule, so that earlier branch is not flattened into this judgment-year table.

export const ALASKA_ADM_505_URL = 'https://public.courts.alaska.gov/web/forms/docs/adm-505.pdf';
export const ALASKA_STATUTE_URL = 'https://www.akleg.gov/basis/statutes.asp#09.30.070';
export const ALASKA_HISTORY_VERIFIED_AT = '2026-07-26T00:00:00Z';
export const ALASKA_OFFICIAL_HISTORY_START = '1997-08-07';
export const ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-01-01';

function parseAnnualRates(text) {
  const points = [];
  for (const token of text.trim().split(/\s+/)) {
    const [yearsText, valueText] = token.split(':');
    const [startText, endText = startText] = yearsText.split('-');
    const start = Number(startText);
    const end = Number(endText);
    const value = Number(valueText);
    if (!Number.isInteger(start) || !Number.isInteger(end) || end < start
        || !Number.isFinite(value)) {
      throw new Error(`Invalid Alaska rate token ${token}`);
    }
    for (let year = start; year <= end; year++) {
      points.push({
        effective_date: year === 1997 ? ALASKA_OFFICIAL_HISTORY_START : `${year}-01-01`,
        value,
        value_text: `${valueText}%`,
        source_url: ALASKA_ADM_505_URL,
      });
    }
  }
  return points;
}

const OFFICIAL_RATES = Object.freeze(parseAnnualRates(`
1997:8 1998:8 1999:7.5 2000:8 2001:9 2002:4.25 2003:3.75 2004:5
2005:6.25 2006:8.25 2007:9.25 2008:7.75 2009-2010:3.5 2011-2015:3.75
2016:4 2017:4.25 2018:5 2019:6 2020:5.25 2021-2022:3.25 2023:7.5
2024:8.5 2025:7.5 2026:6.75
`).map(Object.freeze));

export function buildAlaskaOfficialHistory() {
  return OFFICIAL_RATES.map((point) => ({ ...point }));
}

export function validateAlaskaOfficialHistory(history) {
  const errors = [];
  const expected = buildAlaskaOfficialHistory();
  const expectedByDate = new Map(expected.map((point) => [point.effective_date, point]));
  const sorted = [...(history || [])].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const seen = new Set();

  if (sorted.length !== expected.length) {
    errors.push(`official ADM-505 history must contain ${expected.length} annual points, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== ALASKA_OFFICIAL_HISTORY_START) {
    errors.push(`history must begin ${ALASKA_OFFICIAL_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  if (sorted.at(-1)?.effective_date !== ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    errors.push(`history must end ${ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH}, found ${sorted.at(-1)?.effective_date || 'nothing'}`);
  }

  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.effective_date)) {
      errors.push(`invalid date ${point.effective_date}`);
    }
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    const expectedPoint = expectedByDate.get(point.effective_date);
    if (!expectedPoint) {
      errors.push(`unexpected official-table date ${point.effective_date}`);
    } else {
      if (Math.abs(expectedPoint.value - point.value) > 1e-9) {
        errors.push(`expected ${expectedPoint.value_text} at ${point.effective_date}`);
      }
      if (expectedPoint.value_text !== point.value_text) {
        errors.push(`expected display value ${expectedPoint.value_text} at ${point.effective_date}`);
      }
    }
  }
  return errors;
}
