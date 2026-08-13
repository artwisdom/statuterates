// Tests that the validator FAILS LOUD on bad data (the whole point of it).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, upsertSource, upsertEntity, upsertObservation } from './db.mjs';
import { validate } from './validate.mjs';
import { buildIowa, STATE_SOURCES } from '../fetchers/us-states.mjs';
import { IRS_PENALTY_RULES } from '../fetchers/irs-penalty-rules.mjs';

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

test('IRS penalty metadata is required and validated at the database boundary', () => {
  const db = seed();
  const st = upsertEntity(db, {
    slug: 'irs-6603-federal-short-term', name: 'ST', entity_type: 'rate_series', jurisdiction: 'US',
  });
  const corrupted = structuredClone(IRS_PENALTY_RULES);
  corrupted.failure_to_pay.standard_rate = 0.05;
  const up = upsertEntity(db, {
    slug: 'irs-underpayment', name: 'UP', entity_type: 'rate_series', jurisdiction: 'US',
    metadata: { penalty_rules: corrupted, penalty_rules_retrieved_at: 'not-a-date' },
  });
  upsertObservation(db, {
    ...base, entity_id: st, value_numeric: 4, value_text: '4%', effective_date: '2026-07-01',
  });
  upsertObservation(db, {
    ...base, entity_id: up, value_numeric: 7, value_text: '7%', effective_date: '2026-07-01',
  });
  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /penalty rules failure_to_pay\.standard_rate/.test(error)));
  assert.ok(result.errors.some((error) => /penalty-rules retrieval timestamp/.test(error)));
  db.close();
});

test('IRS quarterly histories cannot be truncated to only the current quarter', () => {
  const db = seed();
  const series = [
    ['irs-6603-federal-short-term', 4],
    ['irs-gatt', 4.5],
    ['irs-large-corporate-underpayment', 9],
    ['irs-overpayment-corporate', 6],
    ['irs-overpayment-noncorporate', 7],
    ['irs-underpayment', 7],
  ];
  for (const [slug, value] of series) {
    const id = upsertEntity(db, {
      slug,
      name: slug,
      entity_type: 'rate_series',
      jurisdiction: 'US',
      metadata: slug === 'irs-underpayment'
        ? {
            penalty_rules: IRS_PENALTY_RULES,
            penalty_rules_retrieved_at: '2026-07-26T00:00:00.000Z',
          }
        : null,
    });
    upsertObservation(db, {
      ...base,
      entity_id: id,
      value_numeric: value,
      value_text: `${value}%`,
      effective_date: '2026-07-01',
    });
  }

  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => (
    /irs-underpayment: IRS quarterly history must start 2017-01-01/.test(error)
  )));
  db.close();
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
  assert.ok(r.errors.some((e) => /supported_scope/.test(e)));
  assert.ok(r.errors.some((e) => /renderer_id/.test(e)));
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

test('the exact monthly Iowa court history validates through the official August 2026 selection', () => {
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
  const r = validate(db, { today: '2026-08-13' });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.coverage['iowa-judgment-rate'].count, 303);
  assert.equal(r.coverage['iowa-judgment-rate'].latest, '2026-08-10');
  db.close();
});

test('Iowa validation accepts a later official monthly selection without weakening historical anchors', () => {
  const db = openDb({ path: ':memory:' });
  const bundle = buildIowa({
    courtPoints: [{
      effective_date: '2026-09-09',
      index_value: 4.01,
      value: 6.01,
      value_text: '6.01%',
      source_url: 'https://www.iowacourts.gov/iowa-courts/district-court/post-judgment-interest-table/',
    }],
    courtRetrievedAt: '2026-09-10T00:00:00Z',
  });
  for (const source of STATE_SOURCES.filter((candidate) => candidate.id === 'ia-jud')) {
    upsertSource(db, source);
  }
  const ids = new Map(bundle.entities.map((entity) => [entity.slug, upsertEntity(db, entity)]));
  for (const observation of bundle.observations) {
    const { entitySlug, ...rest } = observation;
    upsertObservation(db, { entity_id: ids.get(entitySlug), ...rest });
  }

  const result = validate(db, { today: '2026-09-10' });
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.coverage['iowa-judgment-rate'].count, 304);
  assert.equal(result.coverage['iowa-judgment-rate'].latest, '2026-09-09');
  assert.equal(result.coverage['iowa-prejudgment-rate'].latest, '2026-09-09');
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

test('federal weekly series require complete one-to-one coverage after the formula transition', () => {
  const db = seed();
  const cmt = upsertEntity(db, {
    slug: 'treasury-1-year-cmt', name: 'CMT', entity_type: 'rate_series', jurisdiction: 'US',
  });
  const pj = upsertEntity(db, {
    slug: 'us-federal-post-judgment', name: 'PJ', entity_type: 'rate_series', jurisdiction: 'US',
  });
  for (const [effective_date, value_numeric] of [
    ['2026-06-29', 3.98],
    ['2026-07-06', 4.03],
  ]) {
    upsertObservation(db, {
      ...base, entity_id: cmt, value_numeric, value_text: `${value_numeric}%`, effective_date,
    });
  }
  upsertObservation(db, {
    ...base, entity_id: pj, confidence: 'medium', value_numeric: 4.03,
    value_text: '4.03%', effective_date: '2026-07-06',
  });

  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => (
    /CMT@2026-06-29: matching federal post-judgment row is missing/.test(error)
  )));
  db.close();
});

test('current-formula federal post-judgment rows cannot predate the 2000 transition week', () => {
  const db = seed();
  const cmt = upsertEntity(db, {
    slug: 'treasury-1-year-cmt', name: 'CMT', entity_type: 'rate_series', jurisdiction: 'US',
  });
  const pj = upsertEntity(db, {
    slug: 'us-federal-post-judgment', name: 'PJ', entity_type: 'rate_series', jurisdiction: 'US',
  });
  upsertObservation(db, {
    ...base, entity_id: cmt, value_numeric: 5.74, value_text: '5.74%', effective_date: '2000-12-04',
  });
  upsertObservation(db, {
    ...base, entity_id: pj, confidence: 'medium', value_numeric: 5.74,
    value_text: '5.74%', effective_date: '2000-12-04',
  });

  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => (
    /current §1961 weekly-CMT formula cannot predate 2000-12-11/.test(error)
  )));
  db.close();
});

test('paired federal rows cannot conceal a missing calendar week', () => {
  const db = seed();
  const cmt = upsertEntity(db, {
    slug: 'treasury-1-year-cmt', name: 'CMT', entity_type: 'rate_series', jurisdiction: 'US',
  });
  const pj = upsertEntity(db, {
    slug: 'us-federal-post-judgment', name: 'PJ', entity_type: 'rate_series', jurisdiction: 'US',
  });
  for (const [effective_date, value_numeric] of [
    ['2026-06-22', 3.99],
    ['2026-07-06', 4.03],
  ]) {
    for (const [entity_id, confidence] of [[cmt, 'high'], [pj, 'medium']]) {
      upsertObservation(db, {
        ...base, entity_id, confidence, value_numeric,
        value_text: `${value_numeric}%`, effective_date,
      });
    }
  }

  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => (
    /treasury-1-year-cmt: weekly history gap between 2026-06-22 and 2026-07-06/.test(error)
  )));
  assert.ok(result.errors.some((error) => (
    /us-federal-post-judgment: weekly history gap between 2026-06-22 and 2026-07-06/.test(error)
  )));
  db.close();
});

test('a recent-only legacy federal subset cannot satisfy the full-history provenance contract', () => {
  const db = seed();
  const cmt = upsertEntity(db, {
    slug: 'treasury-1-year-cmt',
    name: 'CMT',
    entity_type: 'rate_series',
    jurisdiction: 'US',
    metadata: { series_id: 'RIFLGFCY01' },
  });
  const pj = upsertEntity(db, {
    slug: 'us-federal-post-judgment',
    name: 'PJ',
    entity_type: 'rate_series',
    jurisdiction: 'US',
    metadata: { statute: '28 U.S.C. §1961' },
  });
  for (const [entity_id, confidence] of [[cmt, 'high'], [pj, 'medium']]) {
    upsertObservation(db, {
      ...base,
      entity_id,
      confidence,
      value_numeric: 4.03,
      value_text: '4.03%',
      effective_date: '2026-07-06',
      method: entity_id === cmt ? 'weekly-avg-of-daily-h15' : 'derived_28usc1961_weekly_avg_h15_1yr_cmt',
    });
  }
  const result = validate(db, { today });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((error) => /full history must start 2000-01-03/.test(error)));
  assert.ok(result.errors.some((error) => /modern history must start 2000-12-11/.test(error)));
  assert.ok(result.errors.some((error) => /history is truncated/.test(error)));
  assert.ok(result.errors.some((error) => /published WGS1YR provenance/.test(error)));
  assert.ok(result.errors.some((error) => /metadata contract is missing/.test(error)));
  db.close();
});
