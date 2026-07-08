# DECISIONS.md — Judgment log

One line per judgment call made during the autonomous build, with rationale. Newest at the bottom.

- **Stack = Node.js (not Python)** for all pipeline/fetchers. Rationale: owner's stated preferred
  stack; a single runtime for pipeline + site + MCP server reduces moving parts.
- **SQLite via `better-sqlite3` (local install), CLI `sqlite3` as fallback.** Rationale: brief mandates
  SQLite as source of truth; `better-sqlite3` is synchronous, dependency-light, and installs locally.
- **Git init but no remote, ever.** Rationale: Section 0.1 hard rule.
