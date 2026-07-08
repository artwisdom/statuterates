// Recent rate changes, derived from the exports at build time. Shared by /changes/ and /changes.xml.
import { getAllEntities } from './data.mjs';

export function recentChanges(limit = 30) {
  const items = [];
  for (const e of getAllEntities()) {
    for (const o of e.history?.annual_rate || []) {
      items.push({
        slug: e.slug,
        name: e.name,
        jurisdiction: e.jurisdiction,
        value_text: o.value_text,
        effective_date: o.effective_date,
        confidence: o.confidence,
        method: o.method,
      });
    }
  }
  items.sort((a, b) => (a.effective_date < b.effective_date ? 1 : a.effective_date > b.effective_date ? -1 : a.name.localeCompare(b.name)));
  return items.slice(0, limit);
}
