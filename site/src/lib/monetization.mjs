// Ad eligibility is a publishing-quality decision, not a traffic switch. A state post-judgment
// reference with one observation and no jurisdiction-specific rule analysis remains useful and
// indexable, but it is not advertising inventory until its original value is deeper.
export function ratePageMayRunAds({
  isStateRate,
  isPrejudgment,
  hasDetailedRules,
  observationCount,
}) {
  if (!isStateRate) return true;
  return Boolean(isPrejudgment || hasDetailedRules || observationCount > 1);
}
