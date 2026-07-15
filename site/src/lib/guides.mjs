// Pillar guide content (drafted by a multi-agent pass, validated: HTML balanced, links restricted to
// the allowed internal set, no stale current-rate claims). Evergreen + cross-linked to the live rate
// pages and calculators. Rendered by pages/guides/[slug].astro + index.astro.
export const GUIDES = [
  {
    "slug": "post-judgment-interest",
    "title": "Post-Judgment Interest Explained: Federal & State Rules",
    "h1": "Post-Judgment Interest: What It Is and How It Accrues",
    "description": "Post-judgment interest accrues on a judgment from entry until it's paid. Learn the federal §1961 rule, how states differ, simple vs. compound, and how to calculate it.",
    "intro_html": "<p>A money judgment is not a number frozen at the courthouse door. From the day it is entered until the day it is paid in full, most judgments keep growing — quietly, automatically, and often overlooked by the very party entitled to the money. That growth is <strong>post-judgment interest</strong>: the statutory compensation a creditor earns for every day the debt goes unpaid.</p><p>This guide explains what post-judgment interest is, how the federal courts set it under 28 U.S.C. §1961, why the fifty states answer the same question fifty different ways, the difference between simple and compound accrual, and exactly when the interest clock starts and stops. Along the way we point you to the live <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a> and the <a href=\"/rates/us-federal-post-judgment/\">current federal rate</a> so you can run the numbers on your own judgment.</p>",
    "sections": [
      {
        "h2": "What post-judgment interest actually is",
        "body_html": "<p>Post-judgment interest accrues on the unpaid amount of a money judgment — the principal, and in many jurisdictions the costs and prejudgment interest folded into it — from the moment the judgment is entered. It exists for a straightforward reason: a dollar collected years after you win is worth less than a dollar on the day you won, and a debtor who drags out payment should not profit from the delay.</p><p>Two features make it powerful. First, it is usually <strong>automatic</strong>: in most jurisdictions it accrues by operation of statute, without a separate court order, so you do not have to ask for it — but you do have to calculate it and claim it when you collect. Second, it <strong>runs until the judgment is satisfied</strong>, so a large award left unpaid for years can accumulate interest that rivals the original judgment.</p>"
      },
      {
        "h2": "The federal rule: 28 U.S.C. §1961",
        "body_html": "<p>In federal district court, a single statute governs nearly all civil money judgments: 28 U.S.C. §1961. It sets the rate equal to the <em>weekly average one-year constant-maturity Treasury yield</em> for the calendar week preceding the date the judgment is entered, as published by the Federal Reserve. The interest is <strong>compounded annually</strong> and — importantly — is <strong>fixed as of that week</strong> for the entire life of the judgment. Even if Treasury yields swing wildly afterward, the judgment keeps accruing at the rate set the week before it was entered.</p><p>Because that benchmark moves every week, there is no single \"federal rate\" to memorize. We track the underlying <a href=\"/rates/treasury-1-year-cmt/\">one-year Treasury series</a> and publish the derived <a href=\"/rates/us-federal-post-judgment/\">federal post-judgment rate</a> so you can read the exact figure for the week you need. For how we compute it from the Federal Reserve's H.15 release, see our <a href=\"/methodology/\">methodology</a>.</p>"
      },
      {
        "h2": "Fifty states, fifty rules",
        "body_html": "<p>Leave federal court and the tidy single rule dissolves. State post-judgment interest tends to fall into a few broad patterns:</p><ul><li><strong>Fixed statutory rates</strong> — a flat number written into the code that changes only when the legislature amends it. Easy to apply, but it can sit far above or below the market for years.</li><li><strong>Market-linked formulas</strong> — a moving benchmark (a Treasury yield, the prime rate, or a state discount rate) plus a fixed margin, often reset annually or quarterly.</li><li><strong>Dual or claim-specific rates</strong> — a different rate depending on the kind of case: contract versus tort, judgments against a government entity, or a special rate for categories such as medical malpractice.</li></ul><p>Some states fix the rate at entry; others let it float over the life of the judgment. The only safe move is to check the specific jurisdiction. Our <a href=\"/states/\">state judgment-interest hub</a> lists each state's rule and the statute behind it, and the <a href=\"/calculators/state-judgment-interest/\">state judgment interest calculator</a> applies the right structure for you.</p>"
      },
      {
        "h2": "Simple vs. compound: the detail that quietly moves the number",
        "body_html": "<p>How interest is applied matters as much as the rate itself. <strong>Simple interest</strong> accrues only on the original judgment amount. <strong>Compound interest</strong> periodically adds the accrued interest to the balance, so future interest is figured on a growing total.</p><p>Consider an illustrative example. On a $100,000 judgment at, <em>for example</em>, 5% simple annual interest, the debt accrues $5,000 a year — roughly $13.70 a day — so after three years you are owed $15,000 in interest. Under annual compounding at the same 5%, year two's interest is figured on $105,000 and year three's on $110,250, and the same three years produce about $15,760. The gap is modest here, but it widens sharply with higher rates, larger judgments, and longer delays. Federal judgments compound annually; many states use simple interest and a few compound — one more reason to confirm the rule that applies to yours.</p>"
      },
      {
        "h2": "When the clock starts — and when it stops",
        "body_html": "<p>The start date is usually the <strong>date the judgment is entered</strong> on the court's docket — not the date of the verdict, the loss, or the filing. Interest for the period <em>before</em> judgment is a separate animal; see <a href=\"/prejudgment/\">prejudgment interest</a> for that side of the ledger. The clock stops when the judgment is <strong>satisfied</strong> — paid in full, including the accrued interest itself.</p><p>A few wrinkles catch people out. An appeal generally does not pause accrual: interest keeps running while the case is on appeal, and if the judgment is affirmed it typically runs from the original entry date. A partial payment usually reduces the balance on which future interest accrues, but jurisdictions differ on whether a payment applies first to interest or to principal. And an amended or renewed judgment can reset or restart the calculation. When timing is contested, the daily figure — the \"per diem\" — becomes the number everyone argues over.</p>"
      },
      {
        "h2": "How a creditor puts it to work",
        "body_html": "<p>For the party owed money, post-judgment interest is both leverage and arithmetic. In practice you will:</p><ul><li><strong>Identify the governing rule</strong> — federal §1961, or the specific state statute — and the exact rate for your judgment's date.</li><li><strong>Compute a per diem</strong> so you can state the payoff as of any future date, which matters for settlement letters, writs of execution, and satisfaction filings.</li><li><strong>Update the payoff</strong> as time passes and as partial payments arrive.</li></ul><p>Because the payoff is a moving target, most creditors recalculate it each time they collect or negotiate. Run your judgment through the <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a>, or browse the full set of <a href=\"/calculators/\">statutory-interest calculators</a> when a matter involves more than one kind of interest.</p><p>Two cautions. Rates and even the formulas change, so never rely on a figure you remember — pull the current published number. And this guide is general information, <strong>not legal advice</strong>: the controlling authority is your jurisdiction's statute and your court's own rules, so verify the rate, the accrual method, and the dates against the official source before you rely on them.</p>"
      }
    ],
    "faqs": [
      {
        "q": "Does post-judgment interest start automatically, or do I have to request it?",
        "a": "In most jurisdictions it accrues automatically by statute from the date the judgment is entered — you don't need a separate order awarding it. But \"automatic\" doesn't mean self-collecting: you still have to calculate the accrued interest and include it when you demand payment, file a writ of execution, or record a satisfaction. Some situations and some states require you to plead it or reduce it to a specific figure, so check local rules."
      },
      {
        "q": "Which rate applies — the rate on the day of judgment, or one that changes over time?",
        "a": "It depends on the jurisdiction. Federal judgments under §1961 lock in the rate from the week before entry and keep it for the life of the judgment, even as Treasury yields move afterward. Some states do the same; others recalculate periodically against a moving benchmark. Confirm whether your rate is fixed at entry or floating, because it changes the math substantially over a multi-year collection."
      },
      {
        "q": "Is post-judgment interest simple or compound?",
        "a": "Federal judgments compound annually under §1961. Among the states, simple interest is the more common default, but several compound, and the compounding period varies. Because compounding accelerates the balance over a long collection, this detail is worth confirming before you quote a payoff amount."
      },
      {
        "q": "How is post-judgment interest different from prejudgment interest?",
        "a": "Timing, and usually the rate. Prejudgment interest compensates for the period between the loss or breach and the judgment; post-judgment interest covers the period from entry until payment. They are frequently set by different statutes, at different rates, and computed in different ways — so it's common for a single case to involve both, calculated separately."
      },
      {
        "q": "Does interest keep accruing during an appeal?",
        "a": "Generally yes. Filing an appeal does not stop post-judgment interest from running, which is one reason a losing party posts a supersedeas bond — the bond typically has to cover the accruing interest. If the judgment is affirmed, interest usually runs from the original date of entry; if it's modified or a new judgment is entered, the calculation can change. Confirm the treatment in your jurisdiction."
      }
    ],
    "key_takeaways": [
      "A money judgment keeps growing from the day it's entered until it's paid; in most places post-judgment interest is automatic, but it's yours to calculate and claim.",
      "Federal judgments follow one formula — 28 U.S.C. §1961: the 1-year Treasury yield from the week before entry, compounded annually and fixed for the life of the judgment.",
      "State rules vary widely — fixed statutory rates, market-linked formulas, and rates that differ by claim type all exist side by side.",
      "Simple vs. compound accrual and the exact start and stop dates move the total more than most people expect.",
      "Rates and formulas change — always pull the current published number and verify it against the official statute, never from memory."
    ]
  },
  {
    "slug": "prejudgment-interest",
    "title": "Prejudgment Interest: Rules, Rates, and How to Calculate It",
    "h1": "Prejudgment Interest, Explained",
    "description": "Prejudgment interest compensates for the wait between a loss and judgment. Learn why it's limited to liquidated claims, how the rate is set, and when it accrues.",
    "intro_html": "<p>When a court finally enters judgment, the money at stake was often owed long before—sometimes years before. <strong>Prejudgment interest</strong> is how the law tries to close that gap: it compensates the winning party for the time value of money lost between the injury or breach and the day the court makes the award. In theory it is simple. In practice it is one of the trickiest numbers in a damages calculation, because whether it is available at all, at what rate, and from what date can turn on the type of claim, the wording of a statute, and even a judge's discretion.</p><p>This guide walks through what prejudgment interest is, why it is harder to pin down than post-judgment interest, the crucial line between liquidated and unliquidated damages, how rates are set (including the common split between a general rate and a separate tort rate), and when the clock starts running. For rates by jurisdiction, see our <a href=\"/prejudgment/\">prejudgment interest reference</a>; to run the arithmetic, use the <a href=\"/calculators/prejudgment-interest/\">prejudgment interest calculator</a>.</p>",
    "sections": [
      {
        "h2": "What prejudgment interest is—and why it exists",
        "body_html": "<p>Prejudgment interest is compensation for the delay in receiving money you were owed. The premise is that a dollar in hand today is worth more than the same dollar paid after a lawsuit concludes. If someone breaches a contract in January and a court awards the contract price two years later, the plaintiff has been deprived of the use of that money for two years. Prejudgment interest restores that lost time value, so the defendant does not effectively borrow the disputed sum interest-free by dragging out litigation.</p><p>It is distinct from <em>post-judgment</em> interest, which accrues on the judgment itself from the date it is entered until it is paid. Post-judgment interest is largely mechanical—one rate, one clear start date. Prejudgment interest is where the hard questions live: it looks backward over a period the parties frequently dispute, and its availability is governed by a patchwork of statutes and case law rather than a single clean rule.</p>"
      },
      {
        "h2": "Why it is harder than post-judgment interest",
        "body_html": "<p>The core difficulty is that prejudgment interest usually attaches only to <strong>liquidated</strong> or <em>readily ascertainable</em> amounts—sums that were fixed, or calculable by a clear standard, before trial. An unpaid invoice of $40,000 is liquidated: the amount was knowable from day one. Damages for pain and suffering, emotional distress, or future harm are <strong>unliquidated</strong>—their value is not established until a jury decides it—and many states bar prejudgment interest on them entirely.</p><p>The rationale is one of fairness to the defendant. A party generally cannot be charged interest for failing to pay a sum whose amount it had no way to know. That single distinction explains most of the variation you will see across jurisdictions, and it is why contract and debt cases routinely carry prejudgment interest while personal-injury verdicts often do not (or do so under a narrower, claim-specific rule). Because the rules and carve-outs differ state by state, always check the controlling statute for your jurisdiction; our <a href=\"/states/\">state-by-state index</a> is a starting point, not a substitute for the statute itself.</p>"
      },
      {
        "h2": "Mandatory, discretionary, or barred",
        "body_html": "<p>Even where a claim qualifies, availability falls into a few patterns. In some jurisdictions prejudgment interest is <strong>mandatory</strong> on liquidated claims—the court must add it once the conditions are met. In others it is <strong>discretionary</strong>: the judge <em>may</em> award it, weighing factors such as whether the delay was the plaintiff's fault, whether the amount was genuinely in dispute, and what equity requires. And in a meaningful set of cases it is simply <strong>unavailable</strong>, most often for unliquidated tort damages.</p><p>Discretion matters because it introduces uncertainty into what looks like a formula. Two plaintiffs with identical facts can walk away with different interest awards depending on the court's reading of the equities. When you model a case, treat a discretionary award as a range, not a certainty—and read the statute closely, because some \"discretionary\" regimes still fix the rate and the accrual date once the court decides to award interest at all.</p>"
      },
      {
        "h2": "How the rate is set—and the general-vs-tort split",
        "body_html": "<p>There is no single national prejudgment rate. Each jurisdiction sets its own, and the mechanism varies. Some statutes fix a flat percentage that stays put until the legislature changes it. Others peg the rate to a moving market benchmark—a Treasury yield, a central-bank reference rate, or a published index—so it resets periodically. Because these numbers change, this guide will not quote a current figure; look up the live value on the relevant rate page instead. For a sense of how a benchmark-linked rate behaves, see the <a href=\"/rates/us-federal-post-judgment/\">federal post-judgment rate</a>, which is derived from Treasury yields, or the <a href=\"/rates/eu-late-payment-reference/\">EU late-payment reference rate</a> used across commercial claims in Europe.</p><p>A wrinkle that trips up many calculations: a number of states apply <strong>two different rates depending on the claim type</strong>—a general rate for contract and debt matters, and a separate, often higher, rate reserved for tort or personal-injury judgments. Using the general rate on a tort award (or vice versa) is a common and costly error. Confirm which rate your claim type triggers before you compute anything. For how we source and re-verify each rate, see our <a href=\"/methodology/\">methodology</a>.</p>"
      },
      {
        "h2": "When the clock starts: accrual dates",
        "body_html": "<p>The accrual date—when interest begins running—can matter as much as the rate, because it fixes the length of the interest period. Common starting points include the date of the breach, the date the loss was sustained, the date a sum became due and payable, the date of a demand for payment, or the date the lawsuit was filed. Which one governs is set by statute or case law and can differ by claim type within the same state.</p><p>Small differences compound. Choosing the breach date over the filing date can add many months of interest to a long-running case. Where a claim involves a series of losses—say, missed monthly payments—interest may accrue separately on each installment from its own due date rather than in one lump from a single date. Nail down the correct accrual trigger first; the arithmetic that follows is only as accurate as that date.</p>"
      },
      {
        "h2": "Doing the math (and where to run it)",
        "body_html": "<p>Once you have the three inputs—principal, rate, and the accrual-to-judgment period—the calculation is straightforward. Most simple prejudgment interest is computed as <strong>simple interest</strong>: principal × rate × time. <em>For example</em>, on a $50,000 liquidated debt at an illustrative 6% annual rate, one year of simple interest is 50,000 × 0.06 × 1 = $3,000; over two years and three months (2.25 years) it is 50,000 × 0.06 × 2.25 = $6,750. Some jurisdictions instead direct a daily rate (annual rate ÷ 365) multiplied by the exact number of days, which handles partial years precisely. A few compound the interest, but simple interest is the more common default—check your statute before assuming.</p><p>These figures are illustrative only; the operative rate is whatever the current statute or benchmark specifies. Rather than hand-calculate, let a tool apply the correct method and day count: the <a href=\"/calculators/prejudgment-interest/\">prejudgment interest calculator</a> handles the pre-award period, and once judgment is entered you can carry the balance forward with the <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a>. Because prejudgment rules turn on jurisdiction, claim type, and dates, treat any result as an estimate. <strong>This guide is reference information, not legal advice—verify every rate, rule, and accrual date against the official statute for your jurisdiction before relying on it.</strong></p>"
      }
    ],
    "faqs": [
      {
        "q": "What is the difference between prejudgment and post-judgment interest?",
        "a": "Prejudgment interest compensates for the time between the loss or breach and the day judgment is entered, and it usually applies only to liquidated or readily ascertainable amounts. Post-judgment interest runs on the judgment itself, from the date it is entered until it is paid, and is generally mandatory at a single statutory rate. The prejudgment period is the harder of the two because availability, rate, and accrual date all depend on the claim type and jurisdiction."
      },
      {
        "q": "Can you get prejudgment interest on pain and suffering or other tort damages?",
        "a": "Often not. Pain and suffering, emotional distress, and similar damages are unliquidated—their value is not fixed until a jury decides—so many states bar prejudgment interest on them. Some jurisdictions do allow it on tort or personal-injury judgments, but frequently under a separate, claim-specific rate rather than the general rate used for contract claims. The controlling statute for your state governs, so confirm it directly."
      },
      {
        "q": "How is the prejudgment interest rate determined?",
        "a": "It depends on the jurisdiction. Some statutes fix a flat percentage that changes only when the legislature amends it; others tie the rate to a moving benchmark such as a Treasury yield or a central-bank reference rate that resets periodically. Many states also apply one rate to general claims and a different rate to tort claims. Because these numbers change, look up the current figure on the live rate page for your jurisdiction rather than relying on a static number."
      },
      {
        "q": "When does prejudgment interest start accruing?",
        "a": "The accrual date is set by statute or case law and varies by claim type. Common triggers are the date of breach, the date the loss occurred, the date a payment became due, the date of a demand, or the date the complaint was filed. The choice matters because it sets the length of the interest period—an earlier accrual date can add significant interest to a long-running case."
      },
      {
        "q": "Is prejudgment interest simple or compound?",
        "a": "Most jurisdictions default to simple interest—principal multiplied by the rate multiplied by the time—though some direct a daily-rate method for partial years, and a few compound. Check the governing statute, since the method materially changes the total. A calculator that applies the correct day count and method for your jurisdiction is the safest way to get an accurate figure."
      }
    ],
    "key_takeaways": [
      "Prejudgment interest compensates for the delay between a loss or breach and the entry of judgment—it is backward-looking and far more rule-dependent than post-judgment interest.",
      "It usually applies only to liquidated or readily ascertainable amounts; unliquidated tort damages like pain and suffering are often excluded.",
      "Availability can be mandatory, discretionary, or barred entirely, and many states apply one rate to general claims and a separate rate to tort claims.",
      "The accrual date—breach, due date, demand, or filing—sets the interest period and can change the total as much as the rate does.",
      "Rates change over time, so verify the current figure and the governing rule against the official statute rather than relying on any fixed number."
    ]
  },
  {
    "slug": "how-to-calculate-judgment-interest",
    "title": "How to Calculate Judgment Interest: Step-by-Step Guide",
    "h1": "How to Calculate Judgment Interest",
    "description": "Learn to calculate judgment interest step by step: find the governing rate, lock it to the judgment date, apply simple vs. compound, and do the daily math.",
    "intro_html": "<p>A money judgment doesn't sit still. From the moment it's entered, it earns interest — and over a case that drags on for years, that interest can quietly swell into thousands of dollars. The arithmetic itself is grade-school multiplication; the hard part is knowing <em>which</em> rate governs, <em>when</em> that rate locked in, and whether it accrues as simple or compound interest. Get one of those wrong and your number is wrong.</p><p>This guide walks the calculation from start to finish: identifying the governing rate, pinning it to the correct date, applying simple versus compound correctly, and running the day-by-day accrual on an actual/365 basis. We'll close with a fully worked example you can copy. When you just want the answer, our <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a> does the accrual for you — but it pays to understand what it's doing.</p>",
    "sections": [
      {
        "h2": "Step 1: Know which interest you're calculating",
        "body_html": "<p>Before you touch a rate table, decide what kind of interest is in play, because two different clocks can run on the same dispute.</p><ul><li><strong>Prejudgment interest</strong> compensates a plaintiff for the time between the injury or breach and the date judgment is entered. It's governed by its own statute, and the rate and method often differ from what comes after. If that's your question, start with our <a href=\"/prejudgment/\">prejudgment interest overview</a>.</li><li><strong>Post-judgment interest</strong> accrues on the judgment amount from the date of entry until the judgment is paid in full. This is the figure most people mean by \"judgment interest,\" and it's the focus of this guide.</li></ul><p>The two are calculated separately and then, typically, added together. Never assume a single rate covers the whole timeline.</p>"
      },
      {
        "h2": "Step 2: Identify the governing rate — federal or state",
        "body_html": "<p>The most important decision is jurisdiction, because it fixes both the rate and, often, the method.</p><p><strong>Federal judgments.</strong> Post-judgment interest on most federal civil judgments is set by statute at 28 U.S.C. &sect; 1961: a rate equal to the weekly average one-year constant-maturity Treasury yield published by the Federal Reserve for the calendar week preceding the judgment. Because it tracks a moving market benchmark, it changes constantly — so we don't print a number here that will be stale next week. See the current <a href=\"/rates/us-federal-post-judgment/\">federal post-judgment rate</a> for the live figure.</p><p><strong>State judgments.</strong> Every state writes its own rule. Some fix a flat statutory rate; others float it against a benchmark and reset monthly, quarterly, or annually. The method varies too — some compound, many are simple. Find your state on the <a href=\"/states/\">state-by-state index</a>, or let the <a href=\"/calculators/state-judgment-interest/\">state judgment interest calculator</a> apply the correct rule for you.</p>"
      },
      {
        "h2": "Step 3: Lock the rate to the judgment date",
        "body_html": "<p>Judgment interest is not calculated at today's rate. For floating rates, the governing figure is the one in effect on — or immediately before — the date the judgment was entered, and it stays fixed for the life of that judgment even as the published benchmark moves on.</p><p>The federal rate, for instance, freezes to the Treasury yield for the week before entry. So to reconstruct a judgment from 2019, you need the 2019 rate, not the current one. Historical values matter, which is why every series is stamped with its effective date; you can trace the underlying <a href=\"/rates/treasury-1-year-cmt/\">1-year Treasury constant-maturity</a> figures and read exactly how each series is sourced on our <a href=\"/methodology/\">methodology page</a>.</p>"
      },
      {
        "h2": "Step 4: Apply simple or compound — correctly",
        "body_html": "<p>This is where good calculations go bad. Whether interest compounds is dictated by statute, not by preference or convenience.</p><p><strong>Simple interest</strong> accrues only on the original principal. The balance grows in a straight line — the same dollar amount is added each period. Most state judgment statutes, and nearly all prejudgment rules, use simple interest.</p><p><strong>Compound interest</strong> accrues on principal <em>plus</em> previously accrued interest. Federal post-judgment interest compounds annually. Tax interest goes further: IRS underpayment interest under &sect; 6621 compounds <em>daily</em>, which is why balances there grow faster than a flat rate suggests — our <a href=\"/calculators/irs-interest/\">IRS interest calculator</a> handles that daily compounding automatically.</p><p>Using simple where the statute demands compound — or the reverse — is the most common and most expensive mistake in these calculations.</p>"
      },
      {
        "h2": "Step 5: Do the daily-interest math (actual/365)",
        "body_html": "<p>Interest accrues by the day, so you convert the annual rate into a daily rate and multiply by the number of days the judgment was outstanding. The standard \"actual/365\" convention works like this:</p><ul><li><strong>Daily interest = Principal &times; (Annual rate &divide; 365)</strong></li><li><strong>Total simple interest = Principal &times; Annual rate &times; (Days &divide; 365)</strong></li></ul><p>Count the <em>actual</em> number of days between the judgment date and the payment or calculation date. Two caveats worth verifying: some jurisdictions use a 360-day year, and some divide by 366 in a leap year. When in doubt, the governing statute or local court rule controls.</p>"
      },
      {
        "h2": "A fully worked example",
        "body_html": "<p>Suppose a judgment of <strong>$10,000</strong> carries a simple interest rate of <strong>9%</strong> (an illustrative round number, not a current rate) and remains unpaid for <strong>200 days</strong>. Work it step by step:</p><ul><li><strong>Annual interest:</strong> $10,000 &times; 0.09 = $900.00</li><li><strong>Daily interest:</strong> $900.00 &divide; 365 = $2.4658 per day</li><li><strong>200 days of accrual:</strong> $2.4658 &times; 200 = <strong>$493.15</strong></li><li><strong>Payoff total:</strong> $10,000 + $493.15 = $10,493.15</li></ul><p>Now contrast compounding. If that same $10,000 sat at 9% compounded annually, year one would add $900 — but year two's interest would accrue on $10,900 (adding $981), and the gap widens every year after. That is why Step 4 matters as much as the rate itself.</p>"
      },
      {
        "h2": "Common pitfalls — and where to verify",
        "body_html": "<p>A few errors recur often enough to name:</p><ul><li>Using today's rate for an older judgment instead of the rate that locked at entry.</li><li>Applying compound interest where the statute specifies simple.</li><li>Miscounting days, or mixing a 360-day and a 365-day convention.</li><li>Forgetting that a partial payment reduces the principal on which interest accrues going forward.</li></ul><p>Run the numbers yourself, then check them against a purpose-built tool — the full suite of <a href=\"/calculators/\">interest calculators</a> covers federal, state, prejudgment, and tax scenarios. One caution: this guide is general information, not legal advice, and the figures a calculator produces are estimates. Always verify the governing rate and method against the official statute or the court's own order before relying on a number in a filing.</p>"
      }
    ],
    "faqs": [
      {
        "q": "How is post-judgment interest calculated on a federal judgment?",
        "a": "Under 28 U.S.C. § 1961, the rate equals the weekly average one-year constant-maturity Treasury yield for the calendar week before the judgment, as published by the Federal Reserve. It is computed daily and compounded annually until the judgment is paid. Because the benchmark moves, check the current federal post-judgment rate rather than relying on an old figure."
      },
      {
        "q": "Is judgment interest simple or compound?",
        "a": "It depends entirely on the governing statute. Federal post-judgment interest compounds annually; many state judgment statutes and most prejudgment rules use simple interest; IRS tax interest compounds daily. Confirm the method for your specific jurisdiction before calculating — assuming the wrong one is the most common error."
      },
      {
        "q": "Does judgment interest use the federal or my state's rate?",
        "a": "Use the federal rate for a judgment entered in federal court under 28 U.S.C. § 1961, and your state's statutory rate for a state-court judgment. Diversity cases and certain contract terms can complicate this, so check the controlling law. The state-by-state index lists each state's rule and method."
      },
      {
        "q": "How do I calculate daily interest on a judgment?",
        "a": "Divide the annual rate by 365 to get the daily rate, multiply by the principal for interest per day, then multiply by the number of days outstanding. For $10,000 at 9%, that is $10,000 × 0.09 ÷ 365 = $2.4658 per day. Watch for jurisdictions that use a 360-day year or a 366-day leap year."
      },
      {
        "q": "Does interest keep accruing after judgment until it's paid?",
        "a": "Yes. Post-judgment interest runs from the date of entry until the judgment is satisfied in full. Partial payments reduce the principal, so interest going forward accrues on the smaller remaining balance — recalculate after each payment to keep the running total accurate."
      }
    ],
    "key_takeaways": [
      "Identify the interest type first: prejudgment and post-judgment run on separate clocks and separate rules.",
      "The rate usually locks to the judgment date — reconstruct old judgments with the historical rate, not today's.",
      "Federal judgments follow 28 U.S.C. § 1961 (1-year Treasury, compounded annually); each state sets its own rate and method.",
      "Simple vs. compound is set by statute, not choice — using the wrong one is the costliest common mistake.",
      "Daily interest = principal × annual rate ÷ 365 × days; verify the day-count convention and the official rate before you file."
    ]
  },
  {
    "slug": "irs-interest-rates",
    "title": "How IRS Interest Rates Work (§6621 & §6622 Explained)",
    "h1": "How IRS Interest Rates Work Under §6621 and §6622",
    "description": "A plain-English guide to IRS interest rates: how §6621 sets the federal short-term rate plus a category spread, quarterly resets, and daily compounding under §6622.",
    "intro_html": "<p>Interest is the quiet line on a tax notice. Penalties get the headlines, but the interest the IRS charges on a late or underpaid balance keeps accruing every single day until the account is paid in full — and it compounds. The good news is that the number is not arbitrary. It follows a formula written into the Internal Revenue Code, resets on a predictable calendar, and can be reconstructed to the penny once you know the rules.</p><p>This guide explains how IRS interest rates are built under <strong>IRC §6621</strong>, why they reset each quarter, and how <strong>§6622</strong> turns a stated annual rate into daily compounding. You will learn the five rate categories, the difference between what you owe and what the IRS pays you, and how to check the live figure. For the current number, see the <a href=\"/rates/irs-underpayment/\">IRS underpayment rate</a> page; to run your own math, use the <a href=\"/calculators/irs-interest/\">IRS interest calculator</a>.</p>",
    "sections": [
      {
        "h2": "The building block: a federal rate plus a spread",
        "body_html": "<p>Every IRS interest rate starts from one anchor: the <em>federal short-term rate</em>. This is a market rate the Treasury determines from the average yield on short-term federal debt, and it is the same starting point that underpins several other statutory rates — it is a close cousin of the yields tracked on our <a href=\"/rates/treasury-1-year-cmt/\">1-year Treasury constant maturity</a> series.</p><p>Section 6621 then adds a fixed number of percentage points to that base, and the size of the add-on depends entirely on <em>who</em> owes or is owed the money and <em>what</em> the balance is. That add-on is the spread. Because the base moves with the market and the spread is fixed by statute, the published IRS rate for any given quarter is simply the federal short-term rate rounded to the nearest whole percent, plus the applicable spread. Understand those two pieces and the whole system becomes legible.</p>"
      },
      {
        "h2": "The five rate categories and their spreads",
        "body_html": "<p>Section 6621 does not set one rate — it sets a family of them. The spread over the federal short-term rate depends on the category:</p><ul><li><strong>Underpayments (individuals):</strong> federal short-term rate <strong>+ 3</strong> points. This is what most taxpayers pay on a late or unpaid balance.</li><li><strong>Non-corporate overpayments:</strong> also <strong>+ 3</strong> points. For individuals, the rate the IRS pays on a refund equals the rate it charges on a shortfall.</li><li><strong>Corporate overpayments:</strong> <strong>+ 2</strong> points — corporations are paid less on their refunds than individuals are.</li><li><strong>Large corporate underpayments:</strong> <strong>+ 5</strong> points, often called \"hot interest,\" applied to sizable corporate deficiencies.</li><li><strong>GATT (large corporate overpayments):</strong> <strong>+ 0.5</strong> points on the portion of a large corporate overpayment above a statutory threshold.</li></ul><p>The headline takeaway: an individual pays and receives interest at the same rate, while corporations face a wider, less favorable spread on both sides.</p>"
      },
      {
        "h2": "Why the rate resets every calendar quarter",
        "body_html": "<p>IRS interest rates are not fixed for the year. Section 6621 requires the federal short-term rate to be redetermined and the resulting interest rates to take effect at the start of each calendar quarter — January 1, April 1, July 1, and October 1. The IRS typically announces the coming quarter's rates in a revenue ruling about a month ahead, so the figures are public before they apply.</p><p>For a balance that spans several quarters, that means no single rate governs the whole period. Interest for January through March accrues at the first quarter's rate; April onward switches to the second quarter's rate, and so on. Any accurate calculation has to segment the timeline by quarter — which is exactly why a spreadsheet built on a single rate almost always disagrees with the IRS.</p>"
      },
      {
        "h2": "Daily compounding under §6622",
        "body_html": "<p>Here is the detail that surprises people. Section 6622 provides that IRS interest is <strong>compounded daily</strong>. The quarterly rate is not applied as simple interest to your original balance; each day's interest is added to the balance, and the next day's interest is charged on that slightly larger figure. Over months and years, the compounding pulls the true cost meaningfully above the stated annual rate.</p><p>A worked example, using an illustrative round number: suppose (<em>for example</em>) the federal short-term rate produced an underpayment rate of <strong>8%</strong> for a full year. On a $10,000 balance, simple interest would be $800. Compounded daily under §6622, the same 8% yields roughly <strong>$833</strong> — an effective annual cost near 8.33%. The gap widens the longer a balance sits unpaid. Rather than model that by hand, feed your dates and balance into the <a href=\"/calculators/irs-interest/\">IRS interest calculator</a>, which segments by quarter and compounds daily for you. (The 8% here is purely for illustration — it is not a current rate.)</p>"
      },
      {
        "h2": "What you owe versus what the IRS pays you",
        "body_html": "<p>The same statute cuts both ways. When you underpay, interest under §6621 runs from the original due date of the return until the balance is paid — and note that interest is charged not only on the tax itself but on assessed penalties as well, so the two compound together. There is no interest-free grace period for a balance due; the clock starts at the deadline, not at the notice.</p><p>When you <em>over</em>pay, the IRS owes <em>you</em>. On a refund, interest generally accrues at the overpayment rate — the same <a href=\"/rates/irs-underpayment/\">short-term-plus-three</a> figure for individuals. But there is a catch: if the IRS issues your refund within 45 days of the return's due date (or of the date you filed, if later), it owes no interest at all. Past that 45-day window, overpayment interest begins to run in your favor.</p>"
      },
      {
        "h2": "IRS interest versus court judgment interest",
        "body_html": "<p>It is easy to conflate the IRS rate with other statutory interest, but they are governed by different laws and different formulas. Federal court judgments accrue post-judgment interest under 28 U.S.C. §1961 — pegged to the 1-year Treasury yield with <em>no</em> added spread and compounded annually, not daily. You can compare that mechanism on the <a href=\"/rates/us-federal-post-judgment/\">federal post-judgment rate</a> page or model it with the <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a>.</p><p>State courts differ again: pre-judgment and judgment interest vary widely by jurisdiction, which is why we track them state by state in the <a href=\"/states/\">state rate index</a> and in our <a href=\"/prejudgment/\">prejudgment interest</a> reference. The lesson is simply not to assume the IRS number applies anywhere outside a federal tax balance — each regime has its own base, spread, and compounding convention.</p>"
      },
      {
        "h2": "How to calculate — and verify — the number",
        "body_html": "<p>To compute IRS interest accurately you need four inputs: the balance, the date interest starts, the date it stops, and the applicable quarterly rates across that span. Because the rate resets quarterly and compounds daily, the reliable path is to let a tool segment the timeline for you — start with the <a href=\"/calculators/irs-interest/\">IRS interest calculator</a>, and browse related tools on the main <a href=\"/calculators/\">calculators</a> index.</p><p><em>This guide is general information, not legal or tax advice.</em> Statutory rates change every quarter and edge cases abound, so always confirm the figure against the IRS's own published quarterly revenue ruling before relying on it for a filing, a payment, or a dispute. Our sourcing and update cadence are documented on the <a href=\"/methodology/\">methodology</a> page — but the official IRS announcement is always the controlling authority.</p>"
      }
    ],
    "faqs": [
      {
        "q": "Does the IRS charge both interest and penalties?",
        "a": "Yes — they are separate. Interest is set under IRC §6621 and compounds daily on the unpaid balance, while penalties (for late filing, late payment, or underpayment) are calculated under different rules. Interest is also charged on assessed penalties, so the two can accrue on top of each other until the account is fully paid."
      },
      {
        "q": "How often do IRS interest rates change?",
        "a": "Every calendar quarter. Section 6621 requires the federal short-term rate to be redetermined for the periods beginning January 1, April 1, July 1, and October 1. The IRS typically publishes the coming quarter's rates in a revenue ruling roughly a month in advance."
      },
      {
        "q": "Is IRS interest really compounded daily?",
        "a": "Yes. Section 6622 requires daily compounding, so each day's interest is added to the balance before the next day's interest is calculated. That makes the effective annual cost slightly higher than the stated rate — which is why simple-interest estimates tend to fall short of the IRS's figure."
      },
      {
        "q": "Does the IRS pay me interest on my refund?",
        "a": "Sometimes. If a refund is issued within 45 days of the return's due date (or filing date, if later), the IRS owes no interest. Beyond that window, overpayment interest accrues in your favor — for individuals, at the same federal-short-term-rate-plus-three used for underpayments."
      },
      {
        "q": "Are IRS interest rates the same for individuals and corporations?",
        "a": "No. Individuals pay and are paid at the federal short-term rate plus 3 points. Corporations receive only plus 2 on overpayments, pay plus 5 on large underpayments (\"hot interest\"), and receive just plus 0.5 (the GATT rate) on the large-overpayment portion above the statutory threshold."
      }
    ],
    "key_takeaways": [
      "IRS interest equals the federal short-term rate plus a fixed statutory spread that depends on the category (+3 underpayment, +3 non-corporate overpayment, +2 corporate overpayment, +5 large-corporate underpayment, +0.5 GATT).",
      "Rates reset every calendar quarter, so a balance spanning multiple quarters must be segmented by rate — no single number governs the whole period.",
      "Under §6622, IRS interest compounds daily, pushing the true cost above the stated annual rate.",
      "For individuals the rate charged on underpayments equals the rate paid on refunds; corporations face a wider, less favorable spread on both sides.",
      "This is general information, not tax advice — always verify against the IRS's published quarterly rate, and use the IRS interest calculator to compute the exact figure."
    ]
  },
  {
    "slug": "late-payment-interest",
    "title": "Late Payment Interest: UK &amp; EU Commercial Debt Guide",
    "h1": "Late Payment Interest on Commercial Debts: The UK and EU Rules",
    "description": "How statutory late payment interest works on overdue B2B invoices in the UK and EU: the base-rate-plus-8 formula, fixed compensation, and how to claim it.",
    "intro_html": "<p>When a business pays your invoice late, you are not merely owed the money — in the UK and across the European Union you are owed <strong>interest on it</strong>, by statute, whether or not your contract ever mentioned the word. This is one of the quieter powers in commercial law: an implied right that turns a late payment from an annoyance into a bill with a running meter. Yet most suppliers never charge it, because the rules sound more complicated than they are.</p><p>This guide explains how statutory late payment interest is set in both regimes — the UK's <em>Late Payment of Commercial Debts (Interest) Act 1998</em> and the EU's <em>Late Payment Directive 2011/7/EU</em> — how the two formulas differ, what fixed compensation you can add on top, and the practical steps to actually claim it. When you need a live number, use the <a href=\"/rates/uk-late-payment-commercial/\">current UK late-payment rate</a> or the <a href=\"/rates/eu-late-payment-reference/\">current EU reference rate</a>, and run the figures through the <a href=\"/calculators/late-payment-interest/\">late payment interest calculator</a>.</p>",
    "sections": [
      {
        "h2": "What \"late payment interest\" actually means",
        "body_html": "<p>Statutory late payment interest is a right that attaches automatically to overdue <strong>business-to-business</strong> debts. It is not the same as the interest a bank charges you, and it is not the interest you might negotiate into a contract — it is a floor, written into law, that applies even to a plain invoice with no interest clause at all.</p><p>Two limits matter up front. First, both the UK and EU regimes cover <em>commercial transactions</em> only: supplies of goods or services where both parties (or a business and a public authority) are acting in the course of a business. Debts owed by consumers are excluded and governed by entirely different consumer-credit rules. Second, the right runs from the day after payment was due — the agreed date, or, absent an agreed date, a default period (30 days after the goods, services, or invoice are received in most cases). Everything below assumes you are a business chasing another business.</p>"
      },
      {
        "h2": "The UK formula: base rate plus eight, locked for six months",
        "body_html": "<p>Under the 1998 Act, statutory interest on a qualifying commercial debt is the <strong>Bank of England base rate plus 8 percentage points</strong>. The 8-point margin is fixed by statute and never moves. The only variable is the base rate — and here the law does something clever to keep the math stable.</p><p>The base rate is not tracked day by day. Instead, the rate <em>in force on a reference date</em> is locked in for a full six-month run. For debts that become late between 1 January and 30 June, you use the base rate as it stood on the previous <strong>31 December</strong>. For debts that become late between 1 July and 31 December, you use the rate as of <strong>30 June</strong>. That reference rate then governs the entire period, even if the Bank of England changes its base rate in the meantime. So a debt that fell late in, say, March uses the base rate as it stood on the previous 31 December — and that single rate applies for the whole time the debt stays unpaid, even if the Bank of England changes its base rate in a later half-year.</p><p>Each new reference date sets the rate only for debts that first fall overdue in that half-year — not for one already running. Rather than commit a number to memory, pull the live figure from the <a href=\"/rates/uk-late-payment-commercial/\">UK late-payment commercial rate page</a>, which pairs the current base rate with the fixed 8-point margin.</p>"
      },
      {
        "h2": "The EU formula: ECB reference rate plus at least eight",
        "body_html": "<p>The EU's Directive 2011/7/EU follows the same shape but with a different anchor. Statutory interest is the <strong>European Central Bank reference rate plus at least 8 percentage points</strong>. The phrase <em>at least</em> is deliberate: 8 points is a minimum the Directive imposes, and individual member states are free to legislate a higher margin. Several do, which is why the effective rate in one country can sit above another's even in the same month.</p><p>The re-fixing rhythm mirrors the UK's half-year logic. The ECB reference rate in force on the <strong>first calendar day of each half-year</strong> — 1 January for the first half, 1 July for the second — applies for the following six months. National transpositions layer their own rules and margins on top, so \"the EU rate\" is really a family of country-specific rates built from a common formula. Check the <a href=\"/rates/eu-late-payment-reference/\">EU late-payment reference rate page</a> for the current ECB anchor, then confirm your specific country's margin.</p>"
      },
      {
        "h2": "A worked example (illustrative figures)",
        "body_html": "<p>The arithmetic is simple interest — not compound — which keeps it honest and easy to reproduce. Suppose you are owed £10,000, the invoice was due 60 days ago, and — <strong>for example only</strong> — the applicable rate works out to a round 12% per year. The daily rate is 12% ÷ 365 = roughly 0.0329% a day, or about £3.29 on £10,000. Across 60 days that is roughly <strong>£197</strong> in interest, on top of the £10,000 principal and any fixed compensation.</p><p>The EU calculation runs identically: take principal × rate × (days late ÷ 365). The rates above are placeholders chosen for clean math — do <em>not</em> treat 12% as the real figure. Feed the live rate and your actual dates into the <a href=\"/calculators/late-payment-interest/\">late payment interest calculator</a>, which handles the day count for you. If you routinely work out interest across other regimes too, the full <a href=\"/calculators/\">calculator index</a> covers judgment and tax interest as well.</p>"
      },
      {
        "h2": "Fixed compensation and recovery costs",
        "body_html": "<p>Interest is only part of the entitlement. Both regimes add a <strong>fixed sum</strong> to compensate you for the trouble of chasing payment — and it stacks per invoice, on top of the interest.</p><ul><li><strong>United Kingdom:</strong> a fixed charge that scales with the size of the debt — £40 for debts under £1,000, £70 for debts from £1,000 up to £9,999.99, and £100 for debts of £10,000 or more. If your reasonable costs of recovering the debt (for example, a debt-collection agency's fee) exceed the fixed sum, you can claim the difference too.</li><li><strong>European Union:</strong> a minimum of <strong>€40</strong> per invoice as automatic compensation for recovery costs, again with reasonable additional recovery costs claimable on top. Member states may set the fixed sum higher.</li></ul><p>These sums are automatic — you do not have to prove hardship — and they apply to each late invoice separately, so a customer who is habitually late accrues them repeatedly.</p>"
      },
      {
        "h2": "How to claim it — and a word of caution",
        "body_html": "<p>The mechanics are refreshingly light. There is no form to file and no permission to seek; the right already exists in the contract by operation of law. In practice:</p><ul><li>Confirm the debt qualifies — a B2B (or business-to-public-authority) supply of goods or services, not a consumer transaction.</li><li>Identify the date interest starts: the day after the agreed due date, or after the statutory default period if none was agreed.</li><li>Pull the correct rate for the period the debt became late, remembering the six-month lock, and calculate simple interest day by day.</li><li>Add the fixed compensation (and any excess reasonable recovery costs), then send a clear statement or demand showing principal, interest, and compensation separately.</li><li>If it remains unpaid, the same figures form the backbone of a formal claim.</li></ul><p><em>This is general information, not legal advice.</em> Rates, reference dates, and national margins change, and edge cases — disputed sums, contractual \"substantial remedy\" clauses, cross-border deals — can shift the analysis. Always verify against the official source before relying on a number, and see the <a href=\"/methodology/\">methodology</a> for how these rates are tracked. American businesses reading this will find no direct equivalent — the closest U.S. analogue is <a href=\"/prejudgment/\">prejudgment interest</a> on an unpaid claim, which you can estimate with the <a href=\"/calculators/prejudgment-interest/\">prejudgment interest calculator</a>.</p>"
      }
    ],
    "faqs": [
      {
        "q": "Can I charge interest on a late invoice if my contract doesn't mention it?",
        "a": "Yes. In both the UK and EU, statutory late payment interest is implied into qualifying business-to-business contracts by law. You do not need an interest clause — the right exists automatically the day after payment falls due. It does not, however, apply to debts owed by consumers."
      },
      {
        "q": "Does statutory late payment interest compound?",
        "a": "No. Both the UK's 1998 Act and the EU Directive contemplate simple interest — principal times the annual rate times the fraction of the year the debt is overdue. Interest does not itself accrue further interest, which keeps the calculation transparent and easy to reproduce."
      },
      {
        "q": "What if we agreed a different interest rate in the contract?",
        "a": "A contract can set its own remedy for late payment, and a genuine, substantial contractual remedy can displace the statutory rate. But terms that are grossly unfair to the supplier can be struck down, in which case the statutory rate applies. Where the drafting is silent or unfair, the statutory floor controls."
      },
      {
        "q": "How is the rate fixed if it changes during the time I'm owed money?",
        "a": "Both regimes lock the rate for six-month windows. The UK uses the Bank of England base rate in force on 31 December or 30 June; the EU uses the ECB reference rate on 1 January or 1 July. That reference rate governs the whole half-year, even if the underlying rate moves before the debt is paid."
      },
      {
        "q": "Is this the same as prejudgment interest in the United States?",
        "a": "No. UK and EU late payment interest is a statutory right on overdue commercial invoices, claimable without going to court. The nearest U.S. concept is prejudgment interest, which compensates a claimant for the time value of money on an unpaid claim and is set by state or federal rules rather than a base-rate-plus-eight formula."
      }
    ],
    "key_takeaways": [
      "Statutory late payment interest is an automatic right on overdue B2B invoices in the UK and EU — no interest clause required, but it never applies to consumer debts.",
      "The UK rate is the Bank of England base rate plus a fixed 8 points; the EU rate is the ECB reference rate plus at least 8 points, with member states free to add margins.",
      "Both regimes lock the reference rate for six-month periods, so a debt is calculated on the rate in force at the start of its half-year, not the day it's paid.",
      "On top of interest you can claim fixed compensation — £40/£70/£100 by debt size in the UK, a €40 minimum in the EU — plus reasonable recovery costs, per invoice.",
      "The interest is simple, not compound; pull the live rate from the UK or EU rate page and let the late payment calculator handle the day count."
    ]
  },
  {
    "slug": "statutory-interest",
    "title": "Statutory Interest Explained: Rates Set by Law vs Contract",
    "h1": "Statutory Interest: A Plain-English Guide",
    "description": "Statutory interest is a rate set by law, not by your contract. Learn how it is determined for judgments, unpaid tax, and late payments across the US, UK, and EU.",
    "intro_html": "<p><strong>Statutory interest</strong> is interest whose rate is fixed by law rather than negotiated between two parties. It is the number that quietly governs what a court judgment grows by while it goes unpaid, what a tax authority adds to an overdue bill, and what a business can charge a customer who pays a commercial invoice late. Because it is set by legislatures and agencies — not by a contract you signed — it applies whether or not anyone ever bargained for it.</p><p>This guide explains the one distinction that matters most: a rate <em>set by law</em> versus a rate the <em>parties agreed</em>. You will learn where statutory interest shows up, how the actual percentage is determined (some rates are frozen into the statute, others float with a market benchmark), and how the rules differ across the United States, the United Kingdom, and the European Union. For any figure that changes over time, we point you to the live page that tracks it. StatuteRates exists to keep these numbers verified against the official source — see our <a href=\"/methodology/\">methodology</a> for how.</p>",
    "sections": [
      {
        "h2": "What \"statutory interest\" actually means",
        "body_html": "<p>Every interest rate in commerce comes from one of two places. A <strong>contract rate</strong> is one the parties chose — the APR on a credit card, the interest clause in a loan note, the late fee written into a supply agreement. A <strong>statutory rate</strong> (also called a legal rate or judgment rate) is one the law imposes, and it takes over precisely in the situations where no valid contract rate governs, or where public policy overrides the deal the parties struck.</p><p>The practical consequence is simple. If you win a lawsuit, the amount owed keeps growing at a rate the legislature picked, not one you negotiated. If you underpay your taxes, the agency's statutory rate applies automatically. And in much of the world, a business can charge statutory interest on a late invoice <em>even if the contract said nothing about interest at all</em> — the law supplies the term the parties left out.</p>"
      },
      {
        "h2": "Statutory rate vs. the rate you agreed",
        "body_html": "<p>Freedom of contract usually wins. Where the parties agreed on a lawful interest rate, courts generally honor it, and that agreed rate — not the statutory one — controls. Statutory interest is best understood as the law's <em>default</em>: it fills the gap when the contract is silent, when the agreement is void, or when a dispute moves into a forum (a courtroom, a tax file) where the legislature has decided the rate itself.</p><p>Two important limits cut the other way. First, <strong>usury caps</strong> and consumer-protection statutes can strike down a contract rate that climbs too high, sometimes snapping the obligation back to a statutory maximum. Second, once a claim is reduced to a court judgment, many jurisdictions replace the contract rate with the <strong>post-judgment statutory rate</strong> — the debt \"merges\" into the judgment and accrues at the legal rate from then on. Knowing which rate applies at which stage is half the battle.</p>"
      },
      {
        "h2": "The three places statutory interest lives",
        "body_html": "<p>Statutory interest is not one thing; it is a family of rates that surface in three recurring arenas.</p><ul><li><strong>Court judgments.</strong> Interest accrues on money judgments both before and after they are entered. <a href=\"/prejudgment/\">Prejudgment interest</a> compensates a plaintiff for the time between the harm and the verdict, and often applies only to liquidated (fixed, calculable) amounts. Post-judgment interest runs from entry of judgment until it is paid.</li><li><strong>Unpaid tax.</strong> Revenue agencies charge interest on underpayments and, in some cases, pay it on refunds. In the US, the <a href=\"/rates/irs-underpayment/\">IRS underpayment rate</a> is the classic example.</li><li><strong>Late commercial payments.</strong> Many jurisdictions give suppliers a statutory right to charge interest on overdue business-to-business invoices — most prominently the UK and EU regimes discussed below.</li></ul><p>Each arena has its own rate, its own start date, and its own compounding convention. Do not assume the number from one carries over to another.</p>"
      },
      {
        "h2": "Fixed by statute vs. pegged to a benchmark",
        "body_html": "<p>There are only two ways a statutory rate gets its number, and telling them apart tells you how often it moves. Some rates are <strong>fixed in the statute</strong> — a legislature writes a flat percentage into the code, and it stays there until lawmakers amend it. Many US state judgment rates work this way, which is why a state's rate can sit unchanged for years.</p><p>Others are <strong>pegged to a market benchmark</strong> and reset on a schedule. The US <a href=\"/rates/us-federal-post-judgment/\">federal post-judgment rate</a> is tied to the <a href=\"/rates/treasury-1-year-cmt/\">1-year Treasury (CMT)</a> yield and updates weekly; the IRS underpayment rate is built on the federal short-term rate plus a statutory margin and resets quarterly. Benchmark-linked rates are the ones that quietly drift, so a figure you relied on last quarter may already be stale. That difference — statute-fixed versus formula-driven — is exactly the split our <a href=\"/methodology/\">verification process</a> is organized around.</p>"
      },
      {
        "h2": "The US patchwork: federal, state, and stage",
        "body_html": "<p>The United States has no single statutory rate. Federal courts apply the federal post-judgment rate under 28 U.S.C. § 1961, while each state sets its own rate for judgments entered in its courts — and those vary widely in both level and mechanics. Some states use a flat statutory percentage; others peg to a benchmark or blend the two.</p><p>Layer on the pre- versus post-judgment distinction and you have a genuine patchwork. A single case can involve a prejudgment rate for the period before trial, a different post-judgment rate afterward, and separate rules for whether interest is simple or compounding. Our <a href=\"/states/\">state-by-state index</a> tracks each jurisdiction, and the <a href=\"/calculators/state-judgment-interest/\">state judgment interest calculator</a> and <a href=\"/calculators/prejudgment-interest/\">prejudgment interest calculator</a> apply the right convention once you have identified the governing rate.</p>"
      },
      {
        "h2": "Across the water: the UK and EU late-payment regimes",
        "body_html": "<p>Outside the courtroom, the clearest modern example of statutory interest is the right to charge it on late commercial invoices. The UK's Late Payment of Commercial Debts (Interest) Act 1998 lets a business charge statutory interest on an overdue B2B debt at the Bank of England base rate <em>plus a fixed statutory addition</em>, with the base-rate component locked to a reference date twice a year rather than the live rate. The current figure lives on our <a href=\"/rates/uk-late-payment-commercial/\">UK late payment rate</a> page.</p><p>The EU's Late Payment Directive follows the same architecture: a reference rate (the European Central Bank's main refinancing rate) plus a statutory margin, refreshed at set points in the year. See the <a href=\"/rates/eu-late-payment-reference/\">EU late payment reference rate</a> for the current basis. Both regimes share a design principle — a public benchmark plus a fixed spread — but they use different benchmarks and different reset dates, so a UK figure is never a stand-in for an EU one. The <a href=\"/calculators/late-payment-interest/\">late payment interest calculator</a> handles the period math for either.</p>"
      },
      {
        "h2": "Doing the math (and a necessary caveat)",
        "body_html": "<p>Once you have the correct rate and start date, the arithmetic is usually straightforward — but the compounding convention is where people go wrong. Some statutory interest is <strong>simple</strong> (UK late-payment interest, and many US state judgment rates), while other regimes <strong>compound</strong> (the federal post-judgment rate compounds annually; IRS interest compounds daily). Always confirm which applies before you calculate.</p><p>For example, at an illustrative <em>5% simple annual rate</em>, a $100,000 judgment accrues about $5,000 over a year — roughly $13.70 per day. Change the rate to an illustrative 8% and the same judgment grows about $8,000 a year. Those numbers are for illustration only; plug the live rate into the <a href=\"/calculators/post-judgment-interest/\">post-judgment interest calculator</a> or the <a href=\"/calculators/irs-interest/\">IRS interest calculator</a> for a figure you can rely on, and browse the full <a href=\"/calculators/\">calculator library</a> for other scenarios.</p><p><strong>This is reference information, not legal advice.</strong> Rates change, carve-outs apply, and the governing rule depends on your jurisdiction and the type of claim. Always verify the current rate against the official statute or agency source before relying on it — which is the whole reason StatuteRates cites and re-checks each one.</p>"
      }
    ],
    "faqs": [
      {
        "q": "Is statutory interest simple or compound?",
        "a": "It depends on the regime. Many statutory rates are simple interest — including UK late-payment interest and a number of US state judgment rates — but others compound. The US federal post-judgment rate compounds annually, and IRS underpayment interest compounds daily. Always confirm the compounding convention for your specific rate before calculating, because it materially changes the total over time."
      },
      {
        "q": "What is the difference between statutory interest and a contract interest rate?",
        "a": "A contract rate is one the parties negotiated and agreed to in writing, such as a loan's APR. Statutory interest is set by law and applies as a default — in court judgments, on unpaid tax, and on late commercial invoices — often regardless of what the parties agreed, and sometimes overriding the contract rate once a claim becomes a judgment."
      },
      {
        "q": "Can I charge statutory interest if my contract does not mention interest?",
        "a": "In many jurisdictions, yes. The UK Late Payment Act and the EU Late Payment Directive both grant businesses a statutory right to charge interest on overdue B2B invoices even when the contract is silent. The rules, rate, and eligibility vary by country and by the type of transaction, so verify the governing statute for your situation."
      },
      {
        "q": "What is the difference between prejudgment and post-judgment interest?",
        "a": "Prejudgment interest compensates a claimant for the time between the harm and the verdict, and often applies only to liquidated or calculable amounts. Post-judgment interest runs from the moment judgment is entered until it is paid. They are frequently set at different rates and calculated under different rules, even within the same case."
      },
      {
        "q": "Does the statutory interest rate change over time?",
        "a": "Some do and some do not. Rates fixed by statute stay put until lawmakers amend them, which can be years. Benchmark-linked rates — like the US federal post-judgment rate, the IRS underpayment rate, and the UK and EU late-payment rates — reset on a weekly, quarterly, or semiannual schedule, so a figure can go stale quickly. Always check the live rate page for the current number."
      }
    ],
    "key_takeaways": [
      "Statutory interest is a rate set by law; a contract rate is one the parties negotiated — and statutory rates apply by default when no valid contract rate governs.",
      "It shows up in three main arenas: court judgments (pre- and post-judgment), unpaid tax, and late commercial invoices.",
      "Some statutory rates are frozen into the statute; others float with a market benchmark and reset weekly, quarterly, or twice a year.",
      "The US has no single rate — it varies by federal vs. state court and by litigation stage — while the UK and EU use a public benchmark plus a fixed statutory margin.",
      "Never rely on a remembered number: confirm compounding and pull the current rate from the official source before you calculate."
    ]
  }
];

export function getGuide(slug) {
  return GUIDES.find((g) => g.slug === slug) || null;
}
