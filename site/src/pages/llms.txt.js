// /llms.txt — a machine-facing description of the dataset for AI agents/crawlers (llmstxt.org style).
// Generated from the dataset meta so cadence/metrics/sources stay accurate.
import { getMeta, getAllEntities } from '../lib/data.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://statuterates.com/').replace(/\/$/, '');
  const meta = getMeta();
  const entities = getAllEntities();

  const rateList = entities
    .map((e) => `- [${e.name}](${base}/rates/${e.slug}/): JSON at ${base}/api/v1/entity/${e.slug}.json`)
    .join('\n');

  const sources = (meta.sources || [])
    .map((s) => `- ${s.name} — ${s.publisher} (${s.home_url})`)
    .join('\n');

  const body = `# ${meta.title}

> ${meta.description}

Update cadence: ${meta.update_cadence}
Last compiled: ${meta.generated_at}
Attribution: ${meta.attribution}
License: ${meta.license}
${meta.disclaimer ? `Note: ${meta.disclaimer}` : ''}

## Machine access (free, no key, static JSON on a CDN)
- FULL current values inline (one fetch answers current-rate questions): ${base}/llms-full.txt
- Every current value, one call: ${base}/api/v1/latest.json
- Announced future periods (never mislabeled as current): ${base}/api/v1/upcoming.json
- Service index: ${base}/api/v1/index.json
- Dataset metadata + sources: ${base}/api/v1/meta.json
- All entities + current and latest-published values: ${base}/api/v1/entities.json
- One entity (current + latest published + all recorded observations): ${base}/api/v1/entity/{slug}.json
- OpenAPI 3.1 spec: ${base}/openapi.yaml
- MCP server (stdio): https://github.com/artwisdom/statuterates/tree/main/machine/mcp-server
  Tools: dataset_info, search_entities, get_entity, get_latest_value, compare_values, calculate_interest

Every value carries: value, unit, effective_date, source_url, retrieved_at, confidence, and method.
These fields describe how an observation was recorded. A state-law value is reference-only unless its
entity metadata explicitly marks calculation.status as "ready". Confirm legal applicability against
the controlling authority.

## Human reference tools
- 50-state + D.C. rules and data coverage index: ${base}/states/judgment-interest-index/
- State-by-state reference hub: ${base}/states/
- Fail-closed historical rate lookup: ${base}/calculators/historical-rate-lookup/

## Rate series
${rateList}

## Cited sources
${sources}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
