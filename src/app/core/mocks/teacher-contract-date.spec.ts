import { afterEach, describe, expect, it, vi } from "vitest";
import type { TeacherContractResponse } from "../api/dtos/teacher-contract-response.dto";
import { teacherContractsListedFixture } from "../../../testing/fixtures/teacher-contracts.fixture";
import {
  currentLocalDateOnly,
  evaluateTeacherContract,
} from "./teacher-contract-date";

const confirmedContract: TeacherContractResponse = {
  id: 1,
  teacherId: 5,
  school: { id: 2, name: "Instituto Horizonte", sector: "Private" },
  startDate: "2026-03-01",
  endDate: "2026-11-30",
  persistedStatus: "Confirmed",
  effectiveStatus: "Effective",
  evaluatedAt: "2026-07-10",
};

describe("teacher contract date evaluation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["2026-02-28", "Upcoming"],
    ["2026-03-01", "Effective"],
    ["2026-11-30", "Effective"],
    ["2026-12-01", "Expired"],
  ] as const)("evaluates %s as %s", (asOfDate, expectedStatus) => {
    expect(evaluateTeacherContract(confirmedContract, asOfDate)).toMatchObject({
      effectiveStatus: expectedStatus,
      evaluatedAt: asOfDate,
    });
  });

  it("preserves a Cancelled DTO for every cutoff without inventing a cancellation date", () => {
    const cancelled = {
      ...confirmedContract,
      persistedStatus: "Cancelled" as const,
    };

    for (const cutoff of ["2020-01-01", "2026-07-10", "2030-01-01"]) {
      expect(evaluateTeacherContract(cancelled, cutoff)).toMatchObject({
        effectiveStatus: "Cancelled",
        evaluatedAt: cutoff,
      });
    }
  });

  it("uses persistedStatus as the cancellation anchor for the canonical listed fixture row", () => {
    const [cancelledRow] = teacherContractsListedFixture;
    if (!cancelledRow) {
      throw new Error("fixture vacío");
    }
    expect(cancelledRow).toMatchObject({
      id: 20,
      persistedStatus: "Cancelled",
    });

    const endDate = cancelledRow.endDate;
    if (endDate === null) {
      throw new Error("la fila cancelada debe tener endDate");
    }

    for (const cutoff of [
      "2024-12-31",
      cancelledRow.startDate,
      "2025-12-19",
      endDate,
      "2027-01-01",
    ]) {
      const evaluated = evaluateTeacherContract(cancelledRow, cutoff);
      expect(evaluated).toMatchObject({
        id: 20,
        persistedStatus: "Cancelled",
        effectiveStatus: "Cancelled",
        evaluatedAt: cutoff,
      });
      expect(evaluated.effectiveStatus).toBe("Cancelled");
    }
  });

  it("uses the current local date without parsing a date-only string", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 1, 29, 23, 30, 0));

    expect(currentLocalDateOnly()).toBe("2028-02-29");
  });
});
