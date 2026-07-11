import type { SchoolSummary } from "./school-summary.dto";
import type {
  TeacherContractEffectiveStatus,
  TeacherContractPersistedStatus,
} from "./school-teacher-summary.dto";

export interface TeacherContractResponse {
  readonly id: number;
  readonly teacherId: number;
  readonly school: SchoolSummary;
  readonly startDate: string;
  readonly endDate: string | null;
  readonly persistedStatus: TeacherContractPersistedStatus;
  readonly effectiveStatus: TeacherContractEffectiveStatus;
  readonly evaluatedAt: string;
}
