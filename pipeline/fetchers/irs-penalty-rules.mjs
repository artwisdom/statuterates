// Weekly integrity monitor for the official IRS Form 1040 late-filing/payment rules.
//
// The calculator consumes the committed constants below; it does not scrape live prose into a
// calculation. This monitor instead fetches the five controlling IRS pages through politeGet
// (robots.txt, throttling, caching, retry, and fetch ceilings included) and fails closed if any
// calculation-critical official anchor changes. A human can then review the new IRS guidance and
// deliberately update both the constants and tests.

import { politeGet } from '../lib/http.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKLY_CACHE_MAX_AGE_MS = 6 * DAY_MS;
const SOURCE_ID = 'irs-penalty-rules';

export const IRS_PENALTY_RULE_URLS = Object.freeze({
  failure_to_file: 'https://www.irs.gov/payments/failure-to-file-penalty',
  failure_to_pay: 'https://www.irs.gov/payments/failure-to-pay-penalty',
  interest: 'https://www.irs.gov/payments/interest',
  administrative_penalty_relief:
    'https://www.irs.gov/payments/administrative-penalty-relief',
  irm_20_1_2: 'https://www.irs.gov/irm/part20/irm_20-001-002r',
});

const MINIMUMS = Object.freeze([
  Object.freeze({ from: '2009-01-01', to: '2015-12-31', amount: 135 }),
  Object.freeze({ from: '2016-01-01', to: '2017-12-31', amount: 205 }),
  Object.freeze({ from: '2018-01-01', to: '2019-12-31', amount: 210 }),
  Object.freeze({ from: '2020-01-01', to: '2022-12-31', amount: 435 }),
  Object.freeze({ from: '2023-01-01', to: '2023-12-31', amount: 450 }),
  Object.freeze({ from: '2024-01-01', to: '2024-12-31', amount: 485 }),
  Object.freeze({ from: '2025-01-01', to: '2025-12-31', amount: 510 }),
  Object.freeze({ from: '2026-01-01', to: '2026-12-31', amount: 525 }),
  Object.freeze({ from: '2027-01-01', to: null, amount: 535 }),
]);

/**
 * Committed, reviewable calculator inputs for an individual original Form 1040 balance.
 *
 * The minimum threshold deliberately carries both `minimum_after_days: 60` and
 * `minimum_rule: "more_than"` because the IRS says "more than 60 days late," not "60 days or
 * more." The post-2026 $535 amount is sourced from IRM 20.1.2 and remains subject to future
 * inflation adjustments; this monitor is designed to detect that future change.
 */
export const IRS_PENALTY_RULES = Object.freeze({
  scope: Object.freeze({
    form: 'Form 1040',
    taxpayer_type: 'individual',
    balance_type: 'tax shown on an original return',
  }),
  failure_to_file: Object.freeze({
    monthly_rate: 0.05,
    max_months: 5,
    max_fraction: 0.25,
    partial_month_counts: true,
    concurrent_failure_to_pay_reduces_rate: true,
    minimum_after_days: 60,
    minimum_rule: 'more_than',
    minimums: MINIMUMS,
    source_url: IRS_PENALTY_RULE_URLS.failure_to_file,
    minimum_source_url: IRS_PENALTY_RULE_URLS.irm_20_1_2,
  }),
  failure_to_pay: Object.freeze({
    standard_rate: 0.005,
    installment_rate: 0.0025,
    levy_rate: 0.01,
    max_fraction: 0.25,
    partial_month_counts: true,
    source_url: IRS_PENALTY_RULE_URLS.failure_to_pay,
  }),
  interest: Object.freeze({
    rate_changes_quarterly: true,
    accrues_daily: true,
    failure_to_file_start: 'return due date or extended return due date',
    failure_to_pay_start: 'notice or assessment date',
    source_url: IRS_PENALTY_RULE_URLS.interest,
  }),
  administrative_relief: Object.freeze({
    program: 'Automatic Exemption from Penalty (AEP)',
    begins: 'summer 2026',
    eligible_tax_year_from: 2025,
    compliance_lookback_years: 3,
    automatic: true,
    eligible_return_series: Object.freeze(['Form 1040']),
    eligible_penalties: Object.freeze(['failure_to_file', 'failure_to_pay']),
    source_url: IRS_PENALTY_RULE_URLS.administrative_penalty_relief,
  }),
  primary_sources: IRS_PENALTY_RULE_URLS,
  verified_at: '2026-07-26',
});

const EXPECTED_MINIMUMS = [
  ['2009-01-01', '2015-12-31', 135],
  ['2016-01-01', '2017-12-31', 205],
  ['2018-01-01', '2019-12-31', 210],
  ['2020-01-01', '2022-12-31', 435],
  ['2023-01-01', '2023-12-31', 450],
  ['2024-01-01', '2024-12-31', 485],
  ['2025-01-01', '2025-12-31', 510],
  ['2026-01-01', '2026-12-31', 525],
  ['2027-01-01', null, 535],
];

function expectEqual(errors, actual, expected, path) {
  if (actual !== expected) errors.push(`${path} must be ${String(expected)}, found ${String(actual)}`);
}

/**
 * Validate an IRS penalty-rule object without throwing.
 *
 * Returning an error list follows the existing committed-history validators and makes the function
 * useful to build guards as well as tests. Live page assertions convert any errors into a hard
 * failure before the calculator can publish.
 */
export function validateIrsPenaltyRules(rules = IRS_PENALTY_RULES) {
  const errors = [];
  if (!rules || typeof rules !== 'object' || Array.isArray(rules)) {
    return ['rules must be an object'];
  }

  expectEqual(errors, rules.scope?.form, 'Form 1040', 'scope.form');
  expectEqual(errors, rules.scope?.taxpayer_type, 'individual', 'scope.taxpayer_type');
  expectEqual(
    errors,
    rules.scope?.balance_type,
    'tax shown on an original return',
    'scope.balance_type',
  );

  const ftf = rules.failure_to_file;
  expectEqual(errors, ftf?.monthly_rate, 0.05, 'failure_to_file.monthly_rate');
  expectEqual(errors, ftf?.max_months, 5, 'failure_to_file.max_months');
  expectEqual(errors, ftf?.max_fraction, 0.25, 'failure_to_file.max_fraction');
  expectEqual(errors, ftf?.partial_month_counts, true, 'failure_to_file.partial_month_counts');
  expectEqual(
    errors,
    ftf?.concurrent_failure_to_pay_reduces_rate,
    true,
    'failure_to_file.concurrent_failure_to_pay_reduces_rate',
  );
  expectEqual(errors, ftf?.minimum_after_days, 60, 'failure_to_file.minimum_after_days');
  expectEqual(errors, ftf?.minimum_rule, 'more_than', 'failure_to_file.minimum_rule');
  expectEqual(
    errors,
    ftf?.source_url,
    IRS_PENALTY_RULE_URLS.failure_to_file,
    'failure_to_file.source_url',
  );
  expectEqual(
    errors,
    ftf?.minimum_source_url,
    IRS_PENALTY_RULE_URLS.irm_20_1_2,
    'failure_to_file.minimum_source_url',
  );

  if (!Array.isArray(ftf?.minimums)) {
    errors.push('failure_to_file.minimums must be an array');
  } else {
    expectEqual(
      errors,
      ftf.minimums.length,
      EXPECTED_MINIMUMS.length,
      'failure_to_file.minimums.length',
    );
    for (let index = 0; index < EXPECTED_MINIMUMS.length; index++) {
      const [from, to, amount] = EXPECTED_MINIMUMS[index];
      const row = ftf.minimums[index];
      expectEqual(errors, row?.from, from, `failure_to_file.minimums[${index}].from`);
      expectEqual(errors, row?.to, to, `failure_to_file.minimums[${index}].to`);
      expectEqual(errors, row?.amount, amount, `failure_to_file.minimums[${index}].amount`);
    }
  }

  const ftp = rules.failure_to_pay;
  expectEqual(errors, ftp?.standard_rate, 0.005, 'failure_to_pay.standard_rate');
  expectEqual(errors, ftp?.installment_rate, 0.0025, 'failure_to_pay.installment_rate');
  expectEqual(errors, ftp?.levy_rate, 0.01, 'failure_to_pay.levy_rate');
  expectEqual(errors, ftp?.max_fraction, 0.25, 'failure_to_pay.max_fraction');
  expectEqual(errors, ftp?.partial_month_counts, true, 'failure_to_pay.partial_month_counts');
  expectEqual(
    errors,
    ftp?.source_url,
    IRS_PENALTY_RULE_URLS.failure_to_pay,
    'failure_to_pay.source_url',
  );

  expectEqual(errors, rules.interest?.rate_changes_quarterly, true, 'interest.rate_changes_quarterly');
  expectEqual(errors, rules.interest?.accrues_daily, true, 'interest.accrues_daily');
  expectEqual(
    errors,
    rules.interest?.failure_to_file_start,
    'return due date or extended return due date',
    'interest.failure_to_file_start',
  );
  expectEqual(
    errors,
    rules.interest?.failure_to_pay_start,
    'notice or assessment date',
    'interest.failure_to_pay_start',
  );
  expectEqual(
    errors,
    rules.interest?.source_url,
    IRS_PENALTY_RULE_URLS.interest,
    'interest.source_url',
  );

  const relief = rules.administrative_relief;
  expectEqual(
    errors,
    relief?.program,
    'Automatic Exemption from Penalty (AEP)',
    'administrative_relief.program',
  );
  expectEqual(errors, relief?.begins, 'summer 2026', 'administrative_relief.begins');
  expectEqual(
    errors,
    relief?.eligible_tax_year_from,
    2025,
    'administrative_relief.eligible_tax_year_from',
  );
  expectEqual(
    errors,
    relief?.compliance_lookback_years,
    3,
    'administrative_relief.compliance_lookback_years',
  );
  expectEqual(errors, relief?.automatic, true, 'administrative_relief.automatic');
  if (
    !Array.isArray(relief?.eligible_return_series)
    || relief.eligible_return_series.length !== 1
    || relief.eligible_return_series[0] !== 'Form 1040'
  ) {
    errors.push('administrative_relief.eligible_return_series must contain only Form 1040');
  }
  if (
    !Array.isArray(relief?.eligible_penalties)
    || relief.eligible_penalties.length !== 2
    || relief.eligible_penalties[0] !== 'failure_to_file'
    || relief.eligible_penalties[1] !== 'failure_to_pay'
  ) {
    errors.push(
      'administrative_relief.eligible_penalties must contain failure_to_file and failure_to_pay',
    );
  }
  expectEqual(
    errors,
    relief?.source_url,
    IRS_PENALTY_RULE_URLS.administrative_penalty_relief,
    'administrative_relief.source_url',
  );

  for (const [key, url] of Object.entries(IRS_PENALTY_RULE_URLS)) {
    expectEqual(errors, rules.primary_sources?.[key], url, `primary_sources.${key}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rules.verified_at || '')) {
    errors.push('verified_at must be an ISO calendar date');
  }

  return errors;
}

function decodeCodePoint(raw, radix) {
  const value = Number.parseInt(raw, radix);
  if (!Number.isInteger(value) || value < 0 || value > 0x10ffff) return ' ';
  return String.fromCodePoint(value);
}

function pageText(value) {
  const body = typeof value === 'string' ? value : value?.body;
  if (typeof body !== 'string' || !body.trim()) return '';
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, raw) => decodeCodePoint(raw, 16))
    .replace(/&#(\d+);/g, (_, raw) => decodeCodePoint(raw, 10))
    .replace(/&(?:nbsp|ensp|emsp|thinsp);/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&(?:rsquo|lsquo);/gi, "'")
    .replace(/&(?:rdquo|ldquo);/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const PAGE_ANCHORS = Object.freeze({
  failure_to_file: Object.freeze([
    ['Form 1040 scope', /\bform 1040\b/],
    [
      '5% per month or partial month',
      /penalty is 5%[^.]{0,220}for each month or partial month/,
    ],
    ['25% cap', /maximum of 25%/],
    ['more-than-60-days minimum threshold', /more than 60 days late/],
    ['minimum-penalty table', /minimum failure to file penalty/],
    [
      'concurrent failure-to-pay reduction',
      /failure to file penalty is reduced[^.]{0,180}0\.5% for each month/,
    ],
  ]),
  failure_to_pay: Object.freeze([
    [
      '0.5% standard monthly rate',
      /failure to pay penalty is 0\.5%[^.]{0,220}for each month or part of a month/,
    ],
    ['25% cap', /(?:will|won't|will not|won’t) (?:not )?exceed 25%/],
    ['0.25% installment-agreement rate', /reduced to 0\.25% per month/],
    ['1% post-levy-notice rate', /intent to levy[^.]{0,180}1% per month or partial month/],
    ['full partial-month charge', /apply full monthly charges/],
  ]),
  interest: Object.freeze([
    [
      'tax-and-penalty interest base',
      /unpaid liability comprised of tax, penalties, additions to tax, or interest/,
    ],
    ['quarterly rate changes', /interest rates vary and may change quarterly/],
    ['daily accrual', /interest (?:from )?accumulat(?:e|es|ing)[^.]{0,100}daily/],
    [
      'failure-to-file interest start',
      /failure to file[^.]{0,160}due on the return due date[^.]{0,100}extended return due date/,
    ],
    [
      'failure-to-pay interest start',
      /failure to pay[^.]{0,260}due on the date we send you a notice or assess the penalty/,
    ],
  ]),
  administrative_penalty_relief: Object.freeze([
    ['AEP program name', /automatic exemption from penalty \(aep\)/],
    ['summer 2026 start', /aep begins summer 2026/],
    ['Form 1040 eligibility', /forms 1040, 1065, 1120/],
    ['2025 tax-year start', /2025 tax year returns, and subsequent/],
    ['three-year compliance lookback', /timely compliance over the prior three years/],
    [
      'failure-to-file and failure-to-pay relief',
      /won't assess penalties for failure to file, failure to pay/,
    ],
  ]),
  irm_20_1_2: Object.freeze([
    ['minimum-penalty section', /minimum penalty/],
    ['more-than-60-days minimum threshold', /more than 60 days late/],
    ['2009-2015 $135 row', /01\/01\/2009[^$]{0,100}\$135(?:\.00)?/],
    ['2016-2017 $205 row', /01\/01\/2016[^$]{0,100}\$205(?:\.00)?/],
    ['2018-2019 $210 row', /01\/01\/2018[^$]{0,100}\$210(?:\.00)?/],
    ['2020-2022 $435 row', /01\/01\/2020[^$]{0,100}\$435(?:\.00)?/],
    ['2023 $450 row', /01\/01\/2023[^$]{0,100}\$450(?:\.00)?/],
    ['2024 $485 row', /01\/01\/2024[^$]{0,100}\$485(?:\.00)?/],
    ['2025 $510 row', /01\/01\/2025[^$]{0,100}\$510(?:\.00)?/],
    ['2026 $525 row', /01\/01\/2026[^$]{0,100}\$525(?:\.00)?/],
    ['post-2026 $535 row', /after 12\/31\/2026[^$]{0,100}\$535(?:\.00)?/],
    ['future inflation-adjustment warning', /\$535 minimum[^.]{0,180}inflation adjustments/],
  ]),
});

/**
 * Assert that the current official pages still publish every calculator-critical anchor.
 *
 * `pages` is keyed like IRS_PENALTY_RULE_URLS. Each value may be an HTML string or a politeGet
 * response object containing `body`.
 */
export function assertIrsPenaltyRulePages(pages, { rules = IRS_PENALTY_RULES } = {}) {
  const ruleErrors = validateIrsPenaltyRules(rules);
  if (ruleErrors.length) {
    throw new Error(`IRS penalty-rule constant failed validation: ${ruleErrors.join('; ')}`);
  }
  if (!pages || typeof pages !== 'object') {
    throw new Error('IRS penalty-rule pages must be provided as an object');
  }

  for (const [pageKey, anchors] of Object.entries(PAGE_ANCHORS)) {
    const text = pageText(pages[pageKey]);
    if (!text) {
      throw new Error(`IRS ${pageKey} page is missing or empty`);
    }
    for (const [description, pattern] of anchors) {
      if (!pattern.test(text)) {
        throw new Error(
          `IRS ${pageKey} page lost official anchor: ${description} `
          + `(${IRS_PENALTY_RULE_URLS[pageKey]})`,
        );
      }
    }
  }

  return true;
}

/**
 * Fetch and verify the five official IRS rule pages.
 *
 * Calls are intentionally sequential so the shared same-host throttle remains simple and polite.
 * No failure is swallowed: an outage or changed anchor stops the monitor and prevents silent rule
 * drift.
 */
export async function fetchIrsPenaltyRules({
  getImpl = politeGet,
  log = () => {},
  maxAgeMs = WEEKLY_CACHE_MAX_AGE_MS,
} = {}) {
  const pages = {};
  for (const [pageKey, url] of Object.entries(IRS_PENALTY_RULE_URLS)) {
    pages[pageKey] = await getImpl(url, { sourceId: SOURCE_ID, maxAgeMs });
  }

  assertIrsPenaltyRulePages(pages);
  const retrieved_at = Object.values(pages)
    .map((page) => page?.retrieved_at)
    .filter(Boolean)
    .sort()
    .at(-1) || new Date().toISOString();

  log(
    `IRS penalty rules: verified ${Object.keys(pages).length} official pages `
    + `against Form 1040 constants through ${IRS_PENALTY_RULES.verified_at}`,
  );

  return {
    rules: IRS_PENALTY_RULES,
    retrieved_at,
    pages_verified: Object.keys(pages),
    sources: Object.fromEntries(
      Object.entries(IRS_PENALTY_RULE_URLS).map(([key, url]) => [
        key,
        { url, retrieved_at: pages[key]?.retrieved_at || retrieved_at },
      ]),
    ),
    source: {
      id: SOURCE_ID,
      name: 'IRS Form 1040 failure-to-file, failure-to-pay, interest, and penalty-relief rules',
      publisher: 'U.S. Internal Revenue Service',
      home_url: IRS_PENALTY_RULE_URLS.failure_to_file,
      license: 'U.S. federal government work — not subject to copyright (public domain).',
      robots_status: `five official IRS pages fetched through the shared robots gate ${retrieved_at}`,
      retrieved_at,
    },
  };
}
