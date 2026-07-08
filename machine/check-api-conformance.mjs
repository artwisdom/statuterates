#!/usr/bin/env node
// Conformance check: the generated static API (site/public/api/v1/) must match the shapes documented
// in machine/openapi.yaml. Exits non-zero on any mismatch so the QA gauntlet / CI catches drift.
// Run: node check-api-conformance.mjs   (after build-api.mjs)

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API = resolve(__dirname, '..', 'site', 'public', 'api', 'v1');

const errors = [];
const fail = (m) => errors.push(m);
const readJson = (rel) => JSON.parse(readFileSync(join(API, rel), 'utf8'));
const has = (obj, keys, where) => {
  for (const k of keys) if (!(k in obj)) fail(`${where}: missing key "${k}"`);
};

if (!existsSync(join(API, 'index.json'))) {
  console.error('No API found. Run `node build-api.mjs` first.');
  process.exit(1);
}

// index.json
const index = readJson('index.json');
has(index, ['api_version', 'dataset', 'generated_at', 'endpoints', 'counts'], 'index.json');
if (index.api_version !== 'v1') fail(`index.json: api_version "${index.api_version}" != "v1"`);

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

// per-entity endpoints
const OBS_KEYS = ['metric', 'value', 'unit', 'effective_date', 'source_url', 'retrieved_at', 'confidence'];
const entityDir = join(API, 'entity');
const files = existsSync(entityDir) ? readdirSync(entityDir).filter((f) => f.endsWith('.json')) : [];
if (files.length !== entities.length) fail(`entity endpoints (${files.length}) != entities.json count (${entities.length})`);

let obsChecked = 0;
for (const f of files) {
  const env = readJson(join('entity', f));
  has(env, ['api_version', 'generated_at', 'data'], `entity/${f}`);
  const d = env.data;
  has(d, ['slug', 'name', 'entity_type', 'latest', 'history'], `entity/${f} data`);
  for (const [metric, obs] of Object.entries(d.latest || {})) {
    has(obs, OBS_KEYS, `entity/${f} latest.${metric}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(obs.effective_date)) fail(`entity/${f} latest.${metric}: bad effective_date`);
    if (!/^https?:\/\//.test(obs.source_url)) fail(`entity/${f} latest.${metric}: source_url not a URL`);
    if (!['high', 'medium', 'low'].includes(obs.confidence)) fail(`entity/${f} latest.${metric}: bad confidence`);
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
