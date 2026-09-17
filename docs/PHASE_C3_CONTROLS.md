# Phase C3 authority, source-review, and fetch-safety controls

**Prepared and locally verified:** 2026-09-16

**Release state:** local candidate only. Nothing in this document is a hosted-CI, deployment, public-edge,
Search Console, AdSense, citation, traffic, or revenue receipt. Production remains identified by the public
[`deploy-marker.txt`](https://statuterates.com/deploy-marker.txt) until this candidate is explicitly approved,
published, and independently reverified.

## Why this phase is the next move

The site's technical search foundation is already strong, while current private search evidence has not selected
a new page expansion. Phase C3 therefore strengthens existing pages and unattended controls without changing a
rate, calculation rule, indexable URL, crawler policy, or advertising decision.

## Exact human and AI content parity

`llms-full.txt` now includes the same applicability, accrual, compounding, and optional rate-formula text visibly
rendered on every prejudgment page. The build verifier reconstructs both surfaces from the shared copy source and
fails if any of the 51 prejudgment sections is missing or differs. This is machine-readable parity, not hidden
crawler-only content and not a promise that an AI system will cite the site.

Every rate page also links to the existing recorded-changes index. This makes the freshness hub easier for people
and crawlers to reach without creating thin per-change pages.

## Safer official-source fetching

The shared refresh client rejects URL credentials and explicit loopback, link-local, private, carrier-grade NAT,
reserved, documentation, multicast, and IPv4-mapped/translated address literals. It applies the same check to
redirect destinations before the target request. Focused tests prove unsafe direct targets cause no network I/O
and a public source cannot redirect the runner to a literal cloud-instance metadata address.

This is a bounded literal-target control. It does not claim to solve every DNS-rebinding or upstream-network risk;
source hostnames remain code-reviewed and the existing robots, redirect, byte, retry, and deadline controls remain
in force.

## Actionable quarterly source review

The read-only source-review job now groups due records by exact official URL while preserving every source ID,
owner, risk, prior review date, and deadline. It maps each group to its affected exports, series-current value,
latest observation contributed by the listed source IDs, and matching history count. It performs no fetch and
never advances `last_reviewed` or `next_due`.

The September 23 rehearsal identifies 59 source IDs across 52 official URL groups. All 52 groups fit in the
bounded 27,346-byte packet. This is a rehearsal only; the first natural hosted warning-window lifecycle still
requires the scheduled workflow to create or update its durable issue.

## Private citable-package candidate

`npm --prefix machine run build:private-candidate` creates an ignored local evaluation artifact under `tmp/` only
when the explicit candidate flag is present and the committed export inputs are clean. It contains a manifest,
input and payload checksums, data dictionary, source-attribution/rights matrix, citation metadata, exclusions,
and observation JSONL/CSV.

The rights classifier exactly matches all recorded source-license statements and fails closed on unknown text.
An observation is also withheld whenever its citation moves to a different origin than the source record, so
source-level terms cannot silently stand in for an unreviewed secondary lineage. The current candidate evaluates
5,555 observations, includes 5,322, and excludes 233: Tennessee's site-terms records plus every cross-origin
lineage pending review. The output repeatedly builds byte-identically, compares its data inputs directly with
`HEAD`, and neutralizes formula-capable string prefixes in CSV while preserving exact values in JSONL.

This package is deliberately marked private, not legally cleared, not approved, and not publishable. The recorded
rights statements are provenance metadata rather than legal opinions. Public or commercial distribution remains
a separate source-rights, product-license, and owner-approval gate.

## Repository truth and dependency coverage

- Weekly Dependabot maintenance now covers the root `machine` lockfile as well as pipeline, site, and MCP locks.
- Tests require every committed npm lockfile to have exactly one bounded weekly maintenance entry; no automatic
  merge is configured.
- Deployment now validates documentation against the generated artifact before uploading the Pages artifact.
- `STATE.md` and the scorecard treat old release identities as dated receipts and identify the generated metadata
  plus the public deploy marker as the live authorities.

## Local verification receipt

- Pipeline: 168 tests passed.
- Machine controls: 62 tests passed.
- Site: 36 tests passed; 195 pages built; 194 sitemap URLs verified.
- Browser release journeys: 7 passed in Chromium.
- MCP: 7 tests passed, including the smoke journey.
- API conformance: 114 JSON/CSV entity pairs and 5,555 observations passed.
- All four npm trees: zero known advisories in the local offline audit cache.
- Private package: 5 tests passed and every generated payload checksum verified.

These local results authorize neither a push nor a deployment. A production claim requires passing hosted CI,
exact public deployment identity, and the independent public-edge contract for the published commit.
