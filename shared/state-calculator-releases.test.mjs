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
