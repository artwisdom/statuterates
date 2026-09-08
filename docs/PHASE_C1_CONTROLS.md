# Phase C1 source-review and browser-safety controls

**Prepared:** 2026-09-07

**Release state:** implemented and verified locally. Production remains on the Phase A commit
`2243359` until the owner approves publication and the hosted workflows pass.

## Why this phase exists

StatuteRates already prevents an unsupported state calculator from shipping, but two quieter risks
remained: a manually maintained legal source could age without anybody noticing, and a calculator
could pass unit tests while its real browser form, copy/download action, mobile layout, or ad boundary
was broken. Phase C1 adds mechanical controls for both risks without adding pages, changing rates, or
introducing a paid service.

## Manual state-source review registry

`machine/source-review-registry.json` records the owner, risk, last genuine review date, 90-day
cadence, and next due date for all 102 active sources exported by `STATE_SOURCES` in
`pipeline/fetchers/us-states.mjs`.

`machine/source-review-registry.mjs` fails closed when:

- an active source is missing, duplicated, unknown, or no longer present in the committed exports;
- an unclassified export-only source appears;
- a source URL changes without an intentional review and registry fingerprint update;
- a source URL is not HTTPS;
- a date, cadence, owner, risk, or due-date calculation is malformed; or
- a claimed review date is not supported by the hand-recorded source provenance.

Five automated non-state sources and the retired legacy `mi-legislature` record are explicitly
classified as export-only exemptions. They cannot silently become active state sources.

The weekly refresh checks the registry in a read-only job. Fourteen days before a deadline, a
separate job with only GitHub issue permission creates or updates one labeled reminder. It reopens
that same reminder if necessary, closes duplicates, and closes the reminder after all registered
sources are current. A notification/API failure makes the weekly workflow visibly fail instead of
silently losing the alert; malformed registry data also fails the read-only check.

As of September 7, 2026, all 102 active sources are current. The first deadline is Massachusetts on
October 6. The 14-day warning window begins September 22, so the scheduled Wednesday, September 23
run should create the first review reminder after this release is published.

## Real-browser release gate

The Playwright suite runs seven deterministic Chromium journeys against the already-built static
artifact:

1. Tennessee historical lookup, its verified range boundary, citation copy, and CSV response.
2. Florida judgment-interest calculation, schedule, copy, and print action.
3. Federal post-judgment rate-week selection and calculation.
4. IRS quarterly interest calculation.
5. Form 1040 penalty components, warning, and print action.
6. Phone-width navigation and whole-document overflow protection.
7. Ad-eligible versus ad-free routes, including the configured client and slot boundary.

Every cross-origin browser request is blocked, so the suite cannot contact Google Ads or an official
legal source. CI uses fake public ad identifiers. The suite uses zero retries and retains a trace and
screenshot only on failure. Both pull-request verification and production deployment run it after
the build verifier; deployment cannot upload a Pages artifact until the browser gate passes.

The mobile journey found a real long-URL overflow on `/about/`. Official-source links now wrap on
small screens, and the browser test protects that repair.

## Evidence boundary and remaining limits

- Local tests prove the repository behavior, not the hosted runner or public site.
- This release uses Chromium only; it is a high-value release gate, not a complete browser matrix.
- The local server exercises the immutable static artifact. The existing post-deploy public-edge
  checker remains responsible for exact production identity, canonical URLs, headers, and crawler
  surfaces.
- GitHub issue creation, hosted CI duration, and deployment behavior remain unverified until the
  commit is published. No recurring-cost claim should be made before hosted usage is observed.

## Commands

From the repository root:

```bash
node --test machine/*.test.mjs
node machine/source-review-registry.mjs
(cd site && npm run test:browser:release)
```

For a real source review, follow the state-law procedure in `docs/MAINTENANCE_RUNBOOK.md`; never move
`last_reviewed` merely because an automated fetch or build completed.
