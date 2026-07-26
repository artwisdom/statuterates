// Tests that the validator FAILS LOUD on bad data (the whole point of it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, upsertSource, upsertEntity, upsertObservation } from './db.mjs';
import { validate } from './validate.mjs';
import { buildIowa, STATE_SOURCES } from '../fetchers/us-states.mjs';

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

test('nonnumeric observations are rejected except for the explicitly modeled Mississippi case-specific rule', () => {
  const bad = seed();
  const badId = upsertEntity(bad, { slug: 'unknown-rate', name: 'Unknown', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(bad, {
    ...base, entity_id: badId, value_numeric: null, value_text: 'court-set',
    effective_date: '1989-07-01', method: 'court-or-contract-rate',
  });
  assert.equal(validate(bad, { today }).ok, false);
  bad.close();

  const good = seed();
  upsertSource(good, {
    id: 'ms-prejud', name: 'Mississippi Code', publisher: 'Authorized code portal',
    home_url: 'https://www.lexisnexis.com/hottopics/mscode/', license: 'Government edict',
    robots_status: 'secondary source checked', retrieved_at: '2026-07-19T00:00:00Z',
  });
  const goodId = upsertEntity(good, {
    slug: 'mississippi-prejudgment-rate', name: 'Mississippi Prejudgment Interest Rate',
    entity_type: 'rate_series', jurisdiction: 'US', region: 'US States — Prejudgment',
    metadata: { state: 'MS', calculation: { status: 'reference_only', source_tier: 'official_secondary', reason: 'The contract or court selects the rate.' } },
  });
  upsertObservation(good, {
    ...base, entity_id: goodId, value_numeric: null, value_text: 'contract rate / court-set',
    effective_date: '1989-07-01', source_id: 'ms-prejud', source_url: 'https://www.lexisnexis.com/hottopics/mscode/',
    retrieved_at: '2026-07-19T00:00:00Z', method: 'court-or-contract-rate',
  });
  const result = validate(good, { today: '2026-07-19' });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  good.close();
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

test('an incomplete state rule cannot be marked calculator-ready', () => {
  const db = seed();
  const id = upsertEntity(db, {
    slug: 'example-state-rate', name: 'Example', entity_type: 'rate_series', jurisdiction: 'US',
    region: 'US States', metadata: { state: 'EX', calculation: { status: 'ready' } },
  });
  upsertObservation(db, { ...base, entity_id: id, value_numeric: 5, value_text: '5%', effective_date: '2026-07-01', method: 'statute-fixed' });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((e) => /official primary source/.test(e)));
  assert.ok(r.errors.some((e) => /branches_complete/.test(e)));
});

test('a reference-only state rule is valid but not calculator-ready', () => {
  const db = seed();
  const id = upsertEntity(db, {
    slug: 'example-state-rate', name: 'Example', entity_type: 'rate_series', jurisdiction: 'US',
    region: 'US States', metadata: { state: 'EX', calculation: { status: 'reference_only', source_tier: 'unclassified', reason: 'History is incomplete.' } },
  });
  upsertObservation(db, { ...base, entity_id: id, value_numeric: 5, value_text: '5%', effective_date: '2026-07-01', method: 'statute-fixed' });
  const r = validate(db, { today });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.totals.calculatorReadyStateRules, 0);
});

test('the exact monthly Iowa court history validates through the official July 2026 selection', () => {
  const db = openDb({ path: ':memory:' });
  const bundle = buildIowa();
  for (const source of STATE_SOURCES.filter((candidate) => candidate.id === 'ia-jud')) {
    upsertSource(db, source);
  }
  const ids = new Map(bundle.entities.map((entity) => [entity.slug, upsertEntity(db, entity)]));
  for (const observation of bundle.observations) {
    const { entitySlug, ...rest } = observation;
    upsertObservation(db, { entity_id: ids.get(entitySlug), ...rest });
  }
  const r = validate(db, { today: '2026-07-19' });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.coverage['iowa-judgment-rate'].count, 302);
  assert.equal(r.coverage['iowa-judgment-rate'].latest, '2026-07-09');
  db.close();
});

test('legacy weekly Iowa rows fail validation', () => {
  const db = seed();
  const id = upsertEntity(db, { slug: 'iowa-judgment-rate', name: 'Iowa', entity_type: 'rate_series', jurisdiction: 'US' });
  upsertObservation(db, {
    ...base, entity_id: id, value_numeric: 6.03, value_text: '6.03%', effective_date: '2026-07-06',
    confidence: 'medium', method: 'derived_ia_668_13_weekly_cmt_plus_2',
  });
  const r = validate(db, { today });
  assert.equal(r.ok, false);
  assert.ok(r.errors.some((error) => /legacy weekly Iowa derivation is forbidden/.test(error)));
  db.close();
});
