import { describe, expect, it } from "vitest";
import { ApiProblemError } from "./api-problem-error";
import { toSafeApiProblem } from "./to-safe-api-problem";

describe("toSafeApiProblem", () => {
  it("preserves an already normalized API problem", () => {
    const normalized = new ApiProblemError({
      type: "about:blank/conflict",
      title: "Conflict",
      status: 409,
      code: "enrollment_conflict",
    });

    expect(toSafeApiProblem(normalized)).toBe(normalized.problem);
  });

  it("maps unexpected values to a safe terminal fallback", () => {
    expect(toSafeApiProblem(new Error("sensitive internal detail"))).toEqual({
      type: "about:blank/unexpected-client-error",
      title: "Error inesperado",
      status: 0,
      code: "unknown_error",
      detail: null,
    });
    expect(toSafeApiProblem(null).code).toBe("unknown_error");
  });
});
