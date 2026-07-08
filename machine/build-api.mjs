#!/usr/bin/env node
// Build the STATIC JSON API from the exported snapshots.
//
// The "API" is just prebuilt JSON files served by a CDN — no server, no runtime cost, infinite
// scale (brief Phase 5.1). This script reshapes data/exports/ into versioned endpoints under
// site/public/api/v1/, so `astro build` publishes them alongside the HTML.
//
// Endpoint scheme (documented in machine/openapi.yaml):
//   GET /api/v1/                      -> service index (meta + links)
//   GET /api/v1/meta.json             -> dataset metadata + freshness + sources
//   GET /api/v1/entities.json         -> collection index (all entities + latest values)
//   GET /api/v1/metrics.json          -> list of metrics
//   GET /api/v1/entity/{slug}.json    -> one entity: latest + full history + provenance

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS = resolve(__dirname, '..', 'data', 'exports');
const API_DIR = resolve(__dirname, '..', 'site', 'public', 'api', 'v1');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}
function write(rel, obj) {
  const p = join(API_DIR, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function csvEscape(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Spreadsheet-ready history for one entity: one row per observation, provenance included.
function writeCsv(path, rec) {
  const header = ['series', 'metric', 'effective_date', 'value_percent', 'unit', 'confidence', 'method', 'source_url', 'retrieved_at'];
  const rows = [header.join(',')];
  for (const [metric, arr] of Object.entries(rec.history || {})) {
    for (const o of arr) {
      rows.push([rec.slug, metric, o.effective_date, o.value, o.unit, o.confidence, o.method, o.source_url, o.retrieved_at].map(csvEscape).join(','));
    }
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, rows.join('\n') + '\n');
}

function main() {
  if (!existsSync(join(EXPORTS, 'meta.json'))) {
    console.error('No exports found. Run the pipeline export step first (npm run export in pipeline/).');
    process.exit(1);
  }
  // Clean previous API output for a deterministic build.
  if (existsSync(API_DIR)) rmSync(API_DIR, { recursive: true, force: true });
  mkdirSync(API_DIR, { recursive: true });

  const meta = readJson(join(EXPORTS, 'meta.json'));
  const entities = readJson(join(EXPORTS, 'entities.json'));

  const apiVersion = 'v1';
  const envelope = (data) => ({
    api_version: apiVersion,
    generated_at: meta.generated_at,
    attribution: meta.attribution || null,
    license: meta.license || null,
    data,
  });

  // Service index
  write('index.json', {
    api_version: apiVersion,
    dataset: meta.title || 'Data Moat Engine',
    description: meta.description || null,
    generated_at: meta.generated_at,
    endpoints: {
      meta: 'api/v1/meta.json',
      entities: 'api/v1/entities.json',
      latest: 'api/v1/latest.json',
      metrics: 'api/v1/metrics.json',
      entity: 'api/v1/entity/{slug}.json',
      entity_csv: 'api/v1/entity/{slug}.csv',
    },
    counts: { entities: meta.entity_count, observations: meta.observation_count },
  });

  write('meta.json', envelope(meta));
  write('metrics.json', envelope({ metrics: meta.metrics || [] }));
  write('entities.json', envelope({ count: entities.count, entities: entities.entities }));

  // Flat "every current value in one call" endpoint — the cheapest possible agent integration.
  const latest = readJson(join(EXPORTS, 'latest.json'));
  write('latest.json', envelope({ count: latest.count, observations: latest.observations }));

  // Per-entity endpoints (copied from exports/entity/*.json) + CSV history downloads.
  const entityDir = join(EXPORTS, 'entity');
  let n = 0;
  if (existsSync(entityDir)) {
    for (const f of readdirSync(entityDir)) {
      if (!f.endsWith('.json')) continue;
      const rec = readJson(join(entityDir, f));
      write(join('entity', f), envelope(rec));
      writeCsv(join(API_DIR, 'entity', f.replace(/\.json$/, '.csv')), rec);
      n++;
    }
  }

  console.log(`Static API built: ${n} entity endpoints (JSON+CSV) + index/meta/metrics/entities/latest under ${API_DIR}`);
  return n;
}

main();
