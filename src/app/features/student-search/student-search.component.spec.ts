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
  classGroupsFixture,
  emptyClassGroupsFixture,
  emptyEnrollmentListResponseFixture,
  enrollmentListResponseFixture,
  gradesFixture,
  schoolsFixture,
} from "../../../testing/fixtures";
import { StudentHistoryNavigationHandoff } from "../student-history/student-history.navigation";
import { StudentSearchComponent } from "./student-search.component";
import { STUDENT_SEARCH_REMOTE_STATUS } from "./student-search.constants";
import { StudentSearchFacade } from "./student-search.facade";

const ACADEMIC_YEARS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`;
const CLASS_GROUPS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`;
const ENROLLMENTS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`;
const GRADES_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`;
const SCHOOLS_URL = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`;
const HTTP_NOT_FOUND_STATUS = 404;
const HTTP_NOT_FOUND_STATUS_TEXT = "Not Found";
const LEAP_DAY = "2024-02-29";
const REFERENCE_DATE = "2026-07-10";

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
    http.expectOne(SCHOOLS_URL).flush(schoolsFixture);
    http.expectOne(GRADES_URL).flush(gradesFixture);
    http.expectOne(ACADEMIC_YEARS_URL).flush(academicYearsFixture);
  }

  function flushSearchClassGroups(
    groups: typeof classGroupsFixture = classGroupsFixture,
    schoolId = "1",
  ): void {
    const request = http.expectOne(
      candidate => candidate.url === CLASS_GROUPS_URL,
    );
    expect(request.request.params.get("schoolId")).toBe(schoolId);
    expect(request.request.params.get("gradeId")).toBe("1");
    expect(request.request.params.get("academicYearId")).toBe("2");
    request.flush(groups);
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
    http.expectOne(SCHOOLS_URL).flush(schoolsFixture);
    http.expectOne(GRADES_URL).flush(apiProblemNotFoundFixture, {
      status: HTTP_NOT_FOUND_STATUS,
      statusText: HTTP_NOT_FOUND_STATUS_TEXT,
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });
    http.expectOne(ACADEMIC_YEARS_URL).flush(academicYearsFixture);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain("No se pudieron cargar grados");
    const retry = Array.from(host.querySelectorAll("button")).find(button =>
      button.textContent?.includes("Reintentar grados"),
    );

    retry?.click();

    http.expectOne(GRADES_URL).flush(gradesFixture);
    expect(retry).toBeDefined();
  });

  it("permite reintentar escuelas y años desde sus alertas", () => {
    flushInitialCatalogs();
    component.retrySchools();
    http.expectOne(SCHOOLS_URL).flush(apiProblemNotFoundFixture, {
      status: HTTP_NOT_FOUND_STATUS,
      statusText: HTTP_NOT_FOUND_STATUS_TEXT,
    });
    component.retryAcademicYears();
    http.expectOne(ACADEMIC_YEARS_URL).flush(apiProblemNotFoundFixture, {
      status: HTTP_NOT_FOUND_STATUS,
      statusText: HTTP_NOT_FOUND_STATUS_TEXT,
    });
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    const retrySchools = buttons.find(button =>
      button.textContent?.includes("Reintentar escuelas"),
    );
    const retryAcademicYears = buttons.find(button =>
      button.textContent?.includes("Reintentar años académicos"),
    );
    expect(retrySchools).toBeDefined();
    expect(retryAcademicYears).toBeDefined();
    if (retrySchools === undefined || retryAcademicYears === undefined) {
      throw new Error("Expected catalog retry controls");
    }

    retrySchools.click();
    const schoolsRetryRequest = http.expectOne(SCHOOLS_URL);
    expect(schoolsRetryRequest.request.method).toBe("GET");
    schoolsRetryRequest.flush(schoolsFixture);

    retryAcademicYears.click();
    const yearsRetryRequest = http.expectOne(ACADEMIC_YEARS_URL);
    expect(yearsRetryRequest.request.method).toBe("GET");
    yearsRetryRequest.flush(academicYearsFixture);
  });

  it("bloquea el botón Buscar hasta completar la combinación académica", () => {
    flushInitialCatalogs();
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1 });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    expect(component.form.invalid).toBe(false);
  });

  it("formats singular and plural result counts without conditional markup", () => {
    flushInitialCatalogs();
    expect(component.resultCountLabel(1)).toBe("1 inscripción");
    expect(component.resultCountLabel(2)).toBe("2 inscripciones");
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

    component.form.controls.asOfDate.setValue(LEAP_DAY);
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

    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        'output[data-testid="search-loading"]',
      ),
    ).not.toBeNull();
    http.expectNone(r => r.url === ENROLLMENTS_URL);
    flushSearchClassGroups();
    const req = http.expectOne(r => r.url === ENROLLMENTS_URL);
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
      asOfDate: REFERENCE_DATE,
    });

    await component.onSubmit();

    flushSearchClassGroups();
    const req = http.expectOne(r => r.url === ENROLLMENTS_URL);
    expect(req.request.params.get("asOfDate")).toBe(REFERENCE_DATE);
    req.flush(emptyEnrollmentListResponseFixture);

    expect(component.isEmpty()).toBe(true);
  });

  it("submit inválido no genera GET y marca todos los campos como touched", async () => {
    flushInitialCatalogs();
    await component.onSubmit();
    expect(component.form.touched).toBe(true);
    http.expectNone(r => r.url === CLASS_GROUPS_URL);
    http.expectNone(r => r.url === ENROLLMENTS_URL);
  });

  it("renderiza noGroups con copy accesible y no consulta inscripciones", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    flushSearchClassGroups(emptyClassGroupsFixture);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const emptyState = host.querySelector(
      'section[data-testid="search-empty-no-groups"]',
    );
    expect(emptyState?.getAttribute("aria-labelledby")).toBe(
      "search-no-groups-title",
    );
    expect(emptyState?.querySelector("h2")?.textContent?.trim()).toBe(
      "Sin grupos disponibles",
    );
    const announcement = emptyState?.querySelector("output");
    expect(announcement?.getAttribute("aria-live")).toBe("polite");
    expect(announcement?.textContent?.trim()).toBe(
      "La combinación seleccionada es válida, pero no tiene grupos.",
    );
    http.expectNone(request => request.url === ENROLLMENTS_URL);
  });

  it("respuesta de inscripciones 200 [] renderiza empty/noResults accesible", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(emptyEnrollmentListResponseFixture);
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
    expect(component.isSuccess()).toBe(false);
    const emptyState = (fixture.nativeElement as HTMLElement).querySelector(
      'section[data-testid="search-empty-no-results"]',
    );
    expect(emptyState?.getAttribute("aria-labelledby")).toBe(
      "search-no-results-title",
    );
    expect(emptyState?.querySelector("h2")?.textContent?.trim()).toBe(
      "Sin inscripciones",
    );
    const announcement = emptyState?.querySelector("output");
    expect(announcement?.getAttribute("aria-live")).toBe("polite");
    expect(announcement?.textContent?.replaceAll(/\s+/g, " ").trim()).toContain(
      "Hay grupos para la combinación seleccionada, pero no hay inscripciones registradas.",
    );
  });

  it("404 con ProblemDetails expone error mapeado", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(apiProblemNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
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
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(apiProblemNotFoundFixture, {
        status: HTTP_NOT_FOUND_STATUS,
        statusText: HTTP_NOT_FOUND_STATUS_TEXT,
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasError()).toBe(true);

    component.onRetry();

    flushSearchClassGroups();
    const retryReq = http.expectOne(r => r.url === ENROLLMENTS_URL);
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
    const req = http.expectOne(r => r.url === CLASS_GROUPS_URL);
    const search = fixture.debugElement.injector.get(StudentSearchFacade);
    const resetSearch = vi.spyOn(search, "reset");
    expect(component.isLoading()).toBe(true);

    await component.onReset();

    expect(req.cancelled).toBe(true);
    expect(resetSearch).toHaveBeenCalledOnce();
    expect(component.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.idle);
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
      asOfDate: REFERENCE_DATE,
    });

    const reset = component.onReset();

    expect(component.form.getRawValue()).toEqual({
      schoolId: null,
      gradeId: null,
      academicYearId: null,
      asOfDate: "",
    });
    expect(component.result().status).toBe(STUDENT_SEARCH_REMOTE_STATUS.idle);
    expect(resetSearch).toHaveBeenCalledOnce();
    http.expectNone(request => request.url === CLASS_GROUPS_URL);
    http.expectNone(request => request.url === ENROLLMENTS_URL);
    await reset;
    expect(resetSearch).toHaveBeenCalledOnce();
  });

  it("un segundo submit programático cancela la cadena previa", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    await component.onSubmit();
    flushSearchClassGroups();
    const first = http.expectOne(
      r => r.url === ENROLLMENTS_URL && r.params.get("schoolId") === "1",
    );

    component.form.patchValue({ schoolId: 2 });
    await component.onSubmit();
    expect(first.cancelled).toBe(true);

    flushSearchClassGroups(classGroupsFixture, "2");
    const second = http.expectOne(
      r => r.url === ENROLLMENTS_URL && r.params.get("schoolId") === "2",
    );
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
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
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

  // -- Stale-results banner ------------------------------------------------
  //
  // The banner (`data-testid="search-stale"`) warns that the visible
  // results no longer match the filters currently shown in the form. It is
  // derived purely from view state: `component.isStale()` compares the live
  // form value against the filters snapshot captured by the facade for the
  // last executed search (`StudentSearchFacade#filters`).

  it("never shows the stale-results banner before the first search", () => {
    flushInitialCatalogs();

    expect(component.isStale()).toBe(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="search-stale"]')).toBeNull();
  });

  it("never shows the stale-results banner while a search is loading", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });

    await component.onSubmit();

    expect(component.isLoading()).toBe(true);
    expect(component.isStale()).toBe(false);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="search-stale"]')).toBeNull();

    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(enrollmentListResponseFixture);
  });

  it("shows the stale-results banner when a query-defining filter changes after results are displayed, without hiding the results", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(enrollmentListResponseFixture);
    expect(component.isStale()).toBe(false);

    component.form.controls.schoolId.setValue(2);

    expect(component.isStale()).toBe(true);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('[data-testid="search-stale"]');
    expect(banner).not.toBeNull();
    expect(banner?.tagName).toBe("OUTPUT");
    expect(banner?.getAttribute("role")).toBeNull();
    expect(banner?.textContent?.trim()).toBe(
      "Los filtros cambiaron desde la última búsqueda. Ejecute una nueva búsqueda para ver resultados actualizados.",
    );
    const results = compiled.querySelector(
      'section[data-testid="search-results"]',
    );
    expect(results).not.toBeNull();
    expect(results?.getAttribute("role")).toBeNull();
    expect(results?.textContent).toContain("2 inscripciones");
  });

  it("hides the stale-results banner once the search is re-executed", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(enrollmentListResponseFixture);
    component.form.controls.schoolId.setValue(2);
    expect(component.isStale()).toBe(true);

    await component.onSubmit();

    expect(component.isStale()).toBe(false);
    flushSearchClassGroups(classGroupsFixture, "2");
    http
      .expectOne(
        r => r.url === ENROLLMENTS_URL && r.params.get("schoolId") === "2",
      )
      .flush(enrollmentListResponseFixture);
    expect(component.isStale()).toBe(false);
  });

  it("hides the stale-results banner when filters return to the values used in the last search, without re-searching", async () => {
    flushInitialCatalogs();
    component.form.patchValue({ schoolId: 1, gradeId: 1, academicYearId: 2 });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
      .flush(enrollmentListResponseFixture);

    component.form.controls.schoolId.setValue(2);
    expect(component.isStale()).toBe(true);

    component.form.controls.schoolId.setValue(1);
    expect(component.isStale()).toBe(false);
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
      asOfDate: REFERENCE_DATE,
    });
    await component.onSubmit();
    flushSearchClassGroups();
    http
      .expectOne(r => r.url === ENROLLMENTS_URL)
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
