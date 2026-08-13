# Deployment and operations guide

StatuteRates is already live at https://statuterates.com and the repository is already connected to
https://github.com/artwisdom/statuterates. Do not repeat the old create-repository/initial Pages steps
from historical reports.

## 1. Local verification

Use Node 24 or newer. The repository includes `.node-version` files.

```bash
./setup.sh
```

`setup.sh` installs exact lockfile dependencies, runs all tests, refreshes remote sources, builds the
static API and website, checks API conformance, verifies links/indexing gates, and exercises the MCP
server. A network-free code/build sequence is listed in the root `README.md`.

## 2. GitHub Actions configuration

Repository variables used by `.github/workflows/deploy.yml`:

| Variable | Required | Value/purpose |
|---|---:|---|
| `SITE_URL` | Yes for production | `https://statuterates.com` |
| `BASE_PATH` | Recommended | `/` for the custom root domain |
| `ADSENSE_CLIENT` | Only after approval | `ca-pub-...` client identifier |
| `ADSENSE_SLOT` | Optional after approval | Responsive display-unit slot |

The refresh workflow runs weekly on Tuesday at 02:00 UTC (Monday evening in U.S. Eastern time),
after the official weekly Federal Reserve publication. It tests the pipeline, hydrates a fresh
SQLite database from committed JSON history, fetches permitted sources, validates, and commits exports
only when they changed.

The deploy workflow installs and tests the pipeline, validates a fresh database hydrated from the
committed exports, tests the site data contract and shared engine, rebuilds the static API, builds
Astro, checks all internal targets and calculator indexing gates, validates the API contract, and
then publishes to GitHub Pages. After publication it waits for the custom domain, verifies the key
release markers and public support files, and checks every sitemap URL before notifying search engines.
It runs for reviewed `main` changes and after every successful refresh through
`workflow_run`. The latter is required because GitHub intentionally prevents a push made with the
workflow's `GITHUB_TOKEN` from triggering another push workflow. A successful no-change refresh still
runs the inexpensive deployment verification so production cannot silently drift from `main`.

## 3. Manual production deploy

For an intentional release, push reviewed changes to `main` or run `deploy-site` from the repository's
Actions tab. Before pushing, run:

```bash
cd pipeline && npm test
cd ../site && npm test
cd .. && node machine/build-api.mjs
cd site && SITE_URL=https://statuterates.com npm run build && npm run verify-build
cd .. && node machine/check-api-conformance.mjs
cd machine/mcp-server && npm test
```

Never change `STATE_CALCULATOR_RENDERER_READY` or set `ENABLE_STATE_CALCULATORS=true` in production.
Those legacy switches remain disabled so the generic prototype cannot mass-publish states. A
dedicated state calculator requires a reviewed registry entry, matching renderer ID, structured
ready metadata, tests, and its own page; Florida is currently the only approved entry.

## 4. Cloudflare edge checks

The current origin is static GitHub Pages behind Cloudflare. GitHub Pages does not apply a
Cloudflare Pages `_headers` file, so response security headers must be configured at Cloudflare (or
at a future origin that supports them).

The initial live check on 2026-07-19 found that plain HTTP still returned `200 OK` and the security
headers below were absent. The same-day follow-up verified that Cloudflare
[Always Use HTTPS](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/)
now returns a permanent `301` redirect and that the edge controls below are active.

Use a Cloudflare
[Response Header Transform Rule](https://developers.cloudflare.com/rules/transform/response-header-modification/)
for:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()`

Manage `Strict-Transport-Security` through Cloudflare's
[Edge Certificates HSTS setting](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/).
Enable it only after confirming HTTPS is stable; use `includeSubDomains` only when every subdomain
supports HTTPS, and do not add `preload` casually.

Current production HSTS configuration, verified on the homepage and API:

- `Strict-Transport-Security: max-age=15552000` (six months)
- `includeSubDomains`: off
- preload: off

Cloudflare Web Analytics is managed at the edge for `statuterates.com`:

- Real User Measurements: enabled with automatic JavaScript injection
- EU visitor collection: excluded
- Repository token/manual beacon: intentionally absent to prevent duplicate counting

The site build fails if a manual Cloudflare beacon appears in generated HTML. Manage this setting in
Cloudflare's account-level **Web Analytics → statuterates.com → Manage site** screen rather than
through a GitHub repository variable.

A strict Content Security Policy needs separate testing because the site can optionally load AdSense
and Cloudflare Analytics and currently includes inline JSON-LD/styles. Do not deploy an untested CSP
that breaks ads, analytics, or calculator scripts.

After any edge change, verify headers on the homepage and an API JSON endpoint, then smoke-test a
calculator in a private browser window.

## 5. Search indexing

- Submit `https://statuterates.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- Inspect the sitemap after releases; only registry-approved dedicated state calculators may appear.
- Use URL Inspection only for important newly published pages. Avoid artificial date churn.
- IndexNow is non-fatal and currently submits sitemap URLs after production deployments. Google does
  not use IndexNow, so Search Console remains necessary.

## 6. Advertising activation

No ad script ships while `ADSENSE_CLIENT` is empty. After approval:

1. Configure Google's certified consent flow for the EEA, U.K., and Switzerland.
2. Set `ADSENSE_CLIENT` and optionally `ADSENSE_SLOT` as repository variables.
3. Redeploy and verify `/ads.txt`, the privacy page, consent behavior, and mobile layout.
4. Remove the variables to disable ads without a code change.

Do not pay for premium hosting, databases, or SEO tooling at this stage. The static Cloudflare/GitHub
architecture is sufficient until traffic demonstrates a real bottleneck.

## 7. Failure recovery

Use `docs/MAINTENANCE_RUNBOOK.md`. A failed validation or build must leave the last good production
artifact intact. Never bypass validation to force a refresh through.
