import test from 'node:test';
import assert from 'node:assert/strict';

import {
  IRS_PENALTY_RULES,
  IRS_PENALTY_RULE_URLS,
  assertIrsPenaltyRulePages,
  fetchIrsPenaltyRules,
  validateIrsPenaltyRules,
} from './irs-penalty-rules.mjs';

const PAGES = {
  failure_to_file: `
    <main>
      <h1>Failure to file penalty</h1>
      <p>The penalty applies to individuals who fail to file Form 1040.</p>
      <p>The penalty is 5% of the tax due for each month or partial month the return is late.
        The penalty accrues up to a maximum of 25%.</p>
      <p>If the return is more than 60 days late, the minimum penalty applies.</p>
      <h2>Forms 1040 and 1120 minimum failure to file penalty</h2>
      <p>If both penalties apply, the failure to file penalty is reduced by the amount of the
        failure to pay penalty (0.5% for each month).</p>
    </main>`,
  failure_to_pay: `
    <main>
      <h1>Failure to Pay Penalty</h1>
      <p>The failure to pay penalty is 0.5% of the unpaid taxes for each month or part of a month
        the tax remains unpaid. The penalty will not exceed 25%.</p>
      <p>For an approved payment plan, the rate is reduced to 0.25% per month.</p>
      <p>If you do not pay after a notice with our intent to levy, it is 1% per month or partial
        month. We apply full monthly charges even when payment arrives before the month ends.</p>
    </main>`,
  interest: `
    <main>
      <h1>Interest</h1>
      <p>Underpayment and overpayment interest rates vary and may change quarterly.</p>
      <p>We charge interest when a taxpayer has an unpaid liability comprised of tax, penalties,
        additions to tax, or interest.</p>
      <p>Pay your balance in full to stop underpayment interest from accumulating daily.</p>
      <p>Failure to File penalty is due on the return due date, or extended return due date if an
        extension of time is filed.</p>
      <p>Failure to Pay penalties are due on the date we send you a notice or assess the penalty.</p>
    </main>`,
  administrative_penalty_relief: `
    <main>
      <h1>Administrative penalty relief</h1>
      <h2>Automatic Exemption from Penalty (AEP)</h2>
      <p>AEP begins summer 2026. Eligible returns include Forms 1040, 1065, 1120.</p>
      <p>Relief begins with 2025 tax year returns, and subsequent years.</p>
      <p>If IRS records show timely compliance over the prior three years, the IRS won't assess
        penalties for failure to file, failure to pay, or failure to make a deposit.</p>
    </main>`,
  irm_20_1_2: `
    <main>
      <h1>20.1.2 Failure To File/Failure To Pay Penalties</h1>
      <h2>Minimum Penalty</h2>
      <p>If the return is more than 60 days late, a minimum penalty applies.</p>
      <table>
        <tr><td>Between 01/01/2009 and 12/31/2015</td><td>$135.00</td></tr>
        <tr><td>Between 01/01/2016 and 12/31/2017</td><td>$205.00</td></tr>
        <tr><td>Between 01/01/2018 and 12/31/2019</td><td>$210.00</td></tr>
        <tr><td>Between 01/01/2020 and 12/31/2022</td><td>$435.00</td></tr>
        <tr><td>Between 01/01/2023 and 12/31/2023</td><td>$450.00</td></tr>
        <tr><td>Between 01/01/2024 and 12/31/2024</td><td>$485.00</td></tr>
        <tr><td>Between 01/01/2025 and 12/31/2025</td><td>$510.00</td></tr>
        <tr><td>Between 01/01/2026 and 12/31/2026</td><td>$525.00</td></tr>
        <tr><td>After 12/31/2026</td><td>$535</td></tr>
      </table>
      <p>The $535 minimum in the table above is subject to inflation adjustments.</p>
    </main>`,
};

function mutableRules() {
  return structuredClone(IRS_PENALTY_RULES);
}

test('committed Form 1040 rules preserve rates, caps, threshold, and minimum schedule', () => {
  assert.deepEqual(validateIrsPenaltyRules(), []);
  assert.deepEqual(IRS_PENALTY_RULES.failure_to_file, {
    monthly_rate: 0.05,
    max_months: 5,
    max_fraction: 0.25,
    partial_month_counts: true,
    concurrent_failure_to_pay_reduces_rate: true,
    minimum_after_days: 60,
    minimum_rule: 'more_than',
    minimums: IRS_PENALTY_RULES.failure_to_file.minimums,
    source_url: IRS_PENALTY_RULE_URLS.failure_to_file,
    minimum_source_url: IRS_PENALTY_RULE_URLS.irm_20_1_2,
  });
  assert.deepEqual(IRS_PENALTY_RULES.failure_to_pay, {
    standard_rate: 0.005,
    installment_rate: 0.0025,
    levy_rate: 0.01,
    max_fraction: 0.25,
    partial_month_counts: true,
    source_url: IRS_PENALTY_RULE_URLS.failure_to_pay,
  });
  assert.deepEqual(IRS_PENALTY_RULES.failure_to_file.minimums.at(-1), {
    from: '2027-01-01',
    to: null,
    amount: 535,
  });
  assert.equal(IRS_PENALTY_RULES.verified_at, '2026-07-26');
});

test('rule validator reports corrupted rates, threshold semantics, schedule, and provenance', () => {
  const changed = mutableRules();
  changed.failure_to_file.monthly_rate = 0.5;
  changed.failure_to_file.minimum_rule = 'at_least';
  changed.failure_to_file.minimums[8].amount = 525;
  changed.failure_to_pay.installment_rate = 0.005;
  changed.primary_sources.irm_20_1_2 = 'https://example.com/not-irs';
  changed.verified_at = 'July 26';

  const errors = validateIrsPenaltyRules(changed);
  assert.ok(errors.some((error) => /failure_to_file\.monthly_rate/.test(error)));
  assert.ok(errors.some((error) => /failure_to_file\.minimum_rule/.test(error)));
  assert.ok(errors.some((error) => /minimums\[8\]\.amount/.test(error)));
  assert.ok(errors.some((error) => /failure_to_pay\.installment_rate/.test(error)));
  assert.ok(errors.some((error) => /primary_sources\.irm_20_1_2/.test(error)));
  assert.ok(errors.some((error) => /verified_at/.test(error)));
});

test('representative official IRS HTML satisfies every calculation-critical anchor', () => {
  assert.equal(assertIrsPenaltyRulePages(PAGES), true);
});

test('page gate fails loudly when an official calculation anchor changes', () => {
  const changedStandardRate = {
    ...PAGES,
    failure_to_pay: PAGES.failure_to_pay.replace('0.5% of the unpaid taxes', '0.7% of the unpaid taxes'),
  };
  assert.throws(
    () => assertIrsPenaltyRulePages(changedStandardRate),
    /failure_to_pay page lost official anchor: 0\.5% standard monthly rate/,
  );

  const changedMinimum = {
    ...PAGES,
    irm_20_1_2: PAGES.irm_20_1_2.replace(
      '<tr><td>After 12/31/2026</td><td>$535</td></tr>',
      '<tr><td>After 12/31/2026</td><td>$550</td></tr>',
    ),
  };
  assert.throws(
    () => assertIrsPenaltyRulePages(changedMinimum),
    /irm_20_1_2 page lost official anchor: post-2026 \$535 row/,
  );

  assert.throws(
    () => assertIrsPenaltyRulePages({ ...PAGES, interest: '' }),
    /interest page is missing or empty/,
  );
});

test('page gate also rejects a corrupted committed rule object', () => {
  const changed = mutableRules();
  changed.failure_to_pay.levy_rate = 0.1;
  assert.throws(
    () => assertIrsPenaltyRulePages(PAGES, { rules: changed }),
    /constant failed validation: failure_to_pay\.levy_rate/,
  );
});

test('weekly fetch uses politeGet-compatible options and returns verified provenance', async () => {
  const calls = [];
  const retrieved = [
    '2026-07-26T12:00:00.000Z',
    '2026-07-26T12:00:01.000Z',
    '2026-07-26T12:00:02.000Z',
    '2026-07-26T12:00:03.000Z',
    '2026-07-26T12:00:04.000Z',
  ];
  const byUrl = new Map(
    Object.entries(IRS_PENALTY_RULE_URLS).map(([key, url], index) => [
      url,
      { body: PAGES[key], retrieved_at: retrieved[index] },
    ]),
  );
  const messages = [];
  const result = await fetchIrsPenaltyRules({
    getImpl: async (url, options) => {
      calls.push({ url, options });
      return byUrl.get(url);
    },
    log: (message) => messages.push(message),
  });

  assert.deepEqual(calls.map((call) => call.url), Object.values(IRS_PENALTY_RULE_URLS));
  assert.ok(calls.every((call) => call.options.sourceId === 'irs-penalty-rules'));
  assert.ok(calls.every((call) => call.options.maxAgeMs === 6 * 24 * 60 * 60 * 1000));
  assert.equal(result.rules, IRS_PENALTY_RULES);
  assert.equal(result.retrieved_at, retrieved.at(-1));
  assert.deepEqual(result.pages_verified, Object.keys(IRS_PENALTY_RULE_URLS));
  assert.equal(result.sources.irm_20_1_2.url, IRS_PENALTY_RULE_URLS.irm_20_1_2);
  assert.equal(result.source.publisher, 'U.S. Internal Revenue Service');
  assert.match(messages[0], /verified 5 official pages/);
});

test('weekly fetch rejects changed live prose instead of silently retaining it', async () => {
  const changed = {
    ...PAGES,
    administrative_penalty_relief: PAGES.administrative_penalty_relief.replace(
      'AEP begins summer 2026',
      'AEP start date is under review',
    ),
  };
  const byUrl = new Map(
    Object.entries(IRS_PENALTY_RULE_URLS).map(([key, url]) => [
      url,
      { body: changed[key], retrieved_at: '2026-07-26T12:00:00.000Z' },
    ]),
  );

  await assert.rejects(
    () => fetchIrsPenaltyRules({ getImpl: async (url) => byUrl.get(url) }),
    /administrative_penalty_relief page lost official anchor: summer 2026 start/,
  );
});
