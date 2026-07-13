/* Copyright (c) 2026. All rights reserved. */
export const CALENDAR_DATE_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/;

const MINIMUM_CALENDAR_YEAR = 1;
const CALENDAR_MONTH_INDEX_OFFSET = 1;

/** Parses a strict Gregorian YYYY-MM-DD value without applying a time zone. */
export function calendarDateToTimestamp(value: string): number | null {
  const groups = CALENDAR_DATE_PATTERN.exec(value)?.groups;
  if (groups === undefined) {
    return null;
  }

  const year = Number(groups["year"]);
  const month = Number(groups["month"]);
  const day = Number(groups["day"]);
  if (year < MINIMUM_CALENDAR_YEAR) {
    return null;
  }

  const candidate = new Date(0);
  candidate.setUTCHours(0, 0, 0, 0);
  candidate.setUTCFullYear(year, month - CALENDAR_MONTH_INDEX_OFFSET, day);

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() + CALENDAR_MONTH_INDEX_OFFSET !== month ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }
  return candidate.getTime();
}

export function isCalendarDateOnly(value: string): boolean {
  return calendarDateToTimestamp(value) !== null;
}

export function isCalendarDateBefore(
  value: string,
  reference: string,
): boolean {
  const valueTimestamp = calendarDateToTimestamp(value);
  const referenceTimestamp = calendarDateToTimestamp(reference);
  if (valueTimestamp === null || referenceTimestamp === null) {
    return false;
  }
  return valueTimestamp < referenceTimestamp;
}
