import { Component } from "@angular/core";
import { HttpHeaders, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideRouter, Router, RouterOutlet } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import {
  academicYearsFixture,
  apiProblemNotFoundFixture,
  enrollmentListResponseFixture,
  gradesFixture,
  schoolsFixture,
  studentHistoryFixture,
} from "../../../testing/fixtures";
import { StudentHistoryComponent } from "../student-history/student-history.component";
import { StudentHistoryNavigationHandoff } from "../student-history/student-history.navigation";
import { StudentSearchComponent } from "./student-search.component";

@Component({
  imports: [RouterOutlet],
  template: "<router-outlet />",
})
class SearchNavigationHostComponent {}

const enrollmentsUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`;
const historyUrl = `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/99.001.101/history`;

describe("Student search routed integration", () => {
  let fixture: ComponentFixture<SearchNavigationHostComponent>;
  let handoff: StudentHistoryNavigationHandoff;
  let http: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchNavigationHostComponent],
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        provideRouter([
          { path: "student-search", component: StudentSearchComponent },
          { path: "student-history", component: StudentHistoryComponent },
        ]),
      ],
    });
    fixture = TestBed.createComponent(SearchNavigationHostComponent);
    handoff = TestBed.inject(StudentHistoryNavigationHandoff);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it("stays idle without route filters, searches once after submit, and restores once when the route URL is reactivated", async () => {
    await router.navigateByUrl("/student-search");
    fixture.detectChanges();
    flushCatalogs();
    http.expectNone((request) => request.url === enrollmentsUrl);

    const initialSearch = searchComponent();
    initialSearch.form.setValue({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });
    await initialSearch.onSubmit();
    fixture.detectChanges();

    expect(router.url).toBe(
      "/student-search?schoolId=1&gradeId=1&academicYearId=2&asOfDate=2026-07-10",
    );
    const firstSearchRequests = http.match(
      (request) => request.url === enrollmentsUrl,
    );
    expect(firstSearchRequests).toHaveLength(1);
    const firstSearch = firstSearchRequests[0];
    if (!firstSearch) {
      throw new Error("Expected one search request after submit");
    }
    firstSearch.flush(enrollmentListResponseFixture);
    fixture.detectChanges();
    expect(initialSearch.successData()).toHaveLength(2);

    await handoff.navigateToHistory({
      documentType: "DNI",
      documentNumber: "99.001.101",
    });
    fixture.detectChanges();
    http
      .expectOne((request) => request.url === historyUrl)
      .flush(studentHistoryFixture);

    await router.navigateByUrl(
      "/student-search?schoolId=1&gradeId=1&academicYearId=2&asOfDate=2026-07-10",
    );
    fixture.detectChanges();
    flushCatalogs();

    const restoredSearch = searchComponent();
    expect(restoredSearch.form.getRawValue()).toEqual({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });
    const restoredRequests = http.match(
      (request) => request.url === enrollmentsUrl,
    );
    expect(restoredRequests).toHaveLength(1);
    const restoredRequest = restoredRequests[0];
    if (!restoredRequest) {
      throw new Error(
        "Expected one restored search request after route reactivation",
      );
    }
    restoredRequest.flush(enrollmentListResponseFixture);
    fixture.detectChanges();
    http.expectNone((request) => request.url === enrollmentsUrl);
    expect(restoredSearch.successData()).toHaveLength(2);
  });

  it.each(["2026-02-31", "2023-02-29"])(
    "keeps an impossible initial date idle with an empty form",
    async (asOfDate) => {
      await router.navigate(["/student-search"], {
        queryParams: {
          schoolId: 1,
          gradeId: 1,
          academicYearId: 2,
          asOfDate,
        },
      });
      fixture.detectChanges();
      flushCatalogs();

      const component = searchComponent();
      expect(component.form.getRawValue()).toEqual({
        schoolId: null,
        gradeId: null,
        academicYearId: null,
        asOfDate: "",
      });
      expect(component.result().status).toBe("idle");
      http.expectNone((request) => request.url === enrollmentsUrl);
    },
  );

  it("keeps a leap-day route, form, request, and retry consistent", async () => {
    await router.navigate(["/student-search"], {
      queryParams: {
        schoolId: 1,
        gradeId: 1,
        academicYearId: 2,
        asOfDate: "2024-02-29",
      },
    });
    fixture.detectChanges();
    flushCatalogs();

    const component = searchComponent();
    expect(component.form.controls.asOfDate.value).toBe("2024-02-29");
    expect(router.url).toContain("asOfDate=2024-02-29");
    const firstRequest = http.expectOne(
      (request) => request.url === enrollmentsUrl,
    );
    expect(firstRequest.request.params.get("asOfDate")).toBe("2024-02-29");
    firstRequest.flush(apiProblemNotFoundFixture, {
      status: 404,
      statusText: "Not Found",
      headers: new HttpHeaders({
        "Content-Type": "application/problem+json",
      }),
    });

    component.onRetry();
    const retryRequest = http.expectOne(
      (request) => request.url === enrollmentsUrl,
    );
    expect(retryRequest.request.params.get("asOfDate")).toBe("2024-02-29");
    retryRequest.flush(enrollmentListResponseFixture);
  });

  function flushCatalogs(): void {
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/schools`)
      .flush(schoolsFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/grades`)
      .flush(gradesFixture);
    http
      .expectOne(`${DEFAULT_API_CONFIG.apiBaseUrl}/api/academic-years`)
      .flush(academicYearsFixture);
  }

  function searchComponent(): StudentSearchComponent {
    const debugElement = fixture.debugElement.query(
      By.directive(StudentSearchComponent),
    );
    const component = debugElement?.componentInstance as
      StudentSearchComponent | undefined;
    if (!component) {
      throw new Error("Expected routed StudentSearchComponent");
    }
    return component;
  }
});
