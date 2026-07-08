// Fetcher: IRS quarterly interest rates (26 U.S.C. §6621).
// Source: https://www.irs.gov/payments/quarterly-interest-rates  (robots-permitting; served 200 to our UA)
//
// The page has one HTML table per year ("YYYY interest rates by category"), each with 6 category rows
// and one column per quarter (descending order; the current year has fewer quarters). We pair each
// data table with its preceding year heading, read the quarter order from the header, and emit one
// PUBLISHED observation per (category, quarter). Every quarter is also anchored to an Internal Revenue
// Bulletin; we capture the IRB reference into notes where present for extra provenance.

import { politeGet, nowIso } from '../lib/http.mjs';

const SOURCE = {
  id: 'irs-6621',
  name: 'IRS quarterly interest rates (§6621)',
  publisher: 'U.S. Internal Revenue Service',
  home_url: 'https://www.irs.gov/payments/quarterly-interest-rates',
  license: 'U.S. federal government work — not subject to copyright (public domain).',
};
const PAGE_URL = SOURCE.home_url;

// Category label -> rate-series entity. Order matters (check the more specific label first).
// NOTE: the GATT and "Non-corporate overpayment" labels both CONTAIN the substring "corporate
// overpayment", and "Large corporate underpayment" contains "underpayment", so the specific rules
// must precede the generic ones.
const CATEGORY_RULES = [
  { test: /non-?corporate overpayment/i, slug: 'irs-overpayment-noncorporate', name: 'IRS Overpayment Interest Rate — Non-Corporate' },
  { test: /gatt/i, slug: 'irs-gatt', name: 'IRS GATT Rate (corporate overpayment over $10,000)' },
  { test: /6603/i, slug: 'irs-6603-federal-short-term', name: 'IRC §6603 Deposit / Federal Short-Term Rate' },
  { test: /large corporate underpayment/i, slug: 'irs-large-corporate-underpayment', name: 'IRS Large Corporate Underpayment Rate (LCU)' },
  { test: /underpayment/i, slug: 'irs-underpayment', name: 'IRS Underpayment Interest Rate (§6621)' },
  { test: /corporate overpayment/i, slug: 'irs-overpayment-corporate', name: 'IRS Overpayment Interest Rate — Corporate' },
];

function classify(label) {
  for (const r of CATEGORY_RULES) if (r.test.test(label)) return r;
  return null;
}

const QUARTER_START = { 1: '01-01', 2: '04-01', 3: '07-01', 4: '10-01' };

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

// Determine the quarter numbers, in column order, from a table's header row.
function parseQuarterOrder(theadHtml) {
  const ths = [...theadHtml.matchAll(/<th[^>]*>(.*?)<\/th>/gis)].map((m) => stripTags(m[1]));
  const order = [];
  for (const th of ths.slice(1)) {
    const m = th.match(/(\d)(?:st|nd|rd|th)?\s*quarter/i) || th.match(/^(\d)(?:st|nd|rd|th)\b/i);
    if (m) order.push(Number(m[1]));
  }
  return order;
}

export async function fetchIrs({ log = () => {} } = {}) {
  const res = await politeGet(PAGE_URL, { sourceId: 'irs-6621' });
  const retrieved_at = nowIso();
  const html = res.body;

  // Split the document into segments at each year heading so we can attribute tables to a year.
  const yearHeads = [...html.matchAll(/(\d{4})\s+interest rates by category/gi)].map((m) => ({
    year: Number(m[1]),
    index: m.index,
  }));

  const tables = [...html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)].map((m) => ({
    html: m[1],
    index: m.index,
  }));

  const observations = [];
  const entities = new Map();

  for (const t of tables) {
    if (!/interest categories/i.test(t.html)) continue; // skip the formula/explanation tables
    // Attribute to the most recent preceding year heading.
    const yh = yearHeads.filter((y) => y.index < t.index).sort((a, b) => b.index - a.index)[0];
    if (!yh) continue;
    const year = yh.year;

    const theadMatch = t.html.match(/<thead>([\s\S]*?)<\/thead>/i);
    if (!theadMatch) continue;
    const quarterOrder = parseQuarterOrder(theadMatch[1]);
    if (quarterOrder.length === 0) continue;

    const tbodyMatch = t.html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) continue;
    const rows = [...tbodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];

    for (const row of rows) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((m) => stripTags(m[1]));
      if (cells.length < 2) continue;
      const label = cells[0];
      const cat = classify(label);
      if (!cat) continue;
      entities.set(cat.slug, {
        slug: cat.slug,
        name: cat.name,
        entity_type: 'rate_series',
        jurisdiction: 'US',
        region: 'North America',
        metadata: { authority: 'IRS', statute: '26 U.S.C. §6621', category_label: label },
      });
      const valueCells = cells.slice(1);
      for (let i = 0; i < quarterOrder.length && i < valueCells.length; i++) {
        const q = quarterOrder[i];
        const raw = valueCells[i];
        const m = raw.match(/(-?\d+(?:\.\d+)?)\s*%/);
        if (!m) continue; // e.g. 'N/A' before a category existed
        const value = Number(m[1]);
        observations.push({
          entitySlug: cat.slug,
          metric: 'annual_rate',
          value_numeric: value,
          value_text: `${value}%`,
          unit: 'percent_per_annum',
          effective_date: `${year}-${QUARTER_START[q]}`,
          source_id: SOURCE.id,
          source_url: PAGE_URL,
          retrieved_at,
          confidence: 'high',
          method: 'html-table',
          notes: `IRS §6621 ${q}Q${year} (${label}).`,
        });
      }
    }
  }

  log(`IRS: parsed ${observations.length} observations across ${entities.size} rate series`);
  return {
    source: { ...SOURCE, robots_status: 'allowed', retrieved_at },
    entities: [...entities.values()],
    observations,
  };
}
