// MCP smoke test: launch the server over stdio and execute real tool calls, asserting outputs.
// Run: node test/smoke.mjs   (from machine/mcp-server/)  — requires data/exports to exist.
//
// Exits non-zero on any failed assertion so CI / the QA gauntlet catches regressions.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import assert from 'node:assert/strict';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = resolve(__dirname, '..', 'src', 'server.mjs');

function parse(res) {
  assert.ok(res && res.content && res.content[0], 'tool returned content');
  return JSON.parse(res.content[0].text);
}

async function main() {
  const transport = new StdioClientTransport({ command: process.execPath, args: [serverPath] });
  const client = new Client({ name: 'smoke-test', version: '0.0.1' });
  await client.connect(transport);

  // 0) tools are registered
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name).sort();
  console.log('tools:', names.join(', '));
  for (const expected of ['calculate_interest', 'compare_values', 'dataset_info', 'get_entity', 'get_latest_value', 'search_entities']) {
    assert.ok(names.includes(expected), `tool ${expected} registered`);
  }

  // 1) dataset_info returns metrics + entity count
  const info = parse(await client.callTool({ name: 'dataset_info', arguments: {} }));
  assert.ok(Array.isArray(info.metrics) && info.metrics.length >= 1, 'dataset has >=1 metric');
  assert.ok(info.entity_count >= 1, 'dataset has >=1 entity');
  assert.ok(Array.isArray(info.sources) && info.sources.length >= 1, 'dataset lists sources');
  const primaryMetric = info.metrics[0];
  console.log(`dataset_info OK: "${info.title}" — ${info.entity_count} entities, metrics=[${info.metrics.join(', ')}]`);

  // 2) search_entities: derive a real query token from the data (generic, not dataset-specific),
  //    then assert that searching for it returns the entity it came from.
  const browse = parse(await client.callTool({ name: 'search_entities', arguments: { query: '', limit: 50 } }));
  assert.ok(browse.results.length >= 1, 'browse returns entities');
  const seed = browse.results[0];
  const token = (seed.slug.split('-').find((w) => w.length >= 3) || seed.slug).toLowerCase();
  const search = parse(await client.callTool({ name: 'search_entities', arguments: { query: token, limit: 10 } }));
  assert.ok(search.results.length >= 1, `search "${token}" returns >=1 entity`);
  assert.ok(search.results.some((r) => r.slug === seed.slug), 'search finds the seed entity by its own token');
  const results = search.results;
  const slug = results[0].slug;
  console.log(`search_entities OK: query "${token}" -> ${results.length} result(s), first "${slug}"`);

  // 3) get_latest_value returns a provenance-carrying value
  const latest = parse(await client.callTool({ name: 'get_latest_value', arguments: { slug, metric: primaryMetric } }));
  const val = Array.isArray(latest) ? latest[0] : latest;
  assert.ok(val.effective_date, 'latest value has effective_date');
  assert.ok(val.source_url, 'latest value has source_url provenance');
  console.log(`get_latest_value OK: ${slug}/${primaryMetric} = ${val.value ?? val.value_text} ${val.unit} (eff ${val.effective_date})`);

  // 4) get_entity returns history
  const entity = parse(await client.callTool({ name: 'get_entity', arguments: { slug } }));
  assert.ok(entity.latest && Object.keys(entity.latest).length >= 1, 'entity has latest values');
  assert.ok((entity.history?.annual_rate?.length || 0) >= 1, 'entity exposes history');
  console.log(`get_entity OK: ${entity.name} has ${Object.keys(entity.latest).length} metric(s), ${entity.history.annual_rate.length} history point(s)`);

  // 5) compare_values ranks a metric across entities (needs >=2 slugs — use the broad browse set)
  if (browse.results.length >= 2) {
    const slugs = browse.results.slice(0, Math.min(4, browse.results.length)).map((r) => r.slug);
    const cmp = parse(await client.callTool({ name: 'compare_values', arguments: { slugs, metric: primaryMetric } }));
    assert.ok(Array.isArray(cmp.comparison) && cmp.comparison.length === slugs.length, 'comparison covers all slugs');
    // sorted high-to-low
    const vals = cmp.comparison.map((r) => r.value ?? -Infinity);
    for (let i = 1; i < vals.length; i++) assert.ok(vals[i - 1] >= vals[i], 'comparison sorted descending');
    console.log(`compare_values OK: ${cmp.comparison.map((r) => `${r.slug}=${r.value}`).join(', ')}`);
  }

  // 6) calculate_interest applies a statute end-to-end (federal §1961 on a recent judgment)
  const pjEntity = parse(await client.callTool({ name: 'get_entity', arguments: { slug: 'us-federal-post-judgment' } }));
  const weeks = pjEntity.history.annual_rate;
  if (weeks.length >= 10) {
    const judgment = weeks[4].effective_date; // a judgment date safely inside the data range
    const through = weeks[0].effective_date;
    const calc = parse(await client.callTool({
      name: 'calculate_interest',
      arguments: { slug: 'us-federal-post-judgment', principal: 100000, start_date: judgment, end_date: through },
    }));
    assert.ok(calc.interest > 0, 'calculated interest > 0');
    assert.ok(calc.rate_percent > 0, 'reports the rate used');
    assert.ok(calc.total > 100000, 'total exceeds principal');
    assert.match(calc.statute, /1961/);
    console.log(`calculate_interest OK: $100k from ${judgment} to ${through} -> $${calc.interest} at ${calc.rate_percent}%`);
  }

  await client.close();
  console.log('\nMCP SMOKE TEST PASSED');
}

main().catch((e) => {
  console.error('\nMCP SMOKE TEST FAILED:', e.message);
  process.exit(1);
});
