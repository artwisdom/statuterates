import test from 'node:test';
import assert from 'node:assert/strict';

import { buildIowaOfficialHistory, validateIowaOfficialHistory } from './iowa-judgment-history.mjs';
import { assertIowaCourtTable, fetchIowaCourtTable, parseIowaCourtTable } from './iowa-judicial.mjs';

test('official Iowa history contains 303 exact court-table selections through August 2026', () => {
  const history = buildIowaOfficialHistory();
  assert.equal(history.length, 303);
  assert.deepEqual(validateIowaOfficialHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: '2001-03-05',
    index_value: 4.442,
    value: 6.442,
    value_text: '6.442%',
    source_url: 'https://www.iowacourts.gov/static/media/cms/post_judgment_interest_rate_table_2_D0E292E4AF18C.pdf',
  });
  assert.equal(history.find((point) => point.effective_date === '2020-02-11').value, 3.49);
  assert.equal(history.at(-1).effective_date, '2026-08-10');
  assert.equal(history.at(-1).value, 6.06);
});

test('Iowa court parser handles markup, short years, and the official double-slash typo', () => {
  const html = `
    <table><tbody>
      <tr><td>4//23/2018</td><td><strong>2.21</strong></td></tr>
      <tr><td>03/09/2026</td><td>3.56</td></tr>
      <tr><td>07/09/2026</td><td>4.06</td></tr>
      <tr><td>08/10/2026</td><td>4.06</td></tr>
    </tbody></table>`;
  const points = parseIowaCourtTable(html);
  assert.deepEqual(points.map(({ effective_date, index_value, value }) => ({ effective_date, index_value, value })), [
    { effective_date: '2018-04-23', index_value: 2.21, value: 4.21 },
    { effective_date: '2026-03-09', index_value: 3.56, value: 5.56 },
    { effective_date: '2026-07-09', index_value: 4.06, value: 6.06 },
    { effective_date: '2026-08-10', index_value: 4.06, value: 6.06 },
  ]);
});

test('Iowa court gate rejects changed anchors, stale tables, and future rows', () => {
  assert.throws(
    () => assertIowaCourtTable([{ effective_date: '2025-12-09', index_value: 3.61, value: 5.61 }], { today: '2026-08-13' }),
    /ends before verified baseline/
  );
  assert.throws(
    () => assertIowaCourtTable([{ effective_date: '2026-08-10', index_value: 9.99, value: 11.99 }], { today: '2026-08-13' }),
    /changed verified/
  );
  assert.throws(
    () => assertIowaCourtTable([{ effective_date: '2027-03-09', index_value: 3.56, value: 5.56 }], { today: '2026-08-13' }),
    /future/
  );
});

test('Iowa live fetch degrades safely when the official endpoint is unavailable', async () => {
  const messages = [];
  const result = await fetchIowaCourtTable({
    fetchImpl: async () => ({ ok: false, status: 403 }),
    log: (message) => messages.push(message),
    today: '2026-08-13',
  });
  assert.equal(result, null);
  assert.match(messages[0], /verified official history without an estimated replacement/);
});
