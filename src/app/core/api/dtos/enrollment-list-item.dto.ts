import type { AcademicYearSummary } from "./academic-year-summary.dto";
import type { ClassGroupSummary } from "./class-group-summary.dto";
import type { GradeSummary } from "./grade-summary.dto";
import type { SchoolSummary } from "./school-summary.dto";

export interface EnrollmentListItem {
  readonly enrollmentId: number;
  readonly studentId: number;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly birthDate: string;
  readonly age: number;
  readonly school: SchoolSummary;
  readonly academicYear: AcademicYearSummary;
  readonly grade: GradeSummary;
  readonly classGroup: ClassGroupSummary;
}
