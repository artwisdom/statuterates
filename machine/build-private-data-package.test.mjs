import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  RIGHTS_BY_RECORDED_LICENSE,
  buildPrivateCandidateModel,
  renderPrivateCandidateFiles,
} from './build-private-data-package.mjs';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const EXPORT_ROOT = path.join(REPO_ROOT, 'data', 'exports');

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

async function committedInputs() {
  const metaContents = await readFile(path.join(EXPORT_ROOT, 'meta.json'), 'utf8');
  const names = (await readdir(path.join(EXPORT_ROOT, 'entity')))
    .filter((name) => name.endsWith('.json'))
    .sort();
  const entityInputs = await Promise.all(names.map(async (name) => {
    const contents = await readFile(path.join(EXPORT_ROOT, 'entity', name), 'utf8');
    return { name, contents };
  }));
  return {
    meta: JSON.parse(metaContents),
    entities: entityInputs.map(({ contents }) => JSON.parse(contents)),
    inputFiles: [
      { path: 'data/exports/meta.json', sha256: sha256(metaContents) },
      ...entityInputs.map(({ name, contents }) => ({
        path: `data/exports/entity/${name}`,
        sha256: sha256(contents),
      })),
    ],
  };
}

test('the exact fail-closed whitelist classifies every recorded source license and no extras', async () => {
  const { meta } = await committedInputs();
  const recorded = [...new Set(meta.sources.map((source) => source.license))].sort();
  const whitelisted = Object.keys(RIGHTS_BY_RECORDED_LICENSE).sort();
  assert.deepEqual(whitelisted, recorded);
});

test('unknown rights text stops the candidate build', async () => {
  const inputs = await committedInputs();
  inputs.meta.sources[0] = { ...inputs.meta.sources[0], license: 'Unknown future source terms' };
  assert.throws(
    () => buildPrivateCandidateModel(inputs),
    /Unclassified recorded source license/,
  );
});

test('snapshot count drift stops the candidate build', async () => {
  const inputs = await committedInputs();
  inputs.meta.entity_count += 1;
  assert.throws(
    () => buildPrivateCandidateModel(inputs),
    /Entity count mismatch/,
  );
});

test('review-required Tennessee observations are excluded and itemized', async () => {
  const inputs = await committedInputs();
  const expectedTennesseeCount = inputs.entities
    .flatMap((entity) => Object.values(entity.history || {}).flat())
    .filter((observation) => observation.source_id === 'tn-courts').length;
  const expectedIncludedEntities = inputs.entities.filter((entity) => (
    Object.values(entity.history || {}).flat().some((observation) => observation.source_id !== 'tn-courts')
  )).length;
  assert.ok(expectedTennesseeCount > 0);
  const model = buildPrivateCandidateModel(inputs);
  assert.equal(model.counts.source_records_classified, inputs.meta.sources.length);
  assert.equal(model.counts.entities_in_source_snapshot, inputs.entities.length);
  assert.equal(model.counts.observations_in_source_snapshot, inputs.meta.observation_count);
  assert.equal(model.counts.observations_included, inputs.meta.observation_count - expectedTennesseeCount);
  assert.equal(model.counts.observations_excluded, expectedTennesseeCount);
  assert.equal(model.counts.entities_with_included_observations, expectedIncludedEntities);
  assert.equal(model.counts.entities_with_excluded_observations, 1);
  assert.equal(model.exclusions.length, 1);
  assert.deepEqual(model.exclusions[0], {
    source_id: 'tn-courts',
    recorded_license: 'Official public rate table; normalized date/rate facts transcribed with attribution. Source-site terms may apply.',
    rights_category: 'source_site_terms_review_required',
    excluded_observation_count: expectedTennesseeCount,
    affected_entities: ['tennessee-judgment-rate'],
    reason: 'Source-site terms require owner/legal review before any data-package publication or redistribution.',
  });
  assert.equal(model.includedObservations.some((row) => row.source_id === 'tn-courts'), false);
});

test('rendering is byte deterministic and checksums cover every payload file', async () => {
  const inputs = await committedInputs();
  const first = renderPrivateCandidateFiles(buildPrivateCandidateModel(inputs));
  const second = renderPrivateCandidateFiles(buildPrivateCandidateModel(inputs));
  assert.deepEqual([...first.entries()], [...second.entries()]);

  const checksumLines = first.get('checksums.sha256').trim().split('\n');
  assert.equal(checksumLines.length, first.size - 1);
  for (const line of checksumLines) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    assert.ok(match, `malformed checksum line: ${line}`);
    const [, expected, name] = match;
    assert.notEqual(name, 'checksums.sha256');
    assert.equal(sha256(first.get(name)), expected);
  }

  const manifest = JSON.parse(first.get('manifest.json'));
  assert.equal(manifest.package_status, 'PRIVATE_LOCAL_CANDIDATE_NOT_APPROVED_NOT_PUBLISHED');
  assert.equal(manifest.publication_authorized, false);
  assert.equal(manifest.redistribution_authorized, false);
  assert.equal(manifest.legal_clearance, 'not_assessed');
});
