import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGeorgiaCuratedPrimeChanges,
  buildGeorgiaPrimeHistory,
  validateGeorgiaPrimeChanges,
  validateGeorgiaRateHistory,
} from './georgia-interest-history.mjs';
import { parseGeorgiaPrimeCsv } from './georgia-prime.mjs';

test('Georgia current-scheme history carries the June 2003 prime rate into July 1 and derives prime plus three', () => {
  const history = buildGeorgiaPrimeHistory();
  assert.equal(history.length, 59);
  assert.deepEqual(history[0], {
    effective_date: '2003-07-01',
    prime_rate: 4,
    value: 7,
    value_text: '7.00%',
    source_url: 'https://fred.stlouisfed.org/series/PRIME',
  });
  assert.equal(history.at(-1).effective_date, '2025-12-11');
  assert.equal(history.at(-1).prime_rate, 6.75);
  assert.equal(history.at(-1).value, 9.75);
  assert.deepEqual(validateGeorgiaRateHistory(history), []);
});

test('FRED PRIME CSV parser preserves effective dates and validator rejects changed anchors', () => {
  const points = buildGeorgiaCuratedPrimeChanges();
  const csv = `observation_date,PRIME\n${points.map((point) => `${point.effective_date},${point.value.toFixed(2)}`).join('\n')}\n`;
  assert.deepEqual(parseGeorgiaPrimeCsv(csv), points);
  assert.deepEqual(validateGeorgiaPrimeChanges(points, { today: '2026-07-19' }), []);

  const corrupted = points.map((point) => ({ ...point }));
  corrupted.at(-1).value = 8;
  assert.ok(validateGeorgiaPrimeChanges(corrupted, { today: '2026-07-19' })
    .some((error) => /must remain 6\.75%/.test(error)));
});

test('a future FRED change is appended without altering the verified history', () => {
  const points = [...buildGeorgiaCuratedPrimeChanges(), { effective_date: '2026-08-01', value: 6.5 }];
  assert.deepEqual(validateGeorgiaPrimeChanges(points, { today: '2026-08-02' }), []);
  const history = buildGeorgiaPrimeHistory(points);
  assert.equal(history.at(-1).effective_date, '2026-08-01');
  assert.equal(history.at(-1).value_text, '9.50%');
});
