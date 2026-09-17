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

test('source-rights and cross-origin lineage review observations are excluded and itemized', async () => {
  const inputs = await committedInputs();
  const sourceById = new Map(inputs.meta.sources.map((source) => [source.id, source]));
  const allObservations = inputs.entities.flatMap((entity) => (
    Object.values(entity.history || {}).flat().map((observation) => ({ entity: entity.slug, observation }))
  ));
  const expectedExcluded = allObservations.filter(({ observation }) => {
    const source = sourceById.get(observation.source_id);
    const rightsBlocked = RIGHTS_BY_RECORDED_LICENSE[source.license].disposition !== 'include_in_private_candidate';
    return rightsBlocked || new URL(source.home_url).origin !== new URL(observation.source_url).origin;
  });
  const expectedTennesseeCount = expectedExcluded
    .filter(({ observation }) => observation.source_id === 'tn-courts').length;
  const expectedIncludedEntities = new Set(
    allObservations
      .filter((item) => !expectedExcluded.includes(item))
      .map((item) => item.entity),
  ).size;
  const expectedExcludedEntities = new Set(expectedExcluded.map((item) => item.entity)).size;
  assert.ok(expectedTennesseeCount > 0);
  const model = buildPrivateCandidateModel(inputs);
  assert.equal(model.counts.source_records_classified, inputs.meta.sources.length);
  assert.equal(model.counts.entities_in_source_snapshot, inputs.entities.length);
  assert.equal(model.counts.observations_in_source_snapshot, inputs.meta.observation_count);
  assert.equal(model.counts.observations_included, inputs.meta.observation_count - expectedExcluded.length);
  assert.equal(model.counts.observations_excluded, expectedExcluded.length);
  assert.equal(model.counts.entities_with_included_observations, expectedIncludedEntities);
  assert.equal(model.counts.entities_with_excluded_observations, expectedExcludedEntities);
  const tennessee = model.exclusions.find((item) => item.source_id === 'tn-courts');
  assert.equal(tennessee.recorded_license, 'Official public rate table; normalized date/rate facts transcribed with attribution. Source-site terms may apply.');
  assert.equal(tennessee.rights_category, 'source_site_terms_review_required');
  assert.equal(tennessee.excluded_observation_count, expectedTennesseeCount);
  assert.deepEqual(tennessee.affected_entities, ['tennessee-judgment-rate']);
  assert.match(tennessee.reason, /Source-site terms require owner\/legal review/);
  assert.equal(model.includedObservations.some((row) => row.source_id === 'tn-courts'), false);

  const georgiaPrejudgment = model.exclusions.find((item) => item.source_id === 'ga-prejud');
  assert.ok(georgiaPrejudgment.excluded_observation_count > 0);
  assert.deepEqual(georgiaPrejudgment.excluded_observation_origins, ['https://fred.stlouisfed.org']);
  assert.deepEqual(georgiaPrejudgment.lineage_categories, ['cross_origin_observation_review_required']);
  assert.match(georgiaPrejudgment.reason, /different origin than the recorded source/);
  assert.equal(model.includedObservations.some((row) => row.source_id === 'ga-prejud'), false);
});

test('invalid or insecure observation lineage URLs stop the candidate build', async () => {
  const inputs = await committedInputs();
  const target = Object.values(inputs.entities[0].history).flat()[0];
  target.source_url = 'http://example.gov/not-https';
  assert.throws(
    () => buildPrivateCandidateModel(inputs),
    /observation source_url must use HTTPS/,
  );
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

test('CSV neutralizes spreadsheet formula prefixes while JSONL preserves the exact string', async () => {
  const inputs = await committedInputs();
  const model = buildPrivateCandidateModel(inputs);
  model.includedObservations[0] = {
    ...model.includedObservations[0],
    notes: '=HYPERLINK("https://example.invalid","open")',
  };
  const files = renderPrivateCandidateFiles(model);

  assert.match(files.get('observations.csv'), /"'=HYPERLINK\(""https:\/\/example\.invalid"",""open""\)"/u);
  assert.match(files.get('observations.jsonl'), /"notes":"=HYPERLINK\(\\"https:\/\/example\.invalid\\",\\"open\\"\)"/u);
});
