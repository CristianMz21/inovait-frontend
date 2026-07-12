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
  ageDistributionFixture,
  apiProblemAsOfDateInvalidFixture,
  apiProblemBadRequestFixture,
  emptyAgeDistributionFixture,
  gradesFixture,
  schoolsFixture,
} from "../../../../testing/fixtures";
import { AgeDistributionComponent } from "./age-distribution.component";

const ageUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/age-distribution`;

function flushCatalogs(http: HttpTestingController): void {
  const pending = http.match(() => true);
  for (const req of pending) {
    if (req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`) {
      req.flush(schoolsFixture);
    } else if (
      req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`
    ) {
      req.flush(gradesFixture);
    } else if (
      req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`
    ) {
      req.flush(academicYearsFixture);
    }
  }
}

describe("AgeDistributionComponent (CT-AGE-RPT)", () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<AgeDistributionComponent>;
  let component: AgeDistributionComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, AgeDistributionComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AgeDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  // -- Carga inicial -----------------------------------------------------

  it("carga catálogos (escuelas, grados, años académicos) al inicializar", () => {
    flushCatalogs(http);
    expect(component.academicYearOptions().length).toBe(
      academicYearsFixture.length,
    );
    expect(component.schoolOptions().length).toBe(schoolsFixture.length);
    expect(component.gradeOptions().length).toBe(gradesFixture.length);
  });

  it("muestra error de catálogo y permite reintentar años académicos", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain(
      "No se pudieron cargar años académicos para distribución",
    );
    const retry = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes(
        "Reintentar años académicos para distribución",
      ),
    );

    retry?.click();

    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
    expect(retry).toBeDefined();
  });

  it("permite reintentar escuelas y grados desde sus alertas", () => {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
      });
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(apiProblemBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
      });
    fixture.detectChanges();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("button"),
    );
    buttons
      .find((button) =>
        button.textContent?.includes("Reintentar escuelas para distribución"),
      )
      ?.click();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    buttons
      .find((button) =>
        button.textContent?.includes("Reintentar grados para distribución"),
      )
      ?.click();
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
  });

  // -- Accesibilidad -----------------------------------------------------

  it('renderiza exactamente un <h1> con tabindex="-1" enfocable programáticamente', () => {
    flushCatalogs(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    const h1 = headings[0];
    expect(h1?.getAttribute("tabindex")).toBe("-1");
    expect((h1 as HTMLElement).tabIndex).toBe(-1);
    expect(h1?.textContent?.trim()).toBe("Distribución por edad");
  });

  it("estructura los filtros con <fieldset><legend>", () => {
    flushCatalogs(http);
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
    flushCatalogs(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const required = compiled.querySelectorAll('[aria-required="true"]');
    // Sólo `academicYearId` es obligatorio.
    expect(required.length).toBe(1);
  });

  it('botón submit expone aria-busy="false" en estado idle', () => {
    flushCatalogs(http);
    const compiled = fixture.nativeElement as HTMLElement;
    const submit = compiled.querySelector('button[type="submit"]');
    expect(submit).toBeTruthy();
    expect(submit?.getAttribute("aria-busy")).toBe("false");
  });

  // -- Estado del formulario --------------------------------------------

  it("bloquea el botón Consultar sin año académico", () => {
    flushCatalogs(http);
    expect(component.form.invalid).toBe(true);
  });

  it("habilita el botón Consultar con año académico", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    expect(component.form.invalid).toBe(false);
  });

  // -- Success -----------------------------------------------------------

  it("submit() válido expone loading y luego success con las tres bandas canónicas", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
    expect(req.request.params.get("academicYearId")).toBe("2");
    req.flush(ageDistributionFixture);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    const data = component.successData();
    expect(data).not.toBeNull();
    expect(data?.bands).toHaveLength(3);
    expect(data?.bands.map((b) => b.id)).toEqual([
      "age3To7",
      "age8To12",
      "ageOver12",
    ]);
    expect(data?.totalCount).toBe(12);

    // Tabla accesible
    const compiled = fixture.nativeElement as HTMLElement;
    const results = compiled.querySelector('[data-testid="age-results"]');
    expect(results).toBeTruthy();
    const caption = compiled.querySelector("caption.visually-hidden");
    expect(caption?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    const headers = compiled.querySelectorAll('th[scope="col"]');
    expect(headers.length).toBe(3);
  });

  // -- Renderizado DOM: KPIs de bandas (lock-in, EduCore) -----------------

  it("renderiza la tarjeta KPI destacada para 3-7 y dos tarjetas KPI estándar con los valores correctos", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    http.expectOne((r) => r.url === ageUrl).flush(ageDistributionFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const kpis = compiled.querySelectorAll(".age-kpis .ec-kpi");
    expect(kpis.length).toBe(3);

    const [featured, second, third] = Array.from(kpis);
    expect(featured?.classList.contains("ec-kpi--featured")).toBe(true);
    expect(featured?.querySelector(".ec-kpi__value")?.textContent?.trim()).toBe(
      "4",
    );
    expect(featured?.querySelector(".ec-kpi__label")?.textContent).toContain(
      "3 a 7 años",
    );

    expect(second?.classList.contains("ec-kpi--featured")).toBe(false);
    expect(second?.querySelector(".ec-kpi__value")?.textContent?.trim()).toBe(
      "6",
    );
    expect(second?.querySelector(".ec-kpi__label")?.textContent?.trim()).toBe(
      "8 a 12 años",
    );

    expect(third?.classList.contains("ec-kpi--featured")).toBe(false);
    expect(third?.querySelector(".ec-kpi__value")?.textContent?.trim()).toBe(
      "2",
    );
    expect(third?.querySelector(".ec-kpi__label")?.textContent?.trim()).toBe(
      "Mayores de 12 años",
    );
  });

  it("200 con ceros expone success sin error y conteos en 0", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    http.expectOne((r) => r.url === ageUrl).flush(emptyAgeDistributionFixture);

    const data = component.successData();
    expect(data).not.toBeNull();
    expect(data?.totalCount).toBe(0);
    expect(data?.bands.every((b) => b.count === 0)).toBe(true);
    expect(component.hasError()).toBe(false);
  });

  // -- Errores canónicos -------------------------------------------------

  it('400 expone region role="alert" sin success', () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 0 });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
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

  it('422 as_of_date_invalid conserva los filtros y expone role="alert"', () => {
    flushCatalogs(http);
    component.form.patchValue({
      academicYearId: 2,
      asOfDate: "2010-01-01",
    });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
    expect(req.request.params.get("asOfDate")).toBe("2010-01-01");
    req.flush(apiProblemAsOfDateInvalidFixture, {
      status: 422,
      statusText: "Unprocessable Entity",
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[data-testid="age-error"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(component.successData()).toBeNull();
    // Los filtros se conservan para corrección.
    expect(component.form.controls.academicYearId.value).toBe(2);
    expect(component.form.controls.asOfDate.value).toBe("2010-01-01");
  });

  // -- Retry / Reset ----------------------------------------------------

  it("retry() reenvía la consulta tras un error con los filtros vigentes", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    http
      .expectOne((r) => r.url === ageUrl)
      .flush(apiProblemAsOfDateInvalidFixture, {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasError()).toBe(true);

    component.onRetry();
    const retryReq = http.expectOne((r) => r.url === ageUrl);
    retryReq.flush(ageDistributionFixture);
    expect(component.isSuccess()).toBe(true);
  });

  it("reset() cancela el envío en curso y vuelve a idle", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();

    const req = http.expectOne((r) => r.url === ageUrl && r.method === "GET");
    expect(component.isLoading()).toBe(true);

    component.onReset();
    expect(req.cancelled).toBe(true);
    expect(component.result().status).toBe("idle");
    expect(component.form.controls.academicYearId.value).toBeNull();
  });

  // -- Cancel-on-switch -------------------------------------------------

  it("cambiar academicYearId entre submits cancela el GET previo", () => {
    flushCatalogs(http);
    component.form.patchValue({ academicYearId: 1 });
    component.onSubmit();
    const first = http.expectOne(
      (r) => r.url === ageUrl && r.params.get("academicYearId") === "1",
    );

    component.form.patchValue({ academicYearId: 2 });
    component.onSubmit();
    const second = http.expectOne(
      (r) => r.url === ageUrl && r.params.get("academicYearId") === "2",
    );
    expect(first.cancelled).toBe(true);

    second.flush(ageDistributionFixture);
    const data = component.successData();
    expect(data?.academicYearId).toBe(2);
  });
});
