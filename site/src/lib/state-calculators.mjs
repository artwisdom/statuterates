// Website-facing re-export of the state-calculator release registry. The source of truth lives in
// shared/ so both this static site and the MCP server enforce the identical fail-closed contract.
export {
  APPROVED_STATE_CALCULATOR_PATHS,
  STATE_CALCULATOR_RELEASES,
  stateCalculatorReleaseForBase,
  stateCalculatorReleaseForEntity,
  stateCalculatorReleaseForEntitySlug,
} from '../../../shared/state-calculator-releases.mjs';
