import { HttpHeaders } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { Subject, of, throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  apiProblemNotFoundFixture,
  classGroupsFixture,
  emptyClassGroupsFixture,
  emptyEnrollmentListResponseFixture,
  enrollmentListResponseFixture,
} from "../../../testing/fixtures";
import { CatalogApiService } from "../../core/catalogs/catalog-api.service";
import { StudentSearchApiService } from "./student-search.api.service";
import {
  STUDENT_SEARCH_NO_GROUPS_REASON,
  STUDENT_SEARCH_NO_RESULTS_REASON,
  STUDENT_SEARCH_REMOTE_STATUS,
} from "./student-search.constants";
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
const CLASS_GROUPS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`;
const ENROLLMENTS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`;
const HTTP_NOT_FOUND_STATUS = 404;
const HTTP_NOT_FOUND_STATUS_TEXT = "Not Found";
const REFERENCE_DATE = "2026-07-10";

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

  function flushClassGroups(
    schoolId = "1",
    gradeId = "1",
    academicYearId = "2",
  ): void {
    const request = http.expectOne(
      candidate =>
        candidate.url === CLASS_GROUPS_URL &&
        candidate.params.get("schoolId") === schoolId,
    );
    expect(request.request.method).toBe("GET");
    expect(request.request.params.get("gradeId")).toBe(gradeId);
    expect(request.request.params.get("academicYearId")).toBe(academicYearId);
    request.flush(classGroupsFixture);
  }

  it("search() con VM inválida es no-op y conserva el estado idle", () => {
    facade.search(incompleteFilters);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.idle);
    http.expectNone(r => r.url === CLASS_GROUPS_URL);
    http.expectNone(r => r.url === ENROLLMENTS_URL);
  });

  it("search() consulta grupos primero y omite inscripciones para 200 []", () => {
    facade.search(completeFilters);

    const groupsRequest = http.expectOne(
      request => request.url === CLASS_GROUPS_URL,
    );
    expect(groupsRequest.request.params.get("schoolId")).toBe("1");
    expect(groupsRequest.request.params.get("gradeId")).toBe("1");
    expect(groupsRequest.request.params.get("academicYearId")).toBe("2");
    http.expectNone(request => request.url === ENROLLMENTS_URL);
    groupsRequest.flush(emptyClassGroupsFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.empty);
    if (state.status === STUDENT_SEARCH_REMOTE_STATUS.empty) {
      expect(state.reason).toBe(STUDENT_SEARCH_NO_GROUPS_REASON);
    }
    http.expectNone(request => request.url === ENROLLMENTS_URL);
  });

  it("search() expone loading y luego success al confirmar la consulta", () => {
    facade.search(completeFilters);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.loading);

    http.expectNone(r => r.url === ENROLLMENTS_URL);
    flushClassGroups();

    const req = http.expectOne(
      r => r.url === ENROLLMENTS_URL && r.method === "GET",
    );
    expect(req.request.params.get("schoolId")).toBe("1");
    expect(req.request.params.get("gradeId")).toBe("1");
    expect(req.request.params.get("academicYearId")).toBe("2");
    req.flush(enrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
    if (state.status === STUDENT_SEARCH_REMOTE_STATUS.success) {
      expect(state.data).toHaveLength(2);
      expect(state.data[0].fullName).toBe("Ana María Solís");
      expect(state.data[1].fullName).toBe("Luis Pérez");
    }
  });

  it("search() con 200 [] mapea a empty/noResults (no es error)", () => {
    facade.search(completeFilters);
    flushClassGroups();
    const req = http.expectOne(r => r.url === ENROLLMENTS_URL);
    req.flush(emptyEnrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.empty);
    if (state.status === STUDENT_SEARCH_REMOTE_STATUS.empty) {
      expect(state.reason).toBe(STUDENT_SEARCH_NO_RESULTS_REASON);
    }
  });

  it("search() con 404 mapea a error con ProblemDetails", () => {
    facade.search(completeFilters);
    flushClassGroups();
    const req = http.expectOne(r => r.url === ENROLLMENTS_URL);
    req.flush(apiProblemNotFoundFixture, {
      status: HTTP_NOT_FOUND_STATUS,
      statusText: HTTP_NOT_FOUND_STATUS_TEXT,
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.error);
    if (state.status === STUDENT_SEARCH_REMOTE_STATUS.error) {
      expect(state.problem.status).toBe(HTTP_NOT_FOUND_STATUS);
      expect(state.problem.code).toBe("resource_not_found");
    }
  });

  it("search() mapea un error de grupos y no consulta inscripciones", () => {
    facade.search(completeFilters);
    http
      .expectOne(request => request.url === CLASS_GROUPS_URL)
      .flush(apiProblemNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(facade.result()).toMatchObject({
      status: STUDENT_SEARCH_REMOTE_STATUS.error,
      problem: { code: "resource_not_found" },
    });
    http.expectNone(request => request.url === ENROLLMENTS_URL);
  });

  it("search() cancela la consulta de grupos previa cuando cambian los filtros", () => {
    facade.search(completeFilters);
    const first = http.expectOne(r => r.url === CLASS_GROUPS_URL);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.loading);

    facade.search({ ...completeFilters, schoolId: 7 });
    const second = http.expectOne(
      r => r.url === CLASS_GROUPS_URL && r.params.get("schoolId") === "7",
    );
    expect(first.cancelled).toBe(true);

    second.flush(classGroupsFixture);
    http
      .expectOne(
        r => r.url === ENROLLMENTS_URL && r.params.get("schoolId") === "7",
      )
      .flush(enrollmentListResponseFixture);
    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
  });

  it("search() cancela la consulta de inscripciones previa y descarta su respuesta tardía", () => {
    const catalog = TestBed.inject(CatalogApiService);
    const searchApi = TestBed.inject(StudentSearchApiService);
    const staleEnrollments = new Subject<
      typeof enrollmentListResponseFixture
    >();
    vi.spyOn(catalog, "listClassGroups").mockReturnValue(
      of(classGroupsFixture),
    );
    const listEnrollments = vi
      .spyOn(searchApi, "list")
      .mockReturnValueOnce(staleEnrollments)
      .mockReturnValueOnce(of(enrollmentListResponseFixture));

    facade.search(completeFilters);
    facade.search({ ...completeFilters, schoolId: 7 });

    expect(listEnrollments).toHaveBeenCalledTimes(2);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
    staleEnrollments.next(emptyEnrollmentListResponseFixture);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
  });

  it("search() descarta una respuesta tardía de grupos de una búsqueda reemplazada", () => {
    const catalog = TestBed.inject(CatalogApiService);
    const searchApi = TestBed.inject(StudentSearchApiService);
    const staleGroups = new Subject<typeof classGroupsFixture>();
    vi.spyOn(catalog, "listClassGroups")
      .mockReturnValueOnce(staleGroups)
      .mockReturnValueOnce(of(classGroupsFixture));
    const listEnrollments = vi
      .spyOn(searchApi, "list")
      .mockReturnValue(of(enrollmentListResponseFixture));

    facade.search(completeFilters);
    facade.search({ ...completeFilters, schoolId: 7 });
    staleGroups.next(emptyClassGroupsFixture);

    expect(listEnrollments).toHaveBeenCalledOnce();
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
  });

  it("reset() cancela la búsqueda en curso y vuelve a idle", () => {
    facade.search(completeFilters);
    const req = http.expectOne(r => r.url === CLASS_GROUPS_URL);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.loading);

    facade.reset();
    expect(req.cancelled).toBe(true);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.idle);
    expect(facade.filters()).toEqual({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: null,
    });
  });

  it("reset() cancela la segunda etapa y su respuesta tardía no muta idle", () => {
    const catalog = TestBed.inject(CatalogApiService);
    const searchApi = TestBed.inject(StudentSearchApiService);
    const staleEnrollments = new Subject<
      typeof enrollmentListResponseFixture
    >();
    vi.spyOn(catalog, "listClassGroups").mockReturnValue(
      of(classGroupsFixture),
    );
    vi.spyOn(searchApi, "list").mockReturnValue(staleEnrollments);

    facade.search(completeFilters);
    facade.reset();
    staleEnrollments.next(enrollmentListResponseFixture);

    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.idle);
  });

  it("retry() reenvía tras un error usando los filtros vigentes", () => {
    facade.search(completeFilters);
    flushClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(apiProblemNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.error);

    facade.retry();
    flushClassGroups();
    const retryReq = http.expectOne(r => r.url === ENROLLMENTS_URL);
    expect(retryReq.request.params.get("schoolId")).toBe("1");
    retryReq.flush(enrollmentListResponseFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_SEARCH_REMOTE_STATUS.success);
    if (state.status === STUDENT_SEARCH_REMOTE_STATUS.success) {
      expect(state.data).toHaveLength(2);
    }
  });

  it("retry() no hace nada si el estado vigente no es error", () => {
    facade.search(completeFilters);
    http.expectOne(r => r.url === CLASS_GROUPS_URL);

    facade.retry();
    http.expectNone(r => r.url === CLASS_GROUPS_URL);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.loading);
  });

  it("search() persiste los filtros vigentes para futuros retry", () => {
    facade.search({ ...completeFilters, asOfDate: REFERENCE_DATE });
    flushClassGroups();
    const req = http.expectOne(r => r.url === ENROLLMENTS_URL);
    expect(req.request.params.get("asOfDate")).toBe(REFERENCE_DATE);
    req.flush(apiProblemNotFoundFixture, {
      status: HTTP_NOT_FOUND_STATUS,
      statusText: HTTP_NOT_FOUND_STATUS_TEXT,
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    expect(facade.filters().asOfDate).toBe(REFERENCE_DATE);

    facade.retry();
    flushClassGroups();
    const retryReq = http.expectOne(r => r.url === ENROLLMENTS_URL);
    expect(retryReq.request.params.get("asOfDate")).toBe(REFERENCE_DATE);
    retryReq.flush(emptyEnrollmentListResponseFixture);
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.empty);
  });

  it("termina en error seguro ante un fallo inesperado no normalizado", () => {
    vi.spyOn(TestBed.inject(StudentSearchApiService), "list").mockReturnValue(
      throwError(() => new Error("unexpected")),
    );

    facade.search(completeFilters);
    flushClassGroups();

    expect(facade.result()).toMatchObject({
      status: STUDENT_SEARCH_REMOTE_STATUS.error,
      problem: { code: "unknown_error" },
    });
  });

  it("cancela el GET pendiente al destruir la fachada", () => {
    facade.search(completeFilters);
    const request = http.expectOne(
      candidate => candidate.url === CLASS_GROUPS_URL,
    );

    TestBed.resetTestingModule();

    expect(request.cancelled).toBe(true);
  });

  it("destroy cancela la segunda etapa y evita consultas posteriores", () => {
    const catalog = TestBed.inject(CatalogApiService);
    const searchApi = TestBed.inject(StudentSearchApiService);
    const staleEnrollments = new Subject<
      typeof enrollmentListResponseFixture
    >();
    vi.spyOn(catalog, "listClassGroups").mockReturnValue(
      of(classGroupsFixture),
    );
    const listEnrollments = vi
      .spyOn(searchApi, "list")
      .mockReturnValue(staleEnrollments);

    facade.search(completeFilters);
    TestBed.resetTestingModule();
    staleEnrollments.next(enrollmentListResponseFixture);

    expect(listEnrollments).toHaveBeenCalledOnce();
    expect(facade.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.loading);
  });
});
