import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BRANCH_PARTIAL_STATUS,
  calculationHistory,
  getEntity,
  historicalValue,
  latestValue,
  meta,
  UNVERIFIED_LAST_RECORDED_LABEL,
  withRateVerificationStatus,
} from '../src/data.mjs';

test('getEntity rejects path traversal and non-slug input', () => {
  for (const value of ['../meta', '../../exports/meta', '/etc/passwd', 'valid.json', 'UPPER', 'a/b', '']) {
    assert.equal(getEntity(value), null, `rejected ${JSON.stringify(value)}`);
  }
});

test('getEntity still accepts a real exported slug', () => {
  assert.equal(getEntity('us-federal-post-judgment')?.slug, 'us-federal-post-judgment');
});

test('MCP entity and current lookup never promote a future effective date', () => {
  const asOf = String(meta().generated_at).slice(0, 10);
  const entity = getEntity('irs-underpayment');
  assert.equal(entity.current_as_of, asOf);
  assert.deepEqual(entity.latest, entity.current);
  assert.ok(entity.latest_published);
  for (const observation of Object.values(entity.current)) {
    assert.ok(observation.effective_date <= asOf);
  }
  const current = latestValue('irs-underpayment', 'annual_rate');
  assert.ok(current.effective_date <= asOf);
});

test('MCP withholds an unverified last-recorded current value while preserving numeric history', () => {
  const observation = {
    metric: 'annual_rate',
    value: 8.75,
    value_text: '8.75%',
    unit: 'percent_per_annum',
    effective_date: '2026-07-09',
    source_id: 'nv-prejud',
    source_url: 'https://example.gov/nevada-rate',
    retrieved_at: '2026-09-27T12:00:00Z',
    confidence: 'low',
    method: 'historical-last-recorded-official-source-gap',
    notes: 'Source contract remains unresolved.',
  };
  const result = withRateVerificationStatus({
    slug: 'nevada-prejudgment-rate',
    metadata: {
      current_rate_status: 'unverified_last_recorded',
      current_rate_numeric: null,
      last_recorded_rate: { value: 8.75, effective_date: '2026-07-09' },
    },
    latest: { annual_rate: observation },
    current: { annual_rate: observation },
    latest_published: { annual_rate: observation },
    history: { annual_rate: [observation] },
  });

  assert.deepEqual(result.current, {});
  assert.deepEqual(result.latest, {});
  assert.equal(result.latest_published.annual_rate.value_text, 'LAST RECORDED: 8.75% — current official rate unverified');
  assert.equal(result.history.annual_rate[0].value, 8.75);
  assert.equal(result.current_rate_status, 'unverified_last_recorded');
  assert.equal(result.current_rate_label, UNVERIFIED_LAST_RECORDED_LABEL);
  assert.equal(result.current_official_rate_verified, false);
  assert.equal(result.machine_current_usable, false);
  assert.equal(result.metadata.current_rate_numeric, null);
});

test('MCP withholds a branch-partial current value while retaining provenance history', () => {
  const observation = {
    metric: 'annual_rate',
    value: 9,
    value_text: '9% non-tort; tort benchmark unresolved',
    unit: 'percent_per_annum',
    effective_date: '2026-07-09',
    source_id: 'official-source',
    source_url: 'https://example.gov/statute',
    retrieved_at: '2026-09-27T12:00:00Z',
    confidence: 'high',
    method: 'statute-branching-fail-closed',
    notes: 'Reference only.',
  };
  const result = withRateVerificationStatus({
    slug: 'branch-partial-rate',
    metadata: {
      current_rate_status: BRANCH_PARTIAL_STATUS,
      current_rate_numeric: null,
      basis: 'statute-branching-fail-closed',
      calculation: {
        branches_complete: false,
        reason: 'The tort benchmark is unresolved.',
      },
    },
    latest: { annual_rate: observation },
    current: { annual_rate: observation },
    latest_published: { annual_rate: observation },
    history: { annual_rate: [observation] },
  });

  assert.deepEqual(result.current, {});
  assert.deepEqual(result.latest, {});
  assert.equal(result.current_rate_status, BRANCH_PARTIAL_STATUS);
  assert.equal(result.machine_current_usable, false);
  assert.equal(result.metadata.current_rate_numeric, null);
  assert.equal(result.history.annual_rate[0].value, 9);
});

test('MCP calculation history excludes announced future periods and rejects a future start', () => {
  const synthetic = {
    current_as_of: '2026-08-02',
    history: {
      annual_rate: [
        { effective_date: '2026-07-01', value: 8.06 },
        { effective_date: '2026-10-01', value: 7.75 },
      ],
    },
  };
  assert.deepEqual(calculationHistory(synthetic, 'annual_rate', '2026-07-15'), [
    { effective_date: '2026-07-01', value: 8.06 },
  ]);
  assert.throws(
    () => calculationHistory(synthetic, 'annual_rate', '2026-10-15'),
    /cannot be later than the dataset snapshot \(2026-08-02\)/,
  );
  assert.deepEqual(
    calculationHistory(synthetic, 'annual_rate', '2026-09-01', {
      startDateEndExclusive: '2027-01-01',
    }),
    [{ effective_date: '2026-07-01', value: 8.06 }],
  );
  assert.throws(
    () => calculationHistory(synthetic, 'annual_rate', '2027-01-01', {
      startDateEndExclusive: '2027-01-01',
    }),
    /cannot be later than the dataset snapshot \(2026-08-02\)/,
  );
});

test('historical lookup preserves reviewed New Jersey and New York branch transitions', () => {
  const njBefore = historicalValue('new-jersey-judgment-rate', '1996-08-31');
  assert.equal(njBefore.observation.effective_date, '1996-01-01');
  assert.equal(njBefore.observation.value_text, '5.5%');
  assert.equal(
    njBefore.links.historical_lookup,
    'https://statuterates.com/calculators/historical-rate-lookup/?series=new-jersey-judgment-rate',
  );
  const njAfter = historicalValue('new-jersey-judgment-rate', '1996-09-01');
  assert.equal(njAfter.observation.effective_date, '1996-09-01');
  assert.equal(njAfter.observation.value_text, '5.5% / 7.5%');
  assert.match(njAfter.branch_scope, /never chooses a tier/i);

  const nyBefore = historicalValue('new-york-consumer-debt-judgment-rate', '2022-04-29');
  assert.equal(nyBefore.observation.value, 9);
  const nyAfter = historicalValue('new-york-consumer-debt-judgment-rate', '2022-04-30');
  assert.equal(nyAfter.observation.value, 2);
  assert.match(nyAfter.branch_scope, /consumer-debt branch against a natural person/i);
});

test('historical lookup refuses a documented gap, unreviewed series, and dates outside coverage', () => {
  assert.throws(
    () => historicalValue('nebraska-judgment-rate', '2001-03-14'),
    /no verified observation covering this interval/i,
  );
  assert.throws(
    () => historicalValue('california-judgment-rate', '2020-01-01'),
    /historical lookup is not released/i,
  );
  assert.throws(
    () => historicalValue('new-york-consumer-debt-judgment-rate', '1981-06-14'),
    /verified coverage begins 1981-06-15/i,
  );
  assert.throws(
    () => historicalValue('new-york-consumer-debt-judgment-rate', '2099-01-01'),
    /verified coverage ends/i,
  );
});
