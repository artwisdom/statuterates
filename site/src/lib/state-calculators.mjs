// Code-controlled release registry for state-specific dollar calculators.
//
// A state can appear here only after its calculation metadata and dedicated renderer pass review.
// There is intentionally no environment flag that can publish every state at once.

export const STATE_CALCULATOR_RELEASES = Object.freeze({
  florida: Object.freeze({
    base: 'florida',
    name: 'Florida',
    entitySlug: 'florida-judgment-rate',
    rendererId: 'florida-postjudgment-v1',
    path: '/calculators/florida-judgment-interest/',
    summary: 'The audited §55.03 method: CFO rate at entry, annual January 1 adjustments, daily simple interest, and a transparent period schedule.',
  }),
});

export const APPROVED_STATE_CALCULATOR_PATHS = Object.freeze(
  Object.values(STATE_CALCULATOR_RELEASES).map((release) => release.path),
);

export function stateCalculatorReleaseForBase(base) {
  return STATE_CALCULATOR_RELEASES[base] || null;
}

export function stateCalculatorReleaseForEntitySlug(entitySlug) {
  return Object.values(STATE_CALCULATOR_RELEASES)
    .find((release) => release.entitySlug === entitySlug) || null;
}
