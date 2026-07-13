import { HttpHeaders } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  apiProblemHistoryBadRequestFixture,
  apiProblemStudentNotFoundFixture,
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistorySecondYearFixture,
} from "../../../testing/fixtures";
import { StudentHistoryApiService } from "./student-history.api.service";
import {
  STUDENT_HISTORY_NO_RESULTS_REASON,
  STUDENT_HISTORY_REMOTE_STATUS,
} from "./student-history.constants";
import { StudentHistoryFacade } from "./student-history.facade";
import type { StudentHistoryFiltersVm } from "./student-history.vm";

const completeFilters: StudentHistoryFiltersVm = {
  documentType: "DNI",
  documentNumber: "99.001.101",
};

const incompleteFilters: StudentHistoryFiltersVm = {
  documentType: "",
  documentNumber: "99.001.101",
};

const historyUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/${completeFilters.documentType}/${completeFilters.documentNumber}/history`;
const HTTP_BAD_REQUEST_STATUS = 400;
const HTTP_BAD_REQUEST_STATUS_TEXT = "Bad Request";
const HTTP_NOT_FOUND_STATUS = 404;
const HTTP_NOT_FOUND_STATUS_TEXT = "Not Found";

describe("StudentHistoryFacade (CT-HIST-FAC)", () => {
  let facade: StudentHistoryFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        StudentHistoryApiService,
        StudentHistoryFacade,
      ],
    });
    facade = TestBed.inject(StudentHistoryFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("loadHistory() con VM inválida es no-op y conserva el estado idle", () => {
    facade.loadHistory(incompleteFilters);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.idle);
    http.expectNone(r => r.url.startsWith(historyUrl.split("/DNI")[0]));
  });

  it("loadHistory() expone loading y luego success al confirmar la consulta", () => {
    facade.loadHistory(completeFilters);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.loading);

    const req = http.expectOne(r => r.url === historyUrl);
    expect(req.request.method).toBe("GET");
    expect(req.request.params.keys()).toEqual([]);
    req.flush(studentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.success);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.success) {
      expect(state.data.identity.fullName).toBe("Ana María Solís");
      expect(state.data.enrollments).toHaveLength(1);
    }
  });

  it("loadHistory() con 200 enrollments: [] mapea a empty/noResults (no error)", () => {
    facade.loadHistory(completeFilters);
    http.expectOne(r => r.url === historyUrl).flush(emptyStudentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.empty);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.empty) {
      expect(state.reason).toBe(STUDENT_HISTORY_NO_RESULTS_REASON);
    }
  });

  it("loadHistory() con 404 student_not_found mapea a error con ProblemDetails", () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne(r => r.url === historyUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.error);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.error) {
      expect(state.problem.status).toBe(HTTP_NOT_FOUND_STATUS);
      expect(state.problem.code).toBe("student_not_found");
    }
  });

  it("loadHistory() con 400 invalid_request mapea a error", () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne(r => r.url === historyUrl)
      .flush(apiProblemHistoryBadRequestFixture, {
        status: HTTP_BAD_REQUEST_STATUS,
        statusText: HTTP_BAD_REQUEST_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.error);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.error) {
      expect(state.problem.status).toBe(HTTP_BAD_REQUEST_STATUS);
      expect(state.problem.code).toBe("invalid_request");
    }
  });

  it("loadHistory() cancela la búsqueda previa cuando cambian los filtros (stale descartado)", () => {
    facade.loadHistory(completeFilters);
    const first = http.expectOne(r => r.url === historyUrl);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.loading);

    facade.loadHistory({ ...completeFilters, documentNumber: "88.200.300" });
    const second = http.expectOne(
      r =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
    );
    expect(first.cancelled).toBe(true);

    second.flush(studentHistorySecondYearFixture);
    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.success);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.success) {
      expect(state.data.enrollments).toHaveLength(2);
    }
  });

  it("descarta respuesta tardía si cambia el sequence antes de que llegue", () => {
    facade.loadHistory(completeFilters);
    const first = http.expectOne(r => r.url === historyUrl);

    facade.loadHistory({ ...completeFilters, documentNumber: "88.200.300" });
    const second = http.expectOne(
      r =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
    );

    // La primera suscripción se cancela — `flush` rechaza lanzar sobre
    // un request cancelado, por lo que validamos el descarte stale a
    // través del estado de la fachada tras resolver la segunda.
    second.flush(studentHistorySecondYearFixture);
    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.success);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.success) {
      expect(state.data.enrollments).toHaveLength(2);
    }
    expect(first.cancelled).toBe(true);
  });

  it("resetHistory() cancela la búsqueda en curso y vuelve a idle", () => {
    facade.loadHistory(completeFilters);
    const req = http.expectOne(r => r.url === historyUrl);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.loading);

    facade.resetHistory();
    expect(req.cancelled).toBe(true);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.idle);
    expect(facade.filters()).toEqual({
      documentType: "",
      documentNumber: "",
    });
  });

  it("retryHistory() reenvía tras un error usando los filtros vigentes", () => {
    facade.loadHistory(completeFilters);
    http
      .expectOne(r => r.url === historyUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.error);

    facade.retryHistory();
    const retryReq = http.expectOne(r => r.url === historyUrl);
    expect(retryReq.request.params.keys()).toEqual([]);
    retryReq.flush(studentHistoryFixture);

    const state = facade.result();
    expect(state.status).toBe(STUDENT_HISTORY_REMOTE_STATUS.success);
    if (state.status === STUDENT_HISTORY_REMOTE_STATUS.success) {
      expect(state.data.identity.documentNumber).toBe("99.001.101");
    }
  });

  it("retryHistory() también dispara desde empty (noResults)", () => {
    facade.loadHistory(completeFilters);
    http.expectOne(r => r.url === historyUrl).flush(emptyStudentHistoryFixture);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.empty);

    facade.retryHistory();
    const retryReq = http.expectOne(r => r.url === historyUrl);
    retryReq.flush(studentHistoryFixture);
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.success);
  });

  it("retryHistory() no hace nada si el estado vigente no es error ni empty", () => {
    facade.loadHistory(completeFilters);
    http.expectOne(r => r.url === historyUrl);
    facade.retryHistory();
    expect(facade.result().status).toBe(STUDENT_HISTORY_REMOTE_STATUS.loading);
  });

  it("termina en error seguro ante un fallo inesperado no normalizado", () => {
    vi.spyOn(
      TestBed.inject(StudentHistoryApiService),
      "getStudentHistory",
    ).mockReturnValue(throwError(() => new Error("unexpected")));

    facade.loadHistory(completeFilters);

    expect(facade.result()).toMatchObject({
      status: STUDENT_HISTORY_REMOTE_STATUS.error,
      problem: { code: "unknown_error" },
    });
  });

  it("cancela el GET pendiente al destruir la fachada", () => {
    facade.loadHistory(completeFilters);
    const request = http.expectOne(candidate => candidate.url === historyUrl);

    TestBed.resetTestingModule();

    expect(request.cancelled).toBe(true);
  });
});
