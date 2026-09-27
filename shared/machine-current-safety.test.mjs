import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BRANCH_PARTIAL_STATUS,
  csvObservationUsage,
  isMachineCurrentUsable,
  machineCurrentGuard,
  UNVERIFIED_LAST_RECORDED_STATUS,
  withMachineCurrentGuard,
} from './machine-current-safety.mjs';

const observation = {
  metric: 'annual_rate',
  value: 9,
  value_text: '9%',
  unit: 'percent_per_annum',
  effective_date: '2026-09-01',
  source_id: 'official-source',
  source_url: 'https://example.gov/rate',
  retrieved_at: '2026-09-27T12:00:00Z',
  confidence: 'high',
  method: 'statute-fixed',
  notes: 'Synthetic observation.',
};

function record(currentRateStatus = null) {
  return {
    slug: 'synthetic-rate',
    current_as_of: '2026-09-27',
    metadata: {
      ...(currentRateStatus ? { current_rate_status: currentRateStatus } : {}),
      calculation: {
        status: 'reference_only',
        branches_complete: false,
        reason: 'Synthetic bounded refusal.',
      },
    },
    latest: { annual_rate: observation },
    current: { annual_rate: observation },
    latest_published: { annual_rate: observation },
    history: { annual_rate: [observation] },
  };
}

test('only explicit current-rate refusal statuses activate the machine guard', () => {
  const ordinaryReferenceOnly = record();
  assert.equal(isMachineCurrentUsable(ordinaryReferenceOnly), true);
  assert.equal(machineCurrentGuard(ordinaryReferenceOnly), null);

  assert.equal(machineCurrentGuard(record(UNVERIFIED_LAST_RECORDED_STATUS)).status, UNVERIFIED_LAST_RECORDED_STATUS);
  assert.equal(machineCurrentGuard(record(BRANCH_PARTIAL_STATUS)).status, BRANCH_PARTIAL_STATUS);
});
test('guarded records keep history and latest-published provenance but clear current aliases', () => {
  const guarded = withMachineCurrentGuard(record(BRANCH_PARTIAL_STATUS));
  assert.deepEqual(guarded.current, {});
  assert.deepEqual(guarded.latest, {});
  assert.equal(guarded.latest_published.annual_rate.value, 9);
  assert.equal(guarded.history.annual_rate[0].value, 9);
  assert.equal(guarded.machine_current_usable, false);
  assert.equal(guarded.metadata.current_rate_numeric, null);
});

test('CSV usage retains numeric provenance while blocking guarded current use', () => {
  const guarded = withMachineCurrentGuard(record(UNVERIFIED_LAST_RECORDED_STATUS));
  assert.deepEqual(csvObservationUsage(guarded, 'annual_rate', observation), {
    record_usage: 'historical_provenance_only',
    current_use_allowed: false,
    current_rate_status: UNVERIFIED_LAST_RECORDED_STATUS,
  });
});
