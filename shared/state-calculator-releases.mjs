// Code-controlled release registry shared by the website and MCP server.
// A state calculator can be exposed only when this registry and the entity's versioned calculation
// contract both approve the same dedicated renderer.

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

export function stateCalculatorReleaseForEntity(entity) {
  const release = stateCalculatorReleaseForEntitySlug(entity?.slug);
  const rule = entity?.metadata?.calculation;
  return release
    && rule?.status === 'ready'
    && rule?.renderer_supported === true
    && rule?.renderer_id === release.rendererId
      ? release
      : null;
}
