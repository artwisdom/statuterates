// Ad eligibility is a publishing-quality decision, not a traffic switch. A state post-judgment
// reference with one observation and no jurisdiction-specific rule analysis remains useful and
// indexable, but it is not advertising inventory until its original value is deeper.
export function ratePageMayRunAds({
  isStateRate,
  isPrejudgment,
  hasDetailedRules,
  prejudgmentRules = null,
  observationCount,
  explicitlyWithheld = false,
}) {
  if (explicitlyWithheld) return false;
  if (!isStateRate) return true;
  if (isPrejudgment) {
    // A prejudgment page earns inventory status from its state-specific rule analysis, not merely
    // from belonging to the prejudgment collection. A missing or visibly truncated required field
    // fails closed even when the page still has a valid rate observation.
    return ['applies', 'accrual', 'compound'].every((field) => {
      const value = String(prejudgmentRules?.[field] || '').trim();
      return value.length > 0 && !value.includes('…');
    });
  }
  return Boolean(hasDetailedRules || observationCount > 1);
}
