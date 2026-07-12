import { Component } from "@angular/core";
import { provideRouter, Router } from "@angular/router";
import { TestBed } from "@angular/core/testing";
import { describe, expect, it, beforeEach } from "vitest";
import { App } from "./app.component";

@Component({ template: '<h1 id="first-title" tabindex="-1">First page</h1>' })
class FirstPage {}

@Component({ template: '<h1 id="second-title" tabindex="-1">Second page</h1>' })
class SecondPage {}

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
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
    const nav = compiled.querySelector(
      'nav[aria-label="Navegación principal"]',
    );
    expect(nav).toBeTruthy();
    const links = nav?.querySelectorAll("a") ?? [];
    const labels = Array.from(links).map((a) => a.textContent?.trim() ?? "");
    expect(labels).toContain("Matrículas");
    expect(labels).toContain("Consulta de estudiantes");
    expect(labels).toContain("Contratos docentes");
    expect(labels).toContain("Reportes");
    expect(labels).toContain("Historia");
  });

  it("marks both reports and history as enabled (P1 fully operative)", () => {
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

    expect(reports?.getAttribute("aria-disabled")).toBe("false");
    expect(history?.getAttribute("aria-disabled")).toBe("false");
    expect(compiled.querySelector("footer")?.textContent).toContain(
      "Reportes operativos · Historia operativa",
    );
  });

  it("exposes a skip link to main content", () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const skip = compiled.querySelector("a.skip-link");
    expect(skip?.getAttribute("href")).toBe("#main");
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
});
