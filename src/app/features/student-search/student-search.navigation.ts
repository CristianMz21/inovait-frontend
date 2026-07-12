import type { StudentSearchFiltersVm } from "./student-search.vm";

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

  return {
    schoolId,
    gradeId,
    academicYearId,
    asOfDate: asOfDate.length > 0 ? asOfDate : null,
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

  return {
    schoolId,
    gradeId,
    academicYearId,
    ...(asOfDate.length > 0 ? { asOfDate } : {}),
  };
}

export function isCalendarDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }
  const monthLengths = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= (monthLengths[month - 1] ?? 0);
}

function positiveIntegerFromQuery(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return isPositiveInteger(parsed) ? parsed : null;
}

function isPositiveInteger(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value > 0;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
