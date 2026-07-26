import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFloridaOfficialHistory,
  FLORIDA_CFO_RATES_URL,
  FLORIDA_STATUTE_55_03_URL,
  validateFloridaOfficialHistory,
} from './florida-judgment-history.mjs';
import {
  assertFloridaCfoRates,
  assertFloridaStatuteContract,
  fetchFloridaCfoRates,
  parseFloridaCfoRates,
} from './florida-cfo.mjs';

const REPRESENTATIVE_HTML = `
  <table><tbody>
    <tr><td>Effective Date</td><td>Rate Per Annum</td><td>Daily Rate as a Percentage</td><td>Daily Rate as a Decimal</td></tr>
    <tr><td>July 1, 2026</td><td>8.06%</td><td>.0220822%</td><td>.000220822</td></tr>
    <tr><td>April 1, 2026</td><td>8.25%</td><td>.0226027%</td><td>.000226027</td></tr>
    <tr><td>January 1, 2026</td><td>8.44%</td><td>.0231233%</td><td>.000231233</td></tr>
  </tbody></table>
  <table><tbody>
    <tr><td>Year</td><td>Rate Per Annum</td><td>Daily Rate as a Percentage</td><td>Daily Rate as a Decimal</td></tr>
    ${buildFloridaOfficialHistory().filter((point) => point.effective_date < '2026-01-01').slice().reverse().map((point) => {
      const date = point.effective_date === '1981-10-01'
        ? '10/1/81-12/31/94'
        : point.effective_date === '2011-10-01'
          ? '10/1/11'
          : point.effective_date.slice(5) === '01-01' && point.effective_date < '2011-01-01'
            ? point.effective_date.slice(0, 4)
            : `${({ '01': 'January', '04': 'April', '07': 'July', '10': 'October' })[point.effective_date.slice(5, 7)]} 1, ${point.effective_date.slice(0, 4)}`;
      return `<tr><td>${date}</td><td>${point.value_text}</td><td></td><td></td></tr>`;
    }).join('')}
    <tr><td>2012</td><td>4.75%</td><td>.0129781%</td><td>.000129781</td></tr>
  </tbody></table>`;

const REPRESENTATIVE_STATUTE_HTML = `
  <main>
    <h1>55.03 Judgments; rate of interest, generally.</h1>
    <p>
      The Chief Financial Officer sets the rate by averaging the discount rate of the
      Federal Reserve Bank of New York for the preceding <strong>12 months</strong>, then adding
      400 basis points to the averaged federal discount rate.
    </p>
    <p>
      The interest rate established by the Chief Financial Officer shall take effect on the first
      day of each following calendar quarter.
    </p>
    <p>
      Nothing contained herein shall affect a rate of interest established by written contract
      or obligation.
    </p>
    <p>
      The rate of interest stated in the judgment, as adjusted in subsection (3), accrues on the
      judgment until it is paid.
    </p>
    <p>
      The interest rate is established at the time a judgment is obtained and such interest rate
      shall be adjusted annually on January 1 of each year in accordance with the interest rate in
      effect on that date as set by the Chief Financial Officer until the judgment is paid, except
      for judgments entered by the clerk of the court pursuant to ss.
      <a>55.141</a>, <a>61.14</a>, <a>938.29</a>, and <a>938.30</a>, which shall not be adjusted annually.
    </p>
  </main>`;

test('Florida official history preserves all 78 CFO periods through Q3 2026', () => {
  const history = buildFloridaOfficialHistory();
  assert.equal(history.length, 78);
  assert.deepEqual(validateFloridaOfficialHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: '1981-10-01',
    value: 12,
    value_text: '12%',
    source_url: FLORIDA_CFO_RATES_URL,
  });
  assert.equal(history.find((point) => point.effective_date === '2025-07-01').value_text, '8.90%');
  assert.equal(history.at(-1).effective_date, '2026-07-01');
  assert.equal(history.at(-1).value_text, '8.06%');
});

test('Florida parser normalizes legacy ranges, annual rows, and current quarter rows', () => {
  const points = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  assert.equal(points.length, 78);
  assert.equal(points[0].effective_date, '1981-10-01');
  assert.equal(points.find((point) => point.effective_date === '2011-10-01').value_text, '4.75%');
  assert.equal(points.find((point) => point.effective_date === '2012-01-01').value_text, '4.75%');
  assert.equal(points.at(-1).effective_date, '2026-07-01');
  assert.equal(points.at(-1).daily_rate_decimal, 0.000220822);
  assert.doesNotThrow(() => assertFloridaCfoRates(points, { today: '2026-07-26' }));
});

test('Florida integrity gate rejects changed anchors and impossible daily factors', () => {
  const changed = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  changed.at(-1).value = 9.99;
  changed.at(-1).value_text = '9.99%';
  assert.throws(() => assertFloridaCfoRates(changed, { today: '2026-07-26' }), /changed verified/);

  const legacyDaily = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  legacyDaily[0].daily_rate_decimal = 0.0003333;
  assert.doesNotThrow(() => assertFloridaCfoRates(legacyDaily, { today: '2026-07-26' }));

  const annualLeapYear = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  annualLeapYear.find((point) => point.effective_date === '2000-01-01').daily_rate_decimal = 0.0002740;
  assert.doesNotThrow(() => assertFloridaCfoRates(annualLeapYear, { today: '2026-07-26' }));

  const quarterlyLeapYear = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  quarterlyLeapYear.find((point) => point.effective_date === '2024-01-01').daily_rate_decimal = 0.000248361;
  assert.doesNotThrow(() => assertFloridaCfoRates(quarterlyLeapYear, { today: '2026-07-26' }));

  const badDaily = parseFloridaCfoRates(REPRESENTATIVE_HTML);
  badDaily.at(-1).daily_rate_decimal = 0.5;
  assert.throws(() => assertFloridaCfoRates(badDaily, { today: '2026-07-26' }), /does not reconcile/);
});

test('Florida new quarters require and reconcile both official daily fields', () => {
  const baseline = buildFloridaOfficialHistory();
  const validNewQuarter = {
    effective_date: '2026-10-01',
    value: 7.95,
    value_text: '7.95%',
    daily_rate_percent: 0.0217808,
    daily_rate_decimal: 0.000217808,
    source_url: FLORIDA_CFO_RATES_URL,
  };
  assert.doesNotThrow(() => assertFloridaCfoRates(
    [...baseline, validNewQuarter],
    { today: '2026-09-01' },
  ));
  assert.throws(() => assertFloridaCfoRates(
    [...baseline, { ...validNewQuarter, daily_rate_percent: null }],
    { today: '2026-09-01' },
  ), /missing an official daily percentage or decimal factor/);
  assert.throws(() => assertFloridaCfoRates(
    [...baseline, { ...validNewQuarter, daily_rate_decimal: null }],
    { today: '2026-09-01' },
  ), /missing an official daily percentage or decimal factor/);
  assert.throws(() => assertFloridaCfoRates(
    [...baseline, { ...validNewQuarter, daily_rate_percent: 0.03 }],
    { today: '2026-09-01' },
  ), /daily percentage.*does not reconcile/);
  assert.throws(() => assertFloridaCfoRates(
    [...baseline, { ...validNewQuarter, daily_rate_decimal: 0.0003 }],
    { today: '2026-09-01' },
  ), /daily factor.*does not reconcile/);
});

test('Florida statute phrase contract tolerates markup but rejects a changed legal anchor', () => {
  assert.doesNotThrow(() => assertFloridaStatuteContract(REPRESENTATIVE_STATUTE_HTML));
  assert.throws(
    () => assertFloridaStatuteContract(
      REPRESENTATIVE_STATUTE_HTML.replace('adjusted annually on January 1', 'adjusted quarterly'),
    ),
    /annual January 1 adjustment anchor/,
  );
});

test('Florida live fetch returns the official schedule after checking §55.03', async () => {
  const good = await fetchFloridaCfoRates({
    today: '2026-07-26',
    getImpl: async (url) => {
      if (url === FLORIDA_CFO_RATES_URL) {
        return { body: REPRESENTATIVE_HTML, retrieved_at: '2026-07-26T12:00:00Z' };
      }
      assert.equal(url, FLORIDA_STATUTE_55_03_URL);
      return { body: REPRESENTATIVE_STATUTE_HTML, retrieved_at: '2026-07-26T12:01:00Z' };
    },
  });
  assert.equal(good.points.length, 78);
  assert.equal(good.source.publisher, 'Florida Department of Financial Services, Chief Financial Officer (official)');
  assert.match(good.source.robots_status, /§55\.03 legal anchors checked 2026-07-26T12:01:00Z/);
});

test('Florida CFO network failure falls back, but reachable invalid CFO content fails loud', async () => {
  const messages = [];
  const fallback = await fetchFloridaCfoRates({
    today: '2026-07-26',
    getImpl: async () => { throw new Error('HTTP 503'); },
    log: (message) => messages.push(message),
  });
  assert.equal(fallback, null);
  assert.match(messages[0], /verified official history without an estimated replacement/);

  await assert.rejects(
    fetchFloridaCfoRates({
      today: '2026-07-26',
      getImpl: async () => ({ body: '<html>reachable layout change</html>' }),
    }),
    /judgment-rate rows were not found/,
  );
  await assert.rejects(
    fetchFloridaCfoRates({
      today: '2026-07-26',
      getImpl: async () => ({
        body: REPRESENTATIVE_HTML.replace(
          '<td>8.06%</td><td>.0220822%</td><td>.000220822</td>',
          '<td>9.99%</td><td>.0273699%</td><td>.000273699</td>',
        ),
      }),
    }),
    /changed verified 2026-07-01/,
  );
});

test('Florida statute network outage retains the reviewed contract, but changed text fails loud', async () => {
  const messages = [];
  const retained = await fetchFloridaCfoRates({
    today: '2026-07-26',
    getImpl: async (url) => {
      if (url === FLORIDA_CFO_RATES_URL) {
        return { body: REPRESENTATIVE_HTML, retrieved_at: '2026-07-26T12:00:00Z' };
      }
      throw new Error('statute HTTP 503');
    },
    log: (message) => messages.push(message),
  });
  assert.equal(retained.points.length, 78);
  assert.match(messages[0], /retaining the last reviewed legal contract/);
  assert.match(retained.source.robots_status, /last reviewed legal contract retained/);

  await assert.rejects(
    fetchFloridaCfoRates({
      today: '2026-07-26',
      getImpl: async (url) => ({
        body: url === FLORIDA_CFO_RATES_URL
          ? REPRESENTATIVE_HTML
          : REPRESENTATIVE_STATUTE_HTML.replace(
              'adjusted annually on January 1',
              'adjusted quarterly',
            ),
        retrieved_at: '2026-07-26T12:00:00Z',
      }),
    }),
    /annual January 1 adjustment anchor/,
  );
});
