// Series-specific RSS feeds for rates with more than one effective observation. These are static,
// privacy-free, and regenerated from the same versioned exports as the corresponding rate page.
import { getEntity, getMeta } from '../../lib/data.mjs';
import { followableEntities, recordedChangesFor } from '../../lib/changes.mjs';
import { renderRateChangesRss } from '../../lib/rss.mjs';

export function getStaticPaths() {
  return followableEntities().map((entity) => ({ params: { slug: entity.slug } }));
}

export function GET({ params, site }) {
  const entity = getEntity(params.slug);
  const meta = getMeta();
  const base = (site?.href || 'https://statuterates.com/').replace(/\/$/, '');
  // Keep subscription payloads compact; the linked JSON API retains the complete history.
  const changes = recordedChangesFor(entity).slice(0, 50);
  const xml = renderRateChangesRss({
    base,
    channelTitle: `${entity.name} — recorded updates`,
    channelPath: `/rates/${entity.slug}/`,
    selfPath: `/rates/${entity.slug}.xml`,
    description: `Recorded effective-date updates for ${entity.name}, with links to cited sources and full history.`,
    generatedAt: meta.generated_at,
    changes,
  });
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
