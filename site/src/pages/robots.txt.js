// Dynamic robots.txt so the Sitemap line always points at the real deploy domain (Astro `site`).
// Allow-all for content; only the sitemap is advertised. AI crawlers are welcomed (see llms.txt).
export function GET({ site }) {
  const base = (site?.href || 'https://data-moat-engine.example.org/').replace(/\/$/, '');
  const body = `User-agent: *
Allow: /

# AI/agent crawlers are welcome — see /llms.txt for the dataset description and API.

Sitemap: ${base}/sitemap.xml
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
