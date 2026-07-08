// Fetcher: ECB Main Refinancing Operations (MRO) fixed rate, via the ECB Data Portal REST API (SDMX
// CSV). Series FM.B.U2.EUR.4F.KR.MRR_FR.LEV. The feed is already in change-point form (one row per
// rate change). robots-permitting (the data-api host, not the human portal).

import { politeGet, nowIso } from '../lib/http.mjs';

export const ECB_SOURCE = {
  id: 'ecb-mro',
  name: 'ECB — Main Refinancing Operations fixed rate (MRR)',
  publisher: 'European Central Bank',
  home_url: 'https://data.ecb.europa.eu/data/datasets/FM/FM.B.U2.EUR.4F.KR.MRR_FR.LEV',
  license: 'ECB statistical data, free to reuse with attribution.',
};

export const ECB_ENTITY = {
  slug: 'ecb-main-refinancing-rate',
  name: 'ECB Main Refinancing Operations Rate',
  entity_type: 'rate_series',
  jurisdiction: 'EU',
  region: 'European Union',
  metadata: { authority: 'European Central Bank', series_id: 'FM.B.U2.EUR.4F.KR.MRR_FR.LEV' },
};

const CSV_URL =
  'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.MRR_FR.LEV?format=csvdata&startPeriod=2015-01-01';

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export async function fetchEcb({ log = () => {} } = {}) {
  const res = await politeGet(CSV_URL, { sourceId: 'ecb-mro' });
  const retrieved_at = nowIso();
  const lines = res.body.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]);
  const tp = header.indexOf('TIME_PERIOD');
  const ov = header.indexOf('OBS_VALUE');
  if (tp === -1 || ov === -1) throw new Error('ECB: TIME_PERIOD/OBS_VALUE columns not found');

  const changePoints = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const date = cells[tp];
    const value = Number(cells[ov]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value)) continue;
    changePoints.push({ date, value });
  }
  changePoints.sort((a, b) => (a.date < b.date ? -1 : 1));
  // The MRO feed occasionally repeats the same value on later decision dates (rate held). Keep only
  // rows where the value actually changed, so the published series is a true rate-change history.
  const deduped = [];
  let prev = null;
  for (const p of changePoints) {
    if (prev === null || p.value !== prev) deduped.push(p);
    prev = p.value;
  }
  log(`ECB: ${changePoints.length} rows -> ${deduped.length} MRO change-points (latest ${deduped.at(-1)?.date} = ${deduped.at(-1)?.value}%)`);
  return { source: { ...ECB_SOURCE, robots_status: 'allowed', retrieved_at }, retrieved_at, changePoints: deduped, source_url: CSV_URL };
}
