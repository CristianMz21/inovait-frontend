import { HttpHeaders } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  ageDistributionFixture,
  apiProblemAsOfDateInvalidFixture,
  apiProblemBadRequestFixture,
  apiProblemNotFoundFixture,
  apiProblemPeriodInvalidFixture,
  emptyAgeDistributionFixture,
  emptyTeacherCountsBySectorFixture,
  emptyTopSchoolsFixture,
  teacherCountsBySectorFixture,
  topSchoolsFixture,
} from "../../../testing/fixtures";
import {
  ReportApiService,
  type GetAgeDistributionParams,
  type GetTopSchoolsByEnrollmentParams,
} from "./report.api.service";

const ageUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/age-distribution`;
const sectorUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/teacher-counts-by-sector`;
const topUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/top-schools`;

describe("ReportApiService (ST-RPT-AGE)", () => {
  let service: ReportApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        ReportApiService,
      ],
    });
    service = TestBed.inject(ReportApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe("getAgeDistribution()", () => {
    it("invoca GET /api/reports/age-distribution con academicYearId obligatorio", () => {
      let received: unknown;
      const params: GetAgeDistributionParams = { academicYearId: 2 };
      service
        .getAgeDistribution(params)
        .subscribe((value) => (received = value));

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("academicYearId")).toBe("2");
      // Los filtros opcionales no viajan cuando la operadora los omite.
      expect(req.request.params.has("asOfDate")).toBe(false);
      expect(req.request.params.has("schoolId")).toBe(false);
      expect(req.request.params.has("gradeId")).toBe(false);
      req.flush(ageDistributionFixture);

      expect(received).toEqual(ageDistributionFixture);
    });

    it("envía asOfDate cuando la operadora lo define", () => {
      let received: unknown;
      service
        .getAgeDistribution({ academicYearId: 2, asOfDate: "2026-07-10" })
        .subscribe((value) => (received = value));

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      expect(req.request.params.get("academicYearId")).toBe("2");
      expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
      req.flush(ageDistributionFixture);

      expect(received).toEqual(ageDistributionFixture);
    });

    it("envía schoolId y gradeId cuando la operadora los define", () => {
      let received: unknown;
      service
        .getAgeDistribution({
          academicYearId: 2,
          schoolId: 1,
          gradeId: 3,
          asOfDate: "2026-07-10",
        })
        .subscribe((value) => (received = value));

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      expect(req.request.params.get("academicYearId")).toBe("2");
      expect(req.request.params.get("schoolId")).toBe("1");
      expect(req.request.params.get("gradeId")).toBe("3");
      expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
      req.flush(emptyAgeDistributionFixture);

      expect(received).toEqual(emptyAgeDistributionFixture);
    });

    it("mapea 200 con conteos en 0 a la forma canónica (no error)", () => {
      let received: unknown;
      service
        .getAgeDistribution({ academicYearId: 2 })
        .subscribe((value) => (received = value));

      http
        .expectOne((r) => r.url === ageUrl && r.method === "GET")
        .flush(emptyAgeDistributionFixture);

      expect(received).toEqual(emptyAgeDistributionFixture);
      if (received && typeof received === "object" && "age3To7" in received) {
        const dto = received as typeof emptyAgeDistributionFixture;
        expect(dto.age3To7.count).toBe(0);
        expect(dto.age8To12.count).toBe(0);
        expect(dto.ageOver12.count).toBe(0);
      }
    });

    it("mapea 400 con ProblemDetails como error canónico", () => {
      let error: unknown;
      service.getAgeDistribution({ academicYearId: 0 }).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      req.flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(400);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "invalid_request",
      );
    });

    it("mapea 404 con ProblemDetails (recurso no encontrado)", () => {
      let error: unknown;
      service.getAgeDistribution({ academicYearId: 9999 }).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      req.flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(404);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "resource_not_found",
      );
    });

    it("mapea 422 as_of_date_invalid como error canónico", () => {
      let error: unknown;
      service
        .getAgeDistribution({ academicYearId: 2, asOfDate: "2010-01-01" })
        .subscribe({
          next: () => undefined,
          error: (err) => (error = err),
        });

      const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
      req.flush(apiProblemAsOfDateInvalidFixture, {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(422);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "as_of_date_invalid",
      );
    });
  });

  describe("getDistinctTeacherCountsBySector() (ST-RPT-SECTOR)", () => {
    it("invoca GET /api/reports/teacher-counts-by-sector sin query cuando se omite todo", () => {
      let received: unknown;
      service
        .getDistinctTeacherCountsBySector()
        .subscribe((value) => (received = value));

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.params.has("periodStart")).toBe(false);
      expect(req.request.params.has("periodEnd")).toBe(false);
      req.flush(teacherCountsBySectorFixture);

      expect(received).toEqual(teacherCountsBySectorFixture);
    });

    it("envía periodStart y periodEnd cuando la operadora los define", () => {
      let received: unknown;
      service
        .getDistinctTeacherCountsBySector({
          periodStart: "2026-07-01",
          periodEnd: "2026-07-10",
        })
        .subscribe((value) => (received = value));

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      expect(req.request.params.get("periodStart")).toBe("2026-07-01");
      expect(req.request.params.get("periodEnd")).toBe("2026-07-10");
      req.flush(teacherCountsBySectorFixture);

      expect(received).toEqual(teacherCountsBySectorFixture);
    });

    it("envía sólo periodStart si la operadora omitió periodEnd", () => {
      let received: unknown;
      service
        .getDistinctTeacherCountsBySector({ periodStart: "2026-07-01" })
        .subscribe((value) => (received = value));

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      expect(req.request.params.get("periodStart")).toBe("2026-07-01");
      expect(req.request.params.has("periodEnd")).toBe(false);
      req.flush(teacherCountsBySectorFixture);

      expect(received).toEqual(teacherCountsBySectorFixture);
    });

    it("mapea 200 con conteos en 0 a la forma canónica (no error)", () => {
      let received: unknown;
      service
        .getDistinctTeacherCountsBySector({
          periodStart: "2026-07-10",
          periodEnd: "2026-07-10",
        })
        .subscribe((value) => (received = value));

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      req.flush(emptyTeacherCountsBySectorFixture);

      expect(received).toEqual(emptyTeacherCountsBySectorFixture);
      if (
        received &&
        typeof received === "object" &&
        "publicDistinctTeacherCount" in received
      ) {
        const dto = received as typeof emptyTeacherCountsBySectorFixture;
        expect(dto.publicDistinctTeacherCount).toBe(0);
        expect(dto.privateDistinctTeacherCount).toBe(0);
      }
    });

    it("mapea 400 con ProblemDetails como error canónico", () => {
      let error: unknown;
      service
        .getDistinctTeacherCountsBySector({ periodStart: "2026-07-10" })
        .subscribe({
          next: () => undefined,
          error: (err) => (error = err),
        });

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      req.flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(400);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "invalid_request",
      );
    });

    it("mapea 422 period_invalid como error canónico", () => {
      let error: unknown;
      service
        .getDistinctTeacherCountsBySector({
          periodStart: "2026-07-10",
          periodEnd: "2026-07-01",
        })
        .subscribe({
          next: () => undefined,
          error: (err) => (error = err),
        });

      const req = http.expectOne(
        (r) => r.url === sectorUrl && r.method === "GET",
      );
      req.flush(apiProblemPeriodInvalidFixture, {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(422);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "period_invalid",
      );
    });
  });

  describe("getTopSchoolsByEnrollment() (ST-RPT-TOP)", () => {
    it("invoca GET /api/reports/top-schools con academicYearId obligatorio", () => {
      let received: unknown;
      const params: GetTopSchoolsByEnrollmentParams = { academicYearId: 2 };
      service
        .getTopSchoolsByEnrollment(params)
        .subscribe((value) => (received = value));

      const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
      expect(req.request.method).toBe("GET");
      expect(req.request.params.get("academicYearId")).toBe("2");
      req.flush(topSchoolsFixture);

      expect(received).toEqual(topSchoolsFixture);
    });

    it("preserva el orden de las escuelas del backend (empates en count=12)", () => {
      let received: unknown;
      service
        .getTopSchoolsByEnrollment({ academicYearId: 2 })
        .subscribe((value) => (received = value));

      http.expectOne((r) => r.url === topUrl).flush(topSchoolsFixture);

      if (Array.isArray(received)) {
        expect(
          received.map(
            (entry: { school: { name: string } }) => entry.school.name,
          ),
        ).toEqual(["Escuela Río Claro", "Instituto Horizonte"]);
        expect(
          received.map(
            (entry: { enrollmentCount: number }) => entry.enrollmentCount,
          ),
        ).toEqual([12, 12]);
      } else {
        expect.fail("received should be an array");
      }
    });

    it("mapea 200 [] como lista vacía (no error)", () => {
      let received: unknown;
      service
        .getTopSchoolsByEnrollment({ academicYearId: 2 })
        .subscribe((value) => (received = value));

      http.expectOne((r) => r.url === topUrl).flush(emptyTopSchoolsFixture);

      expect(Array.isArray(received)).toBe(true);
      expect(received).toEqual([]);
      expect((received as unknown[]).length).toBe(0);
    });

    it("mapea 400 con ProblemDetails como error canónico", () => {
      let error: unknown;
      service.getTopSchoolsByEnrollment({ academicYearId: 0 }).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
      req.flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(400);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "invalid_request",
      );
    });

    it("mapea 404 con ProblemDetails (recurso no encontrado)", () => {
      let error: unknown;
      service.getTopSchoolsByEnrollment({ academicYearId: 9999 }).subscribe({
        next: () => undefined,
        error: (err) => (error = err),
      });

      const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
      req.flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(404);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "resource_not_found",
      );
    });
  });
});
