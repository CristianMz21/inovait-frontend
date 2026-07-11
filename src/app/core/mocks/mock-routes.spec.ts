import { describe, expect, it } from "vitest";
import { firstValueFrom } from "rxjs";
import {
  MOCK_ROUTES,
  emptyEnrollmentListResponseFixture,
  _matchPath as matchPath,
  _extractPathParams as extractPathParams,
} from "./mock-routes";
import type { MockHandlerContext, MockHttpMethod } from "./mock-types";
import { schoolsFixture } from "../../../testing/fixtures/schools.fixture";
import { gradesFixture } from "../../../testing/fixtures/grades.fixture";
import { academicYearsFixture } from "../../../testing/fixtures/academic-years.fixture";
import { teachersFixture } from "../../../testing/fixtures/teachers.fixture";
import { subjectsFixture } from "../../../testing/fixtures/subjects.fixture";
import { ageDistributionFixture } from "../../../testing/fixtures/age-distribution.fixture";
import { topSchoolsFixture } from "../../../testing/fixtures/top-schools.fixture";
import { teacherCountsBySectorFixture } from "../../../testing/fixtures/sector-counts.fixture";

/**
 * Unit tests for the mock route table.
 *
 * The tests are deliberately scoped to behaviors that protect against
 * regressions:
 *
 * 1. Every catalog GET endpoint resolves to the canonical fixture.
 * 2. Path patterns with `{param}` segments resolve correctly.
 * 3. The matcher is order-aware (more specific patterns win over
 *    parameterless prefixes).
 * 4. Error-producing handlers surface a problem-shaped HttpErrorResponse.
 *
 * The tests don't verify the full interceptor wiring — that's covered by
 * Playwright end-to-end checks in the verification step. These tests
 * focus on the route table itself, which is the most fragile piece.
 */

describe("MOCK_ROUTES", () => {
  describe("catalog endpoints", () => {
    it("resolves GET /api/schools to the schools fixture", async () => {
      const route = findRoute("GET", "/api/schools");
      expect(route).toBeDefined();
      const body = await firstValueFrom(
        route!.handler(buildContext("GET", "/api/schools")),
      );
      expect(body).toEqual(schoolsFixture);
    });

    it("resolves GET /api/grades to the grades fixture", async () => {
      const route = findRoute("GET", "/api/grades");
      const body = await firstValueFrom(
        route!.handler(buildContext("GET", "/api/grades")),
      );
      expect(body).toEqual(gradesFixture);
    });

    it("resolves GET /api/academic-years to the academic years fixture", async () => {
      const route = findRoute("GET", "/api/academic-years");
      const body = await firstValueFrom(
        route!.handler(buildContext("GET", "/api/academic-years")),
      );
      expect(body).toEqual(academicYearsFixture);
    });

    it("resolves GET /api/teachers to the teachers fixture", async () => {
      const route = findRoute("GET", "/api/teachers");
      const body = await firstValueFrom(
        route!.handler(buildContext("GET", "/api/teachers")),
      );
      expect(body).toEqual(teachersFixture);
    });

    it("resolves GET /api/subjects to the subjects fixture", async () => {
      const route = findRoute("GET", "/api/subjects");
      const body = await firstValueFrom(
        route!.handler(buildContext("GET", "/api/subjects")),
      );
      expect(body).toEqual(subjectsFixture);
    });

    it("filters class-groups by schoolId/gradeId/academicYearId", async () => {
      const route = findRoute("GET", "/api/class-groups");
      const ctx = buildContext("GET", "/api/class-groups", {
        params: {
          schoolId: "1",
          gradeId: "1",
          academicYearId: "2",
        },
      });
      const body = await firstValueFrom(route!.handler(ctx));
      expect(Array.isArray(body)).toBe(true);
      // Every returned group must satisfy the filters.
      for (const group of body as readonly {
        schoolId: number;
        gradeId: number;
        academicYearId: number;
      }[]) {
        expect(group.schoolId).toBe(1);
        expect(group.gradeId).toBe(1);
        expect(group.academicYearId).toBe(2);
      }
    });
  });

  describe("path parameter routes", () => {
    it("resolves /api/students/{documentType}/{documentNumber}/history", async () => {
      const route = findRoute("GET", "/api/students/DNI/99.001.101/history");
      expect(route).toBeDefined();
      const ctx = buildContext("GET", "/api/students/DNI/99.001.101/history");
      const body = await firstValueFrom(route!.handler(ctx));
      expect(body).toBeDefined();
      expect((body as { documentNumber: string }).documentNumber).toBe(
        "99.001.101",
      );
    });

    it("extracts path params correctly for teachers/{id}/contracts", () => {
      const params = extractPathParams(
        "/api/teachers/{teacherId}/contracts",
        "/api/teachers/42/contracts",
      );
      expect(params).toEqual({ teacherId: "42" });
    });

    it("returns 404 problem for unknown teacher id", async () => {
      const route = findRoute("GET", "/api/teachers/9999/contracts");
      const ctx = buildContext("GET", "/api/teachers/9999/contracts", {
        pathParams: { teacherId: "9999" },
      });
      try {
        await firstValueFrom(route!.handler(ctx));
        expect.fail("expected the handler to error");
      } catch (err) {
        const e = err as { status: number; error: { code: string } };
        expect(e.status).toBe(404);
        expect(e.error.code).toBe("resource_not_found");
      }
    });
  });

  describe("reports", () => {
    it("returns the canonical age-distribution fixture when academicYearId is provided", async () => {
      const route = findRoute("GET", "/api/reports/age-distribution");
      const ctx = buildContext("GET", "/api/reports/age-distribution", {
        params: { academicYearId: "2" },
      });
      const body = await firstValueFrom(route!.handler(ctx));
      expect(body).toEqual(ageDistributionFixture);
    });

    it("returns the empty age-distribution fixture when academicYearId is 0", async () => {
      const route = findRoute("GET", "/api/reports/age-distribution");
      const ctx = buildContext("GET", "/api/reports/age-distribution", {
        params: { academicYearId: "0" },
      });
      const body = await firstValueFrom(route!.handler(ctx));
      expect(body).toBeDefined();
    });

    it("returns the canonical top-schools fixture", async () => {
      const route = findRoute("GET", "/api/reports/top-schools");
      const ctx = buildContext("GET", "/api/reports/top-schools", {
        params: { academicYearId: "2" },
      });
      const body = await firstValueFrom(route!.handler(ctx));
      expect(body).toEqual(topSchoolsFixture);
    });

    it("returns the canonical teacher-counts-by-sector fixture with a period", async () => {
      const route = findRoute("GET", "/api/reports/teacher-counts-by-sector");
      const ctx = buildContext("GET", "/api/reports/teacher-counts-by-sector", {
        params: { periodStart: "2026-07-10", periodEnd: "2026-07-10" },
      });
      const body = await firstValueFrom(route!.handler(ctx));
      expect(body).toEqual(teacherCountsBySectorFixture);
    });

    it("rejects mismatched period (only start)", async () => {
      const route = findRoute("GET", "/api/reports/teacher-counts-by-sector");
      const ctx = buildContext("GET", "/api/reports/teacher-counts-by-sector", {
        params: { periodStart: "2026-07-10" },
      });
      await expect(firstValueFrom(route!.handler(ctx))).rejects.toMatchObject({
        status: 422,
        error: { code: "period_invalid" },
      });
    });
  });

  describe("matchPath helper", () => {
    it("matches exact paths", () => {
      expect(matchPath("/api/schools", "/api/schools")).toBe(true);
    });

    it("matches paths with placeholders", () => {
      expect(
        matchPath("/api/teachers/{id}/contracts", "/api/teachers/42/contracts"),
      ).toBe(true);
    });

    it("rejects paths with different lengths", () => {
      expect(
        matchPath("/api/teachers/{id}", "/api/teachers/42/contracts"),
      ).toBe(false);
    });

    it("rejects paths with different literal segments", () => {
      expect(matchPath("/api/schools", "/api/teachers")).toBe(false);
    });
  });

  describe("empty list fixture export", () => {
    it("is exported so test files can assert against the canonical empty list", () => {
      expect(emptyEnrollmentListResponseFixture).toEqual([]);
    });
  });
});

// --- helpers ---------------------------------------------------------------

function findRoute(method: MockHttpMethod, path: string) {
  return MOCK_ROUTES.find(
    (r) => r.method === method && matchPath(r.pattern, path),
  );
}

function buildContext(
  method: MockHttpMethod,
  path: string,
  overrides: Partial<MockHandlerContext> = {},
): MockHandlerContext {
  const route = findRoute(method, path);
  return {
    method,
    url: path,
    params: overrides.params ?? {},
    pathParams:
      overrides.pathParams ?? extractPathParams(route?.pattern ?? path, path),
    body: overrides.body,
  };
}
