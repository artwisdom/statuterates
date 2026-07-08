// Read-only accessor over the exported JSON snapshots (data/exports/).
// The MCP server and the smoke test both use this. No DB dependency: the machine skin
// runs purely off the versioned JSON, exactly like the static API a CDN would serve.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve the exports dir: env override, else the repo's data/exports.
export const EXPORTS_DIR =
  process.env.DATA_MOAT_EXPORTS || resolve(__dirname, '..', '..', '..', 'data', 'exports');

function readJson(rel) {
  const p = join(EXPORTS_DIR, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

let _meta = null;
let _entities = null;

export function meta() {
  if (!_meta) _meta = readJson('meta.json') || { title: 'Dataset', metrics: [] };
  return _meta;
}

export function entitiesIndex() {
  if (!_entities) _entities = (readJson('entities.json') || { entities: [] }).entities;
  return _entities;
}

export function getEntity(slug) {
  const rec = readJson(join('entity', `${slug}.json`));
  return rec;
}

export function searchEntities(query, limit = 25) {
  const q = String(query || '').trim().toLowerCase();
  const all = entitiesIndex();
  if (!q) return all.slice(0, limit);
  const scored = [];
  for (const e of all) {
    const name = (e.name || '').toLowerCase();
    const slug = (e.slug || '').toLowerCase();
    const juris = (e.jurisdiction || '').toLowerCase();
    let score = 0;
    if (name === q || slug === q || juris === q) score = 100;
    else if (name.startsWith(q) || slug.startsWith(q)) score = 80;
    else if (name.includes(q) || slug.includes(q)) score = 60;
    else if (juris.includes(q) || (e.region || '').toLowerCase().includes(q)) score = 40;
    if (score > 0) scored.push({ e, score });
  }
  scored.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
  return scored.slice(0, limit).map((s) => s.e);
}

export function latestValue(slug, metric) {
  const rec = getEntity(slug);
  if (!rec) return null;
  const metrics = rec.latest || {};
  if (metric) return metrics[metric] ? { slug, name: rec.name, ...metrics[metric] } : null;
  // all metrics
  return Object.entries(metrics).map(([m, v]) => ({ slug, name: rec.name, ...v }));
}

export function defaultMetric() {
  const m = meta();
  return (m.metrics && m.metrics[0]) || null;
}
