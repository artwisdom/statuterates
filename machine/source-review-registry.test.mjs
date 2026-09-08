import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceReviewAlert,
  buildSourceReviewRegistry,
  currentEasternDate,
  loadSourceReviewReport,
  sourceUrlFingerprint,
} from './source-review-registry.mjs';

function source(id = 'aa-jud', overrides = {}) {
  return {
    id,
    name: `${id} legal source`,
    publisher: 'Example court (official)',
    home_url: `https://example.gov/${id}`,
    robots_status: 'curated fixed value; official source checked 2026-01-01',
    retrieved_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function policy(activeSources, reviews = undefined, exportSourceExemptions = []) {
  return {
    schema_version: 1,
    active_source_urls_sha256: sourceUrlFingerprint(activeSources),
    export_source_exemptions: exportSourceExemptions,
    reviews: reviews || activeSources.map((item) => ({
      source_id: item.id,
      cadence_days: 90,
      last_reviewed: '2026-01-01',
      next_due: '2026-04-01',
      owner: 'repository-owner',
      risk: 'high',
    })),
  };
}

test('the committed registry covers all 102 authoritative state sources', () => {
  const savedPolicy = JSON.parse(readFileSync(
    new URL('./source-review-registry.json', import.meta.url),
    'utf8',
  ));
  // Use committed review evidence rather than freezing this integrity test to the release date.
  // Future genuine reviews must not require an unrelated test-fixture edit.
  const latestCommittedReview = savedPolicy.reviews
    .map((review) => review.last_reviewed)
    .sort()
    .at(-1);
  const report = loadSourceReviewReport({ today: latestCommittedReview });

  assert.equal(savedPolicy.reviews.length, 102);
  assert.equal(report.source_count, 102);
  assert.equal(report.export_exemption_count, 6);
  assert.equal(Object.values(report.counts).reduce((sum, count) => sum + count, 0), 102);
  assert.ok(report.entries.every((entry) => entry.source.url.startsWith('https://')));
  assert.equal(new Set(report.entries.map((entry) => entry.source.id)).size, 102);
});

test('due-date boundaries distinguish warning, due-today, and overdue states', () => {
  const activeSources = [source()];
  const input = {
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    leadDays: 14,
  };

  assert.equal(buildSourceReviewRegistry({ ...input, today: '2026-03-17' }).entries[0].status, 'current');
  const dueSoon = buildSourceReviewRegistry({ ...input, today: '2026-03-18' });
  assert.equal(dueSoon.entries[0].status, 'due_soon');
  assert.deepEqual(
    { due: buildSourceReviewAlert(dueSoon).due, overdue: buildSourceReviewAlert(dueSoon).overdue },
    { due: true, overdue: false },
  );
  assert.match(buildSourceReviewAlert(dueSoon).body, /due 2026-04-01 \(due soon\)/);

  const dueToday = buildSourceReviewRegistry({ ...input, today: '2026-04-01' });
  assert.equal(dueToday.entries[0].status, 'due_today');
  assert.deepEqual(
    { due: buildSourceReviewAlert(dueToday).due, overdue: buildSourceReviewAlert(dueToday).overdue },
    { due: true, overdue: false },
  );

  const overdue = buildSourceReviewRegistry({ ...input, today: '2026-04-02' });
  const alert = buildSourceReviewAlert(overdue);
  assert.equal(overdue.entries[0].status, 'overdue');
  assert.equal(alert.due, true);
  assert.equal(alert.overdue, true);
  assert.match(alert.body, /due 2026-04-01 \(overdue\)/);
  assert.match(alert.body, /repository-owner/);
});

test('the default calendar boundary is U.S. Eastern rather than UTC', () => {
  assert.equal(currentEasternDate(new Date('2026-09-08T00:30:00Z')), '2026-09-07');
  assert.equal(currentEasternDate(new Date('2026-09-08T12:00:00Z')), '2026-09-08');
});

test('the executable emits safe multiline GitHub outputs during the warning window', () => {
  const directory = mkdtempSync(join(tmpdir(), 'statuterates-source-review-'));
  const outputPath = join(directory, 'github-output.txt');
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./source-review-registry.mjs', import.meta.url))], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: outputPath,
        SOURCE_REVIEW_TODAY: '2026-09-23',
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = readFileSync(outputPath, 'utf8');
    assert.match(output, /^due=true$/m);
    assert.match(output, /^overdue=false$/m);
    assert.match(output, /^title=\[StatuteRates\] Manual legal-source review due$/m);
    assert.match(output, /^body<<STATUTERATES_SOURCE_REVIEW_\d+$/m);
    assert.match(output, /Massachusetts G\.L\. c\.231/);
    assert.match(output, /\(due soon\)/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('a missing active source review fails closed', () => {
  const activeSources = [source('aa-jud'), source('bb-jud')];
  const oneReview = policy([activeSources[0]]).reviews;

  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy(activeSources, oneReview),
      activeSources,
      exportedSources: activeSources,
      today: '2026-02-01',
    }),
    /Manual sources missing from source-review registry: bb-jud/,
  );
});

test('stale reviews and unexpected export-only sources fail closed', () => {
  const activeSources = [source('aa-jud')];
  const staleReview = {
    ...policy(activeSources).reviews[0],
    source_id: 'retired-source',
  };

  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy(activeSources, [staleReview], [{
        source_id: 'retired-source',
        reason: 'Retired legacy metadata retained for compatibility.',
      }]),
      activeSources,
      exportedSources: [...activeSources, source('retired-source')],
      today: '2026-02-01',
    }),
    /Source-review entry is stale or unknown: retired-source/,
  );

  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy(activeSources),
      activeSources,
      exportedSources: [...activeSources, source('surprise-source')],
      today: '2026-02-01',
    }),
    /Unexpected export-only sources need explicit exemption: surprise-source/,
  );
});

test('an explicit export-only disposition is audited but not treated as active', () => {
  const activeSources = [source('aa-jud')];
  const legacy = source('retired-source');
  const exemption = [{ source_id: legacy.id, reason: 'Retired legacy metadata retained for compatibility.' }];
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources, undefined, exemption),
    activeSources,
    exportedSources: [...activeSources, legacy],
    today: '2026-02-01',
  });

  assert.equal(report.source_count, 1);
  assert.equal(report.export_exemption_count, 1);
});

test('source URL drift fails both the active contract and export comparison', () => {
  const original = source('aa-jud');
  const changed = source('aa-jud', { home_url: 'https://example.gov/changed' });

  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy([original]),
      activeSources: [changed],
      exportedSources: [changed],
      today: '2026-02-01',
    }),
    /Active state-source URL contract changed/,
  );

  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy([original]),
      activeSources: [original],
      exportedSources: [changed],
      today: '2026-02-01',
    }),
    /Source URL drift for aa-jud/,
  );
});

test('malformed dates, schedules, owners, risks, and insecure URLs fail closed', () => {
  const activeSources = [source('aa-jud')];
  const baseReview = policy(activeSources).reviews[0];
  const invalidReviews = [
    [{ ...baseReview, next_due: '2026-04-02' }, /next_due must equal/],
    [{ ...baseReview, last_reviewed: '2026-02-30' }, /not a real calendar date/],
    [{ ...baseReview, cadence_days: 0 }, /cadence_days must be an integer/],
    [{ ...baseReview, owner: 'bad\nowner' }, /owner must be a non-empty single-line string/],
    [{ ...baseReview, risk: 'unknown' }, /unsupported risk/],
  ];

  for (const [review, error] of invalidReviews) {
    assert.throws(
      () => buildSourceReviewRegistry({
        policy: policy(activeSources, [review]),
        activeSources,
        exportedSources: activeSources,
        today: '2026-02-01',
      }),
      error,
    );
  }

  const insecure = source('aa-jud', { home_url: 'http://example.gov/aa-jud' });
  assert.throws(
    () => buildSourceReviewRegistry({
      policy: policy([insecure]),
      activeSources: [insecure],
      exportedSources: [insecure],
      today: '2026-02-01',
    }),
    /home_url must use HTTPS/,
  );
});
