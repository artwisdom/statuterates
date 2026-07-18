// Self-contained sitemap.xml — enumerates every indexable page from the dataset at build time.
// No integration dependency; the loc URLs use the configured Astro `site` domain. Each URL carries a
// real per-page <lastmod> (the underlying rate's latest effective date, clamped to the build date) so
// the date is a genuine change signal for crawlers rather than one shared build stamp.
import { getAllEntities, getMeta, stateHubs, latestOf } from '../lib/data.mjs';
import { GUIDES } from '../lib/guides.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://data-moat-engine.example.org/').replace(/\/$/, '');
  const meta = getMeta();
  const build = (meta.generated_at || '').slice(0, 10);
  const clamp = (d) => (d && d <= build ? d : build); // never advertise a future date

  const staticPaths = [
    '/', '/about/', '/methodology/', '/api/', '/changes/', '/prejudgment/', '/states/',
    '/states/highest-lowest/', '/guides/', '/glossary/', '/privacy/', '/terms/',
    '/calculators/', '/calculators/post-judgment-interest/', '/calculators/irs-interest/',
    '/calculators/state-judgment-interest/', '/calculators/late-payment-interest/',
    '/calculators/prejudgment-interest/',
  ];

  const entities = getAllEntities();
  const dateFor = new Map(entities.map((e) => [e.slug, (latestOf(e)?.effective_date || '').slice(0, 10)]));

  const rows = [
    // Static + index pages: we don't track an honest per-page modification date, so omit <lastmod>
    // rather than advertise a churning build stamp. Google treats sitemap lastmod trust as binary —
    // one inflated date and it distrusts every date on the site — so an absent date beats a false one.
    ...staticPaths.map((p) => ({ path: p })),
    // Guides carry a hand-maintained dateModified that only moves on a genuine content edit.
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}/`, lastmod: clamp(g.dateModified) })),
    // Rate pages + hubs: the underlying rate's real effective date is a true change signal.
    ...entities.map((e) => ({ path: `/rates/${e.slug}/`, lastmod: clamp(dateFor.get(e.slug)) })),
    ...stateHubs().map((h) => ({
      path: `/states/${h.base}/`,
      // a hub changes when either of its rates does
      lastmod: clamp([dateFor.get(h.pre?.slug), dateFor.get(h.post?.slug)].filter(Boolean).sort().at(-1)),
    })),
  ];

  const urls = rows
    .map((r) => `  <url><loc>${base}${r.path}</loc>${r.lastmod ? `<lastmod>${r.lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq></url>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
