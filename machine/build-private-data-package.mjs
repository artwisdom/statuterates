#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..');
const EXPORT_ROOT = path.join(REPO_ROOT, 'data', 'exports');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'tmp', 'private-data-package-candidate');
const STAGING_ROOT = path.join(REPO_ROOT, 'tmp', '.private-data-package-candidate-staging');

// This whitelist is intentionally exact and fail closed. The labels summarize the
// rights statements recorded in the source snapshot; they are not legal opinions.
export const RIGHTS_BY_RECORDED_LICENSE = Object.freeze({
  'Government edict — not subject to copyright.': {
    category: 'recorded_government_edict',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'U.S. federal government work — not subject to copyright (public domain).': {
    category: 'recorded_us_federal_public_domain',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'U.S. federal government work — public domain. FRED requests source attribution.': {
    category: 'recorded_us_federal_public_domain_with_attribution_request',
    disposition: 'include_in_private_candidate',
    attribution: 'required_by_recorded_source_note',
  },
  'Bank of England statistical data, free to reuse with attribution.': {
    category: 'recorded_statistical_data_reuse_with_attribution',
    disposition: 'include_in_private_candidate',
    attribution: 'required_by_recorded_source_note',
  },
  'ECB statistical data, free to reuse with attribution.': {
    category: 'recorded_statistical_data_reuse_with_attribution',
    disposition: 'include_in_private_candidate',
    attribution: 'required_by_recorded_source_note',
  },
  'Georgia statutory text is a government edict; the FRED PRIME series requests citation to its Federal Reserve source.': {
    category: 'recorded_government_edict_and_federal_series_attribution',
    disposition: 'include_in_private_candidate',
    attribution: 'required_by_recorded_source_note',
  },
  'Nebraska government publication - not subject to copyright.': {
    category: 'recorded_government_publication',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'Official judicial opinion.': {
    category: 'recorded_official_judicial_opinion',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'Texas government publication — not subject to copyright.': {
    category: 'recorded_government_publication',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'U.S. government publication and government edict.': {
    category: 'recorded_us_government_publication_and_edict',
    disposition: 'include_in_private_candidate',
    attribution: 'recommended',
  },
  'Official public rate table; normalized date/rate facts transcribed with attribution. Source-site terms may apply.': {
    category: 'source_site_terms_review_required',
    disposition: 'exclude_pending_rights_review',
    attribution: 'required_if_later_approved',
  },
});

const DATA_DICTIONARY = Object.freeze({
  entity_slug: 'Stable StatuteRates identifier for the rate series.',
  entity_name: 'Human-readable rate-series name.',
  entity_type: 'Entity type recorded in the committed snapshot.',
  jurisdiction: 'Jurisdiction code or label recorded for the entity.',
  region: 'Region recorded for the entity.',
  locale: 'Optional locale recorded for the entity.',
  metric: 'Metric name. The current dataset uses annual_rate.',
  value: 'Numeric observation value.',
  value_text: 'Source-normalized display value.',
  unit: 'Unit recorded for the observation.',
  effective_date: 'ISO date on which the observation became effective.',
  source_id: 'Stable source identifier linked to source-attribution-rights.csv.',
  source_url: 'Observation-level citation URL.',
  retrieved_at: 'ISO timestamp recorded when the source was retrieved or reviewed.',
  confidence: 'Confidence label recorded by the StatuteRates pipeline.',
  method: 'Collection or derivation method recorded by the pipeline.',
  notes: 'Observation-specific context, scope, formula, and caveats.',
  source_name: 'Human-readable source name from the committed metadata.',
  source_publisher: 'Publisher recorded in the committed metadata.',
  source_home_url: 'Canonical source URL recorded in the committed metadata.',
  source_recorded_license: 'Verbatim rights statement recorded for the source.',
  rights_category: 'Conservative internal category derived by exact whitelist match; not legal clearance.',
  lineage_category: 'Whether the observation citation stays on the recorded source origin.',
  candidate_disposition: 'Combined source-rights and observation-lineage decision for this private candidate.',
});

const OBSERVATION_FIELDS = Object.freeze(Object.keys(DATA_DICTIONARY));

const SOURCE_MATRIX_DICTIONARY = Object.freeze({
  source_id: 'Stable source identifier used by observation rows.',
  source_name: 'Human-readable source name from the committed metadata.',
  publisher: 'Publisher recorded in the committed metadata.',
  home_url: 'Canonical source URL recorded in the committed metadata.',
  source_retrieved_at: 'ISO timestamp recorded for the source snapshot.',
  recorded_source_status: 'Verbatim fetch, review, or robots-status note recorded for the source.',
  recorded_license: 'Verbatim rights statement recorded for the source.',
  rights_category: 'Conservative exact-whitelist category; not legal clearance.',
  candidate_disposition: 'Whether observations may enter this private candidate or must remain excluded.',
  attribution: 'Attribution handling indicated by the recorded rights statement.',
  legal_clearance: 'Always not_assessed in this private candidate.',
  observation_count: 'Number of committed observations that cite the source.',
  excluded_observation_count: 'Number withheld from the private candidate because this source requires review.',
  exclusion_reason: 'Reason observations were withheld, blank when included in the private candidate.',
});

function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function csvCell(value) {
  let normalized = value === null || value === undefined
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);
  // Keep the CSV safe to inspect in spreadsheet software. JSONL remains the exact machine-value
  // representation; only string cells with a formula-capable prefix receive a leading apostrophe.
  if (typeof value === 'string' && /^[=+\-@]/u.test(normalized)) normalized = `'${normalized}`;
  return `"${normalized.replaceAll('"', '""')}"`;
}

function csv(rows, fields) {
  return `${[
    fields.map(csvCell).join(','),
    ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(',')),
  ].join('\r\n')}\r\n`;
}

function compareText(left, right) {
  const a = String(left);
  const b = String(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

function sourceRights(source) {
  const classification = RIGHTS_BY_RECORDED_LICENSE[source.license];
  if (!classification) {
    throw new Error(
      `Unclassified recorded source license for ${source.id}: ${JSON.stringify(source.license)}. `
      + 'Update the exact fail-closed whitelist before building a candidate.',
    );
  }
  return classification;
}

function httpsOrigin(value, label) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL: ${JSON.stringify(value)}`);
  }
  if (url.protocol !== 'https:') throw new Error(`${label} must use HTTPS: ${value}`);
  return url.origin;
}

function observationLineage(source, observation) {
  const recordedOrigin = httpsOrigin(source.home_url, `source ${source.id} home_url`);
  const observedOrigin = httpsOrigin(
    observation.source_url,
    `${observation.source_id} observation source_url`,
  );
  if (recordedOrigin === observedOrigin) {
    return {
      category: 'same_origin_as_recorded_source',
      disposition: 'include_in_private_candidate',
    };
  }
  return {
    category: 'cross_origin_observation_review_required',
    disposition: 'exclude_pending_lineage_review',
  };
}

function flattenObservations(entity, sourceById) {
  const observations = [];
  for (const [metric, history] of Object.entries(entity.history || {}).sort(([a], [b]) => compareText(a, b))) {
    for (const observation of history) {
      const source = sourceById.get(observation.source_id);
      if (!source) {
        throw new Error(`${entity.slug}/${metric}/${observation.effective_date} references unknown source ${observation.source_id}`);
      }
      const rights = sourceRights(source);
      const lineage = observationLineage(source, observation);
      const candidateDisposition = rights.disposition === 'include_in_private_candidate'
        ? lineage.disposition
        : rights.disposition;
      observations.push({
        entity_slug: entity.slug,
        entity_name: entity.name,
        entity_type: entity.entity_type,
        jurisdiction: entity.jurisdiction,
        region: entity.region,
        locale: entity.locale,
        metric,
        value: observation.value,
        value_text: observation.value_text,
        unit: observation.unit,
        effective_date: observation.effective_date,
        source_id: observation.source_id,
        source_url: observation.source_url,
        retrieved_at: observation.retrieved_at,
        confidence: observation.confidence,
        method: observation.method,
        notes: observation.notes,
        source_name: source.name,
        source_publisher: source.publisher,
        source_home_url: source.home_url,
        source_recorded_license: source.license,
        rights_category: rights.category,
        lineage_category: lineage.category,
        candidate_disposition: candidateDisposition,
      });
    }
  }
  return observations;
}

function compareObservation(left, right) {
  return compareText(left.entity_slug, right.entity_slug)
    || compareText(left.metric, right.metric)
    || compareText(left.effective_date, right.effective_date)
    || compareText(left.source_id, right.source_id)
    || compareText(left.value_text, right.value_text);
}

export function buildPrivateCandidateModel({ meta, entities, inputFiles }) {
  if (!meta || !Array.isArray(meta.sources)) throw new Error('meta.sources must be an array');
  if (!Array.isArray(entities)) throw new Error('entities must be an array');
  if (entities.length !== meta.entity_count) {
    throw new Error(`Entity count mismatch: metadata says ${meta.entity_count}; snapshots contain ${entities.length}`);
  }

  const entitySlugs = new Set();
  for (const entity of entities) {
    if (!entity.slug || entitySlugs.has(entity.slug)) throw new Error(`Duplicate or blank entity slug: ${entity.slug}`);
    entitySlugs.add(entity.slug);
  }

  const sources = [...meta.sources].sort((a, b) => compareText(a.id, b.id));
  const sourceById = new Map();
  for (const source of sources) {
    if (!source.id || sourceById.has(source.id)) throw new Error(`Duplicate or blank source id: ${source.id}`);
    sourceRights(source);
    sourceById.set(source.id, source);
  }

  const allObservations = entities
    .flatMap((entity) => flattenObservations(entity, sourceById))
    .sort(compareObservation);
  if (allObservations.length !== meta.observation_count) {
    throw new Error(
      `Observation count mismatch: metadata says ${meta.observation_count}; snapshots contain ${allObservations.length}`,
    );
  }

  const excludedObservations = allObservations.filter((observation) => (
    observation.candidate_disposition !== 'include_in_private_candidate'
  ));
  const includedObservations = allObservations.filter((observation) => (
    observation.candidate_disposition === 'include_in_private_candidate'
  ));
  const includedEntitySlugs = new Set(includedObservations.map((observation) => observation.entity_slug));
  const excludedEntitySlugs = new Set(excludedObservations.map((observation) => observation.entity_slug));

  const observationCounts = new Map();
  const excludedCounts = new Map();
  for (const observation of allObservations) {
    observationCounts.set(observation.source_id, (observationCounts.get(observation.source_id) || 0) + 1);
  }
  for (const observation of excludedObservations) {
    excludedCounts.set(observation.source_id, (excludedCounts.get(observation.source_id) || 0) + 1);
  }

  const sourceMatrix = sources.map((source) => {
    const rights = sourceRights(source);
    const sourceExcludedObservations = excludedObservations.filter((observation) => (
      observation.source_id === source.id
    ));
    const hasLineageExclusions = sourceExcludedObservations.some((observation) => (
      observation.lineage_category === 'cross_origin_observation_review_required'
    ));
    const candidateDisposition = rights.disposition !== 'include_in_private_candidate'
      ? rights.disposition
      : hasLineageExclusions
        ? 'partial_exclusion_pending_lineage_review'
        : 'include_in_private_candidate';
    const exclusionReason = rights.disposition !== 'include_in_private_candidate'
      ? 'Source-site terms require owner/legal review before any data-package publication or redistribution.'
      : hasLineageExclusions
        ? 'One or more observation citations use a different origin than the recorded source; review that lineage and its terms before inclusion.'
        : '';
    return {
      source_id: source.id,
      source_name: source.name,
      publisher: source.publisher,
      home_url: source.home_url,
      source_retrieved_at: source.retrieved_at,
      recorded_source_status: source.robots_status,
      recorded_license: source.license,
      rights_category: rights.category,
      candidate_disposition: candidateDisposition,
      attribution: rights.attribution,
      legal_clearance: 'not_assessed',
      observation_count: observationCounts.get(source.id) || 0,
      excluded_observation_count: excludedCounts.get(source.id) || 0,
      exclusion_reason: exclusionReason,
    };
  });

  const exclusions = sourceMatrix
    .filter((source) => source.candidate_disposition !== 'include_in_private_candidate')
    .map((source) => ({
      source_id: source.source_id,
      recorded_license: source.recorded_license,
      rights_category: source.rights_category,
      excluded_observation_count: source.excluded_observation_count,
      excluded_observation_origins: [...new Set(
        excludedObservations
          .filter((observation) => observation.source_id === source.source_id)
          .map((observation) => new URL(observation.source_url).origin),
      )].sort(compareText),
      lineage_categories: [...new Set(
        excludedObservations
          .filter((observation) => observation.source_id === source.source_id)
          .map((observation) => observation.lineage_category),
      )].sort(compareText),
      affected_entities: [...new Set(
        excludedObservations
          .filter((observation) => observation.source_id === source.source_id)
          .map((observation) => observation.entity_slug),
      )].sort(compareText),
      reason: source.exclusion_reason,
    }));

  const normalizedInputs = [...inputFiles]
    .map((file) => ({ path: file.path, sha256: file.sha256 }))
    .sort((a, b) => compareText(a.path, b.path));
  const inputSetSha256 = sha256(normalizedInputs.map((file) => `${file.path}\0${file.sha256}\n`).join(''));

  return {
    meta,
    includedObservations,
    sourceMatrix,
    exclusions,
    inputFiles: normalizedInputs,
    inputSetSha256,
    counts: {
      source_records_classified: sources.length,
      source_records_included: sourceMatrix.filter((source) => source.candidate_disposition === 'include_in_private_candidate').length,
      source_records_excluded: exclusions.length,
      entities_in_source_snapshot: entities.length,
      entities_with_included_observations: includedEntitySlugs.size,
      entities_with_excluded_observations: excludedEntitySlugs.size,
      observations_in_source_snapshot: allObservations.length,
      observations_included: includedObservations.length,
      observations_excluded: excludedObservations.length,
    },
  };
}

export function renderPrivateCandidateFiles(model) {
  const sourceFields = Object.keys(SOURCE_MATRIX_DICTIONARY);
  const generatedDate = String(model.meta.generated_at || '').slice(0, 10);
  const manifest = {
    package_name: 'StatuteRates private citable data-package candidate',
    package_status: 'PRIVATE_LOCAL_CANDIDATE_NOT_APPROVED_NOT_PUBLISHED',
    publication_authorized: false,
    redistribution_authorized: false,
    legal_clearance: 'not_assessed',
    source_snapshot_generated_at: model.meta.generated_at,
    source_snapshot_version: model.meta.version,
    deterministic_input_set_sha256: model.inputSetSha256,
    deterministic_inputs: model.inputFiles,
    counts: model.counts,
    exclusions_file: 'exclusions.json',
    notice: 'CANDIDATE-NOTICE.md',
    included_data_files: ['observations.jsonl', 'observations.csv'],
    supporting_files: [
      'data-dictionary.json',
      'source-attribution-rights.csv',
      'citation.json',
      'exclusions.json',
      'CANDIDATE-NOTICE.md',
    ],
    checksums_file: 'checksums.sha256',
  };
  const citation = {
    type: 'dataset',
    title: 'StatuteRates private citable data-package candidate',
    publisher: 'StatuteRates',
    version: model.meta.version,
    source_snapshot_generated_at: model.meta.generated_at,
    suggested_citation: `StatuteRates. StatuteRates private data-package candidate, version ${model.meta.version}, source snapshot ${generatedDate}. Unpublished local candidate.`,
    attribution_notice: model.meta.attribution,
    disclaimer: model.meta.disclaimer,
    publication_status: 'Not approved and not published. Do not redistribute until the repository owner completes rights, commercial-use, privacy, and product review.',
    source_attribution: model.sourceMatrix.map((source) => ({
      source_id: source.source_id,
      name: source.source_name,
      publisher: source.publisher,
      url: source.home_url,
      retrieved_at: source.source_retrieved_at,
      recorded_license: source.recorded_license,
      candidate_disposition: source.candidate_disposition,
    })),
  };
  const notice = [
    '# PRIVATE / LOCAL CANDIDATE — NOT APPROVED OR PUBLISHED',
    '',
    'This directory is a deterministic evaluation artifact generated from committed `data/exports` snapshots.',
    'It is not a public product, publication approval, license grant, legal-clearance finding, or redistribution authorization.',
    '',
    'Every source rights statement is matched against an exact, fail-closed whitelist. An unknown statement stops the build.',
    'Observations whose recorded source terms still require review are excluded and itemized in `exclusions.json`.',
    'All included sources still require owner review before any public or commercial distribution.',
    '',
    `Source snapshot: ${model.meta.generated_at}`,
    `Included observations: ${model.counts.observations_included}`,
    `Excluded observations: ${model.counts.observations_excluded}`,
    '',
    'This dataset is reference material, not legal, tax, or financial advice. Verify controlling authority before relying on any rate.',
    '',
  ].join('\n');

  const files = new Map([
    ['CANDIDATE-NOTICE.md', notice],
    ['citation.json', stableJson(citation)],
    ['data-dictionary.json', stableJson({
      schema_version: 1,
      row_granularity: 'One recorded rate observation per row.',
      files: {
        'observations.jsonl': 'Newline-delimited JSON observation rows.',
        'observations.csv': 'The same observation rows in RFC 4180-style CSV.',
        'source-attribution-rights.csv': 'Source citation, recorded rights, candidate disposition, and counts.',
      },
      observation_fields: DATA_DICTIONARY,
      source_attribution_rights_fields: SOURCE_MATRIX_DICTIONARY,
      missing_values: 'Null or empty values mean the committed source snapshot did not record a value.',
      spreadsheet_safety: 'CSV string cells beginning with =, +, -, or @ receive a leading apostrophe. JSONL preserves the exact value.',
      rights_category_warning: 'Categories mirror recorded source statements and are not independent legal-clearance findings.',
    })],
    ['exclusions.json', stableJson({
      package_status: manifest.package_status,
      excluded_source_count: model.exclusions.length,
      excluded_observation_count: model.counts.observations_excluded,
      exclusions: model.exclusions,
    })],
    ['manifest.json', stableJson(manifest)],
    ['observations.csv', csv(model.includedObservations, OBSERVATION_FIELDS)],
    ['observations.jsonl', model.includedObservations.map((row) => JSON.stringify(row)).join('\n') + '\n'],
    ['source-attribution-rights.csv', csv(model.sourceMatrix, sourceFields)],
  ]);
  const checksums = [...files.entries()]
    .sort(([a], [b]) => compareText(a, b))
    .map(([name, contents]) => `${sha256(contents)}  ${name}`)
    .join('\n') + '\n';
  files.set('checksums.sha256', checksums);
  return files;
}

async function readInputs(exportRoot = EXPORT_ROOT) {
  const metaPath = path.join(exportRoot, 'meta.json');
  const entityRoot = path.join(exportRoot, 'entity');
  const entityNames = (await readdir(entityRoot))
    .filter((name) => name.endsWith('.json'))
    .sort(compareText);
  const paths = [metaPath, ...entityNames.map((name) => path.join(entityRoot, name))];
  const inputs = [];
  for (const filePath of paths) {
    const contents = await readFile(filePath, 'utf8');
    inputs.push({
      path: path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
      sha256: sha256(contents),
      contents,
    });
  }
  return {
    meta: JSON.parse(inputs[0].contents),
    entities: inputs.slice(1).map((input) => JSON.parse(input.contents)),
    inputFiles: inputs.map(({ path: inputPath, sha256: digest }) => ({ path: inputPath, sha256: digest })),
  };
}

async function assertCommittedInputs() {
  const inputPathspecs = ['data/exports/meta.json', 'data/exports/entity'];
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['status', '--porcelain=v1', '--untracked-files=all', '--', ...inputPathspecs],
      { cwd: REPO_ROOT, encoding: 'utf8' },
    );
    if (stdout.trim()) {
      throw new Error(`data-package inputs are not clean committed snapshots:\n${stdout.trim()}`);
    }
    try {
      await execFileAsync(
        'git',
        ['diff', '--quiet', '--no-ext-diff', 'HEAD', '--', ...inputPathspecs],
        { cwd: REPO_ROOT },
      );
    } catch {
      throw new Error('data-package inputs do not byte-match the checked-out HEAD snapshot');
    }
  } catch (error) {
    if (error.message.startsWith('data-package inputs are not clean')) throw error;
    throw new Error(`Could not prove data-package inputs are committed: ${error.message}`);
  }
}

async function ensureSafeTmpRoot() {
  const tmpRoot = path.join(REPO_ROOT, 'tmp');
  await mkdir(tmpRoot, { recursive: true });
  const stats = await lstat(tmpRoot);
  if (!stats.isDirectory() || stats.isSymbolicLink()) throw new Error('Repository tmp path is not a safe directory');
  for (const output of [OUTPUT_ROOT, STAGING_ROOT]) {
    if (!path.resolve(output).startsWith(`${path.resolve(tmpRoot)}${path.sep}`)) {
      throw new Error(`Candidate output escaped the ignored tmp directory: ${output}`);
    }
  }
}

export async function buildPrivateCandidateOnDisk() {
  await assertCommittedInputs();
  await ensureSafeTmpRoot();
  const inputs = await readInputs();
  const model = buildPrivateCandidateModel(inputs);
  const files = renderPrivateCandidateFiles(model);

  await rm(STAGING_ROOT, { recursive: true, force: true });
  await mkdir(STAGING_ROOT, { recursive: true });
  for (const [name, contents] of [...files.entries()].sort(([a], [b]) => compareText(a, b))) {
    await writeFile(path.join(STAGING_ROOT, name), contents, { encoding: 'utf8', flag: 'wx' });
  }
  await rm(OUTPUT_ROOT, { recursive: true, force: true });
  await rename(STAGING_ROOT, OUTPUT_ROOT);
  return { outputRoot: OUTPUT_ROOT, files, model };
}

async function main() {
  if (process.argv.length !== 3 || process.argv[2] !== '--build-private-candidate') {
    throw new Error(
      'Refusing to write without explicit local-candidate flag. '
      + 'Usage: node machine/build-private-data-package.mjs --build-private-candidate',
    );
  }
  const result = await buildPrivateCandidateOnDisk();
  process.stdout.write(`${result.outputRoot}\n`);
  process.stderr.write(
    `PRIVATE candidate only: ${result.model.counts.observations_included} observations included; `
    + `${result.model.counts.observations_excluded} excluded; ${result.files.size} files.\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Private data-package candidate FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
