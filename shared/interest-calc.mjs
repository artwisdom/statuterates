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
//   - EU Late Payment Directive 2011/7/EU: SIMPLE interest, actual/365, using the recorded ECB
//     reference plus a caller-supplied margin. This is arithmetic for an explicitly selected
//     benchmark, not a country-specific statutory-rate lookup.
//
// All functions take rate HISTORY as [{effective_date:'YYYY-MM-DD', value:Number}] (any order) and
// ISO date strings. Every result includes the rate(s) used and a method string for transparency.
// These are ESTIMATES for reference — official/court computations may differ in rounding details.

const DAY_MS = 86400000;
const MAX_SUPPORTED_PRINCIPAL = 1_000_000_000_000;
export const FEDERAL_MODERN_RULE_START = '2000-12-21';

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

function assertPositivePrincipal(principal) {
  if (!Number.isFinite(principal) || !(principal > 0)) throw new Error('Principal must be a finite number > 0');
  const cents = Math.round(principal * 100);
  if (principal > MAX_SUPPORTED_PRINCIPAL
      || !Number.isSafeInteger(cents)
      || Math.abs(cents / 100 - principal) > 1e-9) {
    throw new Error(
      `Principal must be a cent-precise amount no greater than $${MAX_SUPPORTED_PRINCIPAL.toLocaleString('en-US')}`
    );
  }
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
export function federalPostJudgment({
  principal,
  judgmentDate,
  endDate,
  weeklyHistory,
  validFrom = FEDERAL_MODERN_RULE_START,
}) {
  assertPositivePrincipal(principal);
  const days = daysBetween(judgmentDate, endDate);
  if (days < 0) throw new Error('End date is before the judgment date');
  if (judgmentDate < validFrom) {
    throw new Error(`This federal calculator supports judgments entered on or after ${validFrom}`);
  }
  const priorWeekMonday = isoOf(new Date(parseDate(mondayOf(judgmentDate)) - 7 * DAY_MS));
  const h = sortHistory(weeklyHistory);
  const entry = h.find((p) => p.date === priorWeekMonday) || null;
  const rateEntry = entry;
  if (!rateEntry) {
    throw new Error(
      `No exact H.15 weekly rate is available for the week of ${priorWeekMonday} (judgment ${judgmentDate}); an older week will not be substituted`
    );
  }
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
    if (!Number.isFinite(interest)) throw new Error('Federal interest result exceeds the supported range');
    if (segEnd === anniversary && segEnd !== endDate) {
      base = principal + interest; // §1961(b): compounded annually
      if (!Number.isFinite(base)) throw new Error('Federal compounded balance exceeds the supported range');
      anniversary = nextAnniversary(judgmentDate, segEnd);
    }
    cursor = segEnd;
  }
  if (!Number.isFinite(principal + interest)) {
    throw new Error('Federal total exceeds the supported range');
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
    const cand = new Date(Date.UTC(y, o.getUTCMonth(), o.getUTCDate(), 0, 0, 0));
    // A Feb-29 origin has no anniversary in common years; Date.UTC rolls it to Mar 1, which we accept
    // as the compounding boundary (a standard convention). This only affects Feb-29 accrual starts.
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
  assertPositivePrincipal(principal);
  const totalDays = daysBetween(startDate, endDate);
  if (totalDays < 0) throw new Error('End date is before the start date');
  const h = sortHistory(quarterlyHistory);
  const startRate = rateOn(h, startDate);
  if (!startRate) throw new Error(`No IRS rate on record for ${startDate} (history starts ${h[0]?.date})`);
  const coveredThrough = irsRateCoverageEnd(quarterlyHistory);
  if (endDate > coveredThrough) {
    throw new Error(
      `IRS rates are only published through ${coveredThrough}; choose an end date on or before that boundary`
    );
  }

  let factor = 1;
  const ratesUsed = new Map();
  let rateIndex = h.findIndex((point) => point.date === startRate.effective_date);
  const d = parseDate(startDate);
  const end = parseDate(endDate);
  while (d < end) {
    const iso = isoOf(d);
    while (rateIndex + 1 < h.length && h[rateIndex + 1].date <= iso) rateIndex++;
    const r = h[rateIndex];
    const daily = r.value / 100 / yearLen(d.getUTCFullYear());
    factor *= 1 + daily;
    ratesUsed.set(r.date, r.value);
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
 * Exclusive end of the final published IRS quarter. An end date equal to this boundary is safe:
 * the accrual loop covers only dates before it. Anything later would silently extrapolate an
 * already-published rate into an unpublished quarter, so callers must fail closed.
 */
export function irsRateCoverageEnd(quarterlyHistory) {
  const h = sortHistory(quarterlyHistory);
  const latest = h.at(-1);
  if (!latest) throw new Error('No IRS quarterly rate history supplied');
  const d = parseDate(latest.date);
  if (d.getUTCDate() !== 1 || ![0, 3, 6, 9].includes(d.getUTCMonth())) {
    throw new Error(`IRS rate ${latest.date} is not a calendar-quarter start`);
  }
  d.setUTCMonth(d.getUTCMonth() + 3);
  return isoOf(d);
}

/**
 * Safe date boundaries for the modern Florida judgment-interest rule.
 *
 * The CFO publishes a rate for each calendar quarter. A newly entered judgment can therefore use
 * the final published point only until that quarter ends. Once a judgment exists, Fla. Stat.
 * §55.03(3) keeps its entry rate through December 31 and changes it only on January 1, so an
 * existing judgment remains calculable through the next January 1 boundary.
 */
export function floridaJudgmentCoverage(history) {
  const h = sortHistory(history);
  const latest = h.at(-1);
  if (!latest) throw new Error('No Florida CFO rate history supplied');
  const d = parseDate(latest.date);
  if (d.getUTCDate() !== 1 || ![0, 3, 6, 9].includes(d.getUTCMonth())) {
    throw new Error(`Florida CFO rate ${latest.date} is not a calendar-quarter start`);
  }
  const entryEnd = addMonthsClamped(latest.date, 3);
  const annualResetEnd = `${d.getUTCFullYear() + 1}-01-01`;
  return {
    latest_effective_date: latest.date,
    judgment_date_before: entryEnd,
    calculation_date_through: annualResetEnd,
  };
}

function gcdBigInt(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

function addPositiveFraction(total, numerator, denominator) {
  if (numerator === 0n) return total;
  const divisor = gcdBigInt(total.denominator, denominator);
  const leftMultiplier = denominator / divisor;
  const rightMultiplier = total.denominator / divisor;
  const combined = {
    numerator: total.numerator * leftMultiplier + numerator * rightMultiplier,
    denominator: total.denominator * leftMultiplier,
  };
  const reduction = gcdBigInt(combined.numerator, combined.denominator);
  return {
    numerator: combined.numerator / reduction,
    denominator: combined.denominator / reduction,
  };
}

function roundPositiveFraction(numerator, denominator) {
  const whole = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? whole + 1n : whole;
}

function centsNumber(cents) {
  const value = Number(cents);
  if (!Number.isSafeInteger(value)) throw new Error('Florida calculation total is too large to display safely');
  return value / 100;
}

/**
 * Florida post-judgment interest for the deliberately narrow modern statutory path:
 *
 * - ordinary money judgments governed by Fla. Stat. §55.03;
 * - judgment obtained on or after July 1, 2011;
 * - the CFO rate in force on the judgment date applies through December 31;
 * - the rate changes to the CFO rate in force each January 1;
 * - simple daily interest on principal only, using 365 or 366 for that calendar year;
 * - no written-contract rate, excluded clerk judgment, partial payment, fee, cost, or renewal.
 *
 * Florida's ordinary-judgment sources do not establish one universal treatment of the payoff
 * boundary. Callers choose explicitly whether the entered through-date is included; the public
 * calculator defaults to including it and prints the convention with the result.
 */
export function floridaPostJudgmentInterest({
  principal,
  judgmentDate,
  endDate,
  history,
  validFrom = '2011-07-01',
  includeEndDate = true,
}) {
  assertPositivePrincipal(principal);
  const principalCentsNumber = Math.round(principal * 100);
  if (!Number.isSafeInteger(principalCentsNumber)
      || Math.abs(principalCentsNumber / 100 - principal) > 1e-9) {
    throw new Error('Florida judgment principal must be a cent-precise amount within the supported range');
  }
  if (typeof includeEndDate !== 'boolean') throw new Error('Florida end-date convention must be selected');
  const principalCents = BigInt(principalCentsNumber);
  parseDate(validFrom);
  const enteredDays = daysBetween(judgmentDate, endDate);
  if (enteredDays < 0) throw new Error('Calculation date is before the judgment date');
  const accrualEndExclusive = includeEndDate ? addDays(endDate, 1) : endDate;
  const totalDays = daysBetween(judgmentDate, accrualEndExclusive);
  if (judgmentDate < validFrom) {
    throw new Error(`This Florida calculator supports judgments entered on or after ${validFrom}`);
  }

  const h = sortHistory(history);
  const coverage = floridaJudgmentCoverage(h);
  if (judgmentDate >= coverage.judgment_date_before) {
    throw new Error(
      `Florida has not published the CFO entry rate for ${judgmentDate}; choose a judgment date before ${coverage.judgment_date_before}`
    );
  }
  if (accrualEndExclusive > coverage.calculation_date_through) {
    throw new Error(
      `A required January 1 Florida reset is not yet published; this date convention requires an accrual boundary after ${coverage.calculation_date_through}`
    );
  }

  const entry = rateOn(h, judgmentDate);
  if (!entry) throw new Error(`No Florida CFO rate on record for ${judgmentDate}`);
  const exactByDate = new Map(h.map((point) => [point.date, point]));
  const segments = [];
  let exactInterestCents = { numerator: 0n, denominator: 1n };
  let cursor = judgmentDate;
  let rate = { date: entry.effective_date, value: entry.value };

  while (cursor < accrualEndExclusive) {
    if (cursor !== judgmentDate) {
      rate = exactByDate.get(cursor);
      if (!rate) {
        throw new Error(`The official Florida CFO history is missing the required January 1 rate for ${cursor}`);
      }
    }
    const year = Number(cursor.slice(0, 4));
    const nextJanuary = `${year + 1}-01-01`;
    const segmentEnd = nextJanuary < accrualEndExclusive ? nextJanuary : accrualEndExclusive;
    const days = daysBetween(cursor, segmentEnd);
    const denominator = yearLen(year);
    const rateHundredths = Math.round(rate.value * 100);
    if (!Number.isSafeInteger(rateHundredths)
        || Math.abs(rateHundredths / 100 - rate.value) > 1e-9) {
      throw new Error(`Florida CFO rate ${rate.value}% at ${rate.date} is not cent-precise`);
    }
    const fractionNumerator = principalCents * BigInt(rateHundredths) * BigInt(days);
    const fractionDenominator = 10000n * BigInt(denominator);
    exactInterestCents = addPositiveFraction(
      exactInterestCents,
      fractionNumerator,
      fractionDenominator,
    );
    const dailyFactor = rate.value / 100 / denominator;
    const perDiemCents = roundPositiveFraction(
      principalCents * BigInt(rateHundredths),
      10000n * BigInt(denominator),
    );
    const segmentInterestCents = roundPositiveFraction(fractionNumerator, fractionDenominator);
    segments.push({
      start_date: cursor,
      end_date: segmentEnd,
      days,
      rate_percent: rate.value,
      rate_effective_date: rate.date,
      denominator,
      daily_factor: dailyFactor,
      per_diem: centsNumber(perDiemCents),
      interest: centsNumber(segmentInterestCents),
    });
    cursor = segmentEnd;
  }

  const entryYear = Number(judgmentDate.slice(0, 4));
  const currentPerDiem = segments.at(-1)?.per_diem
    ?? centsNumber(roundPositiveFraction(
      principalCents * BigInt(Math.round(entry.value * 100)),
      10000n * BigInt(yearLen(entryYear)),
    ));
  const interestCents = roundPositiveFraction(
    exactInterestCents.numerator,
    exactInterestCents.denominator,
  );
  const halfCentTie = exactInterestCents.numerator % exactInterestCents.denominator * 2n
    === exactInterestCents.denominator;
  const interest = centsNumber(interestCents);
  // Each period is independently rounded for display, while the legally relevant total is rounded
  // once from the exact combined fraction. Keep any difference explicit instead of silently
  // altering the final period—which could otherwise make a tiny, valid period appear negative.
  const displayedSegmentCents = segments.reduce(
    (sum, segment) => sum + BigInt(Math.round(segment.interest * 100)),
    0n,
  );
  const roundingAdjustmentCents = interestCents - displayedSegmentCents;
  return {
    method:
      'Fla. Stat. §55.03: simple daily interest; entry rate through December 31, ' +
      `adjusted each January 1; entered through-date ${includeEndDate ? 'included' : 'excluded'}`,
    supported_from: validFrom,
    entered_end_date: endDate,
    end_date_included: includeEndDate,
    accrual_end_exclusive: accrualEndExclusive,
    half_cent_rounding_tie: halfCentTie,
    entry_rate_percent: entry.value,
    entry_rate_effective_date: entry.effective_date,
    days: totalDays,
    segments,
    current_per_diem: currentPerDiem,
    rounding_adjustment: centsNumber(roundingAdjustmentCents),
    interest,
    total: centsNumber(principalCents + interestCents),
    coverage,
  };
}

/**
 * Simple interest at a FIXED rate (UK LPA 1998 style): the statutory rate applicable when the debt
 * became overdue applies for the whole period. actual/365.
 */
export function fixedSimpleInterest({
  principal,
  startDate,
  endDate,
  history,
  coverageEndExclusive = null,
}) {
  assertPositivePrincipal(principal);
  const days = daysBetween(startDate, endDate);
  if (days < 0) throw new Error('End date is before the start date');
  if (coverageEndExclusive) {
    parseDate(coverageEndExclusive);
    if (startDate >= coverageEndExclusive) {
      throw new Error(
        `Fixed-rate history does not support a start date on or after ${coverageEndExclusive}`
      );
    }
  }
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
    rate_selection_coverage_end_exclusive: coverageEndExclusive,
  };
}

/**
 * Interest at a FIXED rate COMPOUNDED ANNUALLY (e.g. Colorado prejudgment, C.R.S. §5-12-102: 8%
 * compounded annually). Daily accrual (actual/365) within each anniversary year; compounds on each
 * anniversary of the start date. Uses the rate applicable on the start date for the whole period.
 * (Same anniversary-compounding mechanism as the federal §1961 calculator, with a fixed rate.)
 */
export function fixedCompoundInterest({ principal, startDate, endDate, history }) {
  assertPositivePrincipal(principal);
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
export function halfYearRateCoverageEnd(history, label = 'Half-year') {
  const h = sortHistory(history);
  const latest = h.at(-1);
  if (!latest) throw new Error(`No ${label.toLowerCase()} rate history supplied`);
  const d = parseDate(latest.date);
  if (d.getUTCDate() !== 1 || ![0, 6].includes(d.getUTCMonth())) {
    throw new Error(`${label} rate ${latest.date} is not a half-year start`);
  }
  return addMonthsClamped(latest.date, 6);
}

export function euRateCoverageEnd(history) {
  return halfYearRateCoverageEnd(history, 'EU reference');
}

export function floatingSimpleInterest({ principal, startDate, endDate, history, marginPercent = 0 }) {
  assertPositivePrincipal(principal);
  const totalDays = daysBetween(startDate, endDate);
  if (totalDays < 0) throw new Error('End date is before the start date');
  const h = sortHistory(history);
  if (!rateOn(h, startDate)) throw new Error(`No rate on record for ${startDate}`);
  const coveredThrough = euRateCoverageEnd(h);
  if (endDate > coveredThrough) {
    throw new Error(
      `EU reference rates are only published through ${coveredThrough}; choose an end date on or before that boundary`
    );
  }

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
    method: `Simple interest (actual/365), reference rate re-fixing over time${marginPercent ? ` + ${marginPercent} percentage-point selected addition` : ''}`,
    days: totalDays,
    segments,
    interest: round2(interest),
    total: round2(principal + interest),
  };
}

function addDays(iso, days) {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return isoOf(d);
}

function addMonthsClamped(iso, months) {
  const source = parseDate(iso);
  const sourceDay = source.getUTCDate();
  const target = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(sourceDay, lastDay));
  return isoOf(target);
}

function isLastDayOfMonth(iso) {
  const date = parseDate(iso);
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  next.setUTCDate(next.getUTCDate() - 1);
  return date.getUTCDate() === next.getUTCDate();
}

function penaltyMonthPeriods(dueDate, endDate, maxMonths = Number.POSITIVE_INFINITY) {
  const days = daysBetween(dueDate, endDate);
  if (days < 0) throw new Error('Penalty end date is before the due date');
  const due = parseDate(dueDate);
  const calendarMonthPeriods = isLastDayOfMonth(dueDate);
  const periods = [];
  for (let month = 1; month <= maxMonths; month++) {
    let start;
    let end;
    if (calendarMonthPeriods) {
      start = isoOf(new Date(Date.UTC(
        due.getUTCFullYear(),
        due.getUTCMonth() + month,
        1,
      )));
      end = isoOf(new Date(Date.UTC(
        due.getUTCFullYear(),
        due.getUTCMonth() + month + 1,
        0,
      )));
    } else {
      start = addDays(addMonthsClamped(dueDate, month - 1), 1);
      end = addMonthsClamped(dueDate, month);
    }
    if (start > endDate) break;
    periods.push({
      month,
      start,
      end,
    });
  }
  return periods;
}

/** Count every full or partial penalty month after a civil-date deadline. */
export function fullOrPartialMonthsLate(dueDate, endDate, { maxMonths = Number.POSITIVE_INFINITY } = {}) {
  return penaltyMonthPeriods(dueDate, endDate, maxMonths).length;
}

function minimumFailureToFileFor(originalDueDate, minimums) {
  const match = (minimums || []).find((entry) => (
    entry
    && typeof entry.from === 'string'
    && entry.from <= originalDueDate
    && (!entry.to || originalDueDate <= entry.to)
    && Number.isFinite(entry.amount)
    && entry.amount >= 0
  ));
  if (!match) throw new Error(`No failure-to-file minimum is verified for original due date ${originalDueDate}`);
  return match.amount;
}

function validatePenaltyInputs({
  unpaidTax,
  originalDueDate,
  filingDueDate,
  filingDate,
  calculationDate,
  payments,
  installmentAgreementStartDate,
  levyNoticeDate,
}) {
  assertPositivePrincipal(unpaidTax);
  for (const value of [originalDueDate, filingDueDate, filingDate, calculationDate]) parseDate(value);
  if (filingDueDate < originalDueDate) {
    throw new Error('Filing deadline cannot be before the original payment due date');
  }
  if (calculationDate < originalDueDate) {
    throw new Error('Calculation date is before the original due date');
  }
  if (filingDate > calculationDate) {
    throw new Error('Return filing date cannot be after the calculation date');
  }
  for (const optional of [installmentAgreementStartDate, levyNoticeDate]) {
    if (optional) {
      parseDate(optional);
      if (optional < originalDueDate || optional > calculationDate) {
        throw new Error('Optional agreement/notice dates must fall between the original due date and calculation date');
      }
    }
  }

  let paid = 0;
  const normalizedPayments = [...(payments || [])]
    .map((payment) => ({ date: payment?.date, amount: Number(payment?.amount) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  for (const payment of normalizedPayments) {
    parseDate(payment.date);
    if (!Number.isFinite(payment.amount) || !(payment.amount > 0)) {
      throw new Error('Every partial payment must be a finite amount greater than zero');
    }
    if (payment.date <= originalDueDate || payment.date > calculationDate) {
      throw new Error('Partial payments must be after the original due date and on or before the calculation date');
    }
    paid += payment.amount;
  }
  if (paid > unpaidTax + 0.005) {
    throw new Error('Partial payments cannot exceed the unpaid tax entered; this tool does not allocate payments to penalties or interest');
  }
  if (installmentAgreementStartDate && filingDate > filingDueDate) {
    throw new Error('The 0.25% installment-agreement rate requires an individual return filed by its filing deadline');
  }
  return { payments: normalizedPayments, paid: Math.min(paid, unpaidTax) };
}

function irsTaxInterestWithPayments({
  unpaidTax,
  originalDueDate,
  calculationDate,
  quarterlyHistory,
  payments,
}) {
  const h = sortHistory(quarterlyHistory);
  const startRate = rateOn(h, originalDueDate);
  if (!startRate) {
    throw new Error(`No IRS rate on record for ${originalDueDate} (history starts ${h[0]?.date})`);
  }
  const coveredThrough = irsRateCoverageEnd(quarterlyHistory);
  if (calculationDate > coveredThrough) {
    throw new Error(
      `IRS rates are only published through ${coveredThrough}; choose a calculation date on or before that boundary`
    );
  }

  const paymentsByDate = new Map();
  for (const payment of payments) {
    paymentsByDate.set(payment.date, (paymentsByDate.get(payment.date) || 0) + payment.amount);
  }

  let principal = unpaidTax;
  let interest = 0;
  let rateIndex = h.findIndex((point) => point.date === startRate.effective_date);
  const ratesUsed = new Map();
  const cursor = parseDate(originalDueDate);
  const end = parseDate(calculationDate);
  while (cursor < end) {
    const iso = isoOf(cursor);
    const payment = paymentsByDate.get(iso) || 0;
    if (payment) principal = Math.max(0, principal - payment);
    while (rateIndex + 1 < h.length && h[rateIndex + 1].date <= iso) rateIndex++;
    const rate = h[rateIndex];
    interest += (principal + interest) * (rate.value / 100 / yearLen(cursor.getUTCFullYear()));
    ratesUsed.set(rate.date, rate.value);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    interest: round2(interest),
    remaining_tax: round2(unpaidTax - payments.reduce((sum, payment) => sum + payment.amount, 0)),
    rates_used: [...ratesUsed.entries()].map(([effective_date, value]) => ({ effective_date, value })),
  };
}

function failureToPayRate({
  periodStart,
  periodEnd,
  installmentAgreementStartDate,
  levyNoticeDate,
  rules,
}) {
  if (levyNoticeDate && periodStart > addDays(levyNoticeDate, 10)) {
    return { rate: rules.levy_rate, reason: 'post-levy-notice rate' };
  }
  // The reduced rate applies for any penalty month during which a qualifying agreement is in
  // effect, including an agreement that begins after that civil penalty month has started.
  if (installmentAgreementStartDate && installmentAgreementStartDate <= periodEnd) {
    return { rate: rules.installment_rate, reason: 'qualifying installment-agreement rate' };
  }
  return { rate: rules.standard_rate, reason: 'standard rate' };
}

/**
 * Individual Form 1040 failure-to-file/failure-to-pay estimate plus §6621/§6622 interest.
 *
 * The modeled total deliberately excludes interest on the failure-to-pay penalty: IRS guidance
 * starts that interest on notice/assessment dates that cannot be inferred from the civil dates
 * entered here. Every result exposes that exclusion and must be presented as an estimate.
 */
export function irsPenaltyAndInterestEstimate({
  unpaidTax,
  originalDueDate,
  filingDueDate = originalDueDate,
  filingDate,
  calculationDate,
  quarterlyHistory,
  penaltyRules,
  payments = [],
  installmentAgreementStartDate = null,
  levyNoticeDate = null,
}) {
  const normalized = validatePenaltyInputs({
    unpaidTax,
    originalDueDate,
    filingDueDate,
    filingDate,
    calculationDate,
    payments,
    installmentAgreementStartDate,
    levyNoticeDate,
  });
  const ftfRules = penaltyRules?.failure_to_file;
  const ftpRules = penaltyRules?.failure_to_pay;
  if (!ftfRules || !ftpRules) throw new Error('Verified IRS penalty rules are missing');
  for (const [name, value] of Object.entries({
    'failure-to-file monthly rate': ftfRules.monthly_rate,
    'failure-to-pay standard rate': ftpRules.standard_rate,
    'failure-to-pay installment rate': ftpRules.installment_rate,
    'failure-to-pay levy rate': ftpRules.levy_rate,
    'failure-to-pay cap': ftpRules.max_fraction,
  })) {
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`Invalid verified ${name}`);
  }
  if (!Number.isInteger(ftfRules.max_months) || ftfRules.max_months < 1) {
    throw new Error('Invalid verified failure-to-file month cap');
  }

  const taxInterest = irsTaxInterestWithPayments({
    unpaidTax,
    originalDueDate,
    calculationDate,
    quarterlyHistory,
    payments: normalized.payments,
  });

  const paymentTotalsBefore = (date) => normalized.payments
    .filter((payment) => payment.date < date)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const ftpCap = round2(unpaidTax * ftpRules.max_fraction);
  let ftpTotal = 0;
  const ftpPeriods = [];
  for (const period of penaltyMonthPeriods(originalDueDate, calculationDate)) {
    if (ftpTotal >= ftpCap) break;
    const balance = round2(Math.max(0, unpaidTax - paymentTotalsBefore(period.start)));
    if (balance <= 0) break;
    const rateInfo = failureToPayRate({
      periodStart: period.start,
      periodEnd: period.end,
      installmentAgreementStartDate,
      levyNoticeDate,
      rules: ftpRules,
    });
    const rawCharge = round2(balance * rateInfo.rate);
    const charge = round2(Math.min(rawCharge, ftpCap - ftpTotal));
    ftpTotal = round2(ftpTotal + charge);
    ftpPeriods.push({
      ...period,
      unpaid_tax_at_start: balance,
      rate: rateInfo.rate,
      rate_reason: rateInfo.reason,
      charge,
    });
  }

  const ftfPeriods = filingDate > filingDueDate
    ? penaltyMonthPeriods(filingDueDate, filingDate, ftfRules.max_months)
    : [];
  const ftfGross = round2(unpaidTax * ftfRules.monthly_rate * ftfPeriods.length);
  const usedFtpMonths = new Set();
  let overlapReduction = 0;
  const ftfBreakdown = ftfPeriods.map((period) => {
    const ftpIndex = ftpPeriods.findIndex((ftp, index) => (
      !usedFtpMonths.has(index)
      && ftp.start <= period.start
      && period.start <= ftp.end
    ));
    const reduction = ftpIndex >= 0 ? ftpPeriods[ftpIndex].charge : 0;
    if (ftpIndex >= 0) usedFtpMonths.add(ftpIndex);
    overlapReduction = round2(overlapReduction + reduction);
    return {
      ...period,
      gross_charge: round2(unpaidTax * ftfRules.monthly_rate),
      ftp_overlap_reduction: reduction,
    };
  });
  const coordinatedFtf = round2(Math.max(0, ftfGross - overlapReduction));
  const filingDaysLate = Math.max(0, daysBetween(filingDueDate, filingDate));
  const minimumAmount = minimumFailureToFileFor(originalDueDate, ftfRules.minimums);
  const minimumCandidate = filingDaysLate > ftfRules.minimum_after_days
    ? round2(Math.min(minimumAmount, unpaidTax))
    : 0;
  const ftfTotal = round2(Math.max(coordinatedFtf, minimumCandidate));
  const minimumApplied = minimumCandidate > coordinatedFtf;

  const ftfInterest = ftfTotal > 0
    ? irsInterest({
        principal: ftfTotal,
        startDate: filingDueDate,
        endDate: calculationDate,
        quarterlyHistory,
      })
    : { interest: 0, rates_used: [] };
  const ratesUsed = new Map();
  for (const rate of [...taxInterest.rates_used, ...ftfInterest.rates_used]) {
    ratesUsed.set(rate.effective_date, rate.value);
  }

  const penalties = round2(ftfTotal + ftpTotal);
  const modeledInterest = round2(taxInterest.interest + ftfInterest.interest);
  const modeledTotal = round2(taxInterest.remaining_tax + penalties + modeledInterest);
  const aepScenarioTotal = round2(taxInterest.remaining_tax + taxInterest.interest);

  return {
    method: 'IRC §6651 penalties plus §6621/§6622 daily-compounded interest (individual Form 1040 estimate)',
    original_unpaid_tax: round2(unpaidTax),
    partial_payments: normalized.payments,
    remaining_tax: taxInterest.remaining_tax,
    filing_days_late: filingDaysLate,
    payment_days_late: Math.max(0, daysBetween(originalDueDate, calculationDate)),
    filing_months: ftfPeriods.length,
    payment_months: ftpPeriods.length,
    failure_to_file: {
      gross_penalty: ftfGross,
      overlap_reduction: overlapReduction,
      coordinated_penalty: coordinatedFtf,
      minimum_amount_for_due_year: minimumAmount,
      minimum_candidate: minimumCandidate,
      minimum_applied: minimumApplied,
      penalty: ftfTotal,
      interest: round2(ftfInterest.interest),
      months: ftfBreakdown,
    },
    failure_to_pay: {
      penalty: ftpTotal,
      cap: ftpCap,
      months: ftpPeriods,
      interest: null,
      interest_excluded_reason: 'The IRS starts interest on this penalty from notice/assessment dates, which were not entered.',
    },
    tax_interest: taxInterest.interest,
    modeled_interest: modeledInterest,
    penalties,
    modeled_total: modeledTotal,
    rates_used: [...ratesUsed.entries()].map(([effective_date, value]) => ({ effective_date, value })),
    aep: {
      may_apply: originalDueDate >= '2026-01-01',
      scenario_total_if_irs_confirms_relief: aepScenarioTotal,
      potential_modeled_savings: round2(modeledTotal - aepScenarioTotal),
    },
    assumptions: [
      'Individual original Form 1040/1040-SR with nonfraudulent tax shown on the return.',
      'The unpaid-tax input is net of payments and credits effective by the original due date.',
      'Later listed payments are applied to tax principal first; they do not pay penalties or accrued interest in this estimate.',
      'A payment must precede a failure-to-pay penalty month to reduce that month; a payment on its first day reduces later months.',
      ...(installmentAgreementStartDate
        ? [levyNoticeDate
            ? 'The qualifying installment agreement is assumed to remain effective until the modeled post-levy rate transition.'
            : 'The qualifying installment agreement is assumed to remain effective through the calculation date.']
        : []),
      'No penalty abatement is applied to the statutory result.',
    ],
    excluded: [
      'Interest on the failure-to-pay penalty without IRS notice/assessment dates.',
      'Estimated-tax, accuracy-related, fraud, deposit, partnership, corporate, and amended-assessment penalties.',
      'Disaster, combat-zone, bankruptcy, reasonable-cause, and other account-specific adjustments.',
    ],
  };
}

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
