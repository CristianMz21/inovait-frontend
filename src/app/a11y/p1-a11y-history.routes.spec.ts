import { HttpHeaders } from "@angular/common/http";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "../app.component";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../core/api";
import { StudentHistoryComponent } from "../features/student-history";
import {
  apiProblemHistoryBadRequestFixture,
  apiProblemStudentNotFoundFixture,
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistorySecondYearFixture,
} from "../../testing/fixtures";

const historyUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/99.001.101/history`;

/**
 * CT-A11Y-RPT-HIST — Hardening accesibilidad ruta de historial
 * académico-docente (FR-RPT-004, WU11-STU).
 *
 * Cubre shell, landmarks, navegación principal, foco programático,
 * formularios, estados remotos (`loading`, `success`, `empty`, `error`),
 * línea de tiempo `<ol>` + `<time>`, media query 320 px,
 * `prefers-reduced-motion` y tokens de contraste WCAG 2.2 AA.
 */
describe("CT-A11Y-RPT-HIST — Hardening accesibilidad ruta historial", () => {
  describe("Shell (App)", () => {
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [provideRouter([])],
      }).compileComponents();
    });

    afterEach(() => {
      TestBed.resetTestingModule();
    });

    it("mantiene skip-link, main landmark y nav principal", () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const skip = compiled.querySelector("a.skip-link");
      expect(skip?.getAttribute("href")).toBe("#main");
      expect(skip?.textContent?.trim()).toBe("Saltar al contenido principal");

      const main = compiled.querySelector("main#main");
      expect(main).toBeTruthy();
      expect(main?.getAttribute("tabindex")).toBe("-1");

      const nav = compiled.querySelector(
        'nav[aria-label="Navegación principal"]',
      );
      expect(nav).toBeTruthy();
    });

    it("habilita Historia como enlace real sin estado ARIA redundante", () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const navLinks = Array.from(compiled.querySelectorAll("nav a"));
      const history = navLinks.find(
        (link) => link.textContent?.trim() === "Historia",
      );

      expect(history).toBeTruthy();
      expect(history?.getAttribute("href")).toBe("/student-history");
      expect(history?.hasAttribute("aria-disabled")).toBe(false);
    });

    it('el footer refleja "Reportes operativos · Historia operativa"', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector("footer")?.textContent).toContain(
        "Reportes operativos · Historia operativa",
      );
    });
  });

  function bootstrap(component: unknown): void {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, component],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([]),
      ],
    });
  }

  function styleText(): string {
    return Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
  }

  function expectResponsiveContrastTokens(): void {
    const css = styleText();
    expect(css).toContain("max-width: 320px");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("--app-muted");
    expect(css).toContain("--app-accent");
    expect(css).toContain("--app-border");
  }

  // ----------------------------------------------------------------
  // CT-A11Y-RPT-HIST — Vista historial académico-docente
  // ----------------------------------------------------------------

  describe("CT-A11Y-RPT-HIST — Historial académico-docente", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<StudentHistoryComponent>;
    let component: StudentHistoryComponent;

    beforeEach(() => {
      bootstrap(StudentHistoryComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(StudentHistoryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it("expone h1 enfocable, fieldset+legend, 2 aria-required y submit con aria-busy=false", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      expect(headings[0]?.getAttribute("tabindex")).toBe("-1");
      expect(headings[0]?.textContent?.trim()).toBe(
        "Historial académico-docente",
      );
      expect(compiled.querySelector("fieldset legend")).toBeTruthy();
      expect(compiled.querySelectorAll('[aria-required="true"]').length).toBe(
        2,
      );
      expect(
        compiled
          .querySelector('button[type="submit"]')
          ?.getAttribute("aria-busy"),
      ).toBe("false");
    });

    it("success expone <ol> semántica, <time>, role=status y sin role=alert", () => {
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

      http.expectOne((r) => r.url === historyUrl).flush(studentHistoryFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const list = compiled.querySelector("ol.history-list");
      expect(list).toBeTruthy();
      const time = compiled.querySelector(
        "time.history-card-header time, time",
      );
      expect(time).toBeTruthy();
      expect(time?.getAttribute("datetime")).toBe("2026-03-02");
      expect(
        compiled.querySelector('.history-context[role="status"]'),
      ).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it("success multi-año preserva el orden estable de inscripciones (desc startDate)", () => {
      component.form.patchValue({
        documentType: "DNI",
        documentNumber: "99.001.101",
      });
      component.onSubmit();
      fixture.detectChanges();
      http
        .expectOne((r) => r.url === historyUrl)
        .flush(studentHistorySecondYearFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const items = compiled.querySelectorAll("li.history-entry");
      expect(items.length).toBe(2);
      const times = compiled.querySelectorAll("time");
      expect(times[0]?.getAttribute("datetime")).toBe("2026-03-02");
      expect(times[1]?.getAttribute("datetime")).toBe("2025-03-03");
    });

    it("200 enrollments [] expone empty role=status con botón Reintentar", () => {
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
        .expectOne((r) => r.url === historyUrl)
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
        .expectOne((r) => r.url === historyUrl)
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

    it("retry desde error transita correctamente el estado remoto", () => {
      component.form.patchValue({
        documentType: "DNI",
        documentNumber: "99.001.101",
      });
      component.onSubmit();
      fixture.detectChanges();
      http
        .expectOne((r) => r.url === historyUrl)
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
      http.expectOne((r) => r.url === historyUrl).flush(studentHistoryFixture);
      fixture.detectChanges();
      expect(component.isSuccess()).toBe(true);
    });

    it("incluye media query 320 px, prefers-reduced-motion y tokens de contraste", () => {
      expectResponsiveContrastTokens();
    });
  });
});
