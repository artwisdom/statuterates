import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPROVED_HISTORICAL_RATE_SLUGS,
  HISTORICAL_RATE_RELEASES,
  historicalRateAtDate,
  historicalRateReleaseForEntitySlug,
  historicalRateSeriesForEntity,
} from './historical-rate-releases.mjs';

const EXPECTED_RELEASE_SLUGS = [
    'alaska-judgment-rate',
    'florida-judgment-rate',
    'georgia-judgment-rate',
    'idaho-judgment-rate',
    'iowa-judgment-rate',
    'kentucky-judgment-rate',
    'louisiana-judgment-rate',
    'maine-judgment-rate',
    'michigan-judgment-rate',
    'minnesota-judgment-rate',
    'nebraska-judgment-rate',
    'nevada-judgment-rate',
    'new-jersey-judgment-rate',
    'new-york-consumer-debt-judgment-rate',
    'north-dakota-judgment-rate',
    'oklahoma-judgment-rate',
    'tennessee-judgment-rate',
    'texas-judgment-rate',
    'utah-judgment-rate',
    'west-virginia-judgment-rate',
    'wisconsin-judgment-rate',
];

test('historical lookup registry exposes only the explicit reviewed contract', () => {
  assert.equal(HISTORICAL_RATE_RELEASES.length, EXPECTED_RELEASE_SLUGS.length);
  assert.equal(new Set(APPROVED_HISTORICAL_RATE_SLUGS).size, EXPECTED_RELEASE_SLUGS.length);
  assert.deepEqual(APPROVED_HISTORICAL_RATE_SLUGS, EXPECTED_RELEASE_SLUGS);
  assert.equal(historicalRateReleaseForEntitySlug('california-judgment-rate'), null);
});

test('branch-sensitive releases state their distinct date meanings and legal-era limits', () => {
  const minnesota = historicalRateReleaseForEntitySlug('minnesota-judgment-rate');
  const nevada = historicalRateReleaseForEntitySlug('nevada-judgment-rate');
  const oklahoma = historicalRateReleaseForEntitySlug('oklahoma-judgment-rate');
  const tennessee = historicalRateReleaseForEntitySlug('tennessee-judgment-rate');

  assert.equal(minnesota.inputMeaning, 'Rate-schedule reference date');
  assert.match(minnesota.selectionRule, /general percentage follows the accrual year/);
  assert.match(minnesota.selectionRule, /qualifying judgments entered on or after August 1, 2009/);
  assert.match(nevada.branchScope, /causes of action arising on or after July 1, 1987/);
  assert.match(oklahoma.branchScope, /predecessor §727 regimes and current 12 O\.S\. §727\.1/);
  assert.match(oklahoma.selectionRule, /does not back-apply that method to earlier regimes/);
  assert.equal(tennessee.inputMeaning, 'Judgment-entry date');
  assert.match(tennessee.selectionRule, /selected rate remains fixed/);
  assert.match(tennessee.selectionRule, /does not decide the separate accrual date/);
});

test('historical selector refuses bounds and an explicit source gap', () => {
  const history = [
    { effective_date: '2000-01-01', value: 7, source_url: 'https://example.gov/one' },
    { effective_date: '2002-07-20', value: 6, source_url: 'https://example.gov/two' },
  ];
  assert.equal(historicalRateAtDate(history, '2000-06-01', { coverageThrough: '2026-01-01' }).value, 7);
  assert.throws(
    () => historicalRateAtDate(history, '2001-06-01', {
      coverageThrough: '2026-01-01',
      gaps: [{ start: '2001-03-14', end: '2002-07-19', reason: 'Official source gap.' }],
    }),
    /Official source gap/,
  );
  assert.throws(() => historicalRateAtDate(history, '1999-12-31', { coverageThrough: '2026-01-01' }), /begins 2000-01-01/);
  assert.throws(() => historicalRateAtDate(history, '2026-01-02', { coverageThrough: '2026-01-01' }), /ends 2026-01-01/);
});

test('series builder validates release shape, provenance, and metadata coverage', () => {
  const entity = {
    slug: 'west-virginia-judgment-rate',
    metadata: {
      calculation: { curated_history_complete_through: '2026-12-31' },
      official_authorities: [{ label: 'Rule', url: 'https://example.gov/rule' }],
    },
    history: {
      annual_rate: [
        { effective_date: '2026-01-01', value: 6.25, value_text: '6.25%', source_url: 'https://example.gov/2026' },
        { effective_date: '2025-01-01', value: 7, value_text: '7%', source_url: 'https://example.gov/2025' },
      ],
    },
  };
  const series = historicalRateSeriesForEntity(entity, '2026-08-22');
  assert.equal(series.minDate, '2025-01-01');
  assert.equal(series.maxDate, '2026-08-22');
  assert.equal(series.historyCount, 2);
  assert.equal(series.officialAuthorities.length, 1);
});

test('source-check coverage advances from the source receipt without rewriting an unchanged observation', () => {
  const entity = {
    slug: 'georgia-judgment-rate',
    metadata: {
      statute: 'O.C.G.A. §7-4-12',
      official_statute_url: 'https://example.gov/georgia-code',
    },
    history: {
      annual_rate: [
        { effective_date: '2025-01-01', value: 10, source_id: 'ga-code', source_url: 'https://example.gov/prime', retrieved_at: '2025-01-01T00:00:00Z' },
        { effective_date: '2026-01-01', value: 9, source_id: 'ga-code', source_url: 'https://example.gov/prime', retrieved_at: '2026-01-01T00:00:00Z' },
      ],
    },
  };
  assert.throws(
    () => historicalRateSeriesForEntity(entity, '2026-08-22'),
    /successful source-check receipt ga-code is unavailable/,
  );
  const series = historicalRateSeriesForEntity(entity, '2026-08-22', {
    sources: [{ id: 'ga-code', retrieved_at: '2026-08-22T12:00:00Z' }],
  });
  assert.equal(series.maxDate, '2026-08-22');
  assert.equal(series.history.at(-1).retrieved_at, '2026-01-01T00:00:00Z');
  assert.deepEqual(series.officialAuthorities, [{
    label: 'O.C.G.A. §7-4-12 — official text',
    url: 'https://example.gov/georgia-code',
  }]);
});
