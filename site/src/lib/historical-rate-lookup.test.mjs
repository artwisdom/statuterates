import test from 'node:test';
import assert from 'node:assert/strict';

import { getEntity, getMeta } from './data.mjs';
import {
  HISTORICAL_RATE_RELEASES,
  historicalRateAtDate,
  historicalRateSeriesForEntity,
  releasedHistoricalValue,
} from './historical-rate-lookup.mjs';

const history = [
  { effective_date: '2026-07-01', value: 7.25, value_text: '7.25%' },
  { effective_date: '2026-01-01', value: 7, value_text: '7%' },
  { effective_date: '2025-07-01', value: 6.5, value_text: '6.5%' },
];

test('historical lookup selects the latest period on or before the requested date', () => {
  assert.equal(historicalRateAtDate(history, '2026-03-15', { coverageThrough: '2026-08-20' }).value_text, '7%');
  assert.equal(historicalRateAtDate(history, '2026-07-01', { coverageThrough: '2026-08-20' }).value_text, '7.25%');
});

test('historical lookup refuses dates before verified coverage', () => {
  assert.throws(
    () => historicalRateAtDate(history, '2025-06-30', { coverageThrough: '2026-08-20' }),
    /Verified coverage begins 2025-07-01/,
  );
});

test('historical lookup refuses dates after the source-aware coverage end', () => {
  assert.throws(
    () => historicalRateAtDate(history, '2026-08-21', { coverageThrough: '2026-08-20' }),
    /Verified coverage ends 2026-08-20/,
  );
});

test('historical lookup rejects invalid dates and missing histories', () => {
  assert.throws(() => historicalRateAtDate(history, '2026-02-30', { coverageThrough: '2026-08-20' }), /valid calendar date/);
  assert.throws(() => historicalRateAtDate([], '2026-01-01', { coverageThrough: '2026-08-20' }), /No verified history/);
  assert.throws(() => historicalRateAtDate(history, '2026-01-01'), /Verified coverage end must use YYYY-MM-DD/);
});

test('all released production series satisfy the shared source and coverage contract', () => {
  const meta = getMeta();
  const snapshotDate = String(meta.generated_at).slice(0, 10);
  const built = HISTORICAL_RATE_RELEASES.map((release) =>
    historicalRateSeriesForEntity(getEntity(release.entitySlug), snapshotDate, { sources: meta.sources }));
  assert.equal(built.length, HISTORICAL_RATE_RELEASES.length);
  assert.ok(built.every((series) => series.historyCount >= 2));
  assert.ok(built.every((series) => series.history.every((point) => point.source_url.startsWith('https://'))));
  assert.ok(built.every((series) => series.officialAuthorities.length >= 1));
});

test('released branch transitions and Nebraska gap remain fail closed', () => {
  const meta = getMeta();
  const snapshotDate = String(meta.generated_at).slice(0, 10);
  const options = { sources: meta.sources };
  assert.equal(
    releasedHistoricalValue(getEntity('new-jersey-judgment-rate'), '1996-08-31', snapshotDate, options).observation.value_text,
    '5.5%',
  );
  assert.equal(
    releasedHistoricalValue(getEntity('new-jersey-judgment-rate'), '1996-09-01', snapshotDate, options).observation.value_text,
    '5.5% / 7.5%',
  );
  assert.equal(
    releasedHistoricalValue(getEntity('new-york-consumer-debt-judgment-rate'), '2022-04-29', snapshotDate, options).observation.value_text,
    '9%',
  );
  assert.equal(
    releasedHistoricalValue(getEntity('new-york-consumer-debt-judgment-rate'), '2022-04-30', snapshotDate, options).observation.value_text,
    '2%',
  );
  assert.throws(
    () => releasedHistoricalValue(getEntity('nebraska-judgment-rate'), '2002-01-01', snapshotDate, options),
    /no verified observation covering this interval/i,
  );
});

test('newly released state histories preserve branch transitions and refuse unverified early dates', () => {
  const meta = getMeta();
  const snapshotDate = String(meta.generated_at).slice(0, 10);
  const options = { sources: meta.sources };

  assert.equal(
    releasedHistoricalValue(getEntity('minnesota-judgment-rate'), '2009-07-31', snapshotDate, options).observation.value_text,
    '4%',
  );
  assert.equal(
    releasedHistoricalValue(getEntity('minnesota-judgment-rate'), '2009-08-01', snapshotDate, options).observation.value_text,
    '4% / 10%',
  );

  assert.throws(
    () => releasedHistoricalValue(getEntity('wisconsin-judgment-rate'), '2011-12-01', snapshotDate, options),
    /begins 2011-12-02/,
  );
  assert.equal(
    releasedHistoricalValue(getEntity('wisconsin-judgment-rate'), '2011-12-02', snapshotDate, options).observation.value_text,
    '4.25%',
  );

  assert.throws(
    () => releasedHistoricalValue(getEntity('nevada-judgment-rate'), '1987-06-30', snapshotDate, options),
    /begins 1987-07-01/,
  );
  assert.equal(
    releasedHistoricalValue(getEntity('nevada-judgment-rate'), '1987-07-01', snapshotDate, options).observation.value_text,
    '10.25%',
  );

  assert.throws(
    () => releasedHistoricalValue(getEntity('oklahoma-judgment-rate'), '1986-10-31', snapshotDate, options),
    /begins 1986-11-01/,
  );
  assert.equal(
    releasedHistoricalValue(getEntity('oklahoma-judgment-rate'), '1986-11-01', snapshotDate, options).observation.value_text,
    '11.65%',
  );
});
