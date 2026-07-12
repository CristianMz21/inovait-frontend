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
import { AgeDistributionComponent } from "../features/reports/age-distribution/age-distribution.component";
import { TeacherCountsBySectorComponent } from "../features/reports/teacher-counts-by-sector/teacher-counts-by-sector.component";
import { TopSchoolsComponent } from "../features/reports/top-schools/top-schools.component";
import {
  academicYearsFixture,
  ageDistributionFixture,
  apiProblemAsOfDateInvalidFixture,
  apiProblemNotFoundFixture,
  apiProblemPeriodInvalidFixture,
  emptyAgeDistributionFixture,
  emptyTopSchoolsFixture,
  gradesFixture,
  schoolsFixture,
  teacherCountsBySectorFixture,
  topSchoolsFixture,
} from "../../testing/fixtures";

const ageUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/age-distribution`;
const sectorUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/teacher-counts-by-sector`;
const topUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/reports/top-schools`;

/**
 * CT-A11Y-RPT — Consolidación accesibilidad reportes (T068).
 *
 * Espeja `p0-a11y.routes.spec.ts` para las tres vistas P1 habilitadas por
 * `002-municipal-reports`: distribución por edad, docentes por sector y
 * escuelas líderes. Cubre shell, landmarks, foco programático, formularios,
 * estados remotos, tablas, media query 320 px y tokens de contraste.
 */
describe("CT-A11Y-RPT — Hardening accesibilidad rutas de reportes", () => {
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

    it("habilita Reportes y mantiene Historia como ruta accesible", () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const navLinks = Array.from(compiled.querySelectorAll("nav a"));
      const reports = navLinks.find(
        (link) => link.textContent?.trim() === "Reportes",
      );
      const history = navLinks.find(
        (link) => link.textContent?.trim() === "Historia",
      );

      expect(reports?.textContent?.trim()).toBe("Reportes");
      expect(reports?.getAttribute("href")).toBe("/reports");
      expect(reports?.hasAttribute("aria-disabled")).toBe(false);
      expect(history).toBeTruthy();
      expect(history?.getAttribute("href")).toBe("/student-history");
      expect(history?.hasAttribute("aria-disabled")).toBe(false);
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

  function flushReportCatalogs(http: HttpTestingController): void {
    const pending = http.match(() => true);
    for (const req of pending) {
      if (req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`) {
        req.flush(schoolsFixture);
      } else if (
        req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`
      ) {
        req.flush(gradesFixture);
      } else if (
        req.request.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`
      ) {
        req.flush(academicYearsFixture);
      }
    }
  }

  function styleText(): string {
    return Array.from(document.head.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
  }

  function expectResponsiveContrastTokens(): void {
    const css = styleText();
    expect(css).toContain("max-width: 320px");
    expect(css).toContain("--app-muted");
    expect(css).toContain("--app-accent");
  }

  // ----------------------------------------------------------------
  // CT-A11Y-RPT-AGE
  // ----------------------------------------------------------------

  describe("CT-A11Y-RPT-AGE — Distribución por edad", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<AgeDistributionComponent>;
    let component: AgeDistributionComponent;

    beforeEach(() => {
      bootstrap(AgeDistributionComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(AgeDistributionComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      flushReportCatalogs(http);
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it("expone h1 enfocable, fieldset+legend, aria-required y aria-busy idle", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      expect(headings[0]?.getAttribute("tabindex")).toBe("-1");
      expect(headings[0]?.textContent?.trim()).toBe("Distribución por edad");

      const fieldset = compiled.querySelector("fieldset");
      expect(fieldset?.querySelector("legend")).toBeTruthy();
      expect(compiled.querySelectorAll('[aria-required="true"]').length).toBe(
        1,
      );
      expect(
        compiled
          .querySelector('button[type="submit"]')
          ?.getAttribute("aria-busy"),
      ).toBe("false");
    });

    it("success expone role=status y tabla con caption oculto + th scope=col", () => {
      component.form.patchValue({ academicYearId: 2 });
      component.onSubmit();
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="age-loading"][role="status"]',
        ),
      ).toBeTruthy();

      http.expectOne((r) => r.url === ageUrl).flush(ageDistributionFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('.age-context[role="status"]'),
      ).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
      expect(compiled.querySelector("caption.visually-hidden")).toBeTruthy();
      expect(compiled.querySelectorAll('th[scope="col"]').length).toBe(3);
    });

    it("200 con ceros mantiene success accesible sin alert", () => {
      component.form.patchValue({ academicYearId: 2 });
      component.onSubmit();
      http
        .expectOne((r) => r.url === ageUrl)
        .flush(emptyAgeDistributionFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('.age-context[role="status"]'),
      ).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
      expect(component.successData()?.totalCount).toBe(0);
    });

    it("422 as_of_date_invalid expone role=alert y conserva filtros", () => {
      component.form.patchValue({ academicYearId: 2, asOfDate: "2010-01-01" });
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
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('[data-testid="age-error"][role="alert"]'),
      ).toBeTruthy();
      expect(component.form.controls.asOfDate.value).toBe("2010-01-01");
      expect(compiled.querySelector('[data-testid="age-results"]')).toBeNull();
    });

    it("incluye media query 320 px y tokens de contraste", () => {
      expectResponsiveContrastTokens();
    });
  });

  // ----------------------------------------------------------------
  // CT-A11Y-RPT-SECTOR
  // ----------------------------------------------------------------

  describe("CT-A11Y-RPT-SECTOR — Docentes distintos por sector", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<TeacherCountsBySectorComponent>;
    let component: TeacherCountsBySectorComponent;

    beforeEach(() => {
      bootstrap(TeacherCountsBySectorComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(TeacherCountsBySectorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it("expone h1 enfocable, fieldset+legend, sin aria-required y aria-busy idle", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      expect(headings[0]?.getAttribute("tabindex")).toBe("-1");
      expect(headings[0]?.textContent?.trim()).toBe(
        "Docentes distintos por sector",
      );
      expect(compiled.querySelector("fieldset legend")).toBeTruthy();
      expect(compiled.querySelectorAll('[aria-required="true"]').length).toBe(
        0,
      );
      expect(
        compiled
          .querySelector('button[type="submit"]')
          ?.getAttribute("aria-busy"),
      ).toBe("false");
    });

    it("success expone role=status y tabla con caption oculto + th scope=col", () => {
      component.form.patchValue({
        periodStart: "2026-07-01",
        periodEnd: "2026-07-10",
      });
      component.onSubmit();
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="sector-loading"][role="status"]',
        ),
      ).toBeTruthy();

      http
        .expectOne((r) => r.url === sectorUrl)
        .flush(teacherCountsBySectorFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('.sector-context[role="status"]'),
      ).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
      expect(compiled.querySelector("caption.visually-hidden")).toBeTruthy();
      expect(compiled.querySelectorAll('th[scope="col"]').length).toBe(2);
    });

    it("422 period_invalid expone role=alert y conserva filtros", () => {
      component.form.patchValue({
        periodStart: "2026-07-10",
        periodEnd: "2026-07-01",
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
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('[data-testid="sector-error"][role="alert"]'),
      ).toBeTruthy();
      expect(component.form.controls.periodEnd.value).toBe("2026-07-01");
      expect(
        compiled.querySelector('[data-testid="sector-results"]'),
      ).toBeNull();
    });

    it("incluye media query 320 px y tokens de contraste", () => {
      expectResponsiveContrastTokens();
    });
  });

  // ----------------------------------------------------------------
  // CT-A11Y-RPT-TOP
  // ----------------------------------------------------------------

  describe("CT-A11Y-RPT-TOP — Escuelas líderes", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<TopSchoolsComponent>;
    let component: TopSchoolsComponent;

    beforeEach(() => {
      bootstrap(TopSchoolsComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(TopSchoolsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      flushReportCatalogs(http);
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it("expone h1 enfocable, fieldset+legend, aria-required y aria-busy idle", () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      expect(headings[0]?.getAttribute("tabindex")).toBe("-1");
      expect(headings[0]?.textContent?.trim()).toBe(
        "Escuelas líderes por matrícula",
      );
      expect(compiled.querySelector("fieldset legend")).toBeTruthy();
      expect(compiled.querySelectorAll('[aria-required="true"]').length).toBe(
        1,
      );
      expect(
        compiled
          .querySelector('button[type="submit"]')
          ?.getAttribute("aria-busy"),
      ).toBe("false");
    });

    it("success expone role=status y tabla con caption oculto + th scope=col", () => {
      component.form.patchValue({ academicYearId: 2 });
      component.onSubmit();
      fixture.detectChanges();

      expect(
        (fixture.nativeElement as HTMLElement).querySelector(
          '[data-testid="top-loading"][role="status"]',
        ),
      ).toBeTruthy();

      http.expectOne((r) => r.url === topUrl).flush(topSchoolsFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('.top-context[role="status"]'),
      ).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
      expect(compiled.querySelector("caption.visually-hidden")).toBeTruthy();
      expect(compiled.querySelectorAll('th[scope="col"]').length).toBe(3);
    });

    it("200 [] expone empty role=status con botón Reintentar", () => {
      component.form.patchValue({ academicYearId: 2 });
      component.onSubmit();
      http.expectOne((r) => r.url === topUrl).flush(emptyTopSchoolsFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const empty = compiled.querySelector(
        '[data-testid="top-empty"][role="status"]',
      );
      expect(empty).toBeTruthy();
      expect(empty?.querySelector("button")?.textContent?.trim()).toBe(
        "Reintentar",
      );
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it("404 expone role=alert y conserva filtros", () => {
      component.form.patchValue({ academicYearId: 9999 });
      component.onSubmit();
      http
        .expectOne((r) => r.url === topUrl)
        .flush(apiProblemNotFoundFixture, {
          status: 404,
          statusText: "Not Found",
          headers: new HttpHeaders({
            "Content-Type": "application/problem+json",
          }),
        });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(
        compiled.querySelector('[data-testid="top-error"][role="alert"]'),
      ).toBeTruthy();
      expect(component.form.controls.academicYearId.value).toBe(9999);
      expect(compiled.querySelector('[data-testid="top-results"]')).toBeNull();
    });

    it("incluye media query 320 px y tokens de contraste", () => {
      expectResponsiveContrastTokens();
    });
  });
});
