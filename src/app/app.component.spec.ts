import { Component } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { afterEach, describe, expect, it, beforeEach } from "vitest";
import { App } from "./app.component";

@Component({
  selector: "app-first-page-stub",
  template: '<h1 id="first-title" tabindex="-1">First page</h1>',
})
class FirstPage {}

@Component({
  selector: "app-second-page-stub",
  template: '<h1 id="second-title" tabindex="-1">Second page</h1>',
})
class SecondPage {}

@Component({
  selector: "app-enrollments-stub",
  template: '<h1 tabindex="-1">Nueva matrícula</h1>',
})
class EnrollmentsStub {}

@Component({
  selector: "app-student-search-stub",
  template: '<h1 tabindex="-1">Consulta de estudiantes</h1>',
})
class StudentSearchStub {}

@Component({
  selector: "app-teacher-contracts-stub",
  template: '<h1 tabindex="-1">Contratos docentes</h1>',
})
class TeacherContractsStub {}

@Component({
  selector: "app-reports-stub",
  template: '<h1 tabindex="-1">Reportes</h1>',
})
class ReportsStub {}

@Component({
  selector: "app-student-history-stub",
  template: '<h1 tabindex="-1">Historia</h1>',
})
class StudentHistoryStub {}

const HAMBURGER_SELECTOR = 'button[aria-label="Abrir menú de navegación"]';
const NAV_SELECTOR = 'nav[aria-label="Navegación principal"]';

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: "enrollments", component: EnrollmentsStub },
          { path: "student-search", component: StudentSearchStub },
          { path: "teacher-contracts", component: TeacherContractsStub },
          { path: "reports", component: ReportsStub },
          { path: "student-history", component: StudentHistoryStub },
          { path: "first", component: FirstPage },
          { path: "second", component: SecondPage },
        ]),
      ],
    }).compileComponents();
  });

  it("creates the root shell", () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("renders the navigation landmark with P0 + P1 operative links", async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector(NAV_SELECTOR);
    expect(nav).toBeTruthy();
    const links = nav?.querySelectorAll("a") ?? [];
    const labels = Array.from(links).map((a) => a.textContent?.trim() ?? "");
    expect(labels).toEqual([
      "Matrículas",
      "Consulta de estudiantes",
      "Contratos docentes",
      "Reportes",
      "Historia",
    ]);
  });

  it("exposes operative P1 links without fake disabled state", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const links = Array.from(compiled.querySelectorAll("nav a"));
    const reports = links.find(
      (link) => link.textContent?.trim() === "Reportes",
    );
    const history = links.find(
      (link) => link.textContent?.trim() === "Historia",
    );

    expect(reports?.getAttribute("href")).toBe("/reports");
    expect(history?.getAttribute("href")).toBe("/student-history");
    expect(reports?.hasAttribute("aria-disabled")).toBe(false);
    expect(history?.hasAttribute("aria-disabled")).toBe(false);
    expect(compiled.querySelector("footer")?.textContent).toContain(
      "Reportes operativos · Historia operativa",
    );
  });

  it("marks the active page and never mentions P0 scope language", async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl("/enrollments");
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain("P0");
    expect(
      Array.from(compiled.querySelectorAll("nav a"))
        .find((link) => link.textContent?.trim() === "Matrículas")
        ?.getAttribute("aria-current"),
    ).toBe("page");
  });

  it("exposes a skip link to main content as the first focusable element", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skip = compiled.querySelector("a.skip-link");
    expect(skip?.getAttribute("href")).toBe("#main");

    const focusable = Array.from(
      compiled.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])',
      ),
    );
    expect(focusable[0]).toBe(skip);
  });

  it("moves focus to the destination h1 and announces it after navigation", async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl("/first");
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe("first-title");

    await router.navigateByUrl("/second");
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe("second-title");
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="route-announcement"]',
      )?.textContent,
    ).toContain("Second page");
  });

  it("renders the EduCore wordmark and subtitle as non-heading elements, with no h1 outside #main", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const brandName = compiled.querySelector(".ec-brand-name");
    expect(brandName?.tagName.toLowerCase()).not.toBe("h1");
    expect(brandName?.textContent?.trim()).toBe("EduCore");

    const brandSubtitle = compiled.querySelector(".ec-brand-subtitle");
    expect(brandSubtitle?.tagName.toLowerCase()).not.toBe("h1");
    expect(brandSubtitle?.textContent?.trim()).toBe(
      "Gestión escolar municipal",
    );

    const main = compiled.querySelector("main#main")!;
    const headingsOutsideMain = Array.from(
      compiled.querySelectorAll("h1"),
    ).filter((h1) => !main.contains(h1));
    expect(headingsOutsideMain).toHaveLength(0);
  });

  it('shows the fixed academic year chip text "Año académico vigente: 2026"', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const chip = compiled.querySelector(".ec-year-chip");
    expect(chip?.textContent?.trim().replace(/\s+/g, " ")).toContain(
      "Año académico vigente: 2026",
    );
  });

  it("reflects the active route label in the top-bar section title", async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl("/teacher-contracts");
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector(".ec-section-title")?.textContent?.trim(),
    ).toBe("Contratos docentes");
  });

  describe("responsive drawer", () => {
    afterEach(() => {
      Object.defineProperty(window, "innerWidth", {
        value: 1024,
        configurable: true,
      });
    });

    it("opens on hamburger activation, exposing aria-expanded and moving focus to the first nav link", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      expect(hamburger.getAttribute("aria-expanded")).toBe("false");

      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(hamburger.getAttribute("aria-expanded")).toBe("true");
      expect(
        compiled.querySelector(".ec-rail")?.classList.contains("ec-rail--open"),
      ).toBe(true);
      const firstLink = compiled.querySelector(`${NAV_SELECTOR} a`);
      expect(document.activeElement).toBe(firstLink);
    });

    it("closes on Escape and returns focus to the hamburger", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      fixture.detectChanges();
      await fixture.whenStable();

      expect(hamburger.getAttribute("aria-expanded")).toBe("false");
      expect(
        compiled.querySelector(".ec-rail")?.classList.contains("ec-rail--open"),
      ).toBe(false);
      expect(document.activeElement).toBe(hamburger);
    });

    it("closes when the scrim is clicked and returns focus to the hamburger", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      const scrim = compiled.querySelector<HTMLElement>(".ec-scrim");
      expect(scrim).toBeTruthy();
      scrim!.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(compiled.querySelector(".ec-scrim")).toBeNull();
      expect(hamburger.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(hamburger);
    });

    it("closes when a nav link is activated", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(hamburger.getAttribute("aria-expanded")).toBe("true");

      const link = Array.from(compiled.querySelectorAll("nav a")).find(
        (a) => a.textContent?.trim() === "Consulta de estudiantes",
      ) as HTMLAnchorElement;
      link.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    });

    it("marks main, top bar and footer inert only while open, and never the rail", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const main = compiled.querySelector<HTMLElement & { inert: boolean }>(
        "main#main",
      )!;
      const topbar = compiled.querySelector<HTMLElement & { inert: boolean }>(
        ".ec-topbar",
      )!;
      const footer = compiled.querySelector<HTMLElement & { inert: boolean }>(
        "footer",
      )!;
      const rail = compiled.querySelector<HTMLElement & { inert: boolean }>(
        ".ec-rail",
      )!;

      expect(main.inert).toBe(false);
      expect(topbar.inert).toBe(false);
      expect(footer.inert).toBe(false);
      // The rail is never bound to `[inert]` at all (per the DOM contract),
      // so its property is left at the browser default rather than
      // explicitly set to `false` — assert "not inert" without assuming
      // which falsy value that default is.
      expect(rail.inert).toBeFalsy();

      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(main.inert).toBe(true);
      expect(topbar.inert).toBe(true);
      expect(footer.inert).toBe(true);
      expect(rail.inert).toBeFalsy();

      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      fixture.detectChanges();
      await fixture.whenStable();

      expect(main.inert).toBe(false);
      expect(topbar.inert).toBe(false);
      expect(footer.inert).toBe(false);
    });

    it("closes on a resize to desktop width, preventing inert from sticking", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(hamburger.getAttribute("aria-expanded")).toBe("true");

      Object.defineProperty(window, "innerWidth", {
        value: 1280,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(hamburger.getAttribute("aria-expanded")).toBe("false");
    });

    it("ignores a resize while narrow (does not close the drawer)", async () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const hamburger =
        compiled.querySelector<HTMLButtonElement>(HAMBURGER_SELECTOR)!;
      hamburger.click();
      fixture.detectChanges();
      await fixture.whenStable();

      Object.defineProperty(window, "innerWidth", {
        value: 480,
        configurable: true,
      });
      window.dispatchEvent(new Event("resize"));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(hamburger.getAttribute("aria-expanded")).toBe("true");
    });
  });
});
