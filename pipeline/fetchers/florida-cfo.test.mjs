import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildFloridaOfficialHistory,
  FLORIDA_CFO_RATES_URL,
  validateFloridaOfficialHistory,
} from './florida-judgment-history.mjs';
import {
  assertFloridaCfoRates,
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

test('Florida live fetch returns the official schedule and degrades safely on failure', async () => {
  const good = await fetchFloridaCfoRates({
    today: '2026-07-26',
    getImpl: async () => ({ body: REPRESENTATIVE_HTML, retrieved_at: '2026-07-26T12:00:00Z' }),
  });
  assert.equal(good.points.length, 78);
  assert.equal(good.source.publisher, 'Florida Department of Financial Services, Chief Financial Officer (official)');

  const messages = [];
  const fallback = await fetchFloridaCfoRates({
    today: '2026-07-26',
    getImpl: async () => { throw new Error('HTTP 503'); },
    log: (message) => messages.push(message),
  });
  assert.equal(fallback, null);
  assert.match(messages[0], /verified official history without an estimated replacement/);
});
