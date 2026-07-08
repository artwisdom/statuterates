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
import { validate } from './lib/validate.mjs';
import { exportAll } from './lib/exporter.mjs';

export const DATASET_META = {
  title: 'StatuteRates',
  description:
    'The canonical, provenance-tracked database of statutory, judgment and tax interest rates across the US, UK and EU — IRS §6621 quarterly rates, the US federal post-judgment rate (28 U.S.C. §1961), UK late-commercial-payment interest (Late Payment Act 1998), and the EU Late Payment Directive reference rate — each value stamped with its effective date and official source.',
  version: '0.2.0',
  update_cadence: 'IRS quarterly; US Treasury/post-judgment weekly; UK/EU statutory rates semi-annual; BoE/ECB policy rates on decision. Refreshed weekly.',
  attribution: 'Source values are U.S. federal government works (public domain). Compiled by StatuteRates.',
  license: 'Compiled dataset offered for reference; values trace to official public-domain sources (see each record).',
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

async function runAll() {
  const db = openDb();
  const runId = startRun(db);
  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1) FETCH — US (IRS + Fed H.15), UK (BoE), EU (ECB)
    const irs = await fetchIrs({ log: console.log });
    const h15 = await fetchH15({ log: console.log });
    const boe = await fetchBoe({ log: console.log });
    const ecb = await fetchEcb({ log: console.log });

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

    // US states: statute-fixed values (CA/NY/MA, verified against official texts) + Iowa derived
    // weekly from the same H.15 weeks as the federal series (Iowa Code §668.13(3) = CMT + 2pp).
    // Each state's entities/observations load under ITS OWN source bundle so the source row exists
    // before any observation references it (FK integrity).
    const nowIso = new Date().toISOString();
    const stateFixed = buildStateFixed({ retrieved_at: nowIso });
    const iowa = buildIowa(weeks, { retrieved_at: nowIso });
    const entityToSource = new Map(stateFixed.observations.map((o) => [o.entitySlug, o.source_id]));
    const stateBundles = STATE_SOURCES.map((source) => ({
      source,
      entities: stateFixed.entities.filter((e) => entityToSource.get(e.slug) === source.id),
      observations: stateFixed.observations.filter((o) => o.source_id === source.id),
    }));
    const iaBundle = stateBundles.find((b) => b.source.id === 'ia-legis');
    iaBundle.entities.push(iowa.entity);
    iaBundle.observations.push(...iowa.observations);

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
if (cmd === 'all') {
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
} else {
  console.error(`Unknown command "${cmd}". Use: all | validate | export`);
  process.exit(2);
}
