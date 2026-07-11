import type { AcademicYearSummary } from "../../app/core/api/dtos/academic-year-summary.dto";

export const academicYearsFixture: readonly AcademicYearSummary[] = [
  {
    id: 1,
    name: "2025",
    startDate: "2025-03-03",
    endDate: "2025-12-19",
    isCurrent: false,
  },
  {
    id: 2,
    name: "2026",
    startDate: "2026-03-02",
    endDate: "2026-12-18",
    isCurrent: true,
  },
];
