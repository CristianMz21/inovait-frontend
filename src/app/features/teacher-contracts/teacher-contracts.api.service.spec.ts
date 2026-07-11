import { HttpHeaders } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  apiProblemBadRequestFixture,
  apiProblemNotFoundFixture,
  apiProblemTeacherContractConflictFixture,
  apiProblemBusinessRuleViolationFixture,
  emptyTeacherContractsListedFixture,
  teacherContractsCreatedFixture,
  teacherContractsListedFixture,
} from "../../../testing/fixtures";
import {
  TeacherContractsApiService,
  type CreateTeacherContractsParams,
} from "./teacher-contracts.api.service";

const teacherId = 5;

const createParams: CreateTeacherContractsParams = {
  teacherId,
  request: {
    schoolIds: [1, 2],
    startDate: "2026-03-01",
    endDate: null,
  },
};

describe("TeacherContractsApiService (ST-CON-PAYLOAD/LIST)", () => {
  let service: TeacherContractsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        TeacherContractsApiService,
      ],
    });
    service = TestBed.inject(TeacherContractsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe("create()", () => {
    it("invoca POST /api/teachers/{id}/contracts con payload completo", () => {
      let received: unknown;
      service.create(createParams).subscribe((value) => (received = value));

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
      );
      expect(req.request.method).toBe("POST");
      expect(req.request.body).toEqual(createParams.request);
      req.flush(teacherContractsCreatedFixture);

      expect(received).toEqual(teacherContractsCreatedFixture);
    });

    it("omite endDate cuando el contrato es vigente", () => {
      let received: unknown;
      service.create(createParams).subscribe((value) => (received = value));

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
      );
      // El mapper cliente no debe añadir `endDate` por defecto: la
      // semántica de vigencia la determina el backend al recibir `null`.
      expect((req.request.body as { endDate?: unknown }).endDate).toBeNull();
      req.flush(teacherContractsCreatedFixture);

      expect(received).toEqual(teacherContractsCreatedFixture);
    });

    it("mapea 400 con ProblemDetails sin mutar el payload", () => {
      let error: unknown;
      service.create(createParams).subscribe({
        next: () => undefined,
        error: (err) => {
          error = err;
        },
      });

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
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

    it("mapea 409 con ProblemDetails de conflicto de contratos", () => {
      let error: unknown;
      service.create(createParams).subscribe({
        next: () => undefined,
        error: (err) => {
          error = err;
        },
      });

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
      );
      req.flush(apiProblemTeacherContractConflictFixture, {
        status: 409,
        statusText: "Conflict",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(409);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "teacher_contract_conflict",
      );
    });

    it("mapea 422 con ProblemDetails de regla de negocio", () => {
      let error: unknown;
      service.create(createParams).subscribe({
        next: () => undefined,
        error: (err) => {
          error = err;
        },
      });

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
      );
      req.flush(apiProblemBusinessRuleViolationFixture, {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

      expect((error as { status: number }).status).toBe(422);
      expect((error as { problem: { code: string } }).problem.code).toBe(
        "business_rule_violation",
      );
    });
  });

  describe("list()", () => {
    it("invoca GET /api/teachers/{id}/contracts sin asOfDate cuando se omite", () => {
      let received: unknown;
      service.list({ teacherId }).subscribe((value) => (received = value));

      const req = http.expectOne(
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
      );
      expect(req.request.method).toBe("GET");
      expect(req.request.params.has("asOfDate")).toBe(false);
      req.flush(teacherContractsListedFixture);

      expect(received).toEqual(teacherContractsListedFixture);
    });

    it("envía asOfDate sólo cuando la operadora lo define", () => {
      let received: unknown;
      service
        .list({ teacherId, asOfDate: "2026-07-10" })
        .subscribe((value) => (received = value));

      const req = http.expectOne(
        (r) =>
          r.url ===
            `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts` &&
          r.method === "GET",
      );
      expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
      req.flush(teacherContractsListedFixture);

      expect(received).toEqual(teacherContractsListedFixture);
    });

    it("mapea 200 [] a colección vacía (no error)", () => {
      let received: unknown;
      service.list({ teacherId }).subscribe((value) => (received = value));

      http
        .expectOne(
          (r) =>
            r.url ===
            `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`,
        )
        .flush(emptyTeacherContractsListedFixture);

      expect(received).toEqual([]);
    });

    it("mapea 404 con ProblemDetails para docente inexistente", () => {
      let error: unknown;
      service.list({ teacherId: 9999 }).subscribe({
        next: () => undefined,
        error: (err) => {
          error = err;
        },
      });

      http
        .expectOne(
          (r) =>
            r.url ===
            `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/9999/contracts`,
        )
        .flush(apiProblemNotFoundFixture, {
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
