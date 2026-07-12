import { Component } from "@angular/core";
import { By } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router, RouterOutlet } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import { studentHistoryFixture } from "../../../testing/fixtures";
import { StudentHistoryComponent } from "./student-history.component";
import { StudentHistoryNavigationHandoff } from "./student-history.navigation";

@Component({
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class NavigationHostComponent {}

const historyUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/99.001.101/history`;

describe("StudentHistoryComponent selection route integration", () => {
  let hostFixture: ComponentFixture<NavigationHostComponent>;
  let handoff: StudentHistoryNavigationHandoff;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NavigationHostComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([
          { path: "student-history", component: StudentHistoryComponent },
        ]),
      ],
    });
    hostFixture = TestBed.createComponent(NavigationHostComponent);
    handoff = TestBed.inject(StudentHistoryNavigationHandoff);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    hostFixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("resolves a live opaque selection and loads exactly once without PII in URL or history state", async () => {
    await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    hostFixture.detectChanges();

    expect(router.url).toMatch(/^\/student-history\?selection=[0-9a-f-]{36}$/);
    const persistedNavigation = `${router.url} ${JSON.stringify(window.history.state)}`;
    expect(persistedNavigation).not.toContain("DNI");
    expect(persistedNavigation).not.toContain("99.001.101");

    const destination = hostFixture.debugElement.query(
      By.directive(StudentHistoryComponent),
    );
    const component = destination?.componentInstance as
      StudentHistoryComponent | undefined;
    expect(component?.form.getRawValue()).toEqual({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });

    const requests = http.match((request) => request.url === historyUrl);
    expect(requests).toHaveLength(1);
    const request = requests[0];
    if (!request) {
      throw new Error("Expected one automatic student-history request");
    }
    request.flush(studentHistoryFixture);
    hostFixture.detectChanges();
    http.expectNone((candidate) => candidate.url === historyUrl);
    expect(component?.isSuccess()).toBe(true);
  });

  it.each([null, "unknown-selection"])(
    "keeps manual mode with zero requests for missing or unknown selection",
    async (selection) => {
      await router.navigate(["/student-history"], {
        queryParams: selection === null ? {} : { selection },
      });
      hostFixture.detectChanges();

      const destination = hostFixture.debugElement.query(
        By.directive(StudentHistoryComponent),
      );
      const component = destination?.componentInstance as
        StudentHistoryComponent | undefined;
      expect(component?.form.getRawValue()).toEqual({
        documentType: "",
        documentNumber: "",
      });
      expect(component?.result().status).toBe("idle");
      http.expectNone((request) => request.url.includes("/api/students/"));
    },
  );

  it.each([null, "unknown-selection"])(
    "resets a loaded same-route view when selection becomes missing or unknown",
    async (selection) => {
      await handoff.navigateToHistory({
        documentType: "DNI",
        documentNumber: "99.001.101",
      });
      hostFixture.detectChanges();
      const pending = http.expectOne((request) => request.url === historyUrl);

      await router.navigate(["/student-history"], {
        queryParams: selection === null ? {} : { selection },
      });
      hostFixture.detectChanges();

      const destination = hostFixture.debugElement.query(
        By.directive(StudentHistoryComponent),
      );
      const component = destination?.componentInstance as
        StudentHistoryComponent | undefined;
      expect(pending.cancelled).toBe(true);
      expect(component?.form.getRawValue()).toEqual({
        documentType: "",
        documentNumber: "",
      });
      expect(component?.result().status).toBe("idle");
      http.expectNone((request) => request.url === historyUrl);
    },
  );

  it("does not reload when unrelated query params change for the same selection", async () => {
    await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    hostFixture.detectChanges();
    const selection = router
      .parseUrl(router.url)
      .queryParamMap.get("selection");
    if (selection === null) {
      throw new Error("Expected an opaque selection token");
    }
    const request = http.expectOne((candidate) => candidate.url === historyUrl);

    await router.navigate(["/student-history"], {
      queryParams: { selection, view: "same-selection" },
    });
    hostFixture.detectChanges();

    expect(request.cancelled).toBe(false);
    http.expectNone((candidate) => candidate.url === historyUrl);
    request.flush(studentHistoryFixture);
  });
});
