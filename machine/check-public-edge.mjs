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
const expectedMarker = String(process.env.DEPLOY_MARKER || '').trim();
if (!expectedMarker) throw new Error('DEPLOY_MARKER is required');
const releaseId = expectedMarker;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(pathOrUrl, { cacheBust = false, userAgent = 'StatuteRates-Deploy-Verification/1.0' } = {}) {
  const url = new URL(pathOrUrl, base);
  if (cacheBust) url.searchParams.set('deploy', releaseId);
  const response = await fetch(url, {
    redirect: 'manual',
    headers: {
      accept: '*/*',
      'cache-control': 'no-cache',
      'user-agent': userAgent,
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

const [
  home,
  texasRate,
  robots,
  sitemap,
  ads,
  globalFeed,
  rateFeed,
  llms,
  llmsFull,
  openapi,
  apiIndex,
  apiMeta,
  apiLatest,
  apiUpcoming,
  apiTexas,
] = await Promise.all([
  requestWithRetry('/', { cacheBust: true }),
  requestWithRetry('/rates/texas-judgment-rate/', { cacheBust: true }),
  requestWithRetry('/robots.txt', { cacheBust: true }),
  requestWithRetry('/sitemap.xml', { cacheBust: true }),
  requestWithRetry('/ads.txt', { cacheBust: true }),
  requestWithRetry('/changes.xml', { cacheBust: true }),
  requestWithRetry('/rates/texas-judgment-rate.xml', { cacheBust: true }),
  requestWithRetry('/llms.txt', { cacheBust: true }),
  requestWithRetry('/llms-full.txt', { cacheBust: true }),
  requestWithRetry('/openapi.yaml', { cacheBust: true }),
  requestWithRetry('/api/v1/index.json', { cacheBust: true }),
  requestWithRetry('/api/v1/meta.json', { cacheBust: true }),
  requestWithRetry('/api/v1/latest.json', { cacheBust: true }),
  requestWithRetry('/api/v1/upcoming.json', { cacheBust: true }),
  requestWithRetry('/api/v1/entity/texas-judgment-rate.json', { cacheBust: true }),
]);

for (const [label, result] of Object.entries({
  home,
  texasRate,
  robots,
  sitemap,
  ads,
  globalFeed,
  rateFeed,
  llms,
  llmsFull,
  openapi,
  apiIndex,
  apiMeta,
  apiLatest,
  apiUpcoming,
  apiTexas,
})) {
  if (result.response.status !== 200) throw new Error(`${label} returned HTTP ${result.response.status}`);
}
requireText('homepage', home.text, `<link rel="canonical" href="${origin}/">`);
requireText('homepage', home.text, 'rel="alternate" type="application/rss+xml"');
requireText('Texas rate page', texasRate.text, '/rates/texas-judgment-rate.xml');
requireText('Texas rate page', texasRate.text, `${origin}/terms/#data-api-license`);
requireText('robots.txt', robots.text, `Sitemap: ${origin}/sitemap.xml`);
requireText('global RSS feed', globalFeed.text, '<rss version="2.0"');
requireText('rate RSS feed', rateFeed.text, '<guid isPermaLink="false">texas-judgment-rate@');
requireText('robots.txt', robots.text, 'User-agent: *\nAllow: /');
if (/^Disallow: \/$/m.test(robots.text)) throw new Error('robots.txt blocks sitewide crawling');
requireText('llms.txt', llms.text, `${origin}/openapi.yaml`);
requireText('llms.txt', llms.text, `${origin}/api/v1/upcoming.json`);
requireText('OpenAPI', openapi.text, 'title: StatuteRates Static JSON and CSV API');
requireText('OpenAPI', openapi.text, '/api/v1/upcoming.json:');

function parseJson(label, text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

const indexJson = parseJson('API index', apiIndex.text);
const metaJson = parseJson('API metadata', apiMeta.text);
const latestJson = parseJson('API current values', apiLatest.text);
const upcomingJson = parseJson('API upcoming values', apiUpcoming.text);
const texasJson = parseJson('Texas entity API', apiTexas.text);
const generatedAt = indexJson.generated_at;
for (const [label, value] of Object.entries({
  'API metadata': metaJson.generated_at,
  'API current values': latestJson.generated_at,
  'API upcoming values': upcomingJson.generated_at,
  'Texas entity API': texasJson.generated_at,
})) {
  if (value !== generatedAt) throw new Error(`${label} release ${value} disagrees with API index ${generatedAt}`);
}
const currentAsOf = String(latestJson.data?.current_as_of || '').slice(0, 10);
if (currentAsOf !== String(generatedAt).slice(0, 10)) {
  throw new Error(`API current_as_of ${currentAsOf} disagrees with generated_at ${generatedAt}`);
}
for (const observation of latestJson.data?.observations || []) {
  if (observation.effective_date > currentAsOf) {
    throw new Error(`Current API promotes future value ${observation.entity}@${observation.effective_date}`);
  }
}
for (const observation of upcomingJson.data?.observations || []) {
  if (observation.effective_date <= currentAsOf) {
    throw new Error(`Upcoming API contains non-future value ${observation.entity}@${observation.effective_date}`);
  }
}
if (JSON.stringify(texasJson.data?.latest) !== JSON.stringify(texasJson.data?.current)) {
  throw new Error('Texas entity API latest compatibility alias disagrees with current');
}
if (!texasJson.data?.latest_published) throw new Error('Texas entity API lacks latest_published values');
requireText('llms-full.txt', llmsFull.text, `Current as of: ${currentAsOf}`);

// These checks prove the deployed edge does not apply a simple user-agent block. Verified crawler
// IP logs remain the definitive evidence for provider-origin traffic.
const aiCrawlerAgents = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot'];
const aiCrawlerResults = await Promise.all(aiCrawlerAgents.map((userAgent) => (
  requestWithRetry('/rates/texas-judgment-rate/', { cacheBust: true, userAgent })
)));
for (let index = 0; index < aiCrawlerResults.length; index += 1) {
  const result = aiCrawlerResults[index];
  if (result.response.status !== 200) {
    throw new Error(`${aiCrawlerAgents[index]} received HTTP ${result.response.status}`);
  }
  requireText(aiCrawlerAgents[index], result.text, `<link rel="canonical" href="${origin}/rates/texas-judgment-rate/">`);
}

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

console.log(`Public-edge verification OK: release markers, search/AI discovery files, current/upcoming API semantics, representative crawler requests, ads.txt, both RSS feeds, and all ${sitemapUrls.length} sitemap URLs are healthy.`);
