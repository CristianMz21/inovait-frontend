import { TestBed } from "@angular/core/testing";
import { describe, expect, it } from "vitest";
import { AppIconComponent } from "./app-icon.component";

describe("AppIconComponent", () => {
  it("renders an inline svg for a known icon name", async () => {
    await TestBed.configureTestingModule({
      imports: [AppIconComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppIconComponent);
    fixture.componentRef.setInput("name", "menu");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("focusable")).toBe("false");
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
    expect(svg?.querySelector("path")?.getAttribute("d")).toBeTruthy();
  });

  it("renders a distinct path per known icon name", async () => {
    await TestBed.configureTestingModule({
      imports: [AppIconComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppIconComponent);
    fixture.componentRef.setInput("name", "event_available");
    fixture.detectChanges();

    const d = (fixture.nativeElement as HTMLElement)
      .querySelector("path")
      ?.getAttribute("d");
    expect(d).toContain("M4 5h16v14H4Z");
  });

  it("renders nothing for an unrecognized icon name", async () => {
    await TestBed.configureTestingModule({
      imports: [AppIconComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppIconComponent);
    // `setInput` accepts `unknown`, so this exercises the defensive fallback
    // that a type-unsafe call site could otherwise hit at runtime.
    fixture.componentRef.setInput("name", "not-a-real-icon");
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector("svg"),
    ).toBeNull();
  });
});
