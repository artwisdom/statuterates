import test from 'node:test';
import assert from 'node:assert/strict';
import { ratePageMayRunAds } from './monetization.mjs';

test('single-observation state post-judgment references do not run ads without detailed rules', () => {
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: false,
    hasDetailedRules: false,
    observationCount: 1,
  }), false);
});
test('state pages earn ad eligibility through distinct legal analysis or real history', () => {
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: false,
    hasDetailedRules: true,
    observationCount: 1,
  }), true);
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: false,
    hasDetailedRules: false,
    observationCount: 2,
  }), true);
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: true,
    hasDetailedRules: false,
    observationCount: 1,
  }), true);
});

test('original federal, tax, and international datasets remain eligible', () => {
  assert.equal(ratePageMayRunAds({
    isStateRate: false,
    isPrejudgment: false,
    hasDetailedRules: false,
    observationCount: 1,
  }), true);
});
