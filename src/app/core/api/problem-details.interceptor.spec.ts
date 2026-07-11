import { HttpHeaders } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { problemDetailsInterceptor } from "./problem-details.interceptor";
import { ApiProblemError } from "./api-problem-error";

describe("problemDetailsInterceptor", () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([problemDetailsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("deja pasar 2xx sin transformar", () => {
    let received: unknown;
    client.get("/api/schools").subscribe((value) => (received = value));
    const req = http.expectOne("/api/schools");
    req.flush([{ id: 1 }]);
    expect(received).toEqual([{ id: 1 }]);
  });

  it("transforma 400 con ProblemDetails en ApiProblemError", () => {
    let received: unknown;
    client.get("/api/x").subscribe({
      next: () => undefined,
      error: (err) => {
        received = err;
      },
    });
    const req = http.expectOne("/api/x");
    req.flush(
      {
        type: "about:blank/invalid-request",
        title: "Bad Request",
        status: 400,
        code: "invalid_request",
        errors: { x: ["required"] },
      },
      {
        status: 400,
        statusText: "Bad Request",
        headers: new HttpHeaders({
          "Content-Type": "application/problem+json",
        }),
      },
    );
    expect(received).toBeInstanceOf(ApiProblemError);
    if (received instanceof ApiProblemError) {
      expect(received.problem.code).toBe("invalid_request");
      expect(received.problem.errors?.["x"]).toEqual(["required"]);
      expect(received.status).toBe(400);
    }
  });

  it("construye un ApiProblem mínimo cuando el cuerpo no es ProblemDetails", () => {
    let received: unknown;
    client.get("/api/y").subscribe({
      next: () => undefined,
      error: (err) => {
        received = err;
      },
    });
    const req = http.expectOne("/api/y");
    req.flush("oops", { status: 500, statusText: "Server Error" });
    expect(received).toBeInstanceOf(ApiProblemError);
    if (received instanceof ApiProblemError) {
      expect(received.problem.status).toBe(500);
      expect(received.problem.code).toBe("unknown_error");
      expect(received.problem.detail).toBe("oops");
    }
  });
});
