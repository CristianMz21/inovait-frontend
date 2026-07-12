import { HttpHeaders } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { throwError } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  problemDetailsInterceptor,
} from "../api";
import { ApiProblemError } from "../api/api-problem-error";
import { apiProblemNotFoundFixture } from "../../../testing/fixtures";
import { CatalogApiService } from "./catalog-api.service";
import { CatalogFacade } from "./catalog.facade";

describe("CatalogFacade", () => {
  let facade: CatalogFacade;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([problemDetailsInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        CatalogApiService,
        CatalogFacade,
      ],
    });
    facade = TestBed.inject(CatalogFacade);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("loadSchools() expone loading y luego success con datos", () => {
    facade.loadSchools();
    expect(facade.schoolsState().status).toBe("loading");

    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`);
    req.flush([{ id: 1, name: "A", sector: "Public" }]);

    const state = facade.schoolsState();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data).toHaveLength(1);
    }
  });

  it("loadSchools() vacío se traduce a empty/noResults", () => {
    facade.loadSchools();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`);
    req.flush([]);

    const state = facade.schoolsState();
    expect(state.status).toBe("empty");
    if (state.status === "empty") {
      expect(state.reason).toBe("noResults");
    }
  });

  it("loadSchools() con 404 expone error con ApiProblemError", () => {
    facade.loadSchools();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`);
    req.flush(apiProblemNotFoundFixture, {
      status: 404,
      statusText: "Not Found",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    const state = facade.schoolsState();
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.problem.code).toBe("resource_not_found");
      expect(state.problem.status).toBe(404);
    }
  });

  it("loadClassGroups() con filtros omite los undefined", () => {
    facade.loadClassGroups({ schoolId: 1 });
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    expect(req.request.params.has("schoolId")).toBe(true);
    expect(req.request.params.has("gradeId")).toBe(false);
    req.flush([]);
    expect(facade.classGroupsState().status).toBe("empty");
  });

  it("loadClassGroups() cancela la suscripción anterior (stale descartado)", () => {
    facade.loadClassGroups({ schoolId: 1 });
    const first = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    // El estado debe estar en loading.
    expect(facade.classGroupsState().status).toBe("loading");

    // Llega una segunda llamada antes de que la primera responda.
    facade.loadClassGroups({ schoolId: 2 });
    const second = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    expect(second.request.params.get("schoolId")).toBe("2");
    // `HttpTestingController` marca el request como cancelado cuando la
    // suscripción previa es reemplazada por `unsubscribe()`. Si la primera
    // petición no se cancelara, este test detectaría dos pendientes.
    expect(first.cancelled).toBe(true);

    // La segunda responde: el estado refleja schoolId=2.
    second.flush([
      { id: 99, code: "Z", schoolId: 2, academicYearId: 2, gradeId: 1 },
    ]);
    const state = facade.classGroupsState();
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.data[0].schoolId).toBe(2);
    }
  });

  it("cancel() vuelve el slot a idle", () => {
    facade.loadSubjects();
    const req = http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/subjects`);
    req.flush([{ id: 1, code: "A", name: "X" }]);
    expect(facade.subjectsState().status).toBe("success");

    facade.cancel("subjects");
    expect(facade.subjectsState().status).toBe("idle");
  });

  it("ApiProblemError serializa status y code para la UI", () => {
    const problem = apiProblemNotFoundFixture;
    const err = new ApiProblemError(problem);
    expect(err.status).toBe(404);
    expect(err.problem.code).toBe("resource_not_found");
    expect(err.message).toBe(problem.title);
  });

  it("termina en error seguro ante un fallo inesperado no normalizado", () => {
    vi.spyOn(TestBed.inject(CatalogApiService), "listSchools").mockReturnValue(
      throwError(() => new Error("unexpected")),
    );

    facade.loadSchools();

    expect(facade.schoolsState()).toMatchObject({
      status: "error",
      problem: { code: "unknown_error" },
    });
  });

  it("cancela los seis slots pendientes al destruir el injector", () => {
    facade.loadSchools();
    facade.loadGrades();
    facade.loadAcademicYears();
    facade.loadClassGroups({ schoolId: 1 });
    facade.loadTeachers();
    facade.loadSubjects();
    const requests = http.match(() => true);
    expect(requests).toHaveLength(6);

    TestBed.resetTestingModule();

    expect(requests.every((request) => request.cancelled)).toBe(true);
  });
});
