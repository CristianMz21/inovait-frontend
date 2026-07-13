import { HttpHeaders } from "@angular/common/http";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
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
  emptyTeacherContractsListedFixture,
  schoolsFixture,
  teacherContractsCreatedFixture,
  teacherContractsListedFixture,
  teachersFixture,
} from "../../../testing/fixtures";
import { TeacherContractsComponent } from "./teacher-contracts.component";

function url(teacherId: number): string {
  return `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/${teacherId}/contracts`;
}

describe("TeacherContractsComponent (CT form/list remoto)", () => {
  let http: HttpTestingController;
  let component: TeacherContractsComponent;
  let fixture: ComponentFixture<TeacherContractsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TeacherContractsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  /** Resuelve los GET de catálogos iniciales disparados en ngOnInit. */
  function flushInitialCatalogs(): void {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`)
      .flush(teachersFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
  }

  // -- Carga inicial -------------------------------------------------

  it("carga catálogos canónicos (docentes y escuelas) al inicializar", () => {
    flushInitialCatalogs();
    expect(component.createTeacherOptions().length).toBe(
      teachersFixture.length,
    );
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
  });

  it("muestra error de catálogo y permite reintentar docentes", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain("No se pudieron cargar docentes");
    const retry = Array.from(host.querySelectorAll("button")).find(button =>
      button.textContent?.includes("Reintentar docentes"),
    );

    retry?.click();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`)
      .flush(teachersFixture);
    expect(retry).toBeDefined();
  });

  it("permite reintentar escuelas desde el alert de catálogo", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`)
      .flush(teachersFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    fixture.detectChanges();
    const retry = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    ).find(button => button.textContent?.includes("Reintentar escuelas"));

    retry?.click();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    expect(retry).toBeDefined();
  });

  // -- Creación: submit bloqueado hasta tener selección completa ------

  it("bloquea el botón Crear contratos sin docente", () => {
    flushInitialCatalogs();
    expect(component.createForm.invalid).toBe(true);
    expect(component.isCreateSubmittable()).toBe(false);
  });

  it("bloquea el botón Crear contratos sin escuelas seleccionadas", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    expect(component.isCreateSubmittable()).toBe(false);
  });

  it("habilita el botón Crear contratos con docente, fechas y al menos una escuela", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    expect(component.isCreateSubmittable()).toBe(true);
  });

  // -- Creación: éxito -----------------------------------------------

  it("tras el 201 conserva el success y muestra la lista canónica completa", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.queryForm.patchValue({
      teacherId: 6,
      asOfDate: "2026-07-10",
    });
    component.selectSchool(1);
    component.selectSchool(2);

    component.onSubmitCreate();
    expect(component.isCreating()).toBe(true);

    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    expect(req.request.body).toEqual({
      schoolIds: [1, 2],
      startDate: "2026-03-01",
      endDate: null,
    });
    req.flush(teacherContractsCreatedFixture, {
      status: 201,
      statusText: "Created",
    });
    fixture.detectChanges();

    expect(component.isCreating()).toBe(false);
    const success = component.createSuccess();
    expect(success).not.toBeNull();
    expect(success?.length).toBe(2);
    expect(success?.[0].schoolName).toBe("Escuela Río Claro");
    expect(success?.[0].persistedStatus).toBe("Confirmed");
    expect(success?.[0].effectiveStatus).toBe("Effective");
    expect(component.queryForm.getRawValue()).toEqual({
      teacherId: 5,
      asOfDate: "",
    });

    const listRequest = http.expectOne(
      request => request.url === url(5) && request.method === "GET",
    );
    expect(listRequest.request.params.has("asOfDate")).toBe(false);
    listRequest.flush(teacherContractsListedFixture);
    fixture.detectChanges();

    expect(component.createSuccess()).toEqual(success);
    const rows = component.querySuccess();
    expect(rows).not.toBeNull();
    expect(rows).toHaveLength(teacherContractsListedFixture.length);
    expect(rows?.[0].startDate).toBe(
      teacherContractsListedFixture[0].startDate,
    );
    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelector('[data-testid="contracts-create-success"]'),
    ).not.toBeNull();
    expect(host.querySelectorAll(".ec-table tbody tr")).toHaveLength(
      teacherContractsListedFixture.length,
    );
  });

  // -- Creación: error canónico --------------------------------------

  it("409 conflict expone error con ProblemDetails y conserva la selección", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    component.onSubmitCreate();

    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    req.flush(apiProblemTeacherContractConflictFixture, {
      status: 409,
      statusText: "Conflict",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    expect(component.hasCreateError()).toBe(true);
    expect(component.createErrorProblem()?.code).toBe(
      "teacher_contract_conflict",
    );
    expect(component.createForm.getRawValue()).toEqual({
      teacherId: 5,
      startDate: "2026-03-01",
      endDate: "",
    });
    // La selección de escuelas se conserva para corrección.
    expect(component.isSchoolSelected(1)).toBe(true);
    // Ningún contrato se muestra como creado: el resultado sigue vacío.
    expect(component.createSuccess()).toBeNull();
    http.expectNone(
      request => request.url === url(5) && request.method === "GET",
    );
  });

  it("422 business rule expone error sin mostrar contratos", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    component.onSubmitCreate();

    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    req.flush(apiProblemBadRequestFixture, {
      status: 400,
      statusText: "Bad Request",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    expect(component.hasCreateError()).toBe(true);
    expect(component.createErrorProblem()?.status).toBe(400);
    expect(component.createSuccess()).toBeNull();
  });

  // -- Creación: reintento y reset ----------------------------------

  it("retryCreate() reenvía la creación tras un error", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    component.onSubmitCreate();

    http
      .expectOne(r => r.url === url(5) && r.method === "POST")
      .flush(apiProblemTeacherContractConflictFixture, {
        status: 409,
        statusText: "Conflict",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasCreateError()).toBe(true);

    component.onRetryCreate();

    const retryReq = http.expectOne(
      r => r.url === url(5) && r.method === "POST",
    );
    retryReq.flush(teacherContractsCreatedFixture);
    expect(component.createSuccess()).not.toBeNull();
    http
      .expectOne(request => request.url === url(5) && request.method === "GET")
      .flush(teacherContractsListedFixture);
  });

  it("resetCreate() cancela el envío en curso y limpia escuelas seleccionadas", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    component.onSubmitCreate();

    const req = http.expectOne(r => r.url === url(5) && r.method === "POST");
    expect(component.isCreating()).toBe(true);

    component.onResetCreate();

    expect(req.cancelled).toBe(true);
    expect(component.createResult().status).toBe("idle");
    expect(component.isSchoolSelected(1)).toBe(false);
    expect(component.createForm.controls.teacherId.value).toBeNull();
  });

  // -- Consulta: éxito -----------------------------------------------

  it("consulta contratos del docente y muestra success con datos", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 5 });

    component.onSubmitQuery();
    expect(component.isQuerying()).toBe(true);

    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(req.request.params.has("asOfDate")).toBe(false);
    req.flush(teacherContractsListedFixture);

    const rows = component.querySuccess();
    expect(rows).not.toBeNull();
    expect(rows?.length).toBe(2);
    expect(rows?.[0].persistedStatus).toBe("Cancelled");
    expect(rows?.[0].effectiveStatus).toBe("Cancelled");
    expect(rows?.[1].persistedStatus).toBe("Confirmed");
  });

  it("envía asOfDate cuando se incluye en el formulario", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({
      teacherId: 5,
      asOfDate: "2026-07-10",
    });

    component.onSubmitQuery();

    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
    req.flush(teacherContractsListedFixture);

    expect(component.querySuccess()).not.toBeNull();
  });

  // -- Consulta: 200 [] → empty -------------------------------------

  it("200 [] mapea a estado empty/noContracts sin error", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 5 });

    component.onSubmitQuery();

    http
      .expectOne(r => r.url === url(5) && r.method === "GET")
      .flush(emptyTeacherContractsListedFixture);

    expect(component.isQueryEmpty()).toBe(true);
    expect(component.hasQueryError()).toBe(false);
    expect(component.querySuccess()).toBeNull();
  });

  // -- Consulta: 404 → error ----------------------------------------

  it("404 con ProblemDetails expone error", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 9999 });

    component.onSubmitQuery();

    http
      .expectOne(r => r.url === url(9999) && r.method === "GET")
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });

    expect(component.hasQueryError()).toBe(true);
    expect(component.queryErrorProblem()?.status).toBe(404);
  });

  // -- Consulta: retry y reset --------------------------------------

  it("retryQuery() reenvía tras un error con los filtros vigentes", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 5 });

    component.onSubmitQuery();
    http
      .expectOne(r => r.url === url(5) && r.method === "GET")
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasQueryError()).toBe(true);

    component.onRetryQuery();

    const retryReq = http.expectOne(
      r => r.url === url(5) && r.method === "GET",
    );
    retryReq.flush(teacherContractsListedFixture);
    expect(component.querySuccess()).not.toBeNull();
  });

  it("resetQuery() cancela la consulta en curso y vuelve a idle", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 5 });

    component.onSubmitQuery();
    const req = http.expectOne(r => r.url === url(5) && r.method === "GET");
    expect(component.isQuerying()).toBe(true);

    component.onResetQuery();

    expect(req.cancelled).toBe(true);
    expect(component.listResult().status).toBe("idle");
    expect(component.queryForm.controls.teacherId.value).toBeNull();
  });

  // -- Mapeo de tono de badge (presentacional, EduCore) --------------

  it("persistedTone() mapea Confirmed/Cancelled a los tonos active/closed", () => {
    flushInitialCatalogs();
    expect(component.persistedTone("Confirmed")).toBe("active");
    expect(component.persistedTone("Cancelled")).toBe("closed");
  });

  it("effectiveTone() mapea cada estado efectivo a su tono temporal", () => {
    flushInitialCatalogs();
    expect(component.effectiveTone("Upcoming")).toBe("upcoming");
    expect(component.effectiveTone("Effective")).toBe("current");
    expect(component.effectiveTone("Expired")).toBe("expired");
    // Un contrato cancelado no tiene tono temporal propio en la paleta
    // (current/upcoming/expired): "expired" es el más cercano
    // semánticamente ("ya no vigente"), y el texto ("Cancelado", vía
    // effectiveLabel()) sigue siendo la señal que lo distingue de un
    // vencimiento natural — el color nunca es la única señal.
    expect(component.effectiveTone("Cancelled")).toBe("expired");
  });

  it("presenta el conteo con singular y plural correctos", () => {
    flushInitialCatalogs();

    expect(component.contractCountLabel(1)).toBe("contrato");
    expect(component.contractCountLabel(2)).toBe("contratos");
  });

  it("valida fechas calendario reales y compara el rango cronológicamente", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-02-30",
    });
    component.selectSchool(1);

    expect(
      component.createForm.controls.startDate.hasError("invalidCalendarDate"),
    ).toBe(true);
    expect(component.isCreateSubmittable()).toBe(false);

    component.createForm.patchValue({
      startDate: "2028-02-29",
      endDate: "2028-02-28",
    });
    expect(component.createRangeHint()).toBe(
      "La fecha de fin debe ser igual o posterior a la fecha de inicio.",
    );
    expect(component.isCreateSubmittable()).toBe(false);

    component.createForm.controls.endDate.setValue("2028-03-01");
    expect(component.createRangeHint()).toBe(
      "Desde 2028-02-29 hasta 2028-03-01",
    );
    expect(component.isCreateSubmittable()).toBe(true);
  });

  it("selecciona y deselecciona escuelas con acciones independientes", () => {
    flushInitialCatalogs();

    component.selectSchool(1);
    expect(component.isSchoolSelected(1)).toBe(true);

    component.deselectSchool(1);
    expect(component.isSchoolSelected(1)).toBe(false);
  });

  // -- Renderizado DOM: tono de badge → clase (lock-in, EduCore) -----

  it("renderiza las celdas de estado con la clase de tono y la etiqueta correctas", () => {
    flushInitialCatalogs();
    component.queryForm.patchValue({ teacherId: 5 });

    component.onSubmitQuery();
    http
      .expectOne(r => r.url === url(5) && r.method === "GET")
      .flush(teacherContractsListedFixture);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const rows =
      host.querySelectorAll<HTMLTableRowElement>(".ec-table tbody tr");
    expect(rows.length).toBe(2);
    const [cancelledRow, confirmedRow] = Array.from(rows);

    // Fila 0 (fixture[0]): persistedStatus "Cancelled" -> tono "closed";
    // effectiveStatus "Cancelled" -> tono "expired". Los tonos difieren
    // entre sí, por lo que una interpolación persistedTone/effectiveTone
    // invertida en el template haría fallar estas dos aserciones.
    const cancelledPersistedBadge = cancelledRow.querySelector(
      "td:nth-child(3) .ec-badge.ec-badge--status.ec-badge--closed",
    );
    expect(cancelledPersistedBadge).not.toBeNull();
    expect(cancelledPersistedBadge?.textContent?.trim()).toBe("Cancelado");

    const cancelledTemporalBadge = cancelledRow.querySelector(
      "td:nth-child(4) .ec-badge.ec-badge--temporal.ec-badge--expired",
    );
    expect(cancelledTemporalBadge).not.toBeNull();
    expect(cancelledTemporalBadge?.textContent?.trim()).toBe("Cancelado");

    // Fila 1 (fixture[1]): persistedStatus "Confirmed" -> tono "active";
    // effectiveStatus "Effective" -> tono "current". De nuevo, ambos
    // tonos difieren entre sí para descartar un swap de interpolación.
    const confirmedPersistedBadge = confirmedRow.querySelector(
      "td:nth-child(3) .ec-badge.ec-badge--status.ec-badge--active",
    );
    expect(confirmedPersistedBadge).not.toBeNull();
    expect(confirmedPersistedBadge?.textContent?.trim()).toBe("Vigente");

    const confirmedTemporalBadge = confirmedRow.querySelector(
      "td:nth-child(4) .ec-badge.ec-badge--temporal.ec-badge--current",
    );
    expect(confirmedTemporalBadge).not.toBeNull();
    expect(confirmedTemporalBadge?.textContent?.trim()).toBe("Vigente");
  });

  // -- Single-flight: no se duplica ni cancela una escritura en curso --

  it("ignora un segundo submit y mantiene el botón disabled single-flight", () => {
    flushInitialCatalogs();
    component.createForm.patchValue({
      teacherId: 5,
      startDate: "2026-03-01",
    });
    component.selectSchool(1);
    component.onSubmitCreate();
    const first = http.expectOne(r => r.url === url(5) && r.method === "POST");

    component.selectSchool(2);
    component.onSubmitCreate();
    http.expectNone(r => r.url === url(5) && r.method === "POST");
    expect(first.cancelled).toBe(false);
    expect(component.isCreating()).toBe(true);
    fixture.detectChanges();
    const nativeElement: unknown = fixture.nativeElement;
    if (!(nativeElement instanceof HTMLElement)) {
      throw new Error("Expected an HTMLElement test host");
    }
    const submit = nativeElement.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    );
    expect(submit?.disabled).toBe(true);
    expect(submit?.getAttribute("aria-busy")).toBe("true");

    first.flush(teacherContractsCreatedFixture);
    expect(component.createSuccess()).not.toBeNull();
    http
      .expectOne(request => request.url === url(5) && request.method === "GET")
      .flush(teacherContractsListedFixture);
  });
});
