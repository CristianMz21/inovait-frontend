import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, throwError } from "rxjs";
import { afterEach, describe, expect, it } from "vitest";
import { API_CONFIG, DEFAULT_API_CONFIG } from "../api/api-config";
import { ApiProblemError } from "../api/api-problem-error";
import { problemDetailsInterceptor } from "../api/problem-details.interceptor";
import { createMockBackendInterceptor } from "./mock-backend.interceptor";
import type { MockRoute } from "./mock-types";

describe("mock backend interceptor integration", () => {
  afterEach(() => TestBed.resetTestingModule());

  it("runs before ProblemDetails, adapts mock errors, and never reaches the network", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const error = await firstValueFrom(
      client.get("/api/students/DNI/99.001.404/history"),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem).toMatchObject({
      status: 404,
      code: "student_not_found",
    });
    httpTesting.expectNone("/api/students/DNI/99.001.404/history");
    httpTesting.verify();
  });

  it("preserves success status and headers through HttpClient", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const response = await firstValueFrom(
      client.post(
        "/api/enrollments",
        {
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
        { observe: "response" },
      ),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    httpTesting.expectNone("/api/enrollments");
    httpTesting.verify();
  });

  it("returns a synthetic adapted 404 for an unregistered API route", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const error = await firstValueFrom(client.get("/api/not-registered")).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem.code).toBe("mock_not_found");
    httpTesting.expectNone("/api/not-registered");
    httpTesting.verify();
  });

  it("forwards requests unchanged when mocks are disabled", () => {
    const httpTesting = configure(false);
    const client = TestBed.inject(HttpClient);
    let received: unknown;
    client.get("/api/schools").subscribe(value => (received = value));

    httpTesting.expectOne("/api/schools").flush([{ id: 99 }]);
    expect(received).toEqual([{ id: 99 }]);
    httpTesting.verify();
  });

  it("normalizes unexpected handler failures instead of leaving consumers loading", async () => {
    const routes: readonly MockRoute[] = [
      {
        method: "GET",
        pattern: "/api/unexpected",
        handler: () => throwError(() => new Error("fixture failed")),
      },
    ];
    const httpTesting = configure(true, routes);
    const client = TestBed.inject(HttpClient);

    const error = await firstValueFrom(client.get("/api/unexpected")).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem).toMatchObject({
      status: 500,
      code: "internal_error",
    });
    httpTesting.expectNone("/api/unexpected");
    httpTesting.verify();
  });

  it("preserves teacher history and evaluates each contract at asOfDate", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const contracts = await firstValueFrom(
      client.get<readonly { effectiveStatus: string; evaluatedAt: string }[]>(
        "/api/teachers/10/contracts",
        { params: { asOfDate: "2025-01-01" } },
      ),
    );

    expect(contracts).toHaveLength(2);
    expect(
      contracts.every(({ evaluatedAt }) => evaluatedAt === "2025-01-01"),
    ).toBe(true);
    expect(contracts[0]?.effectiveStatus).toBe("Cancelled");
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });

  it("enforces positive report IDs and uses a valid empty academic year", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const invalid = await firstValueFrom(
      client.get("/api/reports/top-schools", {
        params: { academicYearId: 0 },
      }),
    ).catch((caught: unknown) => caught);
    const empty = await firstValueFrom(
      client.get<readonly unknown[]>("/api/reports/top-schools", {
        params: { academicYearId: 1 },
      }),
    );

    expect(invalid).toBeInstanceOf(ApiProblemError);
    expect((invalid as ApiProblemError).problem).toMatchObject({
      status: 400,
      code: "invalid_request",
    });
    expect(empty).toEqual([]);
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });

  it("returns canonical 422 when age asOfDate precedes an included birth", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const error = await firstValueFrom(
      client.get("/api/reports/age-distribution", {
        params: { academicYearId: 2, asOfDate: "2010-01-01" },
      }),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem).toMatchObject({
      status: 422,
      code: "as_of_date_invalid",
    });
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });

  it("rejects a future enrollment birthDate through the real interceptor chain", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const error = await firstValueFrom(
      client.post("/api/enrollments", {
        student: {
          documentType: "DNI",
          documentNumber: "99.001.101",
          firstNames: "Ana María",
          lastNames: "Solís",
          birthDate: "2999-01-01",
        },
        schoolId: 1,
        academicYearId: 2,
        gradeId: 1,
        classGroupId: 10,
      }),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiProblemError);
    expect((error as ApiProblemError).problem).toMatchObject({
      status: 422,
      code: "business_rule_violation",
    });
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });

  it("returns field errors for malformed POST bodies through HttpClient", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const enrollmentError = await firstValueFrom(
      client.post("/api/enrollments", {
        student: {
          documentType: "DNI",
          documentNumber: "99.001.101",
          lastNames: "Solís",
          birthDate: "2026-02-31",
        },
        schoolId: 0,
        academicYearId: 2,
        gradeId: 1,
        classGroupId: 10,
      }),
    ).catch((caught: unknown) => caught);
    const contractError = await firstValueFrom(
      client.post("/api/teachers/10/contracts", { schoolIds: [2] }),
    ).catch((caught: unknown) => caught);

    expect(enrollmentError).toBeInstanceOf(ApiProblemError);
    const enrollmentProblem = (enrollmentError as ApiProblemError).problem;
    expect(enrollmentProblem).toMatchObject({
      status: 400,
      code: "invalid_request",
    });
    expect(enrollmentProblem.errors).toHaveProperty("student.firstNames");
    expect(enrollmentProblem.errors).toHaveProperty("student.birthDate");
    expect(enrollmentProblem.errors).toHaveProperty("schoolId");
    expect(contractError).toBeInstanceOf(ApiProblemError);
    const contractProblem = (contractError as ApiProblemError).problem;
    expect(contractProblem).toMatchObject({
      status: 400,
      code: "invalid_request",
    });
    expect(contractProblem.errors).toHaveProperty("startDate");
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });

  it("returns 400 for a malformed supported query date through HttpClient", async () => {
    const httpTesting = configure(true);
    const client = TestBed.inject(HttpClient);

    const contractError = await firstValueFrom(
      client.get("/api/teachers/10/contracts", {
        params: { asOfDate: "not-a-date" },
      }),
    ).catch((caught: unknown) => caught);

    expect((contractError as ApiProblemError).problem).toMatchObject({
      status: 400,
      code: "invalid_request",
    });
    httpTesting.expectNone(() => true);
    httpTesting.verify();
  });
});

function configure(
  enabled: boolean,
  routes?: readonly MockRoute[],
): HttpTestingController {
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(
        withInterceptors([
          createMockBackendInterceptor({
            enabled,
            loggingEnabled: false,
            routes,
          }),
          problemDetailsInterceptor,
        ]),
      ),
      provideHttpClientTesting(),
      { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
    ],
  });
  return TestBed.inject(HttpTestingController);
}
