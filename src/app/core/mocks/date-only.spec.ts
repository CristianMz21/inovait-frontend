import { describe, expect, it } from "vitest";
import { calculateCompletedYears, compareDateOnly } from "./date-only";

describe("compareDateOnly", () => {
  it("compares valid date-only values numerically", () => {
    expect(compareDateOnly("2026-01-01", "2025-12-31")).toBeGreaterThan(0);
    expect(compareDateOnly("2025-12-31", "2026-01-01")).toBeLessThan(0);
    expect(compareDateOnly("2026-07-10", "2026-07-10")).toBe(0);
  });

  it("rejects malformed values instead of comparing strings", () => {
    expect(() => compareDateOnly("2026-02-30", "2026-03-01")).toThrow(
      "Invalid date-only value",
    );
  });
});

describe("calculateCompletedYears", () => {
  it("changes age on the birthday boundary", () => {
    expect(calculateCompletedYears("2018-07-10", "2026-07-09")).toBe(7);
    expect(calculateCompletedYears("2018-07-10", "2026-06-10")).toBe(7);
    expect(calculateCompletedYears("2018-07-10", "2026-07-10")).toBe(8);
  });

  it("handles leap-day birthdays without timezone conversion", () => {
    expect(calculateCompletedYears("2020-02-29", "2024-02-28")).toBe(3);
    expect(calculateCompletedYears("2020-02-29", "2024-02-29")).toBe(4);
    expect(calculateCompletedYears("2020-02-29", "2025-02-28")).toBe(4);
  });

  it("rejects malformed and impossible date-only values", () => {
    expect(() => calculateCompletedYears("2020/02/29", "2024-02-29")).toThrow(
      "Invalid date-only value",
    );
    expect(() => calculateCompletedYears("2020-02-30", "2024-02-29")).toThrow(
      "Invalid date-only value",
    );
  });
});
