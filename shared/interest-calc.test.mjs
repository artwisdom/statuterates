// Tests for the shared interest engine — hand-computed expected values.
// Run: node --test  (from shared/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rateOn, mondayOf, daysBetween,
  federalPostJudgment, irsInterest, fixedSimpleInterest, floatingSimpleInterest, fixedCompoundInterest,
} from './interest-calc.mjs';

test('rateOn picks the value in force on a date', () => {
  const h = [
    { effective_date: '2026-01-01', value: 7 },
    { effective_date: '2026-04-01', value: 6 },
    { effective_date: '2026-07-01', value: 7 },
  ];
  assert.equal(rateOn(h, '2026-03-31').value, 7);
  assert.equal(rateOn(h, '2026-04-01').value, 6);
  assert.equal(rateOn(h, '2026-12-01').value, 7);
  assert.equal(rateOn(h, '2025-12-31'), null);
});

test('mondayOf handles all weekdays incl. Sunday', () => {
  assert.equal(mondayOf('2026-07-08'), '2026-07-06'); // Wed -> Mon
  assert.equal(mondayOf('2026-07-06'), '2026-07-06'); // Mon -> itself
  assert.equal(mondayOf('2026-07-12'), '2026-07-06'); // Sun -> prior Mon
});

test('federal post-judgment uses the week PRECEDING the judgment week', () => {
  const weekly = [
    { effective_date: '2026-06-29', value: 3.98 },
    { effective_date: '2026-07-06', value: 3.95 },
  ];
  // Judgment Wed 2026-07-08 (week of Jul 6) -> preceding week Mon Jun 29 -> 3.98%
  const r = federalPostJudgment({ principal: 100000, judgmentDate: '2026-07-08', endDate: '2026-10-08', weeklyHistory: weekly });
  assert.equal(r.rate_percent, 3.98);
  assert.equal(r.rate_week_monday, '2026-06-29');
  assert.equal(r.days, 92);
  // 100000 * 3.98% * 92/365 = 1003.18
  assert.equal(r.interest, 1003.18);
  assert.equal(r.total, 101003.18);
});

test('federal post-judgment compounds annually (§1961(b))', () => {
  const weekly = [{ effective_date: '2024-07-01', value: 5 }];
  const r = federalPostJudgment({ principal: 100000, judgmentDate: '2024-07-08', endDate: '2026-07-08', weeklyHistory: weekly });
  // Year 1: 100000*5% = 5000 -> base 105000; Year 2: 105000*5% = 5250; total 10250
  assert.equal(r.interest, 10250);
  assert.equal(r.total, 110250);
});

test('IRS interest compounds daily (§6622)', () => {
  const q = [{ effective_date: '2025-10-01', value: 7 }];
  const r = irsInterest({ principal: 1000, startDate: '2026-01-01', endDate: '2026-01-11', quarterlyHistory: q });
  // (1 + 0.07/365)^10 - 1 -> 1.92 on 1000
  assert.equal(r.days, 10);
  assert.equal(r.interest, 1.92);
});

test('IRS interest switches rate at the quarter boundary', () => {
  const q = [
    { effective_date: '2026-01-01', value: 7 },
    { effective_date: '2026-04-01', value: 6 },
  ];
  const r = irsInterest({ principal: 1000000, startDate: '2026-03-30', endDate: '2026-04-02', quarterlyHistory: q });
  const expected = 1000000 * ((1 + 0.07 / 365) ** 2 * (1 + 0.06 / 365) - 1);
  assert.equal(r.interest, Math.round((expected + Number.EPSILON) * 100) / 100);
  assert.deepEqual(r.rates_used.map((x) => x.value), [7, 6]);
});

test('fixed simple interest (UK LPA style)', () => {
  const h = [
    { effective_date: '2026-01-01', value: 11.75 },
    { effective_date: '2026-07-01', value: 11.75 },
  ];
  const r = fixedSimpleInterest({ principal: 10000, startDate: '2026-02-01', endDate: '2026-05-12', history: h });
  assert.equal(r.days, 100);
  // 10000 * 11.75% * 100/365 = 321.92 ; daily 3.22
  assert.equal(r.interest, 321.92);
  assert.equal(r.daily_amount, 3.22);
  assert.equal(r.rate_effective_date, '2026-01-01');
});

test('fixed compound interest compounds annually (Colorado style)', () => {
  const h = [{ effective_date: '1990-01-01', value: 8 }];
  // 8% on $10,000 over exactly 2 non-leap anniversary years: 10000*(1.08^2)-10000 = 1664.00
  const r = fixedCompoundInterest({ principal: 10000, startDate: '2022-01-01', endDate: '2024-01-01', history: h });
  assert.equal(r.rate_percent, 8);
  assert.equal(r.days, 730);
  assert.equal(r.interest, 1664);
  assert.equal(r.total, 11664);
  // Under one year it matches simple interest (no anniversary reached): 10000*8%*90/365 = 197.26
  const r2 = fixedCompoundInterest({ principal: 10000, startDate: '2023-01-01', endDate: '2023-04-01', history: h });
  assert.equal(r2.interest, fixedSimpleInterest({ principal: 10000, startDate: '2023-01-01', endDate: '2023-04-01', history: h }).interest);
});

test('floating simple interest re-fixes across segments (EU style)', () => {
  const h = [
    { effective_date: '2026-01-01', value: 2.9 },
    { effective_date: '2026-07-01', value: 2.4 },
  ];
  const r = floatingSimpleInterest({ principal: 10000, startDate: '2026-06-01', endDate: '2026-08-01', history: h, marginPercent: 8 });
  assert.equal(r.segments.length, 2);
  assert.deepEqual(r.segments.map((s) => s.rate_percent), [10.9, 10.4]);
  // (10000*10.9%*30 + 10000*10.4%*31)/365 = 177.92
  assert.equal(r.interest, 177.92);
});

test('errors: bad ranges and missing rates fail loud', () => {
  assert.throws(() => fixedSimpleInterest({ principal: 100, startDate: '2026-05-01', endDate: '2026-04-01', history: [{ effective_date: '2026-01-01', value: 5 }] }), /before/);
  assert.throws(() => fixedSimpleInterest({ principal: 100, startDate: '2020-01-01', endDate: '2020-02-01', history: [{ effective_date: '2026-01-01', value: 5 }] }), /No rate/);
  assert.throws(() => irsInterest({ principal: 0, startDate: '2026-01-01', endDate: '2026-02-01', quarterlyHistory: [] }), /Principal/);
  assert.equal(daysBetween('2026-01-01', '2026-01-01'), 0);
});
