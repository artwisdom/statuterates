// Normalizer: turn raw FRED DGS1 daily H.15 observations into schema records for two rate series:
//   1. treasury-1-year-cmt        — weekly average of daily H.15 (published data; confidence HIGH)
//   2. us-federal-post-judgment   — the federal post-judgment rate per 28 U.S.C. §1961 (DERIVED;
//                                   confidence MEDIUM; the statutory formula + a verify caveat are
//                                   stored in `notes`, and the value is never presented as
//                                   authoritative without them).
//
// Why two series from one number: uscourts.gov publishes NO post-judgment figure — only the formula
// "= weekly average 1-year CMT". Presenting that computed answer IS the product. They are kept
// distinct because they carry different legal meaning, confidence, and search intent; the derivation
// is disclosed transparently in the exported provenance.

export const FED_H15_HISTORY_START_WEEK = '2000-01-03';
// The current weekly-average CMT formula applies to judgments entered on/after 2000-12-21. That
// judgment date looks to the preceding calendar week, beginning Monday 2000-12-11.
export const FEDERAL_PJ_FIRST_SOURCE_WEEK = '2000-12-11';
// `effective_date` on the legal series means the judgment-applicability week, not the underlying
// H.15 source week. The first application period began Monday 2000-12-18, but the calculator keeps
// the statutory 2000-12-21 transition boundary and rejects the first three days of that week.
export const FEDERAL_PJ_FIRST_RATE_WEEK = '2000-12-18';

function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // move back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function averageHundredths(values) {
  // DGS1 is published to hundredths. Average integer hundredths so exact .005 ties use ordinary
  // half-up rounding instead of falling one cent low because of binary floating-point.
  const totalHundredths = values.reduce((sum, value) => sum + Math.round(value * 100), 0);
  return Math.round(totalHundredths / values.length) / 100;
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
      avg: averageHundredths(vals),
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
  metadata: {
    authority: 'Federal Reserve (H.15) via FRED',
    series_id: 'DGS1',
    validation_series_id: 'WGS1YR',
    basis: 'weekly average of daily',
    history_start: FED_H15_HISTORY_START_WEEK,
  },
};

const PJ_ENTITY = {
  slug: 'us-federal-post-judgment',
  name: 'U.S. Federal Post-Judgment Interest Rate (28 U.S.C. §1961)',
  entity_type: 'rate_series',
  jurisdiction: 'US',
  region: 'North America',
  metadata: {
    authority: 'Set by statute (28 U.S.C. §1961); computed from Fed H.15',
    statute: '28 U.S.C. §1961',
    formula_effective_date: '2000-12-21',
    history_start: FEDERAL_PJ_FIRST_RATE_WEEK,
    source_history_start: FEDERAL_PJ_FIRST_SOURCE_WEEK,
    date_semantics: 'judgment-applicability-week-start',
    source_week_offset_days: -7,
    input_series_id: 'DGS1',
    validation_series_id: 'WGS1YR',
  },
};

function postJudgmentNote(sourceWeek, applicabilityWeek) {
  return (
    `Applies to supported judgments in the calendar week beginning ${applicabilityWeek}; derived ` +
    `from the FRED DGS1 weekly average for the preceding source week beginning ${sourceWeek} and ` +
    'independently cross-checked against published WGS1YR. Under 28 U.S.C. §1961, the ' +
    'post-judgment rate uses the weekly-average 1-year Treasury constant-maturity yield for the ' +
    'calendar week preceding the judgment date. The current formula applies only to judgments ' +
    'entered on or after 2000-12-21. Confirm the applicable week against the court table. ' +
    'Reference, not legal advice.'
  );
}

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
    method: 'weekly-avg-of-daily-fred-dgs1-crosschecked-wgs1yr',
    notes:
      `Weekly average of ${w.n} daily FRED DGS1 H.15 1-year CMT observation(s) for the week ` +
      `beginning ${w.week}; independently cross-checked against FRED WGS1YR.`,
  }));
  return { entity: CMT_ENTITY, observations };
}

export function buildPostJudgmentRecords(weeks, { source_id, source_url, retrieved_at }) {
  const observations = weeks
    .filter((w) => w.week >= FEDERAL_PJ_FIRST_SOURCE_WEEK)
    .map((w) => {
      const applicabilityWeek = addDays(w.week, 7);
      return {
        entitySlug: PJ_ENTITY.slug,
        metric: 'annual_rate',
        value_numeric: w.avg,
        value_text: `${w.avg}%`,
        unit: 'percent_per_annum',
        effective_date: applicabilityWeek,
        source_id,
        source_url,
        retrieved_at,
        confidence: 'medium',
        method: 'derived_28usc1961_weekly_avg_h15_1yr_cmt',
        notes: postJudgmentNote(w.week, applicabilityWeek),
      };
    });
  return { entity: PJ_ENTITY, observations };
}
