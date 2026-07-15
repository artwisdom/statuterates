// Apply the 21 statute-audit corrections to us-states.mjs and content.mjs. Each edit asserts it
// matched EXACTLY once; the script reports any miss and applies nothing for that file on failure.
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = '/Users/michaeldube/Desktop/Passive Income Ideas/data-moat-engine';

const edits = { 'pipeline/fetchers/us-states.mjs': [], 'site/src/lib/content.mjs': [] };
const U = (find, replace, desc) => edits['pipeline/fetchers/us-states.mjs'].push({ find, replace, desc });
const C = (find, replace, desc) => edits['site/src/lib/content.mjs'].push({ find, replace, desc });

// ============================ us-states.mjs ============================
// ---- PREJUDGMENT dual-rate / stale fixes: object-line fields + notes line ----

// CA prejudgment: 10% -> dual 7%/10%, reclassify fixed
U(`value: 10, value_text: "10%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Cal. Civ. Code sec. 3287"`,
  `value: 7, value_text: "7% / 10%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Cal. Const. art. XV §1 (7% tort/general); Cal. Civ. Code §3289(b) (10% contract)"`, 'CA pre fields');
U(`notes: "Prejudgment interest under Cal. Civ. Code sec. 3287 — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from California’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at leginfo.legislature.ca.gov. Not legal advice."`,
  `notes: "California has a DUAL prejudgment rate, both simple: 7% for tort and other non-contract claims (including personal injury) — the constitutional default legal rate (Cal. Const. art. XV §1; discretionary tort interest under Civ. Code §3288 also runs at this 7%); and 10% for breach of a contract that stipulates no rate (Civ. Code §3289(b)). Entitlement to interest on liquidated/certain damages is Civ. Code §3287. Verified against the statutes 2026-07-11. Not legal advice."`, 'CA pre notes');

// GA prejudgment: 7% -> 7%/9.75% (liquidated / unliquidated tort)
U(`value: 7, value_text: "7%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "O.C.G.A. § 7-4-15"`,
  `value: 7, value_text: "7% / 9.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "O.C.G.A. §7-4-2 (7% liquidated); §51-12-14 (unliquidated tort, prime+3%)"`, 'GA pre fields');
U(`notes: "Prejudgment interest under O.C.G.A. § 7-4-15 — 7% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Georgia’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Georgia has two prejudgment schemes, both simple: LIQUIDATED demands bear 7% — the legal rate (O.C.G.A. §7-4-2), applied from when the sum became due (§7-4-15). UNLIQUIDATED tort/personal-injury damages, after a proper written demand, instead bear prime + 3% (currently 9.75%, variable) under §51-12-14, running from the 30th day after the notice. Verified 2026-07-11. Not legal advice."`, 'GA pre notes');

// ID prejudgment: keep 12% headline, add tort carve-out to statute + notes
U(`value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Idaho Code 28-22-104(1)"`,
  `value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Idaho Code §28-22-104(1) (12% general); §12-301 / §28-22-104(2) (tort)"`, 'ID pre fields');
U(`notes: "Prejudgment interest under Idaho Code 28-22-104(1) — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Idaho’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Idaho general/contract prejudgment interest is 12% simple (Idaho Code §28-22-104(1)). SEPARATELY, in tort actions for personal injury, property damage, or wrongful death where the claimant serves an offer of settlement, prejudgment interest accrues at the §28-22-104(2) variable rate (currently 8.875%) under §12-301 — not the 12% general rate. Verified 2026-07-11. Not legal advice."`, 'ID pre notes');

// IN prejudgment: keep 8% headline, add tort band
U(`statute: "Contract/liquidated: IC 24-4.6-1-103"`, `statute: "IC 24-4.6-1-103 (8% contract/account); IC 34-51-4-9 (tort, 6–10% discretionary)"`, 'IN pre statute');
U(`notes: "Prejudgment interest under Contract/liquidated: IC 24-4.6-1-103 — 8% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Indiana’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Indiana prejudgment interest is 8% for contract, written-instrument, and account claims (IC 24-4.6-1-103). SEPARATELY, tort/personal-injury prejudgment interest is set at the court's discretion within a 6%–10% per-year band (simple) under IC 34-51-4-9 — the 8% figure does not apply to tort claims. Verified 2026-07-11. Not legal advice."`, 'IN pre notes');

// KS prejudgment: 10% -> 10%/6.25%
U(`value: 10, value_text: "10%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "K.S.A. 16-201"`,
  `value: 10, value_text: "10% / 6.25%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "K.S.A. 16-201 (10% general); 16-201(b)/16-204(e)(1) (tort filed ≥7/1/2023)"`, 'KS pre fields');
U(`notes: "Prejudgment interest under K.S.A. 16-201 — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Kansas’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Kansas general/contract prejudgment interest is 10% fixed (K.S.A. 16-201(a)). For civil TORT actions filed on or after July 1, 2023, prejudgment interest is instead two percentage points below the K.S.A. 16-204(e)(1) judgment rate — currently 6.25% (8.25% − 2), variable, recomputed each July 1 (K.S.A. 16-201(b)). Verified 2026-07-11. Not legal advice."`, 'KS pre notes');

// MN prejudgment: 4% -> 4%/10%
U(`value: 4, value_text: "4%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Minn. Stat. § 549.09, subd. 1(b)"`,
  `value: 4, value_text: "4% / 10%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Minn. Stat. § 549.09, subd. 1(b)–(c)"`, 'MN pre fields');
U(`notes: "Prejudgment interest under Minn. Stat. § 549.09, subd. 1(b) — 4% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Minnesota’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at revisor.mn.gov. Not legal advice."`,
  `notes: "Minnesota preverdict interest under Minn. Stat. §549.09 subd. 1(b) is computed per subd. 1(c): the default rate (currently 4%) applies, but judgments/awards OVER $50,000 (other than certain categories) accrue 10% — the same two-tier split as post-judgment interest. Current value as of 2026-07-09; verify at revisor.mn.gov. Not legal advice."`, 'MN pre notes');

// MO prejudgment: stale 8.75% -> 9%/6.75%
U(`value: 8.75, value_text: "8.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Mo. Rev. Stat. § 408.040", srcId: "mo-prejud"`,
  `value: 9, value_text: "9% / 6.75%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-09", statute: "Mo. Rev. Stat. §408.020 (9% liquidated/contract); §408.040.3 (tort, Fed Funds+3%)", srcId: "mo-prejud"`, 'MO pre fields');
U(`notes: "Prejudgment interest under Mo. Rev. Stat. § 408.040 — 8.75% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Missouri’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-07-09; verify at revisor.mo.gov. Not legal advice."`,
  `notes: "Missouri prejudgment interest splits by claim type: liquidated/contract claims bear 9% fixed (Mo. Rev. Stat. §408.020); TORT prejudgment interest is the intended Federal Funds rate + 3% — currently about 6.75% (variable) under §408.040.3. Current values as of July 2026; verify at revisor.mo.gov. Not legal advice."`, 'MO pre notes');

// MT prejudgment: 10% -> 10%/9.75%
U(`value: 10, value_text: "10%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "MCA 27-1-211"`,
  `value: 10, value_text: "10% / 9.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "MCA 31-1-106 (10% legal, via 27-1-211); 27-1-210 (tort, prime+3%)"`, 'MT pre fields');
U(`notes: "Prejudgment interest under MCA 27-1-211 — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Montana’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Montana prejudgment interest is 10% simple for liquidated/contract-type claims — the legal rate (MCA §31-1-106), applied via the right-to-interest statute §27-1-211. TORT prejudgment interest is instead prime + 3% — currently 9.75% (variable, reset each Jan 1) under §27-1-210. Verified 2026-07-11. Not legal advice."`, 'MT pre notes');

// NE prejudgment: 12% -> 12%/5.723%
U(`value: 12, value_text: "12%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Neb. Rev. Stat. sec. 45-104"`,
  `value: 12, value_text: "12% / 5.723%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Neb. Rev. Stat. §45-104 (12% liquidated); §45-103.02(1) (unliquidated, judgment rate)"`, 'NE pre fields');
U(`notes: "Prejudgment interest under Neb. Rev. Stat. sec. 45-104 — 12% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Nebraska’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Nebraska prejudgment interest is 12% for LIQUIDATED claims (Neb. Rev. Stat. §45-104). UNLIQUIDATED claims (tort/personal injury) instead accrue prejudgment interest at the §45-103 variable judgment rate — currently 5.723% — under §45-103.02(1), not 12%. Current values as of July 2026; verify at nebraskajudicial.gov. Not legal advice."`, 'NE pre notes');

// NJ prejudgment: 4.5% -> 4.5%/6.5%
U(`value: 4.5, value_text: "4.5%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "N.J. Ct. R. 4:42-11(b)"`,
  `value: 4.5, value_text: "4.5% / 6.5%", kind: "same-as-postjudgment", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "N.J. Ct. R. 4:42-11(b)"`, 'NJ pre fields');
U(`notes: "Prejudgment interest under N.J. Ct. R. 4:42-11(b) — 4.5% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from New Jersey’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-01; verify at njcourts.gov. Not legal advice."`,
  `notes: "New Jersey tort prejudgment interest is calculated 'in the same amount and manner' as post-judgment interest (R. 4:42-11(b)): for 2026, 4.5% on amounts up to the Special Civil Part limit ($20,000) and 6.5% (base + 2%) above it. Simple interest. Verify the current Notice to the Bar at njcourts.gov. Not legal advice."`, 'NJ pre notes');

// NM prejudgment: 10% -> 10%/15%
U(`value: 10, value_text: "10%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "NMSA 1978, Sec. 56-8-4(B)"`,
  `value: 10, value_text: "10% / 15%", kind: "discretionary-with-default", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "NMSA 1978 §56-8-4(B) (≤10% discretionary); §56-8-3 (15% liquidated/contract)"`, 'NM pre fields');
U(`notes: "Prejudgment interest under NMSA 1978, Sec. 56-8-4(B) — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from New Mexico’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "New Mexico prejudgment interest splits by claim type: for unliquidated claims (e.g. personal injury) a court may award UP TO 10% in its discretion (NMSA 1978 §56-8-4(B)); for liquidated/contract 'money due by contract' claims, 15% applies as of right (§56-8-3). Verified 2026-07-11. Not legal advice."`, 'NM pre notes');

// OK prejudgment: 4.13% -> 4.13%/6%
U(`value: 4.13, value_text: "4.13%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-02", statute: "12 O.S. Sec. 727.1"`,
  `value: 4.13, value_text: "4.13% / 6%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-02", statute: "12 O.S. §727.1 (4.13% personal injury); 23 O.S. §6 + 15 O.S. §266 (6% contract)"`, 'OK pre fields');
U(`notes: "Prejudgment interest under 12 O.S. Sec. 727.1 — 4.13% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Oklahoma’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-02; verify at oscn.net. Not legal advice."`,
  `notes: "Oklahoma prejudgment interest splits by claim type: personal-injury / personal-rights verdicts bear a variable rate (currently 4.13%) set annually under 12 O.S. §727.1; contract / liquidated 'damages certain' claims bear 6% fixed (23 O.S. §6; 15 O.S. §266). Current PI value as of 2026-01-02; verify at oscn.net. Not legal advice."`, 'OK pre notes');

// PA prejudgment: keep 6% headline, add tort delay-damages
U(`value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "41 P.S. Sec. 202"`,
  `value: 6, value_text: "6%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "41 P.S. §202 (6% contract); 231 Pa. Code Rule 238 (tort delay damages, prime+1%)"`, 'PA pre fields');
U(`notes: "Prejudgment interest under 41 P.S. Sec. 202 — 6% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Pennsylvania’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Pennsylvania prejudgment interest is 6% simple, as of right, on contract and other liquidated claims (41 P.S. §202). In tort actions for bodily injury, death, or property damage, the operative figure is instead Pa.R.C.P. 238 'delay damages' — the prime rate (first Wall Street Journal edition each January) + 1%, simple, not compounded (231 Pa. Code Rule 238), a variable rate. Verified 2026-07-11. Not legal advice."`, 'PA pre notes');

// UT prejudgment: 10% -> 10%/8.75%
U(`value: 10, value_text: "10%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Utah Code Ann. 15-1-1(2)"`,
  `value: 10, value_text: "10% / 8.75%", kind: "fixed", method: "statute-fixed", confidence: "high", asof: "2026-07-09", statute: "Utah Code §15-1-1(2) (10% general); §78B-5-824 (PI special damages, prime+2%)"`, 'UT pre fields');
U(`notes: "Prejudgment interest under Utah Code Ann. 15-1-1(2) — 10% (simple interest). This is PREjudgment interest (accruing before entry of judgment) and is separate from Utah’s post-judgment rate; availability is limited by claim type (see the page). Verify against the statute text. Not legal advice."`,
  `notes: "Utah general/contract prejudgment interest is 10% fixed (Utah Code §15-1-1(2)). For personal-injury actions (causes arising on/after July 1, 2014), prejudgment interest on SPECIAL damages is instead prime + 2% (5% floor, 10% cap) — currently 8.75%, simple — under §78B-5-824. Current PI value as of July 2026; verify at le.utah.gov. Not legal advice."`, 'UT pre notes');

// MI prejudgment: stale 4.725% -> 4.959%
U(`value: 4.725, value_text: "4.725%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-01-01", statute: "MCL 600.6013"`,
  `value: 4.959, value_text: "4.959%", kind: "variable", method: "statute-variable", confidence: "medium", asof: "2026-07-01", statute: "MCL 600.6013"`, 'MI pre fields');
U(`notes: "Prejudgment interest under MCL 600.6013 — 4.725%, compounded annually. This is PREjudgment interest (accruing before entry of judgment) and is separate from Michigan’s post-judgment rate; availability is limited by claim type (see the page). Current formula value as of 2026-01-01; verify at legislature.mi.gov. Not legal advice."`,
  `notes: "Prejudgment interest under MCL §600.6013 (Michigan interest runs from the filing of the complaint), COMPOUNDED ANNUALLY: the general rate is 1% above the six-month average of 5-year Treasury auctions, reset each Jan 1 / Jul 1 — currently 4.959% (period beginning July 1, 2026 = 1% + 3.959%). Judgments on a written instrument use a separate rate (the instrument's rate, capped at 13%, also compounded). Verify the current period at legislature.mi.gov. Not legal advice."`, 'MI pre notes');

// ---- POST-JUDGMENT fixes ----
// MA post: citation fix
U(`metadata: { state: 'MA', statute: 'M.G.L. c.231 §§6B–6C', basis: 'statute-fixed' }`,
  `metadata: { state: 'MA', statute: 'M.G.L. c. 235 §8', basis: 'statute-fixed' }`, 'MA post statute');
// MI post: stale value + notes
U(`value: 4.725, kind: 'variable', asof: '2026-01-01',`, `value: 4.959, kind: 'variable', asof: '2026-07-01',`, 'MI post value');
U(`currently 4.725% (period beginning Jan 1, 2026)`, `currently 4.959% (period beginning July 1, 2026)`, 'MI post notes');
// IL post: add 5% consumer carve-out
U(`Carve-out: 6% per annum where the judgment debtor is a unit of local government. Verify against the statute; not legal advice.`,
  `Carve-outs: 6% per annum where the judgment debtor is a unit of local government, and 5% for consumer-debt judgments of $25,000 or less (735 ILCS 5/2-1303). Verify against the statute; not legal advice.`, 'IL post notes');
// WA post: understated -> claim-type split, headline 12% general
U(`value: 8.75, kind: 'variable', asof: '2026-07-08',`, `value: 12, value_text: '12% / 8.75%', kind: 'variable', asof: '2026-07-08',`, 'WA post value');
U(`notes: 'Post-judgment interest under RCW 4.56.110 (amended 2019): judgments on a written contract carry the contract’s rate; tort judgments and the general catch-all carry a rate tied to the federal prime rate (Fed H.15) — currently about 8.75%. Simple interest. Verify the current rate at app.leg.wa.gov and the Fed H.15 prime; not legal advice.' }`,
  `notes: 'Post-judgment interest under RCW 4.56.110 sets DISTINCT rates by claim type: general "all other" money judgments carry the statutory maximum under RCW 19.52.020 (currently 12%); consumer-debt judgments 9% (fixed); tort judgments against individuals/entities carry the federal prime rate + 2% (currently 8.75%); child-support judgments 12%; judgments on a written contract carry the contract’s rate. Simple interest. Verify at app.leg.wa.gov; not legal advice.' }`, 'WA post notes');
// KS post: stale 7.75 -> 8.25 + clean notes
U(`value: 7.75, value_text: "7.75%", kind: "variable", asof: "2026-07-01", statute: "Kan. Stat. Ann. 16-204"`,
  `value: 8.25, value_text: "8.25%", kind: "variable", asof: "2026-07-01", statute: "Kan. Stat. Ann. 16-204"`, 'KS post value');
U(`notes: "Post-judgment interest under Kan. Stat. Ann. 16-204, currently 7.75% (as of July 1, 2026). . Formula = New York Federal Reserve Bank discount rate (charge on loans to depository institutions, as reported in the \\"Money Rates\\" column of the Wall Street Journal) as of… Simple interest. This 16-204 rate is POST-judgment. Prejudgment interest is governed separately by K.S.A. 16-201 (10% per annum when no other rate agreed). CONTRACT:… Verify the current value at sos.ks.gov; not legal advice."`,
  `notes: "Post-judgment interest under Kan. Stat. Ann. 16-204, currently 8.25% for July 1, 2025–June 30, 2026 (recomputed each July 1 off the prior year's discount-rate formula). Simple interest. Prejudgment interest is separate — see the Kansas prejudgment page (10% general; a lower tort rate for recent tort actions). Verify at sos.ks.gov; not legal advice."`, 'KS post notes');
// MO post: add tort rate to value_text + clean notes
U(`value: 9, value_text: "9%", kind: "variable", asof: "2026-07-09", statute: "Mo. Rev. Stat. §408.040", srcId: "mo-jud"`,
  `value: 9, value_text: "9% / 8.75%", kind: "variable", asof: "2026-07-09", statute: "Mo. Rev. Stat. §408.040", srcId: "mo-jud"`, 'MO post value');
U(`notes: "Post-judgment interest under Mo. Rev. Stat. §408.040, currently 9% (as of July 9, 2026). 040: - NON-TORT judgments: fixed by statute at 9% per annum; but \\"judgments and orders for money upon contracts bearing more than nine percent interest shall bear the same… Simple interest. NON-TORT (contract and all other non-tort money judgments) = 9% flat, or the contract rate if the contract bears more than 9%. TORT = Fed Funds… Verify the current value at revisor.mo.gov; not legal advice."`,
  `notes: "Post-judgment interest under Mo. Rev. Stat. §408.040: NON-TORT/contract judgments bear 9% fixed (or the contract rate if higher); TORT judgments bear the intended Federal Funds rate + 5% — currently about 8.75% (variable). Simple interest. Verify at revisor.mo.gov; not legal advice."`, 'MO post notes');
// NE post: stale 5.97 (future) -> 5.723 (current) + clean notes
U(`value: 5.97, value_text: "5.97%", kind: "variable", asof: "2026-07-16", statute: "Neb. Rev. Stat. § 45-103"`,
  `value: 5.723, value_text: "5.723%", kind: "variable", asof: "2026-04-16", statute: "Neb. Rev. Stat. § 45-103"`, 'NE post value');
U(`notes: "Post-judgment interest under Neb. Rev. Stat. § 45-103, currently 5.97% (as of July 16, 2026). Rate = (bond investment yield of the average accepted auction price for the first auction of each annual quarter of the 26-week U.S. Treasury bill, as published by the U.S.… Simple interest. Statutory rate does NOT apply where (1) the interest rate is specifically provided by other law, or (2) the action is founded on an oral or written… Verify the current value at nebraskajudicial.gov; not legal advice."`,
  `notes: "Post-judgment interest under Neb. Rev. Stat. §45-103, currently 5.723% (in effect since Apr 16, 2026; scheduled to rise to 5.970% on July 16, 2026). Rate = bond-equivalent yield of the first 26-week U.S. Treasury bill auction of each quarter. Simple interest. Does not apply where another law fixes the rate or the action is on a contract fixing one. Verify at nebraskajudicial.gov; not legal advice."`, 'NE post notes');
// NM post: add 15% tort to value_text (notes already mention it)
U(`value: 8.75, value_text: "8.75%", kind: "fixed", asof: "2026-07-09", statute: "N.M. Stat. Ann. § 56-8-4", srcId: "nm-jud"`,
  `value: 8.75, value_text: "8.75% / 15%", kind: "fixed", asof: "2026-07-09", statute: "N.M. Stat. Ann. § 56-8-4", srcId: "nm-jud"`, 'NM post value');
// OR post: add medical-board carve-out to notes
U(`9%/yr simple (ORS 82.010(2)(a)). Applies to money judgments; also accrues on pre-judgment interest that accrued before entry, and on attorney fees… Verify against the statute; not legal advice.`,
  `9%/yr simple (ORS 82.010(2)(a)). Applies to money judgments; also accrues on pre-judgment interest that accrued before entry, and on attorney fees. Carve-out: judgments for professional negligence of Oregon Medical Board or State Board of Nursing licensees bear the lesser of 5% or the federal discount rate + 3% (ORS 82.010(2)(f)), not 9%. Verify against the statute; not legal advice.`, 'OR post notes');

// ============================ content.mjs ============================
// Prejudgment taglines + body leading sentence (dual-rate states)
C(`tagline: "California prejudgment interest — a formula rate, reset periodically.",`, `tagline: "California prejudgment interest — 7% for tort/non-contract, 10% for contract (both simple).",`, 'CA tagline');
C(`body: "California prejudgment interest is currently 10% per year — a statutory formula rate under Cal. Civ. Code sec. 3287 that resets periodically. Prejudgment interest is NOT automatic on all claims.",`,
  `body: "California prejudgment interest is a dual fixed rate: 7% per year for tort and other non-contract claims, including personal injury (Cal. Const. art. XV §1), and 10% for breach of a contract that stipulates no rate (Cal. Civ. Code §3289(b)) — both simple. Prejudgment interest is NOT automatic on all claims.",`, 'CA body');

C(`tagline: "Georgia’s prejudgment interest rate — when a court awards it.",`, `tagline: "Georgia prejudgment interest — 7% for liquidated claims, prime+3% for tort.",`, 'GA tagline');
C(`body: "Georgia prejudgment interest is 7% per year, as simple interest under O.C.G.A. § 7-4-15.`,
  `body: "Georgia prejudgment interest is 7% simple for liquidated demands (the legal rate, O.C.G.A. §7-4-2), but unliquidated tort/personal-injury damages instead accrue prime + 3% — currently 9.75% — under §51-12-14.`, 'GA body');

C(`tagline: "Kansas’s prejudgment interest rate — when a court awards it.",`, `tagline: "Kansas prejudgment interest — 10% general, or the judgment rate −2% for recent tort claims.",`, 'KS tagline');
C(`body: "Kansas prejudgment interest is 10% per year, as simple interest under K.S.A. 16-201.`,
  `body: "Kansas prejudgment interest is 10% for general/contract claims (K.S.A. 16-201), but for civil tort actions filed on or after July 1, 2023 it is the judgment rate minus 2 points — currently 6.25%.`, 'KS body');

C(`tagline: "Minnesota prejudgment interest — a formula rate, reset each year.",`, `tagline: "Minnesota prejudgment interest — 4%, or 10% on awards over $50,000.",`, 'MN tagline');
C(`body: "Minnesota prejudgment interest is currently 4% per year — a statutory formula rate under Minn. Stat. § 549.09, subd. 1(b) that resets each year.`,
  `body: "Minnesota preverdict interest is 4% per year, but rises to 10% on judgments/awards over $50,000 (Minn. Stat. §549.09, subd. 1(b)–(c)) — the same two-tier split as post-judgment interest.`, 'MN body');

C(`tagline: "Missouri prejudgment interest — a formula rate, reset periodically.",`, `tagline: "Missouri prejudgment interest — 9% for contract, ~6.75% (Fed Funds+3%) for tort.",`, 'MO tagline');
C(`body: "Missouri prejudgment interest is currently 8.75% per year — a statutory formula rate under Mo. Rev. Stat. § 408.040 that resets periodically. Prejudgment interest is NOT freely available; it is claim-type restricted.",`,
  `body: "Missouri prejudgment interest splits by claim type: 9% fixed for liquidated/contract claims (§408.020), and the intended Federal Funds rate + 3% — currently about 6.75% — for tort claims (§408.040.3). Prejudgment interest is NOT freely available; it is claim-type restricted.",`, 'MO body');

C(`tagline: "Montana’s prejudgment interest rate — when a court awards it.",`, `tagline: "Montana prejudgment interest — 10% for liquidated claims, prime+3% for tort.",`, 'MT tagline');
C(`body: "Montana prejudgment interest is 10% per year, as simple interest under MCA 27-1-211.`,
  `body: "Montana prejudgment interest is 10% simple for liquidated/contract claims (the legal rate, MCA §31-1-106), but tort prejudgment interest is prime + 3% — currently 9.75% — under §27-1-210.`, 'MT body');

C(`tagline: "Nebraska’s prejudgment interest rate — when a court awards it.",`, `tagline: "Nebraska prejudgment interest — 12% for liquidated claims, the judgment rate for unliquidated.",`, 'NE tagline');
C(`body: "Nebraska prejudgment interest is 12% per year, as simple interest under Neb. Rev. Stat. sec. 45-104.`,
  `body: "Nebraska prejudgment interest is 12% for liquidated claims (§45-104), but unliquidated tort/personal-injury claims accrue the variable judgment rate — currently 5.723% — under §45-103.02(1).`, 'NE body');

C(`tagline: "New Jersey prejudgment interest — the same rate as its post-judgment interest.",`, `tagline: "New Jersey prejudgment interest — 4.5%, or 6.5% on amounts over $20,000.",`, 'NJ tagline');
C(`body: "New Jersey applies the same rate to prejudgment interest as to post-judgment interest — currently 4.5% per year under N.J. Ct. R. 4:42-11(b).`,
  `body: "New Jersey tort prejudgment interest tracks post-judgment interest: 4.5% on amounts up to $20,000 and 6.5% above it for 2026 (N.J. Ct. R. 4:42-11(b)), as simple interest.`, 'NJ body');

C(`tagline: "New Mexico prejudgment interest is discretionary — here is the rate courts apply.",`, `tagline: "New Mexico prejudgment interest — up to 10% (discretionary) for tort, 15% for liquidated/contract.",`, 'NM tagline');
C(`body: "In New Mexico, prejudgment interest is discretionary: a court may award it, and when it does the rate is 10% per year under NMSA 1978, Sec. 56-8-4(B).`,
  `body: "New Mexico prejudgment interest splits by claim type: up to 10% at the court's discretion for unliquidated claims like personal injury (NMSA 1978 §56-8-4(B)), and 15% as of right for liquidated/contract claims (§56-8-3).`, 'NM body');

C(`tagline: "Oklahoma prejudgment interest — a formula rate, reset each year.",`, `tagline: "Oklahoma prejudgment interest — 4.13% for personal injury, 6% for contract.",`, 'OK tagline');
C(`body: "Oklahoma prejudgment interest is currently 4.13% per year — a statutory formula rate under 12 O.S. Sec. 727.1 that resets each year. Sharply restricted and split across two statutes.",`,
  `body: "Oklahoma prejudgment interest splits across two statutes: a variable rate — currently 4.13% — for personal-injury/personal-rights verdicts (12 O.S. §727.1), and 6% fixed for contract/liquidated 'damages certain' claims (23 O.S. §6). Sharply restricted and claim-type dependent.",`, 'OK body');

C(`tagline: "Utah’s prejudgment interest rate — when a court awards it.",`, `tagline: "Utah prejudgment interest — 10% general, prime+2% for personal-injury special damages.",`, 'UT tagline');
C(`body: "Utah prejudgment interest is 10% per year, as simple interest under Utah Code Ann. 15-1-1(2).`,
  `body: "Utah prejudgment interest is 10% for general/contract claims (Utah Code §15-1-1(2)), but personal-injury special damages accrue prime + 2% — currently 8.75% — under §78B-5-824.`, 'UT body');

C(`body: "Michigan prejudgment interest is currently 4.725% per year — a statutory formula rate under MCL 600.6013 that resets twice a year.`,
  `body: "Michigan prejudgment interest is currently 4.959% per year — a statutory formula rate under MCL 600.6013 that resets twice a year, compounded annually.`, 'MI pre body');

// Post-judgment content bodies (stale numbers / WA split)
C(`body: "Kansas post-judgment interest is currently 7.75% — a statutory formula rate under Kan. Stat. Ann. 16-204 that resets each year.`,
  `body: "Kansas post-judgment interest is currently 8.25% — a statutory formula rate under Kan. Stat. Ann. 16-204 that resets each year.`, 'KS post body');
C(`body: "Nebraska post-judgment interest is currently 5.97% — a statutory formula rate under Neb. Rev. Stat. § 45-103 that resets each quarter.`,
  `body: "Nebraska post-judgment interest is currently 5.723% — a statutory formula rate under Neb. Rev. Stat. § 45-103 that resets each quarter.`, 'NE post body');
C(`tagline: 'Washington judgment interest — prime-linked since 2019.',`, `tagline: 'Washington judgment interest — 12% general, 9% consumer, prime+2% tort.',`, 'WA tagline');
C("body: `Since a 2019 amendment to RCW 4.56.110, Washington ties tort and general judgment interest to the\nfederal prime rate — currently about 8.75% — while judgments on a written contract carry the contract’s own rate.\nIt’s simple interest.`",
  "body: `Since a 2019 amendment to RCW 4.56.110, Washington sets judgment interest by claim type: general money judgments carry the statutory maximum (currently 12%), consumer-debt judgments 9%, and tort judgments the federal prime rate + 2% (currently 8.75%); contract judgments carry the contract’s own rate. It’s simple interest.`", 'WA post body');

// ============================ apply (two-phase: validate ALL, then write) ============================
const failures = [];
const staged = {};
for (const [rel, list] of Object.entries(edits)) {
  const path = `${ROOT}/${rel}`;
  let src = readFileSync(path, 'utf8');
  for (const { find, replace, desc } of list) {
    const n = src.split(find).length - 1;
    if (n !== 1) { failures.push(`[${rel}] ${desc}: matched ${n} times (need 1)`); continue; }
    src = src.replace(find, replace);
  }
  staged[path] = src;
}
if (failures.length) {
  console.log(`NOT WRITTEN — ${failures.length} failure(s):\n` + failures.join('\n'));
  process.exit(1);
}
for (const [path, src] of Object.entries(staged)) writeFileSync(path, src);
for (const [rel, list] of Object.entries(edits)) console.log(`${rel}: applied ${list.length} edits`);
console.log('\nAll edits applied cleanly.');
