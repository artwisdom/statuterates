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
      'florida-judgment-rate',
      'florida-prejudgment-rate',
      'treasury-1-year-cmt',
      'us-federal-post-judgment',
    ],
  );
  assert.equal(replacementSlugs.includes('texas-judgment-rate'), false);
  assert.equal(replacementSlugs.includes('utah-judgment-rate'), false);
});
