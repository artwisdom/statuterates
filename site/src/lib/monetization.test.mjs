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
    prejudgmentRules: {
      applies: 'This claim-specific rule applies only in the stated circumstances.',
      accrual: 'Interest starts on the date selected by the controlling rule.',
      compound: 'Simple interest.',
    },
  }), true);
});

test('prejudgment pages fail closed when a required legal-rule field is missing or truncated', () => {
  const complete = {
    applies: 'This claim-specific rule applies only in the stated circumstances.',
    accrual: 'Interest starts on the date selected by the controlling rule.',
    compound: 'Simple interest.',
  };
  for (const field of Object.keys(complete)) {
    assert.equal(ratePageMayRunAds({
      isStateRate: true,
      isPrejudgment: true,
      hasDetailedRules: false,
      observationCount: 5,
      prejudgmentRules: { ...complete, [field]: '' },
    }), false, field);
  }
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: true,
    hasDetailedRules: false,
    observationCount: 5,
    prejudgmentRules: { ...complete, accrual: 'The imported sentence was cut off…' },
  }), false);
});

test('original federal, tax, and international datasets remain eligible', () => {
  assert.equal(ratePageMayRunAds({
    isStateRate: false,
    isPrejudgment: false,
    hasDetailedRules: false,
    observationCount: 1,
  }), true);
});

test('an explicit editorial hold overrides automatic state-page eligibility', () => {
  assert.equal(ratePageMayRunAds({
    isStateRate: true,
    isPrejudgment: false,
    hasDetailedRules: true,
    observationCount: 5,
    explicitlyWithheld: true,
  }), false);
});
