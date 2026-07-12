import { describe, expect, it } from "vitest";
import {
  isCalendarDateOnly,
  studentSearchFiltersFromQueryValues,
  studentSearchFiltersToQueryParams,
} from "./student-search.navigation";

describe("student search route codec", () => {
  it("round-trips a complete non-sensitive search with a leap day", () => {
    const filters = studentSearchFiltersFromQueryValues({
      schoolId: "1",
      gradeId: "2",
      academicYearId: "3",
      asOfDate: "2024-02-29",
    });

    expect(filters).toEqual({
      schoolId: 1,
      gradeId: 2,
      academicYearId: 3,
      asOfDate: "2024-02-29",
    });
    if (filters === null) {
      throw new Error("Expected valid route filters");
    }
    expect(studentSearchFiltersToQueryParams(filters)).toEqual({
      schoolId: 1,
      gradeId: 2,
      academicYearId: 3,
      asOfDate: "2024-02-29",
    });
  });

  it.each(["2026-02-29", "2026-02-31", "2025-04-31", "not-a-date"])(
    "rejects impossible or malformed date %s",
    (asOfDate) => {
      expect(isCalendarDateOnly(asOfDate)).toBe(false);
      expect(
        studentSearchFiltersFromQueryValues({
          schoolId: "1",
          gradeId: "1",
          academicYearId: "2",
          asOfDate,
        }),
      ).toBeNull();
    },
  );

  it.each(["2024-02-29", "2000-02-29", "2026-12-31"])(
    "accepts calendar-valid date %s",
    (asOfDate) => {
      expect(isCalendarDateOnly(asOfDate)).toBe(true);
    },
  );

  it("rejects incomplete or invalid academic identifiers", () => {
    expect(
      studentSearchFiltersFromQueryValues({
        schoolId: "0",
        gradeId: "x",
        academicYearId: null,
        asOfDate: null,
      }),
    ).toBeNull();
  });
});
