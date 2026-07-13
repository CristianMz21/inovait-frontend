/* Copyright (c) 2026. All rights reserved. */
import type { TeacherContractResponse } from "../api/dtos/teacher-contract-response.dto";
import { compareDateOnly } from "./date-only";

export { currentLocalDateOnly } from "./date-only";

/**
 * Evaluates the temporal status exposed by the public teacher-contract DTO.
 *
 * CancellationEffectiveDate is intentionally not part of that DTO. The mock
 * backend therefore uses `persistedStatus === "Cancelled"` as the canonical
 * semantic anchor: a persisted cancellation is preserved across every cutoff
 * without inventing a cancellation date. Non-cancelled snapshots are fully
 * derivable from their inclusive start/end interval.
 */
export const evaluateTeacherContract = (
  contract: TeacherContractResponse,
  asOfDate: string,
): TeacherContractResponse => {
  let effectiveStatus: TeacherContractResponse["effectiveStatus"];
  if (contract.persistedStatus === "Cancelled") {
    effectiveStatus = "Cancelled";
  } else if (compareDateOnly(asOfDate, contract.startDate) < 0) {
    effectiveStatus = "Upcoming";
  } else if (
    contract.endDate !== null &&
    compareDateOnly(asOfDate, contract.endDate) > 0
  ) {
    effectiveStatus = "Expired";
  } else {
    effectiveStatus = "Effective";
  }
  return { ...contract, effectiveStatus, evaluatedAt: asOfDate };
};
