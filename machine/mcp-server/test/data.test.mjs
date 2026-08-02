import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculationHistory, getEntity, latestValue, meta } from '../src/data.mjs';

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
});
