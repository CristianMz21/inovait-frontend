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
} from "../../core/api";
import {
  apiProblemHistoryBadRequestFixture,
  apiProblemStudentNotFoundFixture,
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistoryNoAssignmentsFixture,
  studentHistorySecondYearFixture,
} from "../../../testing/fixtures";
import { StudentHistoryComponent } from "./student-history.component";

const baseUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/99.001.101/history`;

describe("StudentHistoryComponent (CT-HIST-COMP)", () => {
  let http: HttpTestingController;
  let fixture: ComponentFixture<StudentHistoryComponent>;
  let component: StudentHistoryComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, StudentHistoryComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StudentHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("expone h1 enfocable y el botón disabled hasta completar la identidad", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll("h1");
    expect(headings.length).toBe(1);
    expect(headings[0]?.getAttribute("tabindex")).toBe("-1");
    expect(headings[0]?.textContent?.trim()).toBe(
      "Historial académico-docente",
    );

    const submit = compiled.querySelector('button[type="submit"]');
    expect(submit?.hasAttribute("disabled")).toBe(true);
    expect(submit?.getAttribute("aria-busy")).toBe("false");

    expect(compiled.querySelector("fieldset legend")).toBeTruthy();
    expect(compiled.querySelectorAll('[aria-required="true"]').length).toBe(2);
  });

  it("bloquea el envío hasta que documentType y documentNumber cumplan longitudes canónicas", () => {
    component.form.patchValue({ documentType: "DNI" });
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    fixture.detectChanges();
    expect(component.form.invalid).toBe(false);
  });

  it("submit inválido no genera GET y marca todos los campos como touched", () => {
    component.onSubmit();
    fixture.detectChanges();
    expect(component.form.touched).toBe(true);
    http.expectNone((r) => r.url.startsWith(baseUrl.split("/DNI")[0]));
  });

  it("success muestra la línea de tiempo con <ol>, <time> y asignaciones preservadas", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="history-loading"][role="status"]',
      ),
    ).toBeTruthy();

    http.expectOne((r) => r.url === baseUrl).flush(studentHistoryFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const list = compiled.querySelector("ol.history-list");
    expect(list).toBeTruthy();
    const items = compiled.querySelectorAll("li.history-entry");
    expect(items.length).toBe(1);
    const time = compiled.querySelector("time");
    expect(time?.getAttribute("datetime")).toBe("2026-03-02");
    expect(compiled.querySelectorAll(".history-assignment").length).toBe(1);
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
  });

  it("success con 2 años preserva el orden estable (desc por academicYear.startDate)", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === baseUrl)
      .flush(studentHistorySecondYearFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const items = compiled.querySelectorAll("li.history-entry");
    expect(items.length).toBe(2);
    const headings = Array.from(
      compiled.querySelectorAll(".history-card-header h3"),
    );
    expect(headings[0]?.textContent).toContain("2026");
    expect(headings[1]?.textContent).toContain("2025");
    const times = compiled.querySelectorAll("time");
    expect(times[0]?.getAttribute("datetime")).toBe("2026-03-02");
    expect(times[1]?.getAttribute("datetime")).toBe("2025-03-03");
    const assignmentsYear1 = items[0]?.querySelectorAll(".history-assignment");
    expect(assignmentsYear1?.length).toBe(2);
  });

  it("inscripciones sin asignaciones muestran teachingAssignments: []", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "88.200.300",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne(
        (r) =>
          r.url ===
          `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
      )
      .flush(studentHistoryNoAssignmentsFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emptyMessage = compiled.querySelector(".history-assignments-empty");
    expect(emptyMessage?.textContent).toContain("Sin asignaciones docentes");
  });

  it("200 enrollments [] mapea a empty/noResults con botón Reintentar", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "88.200.300",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne(
        (r) =>
          r.url ===
          `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
      )
      .flush(emptyStudentHistoryFixture);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const empty = compiled.querySelector(
      '[data-testid="history-empty"][role="status"]',
    );
    expect(empty).toBeTruthy();
    expect(empty?.querySelector("button")?.textContent?.trim()).toBe(
      "Reintentar",
    );
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
  });

  it("404 student_not_found expone role=alert y conserva filtros", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === baseUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('[data-testid="history-error"][role="alert"]'),
    ).toBeTruthy();
    expect(component.form.controls.documentNumber.value).toBe("99.001.101");
    expect(
      compiled.querySelector('[data-testid="history-results"]'),
    ).toBeNull();
  });

  it("400 invalid_request expone role=alert y conserva filtros", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === baseUrl)
      .flush(apiProblemHistoryBadRequestFixture, {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('[data-testid="history-error"][role="alert"]'),
    ).toBeTruthy();
    expect(component.form.controls.documentNumber.value).toBe("99.001.101");
  });

  it("retry desde error reenvía y transita a success", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === baseUrl)
      .flush(apiProblemStudentNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
    fixture.detectChanges();
    expect(component.hasError()).toBe(true);

    component.onRetry();
    fixture.detectChanges();
    const retryReq = http.expectOne((r) => r.url === baseUrl);
    retryReq.flush(studentHistoryFixture);
    fixture.detectChanges();

    expect(component.isSuccess()).toBe(true);
    expect(component.successData()?.enrollments).toHaveLength(1);
  });

  it("retry desde empty también dispara una nueva consulta", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "88.200.300",
    });
    component.onSubmit();
    fixture.detectChanges();
    http
      .expectOne(
        (r) =>
          r.url ===
          `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
      )
      .flush(emptyStudentHistoryFixture);
    fixture.detectChanges();
    expect(component.isEmpty()).toBe(true);

    component.onRetry();
    fixture.detectChanges();
    http
      .expectOne(
        (r) =>
          r.url ===
          `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
      )
      .flush(studentHistoryFixture);
    fixture.detectChanges();

    expect(component.isSuccess()).toBe(true);
  });

  it("reset cancela la búsqueda en curso y vuelve a idle", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === baseUrl);
    expect(component.isLoading()).toBe(true);

    component.onReset();
    fixture.detectChanges();
    expect(req.cancelled).toBe(true);
    expect(component.result().status).toBe("idle");
    expect(component.form.controls.documentType.value).toBe("");
    expect(component.form.controls.documentNumber.value).toBe("");
  });

  it("cambiar documentNumber durante loading cancela el GET previo (stale descartado)", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    fixture.detectChanges();
    const first = http.expectOne((r) => r.url === baseUrl);

    component.form.patchValue({ documentNumber: "88.200.300" });
    component.onSubmit();
    fixture.detectChanges();
    const second = http.expectOne(
      (r) =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/88.200.300/history`,
    );
    expect(first.cancelled).toBe(true);

    second.flush(studentHistoryFixture);
    fixture.detectChanges();
    expect(component.isSuccess()).toBe(true);
  });

  it("cancela la consulta pendiente al destruir la ruta", () => {
    component.form.patchValue({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    component.onSubmit();
    const request = http.expectOne((candidate) => candidate.url === baseUrl);

    fixture.destroy();

    expect(request.cancelled).toBe(true);
  });

  it("incluye media query 320 px, prefers-reduced-motion y tokens de contraste", () => {
    const css = Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
    expect(css).toContain("max-width: 320px");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("--app-muted");
    expect(css).toContain("--app-accent");
  });
});
