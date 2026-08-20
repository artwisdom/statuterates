// Read-only accessor over the exported JSON snapshots (data/exports/).
// The MCP server and the smoke test both use this. No DB dependency: the machine skin
// runs purely off the versioned JSON, exactly like the static API a CDN would serve.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withCurrentValues } from '../../../shared/current-values.mjs';

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
  // Slugs are data identifiers, never paths. Reject traversal, separators, extensions, and other
  // unexpected input before it reaches the filesystem.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(slug || ''))) return null;
  const rec = readJson(join('entity', `${slug}.json`));
  return rec ? withCurrentValues(rec, String(meta().generated_at || '').slice(0, 10)) : null;
}

function searchResult(entity) {
  const record = getEntity(entity.slug);
  if (!record) return entity;
  return {
    ...entity,
    latest: record.current,
    current: record.current,
    latest_published: record.latest_published,
    current_as_of: record.current_as_of,
  };
}

export function searchEntities(query, limit = 25) {
  const q = String(query || '').trim().toLowerCase();
  const all = entitiesIndex();
  if (!q) return all.slice(0, limit).map(searchResult);
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
  return scored.slice(0, limit).map((s) => searchResult(s.e));
}

export function latestValue(slug, metric) {
  const rec = getEntity(slug);
  if (!rec) return null;
  const metrics = rec.current || {};
  if (metric) return metrics[metric] ? { slug, name: rec.name, ...metrics[metric] } : null;
  // all metrics
  return Object.entries(metrics).map(([m, v]) => ({ slug, name: rec.name, ...v }));
}

// Calculators may project an already-governing rate through a legally covered future payoff date,
// but the triggering date itself cannot be later than the dataset snapshot and a preannounced rate
// must never enter the calculation early.
export function calculationHistory(record, metric, startDate, { startDateEndExclusive = null } = {}) {
  const asOf = String(record?.current_as_of || meta().generated_at || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('Dataset current_as_of is invalid');
  const normalizedStart = String(startDate || '');
  const recordedFutureStartIsCovered = /^\d{4}-\d{2}-\d{2}$/.test(String(startDateEndExclusive || ''))
    && normalizedStart < startDateEndExclusive;
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedStart) && normalizedStart > asOf && !recordedFutureStartIsCovered) {
    throw new Error(`Start date cannot be later than the dataset snapshot (${asOf})`);
  }
  return (record?.history?.[metric] || [])
    .filter((observation) => observation.effective_date <= asOf)
    .map((observation) => ({
      effective_date: observation.effective_date,
      value: observation.value,
    }));
}

export function defaultMetric() {
  const m = meta();
  return (m.metrics && m.metrics[0]) || null;
}
