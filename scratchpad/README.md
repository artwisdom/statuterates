# Scratchpad artifacts

This directory intentionally retains research snapshots and one-time audit helpers that explain how
parts of the current dataset and editorial baseline were produced. Nothing here is imported by the
production pipeline, site, API, MCP server, or GitHub workflows.

## Contents

- `prejudgment-verified-2026-07-09.json`: dated research snapshot used to seed the first verified
  prejudgment reference pass.
- `audit-flagged-2026-07-11.json`: dated findings from the follow-up source and rule audit.
- `gen-prejudgment.mjs` and `apply-audit-fixes.mjs`: one-time migration helpers retained so the
  transformation from the dated research snapshots remains reviewable.
- `verify-workflow.mjs`, `site-audit.mjs`, and `guides-workflow.mjs`: historical audit/orchestration
  definitions retained as provenance for earlier research and content work.

These files are not current source-of-truth inputs. Current legal-rate facts live in the reviewed
pipeline fetchers and committed exports; current product status lives in `STATE.md`. Do not run an
old helper against the live source tree without first reviewing every assumption and path. New
production logic belongs in the tested pipeline, shared, site, or machine directories—not here.
