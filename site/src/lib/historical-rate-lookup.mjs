// Backwards-compatible site import; the website, static API, and MCP server all use the same
// fail-closed selector and release contract.
export {
  APPROVED_HISTORICAL_RATE_SLUGS,
  HISTORICAL_RATE_RELEASES,
  historicalRateAtDate,
  historicalRateReleaseForEntitySlug,
  historicalRateSeriesForEntity,
  releasedHistoricalValue,
} from '../../../shared/historical-rate-releases.mjs';
