// Shared fail-closed classification for machine-facing "current value" surfaces.
//
// Historical observations remain available with provenance. A record is withheld from current
// integrations when the current official value is unverified or when its numeric observation
// represents only one legal branch and the record cannot select the user's controlling branch.

export const UNVERIFIED_LAST_RECORDED_STATUS = 'unverified_last_recorded';
export const BRANCH_PARTIAL_STATUS = 'branch_partial_reference_only';

export const UNVERIFIED_LAST_RECORDED_LABEL =
  'LAST RECORDED — current official rate unverified';
export const BRANCH_PARTIAL_LABEL =
  'CURRENT VALUE WITHHELD — legal branch selection required';

export function machineCurrentGuard(record) {
  const metadata = record?.metadata || {};
  const calculation = metadata.calculation || {};
  if (metadata.current_rate_status === UNVERIFIED_LAST_RECORDED_STATUS) {
    return {
      status: UNVERIFIED_LAST_RECORDED_STATUS,
      label: UNVERIFIED_LAST_RECORDED_LABEL,
      reason: calculation.reason
        || 'The current official rate could not be independently verified; the numeric observation is historical provenance only.',
    };
  }

  if (metadata.current_rate_status === BRANCH_PARTIAL_STATUS) {
    return {
      status: BRANCH_PARTIAL_STATUS,
      label: BRANCH_PARTIAL_LABEL,
      reason: calculation.reason
        || 'The recorded percentage covers only a legal branch or headline case; an automated consumer cannot select the controlling branch.',
    };
  }

  return null;
}

export function isMachineCurrentUsable(record) {
  return machineCurrentGuard(record) === null;
}

export function machineCurrentStatusFields(record) {
  const guard = machineCurrentGuard(record);
  if (!guard) return {};
  return {
    current_rate_status: guard.status,
    current_rate_label: guard.label,
    machine_current_usable: false,
    current_value_unavailable_reason: guard.reason,
  };
}

export function withMachineCurrentGuard(record) {
  const guard = machineCurrentGuard(record);
  if (!guard) return record;
  return {
    ...record,
    // `latest` is a backwards-compatible alias for `current`; both must fail closed together.
    latest: {},
    current: {},
    ...machineCurrentStatusFields(record),
    metadata: {
      ...record.metadata,
      current_rate_status: guard.status,
      current_rate_label: guard.label,
      current_rate_numeric: null,
      machine_current_usable: false,
      current_value_unavailable_reason: guard.reason,
      ...(guard.status === UNVERIFIED_LAST_RECORDED_STATUS
        ? { current_official_rate_verified: false }
        : {}),
    },
  };
}

function newestCurrentObservation(record, metric) {
  return (record?.history?.[metric] || [])
    .filter((observation) => observation.effective_date <= record.current_as_of)
    .reduce((newest, observation) => (
      !newest || observation.effective_date > newest.effective_date ? observation : newest
    ), null);
}

export function csvObservationUsage(record, metric, observation) {
  const guard = machineCurrentGuard(record);
  if (guard) {
    return {
      record_usage: guard.status === UNVERIFIED_LAST_RECORDED_STATUS
        ? 'historical_provenance_only'
        : 'branch_limited_reference_only',
      current_use_allowed: false,
      current_rate_status: guard.status,
    };
  }
  if (observation.effective_date > record.current_as_of) {
    return {
      record_usage: 'announced_future',
      current_use_allowed: false,
      current_rate_status: 'not_yet_in_force',
    };
  }
  const current = newestCurrentObservation(record, metric);
  const isCurrent = current?.effective_date === observation.effective_date
    && current?.source_id === observation.source_id;
  return {
    record_usage: isCurrent ? 'current_value' : 'historical_observation',
    current_use_allowed: isCurrent,
    current_rate_status: isCurrent ? 'verified_current' : 'historical_only',
  };
}
