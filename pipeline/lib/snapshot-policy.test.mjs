import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  completeSnapshotEntitySlugs,
  omitUnavailableMonitoredStateEntities,
} from './snapshot-policy.mjs';

const stateBundles = [{
  source: { id: 'state-source' },
  entities: [
    { slug: 'florida-judgment-rate' },
    { slug: 'florida-prejudgment-rate' },
    { slug: 'texas-judgment-rate' },
  ],
  observations: [
    { entitySlug: 'florida-judgment-rate' },
    { entitySlug: 'florida-prejudgment-rate' },
    { entitySlug: 'texas-judgment-rate' },
  ],
}];

test('a monitored state outage preserves its committed entity and metadata', () => {
  const filtered = omitUnavailableMonitoredStateEntities(stateBundles, {
    alaskaCourt: {},
    floridaCfo: null,
    iowaCourt: {},
    utahCourt: {},
  });

  assert.deepEqual(
    filtered[0].entities.map((entity) => entity.slug),
    ['texas-judgment-rate'],
  );
  assert.deepEqual(
    filtered[0].observations.map((observation) => observation.entitySlug),
    ['texas-judgment-rate'],
  );
});

test('only complete authoritative histories replace prior snapshots', () => {
  const core = [{
    entities: [{ slug: 'treasury-1-year-cmt' }, { slug: 'us-federal-post-judgment' }],
  }];
  const replacementSlugs = completeSnapshotEntitySlugs(core, {
    floridaCfo: { points: [{ effective_date: '2026-10-01' }] },
    utahCourt: { historyPoints: [], current: { effective_date: '2027-01-01' } },
  });

  assert.deepEqual(
    replacementSlugs.sort(),
    [
      'california-judgment-rate',
      'florida-judgment-rate',
      'florida-prejudgment-rate',
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
      'treasury-1-year-cmt',
      'us-federal-post-judgment',
      'west-virginia-judgment-rate',
    ],
  );
  assert.equal(replacementSlugs.includes('texas-judgment-rate'), false);
  assert.equal(replacementSlugs.includes('utah-judgment-rate'), false);
});
