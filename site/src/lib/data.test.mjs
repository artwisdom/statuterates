import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllEntities,
  getMeta,
  currentOf,
  isCalculatorReady,
  publishedStateCalculators,
  STATE_CALCULATOR_RENDERER_READY,
} from './data.mjs';

test('loads committed exports from the site package working directory', () => {
  const meta = getMeta();
  const entities = getAllEntities();

  assert.equal(entities.length, meta.entity_count);
  assert.ok(entities.length > 0);
});

test('only the explicitly released state calculator can become ready', () => {
  const stateEntities = getAllEntities().filter((entity) => entity.region?.startsWith('US States'));
  const published = publishedStateCalculators();

  assert.equal(STATE_CALCULATOR_RENDERER_READY, false);
  assert.ok(stateEntities.length > 0);
  assert.deepEqual(stateEntities.filter(isCalculatorReady).map((entity) => entity.slug), ['florida-judgment-rate']);
  assert.deepEqual(published.map((release) => release.entitySlug), ['florida-judgment-rate']);
  assert.ok(published.every((release) => release.summary.length >= 80));
});

test('currentOf does not label a preannounced future period as current', () => {
  const entity = {
    generated_at: '2026-09-15T00:00:00Z',
    latest: { annual_rate: { effective_date: '2026-10-01', value_text: '7.95%' } },
    history: {
      annual_rate: [
        { effective_date: '2026-10-01', value_text: '7.95%' },
        { effective_date: '2026-07-01', value_text: '8.06%' },
      ],
    },
  };
  assert.equal(currentOf(entity).value_text, '8.06%');
  assert.equal(currentOf(entity, '2026-10-01').value_text, '7.95%');
});
