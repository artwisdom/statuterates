# Evidence-gated roadmap toward 100

**Reviewed:** 2026-09-03

**Current production:** commit `ebce83f`

**Purpose:** make StatuteRates a durable, low-maintenance reference asset without confusing technical
readiness with search rankings, AdSense approval, or income.

No honest website can be permanently 100/100. Legal sources change, search demand moves, security
controls age, and advertising results are controlled partly by outside platforms. A score of 100
therefore means that the next relevant evidence gate is satisfied, not that future maintenance or
commercial risk has disappeared.

Scores use four evidence bands: 90–100 means the relevant behavior is measured and automated with
only small residual gaps; 75–89 means a strong working system with material unfinished safeguards;
50–74 means usable but externally unproven or meaningfully incomplete; below 50 means the required
outcome is largely unproven. Candidate points are conditional and do not count until hosted tests and
public-edge verification pass.

## Current scorecard

The first number is the verified production baseline. The second is the expected score only after
the September quality-and-security candidate is published and its hosted checks pass.

| Area | Production | Candidate | What still prevents 100 |
|---|---:|---:|---|
| Data and legal correctness | 91 | 94 | Most state-law references still require periodic human re-review |
| Historical coverage and data moat | 84 | 86 | Most state series still have one recorded observation |
| Core user utility | 86 | 88 | Only Florida has a fully released state-specific calculator |
| Content usefulness and editorial trust | 82 | 89 | Named editor credentials require owner-approved truthful identity; weak pages need demand-led research |
| Technical SEO | 90 | 96 | Search-engine processing and field data remain external |
| AI and machine discoverability | 96 | 97 | Citation by answer engines cannot be guaranteed by technical access |
| Internal linking and crawl paths | 95 | 96 | Future routes must preserve the current no-orphan contract |
| Performance and accessibility | 97 | 97 | No CrUX field sample yet; advertising remains the main third-party cost |
| Automation and refresh reliability | 92 | 95 | Hosted refresh after the candidate release is still required |
| Safe sandboxing and fail-closed behavior | 88 | 95 | The hardened source client is local until published and exercised by hosted automation |
| Tests and release safety | 86 | 92 | Browser-level calculator journeys and independent deployment identity can improve |
| Security and supply chain | 75 | 84 | GitHub dependency alerts, protected release rules, and private reporting remain provider-side gaps |
| Monitoring and recovery | 83 | 86 | Monitoring still shares GitHub as a platform dependency; rollback exercise is not recent |
| Maintainability | 77 | 82 | Several large data/content modules and manual freshness metadata remain costly to review |
| Organic growth evidence | 72 | 72 | The latest finalized comparison is promising but still early and rankings weakened while reach grew |
| Authority and earned distribution | 20 | 20 | No current evidence set proves relevant referring domains or independent citations |
| AdSense and monetization readiness | 70 | 78 | Review is pending; approval, serving, page RPM, and revenue are unverified |
| Passive-operation readiness | 85 | 91 | Provider alerts, periodic legal review, and external monitoring still require work |

Three roll-up scores keep unlike outcomes separate:

- **Controllable product and engineering readiness:** 87/100 production; 92/100 after the candidate
  passes hosted release checks.
- **Search-growth readiness:** 78/100 production; 82/100 after the candidate. Rankings, indexing, and
  backlinks must then be measured rather than inferred.
- **Income-system readiness:** 54/100 production; 60/100 after the candidate. This is readiness to
  monetize, not verified income. Progress toward the owner's $20,000/month goal is not scoreable
  until AdSense reports real monetized pageviews, page RPM, and earnings.

## Phase A — publish the focused quality-and-security candidate

Goal: remove known trust defects and make unattended collection safer without adding thin URLs.

1. Repair the seven source-backed legal-copy defects and fail the build if required prejudgment
   fields are empty or visibly truncated.
2. Remove hidden generated FAQ structured data from rate pages. On the two pages that legitimately
   use FAQ markup, render the exact same questions and answers for visitors.
3. Suppress duplicated rate-hero labels and add rendered-output regression checks.
4. Make ad eligibility depend on complete visible legal analysis rather than the prejudgment page
   type alone.
5. Retry and then fail closed on inaccessible robots policies; enforce one absolute deadline across
   response headers and bodies; re-check robots and throttling after every redirect; cap response
   bodies, redirects, and actual attempts; expire robots decisions.
6. Update the MCP production dependency lock to zero known advisories.
7. Add Tennessee's complete, official 2012–2026 judgment-rate history to the existing page and
   historical lookup only if the exact official rows and legal date semantics pass fixtures. Do not
   enable a Tennessee payoff calculator or invent future rows.

Exit gate: every local suite, API build, documentation check, static-site build, ad-enabled build,
and diff check passes; changes are separated into reviewable commits; nothing is live until the owner
approves publishing.

## Phase B — prove the release in production

Goal: turn a local candidate into a verifiable unattended release.

1. Publish only the approved commits and record the exact commit-to-deployment identity.
2. Run the hosted refresh on that exact revision. Treat an official-source outage or late
   publication as a safe stop, not permission to estimate or carry a stale value.
3. Verify the release marker, security headers, discovery files, ads.txt, APIs, crawler access, and
   all canonical sitemap URLs from the public edge.
4. Spot-check the corrected Alabama, California, Nevada, New York, North Carolina, Ohio, and Virginia
   pages plus Tennessee history. Confirm the numerical rates did not change except through a
   separately validated data refresh.
5. Leave the current AdSense review alone. As of September 3 it remains `Getting ready`, ownership is
   verified, consent messages are active, and the public ads.txt is correct even though AdSense's
   cached indicator still says not found.

Exit gate: hosted refresh, deployment, CodeQL, and six-hour production health are green for the exact
commit, and the public pages match the approved local artifact.

## Phase C — close the controllable 80-to-95 gaps

Goal: make future work safer and more evidence-driven before adding inventory.

1. Add a mechanical source-review registry with cadence, last-reviewed date, due date, owner, and a
   deduplicated overdue alert for every manually curated state source.
2. Add browser tests for the highest-risk user journeys: historical lookup, federal calculator,
   Florida calculator, Form 1040 calculator, copy/download actions, mobile navigation, and an
   ad-eligible versus ad-ineligible route.
3. Validate OpenAPI semantics against representative responses, not only endpoint presence.
4. Add an independent low-cost uptime check outside GitHub and document one rollback drill.
5. Enable supported GitHub vulnerability alerts/security updates and a protected release path only
   after confirming the refresh bot retains its narrow validated commit route. These are explicit
   owner/provider changes, not repository edits.
6. Split oversized content and fetcher modules by legal jurisdiction/source while preserving exact
   output snapshots.

Exit gate: source review cannot silently expire, critical browser journeys run in CI, external
monitoring has a receipt, and repository settings no longer leave known security controls disabled.

## Phase D — compound search authority without doorway pages

Goal: strengthen the URLs Google is already testing and create something genuinely worth citing.

1. Compare finalized, equal 28-day Search Console periods monthly. Promote only existing pages with
   demonstrated impressions/clicks and a specific primary-source content gap.
2. Deepen one winning state at a time with authoritative history, claim branches, worked examples,
   and a preselected historical lookup. Tennessee is first because the latest finalized report showed
   the largest page gain and its complete official history is available.
3. Audit source reuse rights, then publish one versioned aggregate data package with manifest,
   checksums, citation metadata, and clear terms. Keep raw machine files outside the HTML sitemap.
4. Offer that citable asset to a small relevant list of court-resource, law-library, legal-aid, and
   developer directories. No bought links, mass outreach, or fabricated endorsements.
5. Add a new indexable route or state calculator only when it has measured demand, unique utility,
   complete official sources, exact calculation rules, and a dedicated release contract.

Exit gate: the page-level evidence selected the work, every added claim is source-backed, the release
adds unique utility, and authority is measured by verified relevant citations/referring domains—not
submission counts.

## Phase E — optimize income from measured behavior

Goal: convert useful traffic into durable revenue without harming trust or search performance.

1. Wait for the pending AdSense decision. If rejected, repair only the documented issue and submit
   once after public verification. If approved, first record a clean baseline of monetized pageviews,
   page RPM, and revenue.
2. Segment calculators, guides, directories, and rate pages in AdSense reporting. Run one controlled
   placement/density experiment at a time, protecting calculator inputs, source tables, and Core Web
   Vitals.
3. Calculate revenue only as `monetized pageviews / 1,000 * measured page RPM`; never substitute
   Cloudflare unique visitors or Search Console clicks.
4. Improve retention through the existing RSS feeds and update workflows before adding an email list
   with consent, storage, and maintenance obligations.
5. Consider a higher-tier ad partner or paid API/SLA only after verified traffic or inbound use meets
   that provider's current requirements. Recheck terms and costs at decision time.

Exit gate: real provider reports demonstrate positive RPM and net revenue, experiments preserve user
experience, operating cost remains capped, and maintenance time is measured.

## Permanent rules

- Never guess a legal rate, missing date, historical row, claim branch, or source meaning.
- Never turn a headline percentage into a payoff calculator without the full legal/calculation model.
- Never publish hidden content, misleading structured data, fake authorship, or mass-generated doorway
  pages.
- Never treat build success as indexing, a submitted URL as a backlink, traffic as ad impressions, or
  monetization wiring as revenue.
- Never give untrusted source-fetching code write credentials or let a partial feed erase the last
  validated history.
- Never deploy from an unverified commit or broaden provider permissions without an explicit gate.

## Cadence

- Wednesday: automated source refresh, validation, deployment handoff, and public health.
- Every six hours: production contract monitor.
- Monthly: finalized Search Console comparison, Cloudflare traffic, AdSense status, relevant links,
  operating cost, and confirmed revenue.
- Quarterly: state-source review registry, calculator legal contracts, dependencies, provider
  security settings, and recovery evidence.
