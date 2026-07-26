#!/usr/bin/env node
// Pipeline orchestrator: fetch -> load (SQLite) -> validate -> export.
// Usage: node run.mjs [all|fetch|build|validate|export]   (default: all)
//
// FAILS LOUD: if validation returns errors, the process exits non-zero and does NOT export, so a
// broken fetch can never publish garbage.

import { openDb, upsertSource, upsertEntity, upsertObservation, startRun, finishRun } from './lib/db.mjs';
import { fetchIrs } from './fetchers/irs.mjs';
import { fetchH15 } from './fetchers/fed-h15.mjs';
import { fetchBoe, BOE_ENTITY } from './fetchers/boe.mjs';
import { fetchEcb, ECB_ENTITY } from './fetchers/ecb.mjs';
import { buildWeeklyAverages, buildCmtRecords, buildPostJudgmentRecords } from './lib/normalize.mjs';
import { buildPublishedSeries, buildUkLatePayment, buildEuReference } from './lib/rates-intl.mjs';
import { STATE_SOURCES, buildStateFixed, buildIowa } from './fetchers/us-states.mjs';
import { fetchTexasCurrentRate } from './fetchers/texas-occc.mjs';
import { fetchAlaskaCourtRates } from './fetchers/alaska-judicial.mjs';
import { fetchNebraskaCurrentRate } from './fetchers/nebraska-judicial.mjs';
import { fetchIowaCourtTable } from './fetchers/iowa-judicial.mjs';
import { fetchGeorgiaPrimeChanges } from './fetchers/georgia-prime.mjs';
import { fetchUtahCourtRates } from './fetchers/utah-judicial.mjs';
import { fetchFloridaCfoRates } from './fetchers/florida-cfo.mjs';
import { validate } from './lib/validate.mjs';
import { exportAll } from './lib/exporter.mjs';
import { seedFromExports } from './lib/seed-exports.mjs';

export const DATASET_META = {
  title: 'StatuteRates',
  description:
    'A provenance-tracked reference dataset of statutory, judgment and tax interest rates across the US, UK and EU — with effective dates, methods, and a cited source for each observation. Primary government sources are preferred; any secondary source is identified in its source record.',
  version: '0.3.0',
  update_cadence: 'IRS quarterly; US Treasury/post-judgment weekly; UK/EU statutory rates semi-annual; BoE/ECB policy rates on decision. Refreshed weekly.',
  attribution: 'Compiled by StatuteRates from government publications, statutory texts, and identified secondary legal sources.',
  license: 'StatuteRates compilation; underlying source rights vary. Government edicts are not subject to copyright, while statistical publications and third-party pages may have their own terms. See each source record.',
  sample_query: 'irs',
  disclaimer:
    'Reference data, not legal, tax, or financial advice. Derived values (e.g. the post-judgment rate) show their formula; verify against the controlling statute/court before relying on them.',
};

function loadBundleIntoDb(db, bundle) {
  let n = 0;
  upsertSource(db, bundle.source);
  const slugToId = new Map();
  for (const e of bundle.entities) slugToId.set(e.slug, upsertEntity(db, e));
  for (const o of bundle.observations) {
    const entity_id = slugToId.get(o.entitySlug);
    if (!entity_id) throw new Error(`observation references unknown entity slug ${o.entitySlug}`);
    const { entitySlug, ...rest } = o;
    upsertObservation(db, { entity_id, ...rest });
    n++;
  }
  return n;
}

function buildStateBundles({ daily = [], today, retrievedAt, texasCurrent = null, alaskaCourt = null, nebraskaCurrent = null, floridaCfo = null, georgiaPrime = null, iowaCourt = null, utahCourt = null, sourceOverrides = [] } = {}) {
  const stateFixed = buildStateFixed({
    texasCurrent,
    alaskaCourtHistory: alaskaCourt?.historyPoints || [],
    alaskaRetrievedAt: alaskaCourt?.retrieved_at || null,
    nebraskaCurrent,
    floridaCfoPoints: floridaCfo?.points || [],
    floridaRetrievedAt: floridaCfo?.retrieved_at || null,
    utahCourtHistory: utahCourt?.historyPoints || [],
    utahCourtCurrent: utahCourt?.current || null,
    utahRetrievedAt: utahCourt?.retrieved_at || null,
    georgiaPrimeChanges: georgiaPrime?.changePoints || [],
    georgiaRetrievedAt: georgiaPrime?.retrieved_at || null,
    daily,
    today,
    retrievedAt,
  });
  const sourceById = new Map(STATE_SOURCES.map((source) => [source.id, source]));
  for (const source of sourceOverrides) sourceById.set(source.id, source);
  const sources = [...sourceById.values()];
  const iaSource = sourceById.get('ia-jud');
  const iowa = buildIowa({
    courtPoints: iowaCourt?.points || [],
    courtRetrievedAt: iowaCourt?.retrieved_at || null,
    daily,
    retrieved_at: retrievedAt || iaSource.retrieved_at,
  });
  const entityToSources = new Map();
  for (const observation of stateFixed.observations) {
    if (!entityToSources.has(observation.entitySlug)) entityToSources.set(observation.entitySlug, new Set());
    entityToSources.get(observation.entitySlug).add(observation.source_id);
  }
  const bundles = sources.map((source) => ({
    source,
    // A future Maine period can have official-chart history plus a separately labeled provisional
    // H.15 point. Re-upserting its entity in both source bundles is intentional and idempotent.
    entities: stateFixed.entities.filter((entity) => entityToSources.get(entity.slug)?.has(source.id)),
    observations: stateFixed.observations.filter((observation) => observation.source_id === source.id),
  }));
  for (const sourceId of new Set(iowa.observations.map((observation) => observation.source_id))) {
    const iaBundle = bundles.find((bundle) => bundle.source.id === sourceId);
    if (!iaBundle) throw new Error(`Iowa observation source ${sourceId} is missing from STATE_SOURCES`);
    // Re-upserting Iowa's entity alongside its official court observations is intentional and
    // idempotent. Estimated H.15 substitutes are forbidden for this series.
    iaBundle.entities.push(...iowa.entities);
    iaBundle.observations.push(...iowa.observations.filter((observation) => observation.source_id === sourceId));
  }
  return bundles;
}

async function runAll() {
  const db = openDb();
  const seed = seedFromExports(db);
  if (seed.seeded) {
    console.log(`Hydrated SQLite from committed history: ${seed.entities} entities / ${seed.observations} observations.`);
  }
  const runId = startRun(db);
  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1) FETCH — US (IRS + Fed H.15), UK (BoE), EU (ECB)
    const [irs, h15, boe, ecb, texas, alaskaCourt, nebraska, floridaCfo, georgiaPrime, iowaCourt, utahCourt] = await Promise.all([
      fetchIrs({ log: console.log }),
      fetchH15({ log: console.log }),
      fetchBoe({ log: console.log }),
      fetchEcb({ log: console.log }),
      fetchTexasCurrentRate({ log: console.log, today }),
      fetchAlaskaCourtRates({ log: console.log, today }),
      fetchNebraskaCurrentRate({ log: console.log, today }),
      fetchFloridaCfoRates({ log: console.log, today }),
      fetchGeorgiaPrimeChanges({ log: console.log, today }),
      fetchIowaCourtTable({ log: console.log, today }),
      fetchUtahCourtRates({ log: console.log, today }),
    ]);

    // 2) NORMALIZE
    // US: H.15 daily -> weekly CMT + derived post-judgment
    const weeks = buildWeeklyAverages(h15.daily);
    const cmt = buildCmtRecords(weeks, { source_id: h15.source.id, source_url: h15.source_url, retrieved_at: h15.retrieved_at });
    const pj = buildPostJudgmentRecords(weeks, { source_id: h15.source.id, source_url: h15.source_url, retrieved_at: h15.retrieved_at });
    const h15Bundle = { source: h15.source, entities: [cmt.entity, pj.entity], observations: [...cmt.observations, ...pj.observations] };

    // UK: BoE base rate (published) + statutory late-payment (derived, semi-annual)
    const boeSrc = { source_id: boe.source.id, source_url: boe.source_url, retrieved_at: boe.retrieved_at };
    const boePub = buildPublishedSeries(boe.changePoints, BOE_ENTITY, { ...boeSrc, label: 'Bank of England Bank Rate' });
    const ukLpa = buildUkLatePayment(boe.changePoints, { ...boeSrc, today });
    const boeBundle = { source: boe.source, entities: [boePub.entity, ukLpa.entity], observations: [...boePub.observations, ...ukLpa.observations] };

    // EU: ECB MRO (published) + Late Payment Directive reference (derived, semi-annual)
    const ecbSrc = { source_id: ecb.source.id, source_url: ecb.source_url, retrieved_at: ecb.retrieved_at };
    const ecbPub = buildPublishedSeries(ecb.changePoints, ECB_ENTITY, { ...ecbSrc, label: 'ECB Main Refinancing Operations rate' });
    const euRef = buildEuReference(ecb.changePoints, { ...ecbSrc, today });
    const ecbBundle = { source: ecb.source, entities: [ecbPub.entity, euRef.entity], observations: [...ecbPub.observations, ...euRef.observations] };

    // US states: curated official references. Texas and Nebraska receive live official observations;
    // Alaska verifies and can extend its official annual court-PDF schedule;
    // Florida checks its official 1981-present CFO table and appends a verified new quarter;
    // Georgia validates and extends its exact Federal Reserve prime-rate change-point history.
    // Iowa uses the Judicial Branch's monthly table (never the federal weekly average) and attempts
    // a live table refresh. Utah checks both official annual court tables and appends a new calendar
    // year only after all overlapping values and statutory formula branches reconcile.
    // If access is blocked, each retains verified court history without estimating.
    // Each state's entities/observations load under ITS OWN source bundle so the source row exists
    // before any observation references it (FK integrity).
    const txPrejudSource = STATE_SOURCES.find((source) => source.id === 'tx-prejud');
    const akPostSource = STATE_SOURCES.find((source) => source.id === 'ak-jud');
    const akPrejudSource = STATE_SOURCES.find((source) => source.id === 'ak-prejud');
    const nePrejudSource = STATE_SOURCES.find((source) => source.id === 'ne-prejud');
    const gaPostSource = STATE_SOURCES.find((source) => source.id === 'ga-code');
    const gaPrejudSource = STATE_SOURCES.find((source) => source.id === 'ga-prejud');
    const meProvisionalSource = STATE_SOURCES.find((source) => source.id === 'me-h15-provisional');
    const stateBundles = buildStateBundles({
      daily: h15.daily,
      today,
      retrievedAt: h15.retrieved_at,
      texasCurrent: texas.observation,
      alaskaCourt,
      nebraskaCurrent: nebraska.observation,
      floridaCfo,
      georgiaPrime,
      iowaCourt,
      utahCourt,
      sourceOverrides: [
        texas.source,
        nebraska.source,
        ...(alaskaCourt ? [
          {
            ...akPostSource,
            robots_status: `official ADM-505 annual table fetched and verified ${alaskaCourt.retrieved_at}`,
            retrieved_at: alaskaCourt.retrieved_at,
          },
          {
            ...akPrejudSource,
            robots_status: `official ADM-505 annual table fetched and verified ${alaskaCourt.retrieved_at}`,
            retrieved_at: alaskaCourt.retrieved_at,
          },
        ] : []),
        ...(floridaCfo?.source ? [floridaCfo.source] : []),
        ...(iowaCourt?.source ? [iowaCourt.source] : []),
        ...(utahCourt?.source ? [utahCourt.source] : []),
        {
          ...txPrejudSource,
          robots_status: `official Chapter 304 text verified 2026-07-19; current linked OCCC rate fetched ${texas.retrieved_at}`,
          retrieved_at: texas.retrieved_at,
        },
        {
          ...nePrejudSource,
          robots_status: `official Chapter 45 text verified 2026-07-19; current linked Judicial Branch rate fetched ${nebraska.retrieved_at}`,
          retrieved_at: nebraska.retrieved_at,
        },
        {
          ...gaPostSource,
          robots_status: `Georgia General Assembly-authorized Code portal verified 2026-07-19; complete Federal Reserve/FRED PRIME history fetched ${georgiaPrime.retrieved_at}`,
          retrieved_at: georgiaPrime.retrieved_at,
        },
        {
          ...gaPrejudSource,
          robots_status: `Georgia General Assembly-authorized Code portal verified 2026-07-19; complete Federal Reserve/FRED PRIME history fetched ${georgiaPrime.retrieved_at}`,
          retrieved_at: georgiaPrime.retrieved_at,
        },
        {
          ...meProvisionalSource,
          robots_status: `future-year fallback only after the official Maine Judicial Branch chart ends; official H.15 input fetched ${h15.retrieved_at}`,
          retrieved_at: h15.retrieved_at,
        },
      ],
    });

    // 3) LOAD into SQLite (source of truth)
    let records = 0;
    const tx = db.transaction(() => {
      records += loadBundleIntoDb(db, irs);
      records += loadBundleIntoDb(db, h15Bundle);
      records += loadBundleIntoDb(db, boeBundle);
      records += loadBundleIntoDb(db, ecbBundle);
      for (const b of stateBundles) records += loadBundleIntoDb(db, b);
    });
    tx();
    console.log(`Loaded ${records} observations into SQLite.`);

    // 4) VALIDATE — abort before export on any hard error
    const report = validate(db);
    console.log('\n=== VALIDATION ===');
    console.log('coverage:', JSON.stringify(report.coverage, null, 2));
    if (report.warnings.length) console.log('warnings:\n  - ' + report.warnings.join('\n  - '));
    if (!report.ok) {
      console.error('\nVALIDATION FAILED (' + report.errors.length + ' errors):');
      for (const e of report.errors) console.error('  ✗ ' + e);
      finishRun(db, runId, { status: 'failed', records, notes: `${report.errors.length} validation errors` });
      db.close();
      process.exit(1);
    }
    console.log(`validation OK — ${report.totals.observations} observations, ${report.totals.series} series, ${report.totals.pjConsistencyChecked} post-judgment + ${report.totals.irsSpreadChecked} IRS §6621-spread consistency checks passed`);

    // 5) EXPORT versioned JSON snapshots
    const ex = exportAll({ datasetMeta: DATASET_META });
    console.log(`\nExported ${ex.entities} entities / ${ex.observations} observations to data/exports/ @ ${ex.generatedAt}`);

    finishRun(db, runId, { status: 'ok', records, notes: `${report.warnings.length} warnings` });
    db.close();
    return { records, report, ex };
  } catch (err) {
    finishRun(db, runId, { status: 'failed', records: 0, notes: String(err.message) });
    db.close();
    throw err;
  }
}

const cmd = process.argv[2] || 'all';
if (cmd === 'all' || cmd === 'fetch') {
  runAll().catch((e) => {
    console.error('\nPIPELINE FAILED:', e.message);
    process.exit(1);
  });
} else if (cmd === 'validate') {
  const db = openDb({ create: false });
  const report = validate(db);
  console.log(JSON.stringify(report, null, 2));
  db.close();
  process.exit(report.ok ? 0 : 1);
} else if (cmd === 'export') {
  const ex = exportAll({ datasetMeta: DATASET_META });
  console.log(`Exported ${ex.entities} entities / ${ex.observations} observations.`);
} else if (cmd === 'build') {
  const db = openDb();
  const seed = seedFromExports(db);
  let curatedRecords = 0;
  const loadCurated = db.transaction(() => {
    for (const bundle of buildStateBundles()) curatedRecords += loadBundleIntoDb(db, bundle);
  });
  loadCurated();
  const report = validate(db);
  console.log(`Hydrated SQLite from committed exports: ${seed.entities} entities / ${seed.observations} observations; refreshed ${curatedRecords} curated state records from source code.`);
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  db.close();
  process.exit(report.ok ? 0 : 1);
} else {
  console.error(`Unknown command "${cmd}". Use: all | fetch | build | validate | export`);
  process.exit(2);
}
