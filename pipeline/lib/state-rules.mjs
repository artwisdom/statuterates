// Safety contract for state-law calculators. Rate pages may publish a reference value with caveats,
// but a calculator can only be enabled after every rule needed for deterministic arithmetic is
// structured and verified. Missing metadata always means reference-only.

const THIRD_PARTY_HOSTS = new Set([
  'codes.findlaw.com',
  'ga.elaws.us',
  'law.justia.com',
  'colorado.public.law',
  'oregon.public.law',
]);

const OFFICIAL_PRIMARY_HOSTS = new Set([
  'alison.legislature.state.al.us',
  'myfloridacfo.com',
  'www.myfloridacfo.com',
  'www.leg.state.nv.us',
]);

// These are government or court-operated publications, but the publication is not itself the
// controlling enactment. For example, the North Carolina General Assembly explicitly labels its
// online General Statutes as unofficial.
const OFFICIAL_SECONDARY_HOSTS = new Set([
  'ncleg.gov',
  'www.ncleg.gov',
  'ncleg.net',
  'www.ncleg.net',
  'oscn.net',
  'www.oscn.net',
]);

export function classifyStateSource(source) {
  let host = '';
  let path = '';
  try {
    const url = new URL(source?.home_url || '');
    host = url.hostname.toLowerCase();
    path = url.pathname.replace(/\/+$/, '').toLowerCase();
  } catch {
    return 'unclassified';
  }
  // Georgia and Mississippi direct users to these exact LexisNexis portals from their legislature
  // sites. They are state-authorized code publications, but Lexis is still the publisher, so classify
  // only these narrow paths as official-secondary rather than blessing Lexis generally.
  if (host === 'www.lexisnexis.com'
    && ['/hottopics/gacode', '/hottopics/mscode'].includes(path)) {
    return 'official_secondary';
  }
  if (THIRD_PARTY_HOSTS.has(host)) return 'third_party_secondary';
  if (OFFICIAL_SECONDARY_HOSTS.has(host) || /official judicial source/i.test(source?.publisher || '')) {
    return 'official_secondary';
  }
  if (OFFICIAL_PRIMARY_HOSTS.has(host) || host.endsWith('.gov') || host.endsWith('.gov.uk') || /\bofficial\b/i.test(source?.publisher || '')) {
    return 'official_primary';
  }
  return 'unclassified';
}

export function referenceOnlyCalculation(source, reason = 'Historical rates and all statutory calculation branches have not yet been fully modeled.') {
  return {
    status: 'reference_only',
    source_tier: classifyStateSource(source),
    reason,
  };
}

export function stateEntityWithSafety(entity, source) {
  return {
    ...entity,
    metadata: {
      ...(entity.metadata || {}),
      calculation: entity.metadata?.calculation || referenceOnlyCalculation(source),
    },
  };
}

const READY_ENUMS = {
  rate_behavior: new Set(['fixed_at_entry', 'resets_by_period', 'changes_by_statute']),
  compounding: new Set(['simple', 'annual', 'daily']),
  day_count: new Set(['actual_365', 'actual_actual', 'statutory_table']),
};

export function validateStateCalculationMetadata(metadata) {
  const errors = [];
  const rule = metadata?.calculation;
  if (!rule) return { status: 'reference_only', errors };
  if (!['reference_only', 'ready'].includes(rule.status)) {
    return { status: rule.status, errors: [`unknown calculation status "${rule.status}"`] };
  }
  if (rule.status === 'reference_only') {
    if (!String(rule.reason || '').trim()) errors.push('reference-only rule is missing a reason');
    return { status: rule.status, errors };
  }

  if (rule.source_tier !== 'official_primary') errors.push('calculator-ready rule must use an official primary source');
  for (const [field, allowed] of Object.entries(READY_ENUMS)) {
    if (!allowed.has(rule[field])) errors.push(`calculator-ready rule has invalid or missing ${field}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rule.valid_from || '')) errors.push('calculator-ready rule is missing valid_from');
  if (rule.branches_complete !== true) errors.push('calculator-ready rule must confirm branches_complete');
  if (rule.accrual_rule_verified !== true) errors.push('calculator-ready rule must confirm accrual_rule_verified');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(rule.rule_verified_at || '')) errors.push('calculator-ready rule is missing rule_verified_at');
  return { status: rule.status, errors };
}
