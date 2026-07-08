// Normalizer: turn raw H.15 daily 1-year CMT observations into schema records for two rate series:
//   1. treasury-1-year-cmt        — weekly average of daily H.15 (published data; confidence HIGH)
//   2. us-federal-post-judgment   — the federal post-judgment rate per 28 U.S.C. §1961 (DERIVED;
//                                   confidence MEDIUM; the statutory formula + a verify caveat are
//                                   stored in `notes`, and the value is never presented as
//                                   authoritative without them).
//
// Why two series from one number: uscourts.gov publishes NO post-judgment figure — only the formula
// "= weekly average 1-year CMT". Presenting that computed answer IS the product. They are kept
// distinct because they carry different legal meaning, confidence, and search intent; the derivation
// is disclosed transparently (here and in EXECUTION_REPORT.md).

function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // move back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Group daily observations into Mon–Fri weekly averages. */
export function buildWeeklyAverages(daily) {
  const byWeek = new Map();
  for (const { date, value } of daily) {
    const wk = mondayOf(date);
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk).push(value);
  }
  const weeks = [...byWeek.entries()]
    .map(([week, vals]) => ({
      week,
      avg: round2(vals.reduce((a, b) => a + b, 0) / vals.length),
      n: vals.length,
    }))
    .sort((a, b) => (a.week < b.week ? -1 : 1));
  return weeks;
}

const CMT_ENTITY = {
  slug: 'treasury-1-year-cmt',
  name: '1-Year Treasury Constant Maturity Yield (weekly average)',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'North America',
  metadata: { authority: 'Federal Reserve (H.15)', series_id: 'RIFLGFCY01', basis: 'weekly average of daily' },
};

const PJ_ENTITY = {
  slug: 'us-federal-post-judgment',
  name: 'U.S. Federal Post-Judgment Interest Rate (28 U.S.C. §1961)',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'North America',
  metadata: { authority: 'Set by statute (28 U.S.C. §1961); computed from Fed H.15', statute: '28 U.S.C. §1961' },
};

const PJ_NOTE =
  'Derived: equals the weekly-average 1-year Treasury constant-maturity yield (Fed H.15) for the week. ' +
  'Under 28 U.S.C. §1961, the post-judgment rate for a judgment is the weekly-average 1-year CMT for the ' +
  'calendar week PRECEDING the judgment date, rounded per the statute. Confirm the exact applicable week ' +
  'against your district court’s published table. Reference, not legal advice.';

export function buildCmtRecords(weeks, { source_id, source_url, retrieved_at }) {
  const observations = weeks.map((w) => ({
    entitySlug: CMT_ENTITY.slug,
    metric: 'annual_rate',
    value_numeric: w.avg,
    value_text: `${w.avg}%`,
    unit: 'percent_per_annum',
    effective_date: w.week,
    source_id,
    source_url,
    retrieved_at,
    confidence: 'high',
    method: 'weekly-avg-of-daily-h15',
    notes: `Weekly average of ${w.n} daily H.15 1-year CMT observation(s) for the week beginning ${w.week}.`,
  }));
  return { entity: CMT_ENTITY, observations };
}

export function buildPostJudgmentRecords(weeks, { source_id, source_url, retrieved_at }) {
  const observations = weeks.map((w) => ({
    entitySlug: PJ_ENTITY.slug,
    metric: 'annual_rate',
    value_numeric: w.avg,
    value_text: `${w.avg}%`,
    unit: 'percent_per_annum',
    effective_date: w.week,
    source_id,
    source_url,
    retrieved_at,
    confidence: 'medium',
    method: 'derived_28usc1961_weekly_avg_h15_1yr_cmt',
    notes: PJ_NOTE,
  }));
  return { entity: PJ_ENTITY, observations };
}
