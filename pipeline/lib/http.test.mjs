// Unit tests for the safety-critical robots.txt logic in http.mjs.
// Run: node --test  (from pipeline/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createHttpClient,
  parseRobots,
  pathAllowed,
  USER_AGENT,
  USER_AGENT_TOKEN,
} from './http.mjs';

const UA = USER_AGENT_TOKEN;

test('honest UA carries the public product name and a contact field', () => {
  assert.ok(USER_AGENT.includes('StatuteRatesBot'));
  assert.ok(/contact:/.test(USER_AGENT));
  // no unfilled placeholder token should remain in the functional UA string
  assert.ok(!USER_AGENT.includes('<<'));
});

test('empty robots => everything allowed', () => {
  const g = parseRobots('');
  assert.equal(pathAllowed(g, UA, '/anything'), true);
});

test('global disallow of a subtree blocks it but allows siblings', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /private/`);
  assert.equal(pathAllowed(g, UA, '/private/secret'), false);
  assert.equal(pathAllowed(g, UA, '/public/data'), true);
});

test('Disallow: / blocks the whole site', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /`);
  assert.equal(pathAllowed(g, UA, '/'), false);
  assert.equal(pathAllowed(g, UA, '/data/rates.csv'), false);
});

test('empty Disallow means allow-all', () => {
  const g = parseRobots(`User-agent: *\nDisallow:`);
  assert.equal(pathAllowed(g, UA, '/anything'), true);
});

test('most specific rule wins: Allow overrides a broader Disallow', () => {
  const g = parseRobots(
    `User-agent: *\nDisallow: /data/\nAllow: /data/public/`
  );
  assert.equal(pathAllowed(g, UA, '/data/private/x'), false);
  assert.equal(pathAllowed(g, UA, '/data/public/x'), true);
});

test('UA-specific group takes precedence over *', () => {
  const g = parseRobots(
    `User-agent: *\nDisallow: /\n\nUser-agent: StatuteRatesBot\nDisallow: /admin/`
  );
  // Our UA group allows everything except /admin/, ignoring the '*' blanket block.
  assert.equal(pathAllowed(g, UA, '/data/x'), true);
  assert.equal(pathAllowed(g, UA, '/admin/x'), false);
});

test('wildcard and end-anchor patterns', () => {
  const g = parseRobots(`User-agent: *\nDisallow: /*.pdf$`);
  assert.equal(pathAllowed(g, UA, '/reports/a.pdf'), false);
  assert.equal(pathAllowed(g, UA, '/reports/a.pdf?x=1'), true); // $ anchors end
  assert.equal(pathAllowed(g, UA, '/reports/a.html'), true);
});

test('comments and blank lines are ignored', () => {
  const g = parseRobots(
    `# comment\nUser-agent: *   # inline\nDisallow: /x/ # blocked\n\n`
  );
  assert.equal(pathAllowed(g, UA, '/x/y'), false);
  assert.equal(pathAllowed(g, UA, '/y'), true);
});

function queuedFetch(steps) {
  const queue = [...steps];
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (!queue.length) throw new Error(`Unexpected mock fetch: ${url}`);
    const next = queue.shift();
    if (next instanceof Error) throw next;
    return typeof next === 'function' ? next(String(url), init) : next;
  };
  return { fetchImpl, calls, remaining: () => queue.length };
}

function isolatedClient(fetchImpl, overrides = {}) {
  const cache = new Map();
  const writes = [];
  const sleeps = [];
  let clock = Date.parse('2026-09-03T12:00:00Z');
  const client = createHttpClient({
    fetchImpl,
    readCacheImpl: (url) => cache.get(url) || null,
    writeCacheImpl: (url, entry) => {
      cache.set(url, entry);
      writes.push({ url, entry });
    },
    sleepImpl: async (ms) => {
      sleeps.push(ms);
      clock += ms;
    },
    nowMsImpl: () => clock,
    nowIsoImpl: () => new Date(clock).toISOString(),
    minHostIntervalMs: 0,
    requestTimeoutMs: 1000,
    maxAttempts: 1,
    backoffMs: [],
    ...overrides,
  });
  return { client, cache, writes, sleeps };
}

function manualTimers() {
  const timers = new Set();
  const setTimeoutImpl = (callback, ms) => {
    const timer = { callback, ms };
    timers.add(timer);
    return timer;
  };
  const clearTimeoutImpl = (timer) => timers.delete(timer);
  const fireNext = () => {
    const timer = timers.values().next().value;
    assert.ok(timer, 'expected an armed request deadline');
    timers.delete(timer);
    timer.callback();
  };
  return { setTimeoutImpl, clearTimeoutImpl, fireNext, activeCount: () => timers.size };
}

function streamThatStallsAfterOneChunk(timers) {
  let pulls = 0;
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      pulls += 1;
      if (pulls === 1) {
        controller.enqueue(new TextEncoder().encode('partial'));
        return;
      }
      // highWaterMark: 0 ensures this second pull occurs only when the client requests another
      // chunk. Advancing the injected timer here proves the deadline remains live during body I/O.
      timers.fireNext();
    },
    cancel() {
      cancelled = true;
      // Deliberately never settle: cleanup itself must not be able to defeat the request deadline.
      return new Promise(() => {});
    },
  }, { highWaterMark: 0 });
  return { body, wasCancelled: () => cancelled, pulls: () => pulls };
}

test('RFC-compatible robots 4xx is treated as absent and allows the requested resource', async () => {
  for (const status of [400, 401, 403, 404, 410, 451]) {
    const mock = queuedFetch([
      new Response(null, { status }),
      new Response(`payload-${status}`, { status: 200, headers: { 'content-type': 'text/plain' } }),
    ]);
    const { client, writes } = isolatedClient(mock.fetchImpl);
    const result = await client.politeGet(`https://absent-${status}.test/data`, {
      sourceId: `source-${status}`,
      force: true,
    });

    assert.equal(result.body, `payload-${status}`);
    assert.equal(writes[0].entry.status, status);
    assert.equal(writes[0].entry.body, '');
    assert.deepEqual(
      mock.calls.map((call) => call.url),
      [`https://absent-${status}.test/robots.txt`, `https://absent-${status}.test/data`]
    );
    assert.ok(mock.calls.every((call) => call.init.redirect === 'manual'));
    assert.equal(mock.remaining(), 0);
  }
});

test('robots 429 and 5xx retry, fail closed, and are never cached as absent', async () => {
  for (const status of [429, 503]) {
    const mock = queuedFetch(Array.from(
      { length: 3 },
      () => new Response(null, { status })
    ));
    const { client, writes, sleeps } = isolatedClient(mock.fetchImpl, {
      maxAttempts: 3,
      backoffMs: [11, 29],
    });

    await assert.rejects(
      () => client.politeGet(`https://transient-${status}.test/data`, { force: true }),
      new RegExp(`ROBOTS_UNREACHABLE: .*HTTP_${status} after 3 attempts`)
    );
    assert.equal(mock.calls.length, 3);
    assert.deepEqual(sleeps, [11, 29]);
    assert.deepEqual(writes, []);
  }
});

test('a robots network failure retries, fails closed, and writes no allow decision', async () => {
  const mock = queuedFetch([
    new Error('temporary DNS failure'),
    new Error('temporary DNS failure'),
    new Error('temporary DNS failure'),
  ]);
  const { client, writes, sleeps } = isolatedClient(mock.fetchImpl, {
    maxAttempts: 3,
    backoffMs: [7, 13],
  });

  await assert.rejects(
    () => client.politeGet('https://network-failure.test/data', { force: true }),
    /ROBOTS_UNREACHABLE: .*failed after 3 attempts \(temporary DNS failure\)/
  );
  assert.equal(mock.calls.length, 3);
  assert.deepEqual(sleeps, [7, 13]);
  assert.deepEqual(writes, []);
});

test('a legacy cached robots transient error is retried instead of becoming allow-all', async () => {
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response('fresh payload', { status: 200 }),
  ]);
  const { client, cache } = isolatedClient(mock.fetchImpl);
  cache.set('https://legacy-cache.test/robots.txt', {
    status: 503,
    retrieved_at: '2026-09-03T11:59:00Z',
    body: '',
  });

  const result = await client.politeGet('https://legacy-cache.test/data', { force: true });
  assert.equal(result.body, 'fresh payload');
  assert.deepEqual(
    mock.calls.map((call) => call.url),
    ['https://legacy-cache.test/robots.txt', 'https://legacy-cache.test/data']
  );
});

test('direct fetches reject credentials and literal local or private network targets before I/O', async () => {
  const unsafeUrls = [
    'http://localhost/data',
    'https://source.localhost/data',
    'http://127.0.0.1/data',
    'http://127.1/data',
    'http://10.0.0.1/data',
    'http://100.64.0.1/data',
    'http://169.254.169.254/latest/meta-data/',
    'http://172.16.0.1/data',
    'http://192.168.1.1/data',
    'http://[::1]/data',
    'http://[::ffff:127.0.0.1]/data',
    'http://[64:ff9b::7f00:1]/data',
    'http://[fc00::1]/data',
    'http://[fe80::1]/data',
    'http://service.local/data',
    'http://localhost.localdomain/data',
    'https://user:password@example.test/data',
  ];

  for (const url of unsafeUrls) {
    const mock = queuedFetch([]);
    const { client, writes } = isolatedClient(mock.fetchImpl);
    await assert.rejects(
      () => client.politeGet(url, { force: true }),
      /NETWORK: (?:unsafe network target|URL credentials are not allowed)/
    );
    assert.equal(mock.calls.length, 0, `${url} must be rejected before fetch`);
    assert.deepEqual(writes, []);
  }
});

test('a public source redirect cannot cross into a private network target', async () => {
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response(null, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data/' },
    }),
  ]);
  const { client, writes } = isolatedClient(mock.fetchImpl);

  await assert.rejects(
    () => client.politeGet('https://public-source.test/start', { force: true }),
    /REDIRECT_INVALID: unsafe network target 169\.254\.169\.254/
  );
  assert.deepEqual(
    mock.calls.map((call) => call.url),
    ['https://public-source.test/robots.txt', 'https://public-source.test/start']
  );
  assert.deepEqual(writes.map((write) => write.url), ['https://public-source.test/robots.txt']);
});

test('cross-origin redirects check and throttle the destination before following', async () => {
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response(null, {
      status: 302,
      headers: { location: 'https://destination.test/final?format=csv' },
    }),
    new Response('User-agent: *\nAllow: /final', { status: 200 }),
    new Response('redirected payload', { status: 200 }),
  ]);
  const { client, sleeps } = isolatedClient(mock.fetchImpl, { minHostIntervalMs: 3000 });
  const result = await client.politeGet('https://origin.test/start', {
    sourceId: 'redirected-source',
    force: true,
  });

  assert.equal(result.body, 'redirected payload');
  assert.equal(result.final_url, 'https://destination.test/final?format=csv');
  assert.deepEqual(
    mock.calls.map((call) => call.url),
    [
      'https://origin.test/robots.txt',
      'https://origin.test/start',
      'https://destination.test/robots.txt',
      'https://destination.test/final?format=csv',
    ]
  );
  assert.deepEqual(sleeps, [3000, 3000]);
  assert.equal(client.fetchStats()['redirected-source'], 2);
});

test('cross-origin redirects stop before a destination path disallowed by robots', async () => {
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response(null, {
      status: 302,
      headers: { location: 'https://blocked-destination.test/private/report.csv' },
    }),
    new Response('User-agent: *\nDisallow: /private/', { status: 200 }),
  ]);
  const { client } = isolatedClient(mock.fetchImpl);

  await assert.rejects(
    () => client.politeGet('https://redirect-source.test/start', { force: true }),
    /ROBOTS_DISALLOW: https:\/\/blocked-destination\.test\/private\/report\.csv/
  );
  assert.deepEqual(
    mock.calls.map((call) => call.url),
    [
      'https://redirect-source.test/robots.txt',
      'https://redirect-source.test/start',
      'https://blocked-destination.test/robots.txt',
    ]
  );
});

test('redirect chains stop at the configured cap', async () => {
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response(null, { status: 302, headers: { location: '/one' } }),
    new Response(null, { status: 302, headers: { location: '/two' } }),
  ]);
  const { client } = isolatedClient(mock.fetchImpl, { maxRedirects: 1 });

  await assert.rejects(
    () => client.politeGet('https://redirect-loop.test/start', { force: true }),
    /REDIRECT_LIMIT: .* exceeded 1 redirects/
  );
  assert.deepEqual(
    mock.calls.map((call) => call.url),
    [
      'https://redirect-loop.test/robots.txt',
      'https://redirect-loop.test/start',
      'https://redirect-loop.test/one',
    ]
  );
});

test('declared and streamed response bodies are rejected at the byte limit without caching', async () => {
  for (const oversizedResponse of [
    () => new Response('small', { status: 200, headers: { 'content-length': '99' } }),
    () => new Response('123456', { status: 200 }),
  ]) {
    const mock = queuedFetch([
      new Response(null, { status: 404 }),
      oversizedResponse(),
    ]);
    const { client, writes } = isolatedClient(mock.fetchImpl, { maxResponseBytes: 5 });

    await assert.rejects(
      () => client.politeGet('https://oversized.test/data', { force: true }),
      /RESPONSE_TOO_LARGE:/
    );
    assert.deepEqual(writes.map((write) => write.url), ['https://oversized.test/robots.txt']);
  }
});

test('oversized robots documents fail closed and are not cached', async () => {
  const mock = queuedFetch([
    new Response('User-agent: *\nAllow: /', {
      status: 200,
      headers: { 'content-length': '1000' },
    }),
  ]);
  const { client, writes } = isolatedClient(mock.fetchImpl, { maxRobotsBytes: 10 });

  await assert.rejects(
    () => client.politeGet('https://oversized-robots.test/data', { force: true }),
    /ROBOTS_UNREACHABLE: .*RESPONSE_TOO_LARGE:/
  );
  assert.deepEqual(writes, []);
});

test('the absolute request deadline remains active while a data response body is streaming', async () => {
  const timers = manualTimers();
  const stalled = streamThatStallsAfterOneChunk(timers);
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    () => new Response(stalled.body, { status: 200 }),
  ]);
  const { client, writes } = isolatedClient(mock.fetchImpl, {
    requestTimeoutMs: 37,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl,
  });

  await assert.rejects(
    () => client.politeGet('https://slow-body.test/data', { force: true }),
    /REQUEST_TIMEOUT: https:\/\/slow-body\.test\/data exceeded the 37ms response deadline/
  );
  assert.ok(stalled.pulls() >= 2, 'the body delivered a chunk before stalling');
  assert.equal(stalled.wasCancelled(), true);
  assert.deepEqual(writes.map((write) => write.url), ['https://slow-body.test/robots.txt']);
  assert.equal(timers.activeCount(), 0);
});

test('a stalled robots body times out fail-closed and never writes an allow decision', async () => {
  const timers = manualTimers();
  const stalled = streamThatStallsAfterOneChunk(timers);
  const mock = queuedFetch([
    () => new Response(stalled.body, { status: 200 }),
  ]);
  const { client, writes } = isolatedClient(mock.fetchImpl, {
    requestTimeoutMs: 41,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl,
  });

  await assert.rejects(
    () => client.politeGet('https://slow-robots.test/data', { force: true }),
    /ROBOTS_UNREACHABLE: .*REQUEST_TIMEOUT: .* exceeded the 41ms response deadline/
  );
  assert.ok(stalled.pulls() >= 2, 'the robots body delivered a chunk before stalling');
  assert.equal(stalled.wasCancelled(), true);
  assert.deepEqual(writes, []);
  assert.equal(mock.calls.length, 1);
  assert.equal(timers.activeCount(), 0);
});

test('bounded binary responses remain byte-exact and cache as base64', async () => {
  const bytes = Uint8Array.from([0, 255, 1, 128]);
  const mock = queuedFetch([
    new Response(null, { status: 404 }),
    new Response(bytes, { status: 200, headers: { 'content-type': 'application/pdf' } }),
  ]);
  const { client, writes } = isolatedClient(mock.fetchImpl, { maxResponseBytes: bytes.length });
  const result = await client.politeGetBuffer('https://binary.test/report.pdf', { force: true });

  assert.ok(Buffer.isBuffer(result.body));
  assert.deepEqual([...result.body], [...bytes]);
  assert.equal(writes.at(-1).entry.body_base64, Buffer.from(bytes).toString('base64'));
  assert.equal(writes.at(-1).entry.body, undefined);
});
