#!/usr/bin/env node

import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATE_SOURCES } from '../pipeline/fetchers/us-states.mjs';

const DAY_MS = 86_400_000;
const ALLOWED_RISKS = new Set(['critical', 'high', 'medium', 'low']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPolicyPath = join(__dirname, 'source-review-registry.json');
const defaultMetaPath = join(__dirname, '..', 'data', 'exports', 'meta.json');
const defaultEntityDirectory = join(__dirname, '..', 'data', 'exports', 'entity');
const DEFAULT_PACKET_GROUP_LIMIT = Number.MAX_SAFE_INTEGER;
const DEFAULT_PACKET_ENTITY_LIMIT = 8;
const DEFAULT_PACKET_BYTE_LIMIT = 50_000;

const STATUS_PRIORITY = new Map([
  ['current', 0],
  ['due_soon', 1],
  ['due_today', 2],
  ['overdue', 3],
]);

const RISK_PRIORITY = new Map([
  ['low', 0],
  ['medium', 1],
  ['high', 2],
  ['critical', 3],
]);

function parseIsoDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    throw new Error(`${label} must be an ISO calendar date (YYYY-MM-DD)`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a real calendar date: ${value}`);
  }
  return date;
}

function addDays(value, days) {
  const date = parseIsoDate(value, 'last_reviewed');
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function assertSafeText(value, label, maxLength = 120) {
  if (typeof value !== 'string' || value.length < 1 || value.length > maxLength || /[\r\n]/.test(value)) {
    throw new Error(`${label} must be a non-empty single-line string (maximum ${maxLength} characters)`);
  }
}

function validateSource(source, seenSourceIds) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('Every exported source must be an object');
  }
  assertSafeText(source.id, 'source.id');
  if (!/^[a-z0-9-]+$/.test(source.id)) {
    throw new Error(`Source id has an unsafe format: ${source.id}`);
  }
  if (seenSourceIds.has(source.id)) throw new Error(`Duplicate exported source id: ${source.id}`);
  seenSourceIds.add(source.id);
  assertSafeText(source.name, `source ${source.id} name`, 300);
  assertSafeText(source.publisher, `source ${source.id} publisher`, 300);
  let url;
  try {
    url = new URL(source.home_url);
  } catch {
    throw new Error(`Source ${source.id} has an invalid home_url`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`Source ${source.id} home_url must use HTTPS`);
  }
  assertSafeText(source.robots_status, `source ${source.id} robots_status`, 1000);
  if (typeof source.retrieved_at !== 'string' || Number.isNaN(Date.parse(source.retrieved_at))) {
    throw new Error(`Source ${source.id} has an invalid retrieved_at timestamp`);
  }
}

export function sourceUrlFingerprint(sources) {
  const contract = [...sources]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((source) => `${source.id}\t${source.home_url}\n`)
    .join('');
  return createHash('sha256').update(contract).digest('hex');
}

export function currentEasternDate(now = new Date()) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) throw new Error('now must be a valid Date');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function indexSources(sources, label) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new Error(`${label} must be a non-empty array`);
  }
  const seenSourceIds = new Set();
  const byId = new Map();
  for (const source of sources) {
    validateSource(source, seenSourceIds);
    byId.set(source.id, source);
  }
  return byId;
}

export function buildSourceReviewRegistry({
  policy,
  activeSources,
  exportedSources,
  today,
  leadDays = 14,
}) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    throw new Error('Source-review policy must be an object');
  }
  if (policy.schema_version !== 1) {
    throw new Error(`Unsupported source-review schema version: ${policy.schema_version}`);
  }
  if (!Array.isArray(policy.reviews) || policy.reviews.length === 0) {
    throw new Error('Source-review policy must contain a non-empty reviews array');
  }
  if (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 365) {
    throw new Error('leadDays must be an integer between 0 and 365');
  }

  const todayDate = parseIsoDate(today, 'today');
  const activeSourceById = indexSources(activeSources, 'Active state sources');
  const exportedSourceById = indexSources(exportedSources, 'Export metadata sources');

  if (!/^[a-f0-9]{64}$/.test(String(policy.active_source_urls_sha256 || ''))) {
    throw new Error('active_source_urls_sha256 must be a lowercase SHA-256 digest');
  }
  const actualFingerprint = sourceUrlFingerprint(activeSources);
  if (policy.active_source_urls_sha256 !== actualFingerprint) {
    throw new Error(
      `Active state-source URL contract changed: expected ${policy.active_source_urls_sha256}, got ${actualFingerprint}`,
    );
  }

  if (!Array.isArray(policy.export_source_exemptions)) {
    throw new Error('export_source_exemptions must be an array');
  }
  const exemptedIds = new Set();
  for (const exemption of policy.export_source_exemptions) {
    if (!exemption || typeof exemption !== 'object' || Array.isArray(exemption)) {
      throw new Error('Every export source exemption must be an object');
    }
    assertSafeText(exemption.source_id, 'export exemption source_id');
    assertSafeText(exemption.reason, `export exemption ${exemption.source_id} reason`, 300);
    if (exemptedIds.has(exemption.source_id)) {
      throw new Error(`Duplicate export source exemption: ${exemption.source_id}`);
    }
    if (activeSourceById.has(exemption.source_id)) {
      throw new Error(`Active state source cannot be export-exempt: ${exemption.source_id}`);
    }
    if (!exportedSourceById.has(exemption.source_id)) {
      throw new Error(`Export source exemption is stale or unknown: ${exemption.source_id}`);
    }
    exemptedIds.add(exemption.source_id);
  }

  const unexpectedExportSources = [...exportedSourceById.keys()]
    .filter((id) => !activeSourceById.has(id) && !exemptedIds.has(id))
    .sort();
  if (unexpectedExportSources.length) {
    throw new Error(`Unexpected export-only sources need explicit exemption: ${unexpectedExportSources.join(', ')}`);
  }

  const missingExemptions = [...exemptedIds]
    .filter((id) => activeSourceById.has(id) || !exportedSourceById.has(id))
    .sort();
  if (missingExemptions.length) {
    throw new Error(`Invalid export source exemptions: ${missingExemptions.join(', ')}`);
  }

  const requiredIds = new Set(activeSourceById.keys());
  const registeredIds = new Set();
  const entries = [];

  for (const review of policy.reviews) {
    if (!review || typeof review !== 'object' || Array.isArray(review)) {
      throw new Error('Every source-review entry must be an object');
    }
    assertSafeText(review.source_id, 'review.source_id');
    if (registeredIds.has(review.source_id)) {
      throw new Error(`Duplicate source-review entry: ${review.source_id}`);
    }
    registeredIds.add(review.source_id);

    const source = activeSourceById.get(review.source_id);
    if (!source) throw new Error(`Source-review entry is stale or unknown: ${review.source_id}`);
    if (!requiredIds.has(review.source_id)) {
      throw new Error(`Source-review entry is not an active state source: ${review.source_id}`);
    }
    const exportedSource = exportedSourceById.get(review.source_id);
    if (!exportedSource) throw new Error(`Active state source missing from exports: ${review.source_id}`);
    if (exportedSource.home_url !== source.home_url) {
      throw new Error(
        `Source URL drift for ${review.source_id}: active=${source.home_url}; exported=${exportedSource.home_url}`,
      );
    }
    if (!Number.isInteger(review.cadence_days) || review.cadence_days < 1 || review.cadence_days > 3660) {
      throw new Error(`Source ${review.source_id} cadence_days must be an integer from 1 to 3660`);
    }
    assertSafeText(review.owner, `source ${review.source_id} owner`);
    if (!ALLOWED_RISKS.has(review.risk)) {
      throw new Error(`Source ${review.source_id} has unsupported risk: ${review.risk}`);
    }

    const lastReviewedDate = parseIsoDate(review.last_reviewed, `${review.source_id}.last_reviewed`);
    const expectedNextDue = addDays(review.last_reviewed, review.cadence_days);
    if (review.next_due !== expectedNextDue) {
      throw new Error(
        `Source ${review.source_id} next_due must equal last_reviewed + cadence_days (${expectedNextDue})`,
      );
    }
    const nextDueDate = parseIsoDate(review.next_due, `${review.source_id}.next_due`);
    if (lastReviewedDate > todayDate) {
      throw new Error(`Source ${review.source_id} last_reviewed cannot be in the future`);
    }

    const evidence = `${source.retrieved_at}\n${source.robots_status}`;
    if (!evidence.includes(review.last_reviewed)) {
      throw new Error(
        `Source ${review.source_id} last_reviewed is not supported by active source provenance`,
      );
    }

    const daysUntilDue = Math.round((nextDueDate - todayDate) / DAY_MS);
    const status = daysUntilDue < 0
      ? 'overdue'
      : daysUntilDue === 0
        ? 'due_today'
        : daysUntilDue <= leadDays
          ? 'due_soon'
          : 'current';

    entries.push({
      source: {
        id: source.id,
        name: source.name,
        publisher: source.publisher,
        url: source.home_url,
      },
      cadence_days: review.cadence_days,
      last_reviewed: review.last_reviewed,
      next_due: review.next_due,
      owner: review.owner,
      risk: review.risk,
      status,
      days_until_due: daysUntilDue,
    });
  }

  const uncovered = [...requiredIds].filter((id) => !registeredIds.has(id)).sort();
  if (uncovered.length) {
    throw new Error(`Manual sources missing from source-review registry: ${uncovered.join(', ')}`);
  }

  entries.sort((a, b) => (
    a.next_due.localeCompare(b.next_due) || a.source.id.localeCompare(b.source.id)
  ));
  const counts = entries.reduce(
    (result, entry) => ({ ...result, [entry.status]: result[entry.status] + 1 }),
    { current: 0, due_soon: 0, due_today: 0, overdue: 0 },
  );

  return {
    schema_version: policy.schema_version,
    checked_on: today,
    lead_days: leadDays,
    source_count: entries.length,
    export_exemption_count: exemptedIds.size,
    counts,
    entries,
  };
}

export function canonicalSourceUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Cannot canonicalize invalid source URL: ${value}`);
  }
  if (url.protocol !== 'https:') throw new Error(`Canonical source URL must use HTTPS: ${value}`);
  url.hash = '';
  url.hostname = url.hostname.toLowerCase();
  if (url.port === '443') url.port = '';
  return url.href;
}

function observationsForEntity(entity) {
  const observations = [];
  const seen = new Set();
  const add = (observation) => {
    if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
      throw new Error(`Entity observation for ${entity.slug} must be an object`);
    }
    assertSafeText(observation.metric, `entity ${entity.slug} observation metric`);
    parseIsoDate(observation.effective_date, `entity ${entity.slug} observation effective_date`);
    assertSafeText(observation.source_id, `entity ${entity.slug} observation source_id`);
    assertSafeText(observation.value_text, `entity ${entity.slug} observation value_text`, 300);
    const key = [
      observation.metric,
      observation.effective_date,
      observation.source_id,
      observation.value_text,
      observation.source_url,
    ].join('\t');
    if (seen.has(key)) return;
    seen.add(key);
    observations.push(observation);
  };

  for (const metric of Object.keys(entity.history || {}).sort()) {
    const history = entity.history[metric];
    if (!Array.isArray(history)) throw new Error(`Entity ${entity.slug} history.${metric} must be an array`);
    for (const observation of history) add(observation);
  }
  for (const metric of Object.keys(entity.latest || {}).sort()) add(entity.latest[metric]);
  return observations;
}

function latestEffectiveObservation(observations, asOf) {
  return observations
    .filter((item) => item.effective_date <= asOf)
    .sort((a, b) => (
      a.effective_date.localeCompare(b.effective_date) || String(a.metric).localeCompare(String(b.metric))
    ))
    .at(-1) || null;
}

function observationValue(observation) {
  return observation
    ? {
        value_text: String(observation.value_text),
        effective_date: observation.effective_date,
      }
    : null;
}

function summarizeEntity(entity, asOf) {
  if (!entity || typeof entity !== 'object' || Array.isArray(entity)) {
    throw new Error('Every exported entity must be an object');
  }
  assertSafeText(entity.slug, 'exported entity slug');
  const observations = observationsForEntity(entity);
  return {
    slug: entity.slug,
    observations,
    current: observationValue(latestEffectiveObservation(observations, asOf)),
  };
}

function summarizeEntityForSources(entity, sourceIdSet, asOf) {
  const observations = entity.observations.filter((item) => sourceIdSet.has(item.source_id));
  const latestMatching = latestEffectiveObservation(observations, asOf);
  return {
    slug: entity.slug,
    source_ids: [...new Set(observations.map((item) => item.source_id))].sort(),
    current: entity.current,
    latest_matching: observationValue(latestMatching),
    history_count: observations.length,
  };
}

function compareByPriority(priority, a, b) {
  return (priority.get(b) ?? -1) - (priority.get(a) ?? -1) || a.localeCompare(b);
}

function renderSourceReviewGroup(group, entityLimit) {
  const sourceLines = group.sources.map((entry) => (
    `  - \`${entry.source.id}\` — ${entry.source.name}; last \`${entry.last_reviewed}\`; ` +
    `due \`${entry.next_due}\` (${entry.status.replace('_', ' ')}); **${entry.risk}**; \`${entry.owner}\``
  ));
  const displayedEntities = group.affected_entities.slice(0, entityLimit);
  const entityLines = displayedEntities.length
    ? displayedEntities.map((entity) => {
        const current = entity.current
          ? `series current **${entity.current.value_text}** @ \`${entity.current.effective_date}\``
          : 'no series observation effective by the export date';
        const matching = entity.latest_matching
          ? `latest listed-source observation **${entity.latest_matching.value_text}** @ \`${entity.latest_matching.effective_date}\``
          : 'no observation effective by the export date';
        return (
          `  - \`${entity.slug}\` (source IDs ${entity.source_ids.map((id) => `\`${id}\``).join(', ')}): ` +
          `${current}; ${matching}; ${entity.history_count} linked history point${entity.history_count === 1 ? '' : 's'}`
        );
      })
    : ['  - _No matching entity observation was found; verify the registry-to-export mapping._'];
  const omittedEntities = Math.max(0, group.affected_entities.length - displayedEntities.length);
  if (omittedEntities) entityLines.push(`  - _${omittedEntities} additional affected export(s) omitted from this compact packet._`);

  return [
    `### [${group.host}](${group.url})`,
    '- Registered sources:',
    ...sourceLines,
    '- Affected exports:',
    ...entityLines,
  ].join('\n');
}

export function buildSourceReviewPacket({
  report,
  exportedEntities,
  asOf = report?.checked_on,
  maxGroups = DEFAULT_PACKET_GROUP_LIMIT,
  maxEntitiesPerGroup = DEFAULT_PACKET_ENTITY_LIMIT,
  maxBytes = DEFAULT_PACKET_BYTE_LIMIT,
} = {}) {
  if (!report || !Array.isArray(report.entries)) throw new Error('Source-review report entries are required');
  if (!Array.isArray(exportedEntities) || exportedEntities.length === 0) {
    throw new Error('exportedEntities must be a non-empty array');
  }
  if (!Number.isSafeInteger(maxGroups) || maxGroups < 1) {
    throw new Error('maxGroups must be a positive safe integer');
  }
  if (!Number.isInteger(maxEntitiesPerGroup) || maxEntitiesPerGroup < 1 || maxEntitiesPerGroup > 25) {
    throw new Error('maxEntitiesPerGroup must be an integer from 1 to 25');
  }
  if (!Number.isInteger(maxBytes) || maxBytes < 2_000 || maxBytes > 55_000) {
    throw new Error('maxBytes must be an integer from 2000 to 55000');
  }
  const asOfDate = String(asOf || '').slice(0, 10);
  parseIsoDate(asOfDate, 'packet asOf');

  const seenEntitySlugs = new Set();
  const entities = exportedEntities.map((entity) => {
    const summary = summarizeEntity(entity, asOfDate);
    if (seenEntitySlugs.has(summary.slug)) throw new Error(`Duplicate exported entity slug: ${summary.slug}`);
    seenEntitySlugs.add(summary.slug);
    return summary;
  });
  const actionable = report.entries.filter((entry) => entry.status !== 'current');
  const groupMap = new Map();

  for (const entry of actionable) {
    const url = canonicalSourceUrl(entry.source.url);
    const group = groupMap.get(url) || {
      url,
      host: new URL(url).hostname,
      sources: [],
      affected_entities: [],
    };
    group.sources.push(entry);
    groupMap.set(url, group);
  }

  const groups = [...groupMap.values()].map((group) => {
    group.sources.sort((a, b) => a.source.id.localeCompare(b.source.id));
    const sourceIds = group.sources.map((entry) => entry.source.id);
    const sourceIdSet = new Set(sourceIds);
    const affectedEntities = entities
      .map((entity) => summarizeEntityForSources(entity, sourceIdSet, asOfDate))
      .filter((entity) => entity.source_ids.length > 0)
      .sort((a, b) => a.slug.localeCompare(b.slug));
    const statuses = [...new Set(group.sources.map((entry) => entry.status))]
      .sort((a, b) => compareByPriority(STATUS_PRIORITY, a, b));
    const risks = [...new Set(group.sources.map((entry) => entry.risk))]
      .sort((a, b) => compareByPriority(RISK_PRIORITY, a, b));
    return {
      ...group,
      source_ids: sourceIds,
      affected_entities: affectedEntities,
      statuses,
      risks,
      owners: [...new Set(group.sources.map((entry) => entry.owner))].sort(),
      last_reviewed_dates: [...new Set(group.sources.map((entry) => entry.last_reviewed))].sort(),
      due_dates: [...new Set(group.sources.map((entry) => entry.next_due))].sort(),
    };
  }).sort((a, b) => (
    a.due_dates[0].localeCompare(b.due_dates[0]) || a.url.localeCompare(b.url)
  ));

  const header = [
    'The quarterly review window is approaching, due, or overdue for the manually maintained legal sources below.',
    '',
    `**Review packet:** ${actionable.length} source ID${actionable.length === 1 ? '' : 's'} grouped into ` +
      `${groups.length} official URL${groups.length === 1 ? '' : 's'}; exported values evaluated as of \`${asOfDate}\`.`,
    'Review each official URL once, then record evidence separately for every listed source ID.',
    'For every group, verify the current rate, formula or scope, and any effective-date change.',
    '',
  ].join('\n') + '\n';
  const footer = [
    '',
    'Follow `docs/MAINTENANCE_RUNBOOK.md` → “State-law source review”.',
    '**Do not update `last_reviewed` or `next_due` until a human has checked the cited authority.** ' +
      'Never infer a rate, carry it forward, or treat a successful fetch as a legal review.',
  ].join('\n');
  const includedGroups = [];
  const groupCandidates = groups.slice(0, maxGroups);
  const assembleBody = (blocks, omittedGroups) => {
    const omittedSourceIds = omittedGroups.flatMap((group) => group.source_ids);
    const displayedOmittedSourceIds = omittedSourceIds.slice(0, 20);
    const remainingOmittedSourceIds = omittedSourceIds.length - displayedOmittedSourceIds.length;
    const omittedIds = displayedOmittedSourceIds.length
      ? ` Source IDs: ${displayedOmittedSourceIds.map((id) => `\`${id}\``).join(', ')}` +
        `${remainingOmittedSourceIds ? `, plus ${remainingOmittedSourceIds} more` : ''}.`
      : '';
    const omission = omittedGroups.length
      ? `\n\n_${omittedGroups.length} additional official URL group${omittedGroups.length === 1 ? ' was' : 's were'} ` +
        `omitted to keep the GitHub issue bounded.${omittedIds}_`
      : '';
    return `${header}${blocks.join('\n\n')}${omission}${footer}`;
  };
  for (const [index, group] of groupCandidates.entries()) {
    const block = renderSourceReviewGroup(group, maxEntitiesPerGroup);
    const proposedBlocks = [...includedGroups, block];
    const proposedOmittedGroups = groups.slice(index + 1);
    if (Buffer.byteLength(assembleBody(proposedBlocks, proposedOmittedGroups), 'utf8') > maxBytes) break;
    includedGroups.push(block);
  }
  const omittedGroupCount = groups.length - includedGroups.length;
  const body = assembleBody(includedGroups, groups.slice(includedGroups.length));
  const byteCount = Buffer.byteLength(body, 'utf8');
  if (byteCount > maxBytes) throw new Error('Source-review packet could not fit within maxBytes');

  return {
    checked_on: report.checked_on,
    export_as_of: asOfDate,
    actionable_source_count: actionable.length,
    url_group_count: groups.length,
    included_group_count: includedGroups.length,
    omitted_group_count: omittedGroupCount,
    max_bytes: maxBytes,
    byte_count: byteCount,
    groups,
    body,
  };
}

export function buildSourceReviewAlert(report, packet = null) {
  // Open the durable reminder during the lead window, while there is still time to perform a real
  // source review. Waiting until the next weekly run after the deadline would make the alert late by
  // design. The report still distinguishes due-soon, due-today, and overdue entries.
  const actionable = report.entries.filter((entry) => entry.status !== 'current');
  const overdue = actionable.filter((entry) => entry.status === 'overdue');
  const title = '[StatuteRates] Manual legal-source review due';
  const body = actionable.length && packet
    ? packet.body
    : actionable.length
    ? [
        'The quarterly review window is approaching, due, or overdue for these manually maintained legal sources:',
        '',
        ...actionable.map((entry) => (
          `- [${entry.source.name}](${entry.source.url}) (\`${entry.source.id}\`): ` +
          `due ${entry.next_due} (${entry.status.replace('_', ' ')}); ` +
          `owner \`${entry.owner}\`; risk **${entry.risk}**`
        )),
        '',
        'Follow `docs/MAINTENANCE_RUNBOOK.md` → “State-law source review”.',
        'Update a review date only after checking the cited authority; do not infer or carry a rate forward.',
      ].join('\n')
    : '';

  return {
    due: actionable.length > 0,
    overdue: overdue.length > 0,
    title,
    body,
    due_count: actionable.length,
    overdue_count: overdue.length,
    url_group_count: packet?.url_group_count ?? actionable.length,
  };
}

export function loadExportedEntities(entityDirectory = defaultEntityDirectory) {
  return readdirSync(entityDirectory)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => JSON.parse(readFileSync(join(entityDirectory, name), 'utf8')));
}

export function loadSourceReviewReport({
  policyPath = defaultPolicyPath,
  metaPath = defaultMetaPath,
  today = process.env.SOURCE_REVIEW_TODAY || currentEasternDate(),
  leadDays = Number(process.env.SOURCE_REVIEW_LEAD_DAYS || 14),
} = {}) {
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  const metadata = JSON.parse(readFileSync(metaPath, 'utf8'));
  const report = buildSourceReviewRegistry({
    policy,
    activeSources: STATE_SOURCES,
    exportedSources: metadata.sources,
    today,
    leadDays,
  });
  if (typeof metadata.generated_at !== 'string' || Number.isNaN(Date.parse(metadata.generated_at))) {
    throw new Error('Export metadata generated_at must be a valid timestamp');
  }
  return { ...report, export_generated_at: metadata.generated_at };
}

function writeGithubOutputs(alert) {
  const delimiter = `STATUTERATES_SOURCE_REVIEW_${Date.now()}`;
  appendFileSync(process.env.GITHUB_OUTPUT, `due=${alert.due ? 'true' : 'false'}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `overdue=${alert.overdue ? 'true' : 'false'}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `title=${alert.title}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `body<<${delimiter}\n${alert.body}\n${delimiter}\n`);
}

function main() {
  const report = loadSourceReviewReport();
  const packet = buildSourceReviewPacket({
    report,
    exportedEntities: loadExportedEntities(),
    asOf: report.export_generated_at,
  });
  const alert = buildSourceReviewAlert(report, packet);
  if (process.env.GITHUB_OUTPUT) {
    writeGithubOutputs(alert);
  } else {
    console.log(JSON.stringify({ ...report, packet, alert }, null, 2));
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
