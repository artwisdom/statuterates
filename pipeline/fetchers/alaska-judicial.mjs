// Live monitor for Alaska Court System form ADM-505.
//
// The committed 1997-present schedule is the durable baseline. Each weekly refresh downloads the
// official one-page PDF through the shared robots/throttle/cache layer, extracts its text with
// Mozilla PDF.js, verifies every historical anchor, and accepts a new annual row only when the court
// publishes it in the same judgment-year table. An outage or unexpected form redesign retains the
// last verified history instead of estimating a rate.

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { politeGetBuffer } from '../lib/http.mjs';
import {
  ALASKA_ADM_505_URL,
  ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH,
  ALASKA_OFFICIAL_HISTORY_START,
  buildAlaskaOfficialHistory,
} from './alaska-interest-history.mjs';

const MAX_ADM_505_BYTES = 5 * 1024 * 1024;

export async function extractAlaskaPdfText(bytes) {
  const data = new Uint8Array(bytes || []);
  if (data.length > MAX_ADM_505_BYTES) {
    throw new Error(`Alaska ADM-505 PDF exceeds the ${MAX_ADM_505_BYTES}-byte safety limit`);
  }
  if (data.length < 5 || Buffer.from(data.subarray(0, 5)).toString('ascii') !== '%PDF-') {
    throw new Error('Alaska ADM-505 response is not a PDF');
  }
  const task = getDocument({
    data,
    verbosity: 0,
    isEvalSupported: false,
    useSystemFonts: false,
    stopAtErrors: true,
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages < 1 || pdf.numPages > 3) {
      throw new Error(`Alaska ADM-505 has an unexpected ${pdf.numPages}-page layout`);
    }
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str).join(' '));
    }
    return pages.join('\n').replace(/\s+/g, ' ').trim();
  } finally {
    await task.destroy();
  }
}

export function parseAlaskaAdm505Text(rawText) {
  const text = String(rawText)
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
  const current = text.match(
    /For judgments entered in\s+(20\d{2}),\s+this rate is\s+(\d+(?:\.\d+)?)%/i
  );
  if (!current) throw new Error('Alaska ADM-505 current judgment-year rate was not found');

  const tableStart = text.search(/The rates for prior years were:/i);
  const tableEnd = text.search(/Note\s*:\s*The interest rate on a particular judgment/i);
  if (tableStart === -1 || tableEnd <= tableStart) {
    throw new Error('Alaska ADM-505 prior-year table boundaries were not found');
  }
  const table = text.slice(tableStart, tableEnd);
  const byDate = new Map();
  const addPoint = (year, valueText) => {
    const effective_date = year === 1997 ? ALASKA_OFFICIAL_HISTORY_START : `${year}-01-01`;
    const value = Number(valueText);
    if (!Number.isInteger(year) || !Number.isFinite(value)) return;
    const point = {
      effective_date,
      value,
      value_text: `${valueText}%`,
      source_url: ALASKA_ADM_505_URL,
    };
    const existing = byDate.get(effective_date);
    if (existing && Math.abs(existing.value - value) > 1e-9) {
      throw new Error(`Alaska ADM-505 published conflicting values for ${effective_date}`);
    }
    byDate.set(effective_date, point);
  };

  const rowPattern = /\b((?:19|20)\d{2})(?:\s*-\s*((?:19|20)\d{2}))?(?:\s*\(on\s+or\s+after\s+August\s+7\s*(?:th)?\s*\))?\s+(\d+(?:\.\d+)?)%/gi;
  for (const match of table.matchAll(rowPattern)) {
    const startYear = Number(match[1]);
    const endYear = Number(match[2] || match[1]);
    if (endYear < startYear || endYear - startYear > 20) {
      throw new Error(`Alaska ADM-505 contains an implausible year range ${match[1]}-${match[2]}`);
    }
    for (let year = startYear; year <= endYear; year++) addPoint(year, match[3]);
  }
  addPoint(Number(current[1]), current[2]);

  const points = [...byDate.values()]
    .sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (!points.length) throw new Error('Alaska ADM-505 historical rates were not found');
  return points;
}

export function assertAlaskaCourtHistory(points, {
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const baseline = buildAlaskaOfficialHistory();
  const baselineByDate = new Map(baseline.map((point) => [point.effective_date, point]));
  const sorted = [...(points || [])].sort((a, b) => a.effective_date.localeCompare(b.effective_date));
  if (sorted[0]?.effective_date !== ALASKA_OFFICIAL_HISTORY_START) {
    throw new Error(`Alaska ADM-505 history must begin ${ALASKA_OFFICIAL_HISTORY_START}`);
  }
  if (sorted.at(-1)?.effective_date < ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH) {
    throw new Error(`Alaska ADM-505 history ends before verified baseline ${ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH}`);
  }

  const currentYear = Number(today.slice(0, 4));
  for (const point of sorted) {
    if (!Number.isFinite(point.value) || point.value < 0 || point.value > 30) {
      throw new Error(`Alaska ADM-505 rate ${point.value}% at ${point.effective_date} is outside the accepted range`);
    }
    const year = Number(point.effective_date.slice(0, 4));
    if (year > currentYear + 1) {
      throw new Error(`Alaska ADM-505 year ${year} is implausibly in the future`);
    }
    const verified = baselineByDate.get(point.effective_date);
    if (verified && (
      Math.abs(verified.value - point.value) > 1e-9
      || verified.value_text !== point.value_text
    )) {
      throw new Error(`Alaska ADM-505 changed verified ${point.effective_date} from ${verified.value_text} to ${point.value_text}`);
    }
  }

  let expectedYear = Number(ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH.slice(0, 4)) + 1;
  for (const point of sorted.filter(
    (candidate) => candidate.effective_date > ALASKA_OFFICIAL_HISTORY_COMPLETE_THROUGH
  )) {
    const expectedDate = `${expectedYear}-01-01`;
    if (point.effective_date !== expectedDate) {
      throw new Error(`Alaska ADM-505 extension must continue annually with ${expectedDate}, found ${point.effective_date}`);
    }
    expectedYear++;
  }
}

export async function fetchAlaskaCourtRates({
  getImpl = politeGetBuffer,
  log = () => {},
  today,
} = {}) {
  try {
    const response = await getImpl(ALASKA_ADM_505_URL, { sourceId: 'ak-jud' });
    if (!/application\/pdf/i.test(response.contentType || '')) {
      throw new Error(`Alaska ADM-505 returned ${response.contentType || 'an unknown content type'}`);
    }
    const text = await extractAlaskaPdfText(response.body);
    const historyPoints = parseAlaskaAdm505Text(text);
    assertAlaskaCourtHistory(historyPoints, { today });
    const retrieved_at = response.retrieved_at || new Date().toISOString();
    log(`Alaska Courts: parsed ${historyPoints.length} official annual rates through ${historyPoints.at(-1).effective_date}`);
    return { historyPoints, retrieved_at };
  } catch (error) {
    log(`Alaska Courts unavailable (${error.message}); using verified official history without an estimated replacement.`);
    return null;
  }
}
