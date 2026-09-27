import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getAllEntities,
  getMeta,
  currentOf,
  currentValueText,
  isCalculatorReady,
  isMachineCurrentUsable,
  machineCurrentGuard,
  publishedStateCalculators,
  recordedCurrentOf,
  STATE_CALCULATOR_RENDERER_READY,
} from './data.mjs';

const GUARDED_BRANCH_SLUGS = [
  'arizona-judgment-rate',
  'arizona-prejudgment-rate',
  'colorado-judgment-rate',
  'colorado-prejudgment-rate',
  'new-york-consumer-debt-judgment-rate',
  'north-carolina-judgment-rate',
  'north-carolina-prejudgment-rate',
  'pennsylvania-judgment-rate',
  'pennsylvania-prejudgment-rate',
  'rhode-island-judgment-rate',
  'rhode-island-prejudgment-rate',
  'washington-judgment-rate',
  'washington-prejudgment-rate',
  'wyoming-judgment-rate',
  'wyoming-prejudgment-rate',
];

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

test('branch-sensitive state records remain reference-only and unpublished', () => {
  const bySlug = new Map(getAllEntities().map((entity) => [entity.slug, entity]));
  const publishedSlugs = new Set(publishedStateCalculators().map((release) => release.entitySlug));

  for (const slug of GUARDED_BRANCH_SLUGS) {
    const entity = bySlug.get(slug);
    assert.ok(entity, `${slug} export exists`);
    assert.equal(entity.metadata?.calculation?.status, 'reference_only', `${slug} stays reference-only`);
    assert.equal(isCalculatorReady(entity), false, `${slug} is not calculator-ready`);
    assert.equal(publishedSlugs.has(slug), false, `${slug} has no published state calculator`);
  }
});

test('machine-current guard is limited to explicitly fail-closed records', () => {
  const bySlug = new Map(getAllEntities().map((entity) => [entity.slug, entity]));
  for (const slug of [
    'nevada-prejudgment-rate',
    'new-hampshire-judgment-rate',
    'new-hampshire-prejudgment-rate',
    'missouri-judgment-rate',
    'missouri-prejudgment-rate',
  ]) {
    const entity = bySlug.get(slug);
    assert.ok(entity, `${slug} exists`);
    assert.equal(isMachineCurrentUsable(entity), false, `${slug} has no machine-current value`);
    assert.match(machineCurrentGuard(entity).status, /^(?:unverified_last_recorded|branch_partial_reference_only)$/);
    assert.equal(currentOf(entity), null, `${slug} is withheld from safe human current-value helpers`);
    assert.ok(recordedCurrentOf(entity), `${slug} retains an explicit recorded observation`);
    assert.match(currentValueText(entity), /^(?:Current unavailable|Current withheld)/);
  }

  for (const slug of ['arizona-judgment-rate', 'arkansas-judgment-rate', 'delaware-judgment-rate']) {
    assert.equal(
      isMachineCurrentUsable(bySlug.get(slug)),
      true,
      `${slug} stays usable because reference-only calculator status is not a current-value refusal`,
    );
  }
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
