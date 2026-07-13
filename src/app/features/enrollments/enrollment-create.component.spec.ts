import { HttpHeaders } from "@angular/common/http";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
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
  academicYearsFixture,
  apiProblemEnrollmentConflictFixture,
  apiProblemNotFoundFixture,
  classGroupsFixture,
  createEnrollmentResponseFixture,
  gradesFixture,
  schoolsFixture,
} from "../../../testing/fixtures";
import { EnrollmentCreateComponent } from "./enrollment-create.component";

describe("EnrollmentCreateComponent", () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<EnrollmentCreateComponent>;
  let component: EnrollmentCreateComponent;

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
    fixture = TestBed.createComponent(EnrollmentCreateComponent);
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

  /** Resuelve el GET /api/class-groups disparado por onGradeChange. */
  function flushClassGroupsRequest(): void {
    const req = http.expectOne(
      r => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    req.flush(classGroupsFixture);
  }

  it("carga catálogos al inicializar", () => {
    flushInitialCatalogs();
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
    expect(component.academicYearOptions().length).toBe(
      academicYearsFixture.length,
    );
    expect(component.gradeOptions().length).toBe(gradesFixture.length);
  });

  it("muestra error de catálogo y permite reintentar escuelas", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
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
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain("No se pudieron cargar escuelas");
    const retry = Array.from(host.querySelectorAll("button")).find(button =>
      button.textContent?.includes("Reintentar escuelas"),
    );

    retry?.click();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    expect(retry).toBeDefined();
  });

  it("permite reintentar años, grados y grupos desde sus alertas", () => {
    flushInitialCatalogs();
    component.retryAcademicYears();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    component.retryGrades();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    http
      .expectOne(
        candidate =>
          candidate.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
      )
      .flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
      });
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    for (const [label, url, response] of [
      [
        "Reintentar años académicos",
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`,
        academicYearsFixture,
      ],
      [
        "Reintentar grados",
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`,
        gradesFixture,
      ],
      [
        "Reintentar grupos",
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
        classGroupsFixture,
      ],
    ] as const) {
      buttons.find(button => button.textContent?.includes(label))?.click();
      http.expectOne(candidate => candidate.url === url).flush(response);
    }

    expect(component.academicYearOptions()).toHaveLength(
      academicYearsFixture.length,
    );
    expect(component.gradeOptions()).toHaveLength(gradesFixture.length);
    expect(component.classGroupOptions()).toHaveLength(
      classGroupsFixture.length,
    );
  });

  it("bloquea niveles inferiores hasta seleccionar el padre (School → Year → Grade → Group)", () => {
    flushInitialCatalogs();
    expect(component.isAcademicYearDisabled()).toBe(true);
    expect(component.isGradeDisabled()).toBe(true);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.schoolId.setValue(1);
    fixture.detectChanges();
    expect(component.isAcademicYearDisabled()).toBe(false);
    expect(component.form.controls.academicYearId.enabled).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLSelectElement>(
        "#enrollment-academic-year-id",
      )?.disabled,
    ).toBe(false);
    expect(component.isGradeDisabled()).toBe(true);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.academicYearId.setValue(2);
    fixture.detectChanges();
    expect(component.isGradeDisabled()).toBe(false);
    expect(component.form.controls.gradeId.enabled).toBe(true);
    expect(component.isClassGroupDisabled()).toBe(true);

    component.form.controls.gradeId.setValue(1);
    fixture.detectChanges();
    expect(component.isClassGroupDisabled()).toBe(false);
    expect(component.form.controls.classGroupId.enabled).toBe(true);

    // El cambio de grado dispara `loadClassGroups`; el test verifica sólo
    // estados de habilitación, así que cerramos la solicitud pendiente para
    // que `http.verify()` no falle al terminar.
    flushClassGroupsRequest();
  });

  it("limpia selecciones descendientes al cambiar un nivel superior", () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    expect(component.form.controls.classGroupId.value).toBe(10);

    component.form.controls.schoolId.setValue(2);
    expect(component.form.controls.academicYearId.value).toBeNull();
    expect(component.form.controls.gradeId.value).toBeNull();
    expect(component.form.controls.classGroupId.value).toBeNull();
  });

  it("recurre a loadClassGroups cuando la cadena padre está completa", () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);

    const req = http.expectOne(
      r => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );
    expect(req.request.params.get("schoolId")).toBe("1");
    expect(req.request.params.get("gradeId")).toBe("1");
    expect(req.request.params.get("academicYearId")).toBe("2");
    req.flush(classGroupsFixture);

    expect(component.classGroupOptions().length).toBe(
      classGroupsFixture.length,
    );
  });

  it("cancela classGroups anterior cuando cambia school antes de responder", () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    const first = http.expectOne(
      r => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );

    component.form.controls.schoolId.setValue(2);
    expect(component.form.controls.academicYearId.value).toBeNull();
    expect(component.form.controls.gradeId.value).toBeNull();
    expect(component.form.controls.classGroupId.value).toBeNull();
    // `first` fue cancelado al limpiar la dependencia.
    expect(first.cancelled).toBe(true);
  });

  it("cancela classGroups pendiente al destruir la ruta", () => {
    flushInitialCatalogs();
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);
    const request = http.expectOne(
      candidate =>
        candidate.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
    );

    fixture.destroy();

    expect(request.cancelled).toBe(true);
  });

  it("submit válido ejecuta POST /api/enrollments y refleja success", () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana María",
      lastNames: "Solís",
      birthDate: "2018-07-10",
    });
    component.form.controls.schoolId.setValue(1);
    component.form.controls.academicYearId.setValue(2);
    component.form.controls.gradeId.setValue(1);

    component.onSubmit();

    flushClassGroupsRequest();

    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    const enrollmentReq = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(enrollmentReq.request.method).toBe("POST");
    enrollmentReq.flush(createEnrollmentResponseFixture);

    expect(component.isSuccess()).toBe(true);
    const state = component.result();
    if (state.status === "success") {
      expect(state.data.enrollmentId).toBe(100);
      expect(state.data.fullName).toBe("Ana María Solís");
    }
  });

  it("mantiene el éxito visible, reinicia la matrícula y enfoca el primer control", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana María",
      lastNames: "Solís",
      birthDate: "2018-07-10",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(createEnrollmentResponseFixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const documentType = host.querySelector<HTMLSelectElement>(
      "#enrollment-document-type",
    );
    expect(
      host.querySelector("[data-testid='enrollment-success']"),
    ).not.toBeNull();
    expect(host.textContent).toContain("Ana María Solís");
    expect(component.result().status).toBe("success");
    expect(component.form.getRawValue()).toEqual({
      documentType: "",
      documentNumber: "",
      firstNames: "",
      lastNames: "",
      birthDate: "",
      schoolId: null,
      academicYearId: null,
      gradeId: null,
      classGroupId: null,
    });
    expect(component.form.controls.academicYearId.disabled).toBe(true);
    expect(component.form.controls.gradeId.disabled).toBe(true);
    expect(component.form.controls.classGroupId.disabled).toBe(true);
    expect(documentType).not.toBeNull();
    expect(host.ownerDocument.activeElement).toBe(documentType);
  });

  it("submit inválido no genera POST y marca todos los campos como touched", () => {
    flushInitialCatalogs();
    component.onSubmit();
    expect(component.form.touched).toBe(true);
    http.expectNone(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
  });

  it("rechaza una fecha de nacimiento futura sin enviar el POST", () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana María",
      lastNames: "Solís",
      birthDate: "2999-01-01",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);

    component.onSubmit();

    expect(component.form.controls.birthDate.hasError("futureDate")).toBe(true);
    http.expectNone(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`);
  });

  it("rechaza una fecha calendario inexistente", () => {
    flushInitialCatalogs();

    component.form.controls.birthDate.setValue("2026-02-30");

    expect(
      component.form.controls.birthDate.hasError("invalidCalendarDate"),
    ).toBe(true);
  });

  it("submit con 409 expone error mapeado", () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana María",
      lastNames: "Solís",
      birthDate: "2018-07-10",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    const req = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    req.flush(apiProblemEnrollmentConflictFixture, {
      status: 409,
      statusText: "Conflict",
      headers: new HttpHeaders({ "Content-Type": "application/problem+json" }),
    });

    expect(component.hasError()).toBe(true);
    expect(component.errorProblem()?.code).toBe("enrollment_conflict");
  });

  it("mapea errores de campo canónicos, conserva desconocidos y enfoca el primero", async () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana María",
      lastNames: "Solís",
      birthDate: "2018-07-10",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();

    http.expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`).flush(
      {
        type: "https://inovait.local/problems/invalid-request",
        title: "La solicitud no es válida",
        status: 400,
        code: "invalid_request",
        errors: {
          SCHOOLID: ["La escuela no es válida."],
          "Student.DocumentNumber": ["El documento ya no es válido."],
          auditReference: ["No se pudo validar la referencia externa."],
        },
      },
      {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      },
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const documentNumber = host.querySelector<HTMLInputElement>(
      "#enrollment-document-number",
    );
    const documentNumberError = host.querySelector<HTMLElement>(
      "#enrollment-document-number-errors",
    );
    const school = host.querySelector<HTMLSelectElement>(
      "#enrollment-school-id",
    );
    expect(component.form.controls.documentNumber.hasError("server")).toBe(
      true,
    );
    expect(component.form.controls.schoolId.hasError("server")).toBe(true);
    expect(documentNumber?.getAttribute("aria-invalid")).toBe("true");
    expect(documentNumber?.getAttribute("aria-describedby")).toContain(
      "enrollment-document-number-errors",
    );
    expect(documentNumberError?.textContent).toContain(
      "El documento ya no es válido.",
    );
    expect(school?.getAttribute("aria-invalid")).toBe("true");
    expect(host.textContent).toContain("auditReference");
    expect(host.textContent).toContain(
      "No se pudo validar la referencia externa.",
    );
    expect(host.ownerDocument.activeElement).toBe(documentNumber);

    component.onRetry();

    expect(component.form.controls.documentNumber.hasError("server")).toBe(
      false,
    );
    const retryRequest = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(retryRequest.request.method).toBe("POST");
    retryRequest.flush(createEnrollmentResponseFixture);
  });

  it("reset() limpia resultado y valores del formulario", () => {
    flushInitialCatalogs();
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
      firstNames: "Ana",
      lastNames: "Solís",
      birthDate: "2018-07-10",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    });
    flushClassGroupsRequest();
    component.form.controls.classGroupId.setValue(10);
    component.onSubmit();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`)
      .flush(createEnrollmentResponseFixture);

    expect(component.isSuccess()).toBe(true);

    component.onReset();

    expect(component.form.controls.documentType.value).toBe("");
    expect(component.form.controls.schoolId.value).toBeNull();
    expect(component.result().status).toBe("idle");
  });
});
