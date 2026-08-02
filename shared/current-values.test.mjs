import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  currentObservationForMetric,
  currentValuesOf,
  withCurrentValues,
} from './current-values.mjs';

const entity = {
  slug: 'future-quarter-test',
  generated_at: '2026-08-02T12:00:00Z',
  latest: {
    annual_rate: { metric: 'annual_rate', effective_date: '2026-10-01', value: 9 },
  },
  history: {
    annual_rate: [
      { metric: 'annual_rate', effective_date: '2026-10-01', value: 9 },
      { metric: 'annual_rate', effective_date: '2026-07-01', value: 8 },
      { metric: 'annual_rate', effective_date: '2026-04-01', value: 7 },
    ],
  },
};

test('current selection does not promote a preannounced future period', () => {
  assert.equal(
    currentObservationForMetric(entity, 'annual_rate', '2026-08-02').effective_date,
    '2026-07-01',
  );
  assert.equal(currentValuesOf(entity, '2026-08-02').annual_rate.value, 8);
});

test('machine-safe entity keeps current and latest-published values distinct', () => {
  const safe = withCurrentValues(entity, '2026-08-02');
  assert.equal(safe.current.annual_rate.effective_date, '2026-07-01');
  assert.equal(safe.latest.annual_rate.effective_date, '2026-07-01');
  assert.equal(safe.latest_published.annual_rate.effective_date, '2026-10-01');
  assert.equal(safe.current_as_of, '2026-08-02');
});

test('legacy fallback is allowed only when its value is already effective', () => {
  const legacy = { latest: { annual_rate: { effective_date: '2026-07-01', value: 8 } } };
  assert.equal(currentObservationForMetric(legacy, 'annual_rate', '2026-08-02').value, 8);
  assert.equal(currentObservationForMetric(legacy, 'annual_rate', '2026-06-30'), null);
});
