#!/usr/bin/env bash
# One-command local bootstrap: install dependencies and Chromium, run the pipeline, build the API +
# site, exercise browser release journeys, and verify the MCP server. Safe to re-run. Requires Node
# 24+ and uses only project dependencies plus Playwright's local browser cache.
#
#   ./setup.sh
#
set -euo pipefail
cd "$(dirname "$0")"

node -e 'const [major] = process.versions.node.split(".").map(Number); if (major < 24) { console.error("Node 24 or newer is required. Current: " + process.versions.node); process.exit(1); }'

echo "==> 1/7  Installing locked dependencies and the pinned browser (local only)"
( cd pipeline && npm ci --no-audit --no-fund )
( cd machine/mcp-server && npm ci --no-audit --no-fund )
( cd site && npm ci --no-audit --no-fund && npx playwright install chromium )

echo "==> 2/7  Running unit, data-contract, and source-review tests"
( cd pipeline && npm test )
( cd shared && node --test )
( cd site && npm test )
node --test machine/*.test.mjs
node machine/source-review-registry.mjs >/dev/null

echo "==> 3/7  Running the data pipeline (fetch -> validate -> export)"
( cd pipeline && node run.mjs all )

echo "==> 4/7  Building the static JSON API"
node machine/build-api.mjs
node machine/check-api-conformance.mjs

echo "==> 5/7  Building and verifying the site"
(
  cd site
  npm run build
  npm run verify-build
)

echo "==> 6/7  Running real-browser release journeys"
( cd site && npm run test:browser )

echo "==> 7/7  Verifying the MCP server"
( cd machine/mcp-server && npm test )

echo ""
echo "Done. Next:"
echo "  - Preview the site:  (cd site && npm run preview)"
echo "  - Deploy for real:   see docs/DEPLOYMENT_GUIDE.md (push to GitHub + enable Pages)"
