#!/usr/bin/env bash
# One-command local bootstrap: install deps, run the pipeline, build the API + site, verify the MCP
# server. Safe to re-run. Requires Node 20+ (no global installs; everything stays local).
#
#   ./setup.sh
#
set -euo pipefail
cd "$(dirname "$0")"

echo "==> 1/5  Installing dependencies (local only)"
( cd pipeline && npm install --no-audit --no-fund )
( cd machine/mcp-server && npm install --no-audit --no-fund )
( cd site && npm install --no-audit --no-fund )

echo "==> 2/5  Running the data pipeline (fetch -> validate -> export)"
( cd pipeline && node run.mjs all )

echo "==> 3/5  Building the static JSON API"
node machine/build-api.mjs
node machine/check-api-conformance.mjs

echo "==> 4/5  Building the site"
( cd site && npm run build )

echo "==> 5/5  Verifying the MCP server"
( cd machine/mcp-server && node test/smoke.mjs )

echo ""
echo "Done. Next:"
echo "  - Preview the site:  (cd site && npm run preview)"
echo "  - Deploy for real:   see docs/DEPLOYMENT_GUIDE.md (push to GitHub + enable Pages)"
