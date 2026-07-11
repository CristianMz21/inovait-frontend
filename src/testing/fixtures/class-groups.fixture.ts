import type { ClassGroupSummary } from '../../app/core/api/dtos/class-group-summary.dto';

export const classGroupsFixture: readonly ClassGroupSummary[] = [
  { id: 10, code: 'A', schoolId: 1, academicYearId: 2, gradeId: 1 },
  { id: 11, code: 'B', schoolId: 1, academicYearId: 2, gradeId: 1 },
  { id: 20, code: 'A', schoolId: 1, academicYearId: 2, gradeId: 2 },
];

export const emptyClassGroupsFixture: readonly ClassGroupSummary[] = [];
