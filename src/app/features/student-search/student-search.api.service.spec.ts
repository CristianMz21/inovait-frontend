import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import { enrollmentListResponseFixture } from "../../../testing/fixtures";
import {
  StudentSearchApiService,
  type ListEnrollmentsParams,
} from "./student-search.api.service";

const baseParams: ListEnrollmentsParams = {
  schoolId: 1,
  gradeId: 1,
  academicYearId: 2,
};

describe("StudentSearchApiService", () => {
  let service: StudentSearchApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        StudentSearchApiService,
      ],
    });
    service = TestBed.inject(StudentSearchApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("list() invoca GET /api/enrollments con los tres filtros obligatorios", () => {
    let received: unknown;
    service.list(baseParams).subscribe((value) => (received = value));

    const req = http.expectOne(
      (r) =>
        r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments` &&
        r.method === "GET",
    );
    expect(req.request.params.get("schoolId")).toBe("1");
    expect(req.request.params.get("gradeId")).toBe("1");
    expect(req.request.params.get("academicYearId")).toBe("2");
    expect(req.request.params.has("asOfDate")).toBe(false);
    req.flush(enrollmentListResponseFixture);

    expect(received).toEqual(enrollmentListResponseFixture);
  });

  it("list() envía asOfDate sólo cuando la operadora lo define", () => {
    let received: unknown;
    service
      .list({ ...baseParams, asOfDate: "2026-07-10" })
      .subscribe((value) => (received = value));

    const req = http.expectOne(
      (r) => r.url === `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.params.get("asOfDate")).toBe("2026-07-10");
    req.flush([]);

    expect(received).toEqual([]);
  });
});
