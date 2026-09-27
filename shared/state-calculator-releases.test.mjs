import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATE_CALCULATOR_RELEASES,
  stateCalculatorReleaseForEntity,
} from './state-calculator-releases.mjs';

const florida = {
  slug: 'florida-judgment-rate',
  metadata: {
    calculation: {
      status: 'ready',
      renderer_supported: true,
      renderer_id: 'florida-postjudgment-v1',
    },
  },
};

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

test('shared state calculator gate releases only a matching reviewed contract', () => {
  assert.equal(stateCalculatorReleaseForEntity(florida), STATE_CALCULATOR_RELEASES.florida);
  assert.equal(stateCalculatorReleaseForEntity({ ...florida, slug: 'california-judgment-rate' }), null);
  assert.equal(stateCalculatorReleaseForEntity({
    ...florida,
    metadata: { calculation: { ...florida.metadata.calculation, renderer_supported: false } },
  }), null);
  assert.equal(stateCalculatorReleaseForEntity({
    ...florida,
    metadata: { calculation: { ...florida.metadata.calculation, renderer_id: 'generic-simple' } },
  }), null);
});

test('branch-sensitive slugs cannot borrow an approved renderer contract', () => {
  assert.deepEqual(Object.keys(STATE_CALCULATOR_RELEASES), ['florida']);

  for (const slug of GUARDED_BRANCH_SLUGS) {
    assert.equal(
      stateCalculatorReleaseForEntity({ ...florida, slug }),
      null,
      `${slug} remains blocked even with an otherwise valid renderer contract`,
    );
  }
});
