import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildKentuckyPostJudgmentHistory,
  KENTUCKY_2017_ACT_URL,
  validateKentuckyPostJudgmentHistory,
} from './kentucky-interest-history.mjs';

test('Kentucky history preserves the official 12% to 6% statutory change', () => {
  const history = buildKentuckyPostJudgmentHistory();
  assert.deepEqual(validateKentuckyPostJudgmentHistory(history), []);
  assert.deepEqual(history, [
    {
      effective_date: '1982-07-15',
      value: 12,
      value_text: '12%',
      source_url: KENTUCKY_2017_ACT_URL,
    },
    {
      effective_date: '2017-06-29',
      value: 6,
      value_text: '6%',
      source_url: KENTUCKY_2017_ACT_URL,
    },
  ]);
});

test('Kentucky history validation rejects the inherited source-review-date placeholder', () => {
  const history = buildKentuckyPostJudgmentHistory();
  history.push({ effective_date: '2026-07-09', value: 6 });
  assert.match(validateKentuckyPostJudgmentHistory(history).join('\n'), /unexpected official-history date 2026-07-09/);
});
