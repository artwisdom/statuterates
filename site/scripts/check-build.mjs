#!/usr/bin/env node
// Post-build guardrails for internal links, calculator indexing, and prose damaged by missing
// whitespace around inline elements. Runs against static dist/ output and requires no dependencies.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const errors = [];
const canonicalOwners = new Map();
const expectedOrigin = new URL(process.env.SITE_URL || 'https://statuterates.com').origin;

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

const htmlFiles = walk(DIST).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');

  // Technical SEO invariants. These are deliberately structural, not arbitrary character-count
  // heuristics: a deploy should never create an untitled, non-canonical, or multi-H1 page.
  const titles = [...html.matchAll(/<title>[^<]+<\/title>/g)];
  const descriptions = [...html.matchAll(/<meta name="description" content="[^"]+">/g)];
  const canonicals = [...html.matchAll(/<link rel="canonical" href="(https:\/\/[^\"]+)">/g)];
  const h1s = [...html.matchAll(/<h1(?:\s|>)/g)];
  if (titles.length !== 1) errors.push(`${file}: expected one non-empty title, found ${titles.length}`);
  if (descriptions.length !== 1) errors.push(`${file}: expected one non-empty meta description, found ${descriptions.length}`);
  if (canonicals.length !== 1) errors.push(`${file}: expected one absolute HTTPS canonical, found ${canonicals.length}`);
  if (h1s.length !== 1) errors.push(`${file}: expected one H1, found ${h1s.length}`);
  if (!html.includes('<html lang="en">')) errors.push(`${file}: missing html lang="en"`);
  if (!html.includes('<meta name="viewport"')) errors.push(`${file}: missing viewport metadata`);
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

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (!target.startsWith('/') || target.startsWith('//')) continue;
    if (!localTargetExists(target)) errors.push(`${file}: broken internal target ${target}`);
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

const stateCalculatorFiles = htmlFiles.filter((file) => {
  const relative = file.slice(DIST.length).replaceAll('\\', '/');
  return /\/calculators\/(?!post-judgment-interest\/)[a-z-]+-judgment-interest\/index\.html$/.test(relative)
    && !relative.endsWith('/calculators/state-judgment-interest/index.html');
});
if (stateCalculatorFiles.length) {
  errors.push(`unsafe state calculator pages were generated: ${stateCalculatorFiles.join(', ')}`);
}

if (errors.length) {
  console.error(`Build verification failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Build verification OK: ${htmlFiles.length} HTML pages, technical SEO metadata and internal targets valid, calculator indexing gates intact.`);
