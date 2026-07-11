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
  apiProblemBadRequestFixture,
  apiProblemPeriodInvalidFixture,
  emptyTeacherCountsBySectorFixture,
  teacherCountsBySectorFixture,
} from "../../../../testing/fixtures";
import { TeacherCountsBySectorComponent } from "./teacher-counts-by-sector.component";

const sectorUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/teacher-counts-by-sector`;

describe("TeacherCountsBySectorComponent (CT-SECTOR-RPT)", () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<TeacherCountsBySectorComponent>;
  let component: TeacherCountsBySectorComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, TeacherCountsBySectorComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TeacherCountsBySectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  // -- Accesibilidad ----------------------------------------------------

  it('renderiza exactamente un <h1> con tabindex="-1" enfocable programáticamente', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    const h1 = headings[0];
    expect(h1?.getAttribute("tabindex")).toBe("-1");
    expect((h1 as HTMLElement).tabIndex).toBe(-1);
    expect(h1?.textContent?.trim()).toBe("Docentes distintos por sector");
  });

  it("estructura los filtros con <fieldset><legend>", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const fieldsets = compiled.querySelectorAll("fieldset");
    expect(fieldsets.length).toBeGreaterThanOrEqual(1);
    for (const fs of Array.from(fieldsets)) {
      const legend = fs.querySelector("legend");
      expect(legend, "fieldset sin <legend>").toBeTruthy();
      expect(legend?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  it("ningún filtro expone aria-required (ambos extremos son opcionales)", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const required = compiled.querySelectorAll('[aria-required="true"]');
    expect(required.length).toBe(0);
  });

  it('botón submit expone aria-busy="false" en estado idle', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const submit = compiled.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submit).toBeTruthy();
    expect(submit?.getAttribute("aria-busy")).toBe("false");
  });

  // -- Estado del formulario --------------------------------------------

  it("bloquea el botón Consultar con un solo extremo del período", () => {
    component.form.patchValue({ periodStart: "2026-07-01", periodEnd: "" });
    expect(component.canSubmit()).toBe(false);
  });

  it("habilita el botón Consultar con ambos extremos del período", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    expect(component.canSubmit()).toBe(true);
  });

  it("habilita el botón Consultar con ambos extremos vacíos", () => {
    component.form.patchValue({ periodStart: "", periodEnd: "" });
    expect(component.canSubmit()).toBe(true);
  });

  // -- Success ----------------------------------------------------------

  it("submit() con ambos extremos expone loading y luego success con los dos sectores canónicos", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();
    expect(component.isLoading()).toBe(true);

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === "GET",
    );
    expect(req.request.params.get("periodStart")).toBe("2026-07-01");
    expect(req.request.params.get("periodEnd")).toBe("2026-07-10");
    req.flush(teacherCountsBySectorFixture);
    fixture.detectChanges();

    expect(component.isLoading()).toBe(false);
    const data = component.successData();
    expect(data).not.toBeNull();
    expect(data?.sectors).toHaveLength(2);
    expect(data?.sectors.map((s) => s.id)).toEqual(["public", "private"]);
    expect(data?.sectors[0]?.distinctTeacherCount).toBe(3);
    expect(data?.sectors[1]?.distinctTeacherCount).toBe(2);
    expect(data?.totalDistinctTeacherCount).toBe(5);

    // Tabla accesible
    const compiled = fixture.nativeElement as HTMLElement;
    const results = compiled.querySelector('[data-testid="sector-results"]');
    expect(results).toBeTruthy();
    const caption = compiled.querySelector("caption.visually-hidden");
    expect(caption?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    const headers = compiled.querySelectorAll('th[scope="col"]');
    expect(headers.length).toBe(2);
  });

  it("submit() con filtros vacíos envía GET sin query string", () => {
    component.form.patchValue({ periodStart: "", periodEnd: "" });
    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === "GET",
    );
    expect(req.request.params.has("periodStart")).toBe(false);
    expect(req.request.params.has("periodEnd")).toBe(false);
    req.flush(teacherCountsBySectorFixture);

    expect(component.isSuccess()).toBe(true);
  });

  it("200 con conteos en 0 expone success sin error y conteos en 0", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();

    http
      .expectOne((r) => r.url === sectorUrl && r.method === "GET")
      .flush(emptyTeacherCountsBySectorFixture);

    const data = component.successData();
    expect(data).not.toBeNull();
    expect(data?.totalDistinctTeacherCount).toBe(0);
    expect(data?.sectors.every((s) => s.distinctTeacherCount === 0)).toBe(true);
    expect(component.hasError()).toBe(false);
  });

  // -- Errores canónicos ------------------------------------------------

  it("submit() con filtros asimétricos no invoca el endpoint y mantiene idle", () => {
    component.form.patchValue({ periodStart: "2026-07-01", periodEnd: "" });
    component.onSubmit();

    http.expectNone((r) => r.url === sectorUrl);
    expect(component.result().status).toBe("idle");
  });

  it('400 expone region role="alert" sin success', () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === "GET",
    );
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

  it('422 period_invalid conserva los filtros y expone role="alert"', () => {
    component.form.patchValue({
      periodStart: "2026-07-10",
      periodEnd: "2026-07-01",
    });
    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === "GET",
    );
    expect(req.request.params.get("periodStart")).toBe("2026-07-10");
    expect(req.request.params.get("periodEnd")).toBe("2026-07-01");
    req.flush(apiProblemPeriodInvalidFixture, {
      status: 422,
      statusText: "Unprocessable Entity",
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alert = compiled.querySelector('[data-testid="sector-error"]');
    expect(alert).toBeTruthy();
    expect(alert?.getAttribute("role")).toBe("alert");
    expect(component.successData()).toBeNull();
    // Los filtros se conservan para corrección.
    expect(component.form.controls.periodStart.value).toBe("2026-07-10");
    expect(component.form.controls.periodEnd.value).toBe("2026-07-01");
  });

  // -- Retry / Reset ---------------------------------------------------

  it("retry() reenvía la consulta tras un error con los filtros vigentes", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();

    http
      .expectOne((r) => r.url === sectorUrl)
      .flush(apiProblemPeriodInvalidFixture, {
        status: 422,
        statusText: "Unprocessable Entity",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    expect(component.hasError()).toBe(true);

    component.onRetry();
    const retryReq = http.expectOne((r) => r.url === sectorUrl);
    retryReq.flush(teacherCountsBySectorFixture);
    expect(component.isSuccess()).toBe(true);
  });

  it("reset() cancela el envío en curso y vuelve a idle", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();

    const req = http.expectOne(
      (r) => r.url === sectorUrl && r.method === "GET",
    );
    expect(component.isLoading()).toBe(true);

    component.onReset();
    expect(req.cancelled).toBe(true);
    expect(component.result().status).toBe("idle");
    expect(component.form.controls.periodStart.value).toBe("");
    expect(component.form.controls.periodEnd.value).toBe("");
  });

  // -- Cancel-on-switch ------------------------------------------------

  it("cambiar el período entre submits cancela el GET previo", () => {
    component.form.patchValue({
      periodStart: "2026-07-01",
      periodEnd: "2026-07-10",
    });
    component.onSubmit();
    const first = http.expectOne(
      (r) =>
        r.url === sectorUrl && r.params.get("periodStart") === "2026-07-01",
    );

    component.form.patchValue({
      periodStart: "2026-08-01",
      periodEnd: "2026-08-10",
    });
    component.onSubmit();
    const second = http.expectOne(
      (r) =>
        r.url === sectorUrl && r.params.get("periodStart") === "2026-08-01",
    );
    expect(first.cancelled).toBe(true);

    second.flush(teacherCountsBySectorFixture);
    const data = component.successData();
    expect(data?.periodStart).toBe("2026-07-10");
    expect(data?.periodEnd).toBe("2026-07-10");
  });
});
