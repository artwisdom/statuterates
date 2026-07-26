// Rehydrate SQLite from the committed, diff-friendly JSON snapshots before a refresh.
//
// GitHub Actions starts from a clean checkout and data/db.sqlite is intentionally ignored. Without
// this step, each run only knows about values returned by that one fetch and can silently discard
// history. The exports are therefore the durable bootstrap for SQLite, not a competing source of data.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { upsertSource, upsertEntity, upsertObservation } from './db.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_EXPORTS_DIR = join(__dirname, '..', '..', 'data', 'exports');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function observationRetrievedAt(record, observation, source) {
  // Older builds stamped every curated state observation with the build time even though no source
  // was fetched. Correct those snapshots to the source's actual verification time while hydrating.
  const curatedState = String(record.region || '').startsWith('US States')
    && ['statute-fixed', 'statute-variable'].includes(observation.method);
  if (curatedState && source?.retrieved_at) return source.retrieved_at;
  return observation.retrieved_at;
}

function isSupersededCuratedObservation(record, observation) {
  // Phase 2 corrected Texas prejudgment's effective date from the source-review day (July 9) to the
  // actual OCCC judgment month (July 1). Iowa's former weekly-average model was also legally wrong:
  // State Court Administration selects and distributes a monthly value. Kentucky and Maine also
  // inherited source-review dates instead of legal effective dates. Georgia now follows exact
  // Federal Reserve prime change points, and Mississippi has no universal 8% rate. Do not rehydrate
  // any of those retired placeholders.
  return (record.slug === 'texas-prejudgment-rate' && observation.effective_date === '2026-07-09')
    || (['iowa-judgment-rate', 'iowa-prejudgment-rate'].includes(record.slug)
      && (observation.method === 'derived_ia_668_13_weekly_cmt_plus_2'
        || observation.source_id === 'ia-h15-provisional'))
    || (['kentucky-judgment-rate', 'kentucky-prejudgment-rate', 'maine-prejudgment-rate'].includes(record.slug)
      && observation.effective_date === '2026-07-09')
    || (record.slug === 'georgia-judgment-rate' && observation.effective_date === '2026-07-08')
    || (['georgia-prejudgment-rate', 'mississippi-prejudgment-rate'].includes(record.slug)
      && observation.effective_date === '2026-07-09');
}

function purgeSupersededCuratedObservations(db) {
  // A developer database can predate the export-side migration above. Remove this one known-invalid
  // legacy key as well, otherwise an existing local SQLite file keeps failing validation forever.
  db.prepare(`
    DELETE FROM observations
    WHERE effective_date = '2026-07-09'
      AND entity_id IN (SELECT id FROM entities WHERE slug = 'texas-prejudgment-rate')
  `).run();
  db.prepare(`
    DELETE FROM observations
    WHERE (effective_date = '2026-07-08'
        AND entity_id IN (SELECT id FROM entities WHERE slug = 'georgia-judgment-rate'))
       OR (effective_date = '2026-07-09'
        AND entity_id IN (
          SELECT id FROM entities
          WHERE slug IN ('georgia-prejudgment-rate', 'mississippi-prejudgment-rate')
        ))
  `).run();
  db.prepare(`
    DELETE FROM observations
    WHERE (method = 'derived_ia_668_13_weekly_cmt_plus_2' OR source_id = 'ia-h15-provisional')
      AND entity_id IN (
        SELECT id FROM entities WHERE slug IN ('iowa-judgment-rate', 'iowa-prejudgment-rate')
      )
  `).run();
  db.prepare(`
    DELETE FROM observations
    WHERE effective_date = '2026-07-09'
      AND entity_id IN (
        SELECT id FROM entities
        WHERE slug IN ('kentucky-judgment-rate', 'kentucky-prejudgment-rate', 'maine-prejudgment-rate')
      )
  `).run();
  db.prepare(`
    DELETE FROM sources
    WHERE id IN ('ia-legis', 'ia-h15-provisional')
      AND NOT EXISTS (SELECT 1 FROM observations WHERE source_id = sources.id)
  `).run();
}

export function seedFromExports(db, { exportsDir = DEFAULT_EXPORTS_DIR } = {}) {
  const metaPath = join(exportsDir, 'meta.json');
  const entityDir = join(exportsDir, 'entity');
  if (!existsSync(metaPath) || !existsSync(entityDir)) {
    return { seeded: false, sources: 0, entities: 0, observations: 0 };
  }

  const meta = readJson(metaPath);
  // ia-legis belonged to the retired weekly derivation, and ia-h15-provisional to the now-retired
  // estimate that the official July 2026 court selection replaced. Do not revive either source.
  const sources = (Array.isArray(meta.sources) ? meta.sources : [])
    .filter((source) => !['ia-legis', 'ia-h15-provisional'].includes(source.id));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const files = readdirSync(entityDir).filter((file) => file.endsWith('.json')).sort();
  let observations = 0;

  const hydrate = db.transaction(() => {
    purgeSupersededCuratedObservations(db);
    for (const source of sources) upsertSource(db, source);

    for (const file of files) {
      const record = readJson(join(entityDir, file));
      const entityId = upsertEntity(db, {
        slug: record.slug,
        name: record.name,
        entity_type: record.entity_type,
        jurisdiction: record.jurisdiction,
        region: record.region,
        locale: record.locale,
        metadata: record.metadata,
      });

      for (const history of Object.values(record.history || {})) {
        for (const observation of history) {
          if (isSupersededCuratedObservation(record, observation)) continue;
          const source = sourceById.get(observation.source_id);
          if (!source) {
            throw new Error(`${record.slug}@${observation.effective_date}: source ${observation.source_id} missing from exports/meta.json`);
          }
          upsertObservation(db, {
            entity_id: entityId,
            metric: observation.metric,
            value_numeric: observation.value,
            value_text: observation.value_text,
            unit: observation.unit,
            effective_date: observation.effective_date,
            source_id: observation.source_id,
            source_url: observation.source_url,
            retrieved_at: observationRetrievedAt(record, observation, source),
            confidence: observation.confidence,
            method: observation.method,
            notes: observation.notes,
          });
          observations++;
        }
      }
    }
  });

  hydrate();
  return { seeded: true, sources: sources.length, entities: files.length, observations };
}
