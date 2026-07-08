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
  defaultMetric,
  entitiesIndex,
} from './data.mjs';
import {
  federalPostJudgment,
  irsInterest,
  fixedSimpleInterest,
  floatingSimpleInterest,
} from '../../../shared/interest-calc.mjs';

const M = meta();
const DATASET_TITLE = M.title || 'Data Moat Engine dataset';
const DATASET_DESC =
  M.description ||
  'A provenance-tracked reference dataset. Every value carries an effective_date, source_url and retrieved_at.';

const server = new McpServer({
  name: 'data-moat-engine',
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
    description: `Metadata about the ${DATASET_TITLE}: what it covers, which metrics exist, how fresh it is, and the official sources. Call this first to learn the available metric names and entity count.`,
    inputSchema: {},
  },
  async () => json({
    title: DATASET_TITLE,
    description: DATASET_DESC,
    metrics: M.metrics || [],
    entity_count: M.entity_count ?? entitiesIndex().length,
    observation_count: M.observation_count ?? null,
    generated_at: M.generated_at || null,
    update_cadence: M.update_cadence || null,
    sources: M.sources || [],
    attribution: M.attribution || null,
  })
);

server.registerTool(
  'search_entities',
  {
    title: 'Search entities',
    description: `Fuzzy-search the ${DATASET_TITLE} for entities by name, slug, jurisdiction (ISO code), or region. Returns matches with their latest values. Use this to resolve a user's phrasing (e.g. "the US", "USA") to a canonical entity slug before calling get_entity or get_latest_value.`,
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
        latest: e.latest || null,
      })),
    });
  }
);

server.registerTool(
  'get_entity',
  {
    title: 'Get entity',
    description: `Return the full record for one entity in the ${DATASET_TITLE}: its latest value per metric AND the historical time series, each observation carrying source_url, effective_date, retrieved_at and confidence.`,
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
    description: `Return the CURRENT value of a metric for one entity, with full provenance (effective_date, source_url, retrieved_at, confidence). This is the high-value call for agents: the value is kept fresh by the pipeline, so it is more reliable than a model's training-time memory. Omit "metric" to get every metric's latest value.`,
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
    description: `Compare one metric across several entities, sorted high-to-low. Useful for "which country has the highest X" style questions. Returns each entity's latest value with provenance.`,
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
  'california-judgment-rate': { kind: 'fixed-simple', label: 'CCP §685.010 (simple, daily /365)' },
  'new-york-judgment-rate': { kind: 'fixed-simple', label: 'CPLR 5004 (simple)' },
  'new-york-consumer-debt-judgment-rate': { kind: 'fixed-simple', label: 'CPLR 5004 consumer-debt rate (simple)' },
  'massachusetts-judgment-rate': { kind: 'fixed-simple', label: 'M.G.L. c.231 §§6B–6C (simple)' },
  'iowa-judgment-rate': { kind: 'fixed-simple', label: 'Iowa Code §668.13 (rate fixed at judgment, computed daily)' },
};

server.registerTool(
  'calculate_interest',
  {
    title: 'Calculate statutory interest',
    description:
      `Compute accrued statutory interest for a series in the ${DATASET_TITLE}, applying the governing statute's ACTUAL method (daily compounding for IRS, annual compounding for federal judgments, simple interest for UK/state rules) with the correct historical rate for each period. Returns the amount, the rate(s) used, and the method — cite it with the series' source_url. Supported slugs: ${Object.keys(CALC_RULES).join(', ')}.`,
    inputSchema: {
      slug: z.enum(Object.keys(CALC_RULES)).describe('Which rate series/statute to apply.'),
      principal: z.number().positive().describe('The principal amount (judgment, tax, or invoice).'),
      start_date: z.string().describe('ISO date interest starts (judgment date / due date / overdue date).'),
      end_date: z.string().describe('ISO date to calculate through (e.g. today or payment date).'),
      margin_percent: z.number().min(0).max(15).optional().describe('EU only: your member state\'s margin over the reference rate (floor 8; e.g. France 10, Germany 9).'),
    },
  },
  async ({ slug, principal, start_date, end_date, margin_percent }) => {
    const rule = CALC_RULES[slug];
    const rec = getEntity(slug);
    if (!rec) return notFound(`No entity "${slug}".`);
    const history = (rec.history?.annual_rate || []).map((o) => ({ effective_date: o.effective_date, value: o.value }));
    try {
      let result;
      if (rule.kind === 'post-judgment') {
        result = federalPostJudgment({ principal, judgmentDate: start_date, endDate: end_date, weeklyHistory: history });
      } else if (rule.kind === 'irs') {
        result = irsInterest({ principal, startDate: start_date, endDate: end_date, quarterlyHistory: history });
      } else if (rule.kind === 'floating-simple') {
        result = floatingSimpleInterest({ principal, startDate: start_date, endDate: end_date, history, marginPercent: margin_percent ?? rule.defaultMargin ?? 0 });
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
        source_url: rec.latest?.annual_rate?.source_url || null,
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
