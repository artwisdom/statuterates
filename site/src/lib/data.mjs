// Build-time data loader. Reads the versioned JSON snapshots (data/exports/) produced by the
// pipeline. Everything here runs during `astro build`; nothing ships to the client.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTS = resolve(__dirname, '..', '..', '..', 'data', 'exports');

function readJson(rel) {
  const p = join(EXPORTS, rel);
  if (!existsSync(p)) throw new Error(`Missing export ${p}. Run the pipeline (pipeline/ -> node run.mjs all) first.`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function getMeta() {
  return readJson('meta.json');
}

export function getEntity(slug) {
  return readJson(join('entity', `${slug}.json`));
}

export function getAllEntities() {
  const dir = join(EXPORTS, 'entity');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readJson(join('entity', f)));
}

// Per-state prejudgment rates are a distinct metric with their own index page; they are kept out
// of the homepage state grid (so it doesn't double) but remain first-class entities (own pages,
// JSON API, methodology table, JSON-LD).
export function isPrejudgment(e) {
  return e.region === 'US States — Prejudgment' || e.metadata?.metric === 'prejudgment';
}

export function prejudgmentEntities() {
  return getAllEntities().filter(isPrejudgment).sort((a, b) => a.name.localeCompare(b.name));
}

// Grouping for the homepage / browse. Keeps the site organized as it grows.
export const GROUPS = [
  {
    id: 'irs',
    title: 'IRS interest rates (§6621)',
    blurb: 'Quarterly over/underpayment rates the IRS charges and pays, by taxpayer category.',
    match: (e) => e.slug.startsWith('irs-'),
  },
  {
    id: 'judgment',
    title: 'US judgment & Treasury rates',
    blurb: 'The federal post-judgment interest rate and the 1-year Treasury yield that sets it.',
    match: (e) => e.slug === 'us-federal-post-judgment' || e.slug === 'treasury-1-year-cmt',
  },
  {
    id: 'states',
    title: 'US state judgment rates',
    blurb: 'Statutory interest on money judgments, state by state — fixed by statute or market-linked.',
    match: (e) => e.region === 'US States',
  },
  {
    id: 'uk',
    title: 'United Kingdom',
    blurb: 'The Bank of England base rate and the statutory interest on late commercial payments.',
    match: (e) => e.jurisdiction === 'GB',
  },
  {
    id: 'eu',
    title: 'European Union',
    blurb: 'The ECB main refinancing rate and the EU Late Payment Directive reference rate.',
    match: (e) => e.jurisdiction === 'EU',
  },
];

export function groupedEntities() {
  const all = getAllEntities().filter((e) => !isPrejudgment(e));
  const groups = GROUPS.map((g) => ({ ...g, entities: all.filter(g.match) }));
  const claimed = new Set(groups.flatMap((g) => g.entities.map((e) => e.slug)));
  const rest = all.filter((e) => !claimed.has(e.slug));
  if (rest.length) groups.push({ id: 'other', title: 'Other rates', blurb: '', entities: rest });
  return groups;
}

export function latestOf(entity) {
  return entity.latest?.annual_rate || null;
}

// Compact {effective_date, value} history for embedding into calculator pages.
export function historyFor(slug) {
  const e = getEntity(slug);
  return (e.history?.annual_rate || [])
    .map((o) => ({ effective_date: o.effective_date, value: o.value }))
    .filter((o) => Number.isFinite(o.value));
}

// Human-friendly date, e.g. "July 1, 2026". Deterministic (UTC), no locale surprises at build time.
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function prettyDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

export function prettyDateTime(iso) {
  if (!iso) return '';
  return `${prettyDate(iso)} (${iso.slice(11, 16)} UTC)`;
}
