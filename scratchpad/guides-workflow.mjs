export const meta = {
  name: 'statuterates-guides',
  description: 'Draft 6 evergreen pillar-guide articles for statuterates.com to capture informational search traffic and funnel to the calculators/rate pages',
  phases: [{ title: 'Draft guides' }, { title: 'Fact-check' }],
};

const LINKS = [
  '/calculators/', '/calculators/post-judgment-interest/', '/calculators/irs-interest/',
  '/calculators/state-judgment-interest/', '/calculators/prejudgment-interest/',
  '/calculators/late-payment-interest/', '/rates/us-federal-post-judgment/', '/rates/irs-underpayment/',
  '/rates/treasury-1-year-cmt/', '/rates/uk-late-payment-commercial/', '/rates/eu-late-payment-reference/',
  '/states/', '/prejudgment/', '/methodology/',
];

const GUIDES = [
  { slug: 'post-judgment-interest', kw: 'post-judgment interest', brief: 'What post-judgment interest is (interest that accrues on a money judgment from entry until paid), the federal rule (28 U.S.C. §1961 = weekly 1-yr Treasury, compounded annually) vs. the wide variation among states (fixed statutory rates, market-linked formulas, some dual by claim type), simple vs compound, when it starts/stops, and how a creditor uses it. Funnel to the federal + state calculators and the state hub pages.' },
  { slug: 'prejudgment-interest', kw: 'prejudgment interest', brief: 'What prejudgment interest is (compensates for the time between the loss/breach and judgment), why it is harder than post-judgment: it usually applies only to LIQUIDATED / readily-ascertainable amounts and is often barred on unliquidated tort damages, is discretionary in some states, and the rate/claim-type split (many states have a general rate AND a separate tort/personal-injury rate). Accrual dates. Funnel to /prejudgment/ and the prejudgment calculator.' },
  { slug: 'how-to-calculate-judgment-interest', kw: 'how to calculate judgment interest', brief: 'A step-by-step how-to: identify the governing rate (federal vs state, and which state rule), find the correct rate for the judgment date, apply simple vs compound correctly, use actual/365 daily accrual, and a fully worked numeric EXAMPLE with round numbers (e.g. $10,000 at 9% simple for 200 days = $493.15). Explain daily-interest math clearly. Funnel heavily to the calculators.' },
  { slug: 'irs-interest-rates', kw: 'IRS interest rates', brief: 'How IRS interest works under IRC §6621/§6622: the federal short-term rate plus a category spread (+3 underpayment, +3 non-corp overpayment, +2 corp overpayment, +5 large-corporate underpayment, +0.5 GATT), reset each calendar quarter, COMPOUNDED DAILY under §6622. What taxpayers owe on late/underpaid tax and what the IRS pays on refunds. Funnel to the IRS rate pages + IRS calculator.' },
  { slug: 'statutory-interest', kw: 'statutory interest', brief: 'A plain-English guide to statutory interest: the difference between a rate SET BY LAW (statutory/legal/judgment rate) and a CONTRACT rate the parties agreed; where statutory interest shows up (judgments, unpaid tax, late commercial payments); and how it differs across the US, UK (Late Payment Act, base+8), and EU (Directive, reference+8). Position StatuteRates as the one place these are tracked and verified.' },
  { slug: 'late-payment-interest', kw: 'late payment interest', brief: 'Statutory interest on late COMMERCIAL (B2B) payments in the UK and EU: UK Late Payment of Commercial Debts (Interest) Act 1998 = Bank of England base rate + 8 percentage points, fixed for 6-month periods; EU Late Payment Directive 2011/7/EU = ECB reference rate + at least 8 points, re-fixed each half-year, plus national margins. How businesses claim it. Funnel to the late-payment calculator + UK/EU rate pages.' },
];

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['slug', 'title', 'h1', 'description', 'intro_html', 'sections', 'faqs'],
  properties: {
    slug: { type: 'string' },
    title: { type: 'string', description: 'SEO <title>, ~55-60 chars, includes the primary keyword' },
    h1: { type: 'string' },
    description: { type: 'string', description: 'meta description, 140-158 chars, compelling' },
    intro_html: { type: 'string', description: '1-2 lead paragraphs of HTML (may contain <a>/<strong>/<em>)' },
    sections: {
      type: 'array', description: '5-7 sections',
      items: {
        type: 'object', additionalProperties: false, required: ['h2', 'body_html'],
        properties: { h2: { type: 'string' }, body_html: { type: 'string', description: 'HTML paragraphs (<p>…</p>), optionally <ul><li>, with 1-3 inline internal <a href> links per section drawn ONLY from the allowed list' } },
      },
    },
    faqs: { type: 'array', description: '4-5 Q&A', items: { type: 'object', additionalProperties: false, required: ['q', 'a'], properties: { q: { type: 'string' }, a: { type: 'string' } } } },
    key_takeaways: { type: 'array', items: { type: 'string' }, description: '3-5 one-line takeaways' },
  },
};

function prompt(g) {
  return `Write a high-quality, EVERGREEN pillar guide for statuterates.com (a legal/statutory interest-rate reference site). Topic: "${g.kw}". Slug: ${g.slug}.

BRIEF: ${g.brief}

REQUIREMENTS:
- ~1000-1500 words total, authoritative but plain-English, genuinely useful. Original writing — do not copy any source.
- Accurate and legally careful. Add a brief "not legal advice — verify against the official source" note where natural.
- CRITICAL: do NOT state a specific *current* numeric rate as fact (those change and would go stale). Instead, explain how the rate is determined and LINK to the live page for the current number (e.g. "see the current <a href="/rates/us-federal-post-judgment/">federal post-judgment rate</a>"). Worked math EXAMPLES may use illustrative round rates clearly labelled "for example".
- Internal links: weave 4-8 contextual internal links, using ONLY these paths (relative, with trailing slash): ${LINKS.join(', ')}. Put them inline in intro_html / section body_html as <a href="/path/">anchor</a>. Every guide should link to at least one calculator and one rate or index page.
- Structure: intro (hook + what the reader will learn), 5-7 <h2> sections, then 4-5 FAQs (real questions people search), and 3-5 key takeaways.
- Voice: confident, precise, a touch editorial ("the almanac"), never fluffy. American English (this guide may cover UK/EU where the brief says so).
- Return ONLY the structured object. body_html/intro_html must be valid HTML fragments (<p>, <ul>, <li>, <a>, <strong>, <em> only).`;
}

phase('Draft guides');
const drafts = await parallel(GUIDES.map((g) => () => agent(prompt(g), { schema: SCHEMA, label: `guide:${g.slug}`, phase: 'Draft guides' })));

// Light fact-check / link-audit pass on each draft in parallel.
phase('Fact-check');
const CHECK = {
  type: 'object', additionalProperties: false, required: ['slug', 'ok', 'issues'],
  properties: { slug: { type: 'string' }, ok: { type: 'boolean' }, issues: { type: 'array', items: { type: 'string' } } },
};
const checks = await parallel(drafts.filter(Boolean).map((d) => () =>
  agent(`Fact-check this StatuteRates guide draft for (1) any legal/technical INACCURACY, (2) any internal <a href> whose path is NOT in this allowed list [${LINKS.join(', ')}], (3) any stated specific current rate that should instead link to the live page, (4) malformed HTML. Return ok=true only if clean; else list concrete issues.\n\nDRAFT:\n${JSON.stringify(d).slice(0, 9000)}`,
    { schema: CHECK, label: `check:${d.slug}`, phase: 'Fact-check' })));

return {
  guides: drafts.filter(Boolean),
  checks: checks.filter(Boolean),
  flagged: checks.filter(Boolean).filter((c) => !c.ok),
};
