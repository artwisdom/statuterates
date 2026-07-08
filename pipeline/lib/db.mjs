// SQLite schema + access layer. SQLite is the SINGLE SOURCE OF TRUTH (brief Phase 3.1).
//
// The schema is deliberately generic: "observations of a metric's value for an entity, over time,
// each row carrying full provenance". This shape fits every candidate niche in this class
// (policy rates, minimum wages, administered prices, statutory fees), so the engine is reusable.
//
// Tables:
//   sources       — every data source, with license + robots + retrieval provenance
//   entities      — the things values attach to (a country's central bank, a US state, etc.)
//   observations  — a (entity, metric, effective_date) value with unit + source_url + retrieved_at
//                   + confidence. History is preserved: new effective_dates are new rows.

import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = join(__dirname, '..', '..', 'data', 'db.sqlite');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS sources (
  id            TEXT PRIMARY KEY,          -- stable slug, e.g. 'fed-h15'
  name          TEXT NOT NULL,
  publisher     TEXT NOT NULL,             -- official body, e.g. 'U.S. Federal Reserve'
  home_url      TEXT NOT NULL,
  license       TEXT,                      -- license/terms status as recorded in RESEARCH_LOG
  robots_status TEXT,                      -- 'allowed' | 'disallowed' | 'absent' | note
  retrieved_at  TEXT                       -- last successful fetch (ISO 8601)
);

CREATE TABLE IF NOT EXISTS entities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL UNIQUE,      -- URL-safe, e.g. 'united-states'
  name          TEXT NOT NULL,             -- display name, e.g. 'United States'
  entity_type   TEXT NOT NULL,             -- e.g. 'country'
  jurisdiction  TEXT,                      -- ISO-3166 alpha-2 where applicable, e.g. 'US'
  region        TEXT,                      -- continent / grouping for browse pages
  locale        TEXT,                      -- primary locale hint
  metadata      TEXT                       -- JSON blob for entity-specific extras
);

CREATE TABLE IF NOT EXISTS observations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_id     INTEGER NOT NULL REFERENCES entities(id),
  metric        TEXT NOT NULL,             -- e.g. 'policy_rate'
  value_numeric REAL,                      -- machine-usable numeric value
  value_text    TEXT,                      -- human display / ranges (e.g. '4.25-4.50')
  unit          TEXT NOT NULL,             -- e.g. 'percent_per_annum'
  effective_date TEXT NOT NULL,            -- ISO date the value took effect
  source_id     TEXT NOT NULL REFERENCES sources(id),
  source_url    TEXT NOT NULL,             -- exact page the value came from
  retrieved_at  TEXT NOT NULL,             -- when we fetched it (ISO 8601)
  confidence    TEXT NOT NULL DEFAULT 'medium', -- 'high' | 'medium' | 'low'
  method        TEXT,                      -- how extracted (e.g. 'html-table', 'csv', 'regex')
  notes         TEXT,
  UNIQUE(entity_id, metric, effective_date, source_id)
);

CREATE INDEX IF NOT EXISTS idx_obs_entity_metric ON observations(entity_id, metric, effective_date);
CREATE INDEX IF NOT EXISTS idx_obs_metric ON observations(metric);

-- Provenance/audit of each pipeline run, for the freshness stamp + maintenance.
CREATE TABLE IF NOT EXISTS run_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at    TEXT NOT NULL,
  finished_at   TEXT,
  status        TEXT,                      -- 'ok' | 'failed'
  records_upserted INTEGER DEFAULT 0,
  notes         TEXT
);
`;

export function openDb({ create = true, path = DB_PATH } = {}) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  if (create) db.exec(SCHEMA);
  return db;
}

export function upsertSource(db, s) {
  db.prepare(
    `INSERT INTO sources (id, name, publisher, home_url, license, robots_status, retrieved_at)
     VALUES (@id, @name, @publisher, @home_url, @license, @robots_status, @retrieved_at)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, publisher=excluded.publisher, home_url=excluded.home_url,
       license=excluded.license, robots_status=excluded.robots_status,
       retrieved_at=excluded.retrieved_at`
  ).run({
    license: null,
    robots_status: null,
    retrieved_at: null,
    ...s,
  });
}

export function upsertEntity(db, e) {
  const row = {
    jurisdiction: null,
    region: null,
    locale: null,
    metadata: null,
    ...e,
    metadata: e.metadata ? JSON.stringify(e.metadata) : null,
  };
  db.prepare(
    `INSERT INTO entities (slug, name, entity_type, jurisdiction, region, locale, metadata)
     VALUES (@slug, @name, @entity_type, @jurisdiction, @region, @locale, @metadata)
     ON CONFLICT(slug) DO UPDATE SET
       name=excluded.name, entity_type=excluded.entity_type, jurisdiction=excluded.jurisdiction,
       region=excluded.region, locale=excluded.locale, metadata=excluded.metadata`
  ).run(row);
  return db.prepare(`SELECT id FROM entities WHERE slug = ?`).get(e.slug).id;
}

export function upsertObservation(db, o) {
  const info = db
    .prepare(
      `INSERT INTO observations
         (entity_id, metric, value_numeric, value_text, unit, effective_date,
          source_id, source_url, retrieved_at, confidence, method, notes)
       VALUES (@entity_id, @metric, @value_numeric, @value_text, @unit, @effective_date,
          @source_id, @source_url, @retrieved_at, @confidence, @method, @notes)
       ON CONFLICT(entity_id, metric, effective_date, source_id) DO UPDATE SET
         value_numeric=excluded.value_numeric, value_text=excluded.value_text, unit=excluded.unit,
         source_url=excluded.source_url, retrieved_at=excluded.retrieved_at,
         confidence=excluded.confidence, method=excluded.method, notes=excluded.notes`
    )
    .run({
      value_numeric: null,
      value_text: null,
      confidence: 'medium',
      method: null,
      notes: null,
      ...o,
    });
  return info;
}

export function startRun(db) {
  const info = db
    .prepare(`INSERT INTO run_log (started_at, status) VALUES (?, 'running')`)
    .run(new Date().toISOString());
  return info.lastInsertRowid;
}

export function finishRun(db, runId, { status, records, notes }) {
  db.prepare(
    `UPDATE run_log SET finished_at=?, status=?, records_upserted=?, notes=? WHERE id=?`
  ).run(new Date().toISOString(), status, records || 0, notes || null, runId);
}
