import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDb, upsertSource, upsertEntity, upsertObservation } from './db.mjs';
import { exportAll } from './exporter.mjs';

test('export removes stale entity snapshots', () => {
  const root = mkdtempSync(join(tmpdir(), 'statuterates-export-'));
  const dbPath = join(root, 'db.sqlite');
  const exportDir = join(root, 'exports');
  const entityDir = join(exportDir, 'entity');
  mkdirSync(entityDir, { recursive: true });
  writeFileSync(join(entityDir, 'deleted-rate.json'), '{}');

  const db = openDb({ path: dbPath });
  upsertSource(db, { id: 'src', name: 'Source', publisher: 'Publisher', home_url: 'https://example.test' });
  const entity_id = upsertEntity(db, { slug: 'kept-rate', name: 'Kept', entity_type: 'rate_series' });
  upsertObservation(db, {
    entity_id, metric: 'annual_rate', value_numeric: 5, value_text: '5%', unit: 'percent_per_annum',
    effective_date: '2026-01-01', source_id: 'src', source_url: 'https://example.test/rate',
    retrieved_at: '2026-01-02T00:00:00Z', confidence: 'high', method: 'official-table',
  });
  db.close();

  exportAll({ datasetMeta: { title: 'Test' }, dbPath, exportDir, generatedAt: '2026-07-19T00:00:00Z' });
  assert.equal(existsSync(join(entityDir, 'deleted-rate.json')), false);
  assert.equal(existsSync(join(entityDir, 'kept-rate.json')), true);
  rmSync(root, { recursive: true, force: true });
});

test('aggregate exports omit explicit fail-closed values while preserving published provenance', () => {
  const root = mkdtempSync(join(tmpdir(), 'statuterates-export-guard-'));
  const dbPath = join(root, 'db.sqlite');
  const exportDir = join(root, 'exports');
  const db = openDb({ path: dbPath });
  upsertSource(db, { id: 'src', name: 'Source', publisher: 'Publisher', home_url: 'https://example.test' });
  const entity_id = upsertEntity(db, {
    slug: 'guarded-rate',
    name: 'Guarded',
    entity_type: 'rate_series',
    metadata: {
      current_rate_status: 'branch_partial_reference_only',
      current_rate_numeric: null,
      calculation: { reason: 'The controlling legal branch is unresolved.' },
    },
  });
  upsertObservation(db, {
    entity_id, metric: 'annual_rate', value_numeric: 9, value_text: '9% branch reference', unit: 'percent_per_annum',
    effective_date: '2026-01-01', source_id: 'src', source_url: 'https://example.test/rate',
    retrieved_at: '2026-01-02T00:00:00Z', confidence: 'high', method: 'statute-branching',
  });
  db.close();

  exportAll({ datasetMeta: { title: 'Test' }, dbPath, exportDir, generatedAt: '2026-07-19T00:00:00Z' });
  const entities = JSON.parse(readFileSync(join(exportDir, 'entities.json'), 'utf8'));
  const latest = JSON.parse(readFileSync(join(exportDir, 'latest.json'), 'utf8'));
  const detail = JSON.parse(readFileSync(join(exportDir, 'entity', 'guarded-rate.json'), 'utf8'));
  const summary = entities.entities[0];

  assert.deepEqual(summary.current, {});
  assert.deepEqual(summary.latest, {});
  assert.equal(summary.latest_published.annual_rate.value, 9);
  assert.equal(summary.current_rate_status, 'branch_partial_reference_only');
  assert.equal(summary.machine_current_usable, false);
  assert.equal(latest.count, 0);
  assert.deepEqual(latest.observations, []);
  assert.equal(detail.history.annual_rate[0].value, 9);
  assert.equal(detail.latest.annual_rate.value, 9);
  rmSync(root, { recursive: true, force: true });
});
