import test from 'node:test';
import assert from 'node:assert/strict';

import { assertCurrentTexasMonth, parseTexasCurrentRate } from './texas-occc.mjs';
import { buildTexasOfficialMonthlyHistory, validateTexasMonthlyHistory } from './texas-occc-history.mjs';

test('official Texas history is a contiguous 515-month schedule through July 2026', () => {
  const history = buildTexasOfficialMonthlyHistory();
  assert.equal(history.length, 515);
  assert.deepEqual(validateTexasMonthlyHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: '1983-09-01',
    value: 10,
    source_url: 'https://occc.texas.gov/wp-content/uploads/2025/12/PostjudgmentInterestRate_History.docx',
  });
  assert.equal(history.at(-1).effective_date, '2026-07-01');
  assert.equal(history.at(-1).value, 6.75);
  assert.equal(history.find((point) => point.effective_date === '1984-08-01').value, 10.99);
  assert.equal(history.find((point) => point.effective_date === '2003-08-01').value, 5);
  assert.equal(history.find((point) => point.effective_date === '2024-11-01').value, 8);
});

test('Texas current-page parser tolerates markup between the label, rate, and month', () => {
  const html = `
    <section><strong>Postjudgment Interest Rate:</strong>&nbsp;<span>6.75%</span>
      <div>July <em>2026</em></div></section>
  `;
  assert.deepEqual(parseTexasCurrentRate(html), { value: 6.75, effective_date: '2026-07-01' });
});

test('Texas current-page parser and period gate fail closed', () => {
  assert.throws(
    () => parseTexasCurrentRate('<p>Postjudgment Interest Rate: 18.00% July 2026</p>'),
    /outside the statutory 5%-15% range/
  );
  assert.throws(
    () => parseTexasCurrentRate('<p>Weekly Ceiling: 18.00% July 2026</p>'),
    /were not found/
  );
  assert.throws(
    () => assertCurrentTexasMonth({ effective_date: '2026-06-01' }, { today: '2026-07-19' }),
    /does not match 2026-07-01/
  );
});
