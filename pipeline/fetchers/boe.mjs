// Fetcher: Bank of England Bank Rate (official series IUDBEDR) via the BoE Interactive Database CSV.
// robots-permitting; returns the rate as CHANGE-POINTS (the daily series is constant between MPC
// decisions, so we keep only the days the rate actually changed — that IS the meaningful history).

import { politeGet, nowIso } from '../lib/http.mjs';

export const BOE_SOURCE = {
  id: 'boe-bank-rate',
  name: 'Bank of England — Bank Rate (IUDBEDR)',
  publisher: 'Bank of England',
  home_url: 'https://www.bankofengland.co.uk/boeapps/database/Bank-Rate.asp',
  license: 'Bank of England statistical data, free to reuse with attribution.',
};

export const BOE_ENTITY = {
  slug: 'boe-bank-rate',
  name: 'Bank of England Bank Rate',
  entity_type: 'rate_series',
  jurisdiction: 'GB',
  region: 'United Kingdom',
  metadata: { authority: 'Bank of England (Monetary Policy Committee)', series_id: 'IUDBEDR' },
};

const CSV_URL =
  'https://www.bankofengland.co.uk/boeapps/database/_iadb-fromshowcolumns.asp?csv.x=yes&Datefrom=01/Jan/2015&Dateto=now&SeriesCodes=IUDBEDR&CSVF=TN&UsingCodes=Y&VPD=Y&VFD=N';

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

function ukDateToIso(s) {
  const [d, mon, y] = s.trim().split(/\s+/);
  return `${y}-${MONTHS[mon]}-${d.padStart(2, '0')}`;
}

/** Reduce a dense daily series to the days the value changed. Input sorted ascending. */
export function toChangePoints(daily) {
  const pts = [];
  let prev = null;
  for (const { date, value } of daily) {
    if (prev === null || value !== prev) pts.push({ date, value });
    prev = value;
  }
  return pts;
}

export async function fetchBoe({ log = () => {} } = {}) {
  const res = await politeGet(CSV_URL, { sourceId: 'boe-bank-rate' });
  const retrieved_at = nowIso();
  const lines = res.body.split(/\r?\n/).filter(Boolean);
  // header: DATE,IUDBEDR
  const daily = [];
  for (const line of lines.slice(1)) {
    const [dateRaw, valRaw] = line.split(',');
    if (!dateRaw || valRaw === undefined) continue;
    const iso = ukDateToIso(dateRaw);
    const value = Number(valRaw);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !Number.isFinite(value)) continue;
    daily.push({ date: iso, value });
  }
  daily.sort((a, b) => (a.date < b.date ? -1 : 1));
  const changePoints = toChangePoints(daily);
  log(`BoE: ${daily.length} daily obs -> ${changePoints.length} Bank Rate change-points (latest ${changePoints.at(-1)?.date} = ${changePoints.at(-1)?.value}%)`);
  return { source: { ...BOE_SOURCE, robots_status: 'allowed', retrieved_at }, retrieved_at, changePoints, source_url: CSV_URL };
}
