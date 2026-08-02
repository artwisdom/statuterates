// One deterministic definition of "current" for every human and machine surface.
//
// Agencies sometimes publish the next quarter's value before its effective date. The newest
// published observation is useful, but it is not necessarily in force yet. Callers that describe a
// value as current must select the newest observation effective on or before the dataset snapshot.

function normalizeDate(value, label) {
  const date = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${label} must contain an ISO date`);
  }
  return date;
}

export function currentObservationForMetric(entity, metric, asOfDate) {
  const asOf = normalizeDate(asOfDate || entity?.generated_at, 'Current-value as-of date');
  const history = Array.isArray(entity?.history?.[metric]) ? entity.history[metric] : [];
  const current = history
    .filter((observation) => {
      const effectiveDate = String(observation?.effective_date || '');
      return /^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) && effectiveDate <= asOf;
    })
    .sort((a, b) => (
      a.effective_date.localeCompare(b.effective_date)
      || String(a.retrieved_at || '').localeCompare(String(b.retrieved_at || ''))
    ))
    .at(-1);

  if (current) return current;

  // Legacy snapshots can lack history. Preserve that compatibility only when the single published
  // value is already in force; never use the fallback to promote a future observation.
  if (history.length === 0) {
    const published = entity?.latest_published?.[metric] || entity?.latest?.[metric] || null;
    if (published?.effective_date && published.effective_date <= asOf) return published;
  }
  return null;
}

export function currentValuesOf(entity, asOfDate) {
  const published = entity?.latest_published || entity?.latest || {};
  const metrics = new Set([
    ...Object.keys(entity?.history || {}),
    ...Object.keys(published),
  ]);
  return Object.fromEntries(
    [...metrics]
      .map((metric) => [metric, currentObservationForMetric(entity, metric, asOfDate)])
      .filter(([, observation]) => observation),
  );
}

export function withCurrentValues(entity, asOfDate) {
  const asOf = normalizeDate(asOfDate || entity?.generated_at, 'Current-value as-of date');
  const latestPublished = entity?.latest_published || entity?.latest || {};
  const current = currentValuesOf({ ...entity, latest_published: latestPublished }, asOf);
  return {
    ...entity,
    // Keep `latest` as a backwards-compatible alias for the value currently in force. Before
    // future-dated observations existed, that was the API's documented meaning.
    latest: current,
    current,
    latest_published: latestPublished,
    current_as_of: asOf,
  };
}
