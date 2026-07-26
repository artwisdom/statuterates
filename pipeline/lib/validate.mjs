// Validation suite. Runs against the loaded SQLite DB AFTER normalize+load and BEFORE export.
// Philosophy: FAIL LOUD. Hard errors throw and abort the run so a broken fetch can never publish
// garbage. Softer issues are warnings (reported, non-fatal). Returns a structured report.
//
// Checks:
//  - provenance completeness: every observation has source_url, retrieved_at, effective_date, unit
//  - type/parse: value_numeric finite except for narrowly modeled case-specific rules; ISO dates
//  - unit sanity ranges: percent_per_annum within [-5, 30] (hard), warn outside [0, 25]
//  - derived-value consistency: us-federal-post-judgment == treasury-1-year-cmt for each shared week
//  - staleness: warn if the freshest observation is old; ERROR if egregiously old (broken fetch)
//  - coverage: per-series counts + date ranges

import { validateStateCalculationMetadata } from './state-rules.mjs';
import { validateTexasMonthlyHistory } from '../fetchers/texas-occc-history.mjs';
import { validateNebraskaHistory } from '../fetchers/nebraska-judgment-history.mjs';
import { validateIowaOfficialHistory } from '../fetchers/iowa-judgment-history.mjs';
import { validateKentuckyPostJudgmentHistory } from '../fetchers/kentucky-interest-history.mjs';
import { validateMaineOfficialHistory, MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH } from '../fetchers/maine-interest-history.mjs';
import { validateGeorgiaRateHistory } from '../fetchers/georgia-interest-history.mjs';

const HARD_MIN = -5;
const HARD_MAX = 30;
const SOFT_MIN = 0;
const SOFT_MAX = 25;

function isIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function daysBetween(a, b) {
  return Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 86400000);
}

export function validate(db, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const errors = [];
  const warnings = [];

  const rows = db
    .prepare(
      `SELECT o.*, e.slug AS entity_slug FROM observations o JOIN entities e ON e.id = o.entity_id`
    )
    .all();

  if (rows.length === 0) errors.push('No observations in the database — pipeline produced nothing.');

  // State rate pages are allowed to remain reference-only. A state calculator, however, may only
  // be enabled after its complete arithmetic contract is structured and backed by a primary source.
  const stateEntities = db.prepare(
    `SELECT slug, metadata FROM entities WHERE region = 'US States' OR region = 'US States — Prejudgment'`
  ).all();
  let stateRulesChecked = 0;
  let calculatorReadyStateRules = 0;
  for (const entity of stateEntities) {
    stateRulesChecked++;
    let metadata = null;
    try {
      metadata = entity.metadata ? JSON.parse(entity.metadata) : null;
    } catch {
      errors.push(`${entity.slug}: entity metadata is not valid JSON`);
      continue;
    }
    const result = validateStateCalculationMetadata(metadata);
    if (result.status === 'ready') calculatorReadyStateRules++;
    for (const problem of result.errors) errors.push(`${entity.slug}: ${problem}`);
  }

  for (const r of rows) {
    const tag = `${r.entity_slug}@${r.effective_date}`;
    if (!r.source_url) errors.push(`${tag}: missing source_url`);
    if (!r.retrieved_at) errors.push(`${tag}: missing retrieved_at`);
    if (!r.unit) errors.push(`${tag}: missing unit`);
    if (!isIsoDate(r.effective_date)) errors.push(`${tag}: effective_date not a valid ISO date`);
    const allowedCaseSpecificNull = r.value_numeric === null
      && r.entity_slug === 'mississippi-prejudgment-rate'
      && r.method === 'court-or-contract-rate'
      && String(r.value_text || '').trim() === 'contract rate / court-set';
    if (r.value_numeric === null) {
      if (!allowedCaseSpecificNull) errors.push(`${tag}: value_numeric not finite (${r.value_numeric})`);
    } else if (!Number.isFinite(r.value_numeric)) {
      errors.push(`${tag}: value_numeric not finite (${r.value_numeric})`);
    }
    if (Number.isFinite(r.value_numeric) && r.unit === 'percent_per_annum') {
      if (r.value_numeric < HARD_MIN || r.value_numeric > HARD_MAX) {
        errors.push(`${tag}: rate ${r.value_numeric}% outside hard range [${HARD_MIN}, ${HARD_MAX}]`);
      } else if (r.value_numeric < SOFT_MIN || r.value_numeric > SOFT_MAX) {
        warnings.push(`${tag}: rate ${r.value_numeric}% outside soft range [${SOFT_MIN}, ${SOFT_MAX}]`);
      }
    }
    if (!['high', 'medium', 'low'].includes(r.confidence)) {
      warnings.push(`${tag}: unexpected confidence "${r.confidence}"`);
    }
  }

  // Texas publishes a legally meaningful rate for every judgment month. The curated official table
  // begins in September 1983; a missing month would select the wrong locked rate for that judgment.
  const texasHistory = rows
    .filter((row) => row.entity_slug === 'texas-judgment-rate' && row.source_id === 'tx-occc')
    .map((row) => ({ effective_date: row.effective_date, value: row.value_numeric }));
  if (stateEntities.some((entity) => entity.slug === 'texas-judgment-rate')) {
    for (const problem of validateTexasMonthlyHistory(texasHistory)) {
      errors.push(`texas-judgment-rate: ${problem}`);
    }
    if (!texasHistory.some((point) => point.effective_date === '2026-07-01')) {
      errors.push('texas-judgment-rate: verified baseline must extend through 2026-07-01');
    }
  }
  const texasPostByMonth = new Map(texasHistory.map((point) => [point.effective_date, point.value]));
  for (const row of rows.filter((candidate) => candidate.entity_slug === 'texas-prejudgment-rate')) {
    if (!/^\d{4}-\d{2}-01$/.test(row.effective_date)) {
      errors.push(`texas-prejudgment-rate@${row.effective_date}: effective date must be the OCCC judgment-month start`);
      continue;
    }
    const postRate = texasPostByMonth.get(row.effective_date);
    if (postRate === undefined || Math.abs(postRate - row.value_numeric) > 1e-9) {
      errors.push(`texas-prejudgment-rate@${row.effective_date}: ${row.value_numeric}% does not match the §304.103 postjudgment rate for that judgment month`);
    }
  }

  // Nebraska publishes effective-date change points rather than a daily or monthly schedule. Preserve
  // the court's exact table (including its documented 2001-2002 gap), then allow the live official page
  // to append one new quarterly point at a time.
  const nebraskaHistory = rows
    .filter((row) => row.entity_slug === 'nebraska-judgment-rate' && row.source_id === 'ne-jud')
    .map((row) => ({ effective_date: row.effective_date, value: row.value_numeric }));
  if (stateEntities.some((entity) => entity.slug === 'nebraska-judgment-rate')) {
    for (const problem of validateNebraskaHistory(nebraskaHistory)) {
      errors.push(`nebraska-judgment-rate: ${problem}`);
    }
    if (!nebraskaHistory.some((point) => point.effective_date === '2026-07-16' && Math.abs(point.value - 5.970) < 1e-9)) {
      errors.push('nebraska-judgment-rate: verified baseline must include 5.970% effective 2026-07-16');
    }
  }
  const latestNebraskaPost = [...nebraskaHistory].sort((a, b) => a.effective_date.localeCompare(b.effective_date)).at(-1);
  const latestNebraskaPre = rows
    .filter((row) => row.entity_slug === 'nebraska-prejudgment-rate')
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date))
    .at(-1);
  if (latestNebraskaPost && latestNebraskaPre) {
    if (latestNebraskaPre.effective_date !== latestNebraskaPost.effective_date) {
      errors.push(`nebraska-prejudgment-rate: latest composite point ${latestNebraskaPre.effective_date} does not match current §45-103 point ${latestNebraskaPost.effective_date}`);
    }
    if (Math.abs(latestNebraskaPre.value_numeric - 12) > 1e-9) {
      errors.push(`nebraska-prejudgment-rate: liquidated-claim headline must remain the §45-104 rate of 12%`);
    }
    const expectedVariable = latestNebraskaPost.value.toFixed(3);
    if (!String(latestNebraskaPre.value_text || '').includes(`${expectedVariable}%`)) {
      errors.push(`nebraska-prejudgment-rate: composite display does not include current §45-103 rate ${expectedVariable}%`);
    }
  }

  // Iowa's court-administered selections are monthly. The retired implementation incorrectly
  // copied the federal judgment rate's weekly averages; reject any such row so stale SQLite or
  // exports can never silently bring that model back.
  for (const row of rows.filter((candidate) => candidate.method === 'derived_ia_668_13_weekly_cmt_plus_2')) {
    errors.push(`${row.entity_slug}@${row.effective_date}: legacy weekly Iowa derivation is forbidden`);
  }
  for (const row of rows.filter((candidate) => candidate.source_id === 'ia-h15-provisional')) {
    errors.push(`${row.entity_slug}@${row.effective_date}: retired Iowa H.15 estimate must not coexist with the official court selection`);
  }
  const iowaOfficialHistory = rows
    .filter((row) => row.entity_slug === 'iowa-judgment-rate' && row.source_id === 'ia-jud')
    .map((row) => ({ effective_date: row.effective_date, value: row.value_numeric }));
  if (stateEntities.some((entity) => entity.slug === 'iowa-judgment-rate')) {
    for (const problem of validateIowaOfficialHistory(iowaOfficialHistory)) {
      errors.push(`iowa-judgment-rate: ${problem}`);
    }
  }
  const iowaPost = rows
    .filter((row) => row.entity_slug === 'iowa-judgment-rate')
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const iowaPre = rows
    .filter((row) => row.entity_slug === 'iowa-prejudgment-rate')
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const iowaPostByDate = new Map(iowaPost.map((row) => [row.effective_date, row]));
  for (const row of iowaPre) {
    const post = iowaPostByDate.get(row.effective_date);
    if (!post || Math.abs(post.value_numeric - row.value_numeric) > 1e-9) {
      errors.push(`iowa-prejudgment-rate@${row.effective_date}: rate must match the §668.13 postjudgment selection`);
    }
  }
  const latestIowaPost = iowaPost.at(-1);
  const latestIowaPre = iowaPre.at(-1);
  if (latestIowaPost && latestIowaPre && (
    latestIowaPost.effective_date !== latestIowaPre.effective_date
    || Math.abs(latestIowaPost.value_numeric - latestIowaPre.value_numeric) > 1e-9
  )) {
    errors.push('Iowa post- and prejudgment headlines must use the same §668.13 selection');
  }
  if (latestIowaPost && (latestIowaPost.source_id !== 'ia-jud'
    || latestIowaPost.effective_date !== '2026-07-09'
    || Math.abs(latestIowaPost.value_numeric - 6.06) > 1e-9)) {
    errors.push('iowa-judgment-rate: current official Judicial Branch selection must remain 6.06% effective 2026-07-09');
  }

  // Kentucky's general post-judgment rate changed from 12% to 6% for judgments entered on or
  // after June 29, 2017. Reject the inherited source-review-date placeholder so it cannot reappear
  // as a false legal change point. The prejudgment 8% record is a claim-dependent ceiling/reference,
  // not an automatic award for every claim.
  const kentuckyPost = rows
    .filter((row) => row.entity_slug === 'kentucky-judgment-rate' && row.source_id === 'ky-jud')
    .map((row) => ({ effective_date: row.effective_date, value: row.value_numeric }));
  if (stateEntities.some((entity) => entity.slug === 'kentucky-judgment-rate')) {
    for (const problem of validateKentuckyPostJudgmentHistory(kentuckyPost)) {
      errors.push(`kentucky-judgment-rate: ${problem}`);
    }
  }
  const kentuckyPre = rows.filter((row) => row.entity_slug === 'kentucky-prejudgment-rate');
  if (kentuckyPre.some((row) => row.effective_date === '2026-07-09')) {
    errors.push('kentucky-prejudgment-rate: source-review date 2026-07-09 is not a legal effective date');
  }
  if (kentuckyPre.length && !kentuckyPre.some((row) => (
    row.effective_date === '2018-07-14'
    && Math.abs(row.value_numeric - 8) < 1e-9
    && /up to 8%/i.test(row.value_text || '')
  ))) {
    errors.push('kentucky-prejudgment-rate: current reference must disclose the claim-dependent up-to-8% legal rate effective 2018-07-14');
  }

  // Maine's two court charts share the same annual Treasury index, with a fixed three-point spread
  // between prejudgment (+3) and post-judgment (+6). Preserve every exact chart row and the corrected
  // 2025 values. A later H.15-derived row is allowed only as a labeled provisional future period.
  const maineOfficialPostRows = rows.filter((row) => row.entity_slug === 'maine-judgment-rate' && row.source_id === 'me-jud');
  const maineOfficialPreRows = rows.filter((row) => row.entity_slug === 'maine-prejudgment-rate' && row.source_id === 'me-prejud');
  if (stateEntities.some((entity) => entity.slug === 'maine-judgment-rate')) {
    for (const problem of validateMaineOfficialHistory(
      maineOfficialPostRows.map((row) => ({ effective_date: row.effective_date, value: row.value_numeric })),
      'postjudgment'
    )) errors.push(`maine-judgment-rate: ${problem}`);
  }
  if (stateEntities.some((entity) => entity.slug === 'maine-prejudgment-rate')) {
    for (const problem of validateMaineOfficialHistory(
      maineOfficialPreRows.map((row) => ({ effective_date: row.effective_date, value: row.value_numeric })),
      'prejudgment'
    )) errors.push(`maine-prejudgment-rate: ${problem}`);
  }
  const mainePreByDate = new Map(maineOfficialPreRows.map((row) => [row.effective_date, row.value_numeric]));
  for (const row of maineOfficialPostRows) {
    const pre = mainePreByDate.get(row.effective_date);
    if (pre === undefined || Math.abs(row.value_numeric - pre - 3) > 1e-9) {
      errors.push(`maine-judgment-rate@${row.effective_date}: official post rate must be exactly three points above the prejudgment chart`);
    }
  }
  const maineProvisionalPost = rows.filter((row) => row.entity_slug === 'maine-judgment-rate' && row.source_id === 'me-h15-provisional');
  const maineProvisionalPre = rows.filter((row) => row.entity_slug === 'maine-prejudgment-rate' && row.source_id === 'me-h15-provisional');
  const maineProvisionalPreByDate = new Map(maineProvisionalPre.map((row) => [row.effective_date, row]));
  for (const row of [...maineProvisionalPost, ...maineProvisionalPre]) {
    if (row.effective_date <= MAINE_OFFICIAL_HISTORY_COMPLETE_THROUGH
      || row.confidence !== 'medium'
      || !/provisional_h15$/.test(row.method || '')) {
      errors.push(`${row.entity_slug}@${row.effective_date}: Maine H.15 fallback must be a future, medium-confidence, explicitly provisional point`);
    }
  }
  for (const row of maineProvisionalPost) {
    const pre = maineProvisionalPreByDate.get(row.effective_date);
    if (!pre || Math.abs(row.value_numeric - pre.value_numeric - 3) > 1e-9) {
      errors.push(`maine-judgment-rate@${row.effective_date}: provisional post/pre formula spread is not three points`);
    }
  }
  if (rows.some((row) => row.entity_slug === 'maine-prejudgment-rate' && row.effective_date === '2026-07-09')) {
    errors.push('maine-prejudgment-rate: source-review date 2026-07-09 is not an annual chart effective date');
  }

  // Georgia's 2003-present scheme selects Federal Reserve prime on the legally relevant day and
  // adds three points. Preserve the exact official change-point history, reject the inherited source-
  // review dates, and keep the dual prejudgment display synchronized with the same benchmark.
  const georgiaPostRows = rows.filter((row) => row.entity_slug === 'georgia-judgment-rate' && row.source_id === 'ga-code');
  if (stateEntities.some((entity) => entity.slug === 'georgia-judgment-rate')) {
    for (const problem of validateGeorgiaRateHistory(
      georgiaPostRows.map((row) => ({ effective_date: row.effective_date, value: row.value_numeric }))
    )) errors.push(`georgia-judgment-rate: ${problem}`);
  }
  if (georgiaPostRows.some((row) => row.effective_date === '2026-07-08')) {
    errors.push('georgia-judgment-rate: source-review date 2026-07-08 is not a prime-rate change date');
  }
  const georgiaPostByDate = new Map(georgiaPostRows.map((row) => [row.effective_date, row.value_numeric]));
  const georgiaPreRows = rows.filter((row) => row.entity_slug === 'georgia-prejudgment-rate' && row.source_id === 'ga-prejud');
  if (stateEntities.some((entity) => entity.slug === 'georgia-prejudgment-rate')) {
    if (georgiaPreRows.length !== georgiaPostRows.length) {
      errors.push(`georgia-prejudgment-rate: expected ${georgiaPostRows.length} benchmark periods, found ${georgiaPreRows.length}`);
    }
    for (const row of georgiaPreRows) {
      const formulaRate = georgiaPostByDate.get(row.effective_date);
      if (formulaRate === undefined
        || Math.abs(row.value_numeric - 7) > 1e-9
        || row.value_text !== `7% / ${formulaRate.toFixed(2)}%`) {
        errors.push(`georgia-prejudgment-rate@${row.effective_date}: liquidated 7% and tort prime-plus-three display is inconsistent`);
      }
    }
  }
  if (georgiaPreRows.some((row) => row.effective_date === '2026-07-09')) {
    errors.push('georgia-prejudgment-rate: source-review date 2026-07-09 is not a prime-rate change date');
  }

  // Mississippi §75-17-7 has no universal 8% prejudgment rate. Contract/sale matters use the
  // governing contract rate; other judgments use a rate and fair date selected by the judge. A null
  // numeric value is intentional here and only here, so rankings and calculators cannot misuse 8%.
  const mississippiPre = rows.filter((row) => row.entity_slug === 'mississippi-prejudgment-rate');
  if (stateEntities.some((entity) => entity.slug === 'mississippi-prejudgment-rate')) {
    if (mississippiPre.length !== 1) {
      errors.push(`mississippi-prejudgment-rate: expected one case-specific rule record, found ${mississippiPre.length}`);
    }
    const row = mississippiPre[0];
    if (!row
      || row.effective_date !== '1989-07-01'
      || row.value_numeric !== null
      || row.value_text !== 'contract rate / court-set'
      || row.method !== 'court-or-contract-rate'
      || row.source_id !== 'ms-prejud') {
      errors.push('mississippi-prejudgment-rate: must remain a nonnumeric contract-rate/court-set rule effective 1989-07-01');
    }
  }
  if (mississippiPre.some((row) => row.effective_date === '2026-07-09' || Number.isFinite(row.value_numeric))) {
    errors.push('mississippi-prejudgment-rate: the retired universal 8% review-date record must not reappear');
  }

  // Derived-value consistency: post-judgment must equal the CMT weekly average for each shared week.
  const cmt = new Map(
    rows.filter((r) => r.entity_slug === 'treasury-1-year-cmt').map((r) => [r.effective_date, r.value_numeric])
  );
  const pj = rows.filter((r) => r.entity_slug === 'us-federal-post-judgment');
  let pjChecked = 0;
  for (const r of pj) {
    if (cmt.has(r.effective_date)) {
      pjChecked++;
      if (Math.abs(cmt.get(r.effective_date) - r.value_numeric) > 1e-9) {
        errors.push(
          `post-judgment@${r.effective_date} (${r.value_numeric}%) != CMT weekly avg (${cmt.get(r.effective_date)}%) — derivation broken`
        );
      }
    }
  }

  // Cross-field integrity: every IRS §6621 category is the federal short-term rate + a fixed statutory
  // spread. If a parse grabbed the wrong cell, this catches it. Exact by statute -> hard error on mismatch.
  const IRS_SPREAD = {
    'irs-underpayment': 3,
    'irs-overpayment-noncorporate': 3,
    'irs-overpayment-corporate': 2,
    'irs-large-corporate-underpayment': 5,
    'irs-gatt': 0.5,
  };
  const shortTermByQuarter = new Map(
    rows.filter((r) => r.entity_slug === 'irs-6603-federal-short-term').map((r) => [r.effective_date, r.value_numeric])
  );
  let irsChecked = 0;
  for (const r of rows) {
    const spread = IRS_SPREAD[r.entity_slug];
    if (spread === undefined) continue;
    const s = shortTermByQuarter.get(r.effective_date);
    if (s === undefined) continue;
    irsChecked++;
    if (Math.abs(s + spread - r.value_numeric) > 1e-9) {
      errors.push(
        `${r.entity_slug}@${r.effective_date}: ${r.value_numeric}% != federal short-term ${s}% + ${spread} (§6621) — parse error?`
      );
    }
  }

  // Coverage + staleness per series.
  const coverage = {};
  const bySeries = {};
  for (const r of rows) (bySeries[r.entity_slug] ??= []).push(r);
  for (const [slug, arr] of Object.entries(bySeries)) {
    arr.sort((a, b) => (a.effective_date < b.effective_date ? -1 : 1));
    const latest = arr.at(-1).effective_date;
    const oldest = arr[0].effective_date;
    coverage[slug] = { count: arr.length, oldest, latest };
    const age = daysBetween(today, latest);
    // Cadence buckets decide staleness thresholds:
    //  - weekly federal series (CMT/post-judgment) should be within ~30 days;
    //  - monthly state-administered series (including Iowa) should be within ~45 days;
    //  - periodic series (IRS quarterly, semi-annual UK/EU statutory) a new period appears <=~183 days;
    //  - pure POLICY change-point series (BoE/ECB) can legitimately hold the same value for years, so
    //    an "old" latest change is NOT staleness — skip the effective_date age error for them (a broken
    //    fetch throws an HTTP error and fails the run anyway).
    const WEEKLY = new Set(['treasury-1-year-cmt', 'us-federal-post-judgment']);
    const MONTHLY = new Set(['texas-judgment-rate', 'texas-prejudgment-rate', 'iowa-judgment-rate', 'iowa-prejudgment-rate']);
    const QUARTERLY = new Set(['nebraska-judgment-rate', 'nebraska-prejudgment-rate']);
    const ANNUAL = new Set(['maine-judgment-rate', 'maine-prejudgment-rate']);
    const POLICY_CHANGEPOINT = new Set([
      'boe-bank-rate', 'ecb-main-refinancing-rate',
      'georgia-judgment-rate', 'georgia-prejudgment-rate',
    ]);
    if (POLICY_CHANGEPOINT.has(slug)) continue;
    // Statute-fixed and curated variable state values change only by legislation / periodic agency
    // resets; an old effective_date is not staleness. (Freshness = the re-verification schedule in
    // the MAINTENANCE_RUNBOOK, not this check.)
    if (arr.at(-1).method.startsWith('statute-fixed')
      || arr.at(-1).method === 'statute-variable'
      || arr.at(-1).method === 'court-or-contract-rate') continue;
    const isWeekly = WEEKLY.has(slug);
    const isMonthly = MONTHLY.has(slug);
    const isQuarterly = QUARTERLY.has(slug);
    const isAnnual = ANNUAL.has(slug);
    const warnAge = isWeekly ? 30 : isMonthly ? 45 : isQuarterly ? 130 : isAnnual ? 400 : 200;
    const errAge = isWeekly ? 120 : isMonthly ? 75 : isQuarterly ? 200 : isAnnual ? 550 : 400;
    if (age > errAge) errors.push(`${slug}: freshest observation ${latest} is ${age} days old (> ${errAge}) — likely broken fetch`);
    else if (age > warnAge) warnings.push(`${slug}: freshest observation ${latest} is ${age} days old (> ${warnAge})`);
  }

  const ok = errors.length === 0;
  return { ok, errors, warnings, coverage, totals: { observations: rows.length, series: Object.keys(coverage).length, pjConsistencyChecked: pjChecked, irsSpreadChecked: irsChecked, stateRulesChecked, calculatorReadyStateRules } };
}
