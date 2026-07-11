import type { TeacherSummary } from "./teacher-summary.dto";

export type TeacherContractPersistedStatus = "Confirmed" | "Cancelled";
export type TeacherContractEffectiveStatus =
  "Upcoming" | "Effective" | "Expired" | "Cancelled";

export interface SchoolTeacherSummary {
  readonly teacher: TeacherSummary;
  readonly contractId: number;
  readonly persistedStatus: TeacherContractPersistedStatus;
  readonly effectiveStatus: TeacherContractEffectiveStatus;
  readonly evaluatedAt: string;
  readonly startDate: string;
  readonly endDate: string | null;
}
