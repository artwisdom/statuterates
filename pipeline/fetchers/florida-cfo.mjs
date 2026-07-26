// Live monitor for the official Florida CFO judgment-interest HTML tables.
//
// Every overlapping row must match the committed 1981-present baseline. A new quarter can be
// appended only if its date, annual rate, and official daily-rate arithmetic are plausible.
// Source outages degrade to the last verified table without estimating a replacement.

import { politeGet } from '../lib/http.mjs';
import {
  buildFloridaOfficialHistory,
  FLORIDA_CFO_RATES_URL,
  FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  FLORIDA_STATUTE_55_03_URL,
} from './florida-judgment-history.mjs';

const MONTHS = new Map([
  ['january', '01'], ['april', '04'], ['july', '07'], ['october', '10'],
]);

function textContent(value) {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedPhrase(value) {
  return textContent(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const FLORIDA_STATUTE_CONTRACT = Object.freeze([
  Object.freeze({
    label: 'quarterly formula',
    phrase: 'averaging the discount rate of the federal reserve bank of new york for the preceding 12 months then adding 400 basis points',
  }),
  Object.freeze({
    label: 'quarterly effective date',
    phrase: 'shall take effect on the first day of each following calendar quarter',
  }),
  Object.freeze({
    label: 'written-contract branch',
    phrase: 'nothing contained herein shall affect a rate of interest established by written contract or obligation',
  }),
  Object.freeze({
    label: 'accrual until payment',
    phrase: 'the rate of interest stated in the judgment as adjusted in subsection 3 accrues on the judgment until it is paid',
  }),
  Object.freeze({
    label: 'annual January 1 adjustment',
    phrase: 'the interest rate is established at the time a judgment is obtained and such interest rate shall be adjusted annually on january 1 of each year',
  }),
  Object.freeze({
    label: 'clerk-entered exceptions',
    phrase: 'except for judgments entered by the clerk of the court pursuant to ss 55 141 61 14 938 29 and 938 30 which shall not be adjusted annually',
  }),
]);

export function assertFloridaStatuteContract(html) {
  const normalized = normalizedPhrase(html);
  if (!normalized) throw new Error('Florida statute §55.03 text was not found');
  for (const anchor of FLORIDA_STATUTE_CONTRACT) {
    if (!normalized.includes(anchor.phrase)) {
      throw new Error(`Florida statute §55.03 changed or is incomplete at the ${anchor.label} anchor`);
    }
  }
}

function tableRows(html) {
  return [...String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => textContent(cell[1])));
}

function fourDigitYear(raw) {
  const year = Number(raw);
  return year < 100 ? year + (year >= 81 ? 1900 : 2000) : year;
}

function normalizeEffectiveDate(value) {
  const cleaned = value.replace(/\(\d+\)/g, '').trim();
  const named = cleaned.match(/^(January|April|July|October)\s+1,\s+(\d{4})$/i);
  if (named) return `${named[2]}-${MONTHS.get(named[1].toLowerCase())}-01`;

  const numeric = cleaned.match(/^(\d{1,2})\/1\/(\d{2}|\d{4})(?:-\d{1,2}\/\d{1,2}\/\d{2,4})?$/);
  if (numeric) {
    const month = Number(numeric[1]);
    if (![1, 4, 7, 10].includes(month)) return null;
    return `${fourDigitYear(numeric[2])}-${String(month).padStart(2, '0')}-01`;
  }

  if (/^(?:19|20)\d{2}$/.test(cleaned)) return `${cleaned}-01-01`;
  return null;
}

function numericCell(value, removable = /[()%]/g) {
  return Number(String(value).replace(/\(\d+\)/g, '').replace(removable, '').trim());
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function parseFloridaCfoRates(html) {
  const byDate = new Map();
  for (const cells of tableRows(html)) {
    if (cells.length < 2) continue;
    const effective_date = normalizeEffectiveDate(cells[0]);
    const rawRate = cells[1].replace(/%/g, '').trim();
    const value = Number(rawRate);
    if (!effective_date || !Number.isFinite(value)) continue;
    const daily_rate_percent = cells[2] ? numericCell(cells[2]) : null;
    const daily_rate_decimal = cells[3] ? numericCell(cells[3], /[()]/g) : null;
    const point = {
      effective_date,
      value,
      value_text: `${rawRate}%`,
      daily_rate_percent: Number.isFinite(daily_rate_percent) ? daily_rate_percent : null,
      daily_rate_decimal: Number.isFinite(daily_rate_decimal) ? daily_rate_decimal : null,
      source_url: FLORIDA_CFO_RATES_URL,
    };
    const existing = byDate.get(effective_date);
    if (existing && Math.abs(existing.value - point.value) > 1e-9) {
      throw new Error(`Florida CFO published conflicting values for ${effective_date}`);
    }
    // Prefer a dated quarter row over the page's duplicate bare "2012" summary row.
    if (!existing || cells[0].includes('/') || /[A-Za-z]/.test(cells[0])) byDate.set(effective_date, point);
  }
  const points = [...byDate.values()].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (!points.length) throw new Error('Florida CFO judgment-rate rows were not found');
  return points;
}

export function assertFloridaCfoRates(points, {
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const baselineByDate = new Map(buildFloridaOfficialHistory().map((point) => [point.effective_date, point]));
  const latest = points.at(-1);
  if (!latest || latest.effective_date < FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    throw new Error(`Florida CFO table ends before verified baseline ${FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH}`);
  }

  const futureLimit = new Date(`${today}T00:00:00Z`);
  futureLimit.setUTCDate(futureLimit.getUTCDate() + 120);
  if (new Date(`${latest.effective_date}T00:00:00Z`) > futureLimit) {
    throw new Error(`Florida CFO latest period ${latest.effective_date} is implausibly in the future`);
  }

  for (const point of points) {
    const month = Number(point.effective_date.slice(5, 7));
    const day = Number(point.effective_date.slice(8, 10));
    if (![1, 4, 7, 10].includes(month) || day !== 1) {
      throw new Error(`Florida CFO date ${point.effective_date} is outside the expected quarter cadence`);
    }
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      throw new Error(`Florida CFO rate ${point.value}% at ${point.effective_date} is outside the accepted range`);
    }
    const verified = baselineByDate.get(point.effective_date);
    if (verified && (
      Math.abs(verified.value - point.value) > 1e-9
      || verified.value_text !== point.value_text
    )) {
      throw new Error(`Florida CFO changed verified ${point.effective_date} from ${verified.value_text} to ${point.value_text}`);
    }
    const isNewQuarter = point.effective_date > FLORIDA_OFFICIAL_HISTORY_COMPLETE_THROUGH;
    if (isNewQuarter && (
      !Number.isFinite(point.daily_rate_percent)
      || !Number.isFinite(point.daily_rate_decimal)
    )) {
      throw new Error(
        `Florida CFO new period ${point.effective_date} is missing an official daily percentage or decimal factor`
      );
    }
    if (point.daily_rate_decimal !== null) {
      // The oldest CFO row preserves the former 360-day factor. The 1995–2011 annual
      // schedule uses 365 days even in calendar leap years; the quarterly schedule uses
      // 366 in leap years beginning in 2012, as the CFO's footnote explains. Older annual
      // rows also have fewer published decimals, so validate only to the agency's precision.
      const year = Number(point.effective_date.slice(0, 4));
      const days = point.effective_date < '1995-01-01'
        ? 360
        : point.effective_date >= '2012-01-01' && isLeapYear(year)
          ? 366
          : 365;
      const expectedDaily = point.value / 100 / days;
      const tolerance = isNewQuarter ? 0.0000000005 : 0.00000005;
      if (Math.abs(point.daily_rate_decimal - expectedDaily) > tolerance) {
        throw new Error(`Florida CFO daily factor at ${point.effective_date} does not reconcile to ${point.value_text}`);
      }
      if (isNewQuarter) {
        const expectedDailyPercent = point.value / days;
        if (Math.abs(point.daily_rate_percent - expectedDailyPercent) > 0.00000005) {
          throw new Error(
            `Florida CFO daily percentage at ${point.effective_date} does not reconcile to ${point.value_text}`
          );
        }
        if (Math.abs(point.daily_rate_percent / 100 - point.daily_rate_decimal) > 0.0000000005) {
          throw new Error(
            `Florida CFO daily percentage and decimal disagree at ${point.effective_date}`
          );
        }
      }
    }
  }
}

export async function fetchFloridaCfoRates({
  getImpl = politeGet,
  log = () => {},
  today,
} = {}) {
  let response;
  try {
    response = await getImpl(FLORIDA_CFO_RATES_URL, { sourceId: 'fl-cfo' });
  } catch (error) {
    log(`Florida CFO unavailable (${error.message}); using verified official history without an estimated replacement.`);
    return null;
  }

  // Parsing and integrity checks deliberately sit outside the network fallback. A reachable source
  // whose structure or verified values changed must stop the refresh instead of masquerading as an
  // ordinary outage and silently retaining a stale "current" quarter.
  const points = parseFloridaCfoRates(response.body);
  assertFloridaCfoRates(points, { today });

  let statuteResponse = null;
  try {
    statuteResponse = await getImpl(FLORIDA_STATUTE_55_03_URL, { sourceId: 'fl-statute-55-03' });
  } catch (error) {
    log(
      `Florida statute §55.03 unavailable (${error.message}); retaining the last reviewed legal contract while using the verified CFO schedule.`
    );
  }
  if (statuteResponse) assertFloridaStatuteContract(statuteResponse.body);

  const retrieved_at = response.retrieved_at || new Date().toISOString();
  const statuteStatus = statuteResponse
    ? `§55.03 legal anchors checked ${statuteResponse.retrieved_at || retrieved_at}`
    : '§55.03 live check unavailable; last reviewed legal contract retained';
  log(`Florida CFO: parsed ${points.length} official periods through ${points.at(-1).effective_date}; ${statuteStatus}`);
  return {
    points,
    retrieved_at,
    source: {
      id: 'fl-cfo',
      name: 'Florida judgment interest current and historical rates',
      publisher: 'Florida Department of Financial Services, Chief Financial Officer (official)',
      home_url: FLORIDA_CFO_RATES_URL,
      license: 'Government edict — not subject to copyright.',
      robots_status: `official HTML table fetched ${retrieved_at}; ${statuteStatus}`,
      retrieved_at,
    },
  };
}
