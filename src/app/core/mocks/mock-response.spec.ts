import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { applyDelay, mockOk, mockProblem } from "./mock-response";

describe("mock response helpers", () => {
  it("preserves success status and headers", async () => {
    const response = await firstValueFrom(
      mockOk(
        { id: 10 },
        {
          delayMs: 0,
          status: 201,
          headers: { Location: "/api/enrollments/10" },
        },
      ),
    );

    expect(response).toBeInstanceOf(HttpResponse);
    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Location")).toBe("/api/enrollments/10");
    expect(response.body).toEqual({ id: 10 });
  });

  it("emits an HttpErrorResponse with ProblemDetails headers", async () => {
    await expect(
      firstValueFrom(
        mockProblem(404, "student_not_found", "Student not found", {
          delayMs: 0,
          detail: "No matching student",
        }),
      ),
    ).rejects.toMatchObject({
      status: 404,
      error: {
        status: 404,
        code: "student_not_found",
        detail: "No matching student",
      },
    });

    try {
      await firstValueFrom(
        mockProblem(400, "invalid_request", "Invalid request", { delayMs: 0 }),
      );
    } catch (error) {
      expect(error).toBeInstanceOf(HttpErrorResponse);
      expect((error as HttpErrorResponse).headers.get("Content-Type")).toBe(
        "application/problem+json",
      );
    }
  });

  it("applies the requested deterministic delay", async () => {
    vi.useFakeTimers();
    try {
      let settled = false;
      const responsePromise = firstValueFrom(
        applyDelay(mockOk("ok", { delayMs: 0 }), 20),
      );
      void responsePromise.then(() => {
        settled = true;
      });

      await vi.advanceTimersByTimeAsync(19);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      await expect(responsePromise).resolves.toMatchObject({ body: "ok" });
    } finally {
      vi.useRealTimers();
    }
  });
});
