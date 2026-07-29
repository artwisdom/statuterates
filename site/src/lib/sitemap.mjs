// A sitemap date describes when the webpage materially changed, not the age of the law it reports.
// StatuteRates first launched on this date, so no page can honestly advertise an earlier lastmod.
export const SITE_LAUNCH_DATE = '2026-07-08';

export function isIsoCalendarDate(value) {
  const date = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function dateOnly(value) {
  const date = String(value || '').slice(0, 10);
  return isIsoCalendarDate(date) ? date : null;
}

// Data pages can change when a newly published observation is retrieved, when a new observation
// takes effect, or when their editorial explanation is substantially revised. Future effective
// dates are deliberately ignored until currentObservation selects them; otherwise a preannounced
// rate would make lastmod churn on every build before it actually takes effect.
export function significantPageDate({
  currentObservation = null,
  publishedObservation = null,
  contentModified = null,
  buildDate = null,
  launchDate = SITE_LAUNCH_DATE,
} = {}) {
  const build = dateOnly(buildDate);
  const dates = [
    dateOnly(launchDate),
    dateOnly(currentObservation?.effective_date),
    dateOnly(currentObservation?.retrieved_at),
    dateOnly(publishedObservation?.retrieved_at),
    dateOnly(contentModified),
  ].filter(Boolean);

  if (!dates.length) return null;
  // Ignore a mistaken future date instead of converting it to "today." Converting it would make
  // the page appear freshly modified on every rebuild until that date arrives.
  const eligible = build ? dates.filter((date) => date <= build) : dates;
  return eligible.sort().at(-1) || null;
}
