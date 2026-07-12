import { HttpHeaders } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  apiProblemNotFoundFixture,
  emptyEnrollmentListResponseFixture,
  enrollmentListResponseFixture,
} from "../../../testing/fixtures";
import { StudentSearchApiService } from "./student-search.api.service";
import { StudentSearchFacade } from "./student-search.facade";
import type { StudentSearchFiltersVm } from "./student-search.vm";

const completeFilters: StudentSearchFiltersVm = {
  schoolId: 1,
  gradeId: 1,
  academicYearId: 2,
  asOfDate: null,
};

const incompleteFilters: StudentSearchFiltersVm = {
  schoolId: 1,
  gradeId: null,
  academicYearId: 2,
  asOfDate: null,
};

describe("StudentSearchFacade", () => {
  let facade: StudentSearchFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        StudentSearchApiService,
        StudentSearchFacade,
      ],
    });
    facade = TestBed.inject(StudentSearchFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("search() con VM inválida es no-op y conserva el estado idle", () => {
    facade.search(incompleteFilters);
    expect(facade.result().status).toBe("idle");
    http.expectNone(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
  });

  it("search() expone loading y luego success al confirmar la consulta", () => {
    facade.search(completeFilters);
    expect(facade.result().status).toBe("loading");

    const req = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.method === "GET",
    );
    expect(req.request.params.get("schoolId")).toBe("1");
    expect(req.request.params.get("gradeId")).toBe("1");
    expect(req.request.params.get("academicYearId")).toBe("2");
    req.flush(enrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
      expect(state.data[0].fullName).toBe("Ana María Solís");
      expect(state.data[1].fullName).toBe("Luis Pérez");
    }
  });

  it("search() con 200 [] mapea a empty/noResults (no es error)", () => {
    facade.search(completeFilters);
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    req.flush(emptyEnrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe("empty");
    if (state.status === "empty") {
      expect(state.reason).toBe("noResults");
    }
  });

  it("search() con 404 mapea a error con ProblemDetails", () => {
    facade.search(completeFilters);
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    req.flush(apiProblemNotFoundFixture, {
      status: 404,
      statusText: "Not Found",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    const state = facade.result();
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.problem.status).toBe(404);
      expect(state.problem.code).toBe("resource_not_found");
    }
  });

  it("search() cancela la búsqueda previa cuando cambian los filtros (stale descartado)", () => {
    facade.search(completeFilters);
    const first = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(facade.result().status).toBe("loading");

    facade.search({ ...completeFilters, schoolId: 7 });
    const second = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.params.get("schoolId") === "7",
    );
    expect(first.cancelled).toBe(true);

    second.flush(enrollmentListResponseFixture);
    const state = facade.result();
    expect(state.status).toBe("success");
  });

  it("reset() cancela la búsqueda en curso y vuelve a idle", () => {
    facade.search(completeFilters);
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(facade.result().status).toBe("loading");

    facade.reset();
    expect(req.cancelled).toBe(true);
    expect(facade.result().status).toBe("idle");
    expect(facade.filters()).toEqual({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: null,
    });
  });

  it("retry() reenvía tras un error usando los filtros vigentes", () => {
    facade.search(completeFilters);
    http
      .expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      )
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(facade.result().status).toBe("error");

    facade.retry();
    const retryReq = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(retryReq.request.params.get("schoolId")).toBe("1");
    retryReq.flush(enrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
    }
  });

  it("retry() no hace nada si el estado vigente no es error", () => {
    facade.search(completeFilters);
    http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );

    facade.retry();
    // No se emitió un segundo GET: la fachada sigue en `loading`.
    expect(facade.result().status).toBe("loading");
  });

  it("search() persiste los filtros vigentes para futuros retry", () => {
    facade.search({ ...completeFilters, asOfDate: "2026-07-10" });
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
    req.flush(apiProblemNotFoundFixture, {
      status: 404,
      statusText: "Not Found",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    expect(facade.filters().asOfDate).toBe("2026-07-10");

    facade.retry();
    const retryReq = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(retryReq.request.params.get("asOfDate")).toBe("2026-07-10");
    retryReq.flush(emptyEnrollmentListResponseFixture);
    expect(facade.result().status).toBe("empty");
  });

  it("termina en error seguro ante un fallo inesperado no normalizado", () => {
    vi.spyOn(TestBed.inject(StudentSearchApiService), "list").mockReturnValue(
      throwError(() => new Error("unexpected")),
    );

    facade.search(completeFilters);

    expect(facade.result()).toMatchObject({
      status: "error",
      problem: { code: "unknown_error" },
    });
  });

  it("cancela el GET pendiente al destruir la fachada", () => {
    facade.search(completeFilters);
    const request = http.expectOne(
      (candidate) =>
        candidate.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );

    TestBed.resetTestingModule();

    expect(request.cancelled).toBe(true);
  });
});
