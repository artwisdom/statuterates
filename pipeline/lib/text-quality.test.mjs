import { test } from 'node:test';
import assert from 'node:assert/strict';
import { removeTruncatedFragments } from '../../shared/text-quality.mjs';

test('removes incomplete ellipsis fragments without inventing text', () => {
  const input = 'The rate is 8%. A contract exception begins but never… Simple interest. Another broken… Verify the source.';
  assert.equal(removeTruncatedFragments(input), 'The rate is 8%. Simple interest. Verify the source.');
});

test('leaves complete editorial text unchanged', () => {
  const input = 'The rate is 8%. Verify the source.';
  assert.equal(removeTruncatedFragments(input), input);
});
