// Tests for the shared interest engine — hand-computed expected values.
// Run: node --test  (from shared/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  rateOn, mondayOf, daysBetween,
  federalPostJudgment, irsInterest, fixedSimpleInterest, floatingSimpleInterest, fixedCompoundInterest,
  fullOrPartialMonthsLate, irsPenaltyAndInterestEstimate, irsRateCoverageEnd,
} from './interest-calc.mjs';

const IRS_PENALTY_RULES = {
  failure_to_file: {
    monthly_rate: 0.05,
    max_months: 5,
    minimum_after_days: 60,
    minimums: [
      { from: '2016-01-01', to: '2017-12-31', amount: 205 },
      { from: '2018-01-01', to: '2019-12-31', amount: 210 },
      { from: '2020-01-01', to: '2022-12-31', amount: 435 },
      { from: '2023-01-01', to: '2023-12-31', amount: 450 },
      { from: '2024-01-01', to: '2024-12-31', amount: 485 },
      { from: '2025-01-01', to: '2025-12-31', amount: 510 },
      { from: '2026-01-01', to: '2026-12-31', amount: 525 },
      { from: '2027-01-01', to: null, amount: 535 },
    ],
  },
  failure_to_pay: {
    standard_rate: 0.005,
    installment_rate: 0.0025,
    levy_rate: 0.01,
    max_fraction: 0.25,
  },
};

const ZERO_IRS_HISTORY = [
  { effective_date: '2016-10-01', value: 0 },
  ...Array.from({ length: 44 }, (_, index) => {
    const d = new Date(Date.UTC(2017, index * 3, 1));
    return { effective_date: d.toISOString().slice(0, 10), value: 0 };
  }),
];

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
  const q = [{ effective_date: '2026-01-01', value: 7 }];
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

test('IRS interest refuses to reuse the last known rate in an unpublished quarter', () => {
  const q = [
    { effective_date: '2026-04-01', value: 6 },
    { effective_date: '2026-07-01', value: 7 },
  ];
  assert.equal(irsRateCoverageEnd(q), '2026-10-01');
  assert.doesNotThrow(() => irsInterest({
    principal: 1000,
    startDate: '2026-07-01',
    endDate: '2026-10-01',
    quarterlyHistory: q,
  }));
  assert.throws(() => irsInterest({
    principal: 1000,
    startDate: '2026-07-01',
    endDate: '2026-10-02',
    quarterlyHistory: q,
  }), /only published through 2026-10-01/);
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

test('full or partial penalty months use civil-date anniversaries', () => {
  assert.equal(fullOrPartialMonthsLate('2026-04-15', '2026-04-15'), 0);
  assert.equal(fullOrPartialMonthsLate('2026-04-15', '2026-04-16'), 1);
  assert.equal(fullOrPartialMonthsLate('2026-04-15', '2026-05-15'), 1);
  assert.equal(fullOrPartialMonthsLate('2026-04-15', '2026-05-16'), 2);
  assert.equal(fullOrPartialMonthsLate('2025-12-30', '2026-03-01'), 3);
  assert.equal(fullOrPartialMonthsLate('2025-01-31', '2025-02-28'), 1);
  assert.equal(fullOrPartialMonthsLate('2025-01-31', '2025-03-01'), 2);
  assert.equal(fullOrPartialMonthsLate('2026-04-30', '2026-05-31'), 1);
  assert.equal(fullOrPartialMonthsLate('2026-04-30', '2026-06-01'), 2);
  assert.equal(fullOrPartialMonthsLate('2026-02-28', '2026-03-31'), 1);
  assert.equal(fullOrPartialMonthsLate('2026-02-28', '2026-04-01'), 2);
  assert.equal(fullOrPartialMonthsLate('2024-02-29', '2024-03-31'), 1);
});

test('one day late coordinates standard filing and payment penalties', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDueDate: '2026-04-15',
    filingDate: '2026-04-16',
    calculationDate: '2026-04-16',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(result.failure_to_file.penalty, 450);
  assert.equal(result.failure_to_pay.penalty, 50);
  assert.equal(result.penalties, 500);
  assert.equal(result.tax_interest, 0);
  assert.equal(result.modeled_total, 10500);
});

test('partial payments change later FTP bases but not the FTF base', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 5000,
    originalDueDate: '2022-04-15',
    filingDueDate: '2022-04-15',
    filingDate: '2022-07-13',
    calculationDate: '2022-07-13',
    payments: [
      { date: '2022-06-01', amount: 2000 },
      { date: '2022-07-13', amount: 3000 },
    ],
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.deepEqual(
    result.failure_to_pay.months.map((month) => [month.unpaid_tax_at_start, month.charge]),
    [[5000, 25], [5000, 25], [3000, 15]]
  );
  assert.equal(result.failure_to_pay.penalty, 65);
  assert.equal(result.failure_to_file.gross_penalty, 750);
  assert.equal(result.failure_to_file.overlap_reduction, 65);
  assert.equal(result.failure_to_file.penalty, 685);
  assert.equal(result.remaining_tax, 0);
});

test('a payment on a failure-to-pay month start reduces only later months', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 5000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-06-16',
    payments: [{ date: '2026-05-16', amount: 2000 }],
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });

  assert.deepEqual(
    result.failure_to_pay.months.map((month) => [month.unpaid_tax_at_start, month.charge]),
    [[5000, 25], [5000, 25], [3000, 15]],
  );
});

test('more-than-60-day minimum applies, but exactly 60 days does not', () => {
  const sixty = irsPenaltyAndInterestEstimate({
    unpaidTax: 1000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-06-14',
    calculationDate: '2026-06-14',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(sixty.filing_days_late, 60);
  assert.equal(sixty.failure_to_file.minimum_applied, false);
  assert.equal(sixty.failure_to_file.penalty, 90);
  assert.equal(sixty.failure_to_pay.penalty, 10);

  const sixtyOne = irsPenaltyAndInterestEstimate({
    unpaidTax: 1000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-06-15',
    calculationDate: '2026-06-15',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(sixtyOne.filing_days_late, 61);
  assert.equal(sixtyOne.failure_to_file.minimum_applied, true);
  assert.equal(sixtyOne.failure_to_file.penalty, 525);
  assert.equal(sixtyOne.failure_to_pay.penalty, 10);

  const smallBalance = irsPenaltyAndInterestEstimate({
    unpaidTax: 148,
    originalDueDate: '2026-04-15',
    filingDate: '2026-06-15',
    calculationDate: '2026-06-15',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(smallBalance.failure_to_file.coordinated_penalty, 13.32);
  assert.equal(smallBalance.failure_to_file.penalty, 148);
  assert.equal(smallBalance.failure_to_pay.penalty, 1.48);
});

test('a filing extension moves only the filing clock', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDueDate: '2026-10-15',
    filingDate: '2026-10-15',
    calculationDate: '2026-10-15',
    quarterlyHistory: [
      ...ZERO_IRS_HISTORY,
      { effective_date: '2026-10-01', value: 0 },
    ],
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(result.failure_to_file.penalty, 0);
  assert.equal(result.failure_to_pay.penalty, 300);
  assert.equal(result.payment_months, 6);
});

test('filing on or before the filing deadline produces no filing penalty', () => {
  const timely = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDueDate: '2026-10-15',
    filingDate: '2026-10-15',
    calculationDate: '2026-10-15',
    quarterlyHistory: [
      ...ZERO_IRS_HISTORY,
      { effective_date: '2026-10-01', value: 0 },
    ],
    penaltyRules: IRS_PENALTY_RULES,
  });
  const early = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDueDate: '2026-10-15',
    filingDate: '2026-09-30',
    calculationDate: '2026-10-15',
    quarterlyHistory: [
      ...ZERO_IRS_HISTORY,
      { effective_date: '2026-10-01', value: 0 },
    ],
    penaltyRules: IRS_PENALTY_RULES,
  });

  assert.equal(timely.failure_to_file.penalty, 0);
  assert.equal(early.failure_to_file.penalty, 0);
  assert.equal(early.filing_days_late, 0);
});

test('qualifying installment and post-levy FTP rates begin on verified dates', () => {
  const installment = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-07-10',
    installmentAgreementStartDate: '2026-04-16',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(installment.failure_to_pay.penalty, 75);
  assert.deepEqual(installment.failure_to_pay.months.map((month) => month.rate), [0.0025, 0.0025, 0.0025]);

  const midMonthInstallment = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-06-16',
    installmentAgreementStartDate: '2026-05-01',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.deepEqual(
    midMonthInstallment.failure_to_pay.months.map((month) => month.rate),
    [0.0025, 0.0025, 0.0025],
  );

  const levy = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-09-01',
    levyNoticeDate: '2026-07-10',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(levy.failure_to_pay.penalty, 300);
  assert.deepEqual(levy.failure_to_pay.months.map((month) => month.rate), [0.005, 0.005, 0.005, 0.005, 0.01]);
});

test('failure-to-file and failure-to-pay caps produce the standard 47.5% case', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2017-01-15',
    filingDate: '2017-06-15',
    calculationDate: '2021-03-15',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(result.failure_to_file.penalty, 2250);
  assert.equal(result.failure_to_pay.penalty, 2500);
  assert.equal(result.penalties, 4750);
});

test('tax interest crosses the Q3 boundary and compounds daily', () => {
  const result = irsPenaltyAndInterestEstimate({
    unpaidTax: 10000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-07-15',
    quarterlyHistory: [
      { effective_date: '2026-04-01', value: 6 },
      { effective_date: '2026-07-01', value: 7 },
    ],
    penaltyRules: IRS_PENALTY_RULES,
  });
  assert.equal(result.tax_interest, 154.59);
  assert.deepEqual(result.rates_used.map((rate) => rate.value), [6, 7]);
});

test('IRS penalty estimate validates unsafe or unsupported inputs', () => {
  const baseArgs = {
    unpaidTax: 1000,
    originalDueDate: '2026-04-15',
    filingDate: '2026-04-15',
    calculationDate: '2026-05-15',
    quarterlyHistory: ZERO_IRS_HISTORY,
    penaltyRules: IRS_PENALTY_RULES,
  };
  assert.throws(() => irsPenaltyAndInterestEstimate({
    ...baseArgs,
    filingDate: '2026-05-16',
  }), /after the calculation date/);
  assert.throws(() => irsPenaltyAndInterestEstimate({
    ...baseArgs,
    payments: [{ date: '2026-05-01', amount: 1001 }],
  }), /cannot exceed/);
  assert.throws(() => irsPenaltyAndInterestEstimate({
    ...baseArgs,
    filingDate: '2026-05-01',
    installmentAgreementStartDate: '2026-04-16',
  }), /requires an individual return filed/);
  assert.throws(() => irsPenaltyAndInterestEstimate({
    ...baseArgs,
    calculationDate: '2027-01-02',
    filingDate: '2026-04-15',
    quarterlyHistory: [
      { effective_date: '2026-04-01', value: 6 },
      { effective_date: '2026-07-01', value: 7 },
    ],
  }), /only published through/);
});
