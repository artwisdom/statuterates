// Tests for the UK/EU semi-annual derivation (reference-date rules are legal-money-critical).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valueOnDate, halfYearPeriods, buildUkLatePayment, buildEuReference } from './rates-intl.mjs';

const src = { source_id: 's', source_url: 'https://x', retrieved_at: '2026-07-08T00:00:00Z' };

test('valueOnDate returns the value in force on a date', () => {
  const pts = [
    { date: '2024-08-01', value: 5.0 },
    { date: '2025-02-06', value: 4.5 },
    { date: '2025-12-18', value: 3.75 },
  ];
  assert.equal(valueOnDate(pts, '2024-07-01'), null); // before first point
  assert.equal(valueOnDate(pts, '2024-08-01'), 5.0); // on the change day
  assert.equal(valueOnDate(pts, '2025-06-30'), 4.5); // between changes
  assert.equal(valueOnDate(pts, '2026-07-01'), 3.75); // after last change
});

test('halfYearPeriods enumerates Jan1/Jul1 up to today', () => {
  const p = halfYearPeriods(2025, '2026-07-08');
  assert.deepEqual(p.map((x) => x.start), ['2025-01-01', '2025-07-01', '2026-01-01', '2026-07-01']);
  // a future half-year is excluded
  assert.ok(!halfYearPeriods(2025, '2026-03-01').some((x) => x.start === '2026-07-01'));
});

test('UK late-payment = base rate on the reference date + 8pp, fixed per half-year', () => {
  const boe = [
    { date: '2025-06-30', value: 4.25 }, // in force on 30 Jun 2025 -> H2-2025 uses this
    { date: '2025-12-18', value: 3.75 }, // in force on 30 Jun 2026 -> H2-2026 uses this
  ];
  const { observations } = buildUkLatePayment(boe, { ...src, today: '2026-07-08' });
  const byDate = Object.fromEntries(observations.map((o) => [o.effective_date, o.value_numeric]));
  assert.equal(byDate['2025-07-01'], 12.25); // H2-2025: base 4.25 (30 Jun 2025) + 8
  assert.equal(byDate['2026-01-01'], 11.75); // H1-2026: base 3.75 (31 Dec 2025) + 8
  assert.equal(byDate['2026-07-01'], 11.75); // H2-2026: base 3.75 (30 Jun 2026) + 8
  assert.equal(observations[0].confidence, 'medium');
  assert.match(observations[0].method, /uk_lpa1998/);
  assert.match(observations[0].notes, /not legal advice/i);
});

test('EU reference = ECB MRO in force on the first day of the half-year', () => {
  const ecb = [
    { date: '2026-06-17', value: 2.4 },
  ];
  const { observations } = buildEuReference(ecb, { ...src, today: '2026-07-08' });
  const h2 = observations.find((o) => o.effective_date === '2026-07-01');
  assert.equal(h2.value_numeric, 2.4); // ECB MRO on 1 Jul 2026
  assert.match(h2.notes, /10\.4/); // note surfaces the 8pp-floor statutory example
  assert.equal(h2.confidence, 'medium');
});
