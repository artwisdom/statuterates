import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkSiteHealth,
  DEFAULT_MAX_DATA_AGE_HOURS,
} from './check-site-health.mjs';

const ORIGIN = 'https://statuterates.com';
const NOW = new Date('2026-08-30T18:00:00Z');

function sitemap({ duplicate = false, foreign = false } = {}) {
  const urls = [
    `${ORIGIN}/`,
    `${ORIGIN}/rates/texas-judgment-rate/`,
    ...Array.from({ length: 108 }, (_, index) => `${ORIGIN}/rates/test-${index}/`),
  ];
  if (duplicate) urls.push(urls[2]);
  if (foreign) urls.push('https://example.com/rates/copied/');
  return `<?xml version="1.0"?><urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
}

function metadata(generatedAt = '2026-08-26T12:00:00Z') {
  return JSON.stringify({
    api_version: 'v1',
    generated_at: generatedAt,
    data: {
      generated_at: generatedAt,
      entity_count: 114,
      observation_count: 5_508,
      sources: Array.from({ length: 12 }, (_, index) => ({ id: `source-${index}` })),
    },
  });
}

function healthyBodies(overrides = {}) {
  return {
    '/': `<html><head><link rel="canonical" href="${ORIGIN}/"></head></html>`,
    '/rates/texas-judgment-rate/': `<html><head><link rel="canonical" href="${ORIGIN}/rates/texas-judgment-rate/"></head></html>`,
    '/robots.txt': `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    '/sitemap.xml': sitemap(),
    '/ads.txt': 'google.com, pub-9318320959789814, DIRECT, f08c47fec0942fa0\n',
    '/llms.txt': `${ORIGIN}/api/v1/meta.json\n${ORIGIN}/rates/texas-judgment-rate/\n`,
    '/deploy-marker.txt': '123456789-2\n',
    '/api/v1/meta.json': metadata(),
    ...overrides,
  };
}

function mockFetch(bodies, { statuses = {}, headers = {} } = {}) {
  return async (input) => {
    const url = new URL(input);
    const body = bodies[url.pathname];
    if (body === undefined) return new Response('not found', { status: 404 });
    return new Response(body, {
      status: statuses[url.pathname] || 200,
      headers: headers[url.pathname] || {},
    });
  };
}

async function run(bodies = healthyBodies(), options = {}) {
  return checkSiteHealth({
    siteUrl: ORIGIN,
    fetchImpl: mockFetch(bodies, options),
    now: NOW,
    retryDelayMs: 0,
  });
}

test('accepts a healthy release without requiring an exact deploy marker', async () => {
  const result = await run(healthyBodies({ '/deploy-marker.txt': 'different-valid-release-id\n' }));
  assert.equal(result.marker, 'different-valid-release-id');
  assert.equal(result.sitemapUrlCount, 110);
  assert.equal(result.entityCount, 114);
  assert.equal(result.maxDataAgeHours, DEFAULT_MAX_DATA_AGE_HOURS);
});

test('fails closed when generated API data is older than the weekly holiday window', async () => {
  const old = new Date(NOW.getTime() - ((DEFAULT_MAX_DATA_AGE_HOURS + 1) * 60 * 60 * 1_000)).toISOString();
  await assert.rejects(
    run(healthyBodies({ '/api/v1/meta.json': metadata(old) })),
    /API metadata is stale/,
  );
});

test('rejects the local deploy-marker fallback', async () => {
  await assert.rejects(run(healthyBodies({ '/deploy-marker.txt': 'local\n' })), /local-build fallback/);
});

test('rejects robots rules that block a path', async () => {
  await assert.rejects(
    run(healthyBodies({
      '/robots.txt': `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${ORIGIN}/sitemap.xml\n`,
    })),
    /non-empty Disallow/,
  );
});

test('rejects a sitemap with a duplicate or foreign URL', async () => {
  await assert.rejects(run(healthyBodies({ '/sitemap.xml': sitemap({ duplicate: true }) })), /duplicate URLs/);
  await assert.rejects(run(healthyBodies({ '/sitemap.xml': sitemap({ foreign: true }) })), /foreign origin/);
});

test('rejects ads.txt without a valid direct Google publisher authorization', async () => {
  await assert.rejects(
    run(healthyBodies({ '/ads.txt': '# no network configured\n' })),
    /direct Google publisher authorization/,
  );
});

test('rejects a priority page that is noindexed at the edge', async () => {
  await assert.rejects(
    run(healthyBodies(), {
      headers: { '/rates/texas-judgment-rate/': { 'x-robots-tag': 'noindex' } },
    }),
    /blocking X-Robots-Tag/,
  );
});

test('rejects inconsistent API metadata generation timestamps', async () => {
  const record = JSON.parse(metadata());
  record.data.generated_at = '2026-08-25T12:00:00Z';
  await assert.rejects(
    run(healthyBodies({ '/api/v1/meta.json': JSON.stringify(record) })),
    /generated_at values are missing or inconsistent/,
  );
});
