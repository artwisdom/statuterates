import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  buildTennesseeOfficialHistory,
  TENNESSEE_AOC_HISTORY_URL,
  TENNESSEE_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  TENNESSEE_OFFICIAL_HISTORY_START,
  validateTennesseeOfficialHistory,
} from './tennessee-judgment-history.mjs';
import { buildStateFixed } from './us-states.mjs';

const historyChecksum = (rows) => createHash('sha256')
  .update(JSON.stringify(rows.map(({ effective_date, value, value_text }) => ({
    effective_date,
    value,
    value_text,
  }))))
  .digest('hex');

test('Tennessee AOC history preserves all 29 official half-year selections', () => {
  const history = buildTennesseeOfficialHistory();

  assert.deepEqual(validateTennesseeOfficialHistory(history), []);
  assert.equal(history.length, 29);
  assert.equal(history[0].effective_date, TENNESSEE_OFFICIAL_HISTORY_START);
  assert.equal(history.at(-1).effective_date, '2026-07-01');
  assert.equal(TENNESSEE_OFFICIAL_HISTORY_COMPLETE_THROUGH, '2026-12-31');
  assert.ok(history.every((point) => point.source_url === TENNESSEE_AOC_HISTORY_URL));
  assert.equal(
    historyChecksum(history),
    '7b99fa36c39498ffcc6cd7860cc5e3c5195aa4c98603a70621aa20dad7b06fc2',
  );
});

test('Tennessee history is integrated without changing the current rate or enabling a calculator', () => {
  const { entities, observations } = buildStateFixed();
  const entity = entities.find((candidate) => candidate.slug === 'tennessee-judgment-rate');
  const history = observations.filter((row) => row.entitySlug === 'tennessee-judgment-rate');

  assert.equal(history.length, 29);
  assert.deepEqual(
    history.map(({ effective_date, value_text }) => ({ effective_date, value_text })),
    buildTennesseeOfficialHistory().map(({ effective_date, value_text }) => ({ effective_date, value_text })),
  );
  assert.equal(history.at(-1).value_numeric, 8.75);
  assert.equal(history.at(-1).value_text, '8.75%');
  assert.equal(entity.metadata.calculation.status, 'reference_only');
  assert.equal(entity.metadata.calculation.renderer_supported, false);
  assert.equal(entity.metadata.calculation.rate_behavior, 'fixed_at_entry');
});

test('Tennessee history integrity gate rejects a changed AOC row', () => {
  const changed = buildTennesseeOfficialHistory();
  changed[10] = { ...changed[10], value: 6, value_text: '6.00%' };

  assert.match(validateTennesseeOfficialHistory(changed).join('; '), /official AOC row mismatch/);
});
