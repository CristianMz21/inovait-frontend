import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  API_CONFIG,
  DEFAULT_API_CONFIG,
  withApiProblemDetails,
} from "../../core/api";
import { studentHistoryFixture } from "../../../testing/fixtures";
import {
  StudentHistoryApiService,
  type GetStudentHistoryParams,
} from "./student-history.api.service";

const baseParams: GetStudentHistoryParams = {
  documentType: "DNI",
  documentNumber: "99.001.101",
};

describe("StudentHistoryApiService (ST-HIST-GET)", () => {
  let service: StudentHistoryApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        StudentHistoryApiService,
      ],
    });
    service = TestBed.inject(StudentHistoryApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("getStudentHistory() invokes the canonical GET without query parameters", () => {
    let received: unknown;
    service
      .getStudentHistory(baseParams)
      .subscribe(value => (received = value));

    const req = http.expectOne(
      r =>
        r.url ===
          `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI/99.001.101/history` &&
        r.method === "GET",
    );
    expect(req.request.params.keys()).toEqual([]);
    req.flush(studentHistoryFixture);

    expect(received).toEqual(studentHistoryFixture);
  });

  it("getStudentHistory() url-encodea segmentos con espacios o caracteres reservados", () => {
    service
      .getStudentHistory({
        documentType: "DNI Extranjero",
        documentNumber: "88/001 002",
      })
      .subscribe(() => undefined);

    const req = http.expectOne(
      r =>
        r.url ===
        `${DEFAULT_API_CONFIG.apiBaseUrl}/api/students/DNI%20Extranjero/88%2F001%20002/history`,
    );
    expect(req.request.method).toBe("GET");
    req.flush(studentHistoryFixture);
  });
});
