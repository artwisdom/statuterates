// Export the SQLite source-of-truth into versioned, deterministic JSON snapshots.
//
// Two consumers read these snapshots:
//   1. the Astro site build (human skin) — one page per entity,
//   2. the static JSON API + MCP server (machine skin).
// Keeping export separate from both means the DB schema can evolve without touching either skin.
//
// Output (all under data/exports/):
//   meta.json          — dataset-level metadata + freshness (generated_at, counts, sources)
//   entities.json      — every entity with its latest value per metric
//   latest.json        — flat list of latest observations (one per entity+metric)
//   entity/<slug>.json — full per-entity record incl. history, for detail pages + API

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb } from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = join(__dirname, '..', '..', 'data', 'exports');

function write(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  // Stable key order + trailing newline => deterministic diffs in git.
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

export function exportAll({ datasetMeta } = {}) {
  const db = openDb({ create: false });

  const entities = db.prepare(`SELECT * FROM entities ORDER BY name`).all();
  const sources = db.prepare(`SELECT * FROM sources ORDER BY id`).all();

  // Latest observation per (entity, metric): max effective_date, tie-broken by highest id.
  const latestStmt = db.prepare(`
    SELECT o.* FROM observations o
    JOIN (
      SELECT entity_id, metric, MAX(effective_date) AS md
      FROM observations GROUP BY entity_id, metric
    ) m ON m.entity_id = o.entity_id AND m.metric = o.metric AND m.md = o.effective_date
    WHERE o.entity_id = ? AND o.metric = ?
    ORDER BY o.id DESC LIMIT 1
  `);
  const metricsFor = db.prepare(
    `SELECT DISTINCT metric FROM observations WHERE entity_id = ? ORDER BY metric`
  );
  const historyStmt = db.prepare(
    `SELECT * FROM observations WHERE entity_id = ? AND metric = ? ORDER BY effective_date DESC, id DESC`
  );

  const generatedAt = new Date().toISOString();
  const entityRecords = [];
  const latestFlat = [];

  for (const e of entities) {
    const metrics = metricsFor.all(e.id).map((r) => r.metric);
    const latestByMetric = {};
    const historyByMetric = {};
    for (const metric of metrics) {
      const latest = latestStmt.get(e.id, metric);
      if (latest) {
        latestByMetric[metric] = shapeObs(latest);
        latestFlat.push({ entity: e.slug, entity_name: e.name, ...shapeObs(latest) });
      }
      historyByMetric[metric] = historyStmt.all(e.id, metric).map(shapeObs);
    }
    const record = {
      slug: e.slug,
      name: e.name,
      entity_type: e.entity_type,
      jurisdiction: e.jurisdiction,
      region: e.region,
      locale: e.locale,
      metadata: e.metadata ? JSON.parse(e.metadata) : null,
      metrics,
      latest: latestByMetric,
      history: historyByMetric,
    };
    entityRecords.push(record);
    // Clear any stale per-entity file layout, then write this entity.
    write(join(EXPORT_DIR, 'entity', `${e.slug}.json`), { generated_at: generatedAt, ...record });
  }

  const meta = {
    ...datasetMeta,
    generated_at: generatedAt,
    entity_count: entities.length,
    observation_count: db.prepare(`SELECT COUNT(*) c FROM observations`).get().c,
    metrics: db.prepare(`SELECT DISTINCT metric FROM observations ORDER BY metric`).all().map((r) => r.metric),
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      publisher: s.publisher,
      home_url: s.home_url,
      license: s.license,
      robots_status: s.robots_status,
      retrieved_at: s.retrieved_at,
    })),
  };

  write(join(EXPORT_DIR, 'meta.json'), meta);
  write(join(EXPORT_DIR, 'entities.json'), {
    generated_at: generatedAt,
    count: entityRecords.length,
    entities: entityRecords.map((r) => ({
      slug: r.slug,
      name: r.name,
      entity_type: r.entity_type,
      jurisdiction: r.jurisdiction,
      region: r.region,
      latest: r.latest,
    })),
  });
  write(join(EXPORT_DIR, 'latest.json'), {
    generated_at: generatedAt,
    count: latestFlat.length,
    observations: latestFlat.sort((a, b) => a.entity_name.localeCompare(b.entity_name)),
  });

  db.close();
  return { entities: entities.length, observations: meta.observation_count, generatedAt };
}

function shapeObs(o) {
  return {
    metric: o.metric,
    value: o.value_numeric,
    value_text: o.value_text,
    unit: o.unit,
    effective_date: o.effective_date,
    source_id: o.source_id,
    source_url: o.source_url,
    retrieved_at: o.retrieved_at,
    confidence: o.confidence,
    method: o.method,
    notes: o.notes,
  };
}
