import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculationHistory, getEntity, historicalValue, latestValue, meta } from '../src/data.mjs';

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
