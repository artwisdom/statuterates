import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import {
  buildNevadaOfficialHistory,
  buildOklahomaOfficialHistory,
  NEVADA_FID_2026_JULY_NOTICE_URL,
  NEVADA_FID_HISTORY_URL,
  NEVADA_HISTORY_PROJECTION_SHA256,
  NEVADA_TUPLES,
  NEVADA_TUPLES_SHA256,
  NEVADA_UNAVAILABLE_OFFICIAL_ROWS,
  OKLAHOMA_2013_REGIME_EVENTS,
  OKLAHOMA_2025_HISTORY_NOTICE_URL,
  OKLAHOMA_2026_NOTICE_URL,
  OKLAHOMA_HISTORY_PROJECTION_SHA256,
  OKLAHOMA_TUPLES,
  OKLAHOMA_TUPLES_SHA256,
} from './nevada-oklahoma-judgment-history.mjs';

const checksum = (value) => createHash('sha256')
  .update(JSON.stringify(value))
  .digest('hex');

test('Nevada exact official tuples, projection, formula, and unavailable first row are locked', () => {
  const history = buildNevadaOfficialHistory();

  assert.equal(NEVADA_TUPLES.length, 79);
  assert.equal(checksum(NEVADA_TUPLES), NEVADA_TUPLES_SHA256);
  assert.equal(
    checksum(NEVADA_TUPLES.map(([effectiveDate, , rate]) => [effectiveDate, rate])),
    NEVADA_HISTORY_PROJECTION_SHA256,
  );
  assert.deepEqual(NEVADA_UNAVAILABLE_OFFICIAL_ROWS, [['1987-01-01', 'not_available']]);
  assert.deepEqual(
    [history[0].effective_date, history[0].value, history.at(-1).effective_date, history.at(-1).value],
    ['1987-07-01', 10.25, '2026-07-01', 8.75],
  );
  assert.equal(history.find((row) => row.effective_date === '2025-07-01').value, 9.5);
  assert.ok(history.every((row) => Math.abs(row.value - row.prime_rate - 2) < 1e-9));
  assert.ok(history.slice(0, -1).every((row) => row.source_url === NEVADA_FID_HISTORY_URL));
  assert.equal(history.at(-1).source_url, NEVADA_FID_2026_JULY_NOTICE_URL);
});

test('Oklahoma exact official tuples and 2013 legal regimes are locked without fake rate changes', () => {
  const history = buildOklahomaOfficialHistory();

  assert.equal(OKLAHOMA_TUPLES.length, 41);
  assert.equal(checksum(OKLAHOMA_TUPLES), OKLAHOMA_TUPLES_SHA256);
  assert.equal(checksum(OKLAHOMA_TUPLES), OKLAHOMA_HISTORY_PROJECTION_SHA256);
  assert.deepEqual(
    [history[0].effective_date, history[0].value, history.at(-1).effective_date, history.at(-1).value],
    ['1986-11-01', 11.65, '2026-01-01', 8.75],
  );
  assert.equal(history.find((row) => row.effective_date === '2004-01-01').value, 5.01);
  assert.equal(history.find((row) => row.effective_date === '2005-01-01').value, 7.25);
  assert.equal(history.filter((row) => row.effective_date.startsWith('2013-')).length, 1);
  assert.deepEqual(OKLAHOMA_2013_REGIME_EVENTS, [
    ['2013-01-01', 'original_2013_notice_period_begins', 5.25],
    ['2013-07-01', 'amended_notice_2004_section_727_1_period_begins', 5.25],
    ['2013-11-01', 'reenacted_section_727_1_current_formula_period_begins', 5.25],
  ]);
  assert.ok(history.slice(0, -1).every((row) => row.source_url === OKLAHOMA_2025_HISTORY_NOTICE_URL));
  assert.equal(history.at(-1).source_url, OKLAHOMA_2026_NOTICE_URL);
});
