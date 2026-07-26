import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DGS1_CSV_URL,
  FEDERAL_STATUTE_CONTRACT_REVIEWED_AT,
  US_CODE_1961_URL,
  WGS1YR_CSV_URL,
  buildCrosscheckedPublishedWeeks,
  fetchH15,
  normalizeFederalStatuteText,
  parseFredCsv,
  validateFederalStatuteContract,
  validateFredH15Integrity,
} from './fed-h15.mjs';

const OFFICIAL_1961_HTML = `
  <!doctype html>
  <html>
    <head><title>28 USC 1961: Interest</title></head>
    <body>
      <h3>&sect;1961. Interest</h3>
      <p>
        (a) Such interest shall be calculated from the date of the entry of the judgment,
        at a rate equal to the weekly average 1-year constant maturity Treasury yield,
        as published by the Board of Governors of the Federal Reserve System, for the
        calendar week preceding.<sup>1</sup>&nbsp;the date of the judgment.
      </p>
      <p>
        (b) Interest shall be computed daily to the date of payment except as provided
        elsewhere, and shall be compounded annually.
      </p>
    </body>
  </html>
`;

const ANCHORS = new Map([
  ['2000-01-07', 6.03],
  ['2000-12-15', 5.73],
  ['2008-09-19', 1.69],
  ['2020-03-20', 0.23],
  ['2024-01-05', 4.83],
]);

function iso(date) {
  return date.toISOString().slice(0, 10);
}

function dates(start, end, predicate) {
  const result = [];
  const cursor = new Date(`${start}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);
  while (cursor <= last) {
    if (predicate(cursor)) result.push(iso(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function fridayOfWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (5 - date.getUTCDay()));
  return iso(date);
}

function syntheticFullHistory({ today = '2026-01-12' } = {}) {
  const dailyDates = dates('2000-01-03', today, (date) => {
    const day = date.getUTCDay();
    return day >= 1 && day <= 5;
  });
  const lastFriday = new Date(`${today}T00:00:00Z`);
  while (lastFriday.getUTCDay() !== 5) lastFriday.setUTCDate(lastFriday.getUTCDate() - 1);
  const weeklyDates = dates('2000-01-07', iso(lastFriday), (date) => date.getUTCDay() === 5);
  const valueForFriday = (friday) => ANCHORS.get(friday) ?? 5;
  const dailyCsv = [
    'observation_date,DGS1',
    ...dailyDates.map((date) => `${date},${valueForFriday(fridayOfWeek(date)).toFixed(2)}`),
  ].join('\n');
  const weeklyCsv = [
    'observation_date,WGS1YR',
    ...weeklyDates.map((date) => `${date},${valueForFriday(date).toFixed(2)}`),
  ].join('\n');
  return { today, dailyCsv, weeklyCsv };
}

function successfulResponses(fixture, statuteBody = OFFICIAL_1961_HTML) {
  return new Map([
    [DGS1_CSV_URL, { body: fixture.dailyCsv, retrieved_at: '2026-01-12T12:00:00.000Z' }],
    [WGS1YR_CSV_URL, { body: fixture.weeklyCsv, retrieved_at: '2026-01-12T12:00:03.000Z' }],
    [US_CODE_1961_URL, { body: statuteBody, retrieved_at: '2026-01-12T12:00:06.000Z' }],
  ]);
}

test('official statute normalization tolerates HTML, entities, footnotes, punctuation, and case', () => {
  const normalized = normalizeFederalStatuteText(OFFICIAL_1961_HTML);
  assert.match(normalized, /1961 interest/);
  assert.match(
    normalized,
    /weekly average 1 year constant maturity treasury yield .* calendar week preceding 1 the date/
  );
  assert.deepEqual(validateFederalStatuteContract(OFFICIAL_1961_HTML), []);
});

test('official statute phrase contract fails closed when any critical legal clause changes', () => {
  const cases = [
    ['calendar week preceding', 'calendar month preceding', /preceding-calendar-week/],
    ['computed daily', 'computed monthly', /daily-computation/],
    ['compounded annually', 'compounded monthly', /annual-compounding/],
  ];
  for (const [before, after, expectedError] of cases) {
    const errors = validateFederalStatuteContract(OFFICIAL_1961_HTML.replace(before, after));
    assert.ok(errors.some((error) => expectedError.test(error)), `${before} mutation was accepted`);
  }
});

test('strict FRED parser accepts only the expected series shape and preserves holiday rows', () => {
  const parsed = parseFredCsv(
    '\uFEFFobservation_date,DGS1\r\n2000-01-03,6.09\r\n2000-01-04,\r\n2000-01-05,6.05\r\n',
    'DGS1',
    { allowMissing: true }
  );
  assert.deepEqual(parsed.rows, [
    { date: '2000-01-03', value: 6.09 },
    { date: '2000-01-04', value: null },
    { date: '2000-01-05', value: 6.05 },
  ]);
  assert.deepEqual(parsed.observations, [
    { date: '2000-01-03', value: 6.09 },
    { date: '2000-01-05', value: 6.05 },
  ]);
});

test('strict FRED parser rejects changed headers, malformed values, duplicates, and missing weekly rates', () => {
  assert.throws(
    () => parseFredCsv('DATE,DGS1\n2000-01-03,6.09\n', 'DGS1', { allowMissing: true }),
    /expected observation_date,DGS1 header/
  );
  assert.throws(
    () => parseFredCsv('observation_date,DGS1\n2000-01-03,6.091\n', 'DGS1', { allowMissing: true }),
    /invalid numeric value/
  );
  assert.throws(
    () => parseFredCsv(
      'observation_date,DGS1\n2000-01-03,6.09\n2000-01-03,6.10\n',
      'DGS1',
      { allowMissing: true }
    ),
    /duplicate date/
  );
  assert.throws(
    () => parseFredCsv('observation_date,WGS1YR\n2000-01-07,\n', 'WGS1YR'),
    /missing value/
  );
  assert.throws(
    () => parseFredCsv('observation_date,DGS1\nnot-a-date,6.09\n', 'DGS1', { allowMissing: true }),
    /invalid date/
  );
  assert.throws(
    () => parseFredCsv('observation_date,DGS1\n2000-01-03,6.09,extra\n', 'DGS1', { allowMissing: true }),
    /malformed row/
  );
});

test('full synthetic DGS1 history reconciles exactly with every WGS1YR week and anchor', () => {
  const fixture = syntheticFullHistory();
  const daily = parseFredCsv(fixture.dailyCsv, 'DGS1', { allowMissing: true });
  const weekly = parseFredCsv(fixture.weeklyCsv, 'WGS1YR');
  assert.deepEqual(validateFredH15Integrity(daily, weekly, { today: fixture.today }), []);
  const crosschecked = buildCrosscheckedPublishedWeeks(daily, weekly);
  assert.equal(crosschecked.length, weekly.observations.length);
  assert.equal(crosschecked.at(-1).published_date, weekly.observations.at(-1).date);
});

test('integrity check fails closed on a daily gap, cross-source mismatch, or weekly truncation', () => {
  const fixture = syntheticFullHistory();
  const daily = parseFredCsv(fixture.dailyCsv, 'DGS1', { allowMissing: true });
  const weekly = parseFredCsv(fixture.weeklyCsv, 'WGS1YR');

  const missingDaily = {
    ...daily,
    rows: daily.rows.filter((point) => point.date !== '2025-12-30'),
    observations: daily.observations.filter((point) => point.date !== '2025-12-30'),
  };
  assert.ok(validateFredH15Integrity(missingDaily, weekly, { today: fixture.today })
    .some((error) => /weekday history gap/.test(error)));

  const changedDaily = structuredClone(daily);
  changedDaily.observations.find((point) => point.date === '2026-01-05').value = 7;
  changedDaily.rows.find((point) => point.date === '2026-01-05').value = 7;
  assert.ok(validateFredH15Integrity(changedDaily, weekly, { today: fixture.today })
    .some((error) => /WGS1YR publishes/.test(error)));

  const truncatedWeekly = {
    ...weekly,
    rows: weekly.rows.slice(0, -1),
    observations: weekly.observations.slice(0, -1),
  };
  assert.ok(validateFredH15Integrity(daily, truncatedWeekly, { today: fixture.today })
    .some((error) => /trails DGS1 by 2 weeks/.test(error)));
});

test('fetchH15 requires both feeds and returns only fully cross-checked daily history', async () => {
  const fixture = syntheticFullHistory();
  const responses = successfulResponses(fixture);
  const calls = [];
  const result = await fetchH15({
    today: fixture.today,
    get: async (url, options) => {
      calls.push({ url, options });
      return responses.get(url);
    },
  });
  assert.deepEqual(
    calls.map((call) => call.url),
    [DGS1_CSV_URL, WGS1YR_CSV_URL, US_CODE_1961_URL]
  );
  assert.deepEqual(
    calls.map((call) => call.options.sourceId),
    ['fed-h15', 'fed-h15', 'uscode-28-1961']
  );
  assert.equal(result.source.id, 'fed-h15');
  assert.equal(result.daily[0].date, '2000-01-03');
  assert.equal(result.publishedWeekly[0].date, '2000-01-07');
  assert.equal(result.verifiedWeeks.length, result.publishedWeekly.length);
  assert.equal(result.verifiedWeeks.at(-1).week, '2026-01-05');
  assert.equal(result.source_url, 'https://fred.stlouisfed.org/series/WGS1YR');
  assert.equal(result.input_source_url, 'https://fred.stlouisfed.org/series/DGS1');
  assert.match(result.source.robots_status, /cross-checked against WGS1YR/);
  assert.match(result.source.robots_status, /§1961 phrase contract verified live/);
  assert.deepEqual(result.statuteContract, {
    status: 'verified-live',
    source_url: US_CODE_1961_URL,
    reviewed_at: FEDERAL_STATUTE_CONTRACT_REVIEWED_AT,
    retrieved_at: '2026-01-12T12:00:06.000Z',
  });
});

test('a newer partial DGS1 week is checked for freshness but excluded from publishable weeks', async () => {
  const fixture = syntheticFullHistory({ today: '2026-01-12' });
  const responses = successfulResponses(fixture);
  const result = await fetchH15({
    today: fixture.today,
    get: async (url) => responses.get(url),
  });
  const derived = parseFredCsv(fixture.dailyCsv, 'DGS1', { allowMissing: true });
  const allDerivedWeeks = new Set(
    derived.observations.map((point) => {
      const date = new Date(`${point.date}T00:00:00Z`);
      const day = date.getUTCDay();
      date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
      return date.toISOString().slice(0, 10);
    }),
  );
  assert.equal(allDerivedWeeks.size, result.verifiedWeeks.length + 1);
  assert.equal([...allDerivedWeeks].at(-1), '2026-01-12');
  assert.equal(result.verifiedWeeks.at(-1).week, '2026-01-05');
});

test('fetched official statute text with a changed anchor aborts the federal fetch', async () => {
  const fixture = syntheticFullHistory();
  const responses = successfulResponses(
    fixture,
    OFFICIAL_1961_HTML.replace('compounded annually', 'compounded monthly')
  );
  await assert.rejects(
    fetchH15({
      today: fixture.today,
      get: async (url) => responses.get(url),
    }),
    /official phrase contract failed: annual-compounding clause changed or missing/
  );
});

test('temporary official statute outage logs and retains the reviewed phrase contract', async () => {
  const fixture = syntheticFullHistory();
  const responses = successfulResponses(fixture);
  const logs = [];
  const result = await fetchH15({
    today: fixture.today,
    log: (message) => logs.push(message),
    get: async (url) => {
      if (url === US_CODE_1961_URL) throw new Error('NETWORK: simulated temporary outage');
      return responses.get(url);
    },
  });
  assert.equal(result.statuteContract.status, 'reviewed-contract-retained-temporary-outage');
  assert.equal(result.statuteContract.retrieved_at, null);
  assert.match(result.source.robots_status, /temporarily unavailable/);
  assert.ok(logs.some((message) =>
    message.includes(`retaining the phrase contract reviewed ${FEDERAL_STATUTE_CONTRACT_REVIEWED_AT}`)
  ));
});

test('permanent official statute fetch errors abort rather than using the reviewed fallback', async () => {
  const fixture = syntheticFullHistory();
  const responses = successfulResponses(fixture);
  await assert.rejects(
    fetchH15({
      today: fixture.today,
      get: async (url) => {
        if (url === US_CODE_1961_URL) throw new Error(`HTTP_404: ${US_CODE_1961_URL}`);
        return responses.get(url);
      },
    }),
    /HTTP_404/
  );
});

test('a second-feed network failure rejects the entire federal fetch', async () => {
  let calls = 0;
  await assert.rejects(
    fetchH15({
      get: async () => {
        calls++;
        if (calls === 1) {
          return {
            body: 'observation_date,DGS1\n2000-01-03,6.09\n',
            retrieved_at: '2026-01-12T12:00:00.000Z',
          };
        }
        throw new Error('simulated WGS1YR network failure');
      },
    }),
    /simulated WGS1YR network failure/
  );
  assert.equal(calls, 2);
});
