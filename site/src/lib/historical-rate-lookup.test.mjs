import test from 'node:test';
import assert from 'node:assert/strict';

import { historicalRateAtDate } from './historical-rate-lookup.mjs';

const history = [
  { effective_date: '2026-07-01', value: 7.25, value_text: '7.25%' },
  { effective_date: '2026-01-01', value: 7, value_text: '7%' },
  { effective_date: '2025-07-01', value: 6.5, value_text: '6.5%' },
];

test('historical lookup selects the latest period on or before the requested date', () => {
  assert.equal(historicalRateAtDate(history, '2026-03-15', { coverageThrough: '2026-08-20' }).value_text, '7%');
  assert.equal(historicalRateAtDate(history, '2026-07-01', { coverageThrough: '2026-08-20' }).value_text, '7.25%');
});

test('historical lookup refuses dates before verified coverage', () => {
  assert.throws(
    () => historicalRateAtDate(history, '2025-06-30', { coverageThrough: '2026-08-20' }),
    /Verified coverage begins 2025-07-01/,
  );
});

test('historical lookup refuses dates after the source-aware coverage end', () => {
  assert.throws(
    () => historicalRateAtDate(history, '2026-08-21', { coverageThrough: '2026-08-20' }),
    /Verified coverage ends 2026-08-20/,
  );
});

test('historical lookup rejects invalid dates and missing histories', () => {
  assert.throws(() => historicalRateAtDate(history, '2026-02-30', { coverageThrough: '2026-08-20' }), /valid calendar date/);
  assert.throws(() => historicalRateAtDate([], '2026-01-01', { coverageThrough: '2026-08-20' }), /No verified history/);
  assert.throws(() => historicalRateAtDate(history, '2026-01-01'), /Verified coverage end must use YYYY-MM-DD/);
});
