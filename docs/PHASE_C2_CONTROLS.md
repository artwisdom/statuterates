# Phase C2 API-contract and release-recovery controls

**Prepared:** 2026-09-08; **published and verified:** 2026-09-13

**Release state:** production commit `2aff7c761ac8a30b2bec8d63eff2b5a573d8f223`. Hosted
[CI run 34800485190](https://github.com/artwisdom/statuterates/actions/runs/34800485190),
[deployment run 34800467151](https://github.com/artwisdom/statuterates/actions/runs/34800467151),
and the independent public-edge check passed. The hosted
[validate-only recovery run 34800640692](https://github.com/artwisdom/statuterates/actions/runs/34800640692)
validated the retained release without restoring production.

## Why this phase is the next move

Phase C1 closed the largest known browser and manual-source-review gaps. Current private search
reporting has not selected a sufficiently stable page/query winner for another content expansion, so
broadly adding URLs now would be speculative. Phase C2 instead strengthens the unattended system
that protects every existing page, API consumer, crawler surface, and future release.

This phase does not change rate values, calculation rules, indexable content, AdSense wiring, URL
inventory, or crawler policy.

## Executable API and OpenAPI contract

The OpenAPI 3.1 document is now an executable release contract instead of a mostly descriptive file.
The machine test package uses pinned YAML, JSON Schema, and format-validation dependencies to compile
endpoint-specific response schemas and validate:

- every aggregate JSON endpoint;
- all 114 per-entity JSON endpoints;
- every matching CSV endpoint, including its exact header, row order, values, and valid quoting;
- endpoint counts, filenames, entity slugs, metric keys, source references, and shared release dates;
- current versus future-effective selection, latest-published semantics, historical-lookup coverage,
  and the federal seven-day source-week/application-week relationship; and
- agreement between the generated response inventory and the routes declared in OpenAPI.

The recurring and post-deployment public checks additionally require the expected JSON/CSV media
types and `Access-Control-Allow-Origin: *`, preventing correct files from silently becoming unusable
to browser-based API consumers after an edge-header change.

Focused mutation tests deliberately damage representative schemas, JSON relationships, and CSV
rows and require the validator to reject them. This proves the gate catches meaningful drift rather
than merely passing today's artifact.

## Exact release identity and deployment safety

Every build now records a structured immutable marker:

```text
statuterates:<full-source-sha>:<workflow-run-id>-<attempt>
```

The deploy workflow checks out `main`, records its exact full commit SHA, builds and tests that
revision, and carries the same marker through the static artifact and public-edge verification. It
rejects an unexpected production URL or base path. Deployments are serialized instead of cancelling
an artifact upload or public verification in progress, and explicit time limits prevent abandoned
runners.

The Pages artifact is retained for 30 days. Before normal publication, the deploy job downloads that
exact uploaded tar and applies the same safe archive and identity validator used by recovery. This
prevents a release that deploys successfully but turns out to be unrecoverable during an incident.
Deployment failures maintain one deduplicated GitHub issue and close it only after a later build,
publication, and public-edge check all pass.

## Manual recovery, never automatic rollback

`.github/workflows/recover.yml` defaults to validation only. It accepts a full source SHA and the
successful `deploy-site` run that produced a retained artifact. Before trusting the archive it
requires:

- a completed, successful `deploy-site` receipt on `main`;
- a selected source commit that is still in `main` history;
- a retained `github-pages` artifact from that exact run;
- a regular, bounded tar archive with safe paths, supported entry types, valid header checksums, no
  duplicate entries, and every required public contract file; and
- an internal structured marker matching the selected commit, run ID, and run attempt.

The validator does not extract or execute the old artifact. A real restoration requires selecting
`restore-production` and entering the exact phrase `RESTORE STATUTERATES PRODUCTION`. Normal releases
and recovery share one concurrency lock, and a restored artifact must pass the full public-edge check.

Artifacts published before Phase C2 use the older run-only marker and intentionally fail this stricter
identity check. The first recoverable known-good point is deployment run `34800467151` on `2aff7c7`;
this boundary is safer than pretending a legacy artifact has commit-level identity.

Automatic rollback is intentionally excluded. A temporary CDN, DNS, Cloudflare, or checker failure
must not silently replace newer legal data with an older snapshot.

## Independent monitoring boundary

The existing six-hour production health workflow and Wednesday refresh can send non-blocking HTTPS
heartbeats through these repository secrets when an independent monitor is approved:

- `UPTIMEROBOT_PRODUCTION_HEALTH_HEARTBEAT_URL`
- `UPTIMEROBOT_REFRESH_HEARTBEAT_URL`

Both integrations run in separate permissionless jobs that check out and execute no repository code.
They safely do nothing while their secret is absent, never print the private URL, and cannot
invalidate an otherwise correct site or data refresh merely because the external monitoring provider
is unavailable. Activating a third-party account, email confirmation, monitors, and GitHub secrets
remains a separate owner/provider gate.

## Dependency security checkpoint

A fresh release-time advisory query found newly disclosed issues in the prior Astro build tree and a
transitive Hono version used by the read-only MCP package. The release upgrades Astro to 7.3.2,
pins SVGO 4.1.0 and the resolved js-yaml 4.3.2, and overrides Hono to 4.13.7 without moving the MCP
SDK. Clean installs, all tests, the static build, and the browser journeys pass, and all four npm
trees currently report zero known vulnerabilities.

Astro 7.2 and later can automatically detach its preview server when it detects an AI coding agent.
The Playwright configuration explicitly disables that mode so the release suite owns the foreground
server, detects an early exit, and tears it down after the run.

## Evidence boundary and next gate

- Local tests can prove deterministic repository behavior; they cannot prove a hosted workflow,
  retained artifact, restored production release, or outside heartbeat.
- A validate-only recovery rehearsal can prove the selected hosted artifact is recoverable without
  changing production. A real restore should be reserved for an actual incident or an explicitly
  approved drill.
- GitHub's dependency graph, Dependabot alerts, and security-update pull requests were enabled on
  September 13. Grouped security updates and automatic merging remain off. The current open
  dependency pull requests remain unmerged until reviewed separately.
- Search rankings, AI citations, AdSense approval, monetized pageviews, RPM, and revenue remain
  external outcomes and are not implied by this release.

## Local verification

From the repository root:

```bash
cd machine && npm ci && npm test
cd .. && node machine/build-api.mjs && node machine/check-api-conformance.mjs
cd pipeline && npm test && node run.mjs build
cd ../shared && node --test
cd ../site && npm test
SITE_URL=https://statuterates.com \
  DEPLOY_MARKER=statuterates:0123456789abcdef0123456789abcdef01234567:1-1 \
  npm run build
npm run verify-build && npm run test:browser
cd ../machine/mcp-server && npm test
```

See `docs/RECOVERY_RUNBOOK.md` before using the hosted recovery workflow.
