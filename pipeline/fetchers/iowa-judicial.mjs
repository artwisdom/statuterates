import {
  buildIowaOfficialHistory,
  IOWA_CURATED_HISTORY_COMPLETE_THROUGH,
  IOWA_HISTORY_VERIFIED_AT,
  IOWA_JUDICIAL_TABLE_URL,
} from './iowa-judgment-history.mjs';

function textContent(value) {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDate(value) {
  const cleaned = value.trim().replace(/\/{2,}/g, '/');
  const match = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!match) return null;
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso ? null : iso;
}

export function parseIowaCourtTable(html) {
  const cells = [...String(html).matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((match) => textContent(match[1]));
  const points = [];
  for (let index = 0; index < cells.length - 1; index++) {
    const effective_date = normalizeDate(cells[index]);
    if (!effective_date) continue;
    const index_value = Number(cells[index + 1]);
    if (!Number.isFinite(index_value)) continue;
    const value = Math.round((index_value + 2) * 1000) / 1000;
    points.push({ effective_date, index_value, value, value_text: `${value}%`, source_url: IOWA_JUDICIAL_TABLE_URL });
    index++;
  }
  if (!points.length) throw new Error('Iowa Judicial Branch rate rows were not found');
  return [...new Map(points.map((point) => [point.effective_date, point])).values()]
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
}

export function assertIowaCourtTable(points, { today = new Date().toISOString().slice(0, 10) } = {}) {
  const curatedByDate = new Map(buildIowaOfficialHistory().map((point) => [point.effective_date, point]));
  const latest = points.at(-1);
  if (!latest || latest.effective_date < IOWA_CURATED_HISTORY_COMPLETE_THROUGH) {
    throw new Error(`Iowa court table ends before verified baseline ${IOWA_CURATED_HISTORY_COMPLETE_THROUGH}`);
  }
  const futureLimit = new Date(`${today}T00:00:00Z`);
  futureLimit.setUTCDate(futureLimit.getUTCDate() + 7);
  if (new Date(`${latest.effective_date}T00:00:00Z`) > futureLimit) {
    throw new Error(`Iowa court table latest date ${latest.effective_date} is implausibly in the future`);
  }
  for (const point of points) {
    if (point.index_value < -2 || point.index_value > 28) {
      throw new Error(`Iowa court index ${point.index_value}% at ${point.effective_date} is outside the accepted range`);
    }
    const curated = curatedByDate.get(point.effective_date);
    if (curated && Math.abs(curated.index_value - point.index_value) > 1e-9) {
      throw new Error(`Iowa court table changed verified ${point.effective_date} from ${curated.index_value}% to ${point.index_value}%`);
    }
  }
}

export async function fetchIowaCourtTable({ fetchImpl = fetch, log = () => {}, today } = {}) {
  try {
    const response = await fetchImpl(IOWA_JUDICIAL_TABLE_URL, {
      headers: { 'user-agent': 'StatuteRates/0.3 (+https://statuterates.com/methodology/)' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const points = parseIowaCourtTable(await response.text());
    assertIowaCourtTable(points, { today });
    const retrieved_at = new Date().toISOString();
    log(`Iowa Judicial Branch: parsed ${points.length} official table rows through ${points.at(-1).effective_date}`);
    return {
      points,
      retrieved_at,
      source: {
        id: 'ia-jud',
        name: 'Iowa post-judgment interest table',
        publisher: 'Iowa Judicial Branch (official)',
        home_url: IOWA_JUDICIAL_TABLE_URL,
        license: 'Government edict — not subject to copyright.',
        robots_status: `official table fetched ${retrieved_at}`,
        retrieved_at,
      },
    };
  } catch (error) {
    // The current Judicial Branch site intermittently returns a WAF 403 to non-browser clients.
    // Keep the last verified official table; never substitute a daily H.15 observation for the
    // court-administered monthly selection.
    log(`Iowa Judicial Branch unavailable (${error.message}); using verified official history without an estimated replacement.`);
    return null;
  }
}

export const IOWA_STATIC_SOURCE = Object.freeze({
  id: 'ia-jud',
  name: 'Iowa post-judgment interest table and historical PDFs',
  publisher: 'Iowa Judicial Branch (official)',
  home_url: IOWA_JUDICIAL_TABLE_URL,
  license: 'Government edict — not subject to copyright.',
  robots_status: `official historical table verified through ${IOWA_CURATED_HISTORY_COMPLETE_THROUGH}; current endpoint last checked ${IOWA_HISTORY_VERIFIED_AT.slice(0, 10)}`,
  retrieved_at: IOWA_HISTORY_VERIFIED_AT,
});
