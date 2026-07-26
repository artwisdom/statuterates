import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deleteObservationsForEntitySlugs,
  openDb,
  upsertSource,
  upsertEntity,
  upsertObservation,
} from './db.mjs';

function fixture() {
  const db = openDb({ path: ':memory:' });
  upsertSource(db, {
    id: 'src', name: 'Source', publisher: 'Publisher', home_url: 'https://example.test',
    retrieved_at: '2026-07-08T00:00:00Z',
  });
  const entity_id = upsertEntity(db, {
    slug: 'example-rate', name: 'Example rate', entity_type: 'rate_series', jurisdiction: 'US',
  });
  return { db, entity_id };
}

function observation(entity_id, overrides = {}) {
  return {
    entity_id,
    metric: 'annual_rate',
    value_numeric: 5,
    value_text: '5%',
    unit: 'percent_per_annum',
    effective_date: '2026-01-01',
    source_id: 'src',
    source_url: 'https://example.test/rate',
    retrieved_at: '2026-07-08T00:00:00Z',
    confidence: 'high',
    method: 'official-table',
    notes: 'Published value.',
    ...overrides,
  };
}

test('unchanged observation keeps its original retrieval time', () => {
  const { db, entity_id } = fixture();
  upsertObservation(db, observation(entity_id));
  upsertObservation(db, observation(entity_id, { retrieved_at: '2026-07-19T00:00:00Z' }));
  const row = db.prepare('SELECT retrieved_at FROM observations').get();
  assert.equal(row.retrieved_at, '2026-07-08T00:00:00Z');
  db.close();
});

test('changed observation records the new retrieval time', () => {
  const { db, entity_id } = fixture();
  upsertObservation(db, observation(entity_id));
  upsertObservation(db, observation(entity_id, { value_numeric: 5.25, value_text: '5.25%', retrieved_at: '2026-07-19T00:00:00Z' }));
  const row = db.prepare('SELECT value_numeric, retrieved_at FROM observations').get();
  assert.equal(row.value_numeric, 5.25);
  assert.equal(row.retrieved_at, '2026-07-19T00:00:00Z');
  db.close();
});

test('source upsert cannot move its last-check time backwards', () => {
  const { db } = fixture();
  upsertSource(db, {
    id: 'src', name: 'Source', publisher: 'Publisher', home_url: 'https://example.test',
    retrieved_at: '2026-07-01T00:00:00Z',
  });
  assert.equal(db.prepare('SELECT retrieved_at FROM sources WHERE id = ?').get('src').retrieved_at, '2026-07-08T00:00:00Z');
  db.close();
});

test('complete-snapshot replacement removes rows absent from the new source result', () => {
  const { db, entity_id } = fixture();
  upsertObservation(db, observation(entity_id));
  upsertObservation(db, observation(entity_id, { effective_date: '2026-04-01' }));
  assert.equal(deleteObservationsForEntitySlugs(db, ['example-rate', 'example-rate']), 2);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM observations').get().n, 0);
  db.close();
});
