// Generate per-state PREJUDGMENT interest-rate entities + editorial copy from verified JSON,
// editing pipeline/fetchers/us-states.mjs and site/src/lib/content.mjs in place (idempotent).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Repo root = parent of this file's dir (data-moat-engine/scratchpad/gen-prejudgment.mjs).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Prefer the committed verified snapshot; fall back to the /tmp working copy.
const SNAP = join(ROOT, 'scratchpad', 'prejudgment-verified-2026-07-09.json');
const INPUT = existsSync(SNAP) ? SNAP : '/tmp/prejudgment.json';
const states = JSON.parse(readFileSync(INPUT, 'utf8'))
  .filter((s) => s.verified && !Number.isNaN(parseFloat(s.current_rate_percent)));

const VERIFIED_ON = '2026-07-09';
const SLUG_BASE = { 'District of Columbia': 'dc' };
const VALUE_TEXT = { IL: '6% / 5%' }; // Illinois: 6% PI/wrongful-death, 5% Interest Act
const KIND_LABEL = {
  fixed: 'Fixed by statute',
  variable: 'Formula rate',
  'discretionary-with-default': 'Discretionary',
  'same-as-postjudgment': 'Same rate as post-judgment',
};

// ---- text hygiene ------------------------------------------------------------------------
const clean = (x) => String(x || '')
  .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').replace(/\s*\.{2,}\s*/g, '… ').replace(/\s+/g, ' ').trim(); // "…" for elided quotes
const firstUrl = (u) => (String(u).match(/https?:\/\/[^\s;)]+/) || [String(u)])[0];
const host = (u) => { try { return new URL(firstUrl(u)).host.replace(/^www\./, ''); } catch { return 'the official source'; } };
const normDate = (a) => {
  a = String(a || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(a)) return a;
  if (/^\d{4}-\d{2}$/.test(a)) return a + '-01';
  if (/^\d{4}$/.test(a)) return a + '-01-01';
  const m = a.match(/\d{4}-\d{2}-\d{2}/); if (m) return m[0];
  const y = a.match(/\d{4}/); return y ? y[0] + '-01-01' : '2026-01-01';
};
// Short statute cite: first clause; alias parens like (NRS)/(K.S.A.) stripped; enumerated
// section lists ("Sec. 304.102, 304.103, 304.104") collapsed to the first section.
const statuteShort = (c) => {
  let s = clean(c)
    .replace(/\s\([A-Z][A-Za-z0-9.\s]{0,13}\)/g, '')
    .split(/;| \(| — | – |,? see | related /i)[0]
    .replace(/[.,;\s]+$/, '').trim();
  s = s.replace(/(\b(?:§+|Sec(?:tion)?s?\.?|art(?:icle)?s?\.?)\s*\d[\w.]*(?:\([^)]*\))?)(?:\s*,\s*(?:and\s+)?\d[\w.]*(?:\([^)]*\))?)+/i, '$1');
  return s.replace(/[.,;\s]+$/, '').trim();
};
// Strip leading ALL-CAPS labels ("CRITICAL claim-type limits.", "Availability:") and list markers.
const delabel = (t) => t
  .replace(/^CRITICAL[^.:]*[.:]\s+/i, '')
  .replace(/^[A-Z][A-Za-z ,'’/&-]{2,46}?:\s+/, '')
  .replace(/^\(\d+\)\s*/, '').replace(/^[-–—]\s*/, '')
  .trim();
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
// Sentence boundaries that are NOT after a legal abbreviation (Tex., Sec., v., U.S., etc.) or a
// lone capital initial — so citations never get split mid-cite.
const ABBR = /(?:tex|fin|secs?|nos?|arts?|u\.?s|vs?|inc|co|corp|ann|rev|stat|civ|r\.?s|ill|cal|fla|mass|va|n\.?[cmyd]|s\.?[cd]|wis|wyo|okla|ariz|ala|del|md|mo|mont|neb|nev|ore|r\.?i|minn|mich|ky|la|me|haw|kan|conn|colo|ark|vt|utah|tenn|miss|subch|subd|paras?|e\.?g|i\.?e|cf|ch|div|dept|comm|pp?|id|st|ste|ga)$/i;
function boundaries(t) {
  const out = []; const re = /[.!?…](?=\s|$)/g; let m;
  while ((m = re.exec(t))) {
    const i = m.index;
    if (t[i] === '…') { out.push(i); continue; }
    const before = t.slice(0, i);
    const tok = (before.match(/[A-Za-z]+\.?[A-Za-z]*$/) || [''])[0].replace(/\.$/, '');
    if (ABBR.test(tok)) continue;
    if (/[\s(][A-Z]$/.test(before.slice(-2))) continue; // single-capital initial
    out.push(i);
  }
  return out;
}
// Clean multi-sentence paragraph, cut on a real sentence boundary near max, capitalize.
const paragraph = (x, max = 500) => {
  let t = delabel(clean(x));
  if (t.length <= max) { if (!/[.…!?]$/.test(t)) t = t.replace(/[;:,\s]+$/, '') + '.'; return cap(t); }
  const bs = boundaries(t).filter((i) => i + 1 <= max);
  if (bs.length && bs[bs.length - 1] + 1 >= max * 0.5) return cap(t.slice(0, bs[bs.length - 1] + 1).trim());
  return cap(t.slice(0, max).replace(/\s+\S*$/, '').trim() + '…');
};
// First real sentence (for bodies), abbreviation-aware, capped.
const firstSentence = (x, max = 190, min = 45) => {
  const t = delabel(clean(x));
  const bs = boundaries(t).filter((i) => i + 1 >= min);
  let s = (bs.length ? t.slice(0, bs[0] + 1) : t).trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  if (!/[.…!?]$/.test(s)) s = s.replace(/[;:,\s]+$/, '') + '.';
  return cap(s);
};
const isCompound = (s) => {
  const t = clean(s.simple_or_compound).toLowerCase();
  const first = t.split(/[.—-]/)[0];
  if (/^\s*simple/.test(first) || /is simple|as simple|treated as simple|applied as simple|computed as simple/.test(t)) return false;
  return /compound/.test(t);
};
const cadence = (s) => {
  const t = (String(s.formula) + ' ' + String(s.rate_basis)).toLowerCase();
  if (/quarter/.test(t)) return 'each quarter';
  if (/monthly|each month|15th of each month/.test(t)) return 'monthly';
  if (/semiannual|semi-annual|twice a year|jan(?:uary|\.)? ?1 and jul|january 2|jan\.? ?2|jul(?:y|\.)? ?1/.test(t)) return 'twice a year';
  if (/annual|each year|yearly|calendar year|first business day of october|jan(?:uary)? ?1 (?:each|of each)/.test(t)) return 'each year';
  return 'periodically';
};
const q = (x) => JSON.stringify(x);

// ---- build per-state records -------------------------------------------------------------
const data = states.map((s) => {
  const code = s.state_code;
  const nameShort = s.state === 'District of Columbia' ? 'D.C.' : s.state;
  const nameDisp = s.state === 'District of Columbia' ? 'The District of Columbia' : s.state;
  const base = SLUG_BASE[s.state] || s.state.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${base}-prejudgment-rate`;
  const postSlug = `${base}-judgment-rate`;
  const value = parseFloat(s.current_rate_percent);
  const value_text = VALUE_TEXT[code] || `${value}%`;
  const kind = s.rate_kind;
  const isVar = kind === 'variable' || kind === 'same-as-postjudgment';
  const method = isVar ? 'statute-variable' : 'statute-fixed';
  const confidence = isVar ? 'medium' : 'high';
  const asof = normDate(s.as_of_date);
  const cite = statuteShort(s.statute_cite);
  const url = firstUrl(s.official_url);
  const h = host(s.official_url);
  const comp = isCompound(s);

  const applies = paragraph(s.restrictions, 520);
  const appliesShort = firstSentence(s.restrictions, 190);
  const accrual = paragraph(s.accrual, 320);
  const compound = paragraph(s.simple_or_compound, 240);
  const formula = paragraph(s.formula, 300);
  const kindLabel = KIND_LABEL[kind];

  const compClause = comp ? ', compounded annually' : ', as simple interest';
  const tagline =
    kind === 'discretionary-with-default' ? `${nameShort} prejudgment interest is discretionary — here is the rate courts apply.`
    : kind === 'same-as-postjudgment' ? `${nameShort} prejudgment interest — the same rate as its post-judgment interest.`
    : kind === 'variable' ? `${nameShort} prejudgment interest — a formula rate, reset ${cadence(s)}.`
    : `${nameShort}’s prejudgment interest rate — when a court awards it.`;

  const lead =
    kind === 'discretionary-with-default' ? `In ${nameDisp.toLowerCase().startsWith('the ') ? nameDisp : nameDisp}, prejudgment interest is discretionary: a court may award it, and when it does the rate is ${value_text} per year under ${cite}.`
    : kind === 'same-as-postjudgment' ? `${nameDisp} applies the same rate to prejudgment interest as to post-judgment interest — currently ${value_text} per year under ${cite}.`
    : kind === 'variable' ? `${nameDisp} prejudgment interest is currently ${value_text} per year — a statutory formula rate under ${cite} that resets ${cadence(s)}.`
    : `${nameDisp} prejudgment interest is ${value_text} per year${compClause} under ${cite}.`;
  const body = `${lead} ${appliesShort}`;

  const notes = `Prejudgment interest under ${cite} — ${value_text}${comp ? ', compounded annually' : ' (simple interest)'}. This is PREjudgment interest (accruing before entry of judgment) and is separate from ${nameShort}’s post-judgment rate; availability is limited by claim type (see the page). ${isVar ? `Current formula value as of ${asof}; verify at ${h}.` : `Verify against the statute text.`} Not legal advice.`;

  return { code, nameShort, nameDisp, slug, postSlug, value, value_text, kind, kindLabel,
    isVar, method, confidence, asof, cite, url, h, comp,
    applies, appliesShort, accrual, compound, formula,
    tagline, q: `What is the ${nameDisp} prejudgment interest rate?`, body, notes,
    srcId: `${code.toLowerCase()}-prejud`, srcName: `${nameShort} prejudgment interest (${cite})`,
    publisher: `${nameShort} — ${h}` };
});

console.log(`Prepared ${data.length} prejudgment states.`);

// ---- 1) PREJUDG block for us-states.mjs --------------------------------------------------
let block = `\n// ---- Per-state PREJUDGMENT interest rates, each verified ${VERIFIED_ON} against its official\n// statute/agency/court source (multi-agent pass). Prejudgment interest differs sharply from\n// post-judgment: availability turns on claim type (liquidated vs. unliquidated, contract vs. tort)\n// and in some states is discretionary. fixed/discretionary => high; variable/same-as-post => medium.\nconst PREJUDG = [\n`;
for (const d of data) {
  block += `  { code: ${q(d.code)}, name: ${q(d.nameShort)}, slug: ${q(d.slug)}, value: ${d.value}, value_text: ${q(d.value_text)}, kind: ${q(d.kind)}, method: ${q(d.method)}, confidence: ${q(d.confidence)}, asof: ${q(d.asof)}, statute: ${q(d.cite)}, srcId: ${q(d.srcId)}, srcName: ${q(d.srcName)}, publisher: ${q(d.publisher)}, url: ${q(d.url)},\n    notes: ${q(d.notes)} },\n`;
}
block += `];\nfor (const st of PREJUDG) {\n  STATE_SOURCES.push({ id: st.srcId, name: st.srcName, publisher: st.publisher, home_url: st.url, license: 'Government edict — not subject to copyright.', robots_status: \`curated \${st.kind} prejudgment value; official source verified ${VERIFIED_ON}\`, retrieved_at: \`${VERIFIED_ON}T00:00:00Z\` });\n  FIXED.push({ entity: { slug: st.slug, name: \`\${st.name} Prejudgment Interest Rate\`, entity_type: 'rate_series', jurisdiction: 'US', region: 'US States — Prejudgment', metadata: { state: st.code, statute: st.statute, basis: st.method, metric: 'prejudgment', kind: st.kind } }, value: st.value, value_text: st.value_text, effective_date: st.asof, source_id: st.srcId, source_url: st.url, confidence: st.confidence, method: st.method, notes: st.notes });\n}\n\n`;

const usPath = `${ROOT}/pipeline/fetchers/us-states.mjs`;
let us = readFileSync(usPath, 'utf8');
// strip any prior PREJUDG insertion so this generator is safely re-runnable
us = us.replace(/\n\/\/ ---- Per-state PREJUDGMENT[\s\S]*?\n\}\n\n(?=const IA_ENTITY = \{)/, '\n');
us = us.replace('const IA_ENTITY = {', block + 'const IA_ENTITY = {');
writeFileSync(usPath, us);
console.log('us-states.mjs: (re)inserted PREJUDG block.');

// ---- 2) copy block for content.mjs -------------------------------------------------------
let copy = '';
for (const d of data) {
  copy += `  ${q(d.slug)}: {\n    tagline: ${q(d.tagline)},\n    q: ${q(d.q)},\n    body: ${q(d.body)},\n`;
  copy += `    prejudgment: true,\n    kind: ${q(d.kind)},\n    kindLabel: ${q(d.kindLabel)},\n    postSlug: ${q(d.postSlug)},\n`;
  copy += `    appliesShort: ${q(d.appliesShort)},\n    applies: ${q(d.applies)},\n    accrual: ${q(d.accrual)},\n    compound: ${q(d.compound)},\n`;
  if (d.isVar) copy += `    formula: ${q(d.formula)},\n`;
  copy += `  },\n`;
}
const contentPath = `${ROOT}/site/src/lib/content.mjs`;
let content = readFileSync(contentPath, 'utf8');
// strip any prior prejudgment copy blocks so this generator is safely re-runnable
content = content.replace(/  "[a-z-]+-prejudgment-rate": \{[\s\S]*?\n  \},\n/g, '');
content = content.replace(`  'eu-late-payment-reference': {`, copy + `  'eu-late-payment-reference': {`);
writeFileSync(contentPath, content);
console.log('content.mjs: (re)inserted prejudgment copy.');

console.log('kinds:', Object.entries(data.reduce((a,d)=>((a[d.kind]=(a[d.kind]||0)+1),a),{})).map(([k,v])=>`${k}=${v}`).join(', '));
