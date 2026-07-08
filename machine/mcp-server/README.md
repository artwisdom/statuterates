# StatuteRates MCP server

Exposes the StatuteRates dataset (U.S. statutory, judgment & tax interest rates) to AI agents over the
Model Context Protocol (stdio transport). It reads the exported JSON snapshots (`data/exports/`) — no
database process, no network, instant startup — so it has the same zero-infrastructure profile as the
static API.

## Tools
| Tool | Purpose |
|---|---|
| `dataset_info` | Dataset title, description, available metrics, freshness, and official sources. Call first. |
| `search_entities` | Fuzzy-find rate series by name/slug/jurisdiction; returns latest values. |
| `get_entity` | Full record for one series: latest value per metric + full history, each with provenance. |
| `get_latest_value` | Current value of a metric for one series, with `effective_date`/`source_url`/`confidence`. |
| `compare_values` | Compare one metric across several series, sorted high→low. |

Every value returned carries `value`, `unit`, `effective_date`, `source_url`, `retrieved_at`,
`confidence`. `confidence: "medium"` values are **derived** (the `notes` field states the formula).

## Install
```bash
cd machine/mcp-server
npm install
npm run smoke   # launches the server and runs asserted tool calls; prints "MCP SMOKE TEST PASSED"
```
Requires `data/exports/` to exist (run the pipeline first: `cd pipeline && node run.mjs all`).

## Register in Claude Desktop
Edit `claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`)
and add — replace `/ABS/PATH/TO` with the absolute path to this repo:
```json
{
  "mcpServers": {
    "statuterates": {
      "command": "node",
      "args": ["/ABS/PATH/TO/data-moat-engine/machine/mcp-server/src/server.mjs"]
    }
  }
}
```
Restart Claude Desktop. The tools appear under the 🔌 menu.

## Register in Claude Code
```bash
claude mcp add statuterates -- node /ABS/PATH/TO/data-moat-engine/machine/mcp-server/src/server.mjs
```

## Pointing at a different data snapshot
The server reads `../../../data/exports` by default. Override with an env var:
```bash
DATA_MOAT_EXPORTS=/path/to/exports node src/server.mjs
```

## Notes
- stdio transport uses stdout for the protocol; the server prints only a one-line readiness banner to **stderr**.
- The server is read-only. It never writes, never fetches the network, and exposes no personal data.
