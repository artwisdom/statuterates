// Code-controlled release registry for the reference-only historical rate lookup.
//
// A multi-row dataset is not enough to enter this registry. Each released series must also have a
// reviewed date-selection meaning, an explicit coverage boundary, and branch language that prevents
// a historical observation from being mistaken for a complete payoff calculation.

const freezeRelease = (release) => Object.freeze({
  metric: 'annual_rate',
  gaps: Object.freeze([]),
  ...release,
  gaps: Object.freeze((release.gaps || []).map((gap) => Object.freeze({ ...gap }))),
});

export const HISTORICAL_RATE_RELEASES = Object.freeze([
  freezeRelease({
    entitySlug: 'alaska-judgment-rate',
    label: 'Alaska judgment interest',
    inputMeaning: 'Judgment-entry year',
    branchScope: 'General Alaska AS 09.30.070(a) judgment series; a controlling contract and other statutory branches can differ.',
    selectionRule: 'The Alaska Court System annual rate selected by the year judgment is entered.',
    coverageNote: 'The official ADM-505 history begins August 1997.',
    coverageEndKind: 'calendar-year',
  }),
  freezeRelease({
    entitySlug: 'florida-judgment-rate',
    label: 'Florida judgment interest schedule',
    inputMeaning: 'Rate-period date',
    branchScope: 'Ordinary Florida §55.03 schedule; contracts, specified clerk-entered judgments, payments, added amounts, and other branches can differ.',
    selectionRule: 'The CFO rate assigned to the selected calendar quarter. A payoff can later adjust each January 1, so this lookup does not calculate a Florida balance.',
    coverageNote: 'The official CFO quarterly table begins October 1981.',
    coverageEndKind: 'calendar-quarter',
  }),
  freezeRelease({
    entitySlug: 'georgia-judgment-rate',
    label: 'Georgia post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General O.C.G.A. §7-4-12(a) branch derived from Federal Reserve prime plus three points; a written contract can control instead.',
    selectionRule: 'The recorded Federal Reserve prime change point in effect when judgment is entered, plus the statutory three-point addition.',
    coverageNote: 'The modern statutory series begins July 2003 and uses official Federal Reserve benchmark observations.',
    coverageEndKind: 'source-check',
  }),
  freezeRelease({
    entitySlug: 'idaho-judgment-rate',
    label: 'Idaho post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Idaho Code §28-22-104(2) judgment series; this lookup does not decide accrual, payments, compounding, or a special judgment path.',
    selectionRule: 'The State Treasurer fiscal-year selection in effect when judgment is entered.',
    coverageNote: 'The complete official fiscal-year table begins July 1986.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'iowa-judgment-rate',
    label: 'Iowa post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Iowa §668.13 court-table series; qualifying contract and separate statutory branches can differ.',
    selectionRule: 'The Iowa Judicial Branch table selection in effect when judgment is entered.',
    coverageNote: 'Digitized Judicial Branch selections begin March 2001.',
    coverageEndKind: 'source-check',
  }),
  freezeRelease({
    entitySlug: 'kentucky-judgment-rate',
    label: 'Kentucky post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Kentucky KRS 360.040 branch; child-support, written-obligation, and court-adjusted unliquidated-damages branches can differ.',
    selectionRule: 'The general statutory change point in effect when judgment is entered.',
    coverageNote: 'The verified general statutory series begins July 1982 and includes the June 2017 transition.',
    coverageEndKind: 'source-check',
  }),
  freezeRelease({
    entitySlug: 'louisiana-judgment-rate',
    label: 'Louisiana judicial interest',
    inputMeaning: 'Accrual calendar date',
    branchScope: 'General Louisiana judicial-interest schedule; contract, government, claim-specific, and special statutory branches can differ.',
    selectionRule: 'The official OFI rate for the selected calendar year. The general schedule can reset as a judgment remains unpaid.',
    coverageNote: 'The dated official OFI table begins September 12, 1980; the earlier undated 7% row is intentionally excluded.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'maine-judgment-rate',
    label: 'Maine post-judgment interest',
    inputMeaning: 'Post-judgment start year',
    branchScope: 'General Maine §1602-C post-judgment series; written contract, note, and other statutory branches can differ.',
    selectionRule: 'The annual Maine rate for the calendar year in which post-judgment interest begins.',
    coverageNote: 'The complete Judicial Branch chart begins July 2003.',
    coverageEndKind: 'calendar-year',
  }),
  freezeRelease({
    entitySlug: 'michigan-judgment-rate',
    label: 'Michigan general certificate rate',
    inputMeaning: 'Certificate-period reference date',
    branchScope: 'General MCL 600.6013(8) certificate series; complaint-vintage, written-instrument, tort-offer, medical-malpractice, and other branches can differ.',
    selectionRule: 'The January-or-July Michigan Treasurer certificate period containing the selected date. This does not apply the complaint-filing intervals or calculate a payoff.',
    coverageNote: 'The official five-year Treasury benchmark-plus-one series begins January 1987.',
    coverageEndKind: 'calendar-half',
  }),
  freezeRelease({
    entitySlug: 'minnesota-judgment-rate',
    label: 'Minnesota judgment interest branches',
    inputMeaning: 'Rate-schedule reference date',
    branchScope: 'Shows the official general annual schedule and, from August 1, 2009, the separate qualifying-over-$50,000 10% branch. The general branch uses the accrual calendar year; 10% eligibility depends on the judgment-entry date and statutory exclusions. Child-support, family-court, public-party, tax, condemnation, arbitration, and other branches require separate review.',
    selectionRule: 'The official Minnesota schedule containing the selected date. The displayed pair preserves both published schedules: the general percentage follows the accrual year, while the 10% branch applies only to qualifying judgments entered on or after August 1, 2009 and remains fixed until paid. This lookup does not decide eligibility.',
    coverageNote: 'The machine-verified official schedule begins January 1990; earlier linked material is not inferred into this lookup.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'nebraska-judgment-rate',
    label: 'Nebraska post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Nebraska §§45-103 and 45-103.01 series; another law or an agreed contract rate can control.',
    selectionRule: 'The official rate in effect when judgment is entered.',
    coverageNote: 'The official table begins January 1987, with a documented publication gap from March 14, 2001 through July 19, 2002.',
    coverageEndKind: 'source-check',
    gaps: [{
      start: '2001-03-14',
      end: '2002-07-19',
      reason: 'The official Nebraska table has no verified observation covering this interval.',
    }],
  }),
  freezeRelease({
    entitySlug: 'nevada-judgment-rate',
    label: 'Nevada judgment interest schedule',
    inputMeaning: 'Accrual calendar date',
    branchScope: 'General NRS 17.130 prime-plus-two schedule; a lawful contract, another law, the judgment, consumer-form debt, future damages, and other branches can differ. The 1987 formula applies only to causes of action arising on or after July 1, 1987.',
    selectionRule: 'The official Nevada FID semiannual period containing the selected date. The general rate resets each January 1 and July 1 while unpaid.',
    coverageNote: 'The verified numerical FID schedule begins July 1987; the January 1987 official row is marked unavailable and is not inferred.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'new-jersey-judgment-rate',
    label: 'New Jersey judgment interest tiers',
    inputMeaning: 'Accrual calendar date',
    branchScope: 'Shows the official base rate and, from September 1, 1996, the base-plus-two-point branch. Historical Special Civil Part limits are incomplete, so this lookup never chooses a tier.',
    selectionRule: 'The annual Rule 4:42-11 schedule in effect for the selected date; the displayed pair is not a marginal bracket.',
    coverageNote: 'The dated official court schedule begins April 1975; historical monetary limits require separate confirmation.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'new-york-consumer-debt-judgment-rate',
    label: 'New York consumer-debt judgment interest',
    inputMeaning: 'Interest-accrual date',
    branchScope: 'Only the covered consumer-debt branch against a natural person. Claim classification, defendant type, and other statutes must be confirmed.',
    selectionRule: 'The recorded 9% general period before April 30, 2022 and the 2% covered consumer-debt period beginning that date.',
    coverageNote: 'The recorded branch history begins with the general 9% period in June 1981.',
    coverageEndKind: 'source-check',
  }),
  freezeRelease({
    entitySlug: 'north-dakota-judgment-rate',
    label: 'North Dakota judgment interest',
    inputMeaning: 'Accrual calendar date',
    branchScope: 'General post-2005 North Dakota statutory path; a rate in the original instrument and special judgments can differ.',
    selectionRule: 'The official annual rate for the selected calendar date. Post-2005 statutory rates can change by calendar year rather than remaining locked at entry.',
    coverageNote: 'The complete official post-2005 table begins January 2006.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'oklahoma-judgment-rate',
    label: 'Oklahoma post-judgment interest',
    inputMeaning: 'Accrual calendar date',
    branchScope: 'Official Oklahoma general post-judgment schedule across the predecessor §727 regimes and current 12 O.S. §727.1. Contract, government-liability, costs-and-fees, older-judgment transition, and more specific statutory branches can differ.',
    selectionRule: 'The official Administrative Director-published rate for the selected period, calculated under the statute then in effect. Under current §727.1, a covered unpaid judgment reprices each January 1 and previously accrued post-judgment interest joins the interest-bearing balance; this lookup does not back-apply that method to earlier regimes.',
    coverageNote: 'The official published schedule begins November 1, 1986. Distinct 2013 legal periods are preserved as regime metadata without inventing duplicate rate changes.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'tennessee-judgment-rate',
    label: 'Tennessee post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Tennessee §47-14-121 judgment series; a statute, note, contract, or other qualifying writing can fix a different rate.',
    selectionRule: 'The Tennessee AOC six-month rate in effect when judgment is entered. That selected rate remains fixed for the judgment; this lookup does not decide the separate accrual date or calculate a payoff.',
    coverageNote: 'The complete official AOC history begins July 1, 2012.',
    coverageEndKind: 'calendar-half',
  }),
  freezeRelease({
    entitySlug: 'texas-judgment-rate',
    label: 'Texas post-judgment interest',
    inputMeaning: 'Judgment-entry month',
    branchScope: 'General noncontract Texas money-judgment series; contract, tax, child-support, and other branches can differ.',
    selectionRule: 'The OCCC rate assigned to the calendar month in which judgment is rendered.',
    coverageNote: 'Monthly OCCC history begins September 1983.',
    coverageEndKind: 'calendar-month',
  }),
  freezeRelease({
    entitySlug: 'utah-judgment-rate',
    label: 'Utah post-judgment interest',
    inputMeaning: 'Judgment-entry year',
    branchScope: 'General Utah civil and criminal judgment series; qualifying under-$10,000 goods/services and contract branches can differ.',
    selectionRule: 'The Utah Courts annual rate for the calendar year judgment is entered.',
    coverageNote: 'The complete official annual table begins January 1993.',
    coverageEndKind: 'calendar-year',
  }),
  freezeRelease({
    entitySlug: 'west-virginia-judgment-rate',
    label: 'West Virginia judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General West Virginia §56-6-31 judgment series; contract and special judgment branches can differ.',
    selectionRule: 'The Supreme Court of Appeals annual rate in effect when judgment is entered; that rate remains fixed for the judgment.',
    coverageNote: 'The verified signed annual-order series begins January 2007.',
    coverageEndKind: 'metadata-end',
  }),
  freezeRelease({
    entitySlug: 'wisconsin-judgment-rate',
    label: 'Wisconsin post-judgment interest',
    inputMeaning: 'Judgment-entry date',
    branchScope: 'General Wis. Stat. §815.05(8) schedule; §807.01(4), another statute, or separate prejudgment rules can supersede or supplement it.',
    selectionRule: 'The official January-or-July rate attached when judgment is entered; that selected rate remains attached until the judgment is paid.',
    coverageNote: 'The machine-safe official history begins December 2, 2011; the former 12% rule is not assigned an invented start date.',
    coverageEndKind: 'metadata-end',
  }),
]);

const RELEASE_BY_SLUG = new Map(HISTORICAL_RATE_RELEASES.map((release) => [release.entitySlug, release]));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const APPROVED_HISTORICAL_RATE_SLUGS = Object.freeze(
  HISTORICAL_RATE_RELEASES.map((release) => release.entitySlug),
);

export function historicalRateReleaseForEntitySlug(entitySlug) {
  return RELEASE_BY_SLUG.get(String(entitySlug || '')) || null;
}

function assertIsoDate(value, label) {
  if (!ISO_DATE.test(String(value))) throw new Error(`${label} must use YYYY-MM-DD.`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid calendar date.`);
  }
}

function endOfMonth(effectiveDate, monthsToAdvance = 1) {
  const date = new Date(`${effectiveDate}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + monthsToAdvance, 0))
    .toISOString().slice(0, 10);
}

function coverageEndFor(release, entity, latest, sourceRecords) {
  const effectiveDate = latest.effective_date;
  if (release.coverageEndKind === 'calendar-year') return `${effectiveDate.slice(0, 4)}-12-31`;
  if (release.coverageEndKind === 'calendar-month') return endOfMonth(effectiveDate, 1);
  if (release.coverageEndKind === 'calendar-quarter') return endOfMonth(effectiveDate, 3);
  if (release.coverageEndKind === 'calendar-half') return endOfMonth(effectiveDate, 6);
  if (release.coverageEndKind === 'source-check') {
    const sourceId = release.coverageSourceId || latest.source_id;
    const source = (sourceRecords || []).find((record) => record?.id === sourceId);
    const checkedOn = String(source?.retrieved_at || '').slice(0, 10);
    if (!checkedOn) {
      throw new Error(`${release.entitySlug}: successful source-check receipt ${sourceId || '(missing source id)'} is unavailable.`);
    }
    return checkedOn;
  }
  if (release.coverageEndKind === 'metadata-end') {
    return String(entity?.metadata?.calculation?.curated_history_complete_through || '').slice(0, 10);
  }
  throw new Error(`${release.entitySlug}: unsupported historical coverage-end rule.`);
}

function normalizedHistory(entity, release, snapshotDate) {
  const history = entity?.history?.[release.metric];
  if (!Array.isArray(history) || history.length < 2) {
    throw new Error(`${release.entitySlug}: released historical lookup requires at least two observations.`);
  }
  const points = history
    .filter((point) => String(point?.effective_date || '') <= snapshotDate)
    .map((point) => ({ ...point, effective_date: String(point?.effective_date || '') }))
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const dates = new Set();
  for (const point of points) {
    assertIsoDate(point.effective_date, `${release.entitySlug} observation date`);
    if (dates.has(point.effective_date)) throw new Error(`${release.entitySlug}: duplicate historical date ${point.effective_date}.`);
    dates.add(point.effective_date);
    if (!Number.isFinite(point.value)) throw new Error(`${release.entitySlug}: historical value is not numeric.`);
    if (!String(point.source_url || '').startsWith('https://')) {
      throw new Error(`${release.entitySlug}: every historical observation requires HTTPS provenance.`);
    }
  }
  if (points.length < 2) throw new Error(`${release.entitySlug}: fewer than two observations are effective at the dataset snapshot.`);
  return points;
}

function normalizedOfficialAuthorities(entity) {
  const metadata = entity?.metadata || {};
  const authorities = [];
  const add = (label, url) => {
    if (!String(url || '').startsWith('https://') || authorities.some((item) => item.url === url)) return;
    authorities.push({ label: String(label || 'Official governing authority'), url });
  };
  for (const authority of metadata.official_authorities || []) {
    add(authority?.label, authority?.url);
  }
  add(metadata.statute ? `${metadata.statute} — official text` : 'Official governing statute or rule', metadata.official_statute_url);
  for (const authority of metadata.official_statute_urls || []) {
    if (typeof authority === 'string') {
      add(metadata.statute ? `${metadata.statute} — official text` : 'Official governing statute or rule', authority);
    } else {
      add(authority?.label, authority?.url);
    }
  }
  add('Official enactment or amendment', metadata.official_act_url);
  return authorities;
}

export function historicalRateSeriesForEntity(entity, snapshotDate, { sources = [] } = {}) {
  const release = historicalRateReleaseForEntitySlug(entity?.slug);
  if (!release) return null;
  assertIsoDate(snapshotDate, 'Dataset snapshot date');
  const history = normalizedHistory(entity, release, snapshotDate);
  const latest = history.at(-1);
  const rawCoverageEnd = coverageEndFor(release, entity, latest, sources);
  assertIsoDate(rawCoverageEnd, `${release.entitySlug} verified coverage end`);
  if (rawCoverageEnd < latest.effective_date) {
    throw new Error(`${release.entitySlug}: verified coverage ends before its latest observation.`);
  }
  const maxDate = rawCoverageEnd < snapshotDate ? rawCoverageEnd : snapshotDate;
  const minDate = history[0].effective_date;
  for (const gap of release.gaps) {
    assertIsoDate(gap.start, `${release.entitySlug} gap start`);
    assertIsoDate(gap.end, `${release.entitySlug} gap end`);
    if (gap.end < gap.start) throw new Error(`${release.entitySlug}: historical gap ends before it starts.`);
  }
  return Object.freeze({
    ...release,
    history: Object.freeze(history.map((point) => Object.freeze({ ...point }))),
    minDate,
    maxDate,
    coverageThrough: maxDate,
    historyCount: history.length,
    sourceUrl: latest.source_url,
    officialAuthorities: Object.freeze(normalizedOfficialAuthorities(entity).map((authority) => Object.freeze({ ...authority }))),
  });
}

export function historicalRateAtDate(history, date, { coverageThrough, gaps = [] } = {}) {
  assertIsoDate(date, 'Lookup date');
  assertIsoDate(coverageThrough, 'Verified coverage end');
  if (date > coverageThrough) throw new Error(`Verified coverage ends ${coverageThrough}.`);
  for (const gap of gaps || []) {
    assertIsoDate(gap.start, 'Coverage gap start');
    assertIsoDate(gap.end, 'Coverage gap end');
    if (date >= gap.start && date <= gap.end) {
      throw new Error(gap.reason || `No verified coverage is released from ${gap.start} through ${gap.end}.`);
    }
  }
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error('No verified history is available for this series.');
  }
  const points = history
    .map((point) => ({ ...point, effective_date: String(point?.effective_date || '') }))
    .filter((point) => ISO_DATE.test(point.effective_date))
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (!points.length) throw new Error('No dated observations are available for this series.');
  if (date < points[0].effective_date) throw new Error(`Verified coverage begins ${points[0].effective_date}.`);
  let selected = null;
  for (const point of points) {
    if (point.effective_date > date) break;
    selected = point;
  }
  if (!selected) throw new Error('No recorded rate covers that date.');
  return selected;
}

export function releasedHistoricalValue(entity, date, snapshotDate, options = {}) {
  const series = historicalRateSeriesForEntity(entity, snapshotDate, options);
  if (!series) throw new Error(`Historical lookup is not released for ${entity?.slug || 'that series'}.`);
  const observation = historicalRateAtDate(series.history, date, {
    coverageThrough: series.maxDate,
    gaps: series.gaps,
  });
  return Object.freeze({ series, observation });
}
