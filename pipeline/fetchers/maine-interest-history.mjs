// Official Maine annual prejudgment and post-judgment interest tables.
//
// The Maine Judicial Branch publishes one chart for each series. Both use the weekly-average
// one-year Treasury CMT for the last full week of the prior calendar year: +3 percentage points
// before judgment and +6 after judgment. The 2025 values below are the corrected values from the
// Judicial Branch's April 1, 2025 standing order, not the superseded values first published due to
// an administrative error.

export const MAINE_PREJUDGMENT_CHART_URL = 'https://mjbportal.courts.maine.gov/CourtForms/FormsLists/DownloadForm?strFormNumber=OTH-155';
export const MAINE_POSTJUDGMENT_CHART_URL = 'https://mjbportal.courts.maine.gov/CourtForms/FormsLists/DownloadForm?strFormNumber=OTH-156';
export const MAINE_2025_CORRECTION_URL = 'https://www.courts.maine.gov/adminorders/so-2025-judgment-interest-rates.pdf';
export const MAINE_PREJUDGMENT_STATUTE_URL = 'https://legislature.maine.gov/statutes/14/title14sec1602-B.html';
export const MAINE_POSTJUDGMENT_STATUTE_URL = 'https://legislature.maine.gov/statutes/14/title14sec1602-C.html';
export const MAINE_H15_SOURCE_URL = 'https://www.federalreserve.gov/datadownload/Download.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&filetype=csv&label=include&layout=seriescolumn';
export const MAINE_HISTORY_VERIFIED_AT = '2026-07-19T00:00:00Z';
export const MAINE_OFFICIAL_HISTORY_START = '2003-07-01';
export const MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH = '2026-01-01';

function parseAnnualRates(text) {
  return text.trim().split(/\s+/).map((token) => {
    const [yearText, valueText] = token.split(':');
    const year = Number(yearText);
    const value = Number(valueText);
    if (!Number.isInteger(year) || !Number.isFinite(value)) throw new Error(`Invalid Maine rate token ${token}`);
    return { year, value };
  });
}

const OFFICIAL_POSTJUDGMENT_RATES = Object.freeze(parseAnnualRates(`
2003:7.41 2004:7.28 2005:8.77 2006:10.36 2007:10.99 2008:9.42
2009:6.40 2010:6.41 2011:6.30 2012:6.12 2013:6.16 2014:6.13
2015:6.27 2016:6.65 2017:6.87 2018:7.76 2019:8.59 2020:7.53
2021:6.09 2022:6.29 2023:10.73 2024:10.88 2025:10.23 2026:9.51
`).map(Object.freeze));

function spreadFor(kind) {
  if (kind === 'prejudgment') return 3;
  if (kind === 'postjudgment') return 6;
  throw new Error(`Unknown Maine interest kind: ${kind}`);
}

function chartUrlFor(kind) {
  return kind === 'prejudgment' ? MAINE_PREJUDGMENT_CHART_URL : MAINE_POSTJUDGMENT_CHART_URL;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildMaineOfficialHistory(kind) {
  const spread = spreadFor(kind);
  return OFFICIAL_POSTJUDGMENT_RATES.map(({ year, value: postValue }) => {
    const index_value = round2(postValue - 6);
    const value = round2(index_value + spread);
    return {
      effective_date: year === 2003 ? '2003-07-01' : `${year}-01-01`,
      index_value,
      value,
      value_text: `${value.toFixed(2)}%`,
      source_url: chartUrlFor(kind),
    };
  });
}

export function validateMaineOfficialHistory(history, kind) {
  const errors = [];
  const expected = buildMaineOfficialHistory(kind);
  const expectedByDate = new Map(expected.map((point) => [point.effective_date, point.value]));
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const seen = new Set();

  if (sorted.length !== expected.length) {
    errors.push(`official chart history must contain ${expected.length} annual points, found ${sorted.length}`);
  }
  if (sorted[0]?.effective_date !== MAINE_OFFICIAL_HISTORY_START) {
    errors.push(`history must begin ${MAINE_OFFICIAL_HISTORY_START}, found ${sorted[0]?.effective_date || 'nothing'}`);
  }
  if (sorted.at(-1)?.effective_date !== MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    errors.push(`history must end ${MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH}, found ${sorted.at(-1)?.effective_date || 'nothing'}`);
  }
  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.effective_date)) errors.push(`invalid date ${point.effective_date}`);
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    if (!expectedByDate.has(point.effective_date)) {
      errors.push(`unexpected official-chart date ${point.effective_date}`);
    } else if (Math.abs(expectedByDate.get(point.effective_date) - point.value) > 1e-9) {
      errors.push(`expected ${expectedByDate.get(point.effective_date).toFixed(2)}% at ${point.effective_date}`);
    }
  }

  const corrected2025 = kind === 'prejudgment' ? 7.23 : 10.23;
  const row2025 = sorted.find((point) => point.effective_date === '2025-01-01');
  if (!row2025 || Math.abs(row2025.value - corrected2025) > 1e-9) {
    errors.push(`2025 rate must use the corrected Judicial Branch value of ${corrected2025.toFixed(2)}%`);
  }
  return errors;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

// Reproduce the statutory index from daily H.15 observations. This is used as an integrity check
// against the current official chart and, only after the curated chart ends, as a clearly labeled
// provisional value until the Judicial Branch publishes its next annual chart.
export function deriveMaineAnnualRateFromH15(daily, { year, kind }) {
  const spread = spreadFor(kind);
  if (!Number.isInteger(year) || year < 2004 || year > 9999) throw new Error(`Invalid Maine rate year: ${year}`);
  if (!Array.isArray(daily) || daily.length === 0) return null;

  const priorYear = year - 1;
  const friday = new Date(Date.UTC(priorYear, 11, 31));
  while (friday.getUTCDay() !== 5) friday.setUTCDate(friday.getUTCDate() - 1);
  const monday = new Date(friday);
  monday.setUTCDate(monday.getUTCDate() - 4);
  const week_start = isoDate(monday);
  const week_end = isoDate(friday);
  const observations = daily
    .filter((point) => point.date >= week_start && point.date <= week_end)
    .sort((a, b) => a.date.localeCompare(b.date));

  const uniqueDates = new Set(observations.map((point) => point.date));
  if (uniqueDates.size !== observations.length) throw new Error(`Maine H.15 week ${week_start} contains duplicate dates`);
  if (observations.some((point) => !Number.isFinite(point.value))) {
    throw new Error(`Maine H.15 week ${week_start} contains a non-numeric value`);
  }
  // A federal holiday commonly leaves four observations. Fewer than three means the fetched
  // window is incomplete or materially changed, so fail closed rather than publish a partial week.
  if (observations.length < 3 || observations.length > 5) return null;

  const index_value = round2(observations.reduce((sum, point) => sum + point.value, 0) / observations.length);
  const value = round2(index_value + spread);
  return {
    effective_date: `${year}-01-01`,
    index_value,
    value,
    value_text: `${value.toFixed(2)}%`,
    week_start,
    week_end,
    observation_count: observations.length,
    source_url: MAINE_H15_SOURCE_URL,
  };
}
