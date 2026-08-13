#!/usr/bin/env bash
# One-command local bootstrap: install deps, run the pipeline, build the API + site, verify the MCP
# server. Safe to re-run. Requires Node 24+ (no global installs; everything stays local).
#
#   ./setup.sh
#
set -euo pipefail
cd "$(dirname "$0")"

node -e 'const [major] = process.versions.node.split(".").map(Number); if (major < 24) { console.error("Node 24 or newer is required. Current: " + process.versions.node); process.exit(1); }'

echo "==> 1/6  Installing locked dependencies (local only)"
( cd pipeline && npm ci --no-audit --no-fund )
( cd machine/mcp-server && npm ci --no-audit --no-fund )
( cd site && npm ci --no-audit --no-fund )

echo "==> 2/6  Running unit and data-contract tests"
( cd pipeline && npm test )
( cd shared && node --test )
( cd site && npm test )

echo "==> 3/6  Running the data pipeline (fetch -> validate -> export)"
( cd pipeline && node run.mjs all )

echo "==> 4/6  Building the static JSON API"
node machine/build-api.mjs
node machine/check-api-conformance.mjs

echo "==> 5/6  Building and verifying the site"
(
  cd site
  npm run build
  npm run verify-build
)

echo "==> 6/6  Verifying the MCP server"
( cd machine/mcp-server && npm test )

echo ""
echo "Done. Next:"
echo "  - Preview the site:  (cd site && npm run preview)"
echo "  - Deploy for real:   see docs/DEPLOYMENT_GUIDE.md (push to GitHub + enable Pages)"
