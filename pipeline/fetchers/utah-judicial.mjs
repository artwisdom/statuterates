// Live monitor for the official Utah Courts post-judgment interest tables.
//
// The committed 1993-present table is the durable baseline. A weekly pipeline run may append a
// newly published calendar year only after every overlapping official row still matches that
// baseline and the current-page formulas reconcile exactly. If either court page is unavailable,
// the fetcher keeps the last verified history rather than estimating a replacement.

import { politeGet } from '../lib/http.mjs';
import {
  buildUtahOfficialHistory,
  UTAH_JUDGMENT_CURRENT_URL,
  UTAH_JUDGMENT_HISTORY_URL,
  UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH,
} from './utah-judgment-history.mjs';

function textContent(value) {
  return String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableRows(html) {
  return [...String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map((row) => [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => textContent(cell[1])));
}

export function parseUtahHistoricRates(html) {
  const points = [];
  for (const cells of tableRows(html)) {
    if (cells.length < 2 || !/^(?:19|20)\d{2}$/.test(cells[0])) continue;
    const rawValue = cells[1].replace(/%/g, '').trim();
    const value = Number(rawValue);
    if (!Number.isFinite(value)) continue;
    points.push({
      effective_date: `${cells[0]}-01-01`,
      value,
      value_text: `${rawValue}%`,
      source_url: UTAH_JUDGMENT_HISTORY_URL,
    });
  }
  if (!points.length) throw new Error('Utah Courts historic rate rows were not found');
  return [...new Map(points.map((point) => [point.effective_date, point])).values()]
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
}

export function parseUtahCurrentRates(html) {
  const row = tableRows(html).find((cells) => (
    cells.length >= 4
    && /^(?:19|20)\d{2}$/.test(cells[0])
    && cells.slice(1, 4).every((value) => /^\d+(?:\.\d+)?%$/.test(value))
  ));
  if (!row) throw new Error('Utah Courts current rate row was not found');
  const [year, federalText, generalText, smallClaimText] = row;
  const federal_rate = Number(federalText.replace('%', ''));
  const value = Number(generalText.replace('%', ''));
  const goods_services_under_10000_rate = Number(smallClaimText.replace('%', ''));
  return {
    effective_date: `${year}-01-01`,
    federal_rate,
    value,
    value_text: generalText,
    goods_services_under_10000_rate,
    goods_services_under_10000_value_text: smallClaimText,
    source_url: UTAH_JUDGMENT_CURRENT_URL,
  };
}

export function assertUtahCourtHistory(points, {
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const baseline = buildUtahOfficialHistory();
  const baselineByDate = new Map(baseline.map((point) => [point.effective_date, point]));
  const latest = points.at(-1);
  if (!latest || latest.effective_date < UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    throw new Error(`Utah Courts history ends before verified baseline ${UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH}`);
  }

  const currentYear = Number(today.slice(0, 4));
  if (Number(latest.effective_date.slice(0, 4)) > currentYear + 1) {
    throw new Error(`Utah Courts latest year ${latest.effective_date.slice(0, 4)} is implausibly in the future`);
  }

  for (const point of points) {
    if (!/^\d{4}-01-01$/.test(point.effective_date)) {
      throw new Error(`Utah Courts published invalid annual date ${point.effective_date}`);
    }
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      throw new Error(`Utah Courts rate ${point.value}% at ${point.effective_date} is outside the accepted range`);
    }
    const verified = baselineByDate.get(point.effective_date);
    if (verified && (
      Math.abs(verified.value - point.value) > 1e-9
      || verified.value_text !== point.value_text
    )) {
      throw new Error(`Utah Courts changed verified ${point.effective_date} from ${verified.value_text} to ${point.value_text}`);
    }
  }
}

export function assertUtahCurrentRates(point, {
  today = new Date().toISOString().slice(0, 10),
  history = buildUtahOfficialHistory(),
} = {}) {
  const currentYear = Number(today.slice(0, 4));
  const pointYear = Number(point.effective_date.slice(0, 4));
  if (pointYear < currentYear - 1 || pointYear > currentYear + 1) {
    throw new Error(`Utah Courts current rate year ${pointYear} is outside the expected window`);
  }
  if (Math.abs(point.value - (point.federal_rate + 2)) > 1e-9) {
    throw new Error('Utah Courts general judgment rate does not equal the published federal rate plus two points');
  }
  if (Math.abs(point.goods_services_under_10000_rate - (point.federal_rate + 10)) > 1e-9) {
    throw new Error('Utah Courts under-$10,000 goods/services rate does not equal the published federal rate plus ten points');
  }
  const matchingHistory = history.find((candidate) => candidate.effective_date === point.effective_date);
  if (matchingHistory && Math.abs(matchingHistory.value - point.value) > 1e-9) {
    throw new Error(`Utah Courts current ${point.value_text} conflicts with historic ${matchingHistory.value_text}`);
  }
}

export async function fetchUtahCourtRates({
  getImpl = politeGet,
  log = () => {},
  today,
} = {}) {
  let historyPoints = [];
  let current = null;
  const retrievals = [];
  const failures = [];

  try {
    const response = await getImpl(UTAH_JUDGMENT_HISTORY_URL, { sourceId: 'ut-jud' });
    const parsed = parseUtahHistoricRates(response.body);
    assertUtahCourtHistory(parsed, { today });
    historyPoints = parsed;
    retrievals.push(response.retrieved_at);
  } catch (error) {
    historyPoints = [];
    failures.push(`history: ${error.message}`);
  }

  try {
    const response = await getImpl(UTAH_JUDGMENT_CURRENT_URL, { sourceId: 'ut-jud' });
    const parsed = parseUtahCurrentRates(response.body);
    assertUtahCurrentRates(parsed, {
      today,
      history: historyPoints.length ? historyPoints : buildUtahOfficialHistory(),
    });
    current = parsed;
    retrievals.push(response.retrieved_at);
  } catch (error) {
    current = null;
    failures.push(`current: ${error.message}`);
  }

  // A newly added historic year is published only after the current table independently
  // confirms the same rate and both statutory formula branches. If the current page is
  // temporarily unavailable or lags the history page, retain the verified baseline instead.
  const historyExtensions = historyPoints
    .filter((point) => point.effective_date > UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH);
  if (historyExtensions.length) {
    const latestExtension = historyExtensions.at(-1);
    if (!current
      || current.effective_date !== latestExtension.effective_date
      || Math.abs(current.value - latestExtension.value) > 1e-9) {
      failures.push(`history extension ${latestExtension.effective_date} lacks matching current-table formula confirmation`);
      historyPoints = historyPoints
        .filter((point) => point.effective_date <= UTAH_OFFICIAL_HISTORY_COMPLETE_THROUGH);
    }
  }

  if (!historyPoints.length && !current) {
    log(`Utah Courts unavailable (${failures.join('; ')}); using verified official history without an estimated replacement.`);
    return null;
  }

  const retrieved_at = retrievals.filter(Boolean).sort().at(-1) || new Date().toISOString();
  const through = historyPoints.at(-1)?.effective_date || current.effective_date;
  log(`Utah Courts: verified official judgment rates through ${through}${failures.length ? ` (${failures.join('; ')})` : ''}`);
  return {
    historyPoints,
    current,
    retrieved_at,
    source: {
      id: 'ut-jud',
      name: 'Utah post-judgment interest current and historical tables',
      publisher: 'Utah State Courts (official)',
      home_url: UTAH_JUDGMENT_CURRENT_URL,
      license: 'Government edict — not subject to copyright.',
      robots_status: `official current/history tables fetched ${retrieved_at}`,
      retrieved_at,
    },
  };
}
