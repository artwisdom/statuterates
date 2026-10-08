import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertCurrentTexasMonth,
  extractTexasCreditLetterPdfText,
  extractTexasCreditLetterUrls,
  fetchTexasCurrentRate,
  getTexasCivilDate,
  parseTexasCreditLetterRate,
  parseTexasCurrentRate,
} from './texas-occc.mjs';
import { buildTexasOfficialMonthlyHistory, validateTexasMonthlyHistory } from './texas-occc-history.mjs';

const CURRENT_AND_FUTURE_LINKS = `
  <ul>
    <li><a href="https://occc.texas.gov/wp-content/uploads/2026/08/08-19-2026.pdf">
      Postjudgment Interest Rate (current)
    </a></li>
    <li><a href="https://occc.texas.gov/wp-content/uploads/2026/09/09-16-2026.pdf">
      Future Rate&nbsp;(published after the 15th each month)
    </a></li>
  </ul>
`;

const SEPTEMBER_LETTER_TEXT = `
  TEXAS CREDIT LETTER
  Published Weekly by the Texas Office of Consumer Credit Commissioner
  NOTICE OF RATE CEILINGS
  Postjudgment Interest Rate - Sec. 304.003, TEX. FIN. CODE
  09/01/26-09/30/26 6.75% 6.75%
`;

const OCTOBER_LETTER_TEXT = `
  TEXAS CREDIT LETTER
  Published Weekly by the Texas Office of Consumer Credit Commissioner
  NOTICE OF RATE CEILINGS
  Postjudgment Interest Rate - Sec. 304.003, TEX. FIN. CODE
  10/01/26-10/31/26 6.75% 6.75%
`;

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

test('Texas current-page parser accepts the agency current-table month and year without a space', () => {
  const html = `
    <table><tr><td><strong>Postjudgment Interest Rate: 6.75%</strong><br />August2026</td></tr></table>
  `;
  assert.deepEqual(parseTexasCurrentRate(html), { value: 6.75, effective_date: '2026-08-01' });
});

test('Texas fallback accepts only exact same-origin current/future OCCC credit-letter links', () => {
  assert.deepEqual(extractTexasCreditLetterUrls(CURRENT_AND_FUTURE_LINKS), [
    'https://occc.texas.gov/wp-content/uploads/2026/08/08-19-2026.pdf',
    'https://occc.texas.gov/wp-content/uploads/2026/09/09-16-2026.pdf',
  ]);
  assert.throws(
    () => extractTexasCreditLetterUrls(
      CURRENT_AND_FUTURE_LINKS.replace('https://occc.texas.gov/wp-content', 'https://example.com/wp-content')
    ),
    /is not an expected OCCC PDF/
  );
  assert.throws(
    () => extractTexasCreditLetterUrls(
      CURRENT_AND_FUTURE_LINKS.replace('occc.texas.gov/wp-content', 'occc.texas.gov:444/wp-content')
    ),
    /is not an expected OCCC PDF/
  );
  assert.throws(
    () => extractTexasCreditLetterUrls('<a href="report.pdf">Unrelated report</a>'),
    /official current\/future credit-letter links were not found/
  );
});

test('Texas credit-letter parser requires the official contract, a complete month, and equal rates', () => {
  assert.deepEqual(parseTexasCreditLetterRate(OCTOBER_LETTER_TEXT), {
    value: 6.75,
    effective_date: '2026-10-01',
  });
  assert.throws(
    () => parseTexasCreditLetterRate(OCTOBER_LETTER_TEXT.replace('NOTICE OF RATE CEILINGS', 'Rates')),
    /NOTICE OF RATE CEILINGS anchor was not found/
  );
  assert.throws(
    () => parseTexasCreditLetterRate(OCTOBER_LETTER_TEXT.replace('10/31/26', '10/30/26')),
    /is not one complete month/
  );
  assert.throws(
    () => parseTexasCreditLetterRate(OCTOBER_LETTER_TEXT.replace('6.75% 6.75%', '6.75% 7.00%')),
    /rates conflict/
  );
});

test('Texas fetcher selects only the linked letter that explicitly covers the current month', async () => {
  const retrieved = {
    'https://occc.texas.gov/wp-content/uploads/2026/08/08-19-2026.pdf': '2026-10-08T14:00:01.000Z',
    'https://occc.texas.gov/wp-content/uploads/2026/09/09-16-2026.pdf': '2026-10-08T14:00:02.000Z',
  };
  const textByUrl = new Map([
    ['https://occc.texas.gov/wp-content/uploads/2026/08/08-19-2026.pdf', SEPTEMBER_LETTER_TEXT],
    ['https://occc.texas.gov/wp-content/uploads/2026/09/09-16-2026.pdf', OCTOBER_LETTER_TEXT],
  ]);
  const logs = [];
  const result = await fetchTexasCurrentRate({
    today: '2026-10-08',
    log: (message) => logs.push(message),
    getPageImpl: async () => ({ body: CURRENT_AND_FUTURE_LINKS, retrieved_at: '2026-10-08T14:00:00.000Z' }),
    getPdfImpl: async (url) => ({
      body: Buffer.from(url),
      contentType: 'application/pdf',
      retrieved_at: retrieved[url],
    }),
    extractPdfTextImpl: async (body) => textByUrl.get(body.toString()),
  });
  assert.equal(result.observation.value_numeric, 6.75);
  assert.equal(result.observation.effective_date, '2026-10-01');
  assert.equal(
    result.observation.source_url,
    'https://occc.texas.gov/wp-content/uploads/2026/09/09-16-2026.pdf'
  );
  assert.equal(result.observation.method, 'statute-variable-official-pdf');
  assert.equal(result.retrieved_at, '2026-10-08T14:00:02.000Z');
  assert.ok(logs.some((message) => message.includes('verified linked official credit letter')));
});

test('Texas linked-letter fallback fails closed for stale, conflicting, or non-PDF evidence', async () => {
  const base = {
    today: '2026-10-08',
    getPageImpl: async () => ({ body: CURRENT_AND_FUTURE_LINKS, retrieved_at: '2026-10-08T14:00:00.000Z' }),
  };
  await assert.rejects(
    fetchTexasCurrentRate({
      ...base,
      getPdfImpl: async () => ({ body: Buffer.from('pdf'), contentType: 'application/pdf' }),
      extractPdfTextImpl: async () => SEPTEMBER_LETTER_TEXT,
    }),
    /no linked credit letter publishes the current period 2026-10-01/
  );
  let calls = 0;
  await assert.rejects(
    fetchTexasCurrentRate({
      ...base,
      getPdfImpl: async () => ({ body: Buffer.from(String(calls++)), contentType: 'application/pdf' }),
      extractPdfTextImpl: async (body) => body.toString() === '0'
        ? OCTOBER_LETTER_TEXT
        : OCTOBER_LETTER_TEXT.replaceAll('6.75%', '7.00%'),
    }),
    /multiple linked credit letters publish the current period/
  );
  await assert.rejects(
    fetchTexasCurrentRate({
      ...base,
      getPdfImpl: async () => ({ body: Buffer.from('html'), contentType: 'text/html' }),
    }),
    /linked credit letter returned text\/html/
  );
  await assert.rejects(
    fetchTexasCurrentRate({
      ...base,
      getPdfImpl: async (url) => ({
        body: Buffer.from('pdf'),
        contentType: 'application/pdf',
        final_url: url.includes('08-19') ? 'https://example.com/untrusted.pdf' : url,
      }),
      extractPdfTextImpl: async () => SEPTEMBER_LETTER_TEXT,
    }),
    /link is not an expected OCCC PDF/
  );
});

test('Texas PDF parser rejects oversized and non-PDF input before PDF.js', async () => {
  const oversized = Buffer.alloc(2 * 1024 * 1024 + 1);
  oversized.write('%PDF-');
  await assert.rejects(() => extractTexasCreditLetterPdfText(oversized), /safety limit/);
  await assert.rejects(() => extractTexasCreditLetterPdfText(Buffer.from('<html>')), /not a PDF/);
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

test('Texas current-period gate follows the agency civil date at a UTC month boundary', () => {
  const texasToday = getTexasCivilDate(new Date('2026-09-01T02:16:00Z'));
  assert.equal(texasToday, '2026-08-31');
  assert.doesNotThrow(() => {
    assertCurrentTexasMonth({ effective_date: '2026-08-01' }, { today: texasToday });
  });
});
