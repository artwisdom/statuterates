import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getEntity } from '../src/data.mjs';

test('getEntity rejects path traversal and non-slug input', () => {
  for (const value of ['../meta', '../../exports/meta', '/etc/passwd', 'valid.json', 'UPPER', 'a/b', '']) {
    assert.equal(getEntity(value), null, `rejected ${JSON.stringify(value)}`);
  }
});

test('getEntity still accepts a real exported slug', () => {
  assert.equal(getEntity('us-federal-post-judgment')?.slug, 'us-federal-post-judgment');
});
