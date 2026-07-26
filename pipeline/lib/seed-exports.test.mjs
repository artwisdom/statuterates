import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDb, upsertObservation } from './db.mjs';
import { seedFromExports } from './seed-exports.mjs';

function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value));
}

test('fresh SQLite is hydrated idempotently from durable exports', () => {
  const root = mkdtempSync(join(tmpdir(), 'statuterates-seed-'));
  const entityDir = join(root, 'entity');
  mkdirSync(entityDir);
  writeJson(join(root, 'meta.json'), {
    sources: [{
      id: 'state-source', name: 'State source', publisher: 'State legislature',
      home_url: 'https://example.test/statute', retrieved_at: '2026-07-08T00:00:00Z',
    }],
  });
  writeJson(join(entityDir, 'example-state-rate.json'), {
    slug: 'example-state-rate', name: 'Example State Rate', entity_type: 'rate_series',
    jurisdiction: 'US', region: 'US States', locale: null, metadata: { state: 'EX' },
    history: {
      annual_rate: [
        {
          metric: 'annual_rate', value: 4, value_text: '4%', unit: 'percent_per_annum',
          effective_date: '2025-01-01', source_id: 'state-source',
          source_url: 'https://example.test/statute', retrieved_at: '2026-07-18T00:00:00Z',
          confidence: 'high', method: 'statute-fixed', notes: 'Curated.',
        },
        {
          metric: 'annual_rate', value: 5, value_text: '5%', unit: 'percent_per_annum',
          effective_date: '2026-01-01', source_id: 'state-source',
          source_url: 'https://example.test/statute', retrieved_at: '2026-07-18T00:00:00Z',
          confidence: 'high', method: 'statute-fixed', notes: 'Curated.',
        },
      ],
    },
  });
  writeJson(join(entityDir, 'texas-prejudgment-rate.json'), {
    slug: 'texas-prejudgment-rate', name: 'Texas Prejudgment Interest Rate', entity_type: 'rate_series',
    jurisdiction: 'US', region: 'US States — Prejudgment', locale: null, metadata: { state: 'TX' },
    history: {
      annual_rate: [{
        metric: 'annual_rate', value: 6.75, value_text: '6.75%', unit: 'percent_per_annum',
        effective_date: '2026-07-09', source_id: 'state-source',
        source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
        confidence: 'high', method: 'statute-variable', notes: 'Superseded review-date row.',
      }],
    },
  });
  writeJson(join(entityDir, 'iowa-judgment-rate.json'), {
    slug: 'iowa-judgment-rate', name: 'Iowa Judgment Interest Rate', entity_type: 'rate_series',
    jurisdiction: 'US', region: 'US States', locale: null, metadata: { state: 'IA' },
    history: {
      annual_rate: [{
        metric: 'annual_rate', value: 6.03, value_text: '6.03%', unit: 'percent_per_annum',
        effective_date: '2026-07-06', source_id: 'state-source',
        source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
        confidence: 'medium', method: 'derived_ia_668_13_weekly_cmt_plus_2', notes: 'Superseded weekly row.',
      }],
    },
  });
  for (const slug of ['kentucky-judgment-rate', 'maine-prejudgment-rate', 'georgia-prejudgment-rate', 'mississippi-prejudgment-rate']) {
    writeJson(join(entityDir, `${slug}.json`), {
      slug, name: slug, entity_type: 'rate_series', jurisdiction: 'US',
      region: slug.includes('prejudgment') ? 'US States — Prejudgment' : 'US States',
      locale: null, metadata: { state: slug.startsWith('kentucky') ? 'KY' : 'ME' },
      history: {
        annual_rate: [{
          metric: 'annual_rate', value: 6, value_text: '6%', unit: 'percent_per_annum',
          effective_date: '2026-07-09', source_id: 'state-source',
          source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
          confidence: 'high', method: 'statute-variable', notes: 'Superseded source-review-date row.',
        }],
      },
    });
  }
  writeJson(join(entityDir, 'georgia-judgment-rate.json'), {
    slug: 'georgia-judgment-rate', name: 'Georgia Judgment Interest Rate', entity_type: 'rate_series',
    jurisdiction: 'US', region: 'US States', locale: null, metadata: { state: 'GA' },
    history: {
      annual_rate: [{
        metric: 'annual_rate', value: 9.75, value_text: '9.75%', unit: 'percent_per_annum',
        effective_date: '2026-07-08', source_id: 'state-source',
        source_url: 'https://example.test/statute', retrieved_at: '2026-07-08T00:00:00Z',
        confidence: 'medium', method: 'statute-variable', notes: 'Superseded source-review-date row.',
      }],
    },
  });

  const db = openDb({ path: ':memory:' });
  const first = seedFromExports(db, { exportsDir: root });
  const texasEntityId = db.prepare(`SELECT id FROM entities WHERE slug='texas-prejudgment-rate'`).get().id;
  upsertObservation(db, {
    entity_id: texasEntityId, metric: 'annual_rate', value_numeric: 6.75, value_text: '6.75%',
    unit: 'percent_per_annum', effective_date: '2026-07-09', source_id: 'state-source',
    source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
    confidence: 'high', method: 'statute-variable', notes: 'Legacy local row.',
  });
  const iowaEntityId = db.prepare(`SELECT id FROM entities WHERE slug='iowa-judgment-rate'`).get().id;
  upsertObservation(db, {
    entity_id: iowaEntityId, metric: 'annual_rate', value_numeric: 6.03, value_text: '6.03%',
    unit: 'percent_per_annum', effective_date: '2026-07-06', source_id: 'state-source',
    source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
    confidence: 'medium', method: 'derived_ia_668_13_weekly_cmt_plus_2', notes: 'Legacy local weekly row.',
  });
  for (const slug of ['kentucky-judgment-rate', 'maine-prejudgment-rate', 'georgia-prejudgment-rate', 'mississippi-prejudgment-rate']) {
    const entityId = db.prepare('SELECT id FROM entities WHERE slug=?').get(slug).id;
    upsertObservation(db, {
      entity_id: entityId, metric: 'annual_rate', value_numeric: 6, value_text: '6%',
      unit: 'percent_per_annum', effective_date: '2026-07-09', source_id: 'state-source',
      source_url: 'https://example.test/statute', retrieved_at: '2026-07-09T00:00:00Z',
      confidence: 'high', method: 'statute-variable', notes: 'Legacy local review-date row.',
    });
  }
  const georgiaEntityId = db.prepare(`SELECT id FROM entities WHERE slug='georgia-judgment-rate'`).get().id;
  upsertObservation(db, {
    entity_id: georgiaEntityId, metric: 'annual_rate', value_numeric: 9.75, value_text: '9.75%',
    unit: 'percent_per_annum', effective_date: '2026-07-08', source_id: 'state-source',
    source_url: 'https://example.test/statute', retrieved_at: '2026-07-08T00:00:00Z',
    confidence: 'medium', method: 'statute-variable', notes: 'Legacy local review-date row.',
  });
  const second = seedFromExports(db, { exportsDir: root });
  assert.deepEqual(first, { seeded: true, sources: 1, entities: 8, observations: 2 });
  assert.deepEqual(second, first);
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM observations').get().count, 2);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='texas-prejudgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='iowa-judgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='kentucky-judgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='maine-prejudgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='georgia-judgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='georgia-prejudgment-rate'`).get().count, 0);
  assert.equal(db.prepare(`SELECT COUNT(*) AS count FROM observations o JOIN entities e ON e.id=o.entity_id WHERE e.slug='mississippi-prejudgment-rate'`).get().count, 0);
  const retrievals = db.prepare('SELECT DISTINCT retrieved_at FROM observations').all().map((row) => row.retrieved_at);
  assert.deepEqual(retrievals, ['2026-07-08T00:00:00Z']);
  db.close();
  rmSync(root, { recursive: true, force: true });
});
