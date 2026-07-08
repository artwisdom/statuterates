// Normalizers for the UK and EU rate series.
//
// Two subtleties handled correctly here (and that generic aggregators get wrong):
//   - UK statutory late-payment interest (Late Payment of Commercial Debts (Interest) Act 1998) is
//     FIXED for six-month periods at the Bank of England base rate in force on the reference date
//     (31 Dec for Jan–Jun; 30 Jun for Jul–Dec) PLUS 8 percentage points — not the live base rate.
//   - EU Late Payment Directive 2011/7/EU reference rate is the ECB Main Refinancing rate in force on
//     the FIRST calendar day of the half-year (1 Jan / 1 Jul); the statutory rate is that reference
//     PLUS at least 8pp, with the exact margin set per member state (floor 8; e.g. FR +10, DE +9).

function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Value in force on `iso` given change-points sorted ascending; null if before the first point. */
export function valueOnDate(points, iso) {
  let val = null;
  for (const p of points) {
    if (p.date <= iso) val = p.value;
    else break;
  }
  return val;
}

/** Half-year periods (H1 starts YYYY-01-01, H2 starts YYYY-07-01) up to and including `today`. */
export function halfYearPeriods(startYear, today) {
  const endYear = Number(today.slice(0, 4));
  const periods = [];
  for (let y = startYear; y <= endYear; y++) {
    for (const [half, start] of [[1, `${y}-01-01`], [2, `${y}-07-01`]]) {
      if (start <= today) periods.push({ year: y, half, start });
    }
  }
  return periods;
}

/** Published series: one observation per change-point (confidence high). */
export function buildPublishedSeries(changePoints, entity, { source_id, source_url, retrieved_at, label }) {
  const observations = changePoints.map((p) => ({
    entitySlug: entity.slug,
    metric: 'annual_rate',
    value_numeric: p.value,
    value_text: `${p.value}%`,
    unit: 'percent_per_annum',
    effective_date: p.date,
    source_id,
    source_url,
    retrieved_at,
    confidence: 'high',
    method: 'official-csv-changepoint',
    notes: `${label} effective ${p.date} (official published value).`,
  }));
  return { entity, observations };
}

const UK_LPA_ENTITY = {
  slug: 'uk-late-payment-commercial',
  name: 'UK Statutory Interest on Late Commercial Payments',
  entity_type: 'rate_series',
  jurisdiction: 'GB',
  region: 'United Kingdom',
  metadata: { authority: 'Late Payment of Commercial Debts (Interest) Act 1998', basis: 'BoE base rate on reference date + 8pp' },
};

const UK_NOTE = (refDate, base) =>
  `Derived: UK statutory interest on late commercial (B2B) debts = the Bank of England base rate in ` +
  `force on the reference date (${refDate}: ${base}%) + 8 percentage points, fixed for this six-month ` +
  `period under the Late Payment of Commercial Debts (Interest) Act 1998. Reference, not legal advice.`;

export function buildUkLatePayment(bankRateChangePoints, { source_id, source_url, retrieved_at, today }) {
  const startYear = Number(bankRateChangePoints[0].date.slice(0, 4));
  const observations = [];
  for (const p of halfYearPeriods(startYear, today)) {
    const refDate = p.half === 1 ? `${p.year - 1}-12-31` : `${p.year}-06-30`;
    const base = valueOnDate(bankRateChangePoints, refDate);
    if (base === null) continue;
    const value = round2(base + 8);
    observations.push({
      entitySlug: UK_LPA_ENTITY.slug,
      metric: 'annual_rate',
      value_numeric: value,
      value_text: `${value}%`,
      unit: 'percent_per_annum',
      effective_date: p.start,
      source_id,
      source_url,
      retrieved_at,
      confidence: 'medium',
      method: 'derived_uk_lpa1998_baserate_plus_8',
      notes: UK_NOTE(refDate, base),
    });
  }
  return { entity: UK_LPA_ENTITY, observations };
}

const EU_REF_ENTITY = {
  slug: 'eu-late-payment-reference',
  name: 'EU Late Payment Directive Reference Rate',
  entity_type: 'rate_series',
  jurisdiction: 'EU',
  region: 'European Union',
  metadata: { authority: 'Directive 2011/7/EU', basis: 'ECB main refinancing rate on first day of half-year' },
};

const EU_NOTE = (refDate, ref) =>
  `Derived: EU Late Payment Directive (2011/7/EU) reference rate = the ECB main refinancing rate in ` +
  `force on the first calendar day of the half-year (${refDate}: ${ref}%). A member state's statutory ` +
  `late-payment rate is this reference + at least 8 percentage points (e.g. ${round2(ref + 8)}% at the ` +
  `8pp floor; some states add more — France +10, Germany +9). Reference, not legal advice.`;

export function buildEuReference(ecbChangePoints, { source_id, source_url, retrieved_at, today }) {
  const startYear = Number(ecbChangePoints[0].date.slice(0, 4));
  const observations = [];
  for (const p of halfYearPeriods(startYear, today)) {
    const ref = valueOnDate(ecbChangePoints, p.start); // reference date == first day of the half-year
    if (ref === null) continue;
    observations.push({
      entitySlug: EU_REF_ENTITY.slug,
      metric: 'annual_rate',
      value_numeric: ref,
      value_text: `${ref}%`,
      unit: 'percent_per_annum',
      effective_date: p.start,
      source_id,
      source_url,
      retrieved_at,
      confidence: 'medium',
      method: 'derived_eu_directive_2011_7_reference',
      notes: EU_NOTE(p.start, ref),
    });
  }
  return { entity: EU_REF_ENTITY, observations };
}
