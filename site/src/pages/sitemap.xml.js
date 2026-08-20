// Self-contained sitemap.xml — enumerates every indexable page from the dataset at build time.
// No integration dependency; the loc URLs use the configured Astro `site` domain. Data URLs carry a
// real per-page <lastmod> based on launch, source retrieval, current effect, or substantial editing —
// never the pre-launch age of the underlying law and never one shared, churning build stamp.
import { getAllEntities, stateHubs, latestOf, currentOf, publishedStateCalculators } from '../lib/data.mjs';
import { GUIDES } from '../lib/guides.mjs';
import { contentModifiedFor } from '../lib/content.mjs';
import { significantPageDate } from '../lib/sitemap.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://statuterates.com/').replace(/\/$/, '');
  // The export timestamp controls which observation currentOf() calls current. It is not the page
  // build time: an editorial improvement may legitimately ship after the last data refresh.
  const releaseDate = new Date().toISOString().slice(0, 10);
  const clamp = (d) => (d && d <= releaseDate ? d : null); // ignore mistaken future dates

  const entities = getAllEntities();
  const stateCalculators = publishedStateCalculators();

  const staticPaths = [
    '/', '/about/', '/methodology/', '/editorial-policy/', '/api/', '/changes/', '/prejudgment/', '/states/',
    '/states/highest-lowest/', '/guides/', '/glossary/', '/privacy/', '/terms/',
    '/calculators/', '/calculators/judgment-interest/',
  ];

  const dateFor = new Map(entities.map((e) => [e.slug, significantPageDate({
    currentObservation: currentOf(e),
    publishedObservation: latestOf(e),
    contentModified: contentModifiedFor(e.slug),
    buildDate: releaseDate,
  })]));
  const calculatorRows = [
    { path: '/calculators/post-judgment-interest/', slugs: ['us-federal-post-judgment'], contentModified: '2026-08-16' },
    { path: '/calculators/irs-interest/', slugs: ['irs-underpayment'], contentModified: '2026-08-16' },
    { path: '/calculators/irs-penalty-and-interest/', slugs: ['irs-underpayment'], contentModified: '2026-08-16' },
    {
      path: '/calculators/late-payment-interest/',
      slugs: ['uk-late-payment-commercial', 'eu-late-payment-reference'],
      contentModified: '2026-08-16',
    },
    ...stateCalculators.map((release) => ({
      path: release.path,
      slugs: [release.entitySlug],
      contentModified: '2026-08-16',
    })),
  ].map((calculator) => ({
    path: calculator.path,
    lastmod: clamp(
      [calculator.contentModified, ...calculator.slugs.map((slug) => dateFor.get(slug))]
        .filter(Boolean)
        .sort()
        .at(-1),
    ),
  }));

  const rows = [
    // Static + index pages: we don't track an honest per-page modification date, so omit <lastmod>
    // rather than advertise a churning build stamp. Google treats sitemap lastmod trust as binary —
    // one inflated date and it distrusts every date on the site — so an absent date beats a false one.
    ...staticPaths.map((p) => ({ path: p })),
    // Guides carry a hand-maintained dateModified that only moves on a genuine content edit.
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}/`, lastmod: clamp(g.dateModified) })),
    // Data-driven calculators change when their underlying rate contract changes.
    ...calculatorRows,
    // Rate pages + hubs: dates move only when their rendered data or editorial substance changes.
    ...entities.map((e) => ({ path: `/rates/${e.slug}/`, lastmod: clamp(dateFor.get(e.slug)) })),
    ...stateHubs().map((h) => ({
      path: `/states/${h.base}/`,
      // a hub changes when either of its rates does
      lastmod: clamp([dateFor.get(h.pre?.slug), dateFor.get(h.post?.slug)].filter(Boolean).sort().at(-1)),
    })),
  ];

  const urls = rows
    .map((r) => `  <url><loc>${base}${r.path}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
