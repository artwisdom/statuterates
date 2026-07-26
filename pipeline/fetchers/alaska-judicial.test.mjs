import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ALASKA_OFFICIAL_HISTORY_START,
  buildAlaskaOfficialHistory,
  validateAlaskaOfficialHistory,
} from './alaska-interest-history.mjs';
import {
  assertAlaskaCourtHistory,
  extractAlaskaPdfText,
  fetchAlaskaCourtRates,
  parseAlaskaAdm505Text,
} from './alaska-judicial.mjs';

const ADM_505_TEXT = `
How to Determine Pre- & Post-Judgment Interest Rates
Both pre- and post-judgment interest rates will be the rate for the year in which the judgment is
entered. For judgments entered in 2026, this rate is 6.75%. The rates for prior years were:
Year Entered that Year Year Entered that Year
1997 (on or after August 7 th ) 8% 2011-2015 3.75%
1998 8% 2016 4%
1999 7.5% 2017 4.25%
2000 8% 2018 5%
2001 9% 2019 6%
2002 4.25% 2020 5.25%
2003 3.75% 2021-2022 3.25%
2004 5% 2023 7.5%
2005 6.25% 2024 8.5%
2006 8.25% 2025 7.5%
2007 9.25%
2008 7.75%
2009-2010 3.5%
Note: The interest rate on a particular judgment does not change.
`;

test('Alaska official history preserves all 30 ADM-505 annual selections through 2026', () => {
  const history = buildAlaskaOfficialHistory();
  assert.equal(history.length, 30);
  assert.deepEqual(validateAlaskaOfficialHistory(history), []);
  assert.deepEqual(history[0], {
    effective_date: ALASKA_OFFICIAL_HISTORY_START,
    value: 8,
    value_text: '8%',
    source_url: 'https://public.courts.alaska.gov/web/forms/docs/adm-505.pdf',
  });
  assert.equal(history.find((point) => point.effective_date === '2014-01-01').value_text, '3.75%');
  assert.equal(history.at(-1).effective_date, '2026-01-01');
  assert.equal(history.at(-1).value_text, '6.75%');
});

test('Alaska ADM-505 parser expands year ranges and adds the current headline year', () => {
  const history = parseAlaskaAdm505Text(ADM_505_TEXT);
  assert.equal(history.length, 30);
  assert.equal(history.find((point) => point.effective_date === '2009-01-01').value_text, '3.5%');
  assert.equal(history.find((point) => point.effective_date === '2015-01-01').value_text, '3.75%');
  assert.equal(history.find((point) => point.effective_date === '2022-01-01').value_text, '3.25%');
  assert.equal(history.at(-1).value_text, '6.75%');
  assert.doesNotThrow(() => assertAlaskaCourtHistory(history, { today: '2026-07-26' }));
});

test('Alaska live-history gate rejects changed anchors and noncontiguous extensions', () => {
  const changed = buildAlaskaOfficialHistory();
  changed.find((point) => point.effective_date === '2024-01-01').value = 8.25;
  assert.throws(
    () => assertAlaskaCourtHistory(changed, { today: '2026-07-26' }),
    /changed verified 2024-01-01/
  );

  const skipped = [
    ...buildAlaskaOfficialHistory(),
    { effective_date: '2028-01-01', value: 7, value_text: '7%' },
  ];
  assert.throws(
    () => assertAlaskaCourtHistory(skipped, { today: '2028-01-15' }),
    /extension must continue annually with 2027-01-01/
  );
});

test('Alaska monitor fails safely when the court PDF cannot be fetched', async () => {
  const messages = [];
  const result = await fetchAlaskaCourtRates({
    getImpl: async () => { throw new Error('temporary outage'); },
    log: (message) => messages.push(message),
    today: '2026-07-26',
  });
  assert.equal(result, null);
  assert.equal(messages.length, 1);
  assert.match(messages[0], /using verified official history without an estimated replacement/);
});

test('Alaska PDF parser rejects oversized input before handing it to PDF.js', async () => {
  const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
  oversized.write('%PDF-');
  await assert.rejects(() => extractAlaskaPdfText(oversized), /safety limit/);
});
