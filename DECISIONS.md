# DECISIONS.md — Judgment log

One line per judgment call made during the autonomous build, with rationale. Newest at the bottom.

- **Stack = Node.js (not Python)** for all pipeline/fetchers. Rationale: owner's stated preferred
  stack; a single runtime for pipeline + site + MCP server reduces moving parts.
- **SQLite via `better-sqlite3` (local install), CLI `sqlite3` as fallback.** Rationale: brief mandates
  SQLite as source of truth; `better-sqlite3` is synchronous, dependency-light, and installs locally.
- **Git init but no remote, ever.** Rationale: Section 0.1 hard rule.
- **Built the niche-agnostic engine core (politeness layer, SQLite schema, exporter, static-API
  generator, MCP server, OpenAPI) during Phase 1** while the research workflow ran, since that shape
  fits every finalist. Rationale: parallelize; no rework risk (the schema is generic observations).
- **Research run as a 3-phase multi-agent workflow** (generate → incumbent-scan → deep-audit), 23
  agents. Rationale: incumbent-scanning is embarrassingly parallel; ultracode is on.
- **Winner = Statutory/Judgment/Tax Interest Rates; runner-up = Passport Fees.** Rationale: genuine
  37–37 rubric tie, broken toward interest rates on *verified* tonight-buildability (both anchor
  sources fetch+parse through our pipeline), sharpest volatility moat, and lowest maintenance. Full
  reasoning in [research/NICHE_DECISION.md].
- **Anchor the seed on PUBLISHED IRS values (high confidence); mark the derived US federal
  post-judgment rate `confidence=medium` with the 28 U.S.C. §1961 formula cited.** Rationale: keep a
  legal-money niche honest and safe for hands-off operation; no un-provenanced or computed value is
  presented as authoritative without its formula + source.
- **Do NOT scrape the bot-hostile state/court hosts (403/503).** Rationale: a 403 WAF is not a robots
  disallow, but spoofing a browser UA to defeat anti-bot measures is against the spirit of Section 0.3;
  use only the clean official feeds (IRS, Fed H.15) and document the rest as expansion.
- **Model entities as "rate series" (one page each), not one page per country.** Rationale: gives
  focused, indexable SEO pages ("IRS underpayment interest rate — current + history") vs one thin
  giant US page.
- **Git-track the JSON exports (`data/exports/`); gitignore the binary `data/db.sqlite`.** Rationale:
  the DB is a regenerable runtime artifact; the versioned JSON is the diff-friendly snapshot the brief
  asks for, and what the site/API/CI build from.
- **Publish the post-judgment series AND the identical CMT series under two entity names.** Rationale:
  they are distinct legal concepts with distinct search intent; uscourts.gov publishes only the
  formula, so presenting the computed answer IS the product. Disclosed transparently (medium
  confidence + formula + caveat) so it is not hidden record-padding.

### Post-review improvement pass (owner-requested "improve + advance")
- **Expanded coverage to UK + EU** (BoE Bank Rate + UK late-payment; ECB MRO + EU Directive reference).
  Rationale: cross-jurisdiction coverage IS the moat; both sources verified fetchable + robots-permitting
  through our pipeline. Now 12 series, 3 jurisdictions, 4 sources, 536 records.
- **Modeled UK & EU statutory rates as SEMI-ANNUAL, not "live base + 8".** Rationale: correctness —
  the UK Act fixes the rate on 31 Dec / 30 Jun reference dates, and the EU Directive uses the ECB rate
  on 1 Jan / 1 Jul. Getting this right is exactly the domain rigor generic aggregators lack; unit-tested.
- **Made validation cadence-aware** so pure policy change-point series (BoE/ECB) aren't wrongly failed
  for an "old" latest value (a held rate is not stale data).
- **Site polish:** featured current-rates strip, jurisdiction grouping + chips, SVG favicon, web
  manifest. Rationale: premium-aesthetic directive; all self-contained (no external requests).
