// Fetcher: Federal Reserve H.15 Selected Interest Rates — 1-year Treasury Constant Maturity yield.
// Source: federalreserve.gov Data Download Program (robots.txt 404 => unrestricted; official bulk feed).
//
// The CSV bundles several maturities as columns. We locate the 1-year column ROBUSTLY by its series
// id (RIFLGFCY01) in the "Unique Identifier" header row rather than assuming a fixed position. Returns
// raw DAILY observations {date, value}; the weekly average + post-judgment derivation live in
// lib/normalize.mjs. "ND" (no data / holiday) rows are skipped.

import { politeGet, nowIso } from '../lib/http.mjs';

export const H15_SOURCE = {
  id: 'fed-h15',
  name: 'Federal Reserve H.15 — 1-Year Treasury Constant Maturity',
  publisher: 'Board of Governors of the Federal Reserve System',
  home_url: 'https://www.federalreserve.gov/releases/h15/',
  license: 'U.S. federal government work — public domain. Fed Data Download Program is a public bulk feed.',
};

// ~2 years of daily observations is enough for a rich weekly series + current freshness.
const CSV_URL =
  'https://www.federalreserve.gov/datadownload/Output.aspx?rel=H15&series=bf17364827e38702b42a58cf8eaa3f78&lastobs=520&filetype=csv&label=include&layout=seriescolumn';
const ONE_YEAR_SERIES_ID = 'RIFLGFCY01'; // 1-year constant maturity, nominal, business day

function splitCsvLine(line) {
  // Simple CSV split; H.15 values contain no embedded commas, but descriptions do — we only use
  // this for the id/data rows, and locate columns via the id row, so quoted-comma fields are fine.
  const out = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export async function fetchH15({ log = () => {} } = {}) {
  const res = await politeGet(CSV_URL, { sourceId: 'fed-h15' });
  const retrieved_at = nowIso();
  const lines = res.body.split(/\r?\n/).filter((l) => l.length);

  // Find the "Unique Identifier" row to locate the 1-year column, and the "Time Period" row where data begins.
  let colIndex = -1;
  let dataStart = -1;
  for (let i = 0; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (/unique identifier/i.test(cells[0])) {
      colIndex = cells.findIndex((c) => c.includes(ONE_YEAR_SERIES_ID));
    }
    if (/^"?Time Period"?$/i.test(cells[0]) || /time period/i.test(cells[0])) {
      dataStart = i + 1;
    }
  }
  if (colIndex === -1) throw new Error(`H15: could not locate 1-year CMT column (${ONE_YEAR_SERIES_ID})`);
  if (dataStart === -1) throw new Error('H15: could not locate data start ("Time Period" row)');

  const daily = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const date = cells[0];
    const raw = cells[colIndex];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!raw || raw === 'ND') continue;
    const value = Number(raw);
    if (!Number.isFinite(value)) continue;
    daily.push({ date, value });
  }

  log(`H.15: parsed ${daily.length} daily 1-yr CMT observations (${daily[0]?.date} … ${daily.at(-1)?.date})`);
  return { source: { ...H15_SOURCE, robots_status: 'allowed', retrieved_at }, retrieved_at, daily, source_url: CSV_URL };
}
