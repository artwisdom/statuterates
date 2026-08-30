#!/usr/bin/env node
// Prevent current-baseline documentation from silently drifting away from generated artifacts.
// Dated phase reports remain historical receipts and are intentionally outside this check.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'site', 'dist');
const EXPORTS = join(ROOT, 'data', 'exports');
const failures = [];
const BASELINE = Object.freeze({
  date: '2026-08-30',
  entityCount: 114,
  observationCount: 5508,
});

function read(relativePath) {
  return readFileSync(join(ROOT, relativePath), 'utf8');
}

function requireText(label, text, expected) {
  if (!text.includes(expected)) failures.push(`${label} is missing ${JSON.stringify(expected)}`);
}

function htmlCount(directory) {
  let count = 0;
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) count += htmlCount(path);
    else if (entry.endsWith('.html')) count += 1;
  }
  return count;
}

if (!existsSync(DIST)) throw new Error('site/dist is missing; run the static site build first');

const meta = JSON.parse(read('data/exports/meta.json'));
const formattedObservations = Number(meta.observation_count).toLocaleString('en-US');
const formattedBaselineObservations = BASELINE.observationCount.toLocaleString('en-US');
const builtHtml = htmlCount(DIST);
const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>\s*[^<]+\s*<\/loc>/g)].length;
const entityFiles = readdirSync(join(EXPORTS, 'entity')).filter((name) => name.endsWith('.json'));
const calculatorReady = entityFiles
  .map((name) => JSON.parse(readFileSync(join(EXPORTS, 'entity', name), 'utf8')))
  .filter((record) => record.metadata?.calculation?.status === 'ready')
  .map((record) => record.slug)
  .sort();

if (calculatorReady.length !== 1 || calculatorReady[0] !== 'florida-judgment-rate') {
  failures.push(`calculator-ready state contract changed: ${JSON.stringify(calculatorReady)}`);
}

const documents = {
  README: read('README.md'),
  STATE: read('STATE.md'),
  ARCHITECTURE: read('docs/ARCHITECTURE.md'),
  DEPLOYMENT_GUIDE: read('docs/DEPLOYMENT_GUIDE.md'),
  MAINTENANCE_RUNBOOK: read('docs/MAINTENANCE_RUNBOOK.md'),
};

if (Number(meta.entity_count) < BASELINE.entityCount) {
  failures.push(`entity count regressed below the ${BASELINE.date} baseline (${meta.entity_count} < ${BASELINE.entityCount})`);
}
if (Number(meta.observation_count) < BASELINE.observationCount) {
  failures.push(
    `observation count regressed below the ${BASELINE.date} baseline `
    + `(${meta.observation_count} < ${BASELINE.observationCount})`,
  );
}

requireText(
  'README',
  documents.README,
  `Baseline captured ${BASELINE.date}: ${BASELINE.entityCount} rate series and ${formattedBaselineObservations} recorded observations`,
);
requireText('README', documents.README, '`data/exports/meta.json` is the live count');
requireText('README', documents.README, `${builtHtml} static HTML pages`);
requireText('README', documents.README, `${sitemapUrls}-URL indexable sitemap`);
requireText(
  'STATE',
  documents.STATE,
  `Baseline captured ${BASELINE.date}: ${BASELINE.entityCount} rate-series entities and ${formattedBaselineObservations} recorded historical observations`,
);
requireText('STATE', documents.STATE, '`data/exports/meta.json` is the live count');
requireText('STATE', documents.STATE, `${builtHtml} static HTML pages`);
requireText('STATE', documents.STATE, `sitemap contains ${sitemapUrls} URLs`);
requireText(
  'ARCHITECTURE',
  documents.ARCHITECTURE,
  `${BASELINE.date} release baseline contains ${BASELINE.entityCount} series and ${formattedBaselineObservations} observations`,
);
requireText('ARCHITECTURE', documents.ARCHITECTURE, '`data/exports/meta.json` is authoritative for the live count');
requireText('ARCHITECTURE', documents.ARCHITECTURE, `${builtHtml} HTML pages`);
requireText('ARCHITECTURE', documents.ARCHITECTURE, `${sitemapUrls} indexable sitemap URLs`);
requireText('ARCHITECTURE', documents.ARCHITECTURE, 'Florida post-judgment is the sole `ready` state');

const refresh = read('.github/workflows/refresh.yml');
requireText('refresh workflow', refresh, 'cron: "0 12 * * 3"');
for (const [label, text] of Object.entries(documents)) {
  if (label !== 'MAINTENANCE_RUNBOOK') requireText(label, text, 'Wednesday at 12:00 UTC');
}
for (const label of ['README', 'STATE', 'ARCHITECTURE', 'DEPLOYMENT_GUIDE']) {
  requireText(label, documents[label], 'fresh commit job');
}

const federal = JSON.parse(read('data/exports/entity/us-federal-post-judgment.json'));
if (federal.metadata?.date_semantics !== 'judgment-applicability-week-start'
    || federal.metadata?.source_week_offset_days !== -7) {
  failures.push('federal post-judgment export is missing the application/source-week date contract');
}
requireText('README', documents.README, 'following Monday when');
requireText('STATE', documents.STATE, 'seven days after its H.15 source-week Monday');
requireText('ARCHITECTURE', documents.ARCHITECTURE, 'following Monday when');
requireText('MAINTENANCE_RUNBOOK', documents.MAINTENANCE_RUNBOOK, 'application week `2000-12-18`');
requireText('MAINTENANCE_RUNBOOK', documents.MAINTENANCE_RUNBOOK, 'CMT source-week observation seven days');

if (failures.length) {
  console.error(`Documentation truth check failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(
  `Documentation truth OK: ${meta.entity_count} entities, ${formattedObservations} observations, `
  + `${builtHtml} HTML pages, ${sitemapUrls} sitemap URLs, Wednesday refresh, Florida-only state calculator.`,
);
