import test from 'node:test';
import assert from 'node:assert/strict';

import { assertCurrentNebraskaRate, parseNebraskaCurrentRate } from './nebraska-judicial.mjs';
import { buildNebraskaOfficialHistory, validateNebraskaHistory } from './nebraska-judgment-history.mjs';

test('official Nebraska history contains all 275 published change points through July 2026', () => {
  const history = buildNebraskaOfficialHistory();
  assert.equal(history.length, 275);
  assert.deepEqual(validateNebraskaHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: '1987-01-01',
    value: 6.77,
    value_text: '6.770%',
    source_url: 'https://nebraskajudicial.gov/sites/default/files/judgment-interest-rate.pdf',
  });
  assert.equal(history.find((point) => point.effective_date === '2002-07-20').value_text, '3.770%');
  assert.equal(history.at(-1).effective_date, '2026-07-16');
  assert.equal(history.at(-1).value_text, '5.970%');
  assert.equal(history.some((point) => point.effective_date > '2001-03-13' && point.effective_date < '2002-07-20'), false);
});

test('Nebraska current-page parser tolerates markup and preserves three-decimal display precision', () => {
  const html = '<p><strong>Effective July 16, 2026</strong>, the judgment <em>interest rate</em> is 5.970%.</p>';
  assert.deepEqual(parseNebraskaCurrentRate(html), {
    value: 5.97,
    value_text: '5.970%',
    effective_date: '2026-07-16',
  });
});

test('Nebraska current-page parser and quarter gate fail closed', () => {
  assert.throws(
    () => parseNebraskaCurrentRate('<p>Effective July 16, 2026, the child support rate is 5.970%.</p>'),
    /were not found/
  );
  assert.throws(
    () => parseNebraskaCurrentRate('<p>Effective July 16, 2026, the judgment interest rate is 35.000%.</p>'),
    /outside the accepted range/
  );
  assert.throws(
    () => assertCurrentNebraskaRate({ effective_date: '2026-04-16', value: 5.723 }, { today: '2026-07-19' }),
    /older than verified history/
  );
  assert.throws(
    () => assertCurrentNebraskaRate({ effective_date: '2026-08-01', value: 6 }, { today: '2026-08-01', history: [] }),
    /outside the expected quarterly effective-date window/
  );
});

test('Nebraska gate accepts a plausible new official quarter after curated history', () => {
  assert.doesNotThrow(() => assertCurrentNebraskaRate(
    { effective_date: '2026-10-15', value: 5.8 },
    { today: '2026-10-16' }
  ));
});
