#!/usr/bin/env node
// Data Moat Engine — MCP server (stdio transport).
//
// Exposes the dataset to AI agents/clients (Claude Desktop, Claude Code, etc.). It reads ONLY the
// exported JSON snapshots (data/exports/), so it has the same zero-infrastructure profile as the
// static API: no database process, no network, instant startup.
//
// Tools:
//   dataset_info       — dataset title, description, metrics, freshness, sources
//   search_entities    — fuzzy-find entities by name/slug/jurisdiction
//   get_entity         — full record for one entity (latest values + history)
//   get_latest_value   — the current value of a metric for an entity, with provenance
//   compare_values     — compare one metric across several entities

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  meta,
  searchEntities,
  getEntity,
  latestValue,
  calculationHistory,
  defaultMetric,
  entitiesIndex,
} from './data.mjs';
import {
  federalPostJudgment,
  floridaPostJudgmentInterest,
  irsInterest,
  fixedSimpleInterest,
  floatingSimpleInterest,
} from '../../../shared/interest-calc.mjs';
import { stateCalculatorReleaseForEntity } from '../../../shared/state-calculator-releases.mjs';

const M = meta();
const DATASET_TITLE = M.title || 'Data Moat Engine dataset';
const DATASET_DESC =
  M.description ||
  'A provenance-tracked reference dataset. Every value carries an effective_date, source_url and retrieved_at.';

const server = new McpServer({
  name: 'statuterates',
  version: M.version || '0.1.0',
});

function json(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}
function notFound(msg) {
  return { isError: true, content: [{ type: 'text', text: msg }] };
}

server.registerTool(
  'dataset_info',
  {
    title: 'Dataset info',
    description: `Metadata about the ${DATASET_TITLE}: what it covers, which metrics exist, how fresh it is, and the cited sources. Call this first to learn the available metric names and entity count.`,
    inputSchema: {},
  },
  async () => json({
    title: DATASET_TITLE,
    description: DATASET_DESC,
    metrics: M.metrics || [],
    entity_count: M.entity_count ?? entitiesIndex().length,
    observation_count: M.observation_count ?? null,
    generated_at: M.generated_at || null,
    current_as_of: String(M.generated_at || '').slice(0, 10) || null,
    update_cadence: M.update_cadence || null,
    sources: M.sources || [],
    attribution: M.attribution || null,
  })
);

server.registerTool(
  'search_entities',
  {
    title: 'Search entities',
    description: `Fuzzy-search the ${DATASET_TITLE} for entities by name, slug, jurisdiction (ISO code), or region. Returns matches with values currently in force as of the dataset snapshot, plus any later published value separately. Use this to resolve a user's phrasing (e.g. "the US", "USA") to a canonical entity slug before calling get_entity or get_latest_value.`,
    inputSchema: {
      query: z.string().describe('Free-text query, e.g. a country name, ISO code, or region.'),
      limit: z.number().int().min(1).max(100).optional().describe('Max results (default 25).'),
    },
  },
  async ({ query, limit }) => {
    const results = searchEntities(query, limit || 25);
    return json({
      query,
      count: results.length,
      results: results.map((e) => ({
        slug: e.slug,
        name: e.name,
        jurisdiction: e.jurisdiction,
        region: e.region,
        latest: e.latest || e.current || null,
        current: e.current || null,
        current_as_of: e.current_as_of || null,
        latest_published: e.latest_published || null,
      })),
    });
  }
);

server.registerTool(
  'get_entity',
  {
    title: 'Get entity',
    description: `Return the full record for one entity in the ${DATASET_TITLE}: values currently in force, the latest published values (which can be future-dated), and the historical time series. Each observation carries source_url, effective_date, retrieved_at and confidence.`,
    inputSchema: {
      slug: z.string().describe('The entity slug, e.g. from search_entities (like "united-states").'),
    },
  },
  async ({ slug }) => {
    const rec = getEntity(slug);
    if (!rec) return notFound(`No entity with slug "${slug}". Use search_entities to find the right slug.`);
    return json(rec);
  }
);

server.registerTool(
  'get_latest_value',
  {
    title: 'Get latest value',
    description: `Return the value CURRENTLY IN FORCE as of the dataset snapshot for one entity and metric, with full provenance (effective_date, source_url, retrieved_at, confidence). A later preannounced period is never promoted early. Omit "metric" to get every metric's current value.`,
    inputSchema: {
      slug: z.string().describe('Entity slug (resolve via search_entities if unsure).'),
      metric: z
        .string()
        .optional()
        .describe(`Metric name. Available: ${(M.metrics || []).join(', ') || '(see dataset_info)'}. Omit for all metrics.`),
    },
  },
  async ({ slug, metric }) => {
    const v = latestValue(slug, metric);
    if (!v || (Array.isArray(v) && v.length === 0)) {
      return notFound(`No value for slug "${slug}"${metric ? ` metric "${metric}"` : ''}.`);
    }
    return json(v);
  }
);

server.registerTool(
  'compare_values',
  {
    title: 'Compare values',
    description: `Compare one metric currently in force across several entities, sorted high-to-low. Useful for "which jurisdiction has the highest X" questions. Returns each current value with provenance.`,
    inputSchema: {
      slugs: z.array(z.string()).min(2).describe('Two or more entity slugs to compare.'),
      metric: z
        .string()
        .optional()
        .describe(`Metric to compare. Available: ${(M.metrics || []).join(', ') || '(see dataset_info)'}. Defaults to the primary metric.`),
    },
  },
  async ({ slugs, metric }) => {
    const m = metric || defaultMetric();
    const rows = [];
    for (const slug of slugs) {
      const v = latestValue(slug, m);
      const one = Array.isArray(v) ? v.find((x) => x.metric === m) : v;
      if (one) rows.push({ slug, name: one.name, value: one.value, value_text: one.value_text, unit: one.unit, effective_date: one.effective_date, source_url: one.source_url });
      else rows.push({ slug, error: 'not found' });
    }
    rows.sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
    return json({ metric: m, count: rows.length, comparison: rows });
  }
);

// Which statutory computation applies to each series (mirrors the site's calculators; the shared
// engine implements the statutes' actual methods).
const CALC_RULES = {
  'us-federal-post-judgment': { kind: 'post-judgment', label: '28 U.S.C. §1961 (daily accrual, compounded annually)' },
  'irs-underpayment': { kind: 'irs', label: 'IRC §6621/§6622 (quarterly rates, compounded daily)' },
  'irs-overpayment-noncorporate': { kind: 'irs', label: 'IRC §6621/§6622 (quarterly rates, compounded daily)' },
  'irs-overpayment-corporate': { kind: 'irs', label: 'IRC §6621/§6622 (quarterly rates, compounded daily)' },
  'irs-large-corporate-underpayment': { kind: 'irs', label: 'IRC §6621/§6622 (quarterly rates, compounded daily)' },
  'uk-late-payment-commercial': { kind: 'fixed-simple', label: 'UK Late Payment Act 1998 (simple, fixed at overdue date)' },
  'eu-late-payment-reference': { kind: 'floating-simple', label: 'EU Directive 2011/7/EU (simple, semester re-fixing; add your member-state margin — 8pp floor applied unless specified)', defaultMargin: 8 },
  'florida-judgment-rate': { kind: 'florida', label: 'Fla. Stat. §55.03 (simple daily interest; annual January 1 adjustment)', rendererId: 'florida-postjudgment-v1' },
};

server.registerTool(
  'calculate_interest',
  {
    title: 'Calculate statutory interest',
    description:
      `Compute accrued statutory interest for an audited series in the ${DATASET_TITLE}, applying its governing method (daily compounding for IRS, annual compounding for federal judgments, period-aware simple interest for UK/EU, and the dedicated Florida §55.03 renderer). State methods fail closed unless the shared website release registry and entity contract both approve them. Returns the amount, rates, method, and source. Supported slugs: ${Object.keys(CALC_RULES).join(', ')}.`,
    inputSchema: {
      slug: z.enum(Object.keys(CALC_RULES)).describe('Which rate series/statute to apply.'),
      principal: z.number().positive().describe('The principal amount (judgment, tax, or invoice).'),
      start_date: z.string().describe('ISO date interest starts (judgment date / due date / overdue date).'),
      end_date: z.string().describe('ISO date to calculate through (e.g. today or payment date).'),
      margin_percent: z.number().min(8).max(15).optional().describe('EU only: your member state\'s margin over the reference rate (minimum 8; e.g. France 10, Germany 9).'),
      include_end_date: z.boolean().optional().describe('Florida only: include the entered through-date in accrual (default true).'),
    },
  },
  async ({ slug, principal, start_date, end_date, margin_percent, include_end_date }) => {
    const rule = CALC_RULES[slug];
    const rec = getEntity(slug);
    if (!rec) return notFound(`No entity "${slug}".`);
    try {
      const history = calculationHistory(rec, 'annual_rate', start_date);
      let result;
      if (rule.kind === 'post-judgment') {
        result = federalPostJudgment({ principal, judgmentDate: start_date, endDate: end_date, weeklyHistory: history });
      } else if (rule.kind === 'irs') {
        result = irsInterest({ principal, startDate: start_date, endDate: end_date, quarterlyHistory: history });
      } else if (rule.kind === 'floating-simple') {
        result = floatingSimpleInterest({ principal, startDate: start_date, endDate: end_date, history, marginPercent: margin_percent ?? rule.defaultMargin ?? 0 });
      } else if (rule.kind === 'florida') {
        const release = stateCalculatorReleaseForEntity(rec);
        if (!release || release.rendererId !== rule.rendererId) {
          throw new Error('Florida calculator is not approved by the shared release contract');
        }
        result = floridaPostJudgmentInterest({
          principal,
          judgmentDate: start_date,
          endDate: end_date,
          history,
          includeEndDate: include_end_date ?? true,
        });
      } else {
        result = fixedSimpleInterest({ principal, startDate: start_date, endDate: end_date, history });
      }
      return json({
        series: rec.name,
        statute: rule.label,
        principal,
        start_date,
        end_date,
        ...result,
        source_url: rec.current?.annual_rate?.source_url || null,
        disclaimer: 'Estimate for reference; official computations may differ in rounding/conventions. Not legal, tax, or financial advice.',
      });
    } catch (e) {
      return notFound(`Cannot compute: ${e.message}`);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
// Keep stderr quiet on stdout (stdio transport uses stdout for protocol).
process.stderr.write(`[data-moat-engine mcp] ready: ${DATASET_TITLE} (${(M.metrics || []).length} metrics)\n`);
