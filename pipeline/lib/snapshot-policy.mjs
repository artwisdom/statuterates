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

// These source-backed curated builders return the complete intended snapshot for the named series.
// Replacing rather than merging prevents retired source-review placeholders from surviving beside
// corrected legal effective dates or complete official tables.
const CURATED_COMPLETE_STATE_ENTITIES = Object.freeze([
  'california-judgment-rate',
  'idaho-judgment-rate',
  'indiana-judgment-rate',
  'louisiana-judgment-rate',
  'louisiana-prejudgment-rate',
  'michigan-judgment-rate',
  'michigan-prejudgment-rate',
  'new-jersey-judgment-rate',
  'new-jersey-prejudgment-rate',
  'new-york-consumer-debt-judgment-rate',
  'new-york-judgment-rate',
  'north-dakota-judgment-rate',
  'oregon-judgment-rate',
  'west-virginia-judgment-rate',
]);

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
  for (const slug of CURATED_COMPLETE_STATE_ENTITIES) slugs.add(slug);
  for (const [key, entitySlugs] of Object.entries(COMPLETE_STATE_SNAPSHOT_ENTITIES)) {
    if (!hasCompleteSnapshot(key, liveResults[key])) continue;
    for (const slug of entitySlugs) slugs.add(slug);
  }
  return [...slugs];
}
