# Phase 7 — AI discovery and machine-interface safety

Date: 2026-08-02

## Decision

StatuteRates already exposes the signals that both conventional and AI-assisted search need:
indexable server-rendered pages, visible answer-first text, descriptive headings, official-source
citations, effective dates, internal links, structured data, a sitemap, and fast public access. This
phase strengthens those assets instead of manufacturing query-variant or AI-written pages.

That choice follows current primary guidance:

- [Google's generative-AI search guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
  says the normal Search fundamentals apply, no special AI schema is required, and `llms.txt` is not
  used by Google Search.
- [OpenAI's publisher guidance](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
  identifies `OAI-SearchBot` as the crawler controlling ChatGPT Search inclusion.
- [Anthropic's crawler guidance](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
  separates search, user-requested retrieval, and training crawlers.
- [Perplexity's crawler guidance](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) identifies
  its search-index and user-retrieval agents.
- [Bing AI Performance](https://blogs.bing.com/webmaster/February-2026/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview)
  provides citation, cited-page, and grounding-query reporting when available.

`llms.txt` remains as a low-cost compatibility and integration surface. It is not treated as a
ranking mechanism.

## Changes

1. One shared current-value selector now powers the website, generated API, and MCP interface. An
   agency's preannounced future period remains available as `latest_published`, history, and the
   explicit `/api/v1/upcoming.json` feed; it cannot be called current before its effective date.
2. The MCP calculator now enforces the same fail-closed state release registry as the website. The
   inherited California, New York, Massachusetts, and Iowa generic calculations were removed.
   Florida is the only state-specific MCP calculation and uses the audited §55.03 engine.
3. The OpenAPI 3.1 contract is branded, accurate, and public at `/openapi.yaml`. The API index,
   `/api/` documentation, `llms.txt`, and GitHub MCP guide link the machine surfaces together.
4. Indexable pages explicitly allow full text and image previews. Organization, WebSite, Dataset,
   author, creator, and publisher nodes now share persistent identifiers instead of appearing as
   unrelated name-only objects.
5. Build and public-edge gates verify robots access, LLM compatibility files, OpenAPI, current versus
   upcoming API semantics, every intentionally welcomed search, training, and user-requested
   retrieval agent, and every sitemap URL before IndexNow notification.

## Evidence baseline

The live Search Console performance snapshot inspected on 2026-08-02 covered only the new site's
short post-launch history. It established an early private baseline, not a mature trend. Exact
account-level metrics remain in the private reporting system and are intentionally not committed to
this public repository.

Public checks returned HTTP 200 and complete rendered content for requests using `OAI-SearchBot`,
`GPTBot`, `ChatGPT-User`, Googlebot, Bingbot, `ClaudeBot`, `Claude-SearchBot`, `Claude-User`,
`PerplexityBot`, and `Perplexity-User`. The post-deployment verifier now checks both `robots.txt` and
an indexable rendered page for every one of those agents, including crawler-specific `Disallow`,
Cloudflare challenge, and response-header indexing blocks. That rules out a simple user-agent block;
provider-verified IP or DNS logs remain the definitive evidence of real crawler traffic.

Cloudflare AI Crawl Control was reviewed on 2026-08-02. The zone's Search, Agent, and Training
policies are all explicitly set to **Allow**, the legacy AI-bot block and AI Labyrinth are off, and
the per-crawler Block switch is off for all ten agents above. Cloudflare's private live metrics also
showed successful classified traffic from every named agent during the preceding 24 hours. No
user-agent bypass or custom WAF exception was added: there is no custom blocking ruleset to bypass,
and trusting a spoofable name alone would weaken the site's security. The unrestricted wildcard
robots policy also covers other standards-compliant crawlers without needing a brittle allowlist.

Google Preferred Sources returned no result for `statuterates.com` on 2026-08-02, so no dead
preference button was added. Eligibility will be checked again during the first evidence review.

## Measurement gate

The first post-release review should wait for a finalized 28-day comparison period. It should review
Search Console, Bing Webmaster Tools AI Performance if enabled, and privacy-safe Cloudflare referrals
from ChatGPT, Perplexity, Claude, Bing/Copilot, and related UTM tags. New content or another calculator
should be released only when stable demand and complete source/rule evidence support it.

AI inclusion, citations, rankings, traffic, and advertising income cannot be guaranteed. This phase
improves eligibility, clarity, safety, and measurement without increasing monthly infrastructure cost.
