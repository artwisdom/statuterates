const DAY_MS = 86_400_000;

function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dueCalculatorRuleReviews(entities, {
  today = new Date().toISOString().slice(0, 10),
  leadDays = 45,
} = {}) {
  const todayDate = parseIsoDate(today);
  if (!todayDate) throw new Error(`Invalid legal-review check date ${today}`);
  if (!Number.isInteger(leadDays) || leadDays < 0) throw new Error('leadDays must be a nonnegative integer');

  return entities.flatMap((entity) => {
    const calculation = entity?.metadata?.calculation;
    if (calculation?.status !== 'ready') return [];
    const expiry = parseIsoDate(calculation.rule_review_expires_at);
    if (!expiry) return [{
      slug: entity.slug,
      name: entity.name,
      expiry: calculation.rule_review_expires_at || 'missing',
      days_remaining: null,
      reason: 'missing or invalid review expiry',
    }];
    const daysRemaining = Math.round((expiry - todayDate) / DAY_MS);
    if (daysRemaining > leadDays) return [];
    return [{
      slug: entity.slug,
      name: entity.name,
      expiry: calculation.rule_review_expires_at,
      days_remaining: daysRemaining,
      reason: daysRemaining < 0 ? 'review overdue' : 'review due soon',
    }];
  }).sort((a, b) => String(a.expiry).localeCompare(String(b.expiry)));
}

