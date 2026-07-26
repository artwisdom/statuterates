import test from 'node:test';
import assert from 'node:assert/strict';

import { getAllEntities, getMeta, isCalculatorReady, STATE_CALCULATOR_RENDERER_READY } from './data.mjs';

test('loads committed exports from the site package working directory', () => {
  const meta = getMeta();
  const entities = getAllEntities();

  assert.equal(entities.length, meta.entity_count);
  assert.ok(entities.length > 0);
});

test('state calculators remain disabled unless a complete rule is explicitly ready', () => {
  const stateEntities = getAllEntities().filter((entity) => entity.region?.startsWith('US States'));

  assert.equal(STATE_CALCULATOR_RENDERER_READY, false);
  assert.ok(stateEntities.length > 0);
  assert.equal(stateEntities.filter(isCalculatorReady).length, 0);
});
