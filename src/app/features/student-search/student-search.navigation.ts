/* Copyright (c) 2026. All rights reserved. */
import type { StudentSearchFiltersVm } from "./student-search.vm";
import { isCalendarDateOnly } from "../../core/dates/calendar-date";

export interface StudentSearchQueryValues {
  readonly schoolId: string | null;
  readonly gradeId: string | null;
  readonly academicYearId: string | null;
  readonly asOfDate: string | null;
}

export interface StudentSearchQueryParams {
  readonly schoolId: number;
  readonly gradeId: number;
  readonly academicYearId: number;
  readonly asOfDate?: string;
}

/** Restores only a complete, non-sensitive academic search from the URL. */
export function studentSearchFiltersFromQueryValues(
  values: StudentSearchQueryValues,
): StudentSearchFiltersVm | null {
  const schoolId = positiveIntegerFromQuery(values.schoolId);
  const gradeId = positiveIntegerFromQuery(values.gradeId);
  const academicYearId = positiveIntegerFromQuery(values.academicYearId);
  if (schoolId === null || gradeId === null || academicYearId === null) {
    return null;
  }

  const asOfDate = values.asOfDate?.trim() ?? "";
  if (asOfDate.length > 0 && !isCalendarDateOnly(asOfDate)) {
    return null;
  }

  let normalizedAsOfDate: string | null = null;
  if (asOfDate.length > 0) {
    normalizedAsOfDate = asOfDate;
  }

  return {
    schoolId,
    gradeId,
    academicYearId,
    asOfDate: normalizedAsOfDate,
  };
}

/** Serializes a valid form value into the public, non-sensitive route shape. */
export function studentSearchFiltersToQueryParams(
  filters: StudentSearchFiltersVm,
): StudentSearchQueryParams | null {
  const { schoolId, gradeId, academicYearId } = filters;
  if (
    !isPositiveInteger(schoolId) ||
    !isPositiveInteger(gradeId) ||
    !isPositiveInteger(academicYearId)
  ) {
    return null;
  }

  const asOfDate = filters.asOfDate?.trim() ?? "";
  if (asOfDate.length > 0 && !isCalendarDateOnly(asOfDate)) {
    return null;
  }

  if (asOfDate.length > 0) {
    return {
      schoolId,
      gradeId,
      academicYearId,
      asOfDate,
    };
  }
  return {
    schoolId,
    gradeId,
    academicYearId,
  };
}

function positiveIntegerFromQuery(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  if (!isPositiveInteger(parsed)) {
    return null;
  }
  return parsed;
}

function isPositiveInteger(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value > 0;
}
