// Tests that the validator FAILS LOUD on bad data (the whole point of it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, upsertSource, upsertEntity, upsertObservation } from './db.mjs';
import { validate } from './validate.mjs';

function seed() {
  const db = openDb({ path: ':memory:' });
  upsertSource(db, { id: 'src', name: 'S', publisher: 'P', home_url: 'https://x', license: 'pd', robots_status: 'allowed', retrieved_at: '2026-07-08T00:00:00Z' });
  return db;
}
const base = {
  metric: 'annual_rate', unit: 'percent_per_annum', source_id: 'src',
  source_url: 'https://x/p', retrieved_at: '2026-07-08T00:00:00Z', confidence: 'high', method: 'x',
};
const today = '2026-07-08';

test('clean data validates OK', () => {
  const db = seed();
  const id = upsertEntity(db, { slug: 'irs-6603-federal-short-term', name: 'ST', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, { ...base, entity_id: id, value_numeric: 4, value_text: '4%', effective_date: '2026-07-01' });
  const r = validate(db, { today });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
});

test('out-of-range rate is a hard error', () => {
  const db = seed();
  const id = upsertEntity(db, { slug: 'weird', name: 'W', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, { ...base, entity_id: id, value_numeric: 99, value_text: '99%', effective_date: '2026-07-01' });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /outside hard range/.test(e)));
});

test('missing source_url is a hard error', () => {
  const db = seed();
  const id = upsertEntity(db, { slug: 'noprov', name: 'N', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, { ...base, entity_id: id, value_numeric: 4, value_text: '4%', effective_date: '2026-07-01', source_url: '' });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /missing source_url/.test(e)));
});

test('post-judgment != CMT for a week is a hard error', () => {
  const db = seed();
  const cmt = upsertEntity(db, { slug: 'treasury-1-year-cmt', name: 'CMT', entity_type: 'rate_series', jurisdiction: 'US' });
  const pj = upsertEntity(db, { slug: 'us-federal-post-judgment', name: 'PJ', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, { ...base, entity_id: cmt, value_numeric: 3.95, value_text: '3.95%', effective_date: '2026-07-06' });
  upsertObservation(db, { ...base, entity_id: pj, confidence: 'medium', value_numeric: 3.5, value_text: '3.5%', effective_date: '2026-07-06' });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /derivation broken/.test(e)));
});

test('IRS §6621 spread mismatch is a hard error', () => {
  const db = seed();
  const st = upsertEntity(db, { slug: 'irs-6603-federal-short-term', name: 'ST', entity_type: 'rate_series', jurisdiction: 'US' });
  const up = upsertEntity(db, { slug: 'irs-underpayment', name: 'UP', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, { ...base, entity_id: st, value_numeric: 4, value_text: '4%', effective_date: '2026-07-01' });
  // underpayment should be 4+3=7; inject 6 to simulate a parse error
  upsertObservation(db, { ...base, entity_id: up, value_numeric: 6, value_text: '6%', effective_date: '2026-07-01' });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /§6621/.test(e)));
});
