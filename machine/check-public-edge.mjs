#!/usr/bin/env node
// Read-only post-deploy verification. It waits for the custom domain to expose the release contract,
// then checks every canonical sitemap URL so a broken public deployment cannot pass silently.

const configuredUrl = process.env.SITE_URL;
if (!configuredUrl) throw new Error('SITE_URL is required');

const base = new URL(configuredUrl);
base.pathname = '/';
base.search = '';
base.hash = '';
const origin = base.origin;
const releaseId = process.env.GITHUB_RUN_ID || Date.now();
const expectedMarker = String(process.env.DEPLOY_MARKER || '').trim();
if (!expectedMarker) throw new Error('DEPLOY_MARKER is required');

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(pathOrUrl, { cacheBust = false } = {}) {
  const url = new URL(pathOrUrl, base);
  if (cacheBust) url.searchParams.set('deploy', releaseId);
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      accept: '*/*',
      'cache-control': 'no-cache',
      'user-agent': 'StatuteRates-Deploy-Verification/1.0',
    },
    signal: AbortSignal.timeout(20_000),
  });
  return { response, text: await response.text() };
}

async function requestWithRetry(pathOrUrl, options = {}, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const result = await request(pathOrUrl, options);
      const retryable = [408, 425, 429].includes(result.response.status) || result.response.status >= 500;
      if (!retryable) return result;
      lastError = new Error(`HTTP ${result.response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await delay(750 * (2 ** (attempt - 1)));
  }
  throw new Error(`${pathOrUrl} failed after ${attempts} attempts: ${lastError?.message || 'unknown error'}`);
}

async function waitForRelease() {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const { response, text } = await request('/deploy-marker.txt', { cacheBust: true });
      if (response.status === 200 && text.trim() === expectedMarker) return;
      lastError = new Error(`expected marker ${expectedMarker}, received ${JSON.stringify(text.trim())} (HTTP ${response.status})`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < 12) await delay(5_000);
  }
  throw new Error(`Public release did not become ready: ${lastError?.message || 'unknown error'}`);
}

function requireText(label, text, expected) {
  if (!text.includes(expected)) throw new Error(`${label} is missing ${expected}`);
}

await waitForRelease();

const [home, texasRate, robots, sitemap, ads, globalFeed, rateFeed] = await Promise.all([
  requestWithRetry('/', { cacheBust: true }),
  requestWithRetry('/rates/texas-judgment-rate/', { cacheBust: true }),
  requestWithRetry('/robots.txt', { cacheBust: true }),
  requestWithRetry('/sitemap.xml', { cacheBust: true }),
  requestWithRetry('/ads.txt', { cacheBust: true }),
  requestWithRetry('/changes.xml', { cacheBust: true }),
  requestWithRetry('/rates/texas-judgment-rate.xml', { cacheBust: true }),
]);

for (const [label, result] of Object.entries({ home, texasRate, robots, sitemap, ads, globalFeed, rateFeed })) {
  if (result.response.status !== 200) throw new Error(`${label} returned HTTP ${result.response.status}`);
}
requireText('homepage', home.text, `<link rel="canonical" href="${origin}/">`);
requireText('homepage', home.text, 'rel="alternate" type="application/rss+xml"');
requireText('Texas rate page', texasRate.text, '/rates/texas-judgment-rate.xml');
requireText('Texas rate page', texasRate.text, `${origin}/terms/#data-api-license`);
requireText('robots.txt', robots.text, `Sitemap: ${origin}/sitemap.xml`);
requireText('global RSS feed', globalFeed.text, '<rss version="2.0"');
requireText('rate RSS feed', rateFeed.text, '<guid isPermaLink="false">texas-judgment-rate@');

const sitemapUrls = [...sitemap.text.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)].map((match) => match[1]);
if (sitemapUrls.length < 100) throw new Error(`Sitemap unexpectedly contains only ${sitemapUrls.length} URLs`);
if (new Set(sitemapUrls).size !== sitemapUrls.length) throw new Error('Sitemap contains duplicate URLs');
if (sitemapUrls.some((url) => new URL(url).origin !== origin)) throw new Error('Sitemap contains a foreign origin');

const failures = [];
const concurrency = 12;
for (let index = 0; index < sitemapUrls.length; index += concurrency) {
  const batch = sitemapUrls.slice(index, index + concurrency);
  const results = await Promise.all(batch.map(async (url) => {
    try {
      const { response } = await requestWithRetry(url);
      return response.status === 200 ? null : `${url} returned HTTP ${response.status}`;
    } catch (error) {
      return `${url} failed: ${error.message}`;
    }
  }));
  failures.push(...results.filter(Boolean));
}
if (failures.length) throw new Error(`Public sitemap verification failed:\n${failures.join('\n')}`);

console.log(`Public-edge verification OK: release markers, robots.txt, ads.txt, both RSS feeds, and all ${sitemapUrls.length} sitemap URLs are healthy.`);
