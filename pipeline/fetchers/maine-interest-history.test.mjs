import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMaineOfficialHistory,
  deriveMaineAnnualRateFromH15,
  MAINE_POSTJUDGMENT_CHART_URL,
  validateMaineOfficialHistory,
} from './maine-interest-history.mjs';

test('Maine official charts contain 24 exact annual rows through 2026', () => {
  const post = buildMaineOfficialHistory('postjudgment');
  const pre = buildMaineOfficialHistory('prejudgment');

  assert.equal(post.length, 24);
  assert.equal(pre.length, 24);
  assert.deepEqual(validateMaineOfficialHistory(post, 'postjudgment'), []);
  assert.deepEqual(validateMaineOfficialHistory(pre, 'prejudgment'), []);
  assert.deepEqual(post[0], {
    effective_date: '2003-07-01', index_value: 1.41, value: 7.41, value_text: '7.41%',
    source_url: MAINE_POSTJUDGMENT_CHART_URL,
  });
  assert.equal(post.find((point) => point.effective_date === '2025-01-01').value, 10.23);
  assert.equal(pre.find((point) => point.effective_date === '2025-01-01').value, 7.23);
  assert.equal(post.at(-1).value, 9.51);
  assert.equal(pre.at(-1).value, 6.51);
  for (let index = 0; index < post.length; index++) {
    assert.equal(Math.round((post[index].value - pre[index].value) * 100) / 100, 3);
  }
});

test('Maine H.15 derivation reproduces the official 2026 chart values', () => {
  const daily = [
    { date: '2025-12-22', value: 3.53 },
    { date: '2025-12-23', value: 3.52 },
    { date: '2025-12-24', value: 3.50 },
    { date: '2025-12-26', value: 3.49 },
  ];
  assert.deepEqual(deriveMaineAnnualRateFromH15(daily, { year: 2026, kind: 'postjudgment' }), {
    effective_date: '2026-01-01', index_value: 3.51, value: 9.51, value_text: '9.51%',
    week_start: '2025-12-22', week_end: '2025-12-26', observation_count: 4,
    source_url: 'https://www.federalreserve.gov/datadownload/Download.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&filetype=csv&label=include&layout=seriescolumn',
  });
  assert.equal(deriveMaineAnnualRateFromH15(daily, { year: 2026, kind: 'prejudgment' }).value, 6.51);
});

test('Maine H.15 derivation fails closed on a partial final week', () => {
  const partial = [
    { date: '2025-12-22', value: 3.53 },
    { date: '2025-12-23', value: 3.52 },
  ];
  assert.equal(deriveMaineAnnualRateFromH15(partial, { year: 2026, kind: 'postjudgment' }), null);
});

test('Maine validation rejects the superseded 2025 administrative-error value', () => {
  const history = buildMaineOfficialHistory('postjudgment');
  history.find((point) => point.effective_date === '2025-01-01').value = 10.88;
  assert.match(validateMaineOfficialHistory(history, 'postjudgment').join('\n'), /corrected Judicial Branch value/);
});
