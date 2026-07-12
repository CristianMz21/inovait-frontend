import { signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { ActivatedRoute, provideRouter, Router } from "@angular/router";
import { Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_CONFIG, DEFAULT_API_CONFIG } from "../../core/api";
import { success } from "../../core/api/remote-state";
import { CatalogFacade } from "../../core/catalogs/catalog.facade";
import {
  academicYearsFixture,
  gradesFixture,
  schoolsFixture,
} from "../../../testing/fixtures";
import { routes } from "../../app.routes";
import { ReportsShellComponent } from "./reports-shell.component";

function createCatalogFacadeStub(): CatalogFacade {
  const academicYears = signal(success(academicYearsFixture));
  const schools = signal(success(schoolsFixture));
  const grades = signal(success(gradesFixture));

  return {
    academicYearsState: academicYears.asReadonly(),
    schoolsState: schools.asReadonly(),
    gradesState: grades.asReadonly(),
    loadAcademicYears: () => undefined,
    loadSchools: () => undefined,
    loadGrades: () => undefined,
  } as unknown as CatalogFacade;
}

function styleText(): string {
  return Array.from(document.head.querySelectorAll("style"))
    .map((style) => style.textContent ?? "")
    .join("\n");
}

/**
 * ReportsShellComponent (WU10-RPT · ARIA tabs redesign).
 *
 * The stacked-sections encoding of this component is gone: the shell now
 * exposes a single `role="tablist"` with manual-activation `role="tab"`
 * buttons and three keep-mounted `role="tabpanel"` hosts. This spec is a
 * deliberate rewrite (see `adapt-the-educore-claude-deep-fox.md` §2) —
 * only the route-shape test at the bottom carries over byte-identical.
 */
describe("ReportsShellComponent (WU10-RPT · ARIA tabs)", () => {
  let fixture: ComponentFixture<ReportsShellComponent>;
  let component: ReportsShellComponent;
  let router: Router;
  let fragment$: Subject<string | null>;

  beforeEach(() => {
    fragment$ = new Subject<string | null>();
    TestBed.configureTestingModule({
      imports: [ReportsShellComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        {
          provide: ActivatedRoute,
          useValue: { fragment: fragment$.asObservable() },
        },
        { provide: CatalogFacade, useValue: createCatalogFacadeStub() },
      ],
    });
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ReportsShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it("renderiza un h1 enfocable como primer encabezado del shell", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const h1 = compiled.querySelector("h1");

    expect(h1?.id).toBe("reports-title");
    expect(h1?.getAttribute("tabindex")).toBe("-1");
    expect(h1?.textContent?.trim()).toBe("Reportes operativos");
  });

  it("expone un tablist ARIA etiquetado con tres pestañas y una seleccionada por defecto", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tablist = compiled.querySelector('[role="tablist"]');
    expect(tablist?.getAttribute("aria-labelledby")).toBe("reports-title");

    const tabs = Array.from(compiled.querySelectorAll('button[role="tab"]'));
    expect(tabs.length).toBe(3);
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "Distribución por edad",
      "Docentes por sector",
      "Escuelas líderes",
    ]);

    const selected = tabs.filter(
      (tab) => tab.getAttribute("aria-selected") === "true",
    );
    expect(selected.length).toBe(1);
    expect(selected[0]?.textContent?.trim()).toBe("Distribución por edad");
  });

  it("mantiene tabindex circulante: pestaña activa en 0, resto en -1", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tabs = Array.from(compiled.querySelectorAll('button[role="tab"]'));

    expect(tabs.map((tab) => tab.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
    ]);
  });

  it("renderiza tres tabpanels que alojan los tres reportes hijos, uno visible", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const panels = Array.from(compiled.querySelectorAll('[role="tabpanel"]'));

    expect(panels.length).toBe(3);
    expect(panels.map((panel) => panel.id)).toEqual([
      "age-report",
      "sector-report",
      "top-schools-report",
    ]);
    expect(
      panels.map((panel) => panel.getAttribute("aria-labelledby")),
    ).toEqual([
      "tab-age-report",
      "tab-sector-report",
      "tab-top-schools-report",
    ]);

    const visible = panels.filter((panel) => !panel.hasAttribute("hidden"));
    expect(visible.length).toBe(1);
    expect(visible[0]?.id).toBe("age-report");

    expect(
      compiled.querySelector("#age-report app-age-distribution"),
    ).toBeTruthy();
    expect(
      compiled.querySelector("#sector-report app-teacher-counts-by-sector"),
    ).toBeTruthy();
    expect(
      compiled.querySelector("#top-schools-report app-top-schools"),
    ).toBeTruthy();
  });

  it("ArrowRight/ArrowLeft mueven el foco entre pestañas sin cambiar la selección", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const [ageTab, sectorTab, topTab] =
      compiled.querySelectorAll<HTMLButtonElement>('button[role="tab"]');

    ageTab.focus();
    expect(document.activeElement).toBe(ageTab);

    ageTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(document.activeElement).toBe(sectorTab);

    sectorTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(document.activeElement).toBe(topTab);

    // Wraps from the last tab back to the first.
    topTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    expect(document.activeElement).toBe(ageTab);

    ageTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    expect(document.activeElement).toBe(topTab);

    fixture.detectChanges();
    expect(component.activeSectionId()).toBe("age-report");
    expect(ageTab.getAttribute("aria-selected")).toBe("true");
  });

  it("Home/End mueven el foco a la primera/última pestaña", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const [ageTab, , topTab] =
      compiled.querySelectorAll<HTMLButtonElement>('button[role="tab"]');

    ageTab.focus();
    ageTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    expect(document.activeElement).toBe(topTab);

    topTab.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    expect(document.activeElement).toBe(ageTab);
  });

  it.each(["Enter", " "])(
    "%s activa la pestaña enfocada: alterna aria-selected y [hidden] del panel",
    (key) => {
      const compiled = fixture.nativeElement as HTMLElement;
      const sectorTab =
        compiled.querySelector<HTMLButtonElement>("#tab-sector-report")!;

      sectorTab.focus();
      sectorTab.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true }),
      );
      fixture.detectChanges();

      expect(component.activeSectionId()).toBe("sector-report");
      expect(sectorTab.getAttribute("aria-selected")).toBe("true");
      expect(
        compiled.querySelector("#age-report")?.hasAttribute("hidden"),
      ).toBe(true);
      expect(
        compiled.querySelector("#sector-report")?.hasAttribute("hidden"),
      ).toBe(false);
    },
  );

  it("el click activa la pestaña y llama a router.navigate con el fragmento", () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockResolvedValue(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const topTab = compiled.querySelector<HTMLButtonElement>(
      "#tab-top-schools-report",
    )!;

    topTab.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ fragment: "top-schools-report" }),
    );
    expect(component.activeSectionId()).toBe("top-schools-report");
    expect(topTab.getAttribute("aria-selected")).toBe("true");
    expect(
      compiled.querySelector("#top-schools-report")?.hasAttribute("hidden"),
    ).toBe(false);
  });

  it("sincroniza la pestaña activa con el fragmento de ruta y detiene la suscripción al destruir", () => {
    fragment$.next("sector-report");
    fixture.detectChanges();
    expect(component.activeSectionId()).toBe("sector-report");

    fragment$.next("unknown-report");
    fixture.detectChanges();
    expect(component.activeSectionId()).toBe("sector-report");

    fixture.destroy();
    fragment$.next("top-schools-report");
    expect(component.activeSectionId()).toBe("sector-report");
  });

  it("no renderiza la línea redundante 'Sección activa'", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain("Sección activa");
  });

  it("incluye media query 320 px y tokens de contraste del sistema", () => {
    const css = styleText();

    expect(css).toContain("max-width: 320px");
    expect(css).toContain("--app-muted");
    expect(css).toContain("--app-accent");
    expect(css).toContain("--app-border");
  });

  it("mantiene /reports como ruta única y /student-history operativa (WU11-STU)", async () => {
    const reportsRoute = routes.find((route) => route.path === "reports");
    const studentHistoryRoute = routes.find(
      (route) => route.path === "student-history",
    );

    expect(reportsRoute?.data).toBeUndefined();
    const reportsComponent = await reportsRoute?.loadComponent?.();
    expect(reportsComponent).toBe(ReportsShellComponent);

    // Tras 003-student-history (WU11-STU) la ruta deja de usar el antiguo
    // placeholder de bloqueo P1: ya no expone `data.lockedFeature` y monta
    // StudentHistoryComponent directamente.
    expect(studentHistoryRoute?.data).toBeUndefined();
    const { StudentHistoryComponent } = await import("../student-history");
    const studentHistoryComponent =
      await studentHistoryRoute?.loadComponent?.();
    expect(studentHistoryComponent).toBe(StudentHistoryComponent);
  });
});
