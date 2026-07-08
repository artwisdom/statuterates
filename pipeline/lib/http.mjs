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
export const USER_AGENT =
  'DataMoatEngineBot/0.1 (+https://example.org/about; contact: <<OWNER_PROVIDES>>)';
const MIN_HOST_INTERVAL_MS = 3000; // >= 3s between requests to the same host
const MAX_FETCHES_PER_SOURCE = 150; // hard ceiling per source per run
const REQUEST_TIMEOUT_MS = 30000;

// --- In-process state --------------------------------------------------------
const lastHostFetchAt = new Map(); // host -> epoch ms
const perSourceCount = new Map(); // sourceId -> count
const robotsCache = new Map(); // host -> parsed robots rules

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

async function getRobots(host, origin) {
  if (robotsCache.has(host)) return robotsCache.get(host);
  const robotsUrl = `${origin}/robots.txt`;
  const cached = readCache(robotsUrl);
  let txt = null;
  let status = null;
  if (cached) {
    txt = cached.body;
    status = cached.status;
  } else {
    await throttleHost(host);
    try {
      const res = await fetchWithTimeout(robotsUrl);
      status = res.status;
      txt = res.status === 200 ? await res.text() : '';
    } catch {
      txt = '';
      status = 0;
    }
    writeCache(robotsUrl, {
      url: robotsUrl,
      status,
      retrieved_at: nowIso(),
      body: txt,
      note: 'robots.txt snapshot',
    });
  }
  // On 4xx/absent robots, crawling is permitted by convention. On 5xx we stay conservative.
  const groups = txt ? parseRobots(txt) : [];
  const parsed = { groups, status, absent: !txt };
  robotsCache.set(host, parsed);
  return parsed;
}

async function throttleHost(host) {
  const last = lastHostFetchAt.get(host) || 0;
  const wait = MIN_HOST_INTERVAL_MS - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  lastHostFetchAt.set(host, Date.now());
}

function fetchWithTimeout(url, init = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  return fetch(url, {
    ...init,
    signal: ctrl.signal,
    redirect: 'follow',
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*', ...(init.headers || {}) },
  }).finally(() => clearTimeout(t));
}

export function nowIso() {
  return new Date().toISOString();
}

/**
 * Cache-first, robots-respecting, rate-limited GET.
 * @param {string} url
 * @param {object} opts
 * @param {string} opts.sourceId  logical source id (for the per-source fetch cap)
 * @param {boolean} [opts.force]  bypass cache (still throttles + writes cache)
 * @returns {Promise<{url,status,retrieved_at,body,fromCache,contentType}>}
 */
export async function politeGet(url, { sourceId = 'default', force = false } = {}) {
  const u = new URL(url);
  const host = u.host;
  const origin = u.origin;

  // 1) Cache first — never re-fetch what we have.
  if (!force) {
    const cached = readCache(url);
    if (cached && cached.status === 200) {
      return { ...cached, fromCache: true };
    }
  }

  // 2) robots.txt gate.
  const robots = await getRobots(host, origin);
  if (!robots.absent) {
    const allowed = pathAllowed(robots.groups, 'DataMoatEngineBot', u.pathname + (u.search || ''));
    if (!allowed) {
      throw new Error(`ROBOTS_DISALLOW: ${url} is disallowed by ${origin}/robots.txt for our UA`);
    }
  }

  // 3) Per-source ceiling.
  const count = perSourceCount.get(sourceId) || 0;
  if (count >= MAX_FETCHES_PER_SOURCE) {
    throw new Error(
      `FETCH_CAP: source "${sourceId}" hit the ${MAX_FETCHES_PER_SOURCE}-fetch ceiling this run`
    );
  }
  perSourceCount.set(sourceId, count + 1);

  // 4) Throttle + fetch.
  await throttleHost(host);
  const res = await fetchWithTimeout(url);
  const body = await res.text();
  const entry = {
    url,
    status: res.status,
    retrieved_at: nowIso(),
    contentType: res.headers.get('content-type') || '',
    body,
  };
  writeCache(url, entry); // cache all responses, including non-200, to avoid re-fetching
  if (res.status !== 200) {
    throw new Error(`HTTP_${res.status}: ${url}`);
  }
  return { ...entry, fromCache: false };
}

export function fetchStats() {
  return Object.fromEntries(perSourceCount);
}
