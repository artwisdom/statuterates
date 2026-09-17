import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceReviewPacket,
  buildSourceReviewAlert,
  buildSourceReviewRegistry,
  canonicalSourceUrl,
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

function entity(slug, observations) {
  return {
    slug,
    latest: { annual_rate: observations.at(-1) },
    history: { annual_rate: observations },
  };
}

function observation(sourceId, valueText, effectiveDate) {
  return {
    metric: 'annual_rate',
    value_text: valueText,
    effective_date: effectiveDate,
    source_id: sourceId,
    source_url: `https://example.gov/${sourceId}`,
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

test('the review packet groups canonical shared URLs and maps current exported entity impact', () => {
  const activeSources = [
    source('aa-jud', { home_url: 'https://EXAMPLE.gov/rates?a=1&b=2#table' }),
    source('aa-prejud', { home_url: 'https://example.gov/rates?a=1&b=2' }),
  ];
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    today: '2026-03-18',
    leadDays: 14,
  });
  const exportedEntities = [
    entity('alpha-judgment-rate', [
      observation('aa-jud', '5%', '2026-01-01'),
      observation('aa-jud', '6%', '2026-05-01'),
    ]),
    entity('alpha-prejudgment-rate', [observation('aa-prejud', '7%', '2026-01-01')]),
  ];
  const reportBefore = JSON.stringify(report);
  const entitiesBefore = JSON.stringify(exportedEntities);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error('source-review packet must not fetch'); };
  let packet;
  try {
    packet = buildSourceReviewPacket({ report, exportedEntities, asOf: '2026-03-18' });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.equal(canonicalSourceUrl(activeSources[0].home_url), 'https://example.gov/rates?a=1&b=2');
  assert.equal(packet.actionable_source_count, 2);
  assert.equal(packet.url_group_count, 1);
  assert.equal(packet.included_group_count, 1);
  assert.deepEqual(packet.groups[0].source_ids, ['aa-jud', 'aa-prejud']);
  assert.equal(packet.groups[0].host, 'example.gov');
  assert.deepEqual(
    packet.groups[0].affected_entities.map((item) => ({
      slug: item.slug,
      value: item.current.value_text,
      date: item.current.effective_date,
      history: item.history_count,
    })),
    [
      { slug: 'alpha-judgment-rate', value: '5%', date: '2026-01-01', history: 2 },
      { slug: 'alpha-prejudgment-rate', value: '7%', date: '2026-01-01', history: 1 },
    ],
  );
  assert.match(packet.body, /Review each official URL once, then record evidence separately for every listed source ID/);
  assert.match(packet.body, /Do not update `last_reviewed` or `next_due` until a human has checked/);
  assert.equal(JSON.stringify(report), reportBefore);
  assert.equal(JSON.stringify(exportedEntities), entitiesBefore);
});

test('each URL group reports only observations contributed by that group source', () => {
  const activeSources = [source('old-source'), source('new-source')];
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    today: '2026-03-18',
  });
  const packet = buildSourceReviewPacket({
    report,
    exportedEntities: [entity('multi-source-rate', [
      observation('old-source', '4%', '2025-01-01'),
      observation('old-source', '5%', '2025-07-01'),
      observation('new-source', '6%', '2026-01-01'),
    ])],
    asOf: '2026-03-18',
  });
  const oldGroup = packet.groups.find((group) => group.source_ids.includes('old-source'));
  const newGroup = packet.groups.find((group) => group.source_ids.includes('new-source'));

  assert.deepEqual(oldGroup.affected_entities[0], {
    slug: 'multi-source-rate',
    source_ids: ['old-source'],
    current: { value_text: '6%', effective_date: '2026-01-01' },
    latest_matching: { value_text: '5%', effective_date: '2025-07-01' },
    history_count: 2,
  });
  assert.deepEqual(newGroup.affected_entities[0], {
    slug: 'multi-source-rate',
    source_ids: ['new-source'],
    current: { value_text: '6%', effective_date: '2026-01-01' },
    latest_matching: { value_text: '6%', effective_date: '2026-01-01' },
    history_count: 1,
  });
  assert.match(oldGroup.url, /old-source/);
  assert.match(packet.body, /series current \*\*6%\*\* @ `2026-01-01`/);
  assert.match(packet.body, /latest listed-source observation \*\*5%\*\* @ `2025-07-01`/);
});

test('canonical URL grouping preserves query order and path slash semantics', () => {
  assert.notEqual(
    canonicalSourceUrl('https://example.gov/rates?a=1&b=2'),
    canonicalSourceUrl('https://example.gov/rates?b=2&a=1'),
  );
  assert.notEqual(
    canonicalSourceUrl('https://example.gov/rates'),
    canonicalSourceUrl('https://example.gov/rates/'),
  );
});

test('the review packet remains bounded and reports omitted URL and entity groups', () => {
  const activeSources = [source('aa-jud'), source('bb-jud')];
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    today: '2026-03-18',
  });
  const packet = buildSourceReviewPacket({
    report,
    exportedEntities: [
      entity('alpha-one', [observation('aa-jud', '1%', '2026-01-01')]),
      entity('alpha-two', [observation('aa-jud', '2%', '2026-01-01')]),
      entity('beta-one', [observation('bb-jud', '3%', '2026-01-01')]),
    ],
    asOf: '2026-03-18',
    maxGroups: 1,
    maxEntitiesPerGroup: 1,
    maxBytes: 2_000,
  });

  assert.equal(packet.url_group_count, 2);
  assert.equal(packet.included_group_count, 1);
  assert.equal(packet.omitted_group_count, 1);
  assert.ok(packet.byte_count <= 2_000);
  assert.match(packet.body, /1 additional official URL group was omitted/);
  assert.match(packet.body, /Source IDs: `bb-jud`/);
  assert.match(packet.body, /1 additional affected export\(s\) omitted/);
});

test('the default packet has no independent 60-group truncation', () => {
  const activeSources = Array.from({ length: 61 }, (_, index) => source(`source-${String(index).padStart(2, '0')}`));
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    today: '2026-03-18',
  });
  const exportedEntities = activeSources.map((item, index) => entity(
    `entity-${String(index).padStart(2, '0')}`,
    [observation(item.id, `${index + 1}%`, '2026-01-01')],
  ));
  const packet = buildSourceReviewPacket({ report, exportedEntities, asOf: '2026-03-18' });

  assert.equal(packet.url_group_count, 61);
  assert.equal(packet.included_group_count, 61);
  assert.equal(packet.omitted_group_count, 0);
  assert.ok(packet.byte_count <= packet.max_bytes);
});

test('impossible exported observation dates fail closed before entering a review packet', () => {
  const activeSources = [source('aa-jud')];
  const report = buildSourceReviewRegistry({
    policy: policy(activeSources),
    activeSources,
    exportedSources: activeSources,
    today: '2026-03-18',
  });
  assert.throws(
    () => buildSourceReviewPacket({
      report,
      exportedEntities: [entity('invalid-date-rate', [observation('aa-jud', '99%', '2026-02-30')])],
      asOf: '2026-03-18',
    }),
    /observation effective_date is not a real calendar date: 2026-02-30/,
  );
});

test('the default calendar boundary is U.S. Eastern rather than UTC', () => {
  assert.equal(currentEasternDate(new Date('2026-09-08T00:30:00Z')), '2026-09-07');
  assert.equal(currentEasternDate(new Date('2026-09-08T12:00:00Z')), '2026-09-08');
});

test('the executable emits a bounded grouped GitHub packet at the next committed warning window', () => {
  const directory = mkdtempSync(join(tmpdir(), 'statuterates-source-review-'));
  const outputPath = join(directory, 'github-output.txt');
  const savedPolicy = JSON.parse(readFileSync(
    new URL('./source-review-registry.json', import.meta.url),
    'utf8',
  ));
  const latestReview = savedPolicy.reviews.map((review) => review.last_reviewed).sort().at(-1);
  const firstLeadWindow = savedPolicy.reviews
    .map((review) => {
      const date = new Date(`${review.next_due}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - 14);
      return date.toISOString().slice(0, 10);
    })
    .sort()
    .at(0);
  const rehearsalDate = [latestReview, firstLeadWindow].sort().at(-1);
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('./source-review-registry.mjs', import.meta.url))], {
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_OUTPUT: outputPath,
        SOURCE_REVIEW_TODAY: rehearsalDate,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    const output = readFileSync(outputPath, 'utf8');
    assert.match(output, /^due=true$/m);
    assert.match(output, /^overdue=(?:true|false)$/m);
    assert.match(output, /^title=\[StatuteRates\] Manual legal-source review due$/m);
    assert.match(output, /^body<<STATUTERATES_SOURCE_REVIEW_\d+$/m);
    assert.match(output, /source IDs? grouped into \d+ official URLs?/);
    assert.match(output, /Affected exports:/);
    assert.match(output, /\((?:due soon|due today|overdue)\)/);
    assert.match(output, /Do not update `last_reviewed` or `next_due` until a human has checked/);
    assert.ok(Buffer.byteLength(output, 'utf8') < 55_000);
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
