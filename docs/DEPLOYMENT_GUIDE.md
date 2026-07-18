# DEPLOYMENT_GUIDE.md

Everything the autonomous build could **not** do (Section 0 hard rules: no accounts, no deploys, no
spend, no credentials) is a numbered manual step below. Each is ≤ 5 minutes. Steps 1–4 get you live
for free; 5+ are growth/monetization, do them in order over the following weeks.

> Placeholders written into the repo for you to fill: `STATUTERATES_CONTACT` (env), `SITE_URL` (env or
> repo variable), and `<<OWNER_DOMAIN>>` in `machine/openapi.yaml`. There are **no API keys or secrets**
> anywhere — nothing to rotate.

## Prerequisite (2 min) — pick a name/brand
The working brand is **StatuteRates**. If you want a different name, do a find-and-replace of
`StatuteRates` in `pipeline/run.mjs` (the `DATASET_META` block) and re-run `cd pipeline && node run.mjs
export`; everything else reads from there.

## 1. Create the GitHub repo and push (5 min) — activates the automation
The Actions in `.github/workflows/` are INACTIVE until the repo lives on GitHub.
```bash
cd data-moat-engine
gh repo create statuterates --private --source=. --remote=origin   # or use github.com UI
git push -u origin main
```
Pushing turns on `refresh-data` (weekly) and makes `deploy-site` available.
*(The autonomous build was forbidden from adding a remote or pushing — this is the first owner action.)*

## 2. Enable GitHub Pages (2 min) — free hosting
Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**. Then run the deploy once:
Repo → **Actions → deploy-site → Run workflow**. Your site goes live at
`https://<your-username>.github.io/statuterates/`.

## 3. Set your site URL (2 min) — correct canonical/sitemap/API links
Repo → **Settings → Secrets and variables → Actions → Variables → New variable**:
`SITE_URL = https://<your-username>.github.io/statuterates` (or your custom domain from step 6).
Re-run `deploy-site`. Verify: visit `/`, `/rates/us-federal-post-judgment/`, `/robots.txt`,
`/sitemap.xml`, `/llms.txt`, `/api/v1/index.json`.

## 4. Confirm the data refreshes itself (2 min)
Repo → **Actions → refresh-data → Run workflow** (don't wait for Monday). It fetches, validates, and —
only if green — commits any changed values, which triggers `deploy-site`. From now on it runs weekly
with no input from you. If it ever goes red, the run summary tells you exactly which source broke; see
`docs/MAINTENANCE_RUNBOOK.md`.

## 5. Google Search Console + Bing Webmaster Tools (10 min) — how people FIND this
Nothing ranks until it's indexed; don't skip this.
1. Go to search.google.com/search-console → Add property → URL prefix → your site URL → verify via
   the HTML-tag method (paste the meta tag into `site/src/layouts/BaseLayout.astro` head, redeploy)
   or DNS if you did step 6.
2. Submit the sitemap: `https://<your-site>/sitemap.xml`.
3. Repeat at bing.com/webmasters (it can import from Search Console in two clicks). Bing also feeds
   DuckDuckGo and ChatGPT browsing.
4. Over the first weeks, watch Coverage → indexed pages; use "Request indexing" on the homepage,
   `/calculators/post-judgment-interest/`, and the state pages to prime the pump.

## 5b. Cloudflare Web Analytics + IndexNow (5 min) — measure traffic, speed up recrawls
- **Analytics (recommended):** Cloudflare dashboard → your site → **Analytics & Logs → Web Analytics** →
  enable → copy the **site token** → add repo variable `CF_ANALYTICS_TOKEN=<token>` (Settings → Secrets and
  variables → Actions → Variables) → re-run `deploy-site`. The cookieless beacon then ships site-wide. It
  needs no consent banner (no personal data, no cross-site tracking) and the `/privacy/` page already
  discloses it. Empty variable = no beacon ships.
- **IndexNow (already automated):** every deploy submits the sitemap URLs to IndexNow (see the "Ping
  IndexNow" step in `deploy.yml`), authenticated by the public key file
  `site/public/78e1a4c8dd592144913ffc2f8f1b9478.txt`. Nothing to configure. IndexNow only speeds up engines
  that use it — **Bing, Yandex, DuckDuckGo, ChatGPT search — not Google** — so still do the Bing Webmaster
  verification in step 5 (Bing is ~13% of US *desktop* search, and legal users skew desktop).

## 6. OPTIONAL — custom domain (~$10–12/yr) — recommended for SEO
A short root domain (e.g. `statuterates.com`) beats a `github.io` subpath for ranking, trust, and
future Cloudflare pay-per-crawl. **This is the only recommended spend and it is optional.**
1. Buy the domain (Cloudflare Registrar / Namecheap / Porkbun — at-cost, ~$10/yr).
2. Point it at Pages: Repo → Settings → Pages → Custom domain; add the DNS records it shows.
3. Update `SITE_URL` (step 3) to the new domain and re-run `deploy-site`.
*(The build was forbidden from purchasing or registering anything — hence manual.)*

## 7. Ad monetization — apply on the right timeline (5 min to apply)
Reserved, empty ad slots already exist on every page (`site/src/components/AdSlot.astro`). No ad code
ships until you activate it.
- **Now / early (any traffic):** apply to **Google AdSense** and/or **Ezoic** (Ezoic has no traffic
  minimum and pairs well with a reference site).
- **ONE-SWITCH ACTIVATION (AdSense):** once approved, just add a repo variable — Settings → Secrets and
  variables → Actions → Variables → New variable: `ADSENSE_CLIENT = ca-pub-XXXXXXXXXXXXXXXX` — then
  re-run `deploy-site`. That injects Google Auto Ads site-wide AND auto-generates the matching
  `/ads.txt` (both keyed off the same variable); zero code edits. Delete the variable to turn ads off.
  (Ezoic uses its own site-wide script — paste it into `BaseLayout.astro`'s head, guarded the same way.)
- **REQUIRED before you flip the switch (compliance — protects the account & is legally required):**
  1. **Privacy policy + Terms** — already shipped at `/privacy/` and `/terms/`, linked in the footer.
     They disclose Google's ad cookies and opt-outs, which AdSense reviews during approval. Nothing to do.
  2. **Consent management (EEA/UK/Switzerland).** Google requires a certified CMP to serve ads there.
     The zero-code path: in the AdSense dashboard go to **Privacy & messaging → GDPR** (and **CCPA** for
     California) and turn on Google's own consent messages — they serve automatically through the Auto
     Ads tag, no code needed. Do this in the same sitting as setting `ADSENSE_CLIENT`. **Do not serve ads
     without it.**
  3. **Verify** `/ads.txt` shows your `google.com, pub-…, DIRECT, f08c47fec0942fa0` line after deploy
     (it reads the same variable), and set up a working inbox for `hello@`/`privacy@statuterates.com`
     (Cloudflare → Email Routing is free) so the contact addresses on `/about/`, `/privacy/`, `/terms/` resolve.
- **MAXIMIZE REVENUE, TASTEFULLY (optional second switch):** with just `ADSENSE_CLIENT` set, Google
  **Auto Ads** places ads automatically (hands-off, but Google-controlled). For higher RPM and full
  control over placement, add intentional in-content units: in AdSense go to **Ads → By ad unit → Display
  ads**, create one **responsive** unit, copy its numeric **slot id**, and set repo variable
  `ADSENSE_SLOT=<that id>` + redeploy. Every page then shows two labeled, reserved-height in-content ads
  (top & bottom of content — already scaffolded via `AdSlot`), which earn well and read clean. To keep it
  from looking spammy, in **Ads → your site → Auto ads** turn OFF **Anchor** and **Vignette** (the
  full-screen formats) and keep the density slider low; the in-content units carry the revenue.
- **At ~10k sessions/mo:** revisit Ezoic's higher tiers.
- **At 50k+ sessions/mo:** apply to **Mediavine** (Journey tier ~10k) or **Raptive** (~100k) for much
  higher RPMs; switch the slot code then.
Keep it to **two slots per page** (already scaffolded) to protect page speed and Core Web Vitals.

## 8. Machine-distribution — submit the MCP server + API (10 min total)
Get the dataset in front of AI agents:
- **MCP directories** — submit `machine/mcp-server` (README has the registration snippets) to:
  PulseMCP (pulsemcp.com), mcp.so, Glama (glama.ai/mcp), and Smithery (smithery.ai). Each is a short
  form; link the repo.
- **llms.txt** — already served at `/llms.txt`; once live, confirm it loads and lists the API endpoints.
- **API discoverability** — add the site to any "free API" lists you like; the OpenAPI spec is
  `machine/openapi.yaml`.

## 9. OPTIONAL — Cloudflare pay-per-crawl (later, demand-triggered)
Requires the site to be behind a Cloudflare-proxied domain (do step 6 via Cloudflare first). Then in
the Cloudflare dashboard enable **AI Audit → pay-per-crawl** and set a price. This is **free optionality**
— machine-side revenue is unproven for solo sites, so treat it as a lottery ticket, not the plan. Do not
build per-call billing (Stripe usage-based / x402) until you see real agent demand in your logs.

## 10. Blocked-by-rules summary (what you must do because the build could not)
| Blocked step | Why (hard rule) | Your action |
|---|---|---|
| Add git remote / push | 0.1 no remote | Step 1 |
| Deploy the site | 0.2 no deploys | Steps 2–4 |
| Search-engine indexing | 0.2 no accounts | Step 5 |
| Buy a domain | 0.2 no purchases | Step 6 (optional) |
| Create ad-network accounts | 0.2 no accounts | Step 7 |
| Submit to MCP directories | 0.2 no account/forms | Step 8 |
| Enable pay-per-crawl | 0.2 no accounts | Step 9 (optional) |
| Set contact in crawler UA | 0.4 no owner data | `STATUTERATES_CONTACT` env (optional, polite) |

## Local dev quickstart (for your own edits)
One command: `./setup.sh` (installs, runs the pipeline, builds API + site, verifies MCP). Or stepwise:
```bash
cd pipeline && npm install && node run.mjs all      # fetch + validate + export (~650 records)
cd ../machine && node build-api.mjs                 # generate the static API from exports
cd ../site && npm install && npm run build          # build the site (reads exports + api)
cd ../machine/mcp-server && npm install && npm run smoke   # verify the MCP server
```
