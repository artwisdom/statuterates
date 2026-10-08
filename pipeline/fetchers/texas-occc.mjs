// Fetch the current Texas postjudgment-interest rate from the official OCCC page. Historical months
// are curated from the agency's official table in texas-occc-history.mjs; this small live fetch adds
// each new month automatically during the existing weekly refresh.

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { politeGet, politeGetBuffer } from '../lib/http.mjs';
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

const MAX_TEXAS_CREDIT_LETTER_BYTES = 2 * 1024 * 1024;
const TEXAS_RATE_NOT_FOUND = 'Texas OCCC: current postjudgment rate and month were not found';
const TEXAS_OCCC_ORIGIN = new URL(TEXAS_OCCC_CURRENT_URL).origin;

export function getTexasCivilDate(instant = new Date()) {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (Number.isNaN(date.getTime())) throw new Error('Texas OCCC: invalid clock instant');
  // GitHub runners use UTC, but the agency's published month follows its Texas civil date. Without
  // this conversion, an evening refresh on the final Texas day of a month expects the next month.
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

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
  // OCCC's TablePress markup currently renders the month and year as one text node
  // (for example, `August2026`). Accept either joined or spaced text while retaining
  // the exact label, statutory rate bounds, known-month lookup, and four-digit year gate.
  const match = text.match(/post-?judgment\s+interest\s+rate\s*:\s*(\d+(?:\.\d+)?)\s*%\s*([a-z]+)\s*(\d{4})\b/i);
  if (!match) throw new Error(TEXAS_RATE_NOT_FOUND);

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

function anchorHref(attributes) {
  const match = String(attributes).match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
  return (match?.[1] ?? match?.[2] ?? '').replace(/&amp;/gi, '&');
}

function assertOfficialTexasPdfUrl(rawUrl, label = 'credit-letter') {
  const url = new URL(rawUrl, TEXAS_OCCC_CURRENT_URL);
  if (
    url.origin !== TEXAS_OCCC_ORIGIN
    || !/^\/wp-content\/uploads\/20\d{2}\/(?:0[1-9]|1[0-2])\/[^/]+\.pdf$/i.test(url.pathname)
  ) {
    throw new Error(`Texas OCCC: official ${label} link is not an expected OCCC PDF`);
  }
  return url.href;
}

/**
 * OCCC removed the inline current-rate table in September 2026 but retained exact links to its
 * current and next-month Texas Credit Letters. Accept only those named, same-origin official PDFs;
 * an unrelated or off-site document must never become legal-rate evidence.
 */
export function extractTexasCreditLetterUrls(html) {
  const labels = new Set([
    'postjudgment interest rate (current)',
    'future rate (published after the 15th each month)',
  ]);
  const byLabel = new Map();
  for (const match of String(html).matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const label = htmlToText(match[2]).toLowerCase();
    if (!labels.has(label)) continue;
    const rawHref = anchorHref(match[1]);
    if (!rawHref) throw new Error(`Texas OCCC: official ${label} link has no URL`);
    const url = assertOfficialTexasPdfUrl(rawHref, label);
    const existing = byLabel.get(label);
    if (existing && existing !== url) {
      throw new Error(`Texas OCCC: official ${label} links conflict`);
    }
    byLabel.set(label, url);
  }
  const urls = [...new Set(byLabel.values())];
  if (!urls.length) throw new Error('Texas OCCC: official current/future credit-letter links were not found');
  return urls;
}

export async function extractTexasCreditLetterPdfText(bytes) {
  const data = new Uint8Array(bytes || []);
  if (data.length > MAX_TEXAS_CREDIT_LETTER_BYTES) {
    throw new Error(`Texas OCCC: credit-letter PDF exceeds the ${MAX_TEXAS_CREDIT_LETTER_BYTES}-byte safety limit`);
  }
  if (data.length < 5 || Buffer.from(data.subarray(0, 5)).toString('ascii') !== '%PDF-') {
    throw new Error('Texas OCCC: credit-letter response is not a PDF');
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
    if (pdf.numPages < 1 || pdf.numPages > 4) {
      throw new Error(`Texas OCCC: credit letter has an unexpected ${pdf.numPages}-page layout`);
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

function normalizeUsDate(raw) {
  const match = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (!match) return null;
  const year = 2000 + Number(match[3]);
  const month = Number(match[1]);
  const day = Number(match[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return null;
  return `${year}-${match[1]}-${match[2]}`;
}

/** Parse the exact statutory row from an official OCCC Texas Credit Letter. */
export function parseTexasCreditLetterRate(rawText) {
  const text = String(rawText).replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  const requiredAnchors = [
    'TEXAS CREDIT LETTER',
    'Published Weekly by the Texas Office of Consumer Credit Commissioner',
    'NOTICE OF RATE CEILINGS',
  ];
  for (const anchor of requiredAnchors) {
    if (!text.toLowerCase().includes(anchor.toLowerCase())) {
      throw new Error(`Texas OCCC: credit-letter ${anchor} anchor was not found`);
    }
  }
  const rows = [...text.matchAll(
    /Postjudgment\s+Interest\s+Rate\s*-\s*Sec\.\s*304\.003,\s*TEX\.\s*FIN\.\s*CODE\s+(\d{2}\/\d{2}\/\d{2})\s*-\s*(\d{2}\/\d{2}\/\d{2})\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/gi
  )];
  if (rows.length !== 1) {
    throw new Error(`Texas OCCC: expected one credit-letter postjudgment row, found ${rows.length}`);
  }
  const [, rawStart, rawEnd, consumerText, commercialText] = rows[0];
  const effective_date = normalizeUsDate(rawStart);
  const throughDate = normalizeUsDate(rawEnd);
  if (!effective_date || !throughDate) {
    throw new Error('Texas OCCC: credit-letter postjudgment period is invalid');
  }
  const [year, month, day] = effective_date.split('-').map(Number);
  const expectedEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  if (day !== 1 || throughDate !== expectedEnd) {
    throw new Error(`Texas OCCC: credit-letter period ${rawStart}-${rawEnd} is not one complete month`);
  }
  const consumer = Number(consumerText);
  const commercial = Number(commercialText);
  if (!Number.isFinite(consumer) || consumer < 5 || consumer > 15) {
    throw new Error(`Texas OCCC: credit-letter rate ${consumerText}% is outside the statutory 5%-15% range`);
  }
  if (consumer !== commercial) {
    throw new Error(
      `Texas OCCC: credit-letter consumer ${consumerText}% and commercial ${commercialText}% rates conflict`
    );
  }
  return { value: consumer, effective_date };
}

async function currentRateFromLinkedCreditLetters(html, {
  today,
  getPdfImpl,
  extractPdfTextImpl,
} = {}) {
  const expected = `${today.slice(0, 7)}-01`;
  const candidates = [];
  for (const url of extractTexasCreditLetterUrls(html)) {
    const response = await getPdfImpl(url, { sourceId: TEXAS_OCCC_SOURCE.id });
    const finalUrl = assertOfficialTexasPdfUrl(response.final_url || url);
    if (finalUrl !== url) {
      throw new Error(`Texas OCCC: linked credit letter redirected away from its registered URL`);
    }
    if (!/application\/pdf/i.test(response.contentType || '')) {
      throw new Error(`Texas OCCC: linked credit letter returned ${response.contentType || 'an unknown content type'}`);
    }
    const text = await extractPdfTextImpl(response.body);
    candidates.push({ point: parseTexasCreditLetterRate(text), response, url });
  }
  const current = candidates.filter(({ point }) => point.effective_date === expected);
  if (!current.length) {
    throw new Error(`Texas OCCC: no linked credit letter publishes the current period ${expected}`);
  }
  if (current.length !== 1) {
    const values = current.map(({ point }) => `${point.value}%`).join(', ');
    throw new Error(
      `Texas OCCC: multiple linked credit letters publish the current period ${expected} (${values})`
    );
  }
  return current[0];
}

export function assertCurrentTexasMonth(point, { today = getTexasCivilDate() } = {}) {
  const expected = `${today.slice(0, 7)}-01`;
  if (point.effective_date !== expected) {
    throw new Error(`Texas OCCC: published current period ${point.effective_date} does not match ${expected}`);
  }
}

export async function fetchTexasCurrentRate({
  log = () => {},
  today = getTexasCivilDate(),
  getPageImpl = politeGet,
  getPdfImpl = politeGetBuffer,
  extractPdfTextImpl = extractTexasCreditLetterPdfText,
} = {}) {
  const pageResponse = await getPageImpl(TEXAS_OCCC_CURRENT_URL, { sourceId: TEXAS_OCCC_SOURCE.id });
  let point;
  let evidenceResponse = pageResponse;
  let evidenceUrl = TEXAS_OCCC_CURRENT_URL;
  let evidenceMethod = 'statute-variable-official-page';
  if (pageResponse.final_url && pageResponse.final_url !== TEXAS_OCCC_CURRENT_URL) {
    throw new Error('Texas OCCC: current-rate page redirected away from its registered URL');
  }
  try {
    point = parseTexasCurrentRate(pageResponse.body);
  } catch (error) {
    if (error.message !== TEXAS_RATE_NOT_FOUND) throw error;
    const linked = await currentRateFromLinkedCreditLetters(pageResponse.body, {
      today,
      getPdfImpl,
      extractPdfTextImpl,
    });
    point = linked.point;
    evidenceResponse = linked.response;
    evidenceUrl = linked.url;
    evidenceMethod = 'statute-variable-official-pdf';
    log(`Texas OCCC: current inline table absent; verified linked official credit letter ${linked.url}`);
  }
  assertCurrentTexasMonth(point, { today });
  const retrieved_at = evidenceResponse.retrieved_at;
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
    source_url: evidenceUrl,
    retrieved_at,
    confidence: 'high',
    method: evidenceMethod,
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
