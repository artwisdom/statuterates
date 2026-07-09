#!/usr/bin/env node
// Post-build base-path rewrite for GitHub Pages PROJECT sites (served at /<repo>/...).
//
// The site authors all internal links as root-absolute ("/rates/…") so it works perfectly at a
// domain root (custom domain / Cloudflare Pages / a user site). GitHub Pages project sites, however,
// serve under a subpath. This script rewrites the built output to that subpath. It is a NO-OP unless
// BASE_PATH is set to something other than "/", so local/root builds are never touched.
//
//   BASE_PATH=/statuterates SITE_URL=https://<user>.github.io node scripts/fix-base.mjs
//
// It rewrites, in dist/**/*.html and the generated .txt/.xml files:
//   - root-relative attribute values   href="/x" / src="/x"      -> href="/<base>/x"
//   - full-origin URLs (canonical, JSON-LD, sitemap, og:url)     -> origin + /<base> + path
//   - the web manifest's absolute paths (start_url, icon src)
// It does NOT touch the JSON API files (their links are relative or external) or external URLs.

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');

const rawBase = process.env.BASE_PATH || '/';
const BASE = rawBase === '/' ? '' : '/' + rawBase.replace(/^\/+|\/+$/g, '');
if (!BASE) {
  console.log('fix-base: BASE_PATH is "/" (root) — nothing to do.');
  process.exit(0);
}
const origin = (process.env.SITE_URL || '').replace(/\/$/, '').replace(/(\.github\.io).*/, '$1'); // origin only

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (name === 'api') continue; // skip the JSON API (relative/external links only)
      walk(p, out);
    } else out.push(p);
  }
  return out;
}

function rewriteHtml(s) {
  // 1) root-relative href/src (not protocol-relative //, not already-based)
  s = s.replace(/(\s(?:href|src)=")\/(?!\/)/g, (m, pre, off, str) => {
    // avoid double-prefixing if it already starts with the base
    const after = str.slice(off + pre.length);
    if (after.startsWith(BASE + '/') || after === BASE + '"') return m;
    return `${pre}${BASE}/`;
  });
  // 2) full-origin absolute URLs (canonical, og:url, JSON-LD contentUrl/url/item)
  if (origin) {
    const re = new RegExp(escapeRe(origin) + '/(?!' + escapeRe(BASE.slice(1)) + '/)', 'g');
    s = s.replace(re, origin + BASE + '/');
  }
  return s;
}

function rewriteText(s) {
  // sitemap.xml / robots.txt / llms*.txt / changes.xml carry full-origin URLs
  if (!origin) return s;
  const re = new RegExp(escapeRe(origin) + '/(?!' + escapeRe(BASE.slice(1)) + '/)', 'g');
  return s.replace(re, origin + BASE + '/');
}

function rewriteManifest(s) {
  // JSON string values that are absolute paths
  return s.replace(/("(?:start_url|src)"\s*:\s*")\/(?!\/)/g, `$1${BASE}/`);
}

function escapeRe(x) {
  return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let changed = 0;
for (const file of walk(DIST)) {
  let s;
  try {
    s = readFileSync(file, 'utf8');
  } catch {
    continue; // binary (favicon etc.)
  }
  let out = s;
  if (file.endsWith('.html')) out = rewriteHtml(s);
  else if (/\.(xml|txt)$/.test(file)) out = rewriteText(s);
  else if (file.endsWith('.webmanifest')) out = rewriteManifest(s);
  else continue;
  if (out !== s) {
    writeFileSync(file, out);
    changed++;
  }
}
console.log(`fix-base: applied base "${BASE}" (origin ${origin || '—'}) to ${changed} file(s).`);
