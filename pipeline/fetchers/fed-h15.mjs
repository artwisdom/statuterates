// Fetcher: Federal Reserve H.15 1-year Treasury constant-maturity yield via FRED.
//
// DGS1 is the complete daily input used to derive Monday-keyed weekly averages. WGS1YR is fetched
// independently and every published week must exactly match that derivation. Both feeds are
// mandatory: a network failure, truncated history, changed CSV shape, missing week, or disagreement
// aborts the pipeline before SQLite is changed or exports are written.

import { politeGet, nowIso } from '../lib/http.mjs';
import { buildWeeklyAverages } from '../lib/normalize.mjs';

export const FRED_HISTORY_START = '2000-01-01';
export const DGS1_CSV_URL =
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS1&cosd=${FRED_HISTORY_START}`;
export const WGS1YR_CSV_URL =
  `https://fred.stlouisfed.org/graph/fredgraph.csv?id=WGS1YR&cosd=${FRED_HISTORY_START}`;
export const DGS1_SERIES_URL = 'https://fred.stlouisfed.org/series/DGS1';
export const WGS1YR_SERIES_URL = 'https://fred.stlouisfed.org/series/WGS1YR';
export const US_CODE_1961_URL =
  'https://uscode.house.gov/view.xhtml?edition=prelim&num=0&req=granuleid%3AUSC-prelim-title28-section1961';
export const FEDERAL_STATUTE_CONTRACT_REVIEWED_AT = '2026-07-26';

const FIRST_DAILY_DATE = '2000-01-03';
const FIRST_WEEKLY_DATE = '2000-01-07';
const MIN_DAILY_ROWS = 6_500;
const MIN_WEEKLY_ROWS = 1_300;

// Stable published anchors spanning the imported period. The full daily/weekly reconciliation is
// the primary integrity check; these anchors additionally catch a wrong-but-well-formed series.
const WGS1YR_ANCHORS = new Map([
  ['2000-01-07', 6.03],
  ['2000-12-15', 5.73],
  ['2008-09-19', 1.69],
  ['2020-03-20', 0.23],
  ['2024-01-05', 4.83],
]);

export const H15_SOURCE = {
  // Keep the established id so committed exports hydrate/upsert instead of creating a second
  // provenance branch when the transport moves from the retiring Fed package service to FRED.
  id: 'fed-h15',
  name: 'Federal Reserve H.15 — 1-Year Treasury Constant Maturity (FRED DGS1/WGS1YR)',
  publisher: 'Board of Governors of the Federal Reserve System via FRED',
  home_url: DGS1_SERIES_URL,
  license: 'U.S. federal government work — public domain. FRED requests source attribution.',
};

const HTML_ENTITIES = new Map([
  ['amp', '&'],
  ['apos', "'"],
  ['emsp', ' '],
  ['ensp', ' '],
  ['gt', '>'],
  ['ldquo', '"'],
  ['lsquo', "'"],
  ['lt', '<'],
  ['mdash', '—'],
  ['minus', '−'],
  ['nbsp', ' '],
  ['ndash', '–'],
  ['quot', '"'],
  ['rdquo', '"'],
  ['rsquo', "'"],
  ['sect', '§'],
  ['shy', ''],
  ['thinsp', ' '],
]);

function decodeHtmlEntity(_match, entity) {
  const lower = entity.toLowerCase();
  if (lower.startsWith('#')) {
    const isHex = lower[1] === 'x';
    const digits = lower.slice(isHex ? 2 : 1);
    const codePoint = Number.parseInt(digits, isHex ? 16 : 10);
    if (
      Number.isInteger(codePoint) &&
      codePoint >= 0 &&
      codePoint <= 0x10ffff &&
      !(codePoint >= 0xd800 && codePoint <= 0xdfff)
    ) {
      return String.fromCodePoint(codePoint);
    }
    return ' ';
  }
  return HTML_ENTITIES.get(lower) ?? ' ';
}

/**
 * Reduce the official House HTML to a stable comparison form. Markup, footnote elements,
 * punctuation, Unicode dashes, case, and whitespace are intentionally ignored; the controlling
 * statutory words are not.
 */
export function normalizeFederalStatuteText(html) {
  return String(html ?? '')
    .replace(/\uFEFF/g, '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z][a-z0-9]+);/gi, decodeHtmlEntity)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200b-\u200d\u2060\uFEFF]/g, ' ')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findOrderedAnchors(text, anchors, start = 0) {
  let cursor = start;
  let first = -1;
  for (const anchor of anchors) {
    const index = text.indexOf(anchor, cursor);
    if (index === -1) return null;
    if (first === -1) first = index;
    cursor = index + anchor.length;
  }
  return { start: first, end: cursor };
}

/**
 * Verify the legal assumptions used by the federal calculator against normalized official text.
 * These ordered, tightly bounded anchors target the current section body rather than quotations in
 * amendment notes lower on the House page.
 */
export function validateFederalStatuteContract(html) {
  const text = normalizeFederalStatuteText(html);
  const errors = [];
  const identity = findOrderedAnchors(text, ['1961 interest']);
  if (!identity) return ['section identity anchor changed or missing'];

  const rate = findOrderedAnchors(
    text,
    [
      'such interest shall be calculated from the date of the entry of the judgment',
      'at a rate equal to the weekly average 1 year constant maturity treasury yield',
      'as published by the board of governors of the federal reserve system',
      'for the calendar week preceding',
      'the date of the judgment',
    ],
    identity.end
  );
  if (
    !rate ||
    rate.start - identity.end > 5_000 ||
    rate.end - rate.start > 1_500
  ) {
    errors.push('preceding-calendar-week rate clause changed or missing');
  }

  const dailySearchStart = rate?.end ?? identity.end;
  const daily = findOrderedAnchors(
    text,
    ['interest shall be computed daily', 'to the date of payment'],
    dailySearchStart
  );
  if (!daily || daily.start - dailySearchStart > 3_000 || daily.end - daily.start > 500) {
    errors.push('daily-computation clause changed or missing');
  }

  const annualSearchStart = daily?.end ?? dailySearchStart;
  const annual = findOrderedAnchors(text, ['and shall be compounded annually'], annualSearchStart);
  if (!annual || annual.start - annualSearchStart > 1_000) {
    errors.push('annual-compounding clause changed or missing');
  }
  return errors;
}

function isTemporaryStatuteFetchError(error) {
  const message = String(error?.message ?? error ?? '');
  return (
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    /^NETWORK:/i.test(message) ||
    /^HTTP_(?:429|5\d{2}):/i.test(message)
  );
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function daysBetween(later, earlier) {
  return Math.round(
    (new Date(`${later}T00:00:00Z`) - new Date(`${earlier}T00:00:00Z`)) / 86_400_000
  );
}

function mondayForFriday(friday) {
  const date = new Date(`${friday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 4);
  return isoDate(date);
}

/**
 * Build the only weeks that may be published: WGS1YR-backed weeks whose independently derived
 * DGS1 average matched during integrity validation. A newer partial DGS1 week is useful for
 * freshness diagnostics but must never become a public weekly rate before WGS1YR publishes it.
 */
export function buildCrosscheckedPublishedWeeks(daily, weekly) {
  const derived = buildWeeklyAverages(daily.observations);
  const derivedByWeek = new Map(derived.map((point) => [point.week, point]));
  return weekly.observations.map((point) => {
    const week = mondayForFriday(point.date);
    const computed = derivedByWeek.get(week);
    if (!computed || Math.abs(computed.avg - point.value) > 1e-9) {
      throw new Error(`FRED H.15: ${week} was not cross-checked before publication`);
    }
    return {
      week,
      avg: point.value,
      n: computed.n,
      published_date: point.date,
    };
  });
}

/**
 * Parse FRED's two-column graph CSV without silently accepting a changed schema.
 *
 * DGS1 represents market holidays with an empty value (and some FRED exports use "."). Those rows
 * remain in `rows` so weekday continuity can be checked, while `observations` contains numeric
 * business-day values for normalization.
 */
export function parseFredCsv(csv, seriesId, { allowMissing = false } = {}) {
  const text = String(csv ?? '').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/);
  while (lines.at(-1) === '') lines.pop();

  const expectedHeader = `observation_date,${seriesId}`;
  if (lines[0] !== expectedHeader) {
    throw new Error(`FRED ${seriesId}: expected ${expectedHeader} header`);
  }
  if (lines.length === 1) throw new Error(`FRED ${seriesId}: no rows parsed`);

  const rows = [];
  const observations = [];
  let previousDate = '';
  for (const line of lines.slice(1)) {
    if (line === '') throw new Error(`FRED ${seriesId}: unexpected blank row`);
    const cells = line.split(',');
    if (cells.length !== 2) throw new Error(`FRED ${seriesId}: malformed row "${line}"`);
    const [date, rawValue] = cells;
    if (!isIsoDate(date)) throw new Error(`FRED ${seriesId}: invalid date in row "${line}"`);
    if (date === previousDate) throw new Error(`FRED ${seriesId}: duplicate date ${date}`);
    if (previousDate && date < previousDate) {
      throw new Error(`FRED ${seriesId}: dates are not strictly increasing at ${date}`);
    }
    previousDate = date;

    if (rawValue === '' || rawValue === '.') {
      if (!allowMissing) throw new Error(`FRED ${seriesId}: missing value at ${date}`);
      rows.push({ date, value: null });
      continue;
    }
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(rawValue)) {
      throw new Error(`FRED ${seriesId}: invalid numeric value in row "${line}"`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < -5 || value > 30) {
      throw new Error(`FRED ${seriesId}: rate ${rawValue} outside expected range at ${date}`);
    }
    const point = { date, value };
    rows.push(point);
    observations.push(point);
  }
  if (!observations.length) throw new Error(`FRED ${seriesId}: no numeric observations parsed`);
  return { seriesId, rows, observations };
}

function checkDailyCalendar(rows, errors) {
  if (rows[0]?.date !== FIRST_DAILY_DATE) {
    errors.push(`DGS1 history must begin ${FIRST_DAILY_DATE}, found ${rows[0]?.date || 'nothing'}`);
    return;
  }
  let cursor = new Date(`${FIRST_DAILY_DATE}T00:00:00Z`);
  const end = new Date(`${rows.at(-1).date}T00:00:00Z`);
  let index = 0;
  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day >= 1 && day <= 5) {
      const expected = isoDate(cursor);
      if (rows[index]?.date !== expected) {
        errors.push(`DGS1 weekday history gap; expected ${expected}, found ${rows[index]?.date || 'nothing'}`);
        return;
      }
      index++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  if (index !== rows.length) errors.push(`DGS1 contains an unexpected non-weekday row at ${rows[index]?.date}`);
}

function checkWeeklyCalendar(rows, errors) {
  if (rows[0]?.date !== FIRST_WEEKLY_DATE) {
    errors.push(`WGS1YR history must begin ${FIRST_WEEKLY_DATE}, found ${rows[0]?.date || 'nothing'}`);
    return;
  }
  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const date = new Date(`${row.date}T00:00:00Z`);
    if (date.getUTCDay() !== 5) {
      errors.push(`WGS1YR observation ${row.date} is not a Friday`);
      return;
    }
    if (index > 0 && daysBetween(row.date, rows[index - 1].date) !== 7) {
      errors.push(`WGS1YR weekly history gap between ${rows[index - 1].date} and ${row.date}`);
      return;
    }
  }
}

/**
 * Verify complete history, current freshness, and exact DGS1 -> WGS1YR weekly equality.
 * At most one daily-derived current week may trail the published weekly series.
 */
export function validateFredH15Integrity(
  daily,
  weekly,
  { today = new Date().toISOString().slice(0, 10) } = {}
) {
  const errors = [];
  if (!isIsoDate(today)) return [`FRED H.15 integrity check received invalid today date ${today}`];
  if (!daily?.rows?.length || !daily?.observations?.length) return ['DGS1 history is empty'];
  if (!weekly?.rows?.length || !weekly?.observations?.length) return ['WGS1YR history is empty'];

  checkDailyCalendar(daily.rows, errors);
  checkWeeklyCalendar(weekly.rows, errors);
  if (daily.rows.length < MIN_DAILY_ROWS) {
    errors.push(`DGS1 history appears truncated: ${daily.rows.length} rows (minimum ${MIN_DAILY_ROWS})`);
  }
  if (weekly.rows.length < MIN_WEEKLY_ROWS) {
    errors.push(`WGS1YR history appears truncated: ${weekly.rows.length} rows (minimum ${MIN_WEEKLY_ROWS})`);
  }

  const latestDaily = daily.observations.at(-1).date;
  const latestWeekly = weekly.observations.at(-1).date;
  const dailyAge = daysBetween(today, latestDaily);
  const weeklyAge = daysBetween(today, latestWeekly);
  if (dailyAge < 0) errors.push(`DGS1 contains future observation ${latestDaily}`);
  else if (dailyAge > 10) errors.push(`DGS1 latest observation ${latestDaily} is ${dailyAge} days old`);
  if (weeklyAge < 0) errors.push(`WGS1YR contains future observation ${latestWeekly}`);
  else if (weeklyAge > 17) errors.push(`WGS1YR latest observation ${latestWeekly} is ${weeklyAge} days old`);

  const weeklyByFriday = new Map(weekly.observations.map((point) => [point.date, point.value]));
  for (const [date, expected] of WGS1YR_ANCHORS) {
    const actual = weeklyByFriday.get(date);
    if (actual === undefined) errors.push(`WGS1YR is missing historical anchor ${date}`);
    else if (Math.abs(actual - expected) > 1e-9) {
      errors.push(`WGS1YR historical anchor ${date} changed: expected ${expected}%, found ${actual}%`);
    }
  }

  const derived = buildWeeklyAverages(daily.observations);
  const derivedByWeek = new Map(derived.map((point) => [point.week, point]));
  const published = weekly.observations.map((point) => ({
    week: mondayForFriday(point.date),
    avg: point.value,
    published_date: point.date,
  }));
  const publishedByWeek = new Map(published.map((point) => [point.week, point]));
  const latestPublishedWeek = published.at(-1)?.week;

  for (const point of published) {
    const computed = derivedByWeek.get(point.week);
    if (!computed) {
      errors.push(`DGS1 is missing published WGS1YR week ${point.week}`);
      continue;
    }
    if (computed.n < 3 || computed.n > 5) {
      errors.push(`DGS1 week ${point.week} has ${computed.n} observations; expected 3–5`);
    }
    if (Math.abs(computed.avg - point.avg) > 1e-9) {
      errors.push(
        `DGS1-derived week ${point.week} is ${computed.avg}% but WGS1YR publishes ${point.avg}%`
      );
    }
  }
  for (const point of derived) {
    if (point.week <= latestPublishedWeek && !publishedByWeek.has(point.week)) {
      errors.push(`WGS1YR is missing DGS1-derived historical week ${point.week}`);
    }
  }
  const trailing = derived.filter((point) => point.week > latestPublishedWeek);
  if (trailing.length > 1) {
    errors.push(
      `WGS1YR trails DGS1 by ${trailing.length} weeks (${trailing[0].week} … ${trailing.at(-1).week})`
    );
  }
  if (trailing.some((point) => point.n < 1 || point.n > 5)) {
    errors.push(`DGS1 trailing week has an invalid observation count`);
  }
  return errors;
}

export async function fetchH15({ log = () => {}, get = politeGet, today } = {}) {
  // Sequential on one host so the shared politeness interval is honored. Either request throwing
  // rejects this function and therefore aborts the all-or-nothing pipeline run.
  const dailyResponse = await get(DGS1_CSV_URL, { sourceId: 'fed-h15' });
  const weeklyResponse = await get(WGS1YR_CSV_URL, { sourceId: 'fed-h15' });
  const daily = parseFredCsv(dailyResponse.body, 'DGS1', { allowMissing: true });
  const weekly = parseFredCsv(weeklyResponse.body, 'WGS1YR');
  const errors = validateFredH15Integrity(daily, weekly, { today });
  if (errors.length) throw new Error(`FRED H.15 integrity check failed: ${errors.join('; ')}`);

  let statuteResponse = null;
  let statuteStatus = 'verified-live';
  try {
    statuteResponse = await get(US_CODE_1961_URL, { sourceId: 'uscode-28-1961' });
  } catch (error) {
    if (!isTemporaryStatuteFetchError(error)) throw error;
    statuteStatus = 'reviewed-contract-retained-temporary-outage';
    log(
      `WARNING: 28 U.S.C. §1961 official text is temporarily unavailable; retaining the ` +
      `phrase contract reviewed ${FEDERAL_STATUTE_CONTRACT_REVIEWED_AT} (${error.message})`
    );
  }
  if (statuteResponse) {
    const statuteErrors = validateFederalStatuteContract(statuteResponse.body);
    if (statuteErrors.length) {
      throw new Error(
        `28 U.S.C. §1961 official phrase contract failed: ${statuteErrors.join('; ')}`
      );
    }
    log('28 U.S.C. §1961: official rate-selection, daily-computation, and annual-compounding clauses verified');
  }

  const retrieved_at = [dailyResponse.retrieved_at, weeklyResponse.retrieved_at]
    .filter(Boolean)
    .sort()
    .at(-1) || nowIso();
  const derivedWeeks = buildWeeklyAverages(daily.observations);
  const verifiedWeeks = buildCrosscheckedPublishedWeeks(daily, weekly);
  const trailingWeeks = derivedWeeks.length - verifiedWeeks.length;
  log(
    `FRED H.15: ${daily.observations.length} DGS1 daily observations -> ` +
    `${verifiedWeeks.length} WGS1YR-backed weeks cross-checked ` +
    `(${verifiedWeeks[0].week} … ${verifiedWeeks.at(-1).week}); ` +
    `${trailingWeeks} unpublished DGS1 week(s) excluded`
  );
  return {
    source: {
      ...H15_SOURCE,
      robots_status:
        'allowed; DGS1 daily history independently cross-checked against WGS1YR; ' +
        (statuteStatus === 'verified-live'
          ? 'official 28 U.S.C. §1961 phrase contract verified live'
          : `official 28 U.S.C. §1961 temporarily unavailable; contract reviewed ` +
            `${FEDERAL_STATUTE_CONTRACT_REVIEWED_AT} retained`),
      retrieved_at,
    },
    retrieved_at,
    daily: daily.observations,
    publishedWeekly: weekly.observations,
    verifiedWeeks,
    source_url: WGS1YR_SERIES_URL,
    input_source_url: DGS1_SERIES_URL,
    statuteContract: {
      status: statuteStatus,
      source_url: US_CODE_1961_URL,
      reviewed_at: FEDERAL_STATUTE_CONTRACT_REVIEWED_AT,
      retrieved_at: statuteResponse?.retrieved_at ?? null,
    },
  };
}
