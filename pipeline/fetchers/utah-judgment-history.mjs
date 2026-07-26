// Official Utah Courts annual post-judgment interest table.
//
// Utah Code §15-1-4 generally uses the federal post-judgment rate in effect on January 1
// plus two percentage points for civil and criminal judgments. The Utah Courts historic
// table is the authoritative published selection for each calendar year. Keep the exact
// display precision used by the court (including three-decimal rows from 1998–2000).

export const UTAH_JUDGMENT_CURRENT_URL = 'https://www.utcourts.gov/en/court-records-publications/resources/interest-rates/interestrates.html';
export const UTAH_JUDGMENT_HISTORY_URL = 'https://www.utcourts.gov/en/court-records-publications/resources/interest-rates/historic.html';
export const UTAH_JUDGMENT_STATUTE_URL = 'https://le.utah.gov/xcode/Title15/Chapter1/15-1-S4.html';
export const UTAH_HISTORY_VERIFIED_AT = '2026-07-26T00:00:00Z';
export const UTAH_OFFICIAL_HISTORY_START = '1993-01-01';
export const UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-01-01';

function parseAnnualRates(text) {
  return text.trim().split(/\s+/).map((token) => {
    const [yearText, valueText] = token.split(':');
    const year = Number(yearText);
    const value = Number(valueText);
    if (!Number.isInteger(year) || !Number.isFinite(value)) {
      throw new Error(`Invalid Utah rate token ${token}`);
    }
    return {
      effective_date: `${year}-01-01`,
      value,
      value_text: `${valueText}%`,
      source_url: UTAH_JUDGMENT_HISTORY_URL,
    };
  });
}

const OFFICIAL_RATES = Object.freeze(parseAnnualRates(`
1993:5.72 1994:5.61 1995:9.22 1996:7.35 1997:7.45 1998:7.468
1999:6.513 2000:7.670 2001:7.34 2002:4.28 2003:3.41 2004:3.28
2005:4.77 2006:6.36 2007:6.99 2008:5.42 2009:2.40 2010:2.41
2011:2.30 2012:2.12 2013:2.16 2014:2.13 2015:2.27 2016:2.65
2017:2.87 2018:3.76 2019:4.59 2020:3.53 2021:2.09 2022:2.29
2023:6.73 2024:6.81 2025:6.23 2026:5.51
`).map(Object.freeze));

export function buildUtahOfficialHistory() {
  return OFFICIAL_RATES.map((point) => ({ ...point }));
}

export function validateUtahOfficialHistory(history) {
  const errors = [];
  const expected = buildUtahOfficialHistory();
  const expectedByDate = new Map(expected.map((point) => [point.effective_date, point]));
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const seen = new Set();

  if (sorted.length !== expected.length) {
    errors.push(`official Utah history must contain ${expected.length} annual points, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== UTAH_OFFICIAL_HISTORY_START) {
    errors.push(`history must begin ${UTAH_OFFICIAL_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  if (sorted.at(-1)?.effective_date !== UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    errors.push(`history must end ${UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH}, found ${sorted.at(-1)?.effective_date || 'nothing'}`);
  }

  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-01-01$/.test(point.effective_date)) errors.push(`invalid annual date ${point.effective_date}`);
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
