// RSS 2.0 feed of rate changes — one item per new effective value, newest first. Static output,
// regenerated on every data refresh, so subscribers get changes as the pipeline publishes them.
import { getMeta } from '../lib/data.mjs';
import { recentChanges } from '../lib/changes.mjs';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function GET({ site }) {
  const base = (site?.href || 'https://data-moat-engine.example.org/').replace(/\/$/, '');
  const meta = getMeta();
  const changes = recentChanges(30);

  const items = changes
    .map((c) => {
      const link = `${base}/rates/${c.slug}/`;
      const title = `${c.name}: ${c.value_text} effective ${c.effective_date}`;
      const desc = `${c.name} is ${c.value_text} per year effective ${c.effective_date} (${c.method === 'statute-fixed' ? 'set by statute' : c.confidence === 'high' ? 'published value' : 'derived value'}). Provenance and history: ${link}`;
      return `    <item>
      <title>${esc(title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(`${c.slug}@${c.effective_date}`)}</guid>
      <pubDate>${new Date(c.effective_date + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(desc)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(meta.title)} — rate changes</title>
    <link>${base}/changes/</link>
    <atom:link href="${base}/changes.xml" rel="self" type="application/rss+xml"/>
    <description>${esc('New statutory, judgment and tax interest-rate values across the US, UK and EU, with effective dates and official sources.')}</description>
    <language>en</language>
    <lastBuildDate>${new Date(meta.generated_at).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
