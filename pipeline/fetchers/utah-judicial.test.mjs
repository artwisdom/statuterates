import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildUtahOfficialHistory,
  UTAH_JUDGMENT_CURRENT_URL,
  UTAH_JUDGMENT_HISTORY_URL,
  validateUtahOfficialHistory,
} from './utah-judgment-history.mjs';
import {
  assertUtahCourtHistory,
  assertUtahCurrentRates,
  fetchUtahCourtRates,
  parseUtahCurrentRates,
  parseUtahHistoricRates,
} from './utah-judicial.mjs';

const HISTORY_HTML = `
  <table><tbody>
    <tr><td><h4>Calendar Year</h4></td><td><h4>Post Judgment Interest Rate</h4></td></tr>
    ${buildUtahOfficialHistory().slice().reverse().map((point) => `
      <tr><td>${point.effective_date.slice(0, 4)}</td><td>${point.value_text}</td></tr>
    `).join('')}
  </tbody></table>`;

const CURRENT_HTML = `
  <table><tbody>
    <tr><th>Calendar Year</th><th>Federal rate</th><th>General judgments</th><th>Under $10,000 goods/services</th></tr>
    <tr><td><p>2026</p></td><td><p>3.51%</p></td><td><p>5.51%</p></td><td><p>13.51%</p></td></tr>
  </tbody></table>`;

test('Utah official table preserves all 34 exact annual rows through 2026', () => {
  const history = buildUtahOfficialHistory();
  assert.equal(history.length, 34);
  assert.deepEqual(validateUtahOfficialHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: '1993-01-01',
    value: 5.72,
    value_text: '5.72%',
    source_url: UTAH_JUDGMENT_HISTORY_URL,
  });
  assert.equal(history.find((point) => point.effective_date === '2000-01-01').value_text, '7.670%');
  assert.equal(history.at(-1).value_text, '5.51%');
});

test('Utah court parsers preserve official history precision and all current branches', () => {
  const history = parseUtahHistoricRates(HISTORY_HTML);
  assert.equal(history.length, 34);
  assert.equal(history.find((point) => point.effective_date === '1998-01-01').value_text, '7.468%');
  assert.deepEqual(parseUtahCurrentRates(CURRENT_HTML), {
    effective_date: '2026-01-01',
    federal_rate: 3.51,
    value: 5.51,
    value_text: '5.51%',
    goods_services_under_10000_rate: 13.51,
    goods_services_under_10000_value_text: '13.51%',
    source_url: UTAH_JUDGMENT_CURRENT_URL,
  });
});

test('Utah integrity gates reject changed history and broken statutory formulas', () => {
  const changed = parseUtahHistoricRates(HISTORY_HTML);
  changed.at(-1).value = 9.99;
  changed.at(-1).value_text = '9.99%';
  assert.throws(() => assertUtahCourtHistory(changed, { today: '2026-07-26' }), /changed verified/);

  const current = parseUtahCurrentRates(CURRENT_HTML);
  current.goods_services_under_10000_rate = 12.51;
  assert.throws(() => assertUtahCurrentRates(current, { today: '2026-07-26' }), /plus ten points/);
});

test('Utah live fetch returns verified tables and degrades safely when both pages fail', async () => {
  const good = await fetchUtahCourtRates({
    today: '2026-07-26',
    getImpl: async (url) => ({
      body: url === UTAH_JUDGMENT_HISTORY_URL ? HISTORY_HTML : CURRENT_HTML,
      retrieved_at: '2026-07-26T12:00:00Z',
    }),
  });
  assert.equal(good.historyPoints.length, 34);
  assert.equal(good.current.goods_services_under_10000_value_text, '13.51%');
  assert.equal(good.source.publisher, 'Utah State Courts (official)');

  const messages = [];
  const fallback = await fetchUtahCourtRates({
    today: '2026-07-26',
    getImpl: async () => { throw new Error('HTTP 503'); },
    log: (message) => messages.push(message),
  });
  assert.equal(fallback, null);
  assert.match(messages[0], /verified official history without an estimated replacement/);
});

test('Utah live fetch never retains a page that fails its integrity gate', async () => {
  const changedHistory = HISTORY_HTML.replace('<td>5.51%</td>', '<td>9.99%</td>');
  const historyRejected = await fetchUtahCourtRates({
    today: '2026-07-26',
    getImpl: async (url) => ({
      body: url === UTAH_JUDGMENT_HISTORY_URL ? changedHistory : CURRENT_HTML,
      retrieved_at: '2026-07-26T12:00:00Z',
    }),
  });
  assert.deepEqual(historyRejected.historyPoints, []);
  assert.equal(historyRejected.current.value_text, '5.51%');

  const brokenCurrent = CURRENT_HTML.replace('<td><p>13.51%</p></td>', '<td><p>12.51%</p></td>');
  const currentRejected = await fetchUtahCourtRates({
    today: '2026-07-26',
    getImpl: async (url) => ({
      body: url === UTAH_JUDGMENT_HISTORY_URL ? HISTORY_HTML : brokenCurrent,
      retrieved_at: '2026-07-26T12:00:00Z',
    }),
  });
  assert.equal(currentRejected.historyPoints.length, 34);
  assert.equal(currentRejected.current, null);
});

test('Utah history extensions require matching current-table formula confirmation', async () => {
  const extendedHistory = HISTORY_HTML.replace(
    '</tbody>',
    '<tr><td>2027</td><td>6.00%</td></tr></tbody>',
  );
  const messages = [];
  const unconfirmed = await fetchUtahCourtRates({
    today: '2026-07-26',
    getImpl: async (url) => {
      if (url === UTAH_JUDGMENT_HISTORY_URL) {
        return { body: extendedHistory, retrieved_at: '2026-07-26T12:00:00Z' };
      }
      throw new Error('HTTP 503');
    },
    log: (message) => messages.push(message),
  });
  assert.equal(unconfirmed.historyPoints.length, 34);
  assert.equal(unconfirmed.historyPoints.at(-1).effective_date, '2026-01-01');
  assert.match(messages[0], /formula confirmation/);
});
