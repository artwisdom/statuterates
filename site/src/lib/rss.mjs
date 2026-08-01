export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderRateChangesRss({
  base,
  channelTitle,
  channelPath,
  selfPath,
  description,
  generatedAt,
  changes,
}) {
  const origin = String(base).replace(/\/$/, '');
  const items = changes.map((change) => {
    const link = `${origin}/rates/${change.slug}/`;
    const title = `${change.name}: ${change.value_text} effective ${change.effective_date}`;
    const basis = change.method === 'statute-fixed'
      ? 'set by statute'
      : change.confidence === 'high'
        ? 'published value'
        : 'derived value';
    const itemDescription = `${change.name} is ${change.value_text} per year effective ${change.effective_date} (${basis}). Provenance and history: ${link}`;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(`${change.slug}@${change.effective_date}`)}</guid>
      <pubDate>${new Date(`${change.effective_date}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(itemDescription)}</description>
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(`${origin}${channelPath}`)}</link>
    <atom:link href="${escapeXml(`${origin}${selfPath}`)}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <lastBuildDate>${new Date(generatedAt).toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
