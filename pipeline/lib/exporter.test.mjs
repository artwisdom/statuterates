import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
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
