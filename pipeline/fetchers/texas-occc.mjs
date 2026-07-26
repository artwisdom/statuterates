// Fetch the current Texas postjudgment-interest rate from the official OCCC page. Historical months
// are curated from the agency's official table in texas-occc-history.mjs; this small live fetch adds
// each new month automatically during the existing weekly refresh.

import { politeGet } from '../lib/http.mjs';
import { TEXAS_OCCC_CURRENT_URL } from './texas-occc-history.mjs';

export const TEXAS_OCCC_SOURCE = {
  id: 'tx-occc',
  name: 'Texas postjudgment interest rate (Finance Code §304.003)',
  publisher: 'Texas Office of Consumer Credit Commissioner (official)',
  home_url: TEXAS_OCCC_CURRENT_URL,
  license: 'Texas government publication — not subject to copyright.',
};

const MONTHS = new Map([
  ['january', '01'], ['february', '02'], ['march', '03'], ['april', '04'],
  ['may', '05'], ['june', '06'], ['july', '07'], ['august', '08'],
  ['september', '09'], ['october', '10'], ['november', '11'], ['december', '12'],
]);

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseTexasCurrentRate(html) {
  const text = htmlToText(html);
  const match = text.match(/post-?judgment\s+interest\s+rate\s*:\s*(\d+(?:\.\d+)?)\s*%\s*([a-z]+)\s+(\d{4})/i);
  if (!match) throw new Error('Texas OCCC: current postjudgment rate and month were not found');

  const value = Number(match[1]);
  const month = MONTHS.get(match[2].toLowerCase());
  const year = Number(match[3]);
  if (!month || year < 1983 || year > 2200) {
    throw new Error(`Texas OCCC: invalid published period "${match[2]} ${match[3]}"`);
  }
  // Finance Code §304.003 imposes a 5% floor and 15% ceiling. A value outside that range means the
  // parser captured the wrong percentage and must fail before export.
  if (!Number.isFinite(value) || value < 5 || value > 15) {
    throw new Error(`Texas OCCC: parsed rate ${match[1]}% is outside the statutory 5%-15% range`);
  }
  return { value, effective_date: `${year}-${month}-01` };
}

export function assertCurrentTexasMonth(point, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const expected = `${today.slice(0, 7)}-01`;
  if (point.effective_date !== expected) {
    throw new Error(`Texas OCCC: published current period ${point.effective_date} does not match ${expected}`);
  }
}

export async function fetchTexasCurrentRate({ log = () => {}, today } = {}) {
  const response = await politeGet(TEXAS_OCCC_CURRENT_URL, { sourceId: TEXAS_OCCC_SOURCE.id });
  const point = parseTexasCurrentRate(response.body);
  assertCurrentTexasMonth(point, { today });
  const retrieved_at = response.retrieved_at;
  const monthLabel = new Date(`${point.effective_date}T00:00:00Z`).toLocaleString('en-US', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  });
  const observation = {
    entitySlug: 'texas-judgment-rate',
    metric: 'annual_rate',
    value_numeric: point.value,
    value_text: `${point.value}%`,
    unit: 'percent_per_annum',
    effective_date: point.effective_date,
    source_id: TEXAS_OCCC_SOURCE.id,
    source_url: TEXAS_OCCC_CURRENT_URL,
    retrieved_at,
    confidence: 'high',
    method: 'statute-variable-official-page',
    notes: `Texas OCCC published ${point.value}% for money judgments rendered during ${monthLabel}. Under Texas Finance Code §§304.003, 304.005, and 304.006, the general noncontract rate is fixed at judgment, accrues from rendition through satisfaction (subject to the appeal-extension exception), and compounds annually. Contract, tax, and child-support branches can differ. Verify applicability; not legal advice.`,
  };
  log(`Texas OCCC: ${point.effective_date} postjudgment rate = ${point.value}%`);
  return {
    source: {
      ...TEXAS_OCCC_SOURCE,
      robots_status: 'allowed; current rate fetched through the shared robots-respecting cache',
      retrieved_at,
    },
    retrieved_at,
    observation,
  };
}
