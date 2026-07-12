import { HttpHeaders } from "@angular/common/http";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  academicYearsFixture,
  apiProblemNotFoundFixture,
  emptyEnrollmentListResponseFixture,
  enrollmentListResponseFixture,
  gradesFixture,
  schoolsFixture,
} from "../../../testing/fixtures";
import { StudentHistoryNavigationHandoff } from "../student-history/student-history.navigation";
import { StudentSearchComponent } from "./student-search.component";
import { StudentSearchFacade } from "./student-search.facade";

describe("StudentSearchComponent", () => {
  let http: HttpTestingController;
  let component: StudentSearchComponent;
  let fixture: ComponentFixture<StudentSearchComponent>;

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
    fixture = TestBed.createComponent(StudentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  /** Resuelve los tres GET de catálogos globales disparados en ngOnInit. */
  function flushInitialCatalogs(): void {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
  }

  it("carga catálogos al inicializar", () => {
    flushInitialCatalogs();
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
    expect(component.gradeOptions().length).toBe(gradesFixture.length);
    expect(component.academicYearOptions().length).toBe(
      academicYearsFixture.length,
    );
  });

  it("muestra error de catálogo y permite reintentar grados", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain("No se pudieron cargar grados");
    const retry = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Reintentar grados"),
    );

    retry?.click();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
    expect(retry).toBeDefined();
  });

  it("permite reintentar escuelas y años desde sus alertas", () => {
    flushInitialCatalogs();
    component.retrySchools();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    component.retryAcademicYears();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    buttons
      .find((button) => button.textContent?.includes("Reintentar escuelas"))
      ?.click();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    buttons
      .find((button) =>
        button.textContent?.includes("Reintentar años académicos"),
      )
      ?.click();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
  });

  it("bloquea el botón Buscar hasta completar la combinación académica", () => {
    flushInitialCatalogs();
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1 });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    expect(component.form.invalid).toBe(false);
  });

  it("rechaza fechas imposibles y acepta 29 de febrero sólo en año bisiesto", () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-02-29",
    });
    expect(component.form.invalid).toBe(true);

    component.form.controls.asOfDate.setValue("2024-02-29");
    expect(component.form.invalid).toBe(false);
  });

  it("busca cuando la combinación es válida y refleja success con datos", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });

    await component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.method).toBe("GET");
    expect(req.request.params.get("schoolId")).toBe("1");
    expect(req.request.params.get("gradeId")).toBe("1");
    expect(req.request.params.get("academicYearId")).toBe("2");
    expect(req.request.params.has("asOfDate")).toBe(false);
    req.flush(enrollmentListResponseFixture);

    expect(component.isSuccess()).toBe(true);
    expect(component.isLoading()).toBe(false);
    const rows = component.successData();
    expect(rows?.length).toBe(2);
    expect(rows?.[0].fullName).toBe("Ana María Solís");
  });

  it("envía asOfDate cuando se completa en el formulario", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });

    await component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
    req.flush(emptyEnrollmentListResponseFixture);

    expect(component.isEmpty()).toBe(true);
  });

  it("submit inválido no genera GET y marca todos los campos como touched", async () => {
    flushInitialCatalogs();
    await component.onSubmit();
    expect(component.form.touched).toBe(true);
    http.expectNone(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
  });

  it("respuesta 200 [] se traduce a estado empty/noResults", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    http
      .expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      )
      .flush(emptyEnrollmentListResponseFixture);

    expect(component.isEmpty()).toBe(true);
    expect(component.isSuccess()).toBe(false);
  });

  it("404 con ProblemDetails expone error mapeado", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
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

    expect(component.hasError()).toBe(true);
    expect(component.errorProblem()?.code).toBe("resource_not_found");
  });

  it("retry() reenvía la búsqueda tras un error con los filtros vigentes", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
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
    expect(component.hasError()).toBe(true);

    component.onRetry();

    const retryReq = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(retryReq.request.params.get("schoolId")).toBe("1");
    retryReq.flush(enrollmentListResponseFixture);

    expect(component.isSuccess()).toBe(true);
    expect(component.successData()?.length).toBe(2);
  });

  it("el método de ciclo de vida onReset cancela una búsqueda programática", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    const search = fixture.debugElement.injector.get(StudentSearchFacade);
    const resetSearch = vi.spyOn(search, "reset");
    expect(component.isLoading()).toBe(true);

    await component.onReset();

    expect(req.cancelled).toBe(true);
    expect(resetSearch).toHaveBeenCalledOnce();
    expect(component.result().status).toBe("idle");
    expect(component.form.controls.schoolId.value).toBeNull();
  });

  it("clears unsubmitted filters immediately when reset on the queryless route", async () => {
    flushInitialCatalogs();
    const search = fixture.debugElement.injector.get(StudentSearchFacade);
    const resetSearch = vi.spyOn(search, "reset");
    component.form.setValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });

    const reset = component.onReset();

    expect(component.form.getRawValue()).toEqual({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: "",
    });
    expect(component.result().status).toBe("idle");
    expect(resetSearch).toHaveBeenCalledOnce();
    http.expectNone(
      (request) =>
        request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    await reset;
    expect(resetSearch).toHaveBeenCalledOnce();
  });

  it("un segundo submit programático cancela el GET previo", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    await component.onSubmit();
    const first = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.params.get("schoolId") === "1",
    );

    component.form.patchValue({ schoolId: 2 });
    await component.onSubmit();
    const second = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.params.get("schoolId") === "2",
    );
    expect(first.cancelled).toBe(true);

    second.flush(enrollmentListResponseFixture);
    expect(component.isSuccess()).toBe(true);
  });

  it("exposes an enabled history command with a student-specific accessible name", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    http
      .expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      )
      .flush(enrollmentListResponseFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(
      compiled.querySelectorAll<HTMLButtonElement>("button.search-history"),
    );
    expect(buttons).toHaveLength(2);
    const first = buttons[0];
    expect(first?.disabled).toBe(false);
    expect(first?.getAttribute("aria-label")).toBe(
      "Ver historial de Ana María Solís",
    );
    expect(first?.textContent?.trim()).toBe("Ver historial");
  });

  it("delegates history navigation to the volatile handoff", async () => {
    const handoff = TestBed.inject(StudentHistoryNavigationHandoff);
    const navigate = vi
      .spyOn(handoff, "navigateToHistory")
      .mockResolvedValue(true);
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });
    await component.onSubmit();
    http
      .expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      )
      .flush(enrollmentListResponseFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const command = compiled.querySelector<HTMLButtonElement>(
      'button[aria-label="Ver historial de Ana María Solís"]',
    );
    expect(command).not.toBeNull();
    if (command === null) {
      throw new Error("Expected the history command for Ana María Solís");
    }
    command.click();

    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
  });
});
