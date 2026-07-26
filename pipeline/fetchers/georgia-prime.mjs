// Live monitor for Georgia's Federal Reserve prime-rate input. The fetched FRED PRIME series is
// validated against the complete committed baseline before a later effective-date change may be
// added. This fails closed if FRED changes shape, omits history, or conflicts with a verified row.

import { politeGet } from '../lib/http.mjs';
import {
  GEORGIA_PRIME_CSV_URL,
  GEORGIA_PRIME_SERIES_URL,
  validateGeorgiaPrimeChanges,
} from './georgia-interest-history.mjs';

export function parseGeorgiaPrimeCsv(csv) {
  const lines = String(csv || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines[0]?.replace(/^\uFEFF/, '') !== 'observation_date,PRIME') {
    throw new Error('FRED PRIME: expected observation_date,PRIME header');
  }
  const points = [];
  for (const line of lines.slice(1)) {
    const [effective_date, rawValue, extra] = line.split(',');
    if (extra !== undefined || !/^\d{4}-\d{2}-\d{2}$/.test(effective_date || '')) {
      throw new Error(`FRED PRIME: malformed row "${line}"`);
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) throw new Error(`FRED PRIME: nonnumeric rate in row "${line}"`);
    points.push({ effective_date, value });
  }
  if (!points.length) throw new Error('FRED PRIME: no observations parsed');
  return points;
}

export async function fetchGeorgiaPrimeChanges({ log = () => {}, today } = {}) {
  const response = await politeGet(GEORGIA_PRIME_CSV_URL, { sourceId: 'ga-prime' });
  const changePoints = parseGeorgiaPrimeCsv(response.body);
  const errors = validateGeorgiaPrimeChanges(changePoints, { today });
  if (errors.length) throw new Error(`FRED PRIME integrity check failed: ${errors.join('; ')}`);
  log(`FRED PRIME: ${changePoints.length} verified change points (${changePoints[0].effective_date} … ${changePoints.at(-1).effective_date}, ${changePoints.at(-1).value.toFixed(2)}%)`);
  return {
    changePoints,
    retrieved_at: response.retrieved_at,
    source_url: GEORGIA_PRIME_SERIES_URL,
  };
}
