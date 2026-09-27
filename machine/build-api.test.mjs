import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BRANCH_PARTIAL_STATUS,
  UNVERIFIED_LAST_RECORDED_LABEL,
  withRateVerificationStatus,
} from './build-api.mjs';
import { csvObservationUsage } from '../shared/machine-current-safety.mjs';
import { withCurrentValues } from '../shared/current-values.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS_DIR = resolve(__dirname, '..', 'data', 'exports');
const FAIL_CLOSED_SLUGS = [
  'nevada-prejudgment-rate',
  'new-hampshire-judgment-rate',
  'new-hampshire-prejudgment-rate',
];

const observation = {
  metric: 'annual_rate',
  value: 5.7,
  value_text: '5.7% (last recorded; not current-verified)',
  unit: 'percent_per_annum',
  effective_date: '2026-01-01',
  source_id: 'official-source',
  source_url: 'https://example.gov/rates',
  retrieved_at: '2026-09-27T12:00:00Z',
  confidence: 'low',
  method: 'historical-last-recorded-official-source-gap',
  notes: 'The annual schedule could not be independently corroborated.',
};

test('static API withholds an unverified last-recorded current value without deleting numeric history', () => {
  const source = {
    slug: 'new-hampshire-judgment-rate',
    metadata: {
      current_rate_status: 'unverified_last_recorded',
      current_rate_numeric: null,
      last_recorded_rate: { value: 5.7, effective_date: '2026-01-01' },
    },
    latest: { annual_rate: observation },
    current: { annual_rate: observation },
    latest_published: { annual_rate: observation },
    history: { annual_rate: [observation] },
  };

  const result = withRateVerificationStatus(source);
  const expectedText = 'LAST RECORDED: 5.7% — current official rate unverified';

  assert.deepEqual(result.current, {});
  assert.deepEqual(result.latest, {});
  assert.equal(result.latest_published.annual_rate.value_text, expectedText);
  assert.equal(result.history.annual_rate[0].value, 5.7);
  assert.equal(result.history.annual_rate[0].value_text, expectedText);
  assert.match(result.history.annual_rate[0].notes, /^LAST RECORDED — current official rate unverified\./);
  assert.equal(result.current_rate_status, 'unverified_last_recorded');
  assert.equal(result.machine_current_usable, false);
  assert.equal(result.metadata.current_rate_numeric, null);
  assert.equal(result.metadata.current_official_rate_verified, false);
  assert.equal(result.metadata.current_rate_label, UNVERIFIED_LAST_RECORDED_LABEL);
  assert.equal(source.current.annual_rate.value_text, '5.7% (last recorded; not current-verified)');
});

test('static API leaves ordinary verified records unchanged', () => {
  const source = {
    slug: 'verified-rate',
    metadata: {},
    current: { annual_rate: observation },
    history: { annual_rate: [observation] },
  };
  assert.equal(withRateVerificationStatus(source), source);
});

test('static API withholds a branch-partial rate from current projections', () => {
  const source = {
    slug: 'branch-partial-rate',
    metadata: {
      current_rate_status: BRANCH_PARTIAL_STATUS,
      current_rate_numeric: null,
      basis: 'statute-branching',
      calculation: {
        status: 'reference_only',
        branches_complete: false,
        reason: 'The controlling branch depends on claim type.',
      },
    },
    latest: { annual_rate: observation },
    current: { annual_rate: observation },
    latest_published: { annual_rate: observation },
    current_as_of: '2026-09-27',
    history: { annual_rate: [observation] },
  };
  const result = withRateVerificationStatus(source);

  assert.deepEqual(result.current, {});
  assert.deepEqual(result.latest, {});
  assert.equal(result.current_rate_status, BRANCH_PARTIAL_STATUS);
  assert.equal(result.machine_current_usable, false);
  assert.equal(result.metadata.current_rate_numeric, null);
  assert.equal(result.history.annual_rate[0].value, 5.7);
  assert.deepEqual(csvObservationUsage(result, 'annual_rate', observation), {
    record_usage: 'branch_limited_reference_only',
    current_use_allowed: false,
    current_rate_status: BRANCH_PARTIAL_STATUS,
  });
});

test('static API projection labels every committed fail-closed entity export', () => {
  const meta = JSON.parse(readFileSync(resolve(EXPORTS_DIR, 'meta.json'), 'utf8'));
  const asOfDate = String(meta.generated_at).slice(0, 10);

  for (const slug of FAIL_CLOSED_SLUGS) {
    const exported = JSON.parse(readFileSync(resolve(EXPORTS_DIR, 'entity', `${slug}.json`), 'utf8'));
    assert.equal(exported.metadata?.current_rate_status, 'unverified_last_recorded', `${slug} has fail-closed metadata`);
    const projected = withRateVerificationStatus(withCurrentValues(exported, asOfDate));
    assert.deepEqual(projected.current, {});
    assert.deepEqual(projected.latest, {});
    const historicalObservation = projected.history.annual_rate.find(
      (item) => item.effective_date === exported.metadata.last_recorded_rate.effective_date,
    );
    assert.match(historicalObservation.value_text, /^LAST RECORDED: .+ — current official rate unverified$/);
    assert.match(historicalObservation.notes, /current official rate unverified/i);
    assert.equal(projected.metadata.current_rate_numeric, null);
    assert.equal(projected.metadata.current_official_rate_verified, false);
    assert.equal(
      historicalObservation.value,
      exported.metadata.last_recorded_rate.value,
      `${slug} retains the historical numeric observation`,
    );
  }
});
