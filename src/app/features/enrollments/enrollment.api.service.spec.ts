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
import type { CreateEnrollmentRequest } from "../../core/api/dtos/create-enrollment-request.dto";
import { createEnrollmentResponseFixture } from "../../../testing/fixtures";
import { EnrollmentApiService } from "./enrollment.api.service";

const request: CreateEnrollmentRequest = {
  student: {
    documentType: "DNI",
    documentNumber: "99.001.101",
    firstNames: "Ana María",
    lastNames: "Solís",
    birthDate: "2018-07-10",
  },
  schoolId: 1,
  academicYearId: 2,
  gradeId: 1,
  classGroupId: 10,
};

describe("EnrollmentApiService", () => {
  let service: EnrollmentApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withApiProblemDetails()),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: DEFAULT_API_CONFIG },
        EnrollmentApiService,
      ],
    });
    service = TestBed.inject(EnrollmentApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("create() invoca POST /api/enrollments con el payload del contrato", () => {
    let received: unknown;
    service.create(request).subscribe((value) => (received = value));

    const req = http.expectOne(
      `${DEFAULT_API_CONFIG.apiBaseUrl}/api/enrollments`,
    );
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(request);
    req.flush(createEnrollmentResponseFixture);

    expect(received).toEqual(createEnrollmentResponseFixture);
  });
});
