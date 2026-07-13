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
  apiProblemBadRequestFixture,
  apiProblemNotFoundFixture,
  apiProblemTeacherContractConflictFixture,
  emptyTeacherContractsListedFixture,
  teacherContractsCreatedFixture,
  teacherContractsListedFixture,
} from "../../../testing/fixtures";
import { TeacherContractsApiService } from "./teacher-contracts.api.service";
import { TeacherContractsFacade } from "./teacher-contracts.facade";
import type { TeacherContractsFormVm } from "./teacher-contracts.vm";

const validForm: TeacherContractsFormVm = {
  teacherId: 5,
  schoolIds: [1, 2],
  startDate: "2026-03-01",
  endDate: null,
};

const invalidForm: TeacherContractsFormVm = {
  teacherId: null,
  schoolIds: [1],
  startDate: "2026-03-01",
  endDate: null,
};

function url(teacherId: number): string {
  return `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`;
}

describe("TeacherContractsFacade", () => {
  let facade: TeacherContractsFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        TeacherContractsApiService,
        TeacherContractsFacade,
      ],
    });
    facade = TestBed.inject(TeacherContractsFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  // -- create ---------------------------------------------------------

  it("canSubmit() rechaza la VM cuando faltan campos o hay inconsistencias", () => {
    expect(facade.canSubmit(validForm)).toBe(true);
    expect(facade.canSubmit(invalidForm)).toBe(false);
  });

  it("submit() con VM inválida es no-op y conserva el estado idle", () => {
    facade.submit(invalidForm);
    expect(facade.createResult().status).toBe("idle");
    http.expectNone(r =>
      r.url.startsWith(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/`),
    );
  });

  it("submit() expone loading y luego success al crear contratos", () => {
    facade.submit(validForm);
    expect(facade.createResult().status).toBe("loading");

    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    expect(req.request.body).toEqual({
      schoolIds: [1, 2],
      startDate: "2026-03-01",
      endDate: null,
    });
    req.flush(teacherContractsCreatedFixture);

    const state = facade.createResult();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
      expect(state.data[0].schoolName).toBe("Escuela Río Claro");
      expect(state.data[0].persistedStatus).toBe("Confirmed");
      expect(state.data[0].effectiveStatus).toBe("Effective");
      expect(state.data[1].schoolName).toBe("Instituto Horizonte");
    }
    http
      .expectOne(request => request.url === url(5) && request.method === "GET")
      .flush(teacherContractsListedFixture);
  });

  it("submit() espera el 201 y reemplaza la lista con el GET canónico completo", () => {
    facade.submit(validForm);

    const createRequest = http.expectOne(
      request => request.url === url(5) && request.method === "POST",
    );
    http.expectNone(
      request => request.url === url(5) && request.method === "GET",
    );

    createRequest.flush(teacherContractsCreatedFixture, {
      status: 201,
      statusText: "Created",
    });

    expect(facade.createResult().status).toBe("success");
    expect(facade.listResult().status).toBe("loading");
    const listRequest = http.expectOne(
      request => request.url === url(5) && request.method === "GET",
    );
    expect(listRequest.request.params.has("asOfDate")).toBe(false);

    listRequest.flush(teacherContractsListedFixture);

    const listState = facade.listResult();
    expect(listState.status).toBe("success");
    if (listState.status === "success") {
      expect(listState.data).toHaveLength(teacherContractsListedFixture.length);
      expect(listState.data[0]).toMatchObject({
        id: teacherContractsListedFixture[0].id,
        startDate: teacherContractsListedFixture[0].startDate,
        persistedStatus: teacherContractsListedFixture[0].persistedStatus,
      });
      expect(listState.data[1]).toMatchObject({
        id: teacherContractsListedFixture[1].id,
        startDate: teacherContractsListedFixture[1].startDate,
        persistedStatus: teacherContractsListedFixture[1].persistedStatus,
      });
    }
    expect(facade.createResult().status).toBe("success");
  });

  it("el refresh posterior al 201 cancela una lista obsoleta en curso", () => {
    facade.searchByTeacher(6);
    const staleListRequest = http.expectOne(
      request => request.url === url(6) && request.method === "GET",
    );
    facade.submit(validForm);

    http
      .expectOne(request => request.url === url(5) && request.method === "POST")
      .flush(teacherContractsCreatedFixture, {
        status: 201,
        statusText: "Created",
      });

    expect(staleListRequest.cancelled).toBe(true);
    const canonicalListRequest = http.expectOne(
      request => request.url === url(5) && request.method === "GET",
    );
    canonicalListRequest.flush(teacherContractsListedFixture);

    const state = facade.listResult();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data[0].teacherId).toBe(5);
      expect(state.data[0].startDate).toBe(
        teacherContractsListedFixture[0].startDate,
      );
    }
  });

  it("submit() mapea 409 a error y no consulta la lista", () => {
    facade.submit(validForm);
    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    req.flush(apiProblemTeacherContractConflictFixture, {
      status: 409,
      statusText: "Conflict",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    const state = facade.createResult();
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.problem.status).toBe(409);
      expect(state.problem.code).toBe("teacher_contract_conflict");
    }
    http.expectNone(
      request => request.url === url(5) && request.method === "GET",
    );
  });

  it("submit() mapea 422 business_rule_violation a error", () => {
    facade.submit(validForm);
    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    req.flush(apiProblemBadRequestFixture, {
      status: 400,
      statusText: "Bad Request",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    const state = facade.createResult();
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.problem.status).toBe(400);
      expect(state.problem.code).toBe("invalid_request");
    }
  });

  it("submit() mantiene single-flight y no cancela ni duplica un POST en curso", () => {
    facade.submit(validForm);
    const first = http.expectOne(r => r.url === url(5) && r.method === "POST");
    expect(facade.createResult().status).toBe("loading");

    facade.submit({
      ...validForm,
      schoolIds: [3],
    });
    http.expectNone(
      request =>
        request !== first.request &&
        request.url === url(5) &&
        request.method === "POST",
    );
    expect(first.cancelled).toBe(false);

    first.flush(teacherContractsCreatedFixture);
    const state = facade.createResult();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
    }
    http
      .expectOne(request => request.url === url(5) && request.method === "GET")
      .flush(teacherContractsListedFixture);
  });

  it("resetCreate() cancela el envío en curso y vuelve a idle", () => {
    facade.submit(validForm);
    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    expect(facade.createResult().status).toBe("loading");

    facade.resetCreate();
    expect(req.cancelled).toBe(true);
    expect(facade.createResult().status).toBe("idle");
  });

  it("retrySubmit() reenvía tras un error", () => {
    facade.submit(validForm);
    http
      .expectOne(r => r.url === url(5) && r.method === "POST")
      .flush(apiProblemTeacherContractConflictFixture, {
        status: 409,
        statusText: "Conflict",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(facade.createResult().status).toBe("error");

    facade.retrySubmit(validForm);
    const retryReq = http.expectOne(
      r => r.url === url(5) && r.method === "POST",
    );
    retryReq.flush(teacherContractsCreatedFixture);

    const state = facade.createResult();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
    }
    http
      .expectOne(request => request.url === url(5) && request.method === "GET")
      .flush(teacherContractsListedFixture);
  });

  it("retrySubmit() no hace nada si el estado vigente no es error", () => {
    facade.submit(validForm);
    http.expectOne(r => r.url === url(5) && r.method === "POST");

    facade.retrySubmit(validForm);
    expect(facade.createResult().status).toBe("loading");
  });

  // -- list ---------------------------------------------------------

  it("searchByTeacher() invoca GET y mapea success", () => {
    facade.searchByTeacher(5);
    expect(facade.listResult().status).toBe("loading");

    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(req.request.params.has("asOfDate")).toBe(false);
    req.flush(teacherContractsListedFixture);

    const state = facade.listResult();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(2);
      expect(state.data[0].persistedStatus).toBe("Cancelled");
      expect(state.data[1].persistedStatus).toBe("Confirmed");
    }
  });

  it("searchByTeacher() envía asOfDate cuando se indica", () => {
    facade.searchByTeacher(5, "2026-07-10");
    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
    req.flush(teacherContractsListedFixture);
    expect(facade.listResult().status).toBe("success");
  });

  it("searchByTeacher() mapea 200 [] a empty/noContracts", () => {
    facade.searchByTeacher(5);
    http
      .expectOne(r => r.url === url(5) && r.method === "GET")
      .flush(emptyTeacherContractsListedFixture);

    const state = facade.listResult();
    expect(state.status).toBe("empty");
    if (state.status === "empty") {
      expect(state.reason).toBe("noContracts");
    }
  });

  it("searchByTeacher() mapea 404 a error con ProblemDetails", () => {
    facade.searchByTeacher(9999);
    http
      .expectOne(r => r.url === url(9999) && r.method === "GET")
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    const state = facade.listResult();
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.problem.status).toBe(404);
    }
  });

  it("searchByTeacher() con teacherId inválido es no-op", () => {
    facade.searchByTeacher(0);
    facade.searchByTeacher(-1);
    facade.searchByTeacher(Number.NaN);
    expect(facade.listResult().status).toBe("idle");
    http.expectNone(r =>
      r.url.startsWith(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/`),
    );
  });

  it("searchByTeacher() cancela la consulta previa cuando cambia el docente", () => {
    facade.searchByTeacher(5);
    const first = http.expectOne(r => r.url === url(5) && r.method === "GET");

    facade.searchByTeacher(6);
    const second = http.expectOne(r => r.url === url(6) && r.method === "GET");
    expect(first.cancelled).toBe(true);

    second.flush(teacherContractsListedFixture);
    expect(facade.listResult().status).toBe("success");
  });

  it("resetList() cancela la consulta en curso y vuelve a idle", () => {
    facade.searchByTeacher(5);
    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(facade.listResult().status).toBe("loading");

    facade.resetList();
    expect(req.cancelled).toBe(true);
    expect(facade.listResult().status).toBe("idle");
  });

  it("retryList() reenvía tras un error", () => {
    facade.searchByTeacher(5);
    http
      .expectOne(r => r.url === url(5) && r.method === "GET")
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(facade.listResult().status).toBe("error");

    facade.retryList();
    const retryReq = http.expectOne(
      r => r.url === url(5) && r.method === "GET",
    );
    retryReq.flush(teacherContractsListedFixture);
    expect(facade.listResult().status).toBe("success");
  });

  it("retryList() no hace nada si el estado vigente no es error", () => {
    facade.searchByTeacher(5);
    http.expectOne(r => r.url === url(5) && r.method === "GET");

    facade.retryList();
    expect(facade.listResult().status).toBe("loading");
  });

  it("termina ambos flujos en error seguro ante fallos inesperados", () => {
    const api = TestBed.inject(TeacherContractsApiService);
    vi.spyOn(api, "create").mockReturnValue(
      throwError(() => new Error("unexpected create")),
    );
    vi.spyOn(api, "list").mockReturnValue(
      throwError(() => new Error("unexpected list")),
    );

    facade.submit(validForm);
    facade.searchByTeacher(5);

    expect(facade.createResult()).toMatchObject({
      status: "error",
      problem: { code: "unknown_error" },
    });
    expect(facade.listResult()).toMatchObject({
      status: "error",
      problem: { code: "unknown_error" },
    });
  });

  it("cancela POST y GET pendientes al destruir la fachada", () => {
    facade.submit(validForm);
    facade.searchByTeacher(5);
    const createRequest = http.expectOne(
      candidate => candidate.url === url(5) && candidate.method === "POST",
    );
    const listRequest = http.expectOne(
      candidate => candidate.url === url(5) && candidate.method === "GET",
    );

    TestBed.resetTestingModule();

    expect(createRequest.cancelled).toBe(true);
    expect(listRequest.cancelled).toBe(true);
  });
});
