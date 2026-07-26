// Official Kentucky post-judgment interest history represented by statutory change points.
//
// KRS 360.040 currently states the 6% general rate and records the 2017 amendment's effective
// date. The enrolled 2017 Act shows the prior 12% text and expressly applies the amendment to
// judgments entered on or after June 29, 2017. The curated series begins with the 1982 amendment
// date recorded in the current statute; older law is linked in the statute history but is not
// converted into calculator data without the historical enactments.

export const KENTUCKY_KRS_360_040_URL = 'https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=45719';
export const KENTUCKY_2017_ACT_URL = 'https://apps.legislature.ky.gov/law/acts/17RS/documents/0017.pdf';
export const KENTUCKY_KRS_360_010_URL = 'https://apps.legislature.ky.gov/law/statutes/statute.aspx?id=47989';
export const KENTUCKY_APPELLATE_PREJUDGMENT_URL = 'https://appellatepublic.kycourts.net/api/api/v1/publicaccessdocuments/2d3b5274367f7348db02a0e286f793cef3d6e859562960a3253fa37fe5ea07ea/download';
export const KENTUCKY_HISTORY_VERIFIED_AT = '2026-07-19T00:00:00Z';

const POSTJUDGMENT_CHANGE_POINTS = Object.freeze([
  Object.freeze({
    effective_date: '1982-07-15',
    value: 12,
    value_text: '12%',
    source_url: KENTUCKY_2017_ACT_URL,
  }),
  Object.freeze({
    effective_date: '2017-06-29',
    value: 6,
    value_text: '6%',
    source_url: KENTUCKY_2017_ACT_URL,
  }),
]);

export function buildKentuckyPostJudgmentHistory() {
  return POSTJUDGMENT_CHANGE_POINTS.map((point) => ({ ...point }));
}

export function validateKentuckyPostJudgmentHistory(history) {
  const errors = [];
  const sorted = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  const expected = new Map(POSTJUDGMENT_CHANGE_POINTS.map((point) => [point.effective_date, point.value]));
  const seen = new Set();

  if (sorted.length !== POSTJUDGMENT_CHANGE_POINTS.length) {
    errors.push(`official change-point history must contain ${POSTJUDGMENT_CHANGE_POINTS.length} points, found ${sorted.length}`);
  }
  for (const point of sorted) {
    if (seen.has(point.effective_date)) errors.push(`duplicate date ${point.effective_date}`);
    seen.add(point.effective_date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(point.effective_date)) errors.push(`invalid date ${point.effective_date}`);
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      errors.push(`invalid rate ${point.value} at ${point.effective_date}`);
    }
    if (!expected.has(point.effective_date)) {
      errors.push(`unexpected official-history date ${point.effective_date}`);
    } else if (Math.abs(expected.get(point.effective_date) - point.value) > 1e-9) {
      errors.push(`expected ${expected.get(point.effective_date)}% at ${point.effective_date}`);
    }
  }
  for (const date of expected.keys()) {
    if (!seen.has(date)) errors.push(`missing official change point ${date}`);
  }
  return errors;
}
