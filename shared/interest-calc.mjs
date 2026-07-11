// Shared interest-computation engine. Dependency-free ESM, used by BOTH the site's calculators
// (bundled by Astro) and the MCP server's calculate_interest tool — one implementation, one test
// suite, no drift.
//
// Statutory computation rules implemented (each cited on the page/tool that uses it):
//   - US federal post-judgment (28 U.S.C. §1961): rate = H.15 weekly-average 1-yr CMT for the
//     calendar week PRECEDING the judgment date; interest computed daily (actual/365) and
//     COMPOUNDED ANNUALLY on each anniversary of the judgment (§1961(b)).
//   - IRS §6621 interest (§6622): compounded DAILY; the applicable annual rate changes each
//     calendar quarter; the daily factor uses the actual length of that day's year (365/366).
//   - UK Late Payment of Commercial Debts (Interest) Act 1998: SIMPLE interest, actual/365, at the
//     statutory rate applicable when the debt became overdue.
//   - EU Late Payment Directive 2011/7/EU: SIMPLE interest, actual/365, reference rate + member-state
//     margin, where the reference re-fixes each half-year (segment-accurate accrual).
//
// All functions take rate HISTORY as [{effective_date:'YYYY-MM-DD', value:Number}] (any order) and
// ISO date strings. Every result includes the rate(s) used and a method string for transparency.
// These are ESTIMATES for reference — official/court computations may differ in rounding details.

const DAY_MS = 86400000;

export function parseDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) throw new Error(`Invalid date "${iso}" (need YYYY-MM-DD)`);
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error(`Invalid date "${iso}"`);
  return d;
}

export function daysBetween(startIso, endIso) {
  return Math.round((parseDate(endIso) - parseDate(startIso)) / DAY_MS);
}

function isoOf(d) {
  return d.toISOString().slice(0, 10);
}

function yearLen(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}

function sortHistory(history) {
  return [...history]
    .map((h) => ({ date: h.effective_date || h.date, value: h.value ?? h.value_numeric }))
    .filter((h) => h.date && Number.isFinite(h.value))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** The value in force on `iso` (latest effective_date <= iso); null if none. */
export function rateOn(history, iso) {
  const h = sortHistory(history);
  let val = null;
  let eff = null;
  for (const p of h) {
    if (p.date <= iso) { val = p.value; eff = p.date; } else break;
  }
  return val === null ? null : { value: val, effective_date: eff };
}

/** Monday (UTC) of the ISO week containing `iso`. */
export function mondayOf(iso) {
  const d = parseDate(iso);
  const dow = d.getUTCDay(); // 0 Sun … 6 Sat
  d.setUTCDate(d.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  return isoOf(d);
}

/**
 * US federal post-judgment interest (28 U.S.C. §1961).
 * Rate: the weekly series entry for the calendar week PRECEDING the judgment week.
 * Accrual: daily at rate/365 on the current base, compounded annually on the judgment anniversary.
 */
export function federalPostJudgment({ principal, judgmentDate, endDate, weeklyHistory }) {
  if (!(principal > 0)) throw new Error('Principal must be > 0');
  const days = daysBetween(judgmentDate, endDate);
  if (days < 0) throw new Error('End date is before the judgment date');
  const priorWeekMonday = isoOf(new Date(parseDate(mondayOf(judgmentDate)) - 7 * DAY_MS));
  const h = sortHistory(weeklyHistory);
  const entry = h.find((p) => p.date === priorWeekMonday) || null;
  const fallback = entry ? null : rateOn(h, priorWeekMonday);
  const rateEntry = entry || (fallback && { date: fallback.effective_date, value: fallback.value });
  if (!rateEntry) throw new Error(`No H.15 weekly rate available for the week of ${priorWeekMonday} (judgment ${judgmentDate})`);
  const r = rateEntry.value / 100;

  // Daily accrual within each judgment-anniversary year; compound at each anniversary.
  let base = principal;
  let interest = 0;
  let cursor = judgmentDate;
  let anniversary = nextAnniversary(judgmentDate, judgmentDate);
  while (daysBetween(cursor, endDate) > 0) {
    const segEnd = anniversary <= endDate ? anniversary : endDate;
    const segDays = daysBetween(cursor, segEnd);
    interest += base * r * (segDays / 365);
    if (segEnd === anniversary && segEnd !== endDate) {
      base = principal + interest; // §1961(b): compounded annually
      anniversary = nextAnniversary(judgmentDate, segEnd);
    }
    cursor = segEnd;
  }
  return {
    method: '28 U.S.C. §1961: daily accrual (actual/365), compounded annually',
    rate_percent: rateEntry.value,
    rate_week_monday: rateEntry.date,
    days,
    interest: round2(interest),
    total: round2(principal + interest),
  };
}

function nextAnniversary(originIso, afterIso) {
  const o = parseDate(originIso);
  const a = parseDate(afterIso);
  let y = a.getUTCFullYear() + 1;
  // walk forward from the year after `afterIso` until the anniversary is strictly after it
  for (;;) {
    const cand = new Date(Date.UTC(y, o.getUTCMonth(), Math.min(o.getUTCDate(), 28) === o.getUTCDate() ? o.getUTCDate() : o.getUTCDate(), 0, 0, 0));
    // handle Feb 29 origins: Date.UTC rolls invalid dates forward, which is acceptable here
    const candIso = isoOf(cand);
    if (candIso > afterIso) return candIso;
    y++;
  }
}

/**
 * IRS interest (§6621 rates, §6622 daily compounding).
 * The applicable annual rate changes by calendar quarter; each day compounds at r/daysInYear.
 */
export function irsInterest({ principal, startDate, endDate, quarterlyHistory }) {
  if (!(principal > 0)) throw new Error('Principal must be > 0');
  const totalDays = daysBetween(startDate, endDate);
  if (totalDays < 0) throw new Error('End date is before the start date');
  const h = sortHistory(quarterlyHistory);
  if (!rateOn(h, startDate)) throw new Error(`No IRS rate on record for ${startDate} (history starts ${h[0]?.date})`);

  let factor = 1;
  const ratesUsed = new Map();
  const d = parseDate(startDate);
  const end = parseDate(endDate);
  while (d < end) {
    const iso = isoOf(d);
    const r = rateOn(h, iso);
    const daily = r.value / 100 / yearLen(d.getUTCFullYear());
    factor *= 1 + daily;
    ratesUsed.set(r.effective_date, r.value);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const interest = principal * (factor - 1);
  return {
    method: 'IRC §6622: compounded daily (rate per quarter, actual year length)',
    days: totalDays,
    rates_used: [...ratesUsed.entries()].map(([effective_date, value]) => ({ effective_date, value })),
    interest: round2(interest),
    total: round2(principal + interest),
  };
}

/**
 * Simple interest at a FIXED rate (UK LPA 1998 style): the statutory rate applicable when the debt
 * became overdue applies for the whole period. actual/365.
 */
export function fixedSimpleInterest({ principal, startDate, endDate, history }) {
  if (!(principal > 0)) throw new Error('Principal must be > 0');
  const days = daysBetween(startDate, endDate);
  if (days < 0) throw new Error('End date is before the start date');
  const r = rateOn(history, startDate);
  if (!r) throw new Error(`No rate on record for ${startDate}`);
  const interest = (principal * (r.value / 100) * days) / 365;
  return {
    method: 'Simple interest (actual/365) at the rate applicable on the start date',
    rate_percent: r.value,
    rate_effective_date: r.effective_date,
    days,
    interest: round2(interest),
    total: round2(principal + interest),
    daily_amount: round2((principal * (r.value / 100)) / 365),
  };
}

/**
 * Interest at a FIXED rate COMPOUNDED ANNUALLY (e.g. Colorado prejudgment, C.R.S. §5-12-102: 8%
 * compounded annually). Daily accrual (actual/365) within each anniversary year; compounds on each
 * anniversary of the start date. Uses the rate applicable on the start date for the whole period.
 * (Same anniversary-compounding mechanism as the federal §1961 calculator, with a fixed rate.)
 */
export function fixedCompoundInterest({ principal, startDate, endDate, history }) {
  if (!(principal > 0)) throw new Error('Principal must be > 0');
  const days = daysBetween(startDate, endDate);
  if (days < 0) throw new Error('End date is before the start date');
  const rEntry = rateOn(history, startDate);
  if (!rEntry) throw new Error(`No rate on record for ${startDate}`);
  const r = rEntry.value / 100;

  let base = principal;
  let interest = 0;
  let cursor = startDate;
  let anniversary = nextAnniversary(startDate, startDate);
  while (daysBetween(cursor, endDate) > 0) {
    const segEnd = anniversary <= endDate ? anniversary : endDate;
    const segDays = daysBetween(cursor, segEnd);
    interest += base * r * (segDays / 365);
    if (segEnd === anniversary && segEnd !== endDate) {
      base = principal + interest; // compounded annually
      anniversary = nextAnniversary(startDate, segEnd);
    }
    cursor = segEnd;
  }
  return {
    method: 'Fixed rate: daily accrual (actual/365), compounded annually',
    rate_percent: rEntry.value,
    rate_effective_date: rEntry.effective_date,
    days,
    interest: round2(interest),
    total: round2(principal + interest),
  };
}

/**
 * Simple interest where the underlying rate RE-FIXES over time (EU Directive semesters): accrues
 * segment-by-segment at (reference in force that day + margin). actual/365.
 */
export function floatingSimpleInterest({ principal, startDate, endDate, history, marginPercent = 0 }) {
  if (!(principal > 0)) throw new Error('Principal must be > 0');
  const totalDays = daysBetween(startDate, endDate);
  if (totalDays < 0) throw new Error('End date is before the start date');
  const h = sortHistory(history);
  if (!rateOn(h, startDate)) throw new Error(`No rate on record for ${startDate}`);

  // Build segments at each rate change between start and end.
  const changes = h.map((p) => p.date).filter((d) => d > startDate && d < endDate);
  const bounds = [startDate, ...changes, endDate];
  let interest = 0;
  const segments = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const segStart = bounds[i];
    const segEnd = bounds[i + 1];
    const days = daysBetween(segStart, segEnd);
    if (days <= 0) continue;
    const ref = rateOn(h, segStart).value;
    const rate = ref + marginPercent;
    interest += (principal * (rate / 100) * days) / 365;
    segments.push({ from: segStart, to: segEnd, days, reference_percent: ref, rate_percent: round2(rate) });
  }
  return {
    method: `Simple interest (actual/365), reference rate re-fixing over time${marginPercent ? ` + ${marginPercent}pp margin` : ''}`,
    days: totalDays,
    segments,
    interest: round2(interest),
    total: round2(principal + interest),
  };
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
