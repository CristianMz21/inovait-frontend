import { HttpHeaders } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../../core/api";
import {
  academicYearsFixture,
  apiProblemBadRequestFixture,
  apiProblemNotFoundFixture,
  emptyTopSchoolsFixture,
  topSchoolsFixture,
  topSchoolsSingleFixture,
} from "../../../../testing/fixtures";
import { TopSchoolsComponent } from "./top-schools.component";

const topUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/top-schools`;

function flushAcademicYears(http: HttpTestingController): void {
  const pending = http.match(() => true);
  for (const req of pending) {
    if (
      req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`
    ) {
      req.flush(academicYearsFixture);
    }
  }
}

describe("TopSchoolsComponent (CT-TOP-RPT)", () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<TopSchoolsComponent>;
  let component: TopSchoolsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TopSchoolsComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TopSchoolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  // -- Accesibilidad ----------------------------------------------------

  it('renderiza exactamente un <h1> con tabindex="-1" enfocable programáticamente', () => {
    flushAcademicYears(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    const h1 = headings[0];
    expect(h1?.getAttribute("tabindex")).toBe("-1");
    expect((h1 as HTMLElement).tabIndex).toBe(-1);
    expect(h1?.textContent?.trim()).toBe("Escuelas líderes por matrícula");
  });

  it("estructura los filtros con <fieldset><legend>", () => {
    flushAcademicYears(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const fieldsets = compiled.querySelectorAll("fieldset");
    expect(fieldsets.length).toBeGreaterThanOrEqual(1);
    for (const fs of Array.from(fieldsets)) {
      const legend = fs.querySelector("legend");
      expect(legend, "fieldset sin <legend>").toBeTruthy();
      expect(legend?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it('marca el campo obligatorio con aria-required="true"', () => {
    flushAcademicYears(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const required = compiled.querySelectorAll('[aria-required="true"]');
    // Sólo `academicYearId` es obligatorio.
    expect(required.length).toBe(1);
  });

  it('botón submit expone aria-busy="false" en estado idle', () => {
    flushAcademicYears(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const submit = compiled.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submit).toBeTruthy();
    expect(submit?.getAttribute("aria-busy")).toBe("false");
  });

  // -- Estado del formulario --------------------------------------------

  it("bloquea el botón Consultar sin año académico", () => {
    flushAcademicYears(http);
    expect(component.form.invalid).toBe(true);
  });

  it("habilita el botón Consultar con año académico", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    expect(component.form.invalid).toBe(false);
  });

  // -- Success ----------------------------------------------------------

  it("submit() válido expone loading y luego success con la tabla a11y (caption + th scope=col)", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
    expect(req.request.params.get("academicYearId")).toBe("2");
    req.flush(topSchoolsFixture);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    const data = component.successData();
    expect(data).not.toBeNull();
    expect(data?.schools).toHaveLength(2);
    // Orden estable preservado.
    expect(data?.schools.map((s) => s.schoolName)).toEqual([
      "Escuela Río Claro",
      "Instituto Horizonte",
    ]);
    // Empates preservados.
    expect(data?.schools.map((s) => s.enrollmentCount)).toEqual([12, 12]);

    // Tabla accesible: caption + th scope=col
    const compiled = fixture.nativeElement as HTMLElement;
    const results = compiled.querySelector('[data-testid="top-results"]');
    expect(results).toBeTruthy();
    const caption = compiled.querySelector("caption.visually-hidden");
    expect(caption).toBeTruthy();
    expect(caption?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    const headers = compiled.querySelectorAll('th[scope="col"]');
    expect(headers.length).toBe(3);
    expect(Array.from(headers).map((h) => h.textContent?.trim())).toEqual([
      "Escuela",
      "Sector",
      "Inscripciones",
    ]);
  });

  it("submit() con un solo líder (sin empates) muestra una sola fila", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    http.expectOne((r) => r.url === topUrl).flush(topSchoolsSingleFixture);
    fixture.detectChanges();

    const data = component.successData();
    expect(data?.schools).toHaveLength(1);
    expect(data?.schools[0]?.schoolName).toBe("Colegio Pampa Azul");
    expect(data?.schools[0]?.enrollmentCount).toBe(8);
  });

  // -- Empty -----------------------------------------------------------

  it("200 [] mapea a empty (con botón Reintentar) y NO a error", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    http.expectOne((r) => r.url === topUrl).flush(emptyTopSchoolsFixture);
    fixture.detectChanges();

    expect(component.isEmpty()).toBe(true);
    expect(component.hasError()).toBe(false);
    expect(component.isSuccess()).toBe(false);
    expect(component.successData()).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const empty = compiled.querySelector('[data-testid="top-empty"]');
    expect(empty).toBeTruthy();
    expect(empty?.getAttribute("role")).toBe("status");
    const emptyButton = empty?.querySelector("button");
    expect(emptyButton).toBeTruthy();
    expect(emptyButton?.textContent?.trim()).toBe("Reintentar");
  });

  it("retry desde empty reenvía la consulta y puede transicionar a success", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    http.expectOne((r) => r.url === topUrl).flush(emptyTopSchoolsFixture);
    expect(component.isEmpty()).toBe(true);

    component.onRetry();
    const retryReq = http.expectOne((r) => r.url === topUrl);
    retryReq.flush(topSchoolsFixture);
    expect(component.isSuccess()).toBe(true);
  });

  // -- Errores canónicos -----------------------------------------------

  it('400 expone region role="alert" sin success', () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 0 });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
    req.flush(apiProblemBadRequestFixture, {
      status: 400,
      statusText: "Bad Request",
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[role="alert"]');
    expect(alert).toBeTruthy();
    expect(component.successData()).toBeNull();
    expect(component.errorProblem()?.code).toBe("invalid_request");
  });

  it('404 con ProblemDetails expone role="alert" y conserva los filtros', () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 9999 });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
    req.flush(apiProblemNotFoundFixture, {
      status: 404,
      statusText: "Not Found",
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[data-testid="top-error"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(component.successData()).toBeNull();
    // Los filtros se conservan para corrección.
    expect(component.form.controls.academicYearId.value).toBe(9999);
  });

  // -- Retry / Reset ---------------------------------------------------

  it("retry() reenvía la consulta tras un error con los filtros vigentes", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    http
      .expectOne((r) => r.url === topUrl)
      .flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasError()).toBe(true);

    component.onRetry();
    const retryReq = http.expectOne((r) => r.url === topUrl);
    retryReq.flush(topSchoolsFixture);
    expect(component.isSuccess()).toBe(true);
  });

  it("reset() cancela el envío en curso y vuelve a idle", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === topUrl && r.method === "GET");
    expect(component.isLoading()).toBe(true);

    component.onReset();
    expect(req.cancelled).toBe(true);
    expect(component.result().status).toBe("idle");
    expect(component.form.controls.academicYearId.value).toBeNull();
  });

  // -- Cancel-on-switch ------------------------------------------------

  it("cambiar academicYearId entre submits cancela el GET previo", () => {
    flushAcademicYears(http);
    component.form.patchValue({ academicYearId: 1 });
    component.onSubmit();
    const first = http.expectOne(
      (r) => r.url === topUrl && r.params.get("academicYearId") === "1",
    );

    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    const second = http.expectOne(
      (r) => r.url === topUrl && r.params.get("academicYearId") === "2",
    );
    expect(first.cancelled).toBe(true);

    second.flush(topSchoolsFixture);
    const data = component.successData();
    expect(data?.academicYearId).toBe(2);
  });

  // -- Catálogo -------------------------------------------------------

  it("carga el catálogo de años académicos al inicializar", () => {
    flushAcademicYears(http);
    expect(component.academicYearOptions().length).toBe(
      academicYearsFixture.length,
    );
  });
});
