import { HttpResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { academicYearsFixture } from "../../../testing/fixtures/academic-years.fixture";
import { gradesFixture } from "../../../testing/fixtures/grades.fixture";
import { schoolsFixture } from "../../../testing/fixtures/schools.fixture";
import { subjectsFixture } from "../../../testing/fixtures/subjects.fixture";
import { teachersFixture } from "../../../testing/fixtures/teachers.fixture";
import type {
  MockHandlerContext,
  MockHttpMethod,
  MockRoute,
} from "./mock-types";
import { extractPathParams, matchPath } from "./mock-route-matcher";
import { MOCK_ROUTES } from "./mock-routes";

const expectedRoutes = [
  "GET /api/schools",
  "GET /api/grades",
  "GET /api/academic-years",
  "GET /api/teachers",
  "GET /api/subjects",
  "GET /api/class-groups",
  "GET /api/schools/{id}/teachers",
  "GET /api/enrollments",
  "POST /api/enrollments",
  "GET /api/students/{documentType}/{documentNumber}/history",
  "GET /api/teachers/{teacherId}/contracts",
  "POST /api/teachers/{teacherId}/contracts",
  "GET /api/reports/age-distribution",
  "GET /api/reports/top-schools",
  "GET /api/reports/teacher-counts-by-sector",
] as const;

describe("MOCK_ROUTES", () => {
  afterEach(() => {
    vi.useRealTimers();
  });
  it("keeps the complete typed route table centralized", () => {
    expect(
      MOCK_ROUTES.map(route => `${route.method} ${route.pattern}`),
    ).toEqual(expectedRoutes);
  });

  it("serves every catalog fixture through a JSON HttpResponse", async () => {
    const cases = [
      ["/api/schools", schoolsFixture],
      ["/api/grades", gradesFixture],
      ["/api/academic-years", academicYearsFixture],
      ["/api/teachers", teachersFixture],
      ["/api/subjects", subjectsFixture],
    ] as const;

    for (const [path, expected] of cases) {
      const response = await execute("GET", path);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(response.body).toEqual(expected);
    }
  });

  it("filters class groups by all declared query parameters", async () => {
    const response = await execute("GET", "/api/class-groups", {
      params: { schoolId: "1", gradeId: "1", academicYearId: "2" },
    });
    const groups = response.body as readonly {
      schoolId: number;
      gradeId: number;
      academicYearId: number;
    }[];

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every(group => group.schoolId === 1)).toBe(true);
    expect(groups.every(group => group.gradeId === 1)).toBe(true);
    expect(groups.every(group => group.academicYearId === 2)).toBe(true);
  });

  it("extracts decoded path parameters and returns school teachers", async () => {
    expect(
      extractPathParams(
        "/api/students/{documentType}/{documentNumber}/history",
        "/api/students/DNI/99.001.101/history",
      ),
    ).toEqual({ documentType: "DNI", documentNumber: "99.001.101" });

    const populated = await execute("GET", "/api/schools/1/teachers");
    const empty = await execute("GET", "/api/schools/2/teachers");
    expect(populated.body).toHaveLength(teachersFixture.length);
    expect(empty.body).toEqual([]);
  });

  it("keeps matching enrollments and recalculates completed years at asOfDate", async () => {
    const birthday = await execute("GET", "/api/enrollments", {
      params: {
        schoolId: "1",
        gradeId: "1",
        academicYearId: "2",
        asOfDate: "2026-07-10",
      },
    });
    const dayBefore = await execute("GET", "/api/enrollments", {
      params: {
        schoolId: "1",
        gradeId: "1",
        academicYearId: "2",
        asOfDate: "2025-07-09",
      },
    });

    expect(birthday.body).toMatchObject([{ age: 8 }, { age: 9 }]);
    expect(dayBefore.body).toMatchObject([{ age: 6 }, { age: 8 }]);
  });

  it("returns 201 for both declared create operations", async () => {
    const enrollment = await execute("POST", "/api/enrollments", {
      body: {
        student: {
          documentType: "DNI",
          documentNumber: "99.001.101",
          firstNames: "Ana María",
          lastNames: "Solís",
          birthDate: "2018-07-10",
        },
        schoolId: 1,
        academicYearId: 2,
        gradeId: 1,
        classGroupId: 10,
      },
    });
    const contracts = await execute("POST", "/api/teachers/10/contracts", {
      body: { schoolIds: [2], startDate: "2026-03-01" },
    });
    expect(enrollment.status).toBe(201);
    expect(contracts.status).toBe(201);
  });

  it("returns declared ProblemDetails for invalid writes", async () => {
    await expect(
      execute("POST", "/api/enrollments", { body: {} }),
    ).rejects.toMatchObject({
      status: 400,
      error: { code: "invalid_request" },
    });
    await expect(
      execute("POST", "/api/teachers/10/contracts", {
        body: { schoolIds: [] },
      }),
    ).rejects.toMatchObject({
      status: 400,
      error: { code: "invalid_request" },
    });
    await expect(
      execute("POST", "/api/teachers/10/contracts", {
        body: { schoolIds: [1], startDate: "2026-03-01" },
      }),
    ).rejects.toMatchObject({
      status: 409,
      error: { code: "teacher_contract_conflict" },
    });
  });

  it.each([
    [{}, ["student", "schoolId", "academicYearId", "gradeId", "classGroupId"]],
    [
      {
        student: {
          documentNumber: "99.001.101",
          firstNames: "Ana",
          lastNames: "Solís",
          birthDate: "2018-07-10",
        },
        schoolId: 1,
        academicYearId: 2,
        gradeId: 1,
        classGroupId: 10,
      },
      ["student.documentType"],
    ],
  ])("validates all required enrollment fields", async (body, fields) => {
    const error = await execute("POST", "/api/enrollments", { body }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toMatchObject({
      status: 400,
      error: { code: "invalid_request" },
    });
    for (const field of fields) {
      expect(
        (error as { error: { errors: Record<string, unknown> } }).error.errors,
      ).toHaveProperty(field);
    }
  });

  it.each([
    [{ schoolIds: [2] }, 400, "invalid_request"],
    [{ schoolIds: [], startDate: "2026-03-01" }, 400, "invalid_request"],
    [{ schoolIds: [2], startDate: "2026-02-31" }, 400, "invalid_request"],
    [
      { schoolIds: [2], startDate: "2026-03-01", endDate: "2026-02-28" },
      422,
      "business_rule_violation",
    ],
    [
      { schoolIds: [2, 2], startDate: "2026-03-01" },
      409,
      "teacher_contract_conflict",
    ],
  ])("validates teacher-contract body %j", async (body, status, code) => {
    await expect(
      execute("POST", "/api/teachers/10/contracts", { body }),
    ).rejects.toMatchObject({ status, error: { code } });
  });

  it.each([
    [
      "GET",
      "/api/enrollments",
      {
        schoolId: "1",
        gradeId: "1",
        academicYearId: "2",
        asOfDate: "2026-02-31",
      },
    ],
    ["GET", "/api/teachers/10/contracts", { asOfDate: "2026-13-01" }],
    [
      "GET",
      "/api/reports/age-distribution",
      { academicYearId: "2", asOfDate: "2026-00-01" },
    ],
    [
      "GET",
      "/api/reports/teacher-counts-by-sector",
      { periodStart: "2026-02-31", periodEnd: "2026-03-01" },
    ],
  ] as const)(
    "rejects malformed query dates on %s %s",
    async (method, path, params) => {
      await expect(execute(method, path, { params })).rejects.toMatchObject({
        status: 400,
        error: { code: "invalid_request" },
      });
    },
  );

  it("supports student-history success, empty assignments, and 404", async () => {
    const normal = await execute("GET", "/api/students/DNI/99.001.101/history");
    const noAssignments = await execute(
      "GET",
      "/api/students/DNI/88.200.300/history",
    );
    expect(
      (normal.body as { enrollments: readonly unknown[] }).enrollments,
    ).toHaveLength(1);
    expect(
      (noAssignments.body as { enrollments: readonly unknown[] }).enrollments,
    ).toHaveLength(1);
    await expect(
      execute("GET", "/api/students/DNI/99.001.404/history"),
    ).rejects.toMatchObject({
      status: 404,
      error: { code: "student_not_found" },
    });
  });

  it("keeps teacher contract history and recomputes status before/during/after", async () => {
    expect(
      (await execute("GET", "/api/teachers/10/contracts")).body,
    ).not.toEqual([]);
    const before = (
      await execute("GET", "/api/teachers/10/contracts", {
        params: { asOfDate: "2025-01-01" },
      })
    ).body as readonly {
      readonly id: number;
      readonly effectiveStatus: string;
      readonly evaluatedAt: string;
    }[];
    const during = (
      await execute("GET", "/api/teachers/10/contracts", {
        params: { asOfDate: "2025-06-01" },
      })
    ).body as typeof before;
    const after = (
      await execute("GET", "/api/teachers/10/contracts", {
        params: { asOfDate: "2026-01-01" },
      })
    ).body as typeof before;

    expect(before).toHaveLength(2);
    expect(during).toHaveLength(2);
    expect(after).toHaveLength(2);
    expect(before.find(({ id }) => id === 20)).toMatchObject({
      effectiveStatus: "Cancelled",
      evaluatedAt: "2025-01-01",
    });
    expect(during.find(({ id }) => id === 20)).toMatchObject({
      effectiveStatus: "Cancelled",
      evaluatedAt: "2025-06-01",
    });
    expect(after.find(({ id }) => id === 20)).toMatchObject({
      effectiveStatus: "Cancelled",
      evaluatedAt: "2026-01-01",
    });
    await expect(
      execute("GET", "/api/teachers/9999/contracts"),
    ).rejects.toMatchObject({
      status: 404,
      error: { code: "resource_not_found" },
    });
  });

  it("evaluates teacher contracts at the current local date when asOfDate is omitted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 1, 29, 12, 0, 0));

    const responsePromise = execute("GET", "/api/teachers/10/contracts");
    await vi.advanceTimersByTimeAsync(120);
    const rows = (await responsePromise).body as readonly {
      readonly evaluatedAt: string;
    }[];

    expect(rows).toHaveLength(2);
    expect(rows.every(({ evaluatedAt }) => evaluatedAt === "2028-02-29")).toBe(
      true,
    );
  });

  it("supports every report success, empty, and validation branch", async () => {
    expect(
      (
        await execute("GET", "/api/reports/age-distribution", {
          params: { academicYearId: "2" },
        })
      ).body,
    ).toMatchObject({ academicYearId: 2 });
    expect(
      (
        await execute("GET", "/api/reports/top-schools", {
          params: { academicYearId: "1" },
        })
      ).body,
    ).toEqual([]);
    expect(
      (
        await execute("GET", "/api/reports/teacher-counts-by-sector", {
          params: { periodStart: "2026-01-01", periodEnd: "2026-12-31" },
        })
      ).body,
    ).toMatchObject({ periodStart: "2026-01-01", periodEnd: "2026-12-31" });
    await expect(
      execute("GET", "/api/reports/age-distribution"),
    ).rejects.toMatchObject({
      status: 400,
      error: { code: "invalid_request" },
    });
    await expect(
      execute("GET", "/api/reports/top-schools", {
        params: { academicYearId: "0" },
      }),
    ).rejects.toMatchObject({
      status: 400,
      error: { code: "invalid_request" },
    });
    await expect(
      execute("GET", "/api/reports/teacher-counts-by-sector", {
        params: { periodStart: "2026-12-31", periodEnd: "2026-01-01" },
      }),
    ).rejects.toMatchObject({ status: 422, error: { code: "period_invalid" } });
  });

  it("matches exact paths, placeholders, methods, and segment counts", () => {
    expect(matchPath("/api/schools", "/api/schools")).toBe(true);
    expect(
      matchPath("/api/teachers/{id}/contracts", "/api/teachers/42/contracts"),
    ).toBe(true);
    expect(matchPath("/api/teachers/{id}", "/api/teachers/42/contracts")).toBe(
      false,
    );
    expect(matchPath("/api/schools", "/api/teachers")).toBe(false);
    expect(findRoute("POST", "/api/schools")).toBeUndefined();
  });
});

function findRoute(
  method: MockHttpMethod,
  path: string,
): MockRoute | undefined {
  return MOCK_ROUTES.find(
    route => route.method === method && matchPath(route.pattern, path),
  );
}

function requireRoute(method: MockHttpMethod, path: string): MockRoute {
  const route = findRoute(method, path);
  if (!route) {
    throw new Error(`Missing mock route for ${method} ${path}`);
  }
  return route;
}

function buildContext(
  method: MockHttpMethod,
  path: string,
  overrides: Partial<MockHandlerContext> = {},
): MockHandlerContext {
  const route = requireRoute(method, path);
  return {
    method,
    url: path,
    params: overrides.params ?? {},
    pathParams: overrides.pathParams ?? extractPathParams(route.pattern, path),
    body: overrides.body,
    request: overrides.request,
  };
}

async function execute(
  method: MockHttpMethod,
  path: string,
  overrides: Partial<MockHandlerContext> = {},
): Promise<HttpResponse<unknown>> {
  const route = requireRoute(method, path);
  return firstValueFrom(route.handler(buildContext(method, path, overrides)));
}
