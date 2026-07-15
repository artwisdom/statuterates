export const meta = {
  name: 'statuterates-site-audit',
  description: 'Full production-readiness audit of statuterates.com across SEO, a11y, links, data, code, and monetization/legal — return prioritized findings with concrete fixes',
  phases: [{ title: 'Audit', detail: 'one specialist per dimension' }],
};

const ROOT = '/Users/michaeldube/Desktop/Passive Income Ideas/data-moat-engine';
const SITE = 'https://statuterates.com';

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'findings', 'summary'],
  properties: {
    dimension: { type: 'string' },
    summary: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'issue', 'location', 'fix'],
        properties: {
          severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
          issue: { type: 'string', description: 'the concrete problem' },
          location: { type: 'string', description: 'file path or URL where it lives' },
          fix: { type: 'string', description: 'the specific change to make' },
        },
      },
    },
  },
};

const common = `The project is a static Astro site (source at ${ROOT}, built to site/dist, live at ${SITE}) — a legal/statutory interest-rate reference site meant to run hands-off for years and earn via display ads (Google AdSense, one-switch via an ADSENSE_CLIENT env var). Read the relevant source files and/or WebFetch live pages. Report ONLY real, actionable issues — no vague advice. For each finding give severity, the exact file/URL, and the specific fix. Be concrete and conservative; do not invent problems. Your entire response is the structured object.`;

const DIMENSIONS = [
  { key: 'seo', prompt: `You are a technical SEO auditor. ${common}
Audit for: unique & well-formed <title>/meta description per page; canonical correctness; sitemap.xml completeness & lastmod; robots.txt; structured data (JSON-LD) validity and appropriateness (Dataset/FAQPage/BreadcrumbList/Organization/WebSite); Open Graph / Twitter card completeness (note if og:image is missing); heading hierarchy; internal-link mesh; any thin/duplicate content; hreflang/lang; 404 handling. Check the homepage, a /rates/<x>/ page, a /states/<x>/ hub, /states/, /prejudgment/, and a calculator.` },
  { key: 'accessibility', prompt: `You are a WCAG 2.1 AA accessibility auditor. ${common}
Read site/src/layouts/BaseLayout.astro (global CSS + color vars) and a few pages. Audit for: color-contrast of text/links/badges against the paper/green/gold palette; semantic landmarks (header/nav/main/footer); heading order; form labels on the calculators; focus visibility; skip-link; alt/aria on icons; the <details>/<summary> FAQ; table headers/scope; reduced-motion. Give the exact CSS/markup fix for each.` },
  { key: 'links', prompt: `You are a link-integrity auditor. ${common}
1) Enumerate internal links on the homepage, nav, footer, and a hub page and confirm each target exists (cross-check against site/src/pages/** and the built site/dist/**). 2) Sample ~12 official-source URLs from data/exports/entity/*.json (the source_url fields across IRS, Treasury, and several states) and WebFetch each to check it still resolves (200) and isn't a redirect/404. Report any broken or redirecting links with the entity and the corrected URL if findable.` },
  { key: 'data', prompt: `You are a data-quality auditor. ${common}
Read data/exports/entity/*.json and the site copy. Check: (a) every entity's latest value_text is internally consistent with its notes/copy; (b) no obviously stale "as of" dates or contradictory numbers; (c) the dual-rate "X% / Y%" entries render sensibly; (d) the prejudgment calculator (site/src/pages/calculators/prejudgment-interest.astro + shared/interest-calc.mjs) computes correctly and its safe-set is right; (e) methodology page claims match the data. Flag any remaining inaccuracy or inconsistency.` },
  { key: 'code', prompt: `You are a senior code reviewer hunting real bugs. ${common}
Review site/src/pages/rates/[slug].astro, site/src/pages/states/[state].astro, site/src/lib/data.mjs, site/src/lib/content.mjs, site/src/pages/sitemap.xml.js, pipeline/fetchers/us-states.mjs, and shared/interest-calc.mjs. Look for: null/undefined derefs, wrong conditionals, off-by-one, template edge cases (missing copy, missing post sibling like Mississippi), JSON-LD that could be malformed for edge entities, and anything that breaks for a specific state. Give the file:line and the fix.` },
  { key: 'monetization', prompt: `You are an AdSense/legal-readiness auditor for a US-based hands-off ad-supported content site. ${common}
Determine what is REQUIRED before the owner can turn on ads and passively earn, and what is missing today. Check for: ads.txt (present? needed for AdSense), a privacy policy page (REQUIRED by AdSense; must disclose cookies + third-party ad vendors + how to opt out), a cookie-consent mechanism for EEA/UK/CA (Google requires a certified CMP for ads there), terms/disclaimer, contact info, the AdSlot wiring (site/src/components/AdSlot.astro + BaseLayout ADSENSE_CLIENT switch). Read site/public/, site/src/pages/**, and BaseLayout. List each missing/required item as a finding with the exact fix.` },
];

phase('Audit');
const results = await parallel(
  DIMENSIONS.map((d) => () => agent(d.prompt, { schema: SCHEMA, label: `audit:${d.key}`, phase: 'Audit' })),
);
const clean = results.filter(Boolean);
const all = clean.flatMap((r) => (r.findings || []).map((f) => ({ ...f, dimension: r.dimension })));
const bySev = (s) => all.filter((f) => f.severity === s).length;
log(`Audit done: ${all.length} findings — ${bySev('critical')} critical, ${bySev('high')} high, ${bySev('medium')} medium, ${bySev('low')} low.`);
return {
  dimensions: clean.map((r) => ({ dimension: r.dimension, summary: r.summary, count: r.findings.length })),
  findings: all.sort((a, b) => ['critical', 'high', 'medium', 'low'].indexOf(a.severity) - ['critical', 'high', 'medium', 'low'].indexOf(b.severity)),
};
