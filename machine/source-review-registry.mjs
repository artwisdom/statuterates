#!/usr/bin/env node

import { appendFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { STATE_SOURCES } from '../pipeline/fetchers/us-states.mjs';

const DAY_MS = 86_400_000;
const ALLOWED_RISKS = new Set(['critical', 'high', 'medium', 'low']);

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultPolicyPath = join(__dirname, 'source-review-registry.json');
const defaultMetaPath = join(__dirname, '..', 'data', 'exports', 'meta.json');

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

export function buildSourceReviewAlert(report) {
  // Open the durable reminder during the lead window, while there is still time to perform a real
  // source review. Waiting until the next weekly run after the deadline would make the alert late by
  // design. The report still distinguishes due-soon, due-today, and overdue entries.
  const actionable = report.entries.filter((entry) => entry.status !== 'current');
  const overdue = actionable.filter((entry) => entry.status === 'overdue');
  const title = '[StatuteRates] Manual legal-source review due';
  const body = actionable.length
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
  };
}

export function loadSourceReviewReport({
  policyPath = defaultPolicyPath,
  metaPath = defaultMetaPath,
  today = process.env.SOURCE_REVIEW_TODAY || currentEasternDate(),
  leadDays = Number(process.env.SOURCE_REVIEW_LEAD_DAYS || 14),
} = {}) {
  const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
  const metadata = JSON.parse(readFileSync(metaPath, 'utf8'));
  return buildSourceReviewRegistry({
    policy,
    activeSources: STATE_SOURCES,
    exportedSources: metadata.sources,
    today,
    leadDays,
  });
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
  const alert = buildSourceReviewAlert(report);
  if (process.env.GITHUB_OUTPUT) {
    writeGithubOutputs(alert);
  } else {
    console.log(JSON.stringify({ ...report, alert }, null, 2));
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
