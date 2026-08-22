const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertIsoDate(value, label) {
  if (!ISO_DATE.test(String(value))) throw new Error(`${label} must use YYYY-MM-DD.`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid calendar date.`);
  }
}

// Return the newest recorded period that began on or before the requested date. The caller must
// still enforce its reviewed coverage end; this helper deliberately refuses dates before the first
// observation instead of silently borrowing a later or current rate.
export function historicalRateAtDate(history, date, { coverageThrough } = {}) {
  assertIsoDate(date, 'Lookup date');
  assertIsoDate(coverageThrough, 'Verified coverage end');
  if (date > coverageThrough) {
    throw new Error(`Verified coverage ends ${coverageThrough}.`);
  }
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error('No verified history is available for this series.');
  }

  const points = history
    .map((point) => ({ ...point, effective_date: String(point?.effective_date || '') }))
    .filter((point) => ISO_DATE.test(point.effective_date))
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (!points.length) throw new Error('No dated observations are available for this series.');
  if (date < points[0].effective_date) {
    throw new Error(`Verified coverage begins ${points[0].effective_date}.`);
  }

  let selected = null;
  for (const point of points) {
    if (point.effective_date > date) break;
    selected = point;
  }
  if (!selected) throw new Error('No recorded rate covers that date.');
  return selected;
}
