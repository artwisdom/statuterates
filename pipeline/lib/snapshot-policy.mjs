// Snapshot replacement is intentionally narrower than ordinary upsert loading.
//
// A source that returns its complete authoritative history may replace the prior entity snapshot.
// A current-value-only source must merge instead, or its next observation would erase previously
// learned months/quarters. A monitored source outage must also leave the committed entity and its
// metadata untouched rather than rebuilding an older hardcoded baseline over it.

const MONITORED_STATE_ENTITIES = Object.freeze({
  alaskaCourt: Object.freeze([
    'alaska-judgment-rate',
    'alaska-prejudgment-rate',
  ]),
  floridaCfo: Object.freeze([
    'florida-judgment-rate',
    'florida-prejudgment-rate',
  ]),
  iowaCourt: Object.freeze([
    'iowa-judgment-rate',
    'iowa-prejudgment-rate',
  ]),
  utahCourt: Object.freeze([
    'utah-judgment-rate',
    'utah-prejudgment-rate',
  ]),
});

const COMPLETE_STATE_SNAPSHOT_ENTITIES = Object.freeze({
  ...MONITORED_STATE_ENTITIES,
  georgiaPrime: Object.freeze([
    'georgia-judgment-rate',
    'georgia-prejudgment-rate',
  ]),
});

function hasCompleteSnapshot(key, result) {
  if (!result) return false;
  if (key === 'alaskaCourt') return Array.isArray(result.historyPoints) && result.historyPoints.length > 0;
  if (key === 'floridaCfo') return Array.isArray(result.points) && result.points.length > 0;
  if (key === 'iowaCourt') return Array.isArray(result.points) && result.points.length > 0;
  if (key === 'utahCourt') return Array.isArray(result.historyPoints) && result.historyPoints.length > 0;
  if (key === 'georgiaPrime') return Array.isArray(result.changePoints) && result.changePoints.length > 0;
  return false;
}

export function omitUnavailableMonitoredStateEntities(bundles, liveResults = {}) {
  const preserve = new Set();
  for (const [key, slugs] of Object.entries(MONITORED_STATE_ENTITIES)) {
    if (!liveResults[key]) for (const slug of slugs) preserve.add(slug);
  }
  if (!preserve.size) return bundles;

  return bundles.map((bundle) => ({
    ...bundle,
    entities: bundle.entities.filter((entity) => !preserve.has(entity.slug)),
    observations: bundle.observations.filter(
      (observation) => !preserve.has(observation.entitySlug),
    ),
  }));
}

export function completeSnapshotEntitySlugs(coreBundles, liveResults = {}) {
  const slugs = new Set(
    coreBundles.flatMap((bundle) => bundle.entities.map((entity) => entity.slug)),
  );
  for (const [key, entitySlugs] of Object.entries(COMPLETE_STATE_SNAPSHOT_ENTITIES)) {
    if (!hasCompleteSnapshot(key, liveResults[key])) continue;
    for (const slug of entitySlugs) slugs.add(slug);
  }
  return [...slugs];
}

