// Validation suite. Runs against the loaded SQLite DB AFTER normalize+load and BEFORE export.
// Philosophy: FAIL LOUD. Hard errors throw and abort the run so a broken fetch can never publish
// garbage. Softer issues are warnings (reported, non-fatal). Returns a structured report.
//
// Checks:
//  - provenance completeness: every observation has source_url, retrieved_at, effective_date, unit
//  - type/parse: value_numeric finite; effective_date is a real ISO date
//  - unit sanity ranges: percent_per_annum within [-5, 30] (hard), warn outside [0, 25]
//  - derived-value consistency: us-federal-post-judgment == treasury-1-year-cmt for each shared week
//  - staleness: warn if the freshest observation is old; ERROR if egregiously old (broken fetch)
//  - coverage: per-series counts + date ranges

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

  for (const r of rows) {
    const tag = `${r.entity_slug}@${r.effective_date}`;
    if (!r.source_url) errors.push(`${tag}: missing source_url`);
    if (!r.retrieved_at) errors.push(`${tag}: missing retrieved_at`);
    if (!r.unit) errors.push(`${tag}: missing unit`);
    if (!isIsoDate(r.effective_date)) errors.push(`${tag}: effective_date not a valid ISO date`);
    if (r.value_numeric === null || !Number.isFinite(r.value_numeric)) {
      errors.push(`${tag}: value_numeric not finite (${r.value_numeric})`);
      continue;
    }
    if (r.unit === 'percent_per_annum') {
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
    //  - weekly series (CMT/post-judgment) should be within ~30 days;
    //  - periodic series (IRS quarterly, semi-annual UK/EU statutory) a new period appears <=~183 days;
    //  - pure POLICY change-point series (BoE/ECB) can legitimately hold the same value for years, so
    //    an "old" latest change is NOT staleness — skip the effective_date age error for them (a broken
    //    fetch throws an HTTP error and fails the run anyway).
    const WEEKLY = new Set(['treasury-1-year-cmt', 'us-federal-post-judgment', 'iowa-judgment-rate']);
    const POLICY_CHANGEPOINT = new Set(['boe-bank-rate', 'ecb-main-refinancing-rate']);
    if (POLICY_CHANGEPOINT.has(slug)) continue;
    // Statute-fixed and curated variable state values change only by legislation / periodic agency
    // resets; an old effective_date is not staleness. (Freshness = the re-verification schedule in
    // the MAINTENANCE_RUNBOOK, not this check.)
    if (arr.at(-1).method === 'statute-fixed' || arr.at(-1).method === 'statute-variable') continue;
    const isWeekly = WEEKLY.has(slug);
    const warnAge = isWeekly ? 30 : 200;
    const errAge = isWeekly ? 120 : 400;
    if (age > errAge) errors.push(`${slug}: freshest observation ${latest} is ${age} days old (> ${errAge}) — likely broken fetch`);
    else if (age > warnAge) warnings.push(`${slug}: freshest observation ${latest} is ${age} days old (> ${warnAge})`);
  }

  const ok = errors.length === 0;
  return { ok, errors, warnings, coverage, totals: { observations: rows.length, series: Object.keys(coverage).length, pjConsistencyChecked: pjChecked, irsSpreadChecked: irsChecked } };
}
