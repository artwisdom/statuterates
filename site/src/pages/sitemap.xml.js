// Self-contained sitemap.xml — enumerates every indexable page from the dataset at build time.
// No integration dependency; the loc URLs use the configured Astro `site` domain.
import { getAllEntities, getMeta, stateHubs } from '../lib/data.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://data-moat-engine.example.org/').replace(/\/$/, '');
  const meta = getMeta();
  const lastmod = (meta.generated_at || '').slice(0, 10);

  const staticPaths = [
    '/', '/about/', '/methodology/', '/api/', '/changes/', '/prejudgment/', '/states/',
    '/calculators/', '/calculators/post-judgment-interest/', '/calculators/irs-interest/',
    '/calculators/state-judgment-interest/', '/calculators/late-payment-interest/',
    '/calculators/prejudgment-interest/',
  ];
  const entityPaths = getAllEntities().map((e) => `/rates/${e.slug}/`);
  const hubPaths = stateHubs().map((h) => `/states/${h.base}/`);
  const all = [...staticPaths, ...entityPaths, ...hubPaths];

  const urls = all
    .map(
      (p) =>
        `  <url><loc>${base}${p}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq></url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
