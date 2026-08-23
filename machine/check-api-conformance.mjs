#!/usr/bin/env node
// Conformance check: the generated static API (site/public/api/v1/) must match the shapes documented
// in machine/openapi.yaml. Exits non-zero on any mismatch so the QA gauntlet / CI catches drift.
// Run: node check-api-conformance.mjs   (after build-api.mjs)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVED_HISTORICAL_RATE_SLUGS } from '../shared/historical-rate-releases.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = resolve(__dirname, '..', 'site', 'public', 'api', 'v1');
const OPENAPI = resolve(__dirname, 'openapi.yaml');

const errors = [];
const fail = (m) => errors.push(m);
const readJson = (rel) => JSON.parse(readFileSync(join(API, rel), 'utf8'));
const has = (obj, keys, where) => {
  for (const k of keys) if (!(k in obj)) fail(`${where}: missing key "${k}"`);
};
const openapiText = readFileSync(OPENAPI, 'utf8');
if (!openapiText.includes('/api/v1/history-coverage.json:')
    || !openapiText.includes('HistoricalCoverageSeries:')) {
  fail('openapi.yaml: historical coverage endpoint or schema is missing');
}

if (!existsSync(join(API, 'index.json'))) {
  console.error('No API found. Run `node build-api.mjs` first.');
  process.exit(1);
}

// index.json
const index = readJson('index.json');
has(index, ['api_version', 'dataset', 'generated_at', 'endpoints', 'counts'], 'index.json');
if (index.api_version !== 'v1') fail(`index.json: api_version "${index.api_version}" != "v1"`);
for (const endpoint of ['meta', 'entities', 'latest', 'upcoming', 'metrics', 'history_coverage', 'entity', 'entity_csv', 'documentation', 'openapi', 'llms', 'llms_full']) {
  if (!index.endpoints?.[endpoint]) fail(`index.json: missing endpoint "${endpoint}"`);
}
const asOfDate = String(index.current_as_of || index.generated_at || '').slice(0, 10);

// enveloped endpoints
for (const f of ['meta.json', 'metrics.json', 'entities.json']) {
  const e = readJson(f);
  has(e, ['api_version', 'generated_at', 'data'], f);
}

// metrics
const metrics = readJson('metrics.json').data.metrics;
if (!Array.isArray(metrics) || metrics.length < 1) fail('metrics.json: data.metrics must be a non-empty array');

// entities collection
const entities = readJson('entities.json').data.entities;
if (!Array.isArray(entities) || entities.length < 1) fail('entities.json: data.entities must be a non-empty array');
for (const e of entities) has(e, ['slug', 'name', 'entity_type'], `entities.json entity "${e.slug}"`);

// flat latest endpoint
const latest = readJson('latest.json');
has(latest, ['api_version', 'generated_at', 'data'], 'latest.json');
has(latest.data, ['count', 'current_as_of', 'observations'], 'latest.json data');
if (!Array.isArray(latest.data.observations) || latest.data.observations.length < 1) fail('latest.json: data.observations must be non-empty');
for (const o of latest.data.observations) {
  if (!o.entity || !o.effective_date || !o.source_url) { fail(`latest.json: observation missing entity/effective_date/source_url (${JSON.stringify(o).slice(0, 80)})`); break; }
  if (o.effective_date > asOfDate) fail(`latest.json: ${o.entity} promotes future value ${o.effective_date} after ${asOfDate}`);
}

// Announced future periods remain accessible, but only through an explicitly upcoming endpoint.
const upcoming = readJson('upcoming.json');
has(upcoming, ['api_version', 'generated_at', 'data'], 'upcoming.json');
has(upcoming.data, ['count', 'current_as_of', 'observations'], 'upcoming.json data');
if (!Array.isArray(upcoming.data.observations)) fail('upcoming.json: data.observations must be an array');
for (const o of upcoming.data.observations || []) {
  if (!o.entity || !o.effective_date || !o.source_url) {
    fail(`upcoming.json: observation missing entity/effective_date/source_url (${JSON.stringify(o).slice(0, 80)})`);
    break;
  }
  if (o.effective_date <= asOfDate) fail(`upcoming.json: ${o.entity} contains non-future value ${o.effective_date}`);
}

// Historical coverage advertises only the code-reviewed lookup registry, never every entity that
// happens to have more than one observation.
const historyCoverage = readJson('history-coverage.json');
has(historyCoverage, ['api_version', 'generated_at', 'data'], 'history-coverage.json');
has(historyCoverage.data, ['count', 'current_as_of', 'series'], 'history-coverage.json data');
if (historyCoverage.data.current_as_of !== asOfDate) {
  fail(`history-coverage.json: current_as_of ${historyCoverage.data.current_as_of} != ${asOfDate}`);
}
if (!Array.isArray(historyCoverage.data.series)) fail('history-coverage.json: data.series must be an array');
const historicalSeries = historyCoverage.data.series || [];
if (historyCoverage.data.count !== historicalSeries.length) {
  fail(`history-coverage.json: count ${historyCoverage.data.count} != series length ${historicalSeries.length}`);
}
const expectedHistoricalSlugs = [...APPROVED_HISTORICAL_RATE_SLUGS].sort();
const actualHistoricalSlugs = historicalSeries.map((series) => series.entity_slug).sort();
if (JSON.stringify(actualHistoricalSlugs) !== JSON.stringify(expectedHistoricalSlugs)) {
  fail(`history-coverage.json: released slugs differ from registry (expected ${expectedHistoricalSlugs.join(', ')})`);
}
if (new Set(actualHistoricalSlugs).size !== actualHistoricalSlugs.length) {
  fail('history-coverage.json: duplicate released series');
}
if (index.counts?.historical_lookup_series !== expectedHistoricalSlugs.length) {
  fail(`index.json: historical_lookup_series count must be ${expectedHistoricalSlugs.length}`);
}
for (const series of historicalSeries) {
  has(series, [
    'entity_slug', 'label', 'metric', 'usage', 'calculation_supported', 'input_meaning', 'branch_scope', 'selection_rule',
    'coverage_note', 'coverage_start', 'coverage_end', 'history_count', 'gaps', 'source_url',
    'official_authorities', 'links',
  ], `history-coverage.json series "${series.entity_slug}"`);
  if (series.usage !== 'reference_only' || series.calculation_supported !== false) {
    fail(`history-coverage.json ${series.entity_slug}: historical lookup must remain reference-only`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(series.coverage_start || '')) fail(`history-coverage.json ${series.entity_slug}: bad coverage_start`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(series.coverage_end || '')) fail(`history-coverage.json ${series.entity_slug}: bad coverage_end`);
  if (series.coverage_start > series.coverage_end) fail(`history-coverage.json ${series.entity_slug}: coverage ends before it starts`);
  if (series.coverage_end > asOfDate) fail(`history-coverage.json ${series.entity_slug}: coverage extends after snapshot`);
  if (!Number.isInteger(series.history_count) || series.history_count < 2) fail(`history-coverage.json ${series.entity_slug}: history_count must be at least 2`);
  if (!Array.isArray(series.gaps)) fail(`history-coverage.json ${series.entity_slug}: gaps must be an array`);
  if (!Array.isArray(series.official_authorities)) fail(`history-coverage.json ${series.entity_slug}: official_authorities must be an array`);
  if (!String(series.source_url || '').startsWith('https://')) fail(`history-coverage.json ${series.entity_slug}: source_url must use HTTPS`);
  if (series.links?.entity_json !== `/api/v1/entity/${series.entity_slug}.json`) fail(`history-coverage.json ${series.entity_slug}: wrong entity_json link`);
  for (const gap of series.gaps || []) {
    has(gap, ['start', 'end', 'reason'], `history-coverage.json ${series.entity_slug} gap`);
    if (gap.start > gap.end) fail(`history-coverage.json ${series.entity_slug}: gap ends before it starts`);
  }
}
const nebraska = historicalSeries.find((series) => series.entity_slug === 'nebraska-judgment-rate');
if (nebraska?.gaps?.[0]?.start !== '2001-03-14' || nebraska?.gaps?.[0]?.end !== '2002-07-19') {
  fail('history-coverage.json: Nebraska verified publication gap is missing or changed');
}

// per-entity endpoints
const OBS_KEYS = ['metric', 'value', 'unit', 'effective_date', 'source_url', 'retrieved_at', 'confidence'];
const entityDir = join(API, 'entity');
const files = existsSync(entityDir) ? readdirSync(entityDir).filter((f) => f.endsWith('.json')) : [];
if (files.length !== entities.length) fail(`entity endpoints (${files.length}) != entities.json count (${entities.length})`);
// every JSON endpoint must have a CSV sibling
const csvs = existsSync(entityDir) ? new Set(readdirSync(entityDir).filter((f) => f.endsWith('.csv'))) : new Set();
for (const f of files) {
  if (!csvs.has(f.replace(/\.json$/, '.csv'))) fail(`entity/${f}: missing CSV sibling`);
}

let obsChecked = 0;
for (const f of files) {
  const env = readJson(join('entity', f));
  has(env, ['api_version', 'generated_at', 'data'], `entity/${f}`);
  const d = env.data;
  has(d, ['slug', 'name', 'entity_type', 'latest', 'current', 'latest_published', 'current_as_of', 'history'], `entity/${f} data`);
  for (const [metric, obs] of Object.entries(d.latest || {})) {
    has(obs, OBS_KEYS, `entity/${f} latest.${metric}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(obs.effective_date)) fail(`entity/${f} latest.${metric}: bad effective_date`);
    if (obs.effective_date > asOfDate) fail(`entity/${f} latest.${metric}: future value ${obs.effective_date} after ${asOfDate}`);
    if (!/^https?:\/\//.test(obs.source_url)) fail(`entity/${f} latest.${metric}: source_url not a URL`);
    if (!['high', 'medium', 'low'].includes(obs.confidence)) fail(`entity/${f} latest.${metric}: bad confidence`);
    if (JSON.stringify(obs) !== JSON.stringify(d.current?.[metric])) {
      fail(`entity/${f}: latest.${metric} must be the current-value compatibility alias`);
    }
    obsChecked++;
  }
  for (const arr of Object.values(d.history || {})) {
    for (const obs of arr) { has(obs, OBS_KEYS, `entity/${f} history`); obsChecked++; }
  }
}

if (errors.length) {
  console.error(`API CONFORMANCE FAILED (${errors.length}):`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`API conformance OK: ${files.length} entity endpoints, ${obsChecked} observations checked against openapi.yaml shapes.`);
