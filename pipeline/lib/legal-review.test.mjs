import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dueCalculatorRuleReviews } from './legal-review.mjs';

const ready = (expiry) => ({
  slug: 'florida-judgment-rate',
  name: 'Florida Judgment Interest Rate',
  metadata: { calculation: { status: 'ready', rule_review_expires_at: expiry } },
});

test('legal-review reminder opens inside the lead window and reports overdue rules', () => {
  assert.deepEqual(
    dueCalculatorRuleReviews([ready('2027-01-26')], {
      today: '2026-12-13',
      leadDays: 45,
    }).map(({ days_remaining, reason }) => ({ days_remaining, reason })),
    [{ days_remaining: 44, reason: 'review due soon' }],
  );
  assert.equal(
    dueCalculatorRuleReviews([ready('2027-01-26')], {
      today: '2027-01-27',
    })[0].reason,
    'review overdue',
  );
  assert.deepEqual(
    dueCalculatorRuleReviews([ready('2027-01-26')], {
      today: '2026-12-01',
    }),
    [],
  );
});

