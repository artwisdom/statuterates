// Official Florida Chief Financial Officer judgment-interest schedule.
//
// The CFO page publishes the current quarterly rows and historical rows on one official HTML page.
// This committed baseline preserves every distinct effective period beginning October 1, 1981.
// Values retain the CFO's display precision so live changes cannot silently rewrite history.

export const FLORIDA_CFO_RATES_URL = 'https://myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates';
export const FLORIDA_STATUTE_55_03_URL = 'https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0000-0099/0055/Sections/0055.03.html';
export const FLORIDA_HISTORY_VERIFIED_AT = '2026-07-26T00:00:00Z';
export const FLORIDA_OFFICIAL_HISTORY_START = '1981-10-01';
export const FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-07-01';

function parseRates(text) {
  return text.trim().split(/\s+/).map((token) => {
    const [effective_date, display] = token.split(':');
    const value = Number(display);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(effective_date) || !Number.isFinite(value)) {
      throw new Error(`Invalid Florida rate token ${token}`);
    }
    return {
      effective_date,
      value,
      value_text: `${display}%`,
      source_url: FLORIDA_CFO_RATES_URL,
    };
  });
}

const OFFICIAL_RATES = Object.freeze(parseRates(`
1981-10-01:12
1995-01-01:8 1996-01-01:10 1997-01-01:10 1998-01-01:10 1999-01-01:10
2000-01-01:10 2001-01-01:11 2002-01-01:9 2003-01-01:6 2004-01-01:7
2005-01-01:7 2006-01-01:9 2007-01-01:11 2008-01-01:11 2009-01-01:8
2010-01-01:6 2011-01-01:6 2011-10-01:4.75
2012-01-01:4.75 2012-04-01:4.75 2012-07-01:4.75 2012-10-01:4.75
2013-01-01:4.75 2013-04-01:4.75 2013-07-01:4.75 2013-10-01:4.75
2014-01-01:4.75 2014-04-01:4.75 2014-07-01:4.75 2014-10-01:4.75
2015-01-01:4.75 2015-04-01:4.75 2015-07-01:4.75 2015-10-01:4.75
2016-01-01:4.75 2016-04-01:4.78 2016-07-01:4.84 2016-10-01:4.91
2017-01-01:4.97 2017-04-01:5.05 2017-07-01:5.17 2017-10-01:5.35
2018-01-01:5.53 2018-04-01:5.72 2018-07-01:5.97 2018-10-01:6.09
2019-01-01:6.33 2019-04-01:6.57 2019-07-01:6.77 2019-10-01:6.89
2020-01-01:6.83 2020-04-01:6.66 2020-07-01:6.03 2020-10-01:5.37
2021-01-01:4.81 2021-04-01:4.31 2021-07-01:4.25 2021-10-01:4.25
2022-01-01:4.25 2022-04-01:4.25 2022-07-01:4.34 2022-10-01:4.75
2023-01-01:5.52 2023-04-01:6.58 2023-07-01:7.69 2023-10-01:8.54
2024-01-01:9.09 2024-04-01:9.34 2024-07-01:9.46 2024-10-01:9.50
2025-01-01:9.38 2025-04-01:9.15 2025-07-01:8.90 2025-10-01:8.65
2026-01-01:8.44 2026-04-01:8.25 2026-07-01:8.06
`).map(Object.freeze));

export function buildFloridaOfficialHistory() {
  return OFFICIAL_RATES.map((point) => ({ ...point }));
}

export function validateFloridaOfficialHistory(history) {
  const errors = [];
  const expected = buildFloridaOfficialHistory();
  const expectedByDate = new Map(expected.map((point) => [point.effective_date, point]));
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const seen = new Set();

  if (sorted.length !== expected.length) {
    errors.push(`official Florida history must contain ${expected.length} periods, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== FLORIDA_OFFICIAL_HISTORY_START) {
    errors.push(`history must begin ${FLORIDA_OFFICIAL_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  if (sorted.at(-1)?.effective_date !== FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    errors.push(`history must end ${FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH}, found ${sorted.at(-1)?.effective_date || 'nothing'}`);
  }
  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.effective_date)) errors.push(`invalid date ${point.effective_date}`);
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    const expectedPoint = expectedByDate.get(point.effective_date);
    if (!expectedPoint) {
      errors.push(`unexpected official-table date ${point.effective_date}`);
    } else if (
      Math.abs(expectedPoint.value - point.value) > 1e-9
      || expectedPoint.value_text !== point.value_text
    ) {
      errors.push(`expected ${expectedPoint.value_text} at ${point.effective_date}`);
    }
  }
  return errors;
}
