// Fetch the currently effective Nebraska judgment-interest rate from the official Judicial Branch
// page. The complete 1987-present table is curated separately; this live check appends each new
// quarterly change point without allowing an older or implausible page value to overwrite history.

import { politeGet } from '../lib/http.mjs';
import {
  buildNebraskaOfficialHistory,
  NEBRASKA_JUDICIAL_CURRENT_URL,
} from './nebraska-judgment-history.mjs';

export const NEBRASKA_JUDICIAL_SOURCE = {
  id: 'ne-jud',
  name: 'Nebraska judgment interest rate (Neb. Rev. Stat. §45-103)',
  publisher: 'Nebraska Judicial Branch (official)',
  home_url: NEBRASKA_JUDICIAL_CURRENT_URL,
  license: 'Nebraska government publication - not subject to copyright.',
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

export function parseNebraskaCurrentRate(html) {
  const text = htmlToText(html);
  const match = text.match(/effective\s+([a-z]+)\s+(\d{1,2})\s*,\s*(\d{4})\s*,\s*the\s+judgment\s+interest\s+rate\s+is\s+(\d+(?:\.\d+)?)\s*%/i);
  if (!match) throw new Error('Nebraska Judicial Branch: current judgment rate and effective date were not found');

  const month = MONTHS.get(match[1].toLowerCase());
  const day = Number(match[2]);
  const year = Number(match[3]);
  const value = Number(match[4]);
  if (!month || year < 1987 || year > 2200 || day < 1 || day > 31) {
    throw new Error(`Nebraska Judicial Branch: invalid published date "${match[1]} ${match[2]}, ${match[3]}"`);
  }
  const effective_date = `${year}-${month}-${String(day).padStart(2, '0')}`;
  const date = new Date(`${effective_date}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== effective_date) {
    throw new Error(`Nebraska Judicial Branch: invalid published effective date ${effective_date}`);
  }
  if (!Number.isFinite(value) || value < 0 || value > 30) {
    throw new Error(`Nebraska Judicial Branch: parsed rate ${match[4]}% is outside the accepted range`);
  }
  return { value, value_text: `${Number(match[4]).toFixed(3)}%`, effective_date };
}

export function assertCurrentNebraskaRate(point, {
  today = new Date().toISOString().slice(0, 10),
  history = buildNebraskaOfficialHistory(),
} = {}) {
  if (point.effective_date > today) {
    throw new Error(`Nebraska Judicial Branch: published effective date ${point.effective_date} is after ${today}`);
  }
  const ageDays = Math.floor((new Date(`${today}T00:00:00Z`) - new Date(`${point.effective_date}T00:00:00Z`)) / 86400000);
  if (!Number.isFinite(ageDays) || ageDays > 130) {
    throw new Error(`Nebraska Judicial Branch: published rate is ${ageDays} days old; expected the current quarter`);
  }

  const latest = [...history].sort((a, b) => a.effective_date.localeCompare(b.effective_date)).at(-1);
  if (latest && point.effective_date < latest.effective_date) {
    throw new Error(`Nebraska Judicial Branch: current page ${point.effective_date} is older than verified history ${latest.effective_date}`);
  }
  if (latest && point.effective_date === latest.effective_date && Math.abs(point.value - latest.value) > 1e-9) {
    throw new Error(`Nebraska Judicial Branch: ${point.value}% conflicts with verified ${latest.value.toFixed(3)}% for ${point.effective_date}`);
  }

  // Since the 2002 formula change, the court publishes one effective date in each annual quarter.
  // A new point outside that cadence is more likely a parser error than a legitimate update.
  if (point.effective_date > '2002-07-20') {
    const month = Number(point.effective_date.slice(5, 7));
    const day = Number(point.effective_date.slice(8, 10));
    if (![1, 4, 7, 10].includes(month) || day < 13 || day > 23) {
      throw new Error(`Nebraska Judicial Branch: ${point.effective_date} is outside the expected quarterly effective-date window`);
    }
  }
}

export async function fetchNebraskaCurrentRate({ log = () => {}, today } = {}) {
  const response = await politeGet(NEBRASKA_JUDICIAL_CURRENT_URL, { sourceId: NEBRASKA_JUDICIAL_SOURCE.id });
  const point = parseNebraskaCurrentRate(response.body);
  assertCurrentNebraskaRate(point, { today });
  const retrieved_at = response.retrieved_at;
  const observation = {
    entitySlug: 'nebraska-judgment-rate',
    metric: 'annual_rate',
    value_numeric: point.value,
    value_text: point.value_text,
    unit: 'percent_per_annum',
    effective_date: point.effective_date,
    source_id: NEBRASKA_JUDICIAL_SOURCE.id,
    source_url: NEBRASKA_JUDICIAL_CURRENT_URL,
    retrieved_at,
    confidence: 'high',
    method: 'statute-variable-official-page',
    notes: `The Nebraska Judicial Branch publishes ${point.value_text} effective ${point.effective_date} under Neb. Rev. Stat. §45-103. For judgments entered on or after July 20, 2002, the rate is the first quarterly 26-week Treasury-bill bond investment yield plus two percentage points and is fixed at judgment. Other-law and agreed contract-rate exceptions apply. Verify applicability; not legal advice.`,
  };
  log(`Nebraska Judicial Branch: ${point.effective_date} judgment rate = ${point.value_text}`);
  return {
    source: {
      ...NEBRASKA_JUDICIAL_SOURCE,
      robots_status: 'allowed; current rate fetched through the shared robots-respecting cache',
      retrieved_at,
    },
    retrieved_at,
    observation,
  };
}
