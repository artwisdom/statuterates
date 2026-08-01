// RSS 2.0 feed of rate changes — one item per new effective value, newest first. Static output,
// regenerated on every data refresh, so subscribers get changes as the pipeline publishes them.
import { getMeta } from '../lib/data.mjs';
import { recentChanges } from '../lib/changes.mjs';
import { renderRateChangesRss } from '../lib/rss.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://statuterates.com/').replace(/\/$/, '');
  const meta = getMeta();
  const changes = recentChanges(30);

  const xml = renderRateChangesRss({
    base,
    channelTitle: `${meta.title} — rate changes`,
    channelPath: '/changes/',
    selfPath: '/changes.xml',
    description: 'New statutory, judgment and tax interest-rate observations across the US, UK and EU, with effective dates and cited sources.',
    generatedAt: meta.generated_at,
    changes,
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
