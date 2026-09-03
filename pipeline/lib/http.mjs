// Shared politeness layer for all fetchers.
//
// Enforces the Section 0.3 data-ethics rules in ONE place so every fetcher inherits them:
//   - honest User-Agent
//   - >= MIN_HOST_INTERVAL_MS between requests to the same host
//   - <= MAX_FETCHES_PER_SOURCE fetches per source module per run
//   - disk cache: never re-fetch what we already have (cache-first)
//   - robots.txt checked and OBEYED before any fetch (disallowed path => throws)
//
// Uses only Node built-ins (global fetch, node:fs, node:crypto). No network deps.

import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, '..', '..', 'data', 'cache');

// --- Politeness constants (Section 0.3) --------------------------------------
// The crawler advertises an honest UA with a contact. STATUTERATES_CONTACT can override the public
// about page when the owner wants source administrators to use a different email or URL.
const CONTACT = process.env.STATUTERATES_CONTACT || 'https://statuterates.com/about/';
export const USER_AGENT_TOKEN = 'StatuteRatesBot';
export const USER_AGENT = `${USER_AGENT_TOKEN}/0.1 (+https://statuterates.com/about/; contact: ${CONTACT})`;
const MIN_HOST_INTERVAL_MS = 3000; // >= 3s between requests to the same host
const MAX_FETCHES_PER_SOURCE = 150; // hard ceiling per source per run
const REQUEST_TIMEOUT_MS = 30000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MiB after decompression
const MAX_ROBOTS_BYTES = 512 * 1024; // RFC 9309 permits a >=500 KiB parsing limit
const ROBOTS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_REDIRECTS = 5;
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [2000, 5000];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cachePathFor(url) {
  const h = createHash('sha256').update(url).digest('hex').slice(0, 40);
  let host = 'unknown';
  try {
    host = new URL(url).host.replace(/[^a-z0-9.-]/gi, '_');
  } catch {
    /* keep default */
  }
  return join(CACHE_DIR, host, `${h}.json`);
}

function readCache(url) {
  const p = cachePathFor(url);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(url, entry) {
  const p = cachePathFor(url);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(entry, null, 2));
}

// --- Minimal robots.txt parser (RFC 9309 subset) -----------------------------
// Groups user-agent lines with their Allow/Disallow directives; applies the most
// specific matching rule (longest path). We evaluate against '*' and our UA token.
export function parseRobots(txt) {
  const groups = [];
  let current = null;
  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === 'user-agent') {
      if (current && current.rules.length === 0 && current.startedByUA) {
        current.agents.push(value.toLowerCase());
      } else {
        current = { agents: [value.toLowerCase()], rules: [], startedByUA: true };
        groups.push(current);
      }
    } else if (field === 'allow' || field === 'disallow') {
      if (!current) {
        current = { agents: ['*'], rules: [], startedByUA: false };
        groups.push(current);
      }
      current.startedByUA = false;
      current.rules.push({ allow: field === 'allow', path: value });
    }
  }
  return groups;
}

export function pathAllowed(groups, uaToken, pathname) {
  // Select the group(s) whose agents match our UA token, else the '*' group.
  const uaLower = uaToken.toLowerCase();
  let selected = groups.filter((g) => g.agents.some((a) => a !== '*' && uaLower.includes(a)));
  if (selected.length === 0) selected = groups.filter((g) => g.agents.includes('*'));
  if (selected.length === 0) return true; // no applicable group => allowed
  const rules = selected.flatMap((g) => g.rules);
  // Most specific (longest path) match wins; Allow beats Disallow on tie length.
  let best = null;
  for (const r of rules) {
    if (r.path === '') {
      // empty Disallow means allow-all; empty Allow is a no-op
      if (!r.allow) best = best && best.len >= 0 ? best : { allow: true, len: 0 };
      continue;
    }
    if (matchesRobotPath(r.path, pathname)) {
      const len = r.path.length;
      if (!best || len > best.len || (len === best.len && r.allow)) {
        best = { allow: r.allow, len };
      }
    }
  }
  return best ? best.allow : true;
}

function matchesRobotPath(pattern, pathname) {
  // Support '*' wildcard and '$' end-anchor per common robots conventions.
  let re = '^';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '$') re += '$';
    else re += ch.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  }
  try {
    return new RegExp(re).test(pathname);
  } catch {
    return pathname.startsWith(pattern);
  }
}

export function nowIso() {
  return new Date().toISOString();
}

function isRobotsAbsentStatus(status) {
  // RFC 9309 section 2.3.1.1 treats 4xx (other than rate limiting) as "unavailable", which permits
  // crawling. A 429 is operationally transient and must never be mistaken for an absent policy.
  return status >= 400 && status < 500 && status !== 429;
}

function isTransientStatus(status) {
  return status === 429 || status >= 500;
}

function assertHttpUrl(url, context) {
  const parsed = url instanceof URL ? url : new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${context}: unsupported URL scheme ${parsed.protocol}`);
  }
  return parsed;
}

function discardBody(response) {
  try {
    // Cancellation is cleanup, not part of the result. Do not await a hostile custom stream whose
    // cancel hook never settles; attach a rejection handler so abandoning the body cannot create an
    // unhandled rejection either.
    Promise.resolve(response.body?.cancel()).catch(() => {});
  } catch {
    // Best effort only: the caller is already abandoning this response.
  }
}

function cancelReader(reader, reason) {
  try {
    // As above, a source-controlled stream must not be able to defeat a response deadline merely by
    // returning a promise from cancel() that never settles.
    Promise.resolve(reader.cancel(reason)).catch(() => {});
  } catch {
    // Best effort only; the original timeout/size error remains authoritative.
  }
}

async function readBoundedBody(response, { responseType, maxBytes, url, deadline }) {
  const rawLength = response.headers.get('content-length');
  if (/^\d+$/.test(rawLength || '') && Number(rawLength) > maxBytes) {
    discardBody(response);
    throw new Error(`RESPONSE_TOO_LARGE: ${url} declares ${rawLength} bytes (limit ${maxBytes})`);
  }

  if (!response.body) return responseType === 'buffer' ? Buffer.alloc(0) : '';

  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline.promise]);
      if (done) break;
      const chunk = Buffer.from(value);
      bytes += chunk.length;
      if (bytes > maxBytes) {
        cancelReader(reader, `response exceeds ${maxBytes} bytes`);
        throw new Error(`RESPONSE_TOO_LARGE: ${url} exceeded ${maxBytes} bytes while streaming`);
      }
      chunks.push(chunk);
    }
  } catch (error) {
    if (deadline.expired()) {
      // Abort normally rejects a fetch-backed stream. The explicit cancel also releases a mocked or
      // otherwise detached ReadableStream whose pending read does not observe AbortSignal directly.
      cancelReader(reader, deadline.error());
      throw deadline.error();
    }
    throw error;
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // A hostile custom stream can retain a pending read even after cancellation. The request has
      // already failed closed, so do not replace the useful timeout/size error with a lock error.
    }
  }
  const body = Buffer.concat(chunks, bytes);
  return responseType === 'buffer' ? body : body.toString('utf8');
}

/**
 * Construct an isolated polite HTTP client. Production uses the defaults below; tests inject a mock
 * fetch, in-memory cache, fake clock, and no-op sleep so every failure path is deterministic and
 * network-free.
 */
export function createHttpClient({
  fetchImpl = globalThis.fetch,
  readCacheImpl = readCache,
  writeCacheImpl = writeCache,
  sleepImpl = sleep,
  nowMsImpl = () => Date.now(),
  nowIsoImpl = nowIso,
  setTimeoutImpl = setTimeout,
  clearTimeoutImpl = clearTimeout,
  minHostIntervalMs = MIN_HOST_INTERVAL_MS,
  maxFetchesPerSource = MAX_FETCHES_PER_SOURCE,
  requestTimeoutMs = REQUEST_TIMEOUT_MS,
  maxResponseBytes = MAX_RESPONSE_BYTES,
  maxRobotsBytes = MAX_ROBOTS_BYTES,
  robotsMaxAgeMs = ROBOTS_MAX_AGE_MS,
  maxRedirects = MAX_REDIRECTS,
  maxAttempts = MAX_ATTEMPTS,
  backoffMs = BACKOFF_MS,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('createHttpClient requires fetchImpl');
  for (const [name, value, min] of [
    ['maxResponseBytes', maxResponseBytes, 1],
    ['maxRobotsBytes', maxRobotsBytes, 1],
    ['maxRedirects', maxRedirects, 0],
    ['maxAttempts', maxAttempts, 1],
  ]) {
    if (!Number.isInteger(value) || value < min) throw new TypeError(`${name} must be an integer >= ${min}`);
  }

  // --- In-process state ------------------------------------------------------
  const lastHostFetchAt = new Map(); // host -> epoch ms
  const perSourceCount = new Map(); // sourceId -> actual request attempts
  const robotsCache = new Map(); // origin -> parsed robots rules

  async function throttleHost(host) {
    const last = lastHostFetchAt.get(host);
    if (last !== undefined) {
      const wait = minHostIntervalMs - (nowMsImpl() - last);
      if (wait > 0) await sleepImpl(wait);
    }
    lastHostFetchAt.set(host, nowMsImpl());
  }

  function consumeFetchBudget(sourceId) {
    const count = perSourceCount.get(sourceId) || 0;
    if (count >= maxFetchesPerSource) {
      throw new Error(
        `FETCH_CAP: source "${sourceId}" hit the ${maxFetchesPerSource}-fetch ceiling this run`
      );
    }
    perSourceCount.set(sourceId, count + 1);
  }

  function createDeadline(url) {
    const ctrl = new AbortController();
    let expired = false;
    const timeoutError = new Error(
      `REQUEST_TIMEOUT: ${url} exceeded the ${requestTimeoutMs}ms response deadline`
    );
    let rejectDeadline;
    const promise = new Promise((_, reject) => {
      rejectDeadline = reject;
    });
    const timeout = setTimeoutImpl(() => {
      expired = true;
      ctrl.abort(timeoutError);
      rejectDeadline(timeoutError);
    }, requestTimeoutMs);
    return {
      signal: ctrl.signal,
      promise,
      expired: () => expired,
      error: () => timeoutError,
      clear: () => clearTimeoutImpl(timeout),
    };
  }

  async function fetchWithDeadline(url, init = {}) {
    const deadline = createDeadline(url);
    try {
      const request = fetchImpl(url, {
          ...init,
          signal: deadline.signal,
          // Redirects are policy boundaries. Each destination is fetched only after its own robots
          // policy and host throttle have been applied by fetchFollowingRedirects().
          redirect: 'manual',
          headers: { 'User-Agent': USER_AGENT, Accept: '*/*', ...(init.headers || {}) },
        });
      const response = await Promise.race([request, deadline.promise]);
      // The deadline intentionally remains armed until the response body is fully read or discarded.
      return { response, deadline };
    } catch (error) {
      deadline.clear();
      throw error;
    }
  }

  async function fetchWithRetries(url, { sourceId = null, purpose = 'data' } = {}) {
    const target = assertHttpUrl(url, purpose === 'robots' ? 'ROBOTS_UNREACHABLE' : 'NETWORK');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await throttleHost(target.host);
      if (sourceId !== null) consumeFetchBudget(sourceId);

      let response;
      let deadline;
      try {
        ({ response, deadline } = await fetchWithDeadline(target.href));
      } catch (error) {
        if (attempt < maxAttempts) {
          await sleepImpl(backoffMs[attempt - 1] ?? 0);
          continue;
        }
        const prefix = purpose === 'robots' ? 'ROBOTS_UNREACHABLE' : 'NETWORK';
        throw new Error(`${prefix}: ${target.href} failed after ${maxAttempts} attempts (${error.message})`, {
          cause: error,
        });
      }

      if (isTransientStatus(response.status)) {
        if (attempt < maxAttempts) {
          await discardBody(response);
          deadline.clear();
          await sleepImpl(backoffMs[attempt - 1] ?? 0);
          continue;
        }
        if (purpose === 'robots') {
          await discardBody(response);
          deadline.clear();
          throw new Error(
            `ROBOTS_UNREACHABLE: ${target.href} returned HTTP_${response.status} after ${maxAttempts} attempts`
          );
        }
      }
      return { response, deadline };
    }
    throw new Error(`NETWORK: ${target.href} exhausted its retry budget`);
  }

  function freshCachedRobots(cached) {
    if (!cached) return null;
    const status = Number(cached.status);
    const age = nowMsImpl() - Date.parse(cached.retrieved_at || '');
    if (!Number.isFinite(age) || age < 0 || age >= robotsMaxAgeMs) return null;
    if (status >= 200 && status < 300 && typeof cached.body === 'string') {
      return { groups: cached.body ? parseRobots(cached.body) : [], status, absent: false };
    }
    if (isRobotsAbsentStatus(status)) return { groups: [], status, absent: true };
    // Old versions could cache a network error/429/5xx with an empty body. Never reinterpret it as
    // absent/allow; force a live retry, which still fails closed if the policy remains unreachable.
    return null;
  }

  async function fetchRobotsDocument(robotsUrl) {
    let current = assertHttpUrl(robotsUrl, 'ROBOTS_UNREACHABLE');
    for (let redirects = 0; ; redirects++) {
      const { response, deadline } = await fetchWithRetries(current.href, { purpose: 'robots' });
      try {
        if (REDIRECT_STATUSES.has(response.status)) {
          const location = response.headers.get('location');
          await discardBody(response);
          if (!location) {
            throw new Error(`ROBOTS_UNREACHABLE: ${current.href} redirected without a Location header`);
          }
          if (redirects >= maxRedirects) {
            throw new Error(`ROBOTS_UNREACHABLE: ${robotsUrl} exceeded ${maxRedirects} redirects`);
          }
          try {
            current = assertHttpUrl(new URL(location, current), 'ROBOTS_UNREACHABLE');
          } catch (error) {
            if (String(error.message).startsWith('ROBOTS_UNREACHABLE:')) throw error;
            throw new Error(`ROBOTS_UNREACHABLE: invalid redirect from ${current.href} (${error.message})`, {
              cause: error,
            });
          }
          continue;
        }

        if (isRobotsAbsentStatus(response.status)) {
          await discardBody(response);
          return { body: '', status: response.status, finalUrl: current.href, absent: true };
        }
        if (response.status < 200 || response.status >= 300) {
          await discardBody(response);
          throw new Error(`ROBOTS_UNREACHABLE: ${current.href} returned HTTP_${response.status}`);
        }

        const body = await readBoundedBody(response, {
          responseType: 'text',
          maxBytes: maxRobotsBytes,
          url: current.href,
          deadline,
        });
        return { body, status: response.status, finalUrl: current.href, absent: false };
      } catch (error) {
        if (String(error.message).startsWith('ROBOTS_UNREACHABLE:')) throw error;
        throw new Error(`ROBOTS_UNREACHABLE: ${current.href} could not be read safely (${error.message})`, {
          cause: error,
        });
      } finally {
        deadline.clear();
      }
    }
  }

  async function getRobots(origin) {
    if (robotsCache.has(origin)) return robotsCache.get(origin);
    const robotsUrl = new URL('/robots.txt', origin).href;
    const fromDisk = freshCachedRobots(readCacheImpl(robotsUrl));
    if (fromDisk) {
      robotsCache.set(origin, fromDisk);
      return fromDisk;
    }

    // Only successful 2xx documents and RFC-compatible absent 4xx results are cached. A network
    // error, 429, 5xx, unsafe redirect, or oversized document throws and leaves no allow decision.
    const fetched = await fetchRobotsDocument(robotsUrl);
    writeCacheImpl(robotsUrl, {
      url: robotsUrl,
      final_url: fetched.finalUrl,
      status: fetched.status,
      retrieved_at: nowIsoImpl(),
      body: fetched.body,
      note: 'robots.txt snapshot',
    });
    const parsed = {
      groups: fetched.body ? parseRobots(fetched.body) : [],
      status: fetched.status,
      absent: fetched.absent,
    };
    robotsCache.set(origin, parsed);
    return parsed;
  }

  async function assertRobotsAllowed(url) {
    const target = assertHttpUrl(url, 'ROBOTS_UNREACHABLE');
    const robots = await getRobots(target.origin);
    if (!robots.absent) {
      const allowed = pathAllowed(
        robots.groups,
        USER_AGENT_TOKEN,
        target.pathname + (target.search || '')
      );
      if (!allowed) {
        throw new Error(
          `ROBOTS_DISALLOW: ${target.href} is disallowed by ${target.origin}/robots.txt for our UA`
        );
      }
    }
  }

  async function fetchFollowingRedirects(url, { sourceId, responseType }) {
    let current = assertHttpUrl(url, 'NETWORK');
    for (let redirects = 0; ; redirects++) {
      // Re-evaluate on every hop. This covers same-origin path changes and, critically, applies the
      // destination host's robots policy and throttle before a cross-origin redirect is followed.
      await assertRobotsAllowed(current);
      const { response, deadline } = await fetchWithRetries(current.href, {
        sourceId,
        purpose: 'data',
      });
      try {
        if (REDIRECT_STATUSES.has(response.status)) {
          const location = response.headers.get('location');
          await discardBody(response);
          if (!location) throw new Error(`REDIRECT_INVALID: ${current.href} has no Location header`);
          if (redirects >= maxRedirects) {
            throw new Error(`REDIRECT_LIMIT: ${url} exceeded ${maxRedirects} redirects`);
          }
          try {
            current = assertHttpUrl(new URL(location, current), 'REDIRECT_INVALID');
          } catch (error) {
            if (String(error.message).startsWith('REDIRECT_INVALID:')) throw error;
            throw new Error(`REDIRECT_INVALID: ${current.href} returned ${location} (${error.message})`, {
              cause: error,
            });
          }
          continue;
        }

        const body = await readBoundedBody(response, {
          responseType,
          maxBytes: maxResponseBytes,
          url: current.href,
          deadline,
        });
        return { response, body, finalUrl: current.href };
      } finally {
        deadline.clear();
      }
    }
  }

  const DEFAULT_MAX_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days
  async function politeGetInternal(
    url,
    { sourceId = 'default', force = false, maxAgeMs = DEFAULT_MAX_AGE_MS } = {},
    responseType = 'text'
  ) {
    const initial = assertHttpUrl(url, 'NETWORK');

    // Cache first — but treat a cache entry older than maxAgeMs as stale so the data never lags the
    // source. The CI runner starts cacheless; this protects local regenerations too.
    if (!force) {
      const cached = readCacheImpl(initial.href);
      if (cached && cached.status === 200) {
        const age = nowMsImpl() - Date.parse(cached.retrieved_at || 0);
        const fresh = !(age >= 0) || age < maxAgeMs;
        if (fresh && responseType === 'text' && typeof cached.body === 'string') {
          return { ...cached, fromCache: true };
        }
        if (fresh && responseType === 'buffer' && cached.body_encoding === 'base64'
            && typeof cached.body_base64 === 'string') {
          return {
            ...cached,
            body: Buffer.from(cached.body_base64, 'base64'),
            fromCache: true,
          };
        }
      }
    }

    const { response, body, finalUrl } = await fetchFollowingRedirects(initial.href, {
      sourceId,
      responseType,
    });
    const entry = {
      url: initial.href,
      final_url: finalUrl,
      status: response.status,
      retrieved_at: nowIsoImpl(),
      contentType: response.headers.get('content-type') || '',
      ...(responseType === 'buffer'
        ? { body_encoding: 'base64', body_base64: body.toString('base64') }
        : { body }),
    };
    writeCacheImpl(initial.href, entry); // cache final non-redirect responses, including non-200
    if (response.status !== 200) throw new Error(`HTTP_${response.status}: ${finalUrl}`);
    return { ...entry, body, fromCache: false };
  }

  return {
    politeGet: (url, options = {}) => politeGetInternal(url, options, 'text'),
    politeGetBuffer: (url, options = {}) => politeGetInternal(url, options, 'buffer'),
    fetchStats: () => Object.fromEntries(perSourceCount),
  };
}

const defaultClient = createHttpClient();

/**
 * Cache-first, robots-respecting, rate-limited GET.
 * @param {string} url
 * @param {object} options
 * @param {string} options.sourceId logical source id (for the per-source fetch cap)
 * @param {boolean} [options.force] bypass cache (still checks robots, throttles, and writes cache)
 * @param {number} [options.maxAgeMs] cached-response freshness window; default two days
 */
export function politeGet(url, options = {}) {
  return defaultClient.politeGet(url, options);
}

/**
 * Binary counterpart to politeGet. It inherits the same robots, throttling, retry, fetch-cap, and
 * two-day cache protections, while serializing cached bytes as base64 so PDFs are never corrupted by
 * an implicit UTF-8 conversion.
 * @returns {Promise<{url,status,retrieved_at,body:Buffer,fromCache,contentType}>}
 */
export function politeGetBuffer(url, options = {}) {
  return defaultClient.politeGetBuffer(url, options);
}

export function fetchStats() {
  return defaultClient.fetchStats();
}
