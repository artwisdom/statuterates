import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { parse as parseYaml } from 'yaml';

import {
  APPROVED_HISTORICAL_RATE_SLUGS,
  historicalRateSeriesForEntity,
} from '../shared/historical-rate-releases.mjs';

export const CSV_HEADER = Object.freeze([
  'series',
  'metric',
  'effective_date',
  'value_percent',
  'unit',
  'confidence',
  'method',
  'source_url',
  'retrieved_at',
]);

export const RESPONSE_TARGETS = Object.freeze({
  index: { path: '/api/v1/index.json', mediaType: 'application/json' },
  meta: { path: '/api/v1/meta.json', mediaType: 'application/json' },
  metrics: { path: '/api/v1/metrics.json', mediaType: 'application/json' },
  entities: { path: '/api/v1/entities.json', mediaType: 'application/json' },
  latest: { path: '/api/v1/latest.json', mediaType: 'application/json' },
  upcoming: { path: '/api/v1/upcoming.json', mediaType: 'application/json' },
  historyCoverage: { path: '/api/v1/history-coverage.json', mediaType: 'application/json' },
  entityJson: { path: '/api/v1/entity/{slug}.json', mediaType: 'application/json' },
  entityCsv: { path: '/api/v1/entity/{slug}.csv', mediaType: 'text/csv' },
});

const STATIC_JSON_FILES = Object.freeze({
  index: 'index.json',
  meta: 'meta.json',
  metrics: 'metrics.json',
  entities: 'entities.json',
  latest: 'latest.json',
  upcoming: 'upcoming.json',
  historyCoverage: 'history-coverage.json',
});

const DEFAULT_EXPECTATIONS = Object.freeze({
  historicalSlugs: APPROVED_HISTORICAL_RATE_SLUGS,
  validateFederalDateSemantics: true,
  nebraskaGap: Object.freeze({ start: '2001-03-14', end: '2002-07-19' }),
});

const HTTP_OPERATION_KEYS = Object.freeze([
  'get',
  'put',
  'post',
  'delete',
  'options',
  'head',
  'patch',
  'trace',
]);

const shiftIsoDays = (date, days) => {
  const shifted = new Date(`${date}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
};

const deepEqual = isDeepStrictEqual;
const sorted = (values) => [...values].sort();
const sameStringSet = (left, right) => deepEqual(sorted(left), sorted(right));
const displayValue = (value) => (value === null || value === undefined ? '' : String(value));

function listFilesRecursive(directory, prefix = '') {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return listFilesRecursive(join(directory, entry.name), relativePath);
    return [relativePath];
  });
}

function rewriteComponentRefs(value) {
  if (Array.isArray(value)) return value.map(rewriteComponentRefs);
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === '$ref' && typeof child === 'string' && child.startsWith('#/components/schemas/')) {
      output[key] = child.replace('#/components/schemas/', '#/$defs/');
    } else {
      output[key] = rewriteComponentRefs(child);
    }
  }
  return output;
}

function formatAjvErrors(label, validationErrors = []) {
  return validationErrors.map((error) => {
    const location = error.instancePath || '/';
    const detail = error.params?.allowedValue !== undefined
      ? `${error.message}: ${JSON.stringify(error.params.allowedValue)}`
      : error.message;
    return `${label}${location} ${detail}`;
  });
}

export function parseOpenApiContract(text) {
  let spec;
  try {
    spec = parseYaml(text);
  } catch (error) {
    throw new Error(`openapi.yaml is not valid YAML: ${error.message}`);
  }
  if (!spec || typeof spec !== 'object') throw new Error('openapi.yaml must contain an object');
  if (!/^3\.1(?:\.|$)/.test(String(spec.openapi || ''))) {
    throw new Error(`openapi.yaml must declare OpenAPI 3.1, received ${JSON.stringify(spec.openapi)}`);
  }
  if (!spec.info?.title || !spec.info?.version) {
    throw new Error('openapi.yaml must declare info.title and info.version');
  }
  if (!spec.components?.schemas || typeof spec.components.schemas !== 'object') {
    throw new Error('openapi.yaml must declare components.schemas');
  }

  const expectedPaths = Object.values(RESPONSE_TARGETS).map((target) => target.path);
  const actualPaths = Object.keys(spec.paths || {});
  if (!sameStringSet(actualPaths, expectedPaths)) {
    throw new Error(
      `openapi.yaml paths differ from the validated API surface (expected ${expectedPaths.join(', ')})`,
    );
  }

  const operationIds = [];
  for (const target of Object.values(RESPONSE_TARGETS)) {
    const pathItem = spec.paths?.[target.path];
    const unsupportedOperations = HTTP_OPERATION_KEYS.filter(
      (method) => method !== 'get' && Object.hasOwn(pathItem || {}, method),
    );
    if (unsupportedOperations.length) {
      throw new Error(
        `openapi.yaml ${target.path} declares unsupported operation(s): ${unsupportedOperations.join(', ')}`,
      );
    }
    const operation = pathItem?.get;
    if (!operation) throw new Error(`openapi.yaml is missing GET ${target.path}`);
    if (!operation.operationId) throw new Error(`openapi.yaml GET ${target.path} is missing operationId`);
    operationIds.push(operation.operationId);
    if (!operation.responses?.['200']?.content?.[target.mediaType]?.schema) {
      throw new Error(`openapi.yaml GET ${target.path} lacks a 200 ${target.mediaType} response schema`);
    }
  }
  if (new Set(operationIds).size !== operationIds.length) {
    throw new Error('openapi.yaml operationId values must be unique');
  }
  return spec;
}

export function compileResponseValidators(spec) {
  const definitions = rewriteComponentRefs(spec.components.schemas);
  const validators = {};
  for (const [name, target] of Object.entries(RESPONSE_TARGETS)) {
    const response = rewriteComponentRefs(
      spec.paths[target.path].get.responses['200'].content[target.mediaType].schema,
    );
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $ref: '#/$defs/__response',
      $defs: { ...definitions, __response: response },
    };
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    addFormats(ajv, { mode: 'full' });
    try {
      validators[name] = ajv.compile(schema);
    } catch (error) {
      throw new Error(`openapi.yaml ${target.path} response schema cannot compile: ${error.message}`);
    }
  }
  return validators;
}

export function loadOpenApiContract(openapiPath) {
  const spec = parseOpenApiContract(readFileSync(openapiPath, 'utf8'));
  return { spec, validators: compileResponseValidators(spec) };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (closedQuote) {
      if (character === ',') {
        row.push(field);
        field = '';
        closedQuote = false;
      } else if (character === '\n' || character === '\r') {
        if (character === '\r' && text[index + 1] === '\n') index += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        closedQuote = false;
      } else {
        throw new Error('unexpected character after a closing quote');
      }
      continue;
    }
    if (character === '"') {
      if (field.length) throw new Error('unexpected quote in an unquoted field');
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (character === '\r') {
      if (text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('unterminated quoted field');
  if (field.length || row.length || closedQuote) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function readJson(apiDir, relativePath, errors) {
  const path = join(apiDir, relativePath);
  if (!existsSync(path)) {
    errors.push(`${relativePath}: missing file`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${relativePath}: invalid JSON (${error.message})`);
    return null;
  }
}

function validateSchema(validator, label, value, errors) {
  if (value === null) return;
  if (!validator(value)) errors.push(...formatAjvErrors(label, validator.errors));
}

function expectedCsvRows(record) {
  const rows = [CSV_HEADER];
  for (const [metric, observations] of Object.entries(record.history || {})) {
    for (const observation of observations) {
      rows.push([
        record.slug,
        metric,
        observation.effective_date,
        displayValue(observation.value),
        observation.unit,
        observation.confidence,
        displayValue(observation.method),
        observation.source_url,
        observation.retrieved_at,
      ]);
    }
  }
  return rows;
}

function compareCsv(apiDir, file, record, validator, errors) {
  const relativePath = join('entity', file.replace(/\.json$/, '.csv'));
  const path = join(apiDir, relativePath);
  if (!existsSync(path)) {
    errors.push(`${relativePath}: missing CSV sibling`);
    return;
  }
  let rows;
  try {
    const csv = readFileSync(path, 'utf8');
    if (!validator(csv)) errors.push(...formatAjvErrors(relativePath, validator.errors));
    rows = parseCsv(csv);
  } catch (error) {
    errors.push(`${relativePath}: invalid CSV (${error.message})`);
    return;
  }
  const expected = expectedCsvRows(record);
  if (rows.length !== expected.length) {
    errors.push(`${relativePath}: ${rows.length - 1} data rows != ${expected.length - 1} JSON history observations`);
    return;
  }
  for (let rowIndex = 0; rowIndex < expected.length; rowIndex += 1) {
    if (!deepEqual(rows[rowIndex], expected[rowIndex])) {
      errors.push(
        `${relativePath}: row ${rowIndex + 1} does not exactly match the JSON history projection`,
      );
      return;
    }
  }
}

function compareReleaseMetadata(label, envelope, index, errors) {
  if (!envelope || !index) return;
  if (envelope.api_version !== index.api_version) {
    errors.push(`${label}: api_version ${envelope.api_version} != ${index.api_version}`);
  }
  if (envelope.generated_at !== index.generated_at) {
    errors.push(`${label}: generated_at ${envelope.generated_at} != ${index.generated_at}`);
  }
}

function newestObservation(observations, predicate = () => true) {
  return observations
    .filter(predicate)
    .reduce((newest, observation) => (
      !newest || observation.effective_date > newest.effective_date ? observation : newest
    ), null);
}

const isUtcMonday = (date) => new Date(`${date}T00:00:00Z`).getUTCDay() === 1;

export function validateFederalDateSemantics(recordsBySlug, errors) {
  const cmtFederal = recordsBySlug.get('treasury-1-year-cmt');
  const postJudgment = recordsBySlug.get('us-federal-post-judgment');
  if (!cmtFederal || !postJudgment) {
    errors.push('federal API contract requires treasury-1-year-cmt and us-federal-post-judgment');
    return;
  }
  const cmtHistory = cmtFederal.history?.annual_rate || [];
  const postJudgmentHistory = postJudgment.history?.annual_rate || [];
  const cmtByDate = new Map(cmtHistory.map((observation) => [observation.effective_date, observation.value]));
  const eligibleCmtHistory = cmtHistory.filter(
    (observation) => observation.effective_date >= '2000-12-11',
  );
  if (postJudgment.metadata?.date_semantics !== 'judgment-applicability-week-start'
      || postJudgment.metadata?.source_week_offset_days !== -7) {
    errors.push('federal post-judgment API metadata does not declare judgment-week/source-week semantics');
  }
  if (postJudgmentHistory.length !== eligibleCmtHistory.length) {
    errors.push('federal post-judgment API history is not one-to-one with eligible CMT source weeks');
  }
  const expectedPostJudgmentDates = eligibleCmtHistory.map(
    (observation) => shiftIsoDays(observation.effective_date, 7),
  );
  const actualPostJudgmentDates = postJudgmentHistory.map(
    (observation) => observation.effective_date,
  );
  const expectedPostJudgmentDateSet = new Set(expectedPostJudgmentDates);
  const actualPostJudgmentDateSet = new Set(actualPostJudgmentDates);
  const missingPostJudgmentDates = expectedPostJudgmentDates.filter(
    (date) => !actualPostJudgmentDateSet.has(date),
  );
  const unexpectedPostJudgmentDates = actualPostJudgmentDates.filter(
    (date) => !expectedPostJudgmentDateSet.has(date),
  );
  if (missingPostJudgmentDates.length || unexpectedPostJudgmentDates.length) {
    errors.push(
      'federal post-judgment API dates do not exactly equal eligible CMT source weeks shifted by seven days'
      + ` (missing: ${missingPostJudgmentDates.join(', ') || 'none'};`
      + ` unexpected: ${unexpectedPostJudgmentDates.join(', ') || 'none'})`,
    );
  }
  for (const observation of cmtHistory) {
    if (!isUtcMonday(observation.effective_date)) {
      errors.push(`treasury 1-year CMT ${observation.effective_date}: source week must start on Monday`);
    }
  }
  for (const observation of postJudgmentHistory) {
    if (!isUtcMonday(observation.effective_date)) {
      errors.push(`federal post-judgment ${observation.effective_date}: applicability week must start on Monday`);
    }
    const sourceWeek = shiftIsoDays(observation.effective_date, -7);
    if (!cmtByDate.has(sourceWeek)) {
      errors.push(`federal post-judgment ${observation.effective_date}: missing CMT source week ${sourceWeek}`);
      continue;
    }
    const sourceValue = cmtByDate.get(sourceWeek);
    if (!Number.isFinite(sourceValue) || !Number.isFinite(observation.value)) {
      errors.push(
        `federal post-judgment ${observation.effective_date}: paired judgment and CMT values must be finite numbers`,
      );
    } else if (Math.abs(sourceValue - observation.value) > 1e-9) {
      errors.push(
        `federal post-judgment ${observation.effective_date}: ${observation.value}% does not match `
        + `CMT source week ${sourceWeek}: ${sourceValue}%`,
      );
    }
  }
}

function expectedHistoricalCoverageSeries(record, snapshotDate, sources) {
  const series = historicalRateSeriesForEntity(record, snapshotDate, { sources });
  if (!series) return null;
  return {
    entity_slug: series.entitySlug,
    label: series.label,
    metric: series.metric,
    usage: 'reference_only',
    calculation_supported: false,
    input_meaning: series.inputMeaning,
    branch_scope: series.branchScope,
    selection_rule: series.selectionRule,
    coverage_note: series.coverageNote,
    coverage_start: series.minDate,
    coverage_end: series.maxDate,
    history_count: series.historyCount,
    gaps: series.gaps.map((gap) => ({ ...gap })),
    source_url: series.sourceUrl,
    official_authorities: series.officialAuthorities.map((authority) => ({ ...authority })),
    links: {
      page: `/rates/${series.entitySlug}/`,
      entity_json: `/api/v1/entity/${series.entitySlug}.json`,
      entity_csv: `/api/v1/entity/${series.entitySlug}.csv`,
      historical_lookup: `/calculators/historical-rate-lookup/?series=${encodeURIComponent(series.entitySlug)}`,
    },
  };
}

export function validateGeneratedApi({ apiDir, openapiPath, expectations = DEFAULT_EXPECTATIONS }) {
  const errors = [];
  let contract;
  try {
    contract = loadOpenApiContract(openapiPath);
  } catch (error) {
    return { errors: [error.message], entityCount: 0, observationCount: 0 };
  }

  const documents = {};
  const topLevelJson = existsSync(apiDir)
    ? readdirSync(apiDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort()
    : [];
  const expectedTopLevelJson = Object.values(STATIC_JSON_FILES).sort();
  if (!deepEqual(topLevelJson, expectedTopLevelJson)) {
    errors.push('api/v1/: top-level JSON file set differs from the documented fixed endpoints');
  }
  for (const [name, relativePath] of Object.entries(STATIC_JSON_FILES)) {
    documents[name] = readJson(apiDir, relativePath, errors);
    validateSchema(contract.validators[name], relativePath, documents[name], errors);
  }
  const { index, meta, metrics, entities, latest, upcoming, historyCoverage } = documents;
  if (!index || !meta || !metrics || !entities || !latest || !upcoming || !historyCoverage) {
    return { errors, entityCount: 0, observationCount: 0 };
  }

  for (const [name, relativePath] of Object.entries(STATIC_JSON_FILES)) {
    if (name !== 'index') compareReleaseMetadata(relativePath, documents[name], index, errors);
  }
  if (index.current_as_of !== String(index.generated_at).slice(0, 10)) {
    errors.push(`index.json: current_as_of ${index.current_as_of} != generated_at date ${String(index.generated_at).slice(0, 10)}`);
  }
  for (const [label, currentAsOf] of Object.entries({
    'entities.json': entities.data?.current_as_of,
    'latest.json': latest.data?.current_as_of,
    'upcoming.json': upcoming.data?.current_as_of,
    'history-coverage.json': historyCoverage.data?.current_as_of,
  })) {
    if (currentAsOf !== index.current_as_of) {
      errors.push(`${label}: current_as_of ${currentAsOf} != ${index.current_as_of}`);
    }
  }
  if (meta.data?.generated_at !== index.generated_at) {
    errors.push(`meta.json data.generated_at ${meta.data?.generated_at} != ${index.generated_at}`);
  }
  if (index.dataset !== meta.data?.title || index.description !== meta.data?.description) {
    errors.push('index.json: dataset identity or description differs from meta.json');
  }
  for (const [name, relativePath] of Object.entries(STATIC_JSON_FILES)) {
    if (name === 'index') continue;
    const document = documents[name];
    if (document?.attribution !== meta.data?.attribution || document?.license !== meta.data?.license) {
      errors.push(`${relativePath}: attribution or license differs from meta.json`);
    }
  }

  const entityDir = join(apiDir, 'entity');
  const names = existsSync(entityDir) ? readdirSync(entityDir) : [];
  const unexpectedEntityFiles = names.filter((file) => !file.endsWith('.json') && !file.endsWith('.csv'));
  if (unexpectedEntityFiles.length) {
    errors.push(`entity/: unexpected file types (${unexpectedEntityFiles.sort().join(', ')})`);
  }
  const jsonFiles = names.filter((file) => file.endsWith('.json')).sort();
  const csvFiles = names.filter((file) => file.endsWith('.csv')).sort();
  const expectedCsvFiles = jsonFiles.map((file) => file.replace(/\.json$/, '.csv'));
  if (!deepEqual(csvFiles, expectedCsvFiles)) {
    errors.push(`entity/: CSV file set does not exactly match the ${jsonFiles.length} JSON entity files`);
  }
  const actualApiFiles = listFilesRecursive(apiDir).sort();
  const expectedApiFiles = [
    ...Object.values(STATIC_JSON_FILES),
    ...jsonFiles.map((file) => `entity/${file}`),
    ...expectedCsvFiles.map((file) => `entity/${file}`),
  ].sort();
  if (!deepEqual(actualApiFiles, expectedApiFiles)) {
    const unexpected = actualApiFiles.filter((file) => !expectedApiFiles.includes(file));
    const missing = expectedApiFiles.filter((file) => !actualApiFiles.includes(file));
    errors.push(
      `api/v1/: generated file inventory differs from the validated contract`
      + `${unexpected.length ? `; unexpected: ${unexpected.join(', ')}` : ''}`
      + `${missing.length ? `; missing: ${missing.join(', ')}` : ''}`,
    );
  }

  const summaries = Array.isArray(entities.data?.entities) ? entities.data.entities : [];
  const summariesBySlug = new Map();
  for (const summary of summaries) {
    if (summariesBySlug.has(summary.slug)) errors.push(`entities.json: duplicate slug ${summary.slug}`);
    summariesBySlug.set(summary.slug, summary);
  }
  const sourceIds = new Set();
  const sources = Array.isArray(meta.data?.sources) ? meta.data.sources : [];
  const releaseTimestamp = Date.parse(index.generated_at);
  for (const source of sources) {
    if (sourceIds.has(source.id)) errors.push(`meta.json: duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    if (Date.parse(source.retrieved_at) > releaseTimestamp) {
      errors.push(`meta.json: source ${source.id} retrieved_at ${source.retrieved_at} is after release generated_at`);
    }
  }

  const records = [];
  const recordsBySlug = new Map();
  let observationCount = 0;
  for (const file of jsonFiles) {
    const envelope = readJson(apiDir, join('entity', file), errors);
    validateSchema(contract.validators.entityJson, `entity/${file}`, envelope, errors);
    if (!envelope?.data) continue;
    compareReleaseMetadata(`entity/${file}`, envelope, index, errors);
    const record = envelope.data;
    records.push(record);
    if (recordsBySlug.has(record.slug)) errors.push(`entity/: duplicate entity slug ${record.slug}`);
    recordsBySlug.set(record.slug, record);

    const filenameSlug = basename(file, '.json');
    if (record.slug !== filenameSlug) {
      errors.push(`entity/${file}: data.slug ${record.slug} does not match its filename`);
    }
    if (record.generated_at !== index.generated_at) {
      errors.push(`entity/${file}: data.generated_at ${record.generated_at} != ${index.generated_at}`);
    }
    if (envelope.attribution !== meta.data?.attribution || envelope.license !== meta.data?.license) {
      errors.push(`entity/${file}: attribution or license differs from meta.json`);
    }
    if (record.current_as_of !== index.current_as_of) {
      errors.push(`entity/${file}: current_as_of ${record.current_as_of} != ${index.current_as_of}`);
    }
    if (!deepEqual(record.latest, record.current)) {
      errors.push(`entity/${file}: latest must remain the exact current-value compatibility alias`);
    }

    const metricKeys = Object.keys(record.history || {});
    for (const [label, value] of Object.entries({
      metrics: record.metrics || [],
      current: Object.keys(record.current || {}),
      latest: Object.keys(record.latest || {}),
      latest_published: Object.keys(record.latest_published || {}),
    })) {
      if (!sameStringSet(metricKeys, value)) {
        errors.push(`entity/${file}: ${label} keys differ from history metrics`);
      }
    }

    for (const [metric, observations] of Object.entries(record.history || {})) {
      const dates = new Set();
      for (const observation of observations) {
        observationCount += 1;
        if (observation.metric !== metric) {
          errors.push(`entity/${file}: history.${metric} contains metric ${observation.metric}`);
        }
        if (dates.has(observation.effective_date)) {
          errors.push(`entity/${file}: history.${metric} repeats effective date ${observation.effective_date}`);
        }
        dates.add(observation.effective_date);
        if (!sourceIds.has(observation.source_id)) {
          errors.push(`entity/${file}: observation references unknown source_id ${observation.source_id}`);
        }
        if (Date.parse(observation.retrieved_at) > releaseTimestamp) {
          errors.push(
            `entity/${file}: observation retrieved_at ${observation.retrieved_at} is after release generated_at`,
          );
        }
      }
      const expectedCurrent = newestObservation(
        observations,
        (observation) => observation.effective_date <= index.current_as_of,
      );
      const expectedPublished = newestObservation(observations);
      if (!deepEqual(record.current?.[metric], expectedCurrent)) {
        errors.push(`entity/${file}: current.${metric} does not match the newest in-force history observation`);
      }
      if (!deepEqual(record.latest_published?.[metric], expectedPublished)) {
        errors.push(`entity/${file}: latest_published.${metric} does not match the newest published history observation`);
      }
    }

    const summary = summariesBySlug.get(record.slug);
    if (!summary) {
      errors.push(`entities.json: missing summary for ${record.slug}`);
    } else {
      const expectedSummary = {
        slug: record.slug,
        name: record.name,
        entity_type: record.entity_type,
        jurisdiction: record.jurisdiction,
        region: record.region,
        latest: record.current,
        current: record.current,
        latest_published: record.latest_published,
        current_as_of: record.current_as_of,
      };
      if (!deepEqual(summary, expectedSummary)) {
        errors.push(`entities.json: summary for ${record.slug} differs from its entity endpoint`);
      }
    }
    compareCsv(apiDir, file, record, contract.validators.entityCsv, errors);
  }

  if (jsonFiles.length !== summaries.length) {
    errors.push(`entity endpoint count ${jsonFiles.length} != entities.json length ${summaries.length}`);
  }
  if (recordsBySlug.size !== summariesBySlug.size) {
    errors.push(`entity endpoint slug count ${recordsBySlug.size} != entities.json slug count ${summariesBySlug.size}`);
  }
  for (const slug of summariesBySlug.keys()) {
    if (!recordsBySlug.has(slug)) errors.push(`entities.json: ${slug} has no entity JSON endpoint`);
  }

  const expectedMetrics = sorted(new Set(records.flatMap((record) => Object.keys(record.history || {}))));
  const metricIndex = Array.isArray(metrics.data?.metrics) ? metrics.data.metrics : [];
  const metaMetrics = Array.isArray(meta.data?.metrics) ? meta.data.metrics : [];
  if (!sameStringSet(metricIndex, expectedMetrics)) {
    errors.push('metrics.json: metrics do not exactly match the entity history metrics');
  }
  if (!sameStringSet(metaMetrics, expectedMetrics)) {
    errors.push('meta.json: metrics do not exactly match the entity history metrics');
  }

  const expectedCurrent = records.flatMap((record) => Object.values(record.current || {}).map(
    (observation) => ({ entity: record.slug, entity_name: record.name, ...observation }),
  ));
  if (!deepEqual(latest.data?.observations, expectedCurrent)) {
    errors.push('latest.json: observations do not exactly match the flattened entity current values');
  }
  const expectedUpcoming = records.flatMap((record) => Object.values(record.history || {})
    .flat()
    .filter((observation) => observation.effective_date > index.current_as_of)
    .map((observation) => ({ entity: record.slug, entity_name: record.name, ...observation })))
    .sort((left, right) => (
      left.effective_date.localeCompare(right.effective_date) || left.entity.localeCompare(right.entity)
    ));
  if (!deepEqual(upcoming.data?.observations, expectedUpcoming)) {
    errors.push('upcoming.json: observations do not exactly match future entity history values');
  }

  const countChecks = [
    ['index.json counts.entities', index.counts?.entities, records.length],
    ['index.json counts.observations', index.counts?.observations, observationCount],
    ['meta.json data.entity_count', meta.data?.entity_count, records.length],
    ['meta.json data.observation_count', meta.data?.observation_count, observationCount],
    ['entities.json data.count', entities.data?.count, summaries.length],
    ['latest.json data.count', latest.data?.count, expectedCurrent.length],
    ['upcoming.json data.count', upcoming.data?.count, expectedUpcoming.length],
    ['history-coverage.json data.count', historyCoverage.data?.count, historyCoverage.data?.series?.length],
  ];
  for (const [label, actual, expected] of countChecks) {
    if (actual !== expected) errors.push(`${label} ${actual} != ${expected}`);
  }

  const historicalSeries = Array.isArray(historyCoverage.data?.series) ? historyCoverage.data.series : [];
  const expectedHistoricalSlugs = sorted(expectations.historicalSlugs ?? DEFAULT_EXPECTATIONS.historicalSlugs);
  const actualHistoricalSlugs = historicalSeries.map((series) => series.entity_slug);
  if (!sameStringSet(actualHistoricalSlugs, expectedHistoricalSlugs)) {
    errors.push(`history-coverage.json: released slugs differ from the ${expectedHistoricalSlugs.length}-series registry`);
  }
  if (new Set(actualHistoricalSlugs).size !== actualHistoricalSlugs.length) {
    errors.push('history-coverage.json: duplicate released series');
  }
  if (index.counts?.historical_lookup_series !== expectedHistoricalSlugs.length) {
    errors.push(`index.json counts.historical_lookup_series ${index.counts?.historical_lookup_series} != ${expectedHistoricalSlugs.length}`);
  }
  for (const series of historicalSeries) {
    const record = recordsBySlug.get(series.entity_slug);
    if (!record) {
      errors.push(`history-coverage.json: ${series.entity_slug} has no entity endpoint`);
      continue;
    }
    let expectedSeries = expectations.historicalCoverageBySlug?.[series.entity_slug];
    if (!expectedSeries) {
      try {
        expectedSeries = expectedHistoricalCoverageSeries(
          record,
          index.current_as_of,
          meta.data?.sources || [],
        );
      } catch (error) {
        errors.push(`history-coverage.json ${series.entity_slug}: cannot reconstruct released contract (${error.message})`);
      }
    }
    if (!expectedSeries) {
      errors.push(`history-coverage.json ${series.entity_slug}: no reviewed historical release contract exists`);
    } else if (!deepEqual(series, expectedSeries)) {
      errors.push(
        `history-coverage.json ${series.entity_slug}: series does not exactly match the reviewed release registry and source-derived coverage`,
      );
    }
    const releasedHistory = (record.history?.[series.metric] || []).filter(
      (observation) => observation.effective_date <= index.current_as_of,
    );
    const historyDates = releasedHistory.map((observation) => observation.effective_date);
    if (series.history_count !== releasedHistory.length) {
      errors.push(`history-coverage.json ${series.entity_slug}: history_count ${series.history_count} != ${releasedHistory.length}`);
    }
    if (series.coverage_start !== sorted(historyDates)[0]) {
      errors.push(`history-coverage.json ${series.entity_slug}: coverage_start differs from entity history`);
    }
    if (series.coverage_end > index.current_as_of || series.coverage_start > series.coverage_end) {
      errors.push(`history-coverage.json ${series.entity_slug}: coverage dates exceed the released lookup boundary`);
    }
    if (series.usage !== 'reference_only' || series.calculation_supported !== false) {
      errors.push(`history-coverage.json ${series.entity_slug}: released historical lookup must remain reference-only`);
    }
    const expectedLinks = {
      page: `/rates/${series.entity_slug}/`,
      entity_json: `/api/v1/entity/${series.entity_slug}.json`,
      entity_csv: `/api/v1/entity/${series.entity_slug}.csv`,
      historical_lookup: `/calculators/historical-rate-lookup/?series=${encodeURIComponent(series.entity_slug)}`,
    };
    if (!deepEqual(series.links, expectedLinks)) {
      errors.push(`history-coverage.json ${series.entity_slug}: links differ from the canonical API/page routes`);
    }
    const orderedGaps = [...(series.gaps || [])].sort((left, right) => left.start.localeCompare(right.start));
    for (let gapIndex = 0; gapIndex < orderedGaps.length; gapIndex += 1) {
      const gap = orderedGaps[gapIndex];
      if (gap.start > gap.end) errors.push(`history-coverage.json ${series.entity_slug}: gap ends before it starts`);
      if (gap.start < series.coverage_start || gap.end > series.coverage_end) {
        errors.push(`history-coverage.json ${series.entity_slug}: gap falls outside released coverage`);
      }
      if (gapIndex > 0 && gap.start <= orderedGaps[gapIndex - 1].end) {
        errors.push(`history-coverage.json ${series.entity_slug}: gaps overlap or duplicate one another`);
      }
    }
  }
  const expectedNebraskaGap = expectations.nebraskaGap === undefined
    ? DEFAULT_EXPECTATIONS.nebraskaGap
    : expectations.nebraskaGap;
  const nebraska = historicalSeries.find((series) => series.entity_slug === 'nebraska-judgment-rate');
  if (expectedNebraskaGap && (
    nebraska?.gaps?.[0]?.start !== expectedNebraskaGap.start
    || nebraska?.gaps?.[0]?.end !== expectedNebraskaGap.end
  )) {
    errors.push('history-coverage.json: Nebraska verified publication gap is missing or changed');
  }

  if (expectations.validateFederalDateSemantics !== false) {
    validateFederalDateSemantics(recordsBySlug, errors);
  }

  return { errors, entityCount: records.length, observationCount };
}
