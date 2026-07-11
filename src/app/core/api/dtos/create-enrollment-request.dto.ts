import type { StudentIdentityInput } from "./student-identity-input.dto";

export interface CreateEnrollmentRequest {
  readonly student: StudentIdentityInput;
  readonly schoolId: number;
  readonly academicYearId: number;
  readonly gradeId: number;
  readonly classGroupId: number;
}
