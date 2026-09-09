#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { requireMachineResponseHeaders } from './http-contract.mjs';

export const DEFAULT_SITE_URL = 'https://statuterates.com';
export const DEFAULT_MAX_DATA_AGE_HOURS = 240;
export const PRIORITY_RATE_PATH = '/rates/texas-judgment-rate/';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_ATTEMPTS = 3;

function normalizedOrigin(siteUrl) {
  const url = new URL(siteUrl);
  if (url.protocol !== 'https:') throw new Error(`SITE_URL must use HTTPS, received ${url.protocol}`);
  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url.origin;
}

function requireStatus(label, response, expected = 200) {
  if (response.status !== expected) {
    throw new Error(`${label} returned HTTP ${response.status}, expected ${expected}`);
  }
  const mitigation = response.headers.get('cf-mitigated');
  if (mitigation?.toLowerCase() === 'challenge') {
    throw new Error(`${label} received a Cloudflare challenge`);
  }
}

function requireText(label, text, expected) {
  if (!text.includes(expected)) throw new Error(`${label} is missing ${expected}`);
}

function requireIndexable(label, response, text, canonical) {
  requireStatus(label, response);
  requireText(label, text, `<link rel="canonical" href="${canonical}">`);
  const robotsHeader = response.headers.get('x-robots-tag') || '';
  if (/(?:^|[\s,;:])(?:noindex|none|nosnippet)(?:$|[\s,;:])/i.test(robotsHeader)) {
    throw new Error(`${label} received blocking X-Robots-Tag: ${robotsHeader}`);
  }
  if (/<meta\s+[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(text)) {
    throw new Error(`${label} contains a noindex robots meta tag`);
  }
}

function requireRobots(text, origin) {
  requireText('robots.txt', text, 'User-agent: *');
  requireText('robots.txt', text, 'Allow: /');
  requireText('robots.txt', text, `Sitemap: ${origin}/sitemap.xml`);
  if (/^[\t ]*Disallow:[\t ]*\S/im.test(text)) {
    throw new Error('robots.txt contains a non-empty Disallow directive');
  }
}

function sitemapUrls(text, origin) {
  if (!/<urlset\b/i.test(text) || !/<\/urlset>/i.test(text)) {
    throw new Error('sitemap.xml is not a complete URL-set sitemap');
  }
  const urls = [...text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => match[1].replaceAll('&amp;', '&'));
  if (urls.length < 100) throw new Error(`sitemap.xml unexpectedly contains only ${urls.length} URLs`);
  if (new Set(urls).size !== urls.length) throw new Error('sitemap.xml contains duplicate URLs');
  for (const value of urls) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`sitemap.xml contains an invalid URL: ${value}`);
    }
    if (parsed.origin !== origin) throw new Error(`sitemap.xml contains a foreign origin: ${value}`);
    if (parsed.protocol !== 'https:') throw new Error(`sitemap.xml contains a non-HTTPS URL: ${value}`);
  }
  for (const required of [`${origin}/`, `${origin}${PRIORITY_RATE_PATH}`]) {
    if (!urls.includes(required)) throw new Error(`sitemap.xml is missing ${required}`);
  }
  return urls;
}

function requireAds(text) {
  const sellerLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  const googleDirect = /^google\.com\s*,\s*pub-\d{10,}\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0\s*$/i;
  if (!sellerLines.some((line) => googleDirect.test(line))) {
    throw new Error('ads.txt does not contain a valid direct Google publisher authorization');
  }
}

function parseMetadata(text) {
  let metadata;
  try {
    metadata = JSON.parse(text);
  } catch (error) {
    throw new Error(`API metadata is not valid JSON: ${error.message}`);
  }
  if (metadata?.api_version !== 'v1') throw new Error('API metadata does not declare api_version v1');
  if (!metadata?.generated_at || metadata.generated_at !== metadata?.data?.generated_at) {
    throw new Error('API metadata generated_at values are missing or inconsistent');
  }
  if (!Number.isInteger(metadata?.data?.entity_count) || metadata.data.entity_count < 100) {
    throw new Error('API metadata entity_count is missing or unexpectedly low');
  }
  if (!Number.isInteger(metadata?.data?.observation_count) || metadata.data.observation_count < 1_000) {
    throw new Error('API metadata observation_count is missing or unexpectedly low');
  }
  if (!Array.isArray(metadata?.data?.sources) || metadata.data.sources.length < 10) {
    throw new Error('API metadata source inventory is missing or unexpectedly small');
  }
  return metadata;
}

function requireFreshGeneratedAt(generatedAt, now, maxDataAgeHours) {
  const generatedMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedMs)) throw new Error(`API metadata has an invalid generated_at: ${generatedAt}`);
  const ageMs = now.getTime() - generatedMs;
  const futureToleranceMs = 60 * 60 * 1_000;
  if (ageMs < -futureToleranceMs) throw new Error(`API metadata generated_at is unexpectedly in the future: ${generatedAt}`);
  const maxAgeMs = maxDataAgeHours * 60 * 60 * 1_000;
  if (ageMs > maxAgeMs) {
    const ageHours = Math.floor(ageMs / (60 * 60 * 1_000));
    throw new Error(`API metadata is stale (${ageHours} hours old; limit ${maxDataAgeHours} hours)`);
  }
}

export function parseReleaseMarker(text) {
  const marker = text.trim();
  if (!marker) throw new Error('deploy-marker.txt is empty');
  if (marker.toLowerCase() === 'local') throw new Error('deploy-marker.txt exposes the local-build fallback');
  const match = /^statuterates:([0-9a-f]{40}):([1-9][0-9]*)-([1-9][0-9]*)$/.exec(marker);
  if (!match) {
    throw new Error(
      'deploy-marker.txt is malformed; expected statuterates:<40-character-sha>:<run-id>-<attempt>',
    );
  }
  return {
    marker,
    sourceSha: match[1],
    runId: match[2],
    runAttempt: Number(match[3]),
  };
}

async function fetchWithRetry(fetchImpl, url, {
  attempts,
  timeoutMs,
  retryDelayMs,
} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: 'manual',
        headers: {
          accept: '*/*',
          'cache-control': 'no-cache',
          'user-agent': 'StatuteRates-Production-Health/1.0',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (![408, 425, 429].includes(response.status) && response.status < 500) {
        return { response, text: await response.text() };
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts && retryDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (2 ** (attempt - 1))));
    }
  }
  throw new Error(`request failed after ${attempts} attempts: ${lastError?.message || 'unknown error'}`);
}

export async function checkSiteHealth({
  siteUrl = DEFAULT_SITE_URL,
  fetchImpl = globalThis.fetch,
  now = new Date(),
  maxDataAgeHours = DEFAULT_MAX_DATA_AGE_HOURS,
  attempts = DEFAULT_ATTEMPTS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  retryDelayMs = 500,
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required');
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('now must be a valid Date');
  if (!Number.isFinite(maxDataAgeHours) || maxDataAgeHours <= 0) {
    throw new Error('maxDataAgeHours must be a positive number');
  }
  const origin = normalizedOrigin(siteUrl);
  const cacheKey = now.getTime();
  const paths = {
    homepage: '/',
    ratePage: PRIORITY_RATE_PATH,
    robots: '/robots.txt',
    sitemap: '/sitemap.xml',
    ads: '/ads.txt',
    llms: '/llms.txt',
    marker: '/deploy-marker.txt',
    metadata: '/api/v1/meta.json',
  };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const url = new URL(path, origin);
    url.searchParams.set('health', String(cacheKey));
    try {
      const value = await fetchWithRetry(fetchImpl, url, { attempts, timeoutMs, retryDelayMs });
      return [key, value];
    } catch (error) {
      throw new Error(`${path} ${error.message}`);
    }
  }));
  const results = Object.fromEntries(entries);

  requireIndexable('homepage', results.homepage.response, results.homepage.text, `${origin}/`);
  requireIndexable('Texas rate page', results.ratePage.response, results.ratePage.text, `${origin}${PRIORITY_RATE_PATH}`);

  for (const [label, result] of Object.entries({
    'robots.txt': results.robots,
    'sitemap.xml': results.sitemap,
    'ads.txt': results.ads,
    'llms.txt': results.llms,
    'deploy-marker.txt': results.marker,
    'API metadata': results.metadata,
  })) requireStatus(label, result.response);

  requireRobots(results.robots.text, origin);
  const urls = sitemapUrls(results.sitemap.text, origin);
  requireAds(results.ads.text);
  requireText('llms.txt', results.llms.text, `${origin}/api/v1/meta.json`);
  requireText('llms.txt', results.llms.text, `${origin}${PRIORITY_RATE_PATH}`);
  requireMachineResponseHeaders('API metadata', results.metadata.response, 'application/json');
  const release = parseReleaseMarker(results.marker.text);
  const metadata = parseMetadata(results.metadata.text);
  requireFreshGeneratedAt(metadata.generated_at, now, maxDataAgeHours);

  return {
    origin,
    generatedAt: metadata.generated_at,
    marker: release.marker,
    sourceSha: release.sourceSha,
    runId: release.runId,
    runAttempt: release.runAttempt,
    sitemapUrlCount: urls.length,
    entityCount: metadata.data.entity_count,
    observationCount: metadata.data.observation_count,
    maxDataAgeHours,
  };
}

async function main() {
  const maxDataAgeHours = Number(process.env.MAX_DATA_AGE_HOURS || DEFAULT_MAX_DATA_AGE_HOURS);
  const result = await checkSiteHealth({
    siteUrl: process.env.SITE_URL || DEFAULT_SITE_URL,
    maxDataAgeHours,
  });
  console.log(
    `Production health OK: ${result.origin}, source ${result.sourceSha}, marker ${result.marker}, `
    + `API generated ${result.generatedAt}, `
    + `${result.entityCount} entities, ${result.observationCount} observations, ${result.sitemapUrlCount} sitemap URLs.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Production health FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
