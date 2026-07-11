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
} from "../core/api";
import {
  academicYearsFixture,
  apiProblemNotFoundFixture,
  classGroupsFixture,
  createEnrollmentResponseFixture,
  emptyEnrollmentListResponseFixture,
  emptyTeacherContractsListedFixture,
  enrollmentListResponseFixture,
  gradesFixture,
  schoolsFixture,
  teacherContractsCreatedFixture,
  teachersFixture,
} from "../../testing/fixtures";
import { App } from "../app.component";
import { EnrollmentCreateComponent } from "../features/enrollments/enrollment-create.component";
import { StudentSearchComponent } from "../features/student-search/student-search.component";
import { TeacherContractsComponent } from "../features/teacher-contracts/teacher-contracts.component";

/**
 * CT-A11Y-P0 — Hardening P0 (T031).
 *
 * Garantiza los invariantes de accesibilidad para el shell y las tres
 * rutas P0 (`/enrollments`, `/student-search`, `/teacher-contracts`).
 *
 * Reglas cubiertas (alineadas con `docs/evaluator-execution.md` y las
 * especificaciones de capacidad):
 *
 *   1. Shell (`App`):
 *      - skip-link a `#main`
 *      - landmark `<main id="main" tabindex="-1">`
 *      - landmark `<nav aria-label="Navegación principal">`
 *
 *   2. Cada ruta P0:
 *      - exactamente un `<h1>` con `tabindex="-1"` (foco programático)
 *      - `<fieldset>` con `<legend>` por cada grupo de formulario
 *      - campos requeridos con `aria-required="true"`
 *      - botón submit expone `aria-busy` (idle: "false")
 *      - `role="status"` para loading / empty / success
 *      - `role="alert"` para error
 */
describe("CT-A11Y-P0 — Hardening accesibilidad shell + rutas P0", () => {
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

    it("expone skip-link hacia #main como primer foco accesible", () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const skip = compiled.querySelector("a.skip-link");
      expect(skip).toBeTruthy();
      expect(skip?.getAttribute("href")).toBe("#main");
      expect(skip?.textContent?.trim()).toBe("Saltar al contenido principal");
    });

    it('renderiza landmark <main id="main" tabindex="-1">', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const main = compiled.querySelector("main#main");
      expect(main).toBeTruthy();
      expect(main?.getAttribute("tabindex")).toBe("-1");
    });

    it('renderiza landmark <nav aria-label="Navegación principal">', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;

      const nav = compiled.querySelector(
        'nav[aria-label="Navegación principal"]',
      );
      expect(nav).toBeTruthy();

      const labels = Array.from(nav?.querySelectorAll("a") ?? []).map(
        (a) => a.textContent?.trim() ?? "",
      );
      expect(labels).toEqual(
        expect.arrayContaining([
          "Matrículas",
          "Consulta de estudiantes",
          "Contratos docentes",
          "Reportes",
          "Historia",
        ]),
      );
    });
  });

  /**
   * Crea un TestBed con HTTP + Router + API_CONFIG para un componente.
   * El componente se importa standalone.
   */
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

  /**
   * Resuelve todas las solicitudes de catálogo pendientes. Útil antes
   * de inspeccionar la forma del formulario ya estable.
   */
  function flushCatalog(http: HttpTestingController): void {
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
      } else if (
        req.request.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers`
      ) {
        req.flush(teachersFixture);
      } else {
        req.flush([]);
      }
    }
  }

  // ----------------------------------------------------------------
  // /enrollments
  // ----------------------------------------------------------------

  describe("Ruta /enrollments", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<EnrollmentCreateComponent>;

    beforeEach(() => {
      bootstrap(EnrollmentCreateComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(EnrollmentCreateComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it('renderiza exactamente un <h1> con tabindex="-1" enfocable programáticamente', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      const h1 = headings[0];
      expect(h1?.getAttribute("tabindex")).toBe("-1");
      expect((h1 as HTMLElement).tabIndex).toBe(-1);
      expect(h1?.textContent?.trim()).toBe("Nueva matrícula");
    });

    it("estructura cada grupo de formulario con <fieldset><legend>", () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const fieldsets = compiled.querySelectorAll("fieldset");
      expect(fieldsets.length).toBeGreaterThanOrEqual(2);

      for (const fs of Array.from(fieldsets)) {
        const legend = fs.querySelector("legend");
        expect(legend, `fieldset sin <legend>`).toBeTruthy();
        expect(legend?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      }
    });

    it('marca los campos requeridos con aria-required="true"', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const required = compiled.querySelectorAll('[aria-required="true"]');
      // 5 de identidad + 4 de cadena académica.
      expect(required.length).toBeGreaterThanOrEqual(9);
    });

    it('botón submit expone aria-busy="false" en estado idle', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const submit = compiled.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;
      expect(submit, "la ruta debe exponer un botón submit").toBeTruthy();
      expect(submit?.getAttribute("aria-busy")).toBe("false");
    });

    it('success tras POST expone region role="status"', () => {
      flushCatalog(http);
      fixture.detectChanges();

      const comp = fixture.componentInstance as unknown as {
        form: { controls: Record<string, { setValue(v: unknown): void }> };
        onSubmit(): void;
      };
      comp.form.controls["documentType"].setValue("DNI");
      comp.form.controls["documentNumber"].setValue("99.001.101");
      comp.form.controls["firstNames"].setValue("Ana");
      comp.form.controls["lastNames"].setValue("Solís");
      comp.form.controls["birthDate"].setValue("2018-07-10");
      comp.form.controls["schoolId"].setValue(1);
      comp.form.controls["academicYearId"].setValue(2);
      comp.form.controls["gradeId"].setValue(1);
      fixture.detectChanges();

      http
        .expectOne(
          (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
        )
        .flush(classGroupsFixture);
      comp.form.controls["classGroupId"].setValue(10);
      comp.onSubmit();

      const req = http.expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      );
      expect(req.request.method).toBe("POST");
      req.flush(createEnrollmentResponseFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const ok = compiled.querySelector('[data-testid="enrollment-success"]');
      expect(ok).toBeTruthy();
      expect(ok?.getAttribute("role")).toBe("status");
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it('error canónico expone region role="alert" sin success', () => {
      flushCatalog(http);
      fixture.detectChanges();

      const comp = fixture.componentInstance as unknown as {
        form: { controls: Record<string, { setValue(v: unknown): void }> };
        onSubmit(): void;
      };
      comp.form.controls["documentType"].setValue("DNI");
      comp.form.controls["documentNumber"].setValue("99.001.101");
      comp.form.controls["firstNames"].setValue("Ana");
      comp.form.controls["lastNames"].setValue("Solís");
      comp.form.controls["birthDate"].setValue("2018-07-10");
      comp.form.controls["schoolId"].setValue(1);
      comp.form.controls["academicYearId"].setValue(2);
      comp.form.controls["gradeId"].setValue(1);
      fixture.detectChanges();
      http
        .expectOne(
          (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/class-groups`,
        )
        .flush(classGroupsFixture);
      comp.form.controls["classGroupId"].setValue(10);
      comp.onSubmit();

      const req = http.expectOne(
        (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
      );
      req.flush(apiProblemNotFoundFixture, {
        status: 404,
        statusText: "Not Found",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const alert = compiled.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(alert?.getAttribute("aria-live")).toBe("assertive");
      expect(
        compiled.querySelector('[data-testid="enrollment-success"]'),
      ).toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // /student-search
  // ----------------------------------------------------------------

  describe("Ruta /student-search", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<StudentSearchComponent>;

    beforeEach(() => {
      bootstrap(StudentSearchComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(StudentSearchComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it('renderiza exactamente un <h1> con tabindex="-1"', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      const h1 = headings[0];
      expect(h1?.getAttribute("tabindex")).toBe("-1");
      expect(h1?.textContent?.trim()).toBe("Consulta de estudiantes");
    });

    it("estructura cada grupo de formulario con <fieldset><legend>", () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const fieldsets = compiled.querySelectorAll("fieldset");
      expect(fieldsets.length).toBeGreaterThanOrEqual(1);
      for (const fs of Array.from(fieldsets)) {
        const legend = fs.querySelector("legend");
        expect(legend, `fieldset sin <legend>`).toBeTruthy();
        expect(legend?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      }
    });

    it('marca los campos requeridos con aria-required="true"', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const required = compiled.querySelectorAll('[aria-required="true"]');
      // 3 filtros académicos obligatorios.
      expect(required.length).toBeGreaterThanOrEqual(3);
    });

    it('botón submit expone aria-busy="false" en estado idle', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const submit = compiled.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;
      expect(submit).toBeTruthy();
      expect(submit?.getAttribute("aria-busy")).toBe("false");
    });

    it("success expone region con resultados y contador aria-live", () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        form: { controls: Record<string, { setValue(v: unknown): void }> };
        onSubmit(): void;
      };
      comp.form.controls["schoolId"].setValue(1);
      comp.form.controls["gradeId"].setValue(1);
      comp.form.controls["academicYearId"].setValue(2);
      comp.onSubmit();

      http
        .expectOne(
          (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
        )
        .flush(enrollmentListResponseFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const results = compiled.querySelector('[data-testid="search-results"]');
      expect(results).toBeTruthy();
      const counter = compiled.querySelector('[aria-live="polite"]');
      expect(counter).toBeTruthy();
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it('empty (200 []) expone region role="status"', () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        form: { controls: Record<string, { setValue(v: unknown): void }> };
        onSubmit(): void;
      };
      comp.form.controls["schoolId"].setValue(1);
      comp.form.controls["gradeId"].setValue(1);
      comp.form.controls["academicYearId"].setValue(2);
      comp.onSubmit();

      http
        .expectOne(
          (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
        )
        .flush(emptyEnrollmentListResponseFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const empty = compiled.querySelector('[data-testid="search-empty"]');
      expect(empty).toBeTruthy();
      expect(empty?.getAttribute("role")).toBe("status");
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it('error 404 expone region role="alert"', () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        form: { controls: Record<string, { setValue(v: unknown): void }> };
        onSubmit(): void;
      };
      comp.form.controls["schoolId"].setValue(1);
      comp.form.controls["gradeId"].setValue(1);
      comp.form.controls["academicYearId"].setValue(2);
      comp.onSubmit();

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
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const alert = compiled.querySelector('[role="alert"]');
      expect(alert).toBeTruthy();
      expect(
        compiled.querySelector('[data-testid="search-results"]'),
      ).toBeNull();
      expect(compiled.querySelector('[data-testid="search-empty"]')).toBeNull();
    });
  });

  // ----------------------------------------------------------------
  // /teacher-contracts
  // ----------------------------------------------------------------

  describe("Ruta /teacher-contracts", () => {
    let http: HttpTestingController;
    let fixture: ComponentFixture<TeacherContractsComponent>;

    beforeEach(() => {
      bootstrap(TeacherContractsComponent);
      http = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(TeacherContractsComponent);
      fixture.detectChanges();
    });

    afterEach(() => {
      http.verify();
      TestBed.resetTestingModule();
    });

    it('renderiza exactamente un <h1> con tabindex="-1"', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const headings = compiled.querySelectorAll("h1");
      expect(headings.length).toBe(1);
      const h1 = headings[0];
      expect(h1?.getAttribute("tabindex")).toBe("-1");
      expect(h1?.textContent?.trim()).toBe("Contratos docentes");
    });

    it("estructura cada grupo de formulario con <fieldset><legend>", () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const fieldsets = compiled.querySelectorAll("fieldset");
      // Identidad y período + Escuelas + Filtros (consulta).
      expect(fieldsets.length).toBeGreaterThanOrEqual(3);
      for (const fs of Array.from(fieldsets)) {
        const legend = fs.querySelector("legend");
        expect(legend, `fieldset sin <legend>`).toBeTruthy();
        expect(legend?.textContent?.trim().length ?? 0).toBeGreaterThan(0);
      }
    });

    it('marca los campos requeridos con aria-required="true"', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const required = compiled.querySelectorAll('[aria-required="true"]');
      // Docente (create) + startDate + Docente (query) = 3 mínimo.
      expect(required.length).toBeGreaterThanOrEqual(3);
    });

    it('cada botón submit expone aria-busy="false" en estado idle', () => {
      flushCatalog(http);
      const compiled = fixture.nativeElement as HTMLElement;
      const submits = compiled.querySelectorAll(
        'button[type="submit"]',
      ) as NodeListOf<HTMLButtonElement>;
      expect(submits.length).toBeGreaterThanOrEqual(2);
      for (const s of Array.from(submits)) {
        expect(s.getAttribute("aria-busy")).toBe("false");
      }
    });

    it('success en creación expone region role="status"', () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        createForm: {
          controls: Record<string, { setValue(v: unknown): void }>;
        };
        onToggleSchool(id: number, checked: boolean): void;
        onSubmitCreate(): void;
      };
      comp.createForm.controls["teacherId"].setValue(5);
      comp.createForm.controls["startDate"].setValue("2026-03-01");
      comp.onToggleSchool(1, true);
      comp.onSubmitCreate();

      http
        .expectOne(
          (r) =>
            r.url ===
              `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/5/contracts` &&
            r.method === "POST",
        )
        .flush(teacherContractsCreatedFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const ok = compiled.querySelector(
        '[data-testid="contracts-create-success"]',
      );
      expect(ok).toBeTruthy();
      expect(ok?.getAttribute("role")).toBe("status");
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it('empty en consulta (200 []) expone region role="status"', () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        queryForm: {
          controls: Record<string, { setValue(v: unknown): void }>;
        };
        onSubmitQuery(): void;
      };
      comp.queryForm.controls["teacherId"].setValue(5);
      comp.onSubmitQuery();

      http
        .expectOne(
          (r) =>
            r.url ===
              `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/5/contracts` &&
            r.method === "GET",
        )
        .flush(emptyTeacherContractsListedFixture);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const empty = compiled.querySelector(
        '[data-testid="contracts-query-empty"]',
      );
      expect(empty).toBeTruthy();
      expect(empty?.getAttribute("role")).toBe("status");
      expect(compiled.querySelector('[role="alert"]')).toBeNull();
    });

    it('error canónico en consulta expone region role="alert"', () => {
      flushCatalog(http);
      const comp = fixture.componentInstance as unknown as {
        queryForm: {
          controls: Record<string, { setValue(v: unknown): void }>;
        };
        onSubmitQuery(): void;
      };
      comp.queryForm.controls["teacherId"].setValue(9999);
      comp.onSubmitQuery();

      http
        .expectOne(
          (r) =>
            r.url ===
              `${DEFAULT_API_CONFIG.apiBaseUrl}/api/teachers/9999/contracts` &&
            r.method === "GET",
        )
        .flush(apiProblemNotFoundFixture, {
          status: 404,
          statusText: "Not Found",
          headers: new HttpHeaders({
            "Content-Type": "application/problem+json",
          }),
        });
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const alert = compiled.querySelector(
        '[data-testid="contracts-query-error"]',
      );
      expect(alert).toBeTruthy();
      expect(alert?.getAttribute("role")).toBe("alert");
    });
  });
});
