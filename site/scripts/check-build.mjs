#!/usr/bin/env node
// Post-build guardrails for internal links, calculator indexing, and prose damaged by missing
// whitespace around inline elements. Runs against static dist/ output and requires no dependencies.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPROVED_STATE_CALCULATOR_PATHS } from '../src/lib/state-calculators.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const errors = [];
const canonicalOwners = new Map();
const titleOwners = new Map();
const descriptionOwners = new Map();
const expectedOrigin = new URL(process.env.SITE_URL || 'https://statuterates.com').origin;
let manualCloudflareBeaconFile = null;
const linkGraph = new Map();

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

function localTargetExists(raw) {
  const clean = raw.split('#')[0].split('?')[0];
  if (!clean) return true;
  let pathname;
  try {
    pathname = decodeURIComponent(clean);
  } catch {
    return false;
  }
  const relative = pathname.replace(/^\/+/, '');
  const direct = join(DIST, relative);
  const candidates = [direct];
  if (pathname.endsWith('/')) candidates.push(join(direct, 'index.html'));
  else if (!extname(pathname)) candidates.push(`${direct}.html`, join(direct, 'index.html'));
  return candidates.some(existsSync);
}

function contextAt(html, index) {
  return html.slice(Math.max(0, index - 55), index + 95).replace(/\s+/g, ' ');
}

function decodeHtmlText(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  };
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&(amp|apos|gt|lt|quot);/g, (_match, name) => named[name]);
}

const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));
function routeForFile(file) {
  const local = relative(DIST, file).replaceAll('\\', '/');
  if (local === 'index.html') return '/';
  if (local.endsWith('/index.html')) return `/${local.slice(0, -'index.html'.length)}`;
  return `/${local.replace(/\.html$/, '/')}`;
}
const routeToFile = new Map(htmlFiles.map((file) => [routeForFile(file), file]));

function linkedHtmlRoute(target) {
  let pathname;
  try {
    pathname = new URL(target, expectedOrigin).pathname;
  } catch {
    return null;
  }
  if (routeToFile.has(pathname)) return pathname;
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return routeToFile.has(withSlash) ? withSlash : null;
}

function visibleMainWordCount(html) {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const text = decodeHtmlText(main
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' '));
  return text.split(/\s+/).filter((word) => /[A-Za-z]/.test(word)).length;
}

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const route = routeForFile(file);
  const outgoing = new Set();
  linkGraph.set(route, outgoing);

  // Production Cloudflare Web Analytics uses edge-managed automatic injection. Shipping a second
  // beacon in the static HTML would double-count visits and bypass the zone's EU exclusion.
  if (!manualCloudflareBeaconFile
      && (html.includes('static.cloudflareinsights.com') || html.includes('data-cf-beacon'))) {
    manualCloudflareBeaconFile = file;
  }

  // Technical SEO invariants. In addition to structural checks, keep every page's search snippet
  // distinct and within conservative display lengths so programmatic expansion cannot quietly
  // create duplicate or routinely truncated results.
  const titles = [...html.matchAll(/<title>([^<]+)<\/title>/g)];
  const descriptions = [...html.matchAll(/<meta name="description" content="([^"]+)">/g)];
  const canonicals = [...html.matchAll(/<link rel="canonical" href="(https:\/\/[^\"]+)">/g)];
  const h1s = [...html.matchAll(/<h1(?:\s|>)/g)];
  if (titles.length !== 1) errors.push(`${file}: expected one non-empty title, found ${titles.length}`);
  if (descriptions.length !== 1) errors.push(`${file}: expected one non-empty meta description, found ${descriptions.length}`);
  if (canonicals.length !== 1) errors.push(`${file}: expected one absolute HTTPS canonical, found ${canonicals.length}`);
  if (h1s.length !== 1) errors.push(`${file}: expected one H1, found ${h1s.length}`);
  if (!html.includes('<html lang="en">')) errors.push(`${file}: missing html lang="en"`);
  if (!html.includes('<meta name="viewport"')) errors.push(`${file}: missing viewport metadata`);
  if (titles.length === 1) {
    const title = decodeHtmlText(titles[0][1]).trim();
    if (title.length > 65) errors.push(`${file}: title is ${title.length} characters (maximum 65)`);
    const owner = titleOwners.get(title);
    if (owner) errors.push(`${file}: duplicate title "${title}" also used by ${owner}`);
    else titleOwners.set(title, file);
  }
  if (descriptions.length === 1) {
    const description = decodeHtmlText(descriptions[0][1]).trim();
    if (description.length > 160) {
      errors.push(`${file}: meta description is ${description.length} characters (maximum 160)`);
    }
    const owner = descriptionOwners.get(description);
    if (owner) errors.push(`${file}: duplicate meta description also used by ${owner}`);
    else descriptionOwners.set(description, file);
  }
  if (canonicals.length === 1) {
    const canonical = canonicals[0][1];
    if (!canonical.startsWith(`${expectedOrigin}/`)) {
      errors.push(`${file}: canonical ${canonical} does not use expected origin ${expectedOrigin}`);
    }
    const owner = canonicalOwners.get(canonical);
    if (owner) errors.push(`${file}: duplicate canonical ${canonical} also used by ${owner}`);
    else canonicalOwners.set(canonical, file);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt="[^"]*"/.test(image[0])) errors.push(`${file}: image is missing an alt attribute`);
  }

  for (const match of html.matchAll(/(href|src)="([^"]+)"/g)) {
    const target = match[2];
    if (!target.startsWith('/') || target.startsWith('//')) continue;
    if (!localTargetExists(target)) errors.push(`${file}: broken internal target ${target}`);
    if (match[1] === 'href') {
      const linkedRoute = linkedHtmlRoute(target);
      if (linkedRoute) outgoing.add(linkedRoute);
    }
  }

  // These conservative floors are regression alarms, not a claim that word count causes rankings.
  // They prevent a template/data failure from publishing an indexable rate or state page containing
  // little more than chrome, a number, and a source link.
  const words = visibleMainWordCount(html);
  if (/^\/rates\/[^/]+\/$/.test(route) && words < 200) {
    errors.push(`${file}: rate page has only ${words} visible words (minimum safety floor 200)`);
  }
  if (/^\/states\/[^/]+\/$/.test(route) && route !== '/states/highest-lowest/' && words < 250) {
    errors.push(`${file}: state hub has only ${words} visible words (minimum safety floor 250)`);
  }
  if (route === '/calculators/florida-judgment-interest/' && words < 850) {
    errors.push(`${file}: Florida calculator has only ${words} visible words (minimum safety floor 850)`);
  }
  if (route === '/calculators/post-judgment-interest/' && words < 700) {
    errors.push(`${file}: federal calculator has only ${words} visible words (minimum safety floor 700)`);
  }

  // Astro 7 deliberately removes some newline whitespace around inline elements. Requiring an
  // explicit source space prevents rendered phrases such as "the<a>source</a>" and "</a>for".
  const prosePatterns = [
    /[A-Za-z0-9)]<(?:a|em|strong|code)\b/g,
    /<\/(?:a|em|strong|code)>[A-Za-z0-9]/g,
  ];
  for (const pattern of prosePatterns) {
    for (const match of html.matchAll(pattern)) {
      errors.push(`${file}: missing prose whitespace near "${contextAt(html, match.index)}"`);
    }
  }
}

const sitemapPath = join(DIST, 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8');
const sitemapRoutes = [...sitemap.matchAll(/<loc>(https:\/\/[^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname);
const reachable = new Set(['/']);
const queue = ['/'];
while (queue.length) {
  const route = queue.shift();
  for (const target of linkGraph.get(route) || []) {
    if (reachable.has(target)) continue;
    reachable.add(target);
    queue.push(target);
  }
}
for (const route of sitemapRoutes) {
  if (!routeToFile.has(route)) {
    errors.push(`sitemap.xml: indexable route ${route} has no rendered HTML page`);
  } else if (!reachable.has(route)) {
    errors.push(`sitemap.xml: indexable route ${route} is not reachable through HTML links from the homepage`);
  }
}
const withheld = [
  '/calculators/state-judgment-interest/',
  '/calculators/prejudgment-interest/',
];
for (const pathname of withheld) {
  const htmlPath = join(DIST, pathname.replace(/^\//, ''), 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  if (!html.includes('<meta name="robots" content="noindex,follow">')) {
    errors.push(`${pathname}: withheld calculator is missing noindex,follow`);
  }
  if (sitemap.includes(pathname)) errors.push(`${pathname}: withheld calculator appears in sitemap.xml`);
}

const stateCalculatorRoutes = htmlFiles.filter((file) => {
  const relative = file.slice(DIST.length).replaceAll('\\', '/');
  return /\/calculators\/(?!post-judgment-interest\/)[a-z-]+-judgment-interest\/index\.html$/.test(relative)
    && !relative.endsWith('/calculators/state-judgment-interest/index.html');
}).map(routeForFile);
const approvedStateCalculatorPaths = new Set(APPROVED_STATE_CALCULATOR_PATHS);
const unsafeStateCalculatorRoutes = stateCalculatorRoutes
  .filter((route) => !approvedStateCalculatorPaths.has(route));
if (unsafeStateCalculatorRoutes.length) {
  errors.push(`unsafe state calculator pages were generated: ${unsafeStateCalculatorRoutes.join(', ')}`);
}
for (const pathname of approvedStateCalculatorPaths) {
  if (!stateCalculatorRoutes.includes(pathname)) {
    errors.push(`${pathname}: approved state calculator was not generated`);
  }
}

if (manualCloudflareBeaconFile) {
  errors.push(`${manualCloudflareBeaconFile}: manual Cloudflare Web Analytics beacon would duplicate edge-managed analytics`);
}

// Search-demand contracts: protect the exact state/rate language that Google Search Console shows
// people already use to find these pages. These guard existing trusted URLs; they do not create
// statute-only doorway pages.
const demandGuards = [
  {
    pathname: '/rates/texas-judgment-rate/',
    patterns: [/Texas Post-Judgment Interest Rate \d{4}/, /post-judgment interest rate/i],
  },
  {
    pathname: '/rates/texas-prejudgment-rate/',
    patterns: [/Texas Prejudgment Interest Rate \d{4}/, /Tex\. Fin\. Code §§304\.101–304\.107/],
  },
  {
    pathname: '/rates/iowa-judgment-rate/',
    patterns: [/Iowa Post-Judgment Interest Rate \d{4}/, /Iowa Code/],
  },
  {
    pathname: '/rates/nebraska-judgment-rate/',
    patterns: [/Nebraska Post-Judgment Interest Rate \d{4}/, /Neb\. Rev\. Stat/],
  },
  {
    pathname: '/rates/washington-judgment-rate/',
    patterns: [/RCW 4\.56\.110/, /Washington Judgment Interest Rates \d{4}/],
  },
  {
    pathname: '/rates/florida-judgment-rate/',
    patterns: [/Florida Post-Judgment Interest Rate \d{4}/, /\d+ data points/, /October 1, 1981/],
  },
  {
    pathname: '/calculators/florida-judgment-interest/',
    patterns: [
      /Florida Judgment Interest Calculator \d{4}/,
      /Fla\. Stat\. §55\.03/,
      /July 1, 2011/,
      /January 1/,
      /Contract rates/,
      /partial payments/,
      /Include the through-date/,
      /Stop before the through-date/,
      /Private: runs in your browser/,
      /Florida CFO judgment interest rates/,
      /Frequently asked questions/,
    ],
  },
  {
    pathname: '/calculators/post-judgment-interest/',
    patterns: [
      /Federal Post-Judgment Interest Calculator/,
      /28 U\.S\.C\. §1961/,
      /December 21, 2000/,
      /min="2000-12-21"/,
      /exact weekly/,
      /compounded annually/,
      /DGS1 series/,
      /WGS1YR weekly series/,
      /Frequently asked questions/,
      /substitute an older week/,
    ],
  },
  {
    pathname: '/states/utah/',
    patterns: [/Utah Judgment Interest Rates \d{4}/, /Utah Code §15-1-4/, /13\.51%/],
  },
  {
    pathname: '/rates/utah-judgment-rate/',
    patterns: [/Utah Post-Judgment Interest Rate \d{4}/, /34 data points/, /1993 through 2026/],
  },
  {
    pathname: '/rates/alaska-judgment-rate/',
    patterns: [/Alaska Post-Judgment Interest Rate \d{4}/, /30 data points/, /August 7, 1997/, /weekly pipeline/i],
  },
  {
    pathname: '/rates/alaska-prejudgment-rate/',
    patterns: [/Alaska Prejudgment Interest Rate \d{4}/, /30 data points/, /August 7, 1997/, /selected by the year judgment is entered/i],
  },
  {
    pathname: '/rates/connecticut-judgment-rate/',
    patterns: [/Connecticut Post-Judgment Interest Rate \d{4}: up to 10%/, /does not set one automatic percentage/],
  },
  {
    pathname: '/rates/maryland-judgment-rate/',
    patterns: [/Maryland Post-Judgment Interest Rate \d{4}/, /residential-rent judgments/, /§11-106/],
  },
  {
    pathname: '/rates/wisconsin-judgment-rate/',
    patterns: [/Wisconsin Post-Judgment Interest Rate \d{4}/, /Wis\. Stat\. § 815\.05\(8\)/],
  },
  {
    pathname: '/states/oklahoma/',
    patterns: [/Oklahoma Judgment Interest Rates \d{4}/, /12 O\.S\. § 727\.1/],
  },
  {
    pathname: '/states/',
    patterns: [/\d{4} Judgment Interest Rates by State \(50-State Table\)/],
  },
  {
    pathname: '/prejudgment/',
    patterns: [/\d{4} Prejudgment Interest Rates by State \(50-State Table\)/, /Discretionary cap/],
  },
  {
    pathname: '/calculators/irs-interest/',
    patterns: [
      /IRS Interest &amp; Refund Calculator \d{4}/,
      /Calculating interest on an IRS refund/,
      /Frequently asked questions/,
    ],
  },
  {
    pathname: '/calculators/irs-penalty-and-interest/',
    patterns: [
      /IRS Penalty &amp; Interest Calculator \d{4} \(Form 1040\)/,
      /Failure-to-file penalty calculation/,
      /Automatic Exemption from Penalty/,
      /estimate, not an IRS payoff/,
      /failure-to-pay penalty interest/i,
    ],
  },
];
for (const guard of demandGuards) {
  const htmlPath = join(DIST, guard.pathname.replace(/^\//, ''), 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  for (const pattern of guard.patterns) {
    if (!pattern.test(html)) errors.push(`${guard.pathname}: missing search-demand contract ${pattern}`);
  }
}

const floridaCalculatorPath = join(DIST, 'calculators', 'florida-judgment-interest', 'index.html');
if (existsSync(floridaCalculatorPath)) {
  const html = readFileSync(floridaCalculatorPath, 'utf8');
  const calculatorIndex = html.indexOf('data-florida-calculator');
  const firstAdIndex = html.indexOf('data-ad-slot=');
  if (calculatorIndex < 0 || firstAdIndex < 0 || calculatorIndex > firstAdIndex) {
    errors.push('/calculators/florida-judgment-interest/: calculator must render before the first advertisement');
  }
  if (html.includes('1990-01-01')) {
    errors.push('/calculators/florida-judgment-interest/: synthetic 1990 history anchor is forbidden');
  }
}

if (errors.length) {
  console.error(`Build verification failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Build verification OK: ${htmlFiles.length} HTML pages, unique search snippets and technical SEO valid, every sitemap page homepage-reachable, content-depth floors met, internal targets intact, calculator indexing gates intact.`);
