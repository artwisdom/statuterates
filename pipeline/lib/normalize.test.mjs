// Unit tests for the derivation logic (weekly averaging + post-judgment == CMT invariant).
// Run: node --test  (from pipeline/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  FEDERAL_PJ_FIRST_RATE_WEEK,
  buildWeeklyAverages,
  buildCmtRecords,
  buildPostJudgmentRecords,
} from './normalize.mjs';

const src = { source_id: 'fed-h15', source_url: 'https://example', retrieved_at: '2026-07-08T00:00:00Z' };

test('daily observations group into Mon–Fri weekly averages keyed by Monday', () => {
  // Week of Mon 2026-06-29 … Fri 2026-07-03 (Fri is a holiday=ND, omitted upstream)
  const daily = [
    { date: '2026-06-29', value: 3.97 },
    { date: '2026-06-30', value: 3.98 },
    { date: '2026-07-01', value: 4.0 },
    { date: '2026-07-02', value: 3.96 },
    // next week
    { date: '2026-07-06', value: 3.95 },
  ];
  const weeks = buildWeeklyAverages(daily);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0].week, '2026-06-29');
  assert.equal(weeks[0].avg, 3.98); // (3.97+3.98+4.00+3.96)/4 = 3.9775 -> 3.98
  assert.equal(weeks[0].n, 4);
  assert.equal(weeks[1].week, '2026-07-06');
  assert.equal(weeks[1].avg, 3.95);
});

test('Sunday dates fold back into the prior Monday week', () => {
  const weeks = buildWeeklyAverages([
    { date: '2026-07-05', value: 4.0 }, // Sunday
    { date: '2026-07-06', value: 3.9 }, // Monday
  ]);
  // Sunday 07-05 belongs to week starting Mon 06-29; Monday 07-06 starts a new week.
  assert.deepEqual(weeks.map((w) => w.week), ['2026-06-29', '2026-07-06']);
});

test('post-judgment records equal the CMT weekly averages (the §1961 invariant)', () => {
  const weeks = buildWeeklyAverages([
    { date: '2026-06-29', value: 3.5 },
    { date: '2026-07-06', value: 4.2 },
  ]);
  const cmt = buildCmtRecords(weeks, src);
  const pj = buildPostJudgmentRecords(weeks, src);
  assert.equal(cmt.observations.length, pj.observations.length);
  for (let i = 0; i < cmt.observations.length; i++) {
    assert.equal(cmt.observations[i].effective_date, pj.observations[i].effective_date);
    assert.equal(cmt.observations[i].value_numeric, pj.observations[i].value_numeric);
  }
  // Confidence + provenance labeling differs, as designed.
  assert.equal(cmt.observations[0].confidence, 'high');
  assert.equal(pj.observations[0].confidence, 'medium');
  assert.match(pj.observations[0].method, /derived_28usc1961/);
  assert.match(pj.observations[0].notes, /not legal advice/i);
});

test('empty input yields no weeks (no crash)', () => {
  assert.deepEqual(buildWeeklyAverages([]), []);
});

test('weekly averages use published half-up rounding for exact half-cent ties', () => {
  const [week] = buildWeeklyAverages([
    { date: '2000-07-03', value: 6.07 },
    { date: '2000-07-05', value: 6.06 },
    { date: '2000-07-06', value: 6.10 },
    { date: '2000-07-07', value: 6.07 },
  ]);
  assert.equal(week.avg, 6.08);
});

test('current-formula federal post-judgment records begin with the 2000-12-11 rate week', () => {
  const weeks = [
    { week: '2000-12-04', avg: 5.74, n: 5 },
    { week: FEDERAL_PJ_FIRST_RATE_WEEK, avg: 5.73, n: 5 },
  ];
  const cmt = buildCmtRecords(weeks, src);
  const pj = buildPostJudgmentRecords(weeks, src);
  assert.equal(cmt.observations.length, 2);
  assert.deepEqual(pj.observations.map((row) => row.effective_date), [FEDERAL_PJ_FIRST_RATE_WEEK]);
});
