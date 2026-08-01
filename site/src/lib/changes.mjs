// Recorded rate changes, derived from the exports at build time. Shared by the HTML change log and
// RSS feeds. Future effective dates are deliberately excluded: an announced future value is useful
// on its source page, but it must not appear as a change that has already happened.
import { getAllEntities, getMeta } from './data.mjs';

function buildDate() {
  return String(getMeta().generated_at || '').slice(0, 10);
}

export function recordedChangesFor(entity, asOfDate = buildDate()) {
  const seen = new Set();
  return (entity.history?.annual_rate || [])
    .filter((observation) => observation.effective_date <= asOfDate)
    .sort((a, b) => b.effective_date.localeCompare(a.effective_date))
    .filter((observation) => {
      if (seen.has(observation.effective_date)) return false;
      seen.add(observation.effective_date);
      return true;
    })
    .map((observation) => ({
      slug: entity.slug,
      name: entity.name,
      jurisdiction: entity.jurisdiction,
      value_text: observation.value_text,
      effective_date: observation.effective_date,
      confidence: observation.confidence,
      method: observation.method,
    }));
}

// A series-specific feed is only offered when there is a real change history to follow. A single
// reference observation does not imply active monitoring to a visitor.
export function followableEntities(asOfDate = buildDate()) {
  return getAllEntities()
    .filter((entity) => recordedChangesFor(entity, asOfDate).length > 1)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function recentChanges(limit = 30, asOfDate = buildDate()) {
  const items = getAllEntities().flatMap((entity) => recordedChangesFor(entity, asOfDate));
  items.sort((a, b) => (a.effective_date < b.effective_date ? 1 : a.effective_date > b.effective_date ? -1 : a.name.localeCompare(b.name)));
  return items.slice(0, limit);
}
