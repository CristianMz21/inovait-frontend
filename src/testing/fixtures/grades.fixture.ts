import type { GradeSummary } from "../../app/core/api/dtos/grade-summary.dto";

export const gradesFixture: readonly GradeSummary[] = [
  { id: 1, name: "Grade 1", sortOrder: 1 },
  { id: 2, name: "Grade 2", sortOrder: 2 },
  { id: 3, name: "Grade 3", sortOrder: 3 },
];
