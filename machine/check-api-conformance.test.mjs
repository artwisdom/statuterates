import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  CSV_HEADER,
  parseCsv,
  parseOpenApiContract,
  validateFederalDateSemantics,
  validateGeneratedApi,
} from './api-contract.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPENAPI = resolve(__dirname, 'openapi.yaml');
const GENERATED_AT = '2026-09-03T12:00:00.000Z';
const CURRENT_AS_OF = '2026-09-03';
const EXPECTATIONS = Object.freeze({
  historicalSlugs: ['history-rate'],
  validateFederalDateSemantics: false,
  nebraskaGap: null,
  historicalCoverageBySlug: {
    'history-rate': {
      entity_slug: 'history-rate',
      label: 'History Rate',
      metric: 'annual_rate',
      usage: 'reference_only',
      calculation_supported: false,
      input_meaning: 'Synthetic lookup date',
      branch_scope: 'Synthetic general branch only.',
      selection_rule: 'Newest effective observation on or before the requested date.',
      coverage_note: 'Synthetic coverage for contract tests.',
      coverage_start: '2025-01-01',
      coverage_end: CURRENT_AS_OF,
      history_count: 2,
      gaps: [],
      source_url: 'https://example.gov/rates',
      official_authorities: [{ label: 'Synthetic authority', url: 'https://example.gov/statute' }],
      links: {
        page: '/rates/history-rate/',
        entity_json: '/api/v1/entity/history-rate.json',
        entity_csv: '/api/v1/entity/history-rate.csv',
        historical_lookup: '/calculators/historical-rate-lookup/?series=history-rate',
      },
    },
  },
});

function observation(effectiveDate, value, suffix) {
  return {
    metric: 'annual_rate',
    value,
    value_text: `${value}%`,
    unit: 'percent_per_annum',
    effective_date: effectiveDate,
    source_id: 'source-one',
    source_url: 'https://example.gov/rates',
    retrieved_at: GENERATED_AT,
    confidence: 'high',
    method: `official-${suffix}`,
    notes: `Verified ${suffix}.`,
  };
}

function record(slug, name, history, currentIndex, publishedIndex) {
  const current = history[currentIndex];
  const latestPublished = history[publishedIndex];
  return {
    slug,
    name,
    entity_type: 'rate_series',
    jurisdiction: 'US',
    region: 'Test region',
    locale: null,
    metrics: ['annual_rate'],
    generated_at: GENERATED_AT,
    latest: { annual_rate: current },
    current: { annual_rate: current },
    latest_published: { annual_rate: latestPublished },
    current_as_of: CURRENT_AS_OF,
    metadata: {},
    history: { annual_rate: history },
  };
}

function envelope(data) {
  return {
    api_version: 'v1',
    generated_at: GENERATED_AT,
    attribution: 'Test attribution',
    license: 'Test license',
    data,
  };
}

function summary(entity) {
  return {
    slug: entity.slug,
    name: entity.name,
    entity_type: entity.entity_type,
    jurisdiction: entity.jurisdiction,
    region: entity.region,
    latest: entity.current,
    current: entity.current,
    latest_published: entity.latest_published,
    current_as_of: entity.current_as_of,
  };
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvFor(entity) {
  const rows = [CSV_HEADER];
  for (const [metric, observations] of Object.entries(entity.history)) {
    for (const item of observations) {
      rows.push([
        entity.slug,
        metric,
        item.effective_date,
        item.value,
        item.unit,
        item.confidence,
        item.method,
        item.source_url,
        item.retrieved_at,
      ]);
    }
  }
  return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function buildFixture() {
  const root = mkdtempSync(join(tmpdir(), 'statuterates-api-contract-'));
  const apiDir = join(root, 'api', 'v1');
  const entityDir = join(apiDir, 'entity');
  mkdirSync(entityDir, { recursive: true });

  const future = record(
    'future-rate',
    'Future Rate',
    [observation('2026-01-01', 4, 'current'), observation('2026-10-01', 5, 'future')],
    0,
    1,
  );
  const history = record(
    'history-rate',
    'History Rate',
    [observation('2025-01-01', 5, 'older'), observation('2026-01-01', 6, 'newer')],
    1,
    1,
  );
  const records = [future, history];
  const currentRows = records.map((entity) => ({
    entity: entity.slug,
    entity_name: entity.name,
    ...entity.current.annual_rate,
  }));
  const upcomingRows = [{
    entity: future.slug,
    entity_name: future.name,
    ...future.latest_published.annual_rate,
  }];

  writeJson(join(apiDir, 'index.json'), {
    api_version: 'v1',
    dataset: 'StatuteRates test fixture',
    description: 'A complete, synthetic contract fixture.',
    generated_at: GENERATED_AT,
    endpoints: {
      meta: '/api/v1/meta.json',
      entities: '/api/v1/entities.json',
      latest: '/api/v1/latest.json',
      upcoming: '/api/v1/upcoming.json',
      metrics: '/api/v1/metrics.json',
      history_coverage: '/api/v1/history-coverage.json',
      entity: '/api/v1/entity/{slug}.json',
      entity_csv: '/api/v1/entity/{slug}.csv',
      documentation: '/api/',
      openapi: '/openapi.yaml',
      llms: '/llms.txt',
      llms_full: '/llms-full.txt',
    },
    current_as_of: CURRENT_AS_OF,
    counts: { entities: 2, observations: 4, historical_lookup_series: 1 },
  });
  writeJson(join(apiDir, 'meta.json'), envelope({
    title: 'StatuteRates test fixture',
    description: 'A complete, synthetic contract fixture.',
    version: '0.0.0-test',
    update_cadence: 'Never',
    attribution: 'Test attribution',
    license: 'Test license',
    sample_query: 'history',
    disclaimer: 'Synthetic test data.',
    generated_at: GENERATED_AT,
    entity_count: 2,
    observation_count: 4,
    metrics: ['annual_rate'],
    sources: [{
      id: 'source-one',
      name: 'Official synthetic source',
      publisher: 'Example government',
      home_url: 'https://example.gov/rates',
      license: 'Government test fixture',
      robots_status: 'synthetic',
      retrieved_at: GENERATED_AT,
    }],
  }));
  writeJson(join(apiDir, 'metrics.json'), envelope({ metrics: ['annual_rate'] }));
  writeJson(join(apiDir, 'entities.json'), envelope({
    count: 2,
    current_as_of: CURRENT_AS_OF,
    entities: records.map(summary),
  }));
  writeJson(join(apiDir, 'latest.json'), envelope({
    count: 2,
    current_as_of: CURRENT_AS_OF,
    observations: currentRows,
  }));
  writeJson(join(apiDir, 'upcoming.json'), envelope({
    count: 1,
    current_as_of: CURRENT_AS_OF,
    observations: upcomingRows,
  }));
  writeJson(join(apiDir, 'history-coverage.json'), envelope({
    count: 1,
    current_as_of: CURRENT_AS_OF,
    series: [{
      entity_slug: 'history-rate',
      label: 'History Rate',
      metric: 'annual_rate',
      usage: 'reference_only',
      calculation_supported: false,
      input_meaning: 'Synthetic lookup date',
      branch_scope: 'Synthetic general branch only.',
      selection_rule: 'Newest effective observation on or before the requested date.',
      coverage_note: 'Synthetic coverage for contract tests.',
      coverage_start: '2025-01-01',
      coverage_end: CURRENT_AS_OF,
      history_count: 2,
      gaps: [],
      source_url: 'https://example.gov/rates',
      official_authorities: [{ label: 'Synthetic authority', url: 'https://example.gov/statute' }],
      links: {
        page: '/rates/history-rate/',
        entity_json: '/api/v1/entity/history-rate.json',
        entity_csv: '/api/v1/entity/history-rate.csv',
        historical_lookup: '/calculators/historical-rate-lookup/?series=history-rate',
      },
    }],
  }));
  for (const entity of records) {
    writeJson(join(entityDir, `${entity.slug}.json`), envelope(entity));
    writeFileSync(join(entityDir, `${entity.slug}.csv`), csvFor(entity));
  }
  return { root, apiDir };
}

function validate(apiDir, openapiPath = OPENAPI) {
  return validateGeneratedApi({ apiDir, openapiPath, expectations: EXPECTATIONS });
}

function mutateJson(apiDir, relativePath, mutate) {
  const path = join(apiDir, relativePath);
  const value = JSON.parse(readFileSync(path, 'utf8'));
  mutate(value);
  writeJson(path, value);
}

function expectFailure(mutate, pattern) {
  const fixture = buildFixture();
  try {
    mutate(fixture);
    const result = validate(fixture.apiDir, fixture.openapiPath || OPENAPI);
    assert.ok(result.errors.length > 0, 'the mutation must fail closed');
    assert.match(result.errors.join('\n'), pattern);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
}

test('the complete synthetic API fixture satisfies its endpoint schemas and semantic relations', () => {
  const fixture = buildFixture();
  try {
    assert.deepEqual(validate(fixture.apiDir), { errors: [], entityCount: 2, observationCount: 4 });
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('the CSV parser handles quoted commas, quotes, and embedded newlines', () => {
  assert.deepEqual(
    parseCsv('a,b,c\r\n1,"two, ""quoted""","three\nlines"\r\n'),
    [['a', 'b', 'c'], ['1', 'two, "quoted"', 'three\nlines']],
  );
  assert.throws(() => parseCsv('a,"unterminated\n'), /unterminated quoted field/);
  assert.throws(() => parseCsv('a,"closed"tail\n'), /unexpected character after a closing quote/);
});

test('the OpenAPI contract rejects operations outside the static read-only GET surface', () => {
  const openapi = readFileSync(OPENAPI, 'utf8');
  const mutated = openapi.replace(
    '  /api/v1/index.json:\n    get:',
    '  /api/v1/index.json:\n    post:\n      operationId: forbiddenPost\n    get:',
  );
  assert.notEqual(mutated, openapi, 'the OpenAPI mutation anchor must exist');
  assert.throws(() => parseOpenApiContract(mutated), /unsupported operation\(s\): post/);
});

test('OpenAPI response schemas reject a rate with the wrong JSON type', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'latest.json', (document) => {
      document.data.observations[0].value = '4';
    });
  }, /latest\.json.*value/);
});

test('endpoint-specific schemas reject a response with the wrong data shape', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'metrics.json', (document) => {
      document.data = { count: 0, entities: [] };
    });
  }, /metrics\.json.*metrics/);
});

test('cross-file validation rejects count and release-timestamp drift', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'index.json', (document) => {
      document.counts.observations = 999;
    });
    mutateJson(apiDir, 'entities.json', (document) => {
      document.generated_at = '2026-09-04T12:00:00.000Z';
    });
  }, /entities\.json: generated_at[\s\S]*counts\.observations 999 != 4/);
});

test('release attribution and license metadata must agree across every envelope', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'latest.json', (document) => {
      document.attribution = 'Unrelated attribution';
      document.license = 'Unrelated license';
    });
  }, /latest\.json: attribution or license differs from meta\.json/);
});

test('undocumented files cannot escape the generated API validation inventory', () => {
  expectFailure(({ apiDir }) => {
    writeJson(join(apiDir, 'shadow', 'extra.json'), { unvalidated: true });
  }, /unexpected: shadow\/extra\.json/);
});

test('provenance and metric relations reject unresolved or mislabeled history', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'entity/history-rate.json', (document) => {
      document.data.history.annual_rate[0].source_id = 'missing-source';
      document.data.history.annual_rate[0].metric = 'wrong_metric';
    });
  }, /history\.annual_rate contains metric wrong_metric[\s\S]*unknown source_id missing-source/);
});

test('OpenAPI provenance requirements reject missing and malformed source fields', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'entity/history-rate.json', (document) => {
      delete document.data.history.annual_rate[0].source_id;
      document.data.history.annual_rate[1].source_url = 'not-a-url';
      document.data.history.annual_rate[1].confidence = 'certain';
    });
  }, /source_id[\s\S]*source_url[\s\S]*confidence/);
});

test('OpenAPI date formats reject impossible calendar dates', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'entity/history-rate.json', (document) => {
      document.data.history.annual_rate[0].effective_date = '2026-02-30';
    });
  }, /effective_date.*must match format "date"/);
});

test('source and observation retrieval timestamps cannot postdate the generated release', () => {
  expectFailure(({ apiDir }) => {
    const futureTimestamp = '2099-01-01T00:00:00.000Z';
    mutateJson(apiDir, 'meta.json', (document) => {
      document.data.sources[0].retrieved_at = futureTimestamp;
    });
    mutateJson(apiDir, 'entity/history-rate.json', (document) => {
      document.data.history.annual_rate[0].retrieved_at = futureTimestamp;
    });
    const csvPath = join(apiDir, 'entity', 'history-rate.csv');
    writeFileSync(csvPath, readFileSync(csvPath, 'utf8').replace(GENERATED_AT, futureTimestamp));
  }, /source source-one retrieved_at[\s\S]*observation retrieved_at/);
});

test('current and latest-published values must be selected from history with exact date semantics', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'entity/future-rate.json', (document) => {
      document.data.latest_published = document.data.current;
    });
  }, /latest_published\.annual_rate does not match the newest published history observation/);
});

test('a future observation cannot be promoted consistently into the current aggregates', () => {
  expectFailure(({ apiDir }) => {
    let futureObservation;
    mutateJson(apiDir, 'entity/future-rate.json', (document) => {
      futureObservation = document.data.latest_published.annual_rate;
      document.data.current.annual_rate = futureObservation;
      document.data.latest.annual_rate = futureObservation;
    });
    mutateJson(apiDir, 'entities.json', (document) => {
      const entity = document.data.entities.find((item) => item.slug === 'future-rate');
      entity.current.annual_rate = futureObservation;
      entity.latest.annual_rate = futureObservation;
    });
    mutateJson(apiDir, 'latest.json', (document) => {
      const index = document.data.observations.findIndex((item) => item.entity === 'future-rate');
      document.data.observations[index] = {
        entity: 'future-rate',
        entity_name: 'Future Rate',
        ...futureObservation,
      };
    });
  }, /current\.annual_rate does not match the newest in-force history observation/);
});

test('federal paired histories require finite numeric values', () => {
  const errors = [];
  validateFederalDateSemantics(new Map([
    ['treasury-1-year-cmt', { history: { annual_rate: [observation('2000-12-11', null, 'source')] } }],
    ['us-federal-post-judgment', {
      metadata: {
        date_semantics: 'judgment-applicability-week-start',
        source_week_offset_days: -7,
      },
      history: { annual_rate: [observation('2000-12-18', null, 'judgment')] },
    }],
  ]), errors);
  assert.match(errors.join('\n'), /paired judgment and CMT values must be finite numbers/);
});

test('federal source and applicability histories require Monday week starts', () => {
  const errors = [];
  validateFederalDateSemantics(new Map([
    ['treasury-1-year-cmt', { history: { annual_rate: [
      observation('2000-01-04', 4, 'pre-rule-source'),
      observation('2000-12-12', 5, 'source'),
    ] } }],
    ['us-federal-post-judgment', {
      metadata: {
        date_semantics: 'judgment-applicability-week-start',
        source_week_offset_days: -7,
      },
      history: { annual_rate: [observation('2000-12-19', 5, 'judgment')] },
    }],
  ]), errors);
  assert.match(errors.join('\n'), /treasury 1-year CMT 2000-01-04: source week must start on Monday/);
  assert.match(errors.join('\n'), /treasury 1-year CMT 2000-12-12: source week must start on Monday/);
  assert.match(errors.join('\n'), /applicability week must start on Monday/);
});

test('federal histories require the exact eligible CMT date set shifted by seven days', () => {
  const errors = [];
  validateFederalDateSemantics(new Map([
    ['treasury-1-year-cmt', { history: { annual_rate: [
      observation('2000-12-04', 4, 'pre-rule-source'),
      observation('2000-12-11', 5, 'eligible-source-one'),
      observation('2000-12-18', 6, 'eligible-source-two'),
    ] } }],
    ['us-federal-post-judgment', {
      metadata: {
        date_semantics: 'judgment-applicability-week-start',
        source_week_offset_days: -7,
      },
      history: { annual_rate: [
        observation('2000-12-11', 4, 'unexpected-pre-rule-pair'),
        observation('2000-12-25', 6, 'eligible-pair-two'),
      ] },
    }],
  ]), errors);
  assert.match(
    errors.join('\n'),
    /dates do not exactly equal eligible CMT source weeks shifted by seven days.*missing: 2000-12-18; unexpected: 2000-12-11/,
  );
});

test('the upcoming aggregate must exactly equal the future entity observations', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'upcoming.json', (document) => {
      document.data.observations = [];
      document.data.count = 0;
    });
  }, /upcoming\.json: observations do not exactly match future entity history values/);
});

test('historical lookup refusal gaps must remain inside the released coverage boundary', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'history-coverage.json', (document) => {
      document.data.series[0].gaps = [{
        start: '2099-01-01',
        end: '2099-01-02',
        reason: 'Impossible future test gap.',
      }];
    });
  }, /gap falls outside released coverage/);
});

test('historical lookup legal meaning and coverage must exactly match its reviewed release contract', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'history-coverage.json', (document) => {
      document.data.series[0].branch_scope = 'Unreviewed generic branch.';
    });
  }, /does not exactly match the reviewed release registry and source-derived coverage/);
});

test('every CSV row must exactly match its JSON history projection', () => {
  expectFailure(({ apiDir }) => {
    const path = join(apiDir, 'entity', 'history-rate.csv');
    writeFileSync(path, readFileSync(path, 'utf8').replace(',5,percent_per_annum,', ',55,percent_per_annum,'));
  }, /history-rate\.csv: row 2 does not exactly match/);
});

test('an entity slug must match its endpoint filename', () => {
  expectFailure(({ apiDir }) => {
    mutateJson(apiDir, 'entity/history-rate.json', (document) => {
      document.data.slug = 'renamed-rate';
    });
  }, /data\.slug renamed-rate does not match its filename/);
});
