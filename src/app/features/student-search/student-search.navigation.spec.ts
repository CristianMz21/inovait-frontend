import { describe, expect, it } from "vitest";
import { isCalendarDateOnly } from "../../core/dates/calendar-date";
import {
  studentSearchFiltersFromQueryValues,
  studentSearchFiltersToQueryParams,
} from "./student-search.navigation";

const LEAP_DAY = "2024-02-29";

describe("student search route codec", () => {
  it("round-trips a complete non-sensitive search with a leap day", () => {
    const filters = studentSearchFiltersFromQueryValues({
      schoolId: "1",
      gradeId: "2",
      academicYearId: "3",
      asOfDate: LEAP_DAY,
    });

    expect(filters).toEqual({
      schoolId: 1,
      gradeId: 2,
      academicYearId: 3,
      asOfDate: LEAP_DAY,
    });
    if (filters === null) {
      throw new Error("Expected valid route filters");
    }
    expect(studentSearchFiltersToQueryParams(filters)).toEqual({
      schoolId: 1,
      gradeId: 2,
      academicYearId: 3,
      asOfDate: LEAP_DAY,
    });
  });

  it.each([
    "0000-01-01",
    "1900-02-29",
    "2026-00-10",
    "2026-01-00",
    "2026-1-01",
    "2026-02-29",
    "2026-02-31",
    "2026-04-31",
    "2026-13-01",
    "not-a-date",
  ])("rejects impossible or malformed date %s", asOfDate => {
    expect(isCalendarDateOnly(asOfDate)).toBe(false);
    expect(
      studentSearchFiltersFromQueryValues({
        schoolId: "1",
        gradeId: "1",
        academicYearId: "2",
        asOfDate,
      }),
    ).toBeNull();
  });

  it.each(["0001-01-01", LEAP_DAY, "2000-02-29", "2026-12-31", "9999-12-31"])(
    "accepts calendar-valid date %s",
    asOfDate => {
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
