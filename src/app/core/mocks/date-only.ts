interface DateOnly {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

const parseDateOnly = (value: string): DateOnly => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    throw new Error(`Invalid date-only value: ${value}`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date-only value: ${value}`);
  }
  return { year, month, day };
};

export const isValidDateOnly = (value: unknown): value is string => {
  if (typeof value !== "string") {
    return false;
  }
  try {
    parseDateOnly(value);
    return true;
  } catch {
    return false;
  }
};

export const currentLocalDateOnly = (): string => {
  const now = new Date();
  const year = String(now.getFullYear()).padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calculateCompletedYears = (
  birthDate: string,
  asOfDate: string,
): number => {
  const birth = parseDateOnly(birthDate);
  const asOf = parseDateOnly(asOfDate);
  let age = asOf.year - birth.year;
  if (
    asOf.month < birth.month ||
    (asOf.month === birth.month && asOf.day < birth.day)
  ) {
    age -= 1;
  }
  return age;
};
