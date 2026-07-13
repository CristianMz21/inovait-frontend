import { HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { describe, expect, it } from "vitest";
import { toApiProblem } from "./to-api-problem";
import { apiProblemNotFoundFixture } from "../../../testing/fixtures";

describe("toApiProblem", () => {
  it("pasa el payload cuando el backend responde ProblemDetails", () => {
    const headers = new HttpHeaders({
      "Content-Type": "application/problem+json",
    });
    const error = new HttpErrorResponse({
      status: 404,
      error: apiProblemNotFoundFixture,
      headers,
    });
    const problem = toApiProblem(error);
    expect(problem).toBe(apiProblemNotFoundFixture);
    expect(problem.code).toBe("resource_not_found");
    expect(problem.status).toBe(404);
    expect(problem.title).toBe(apiProblemNotFoundFixture.title);
  });

  it("deriva un code por estado HTTP cuando no hay ProblemDetails", () => {
    const error400 = new HttpErrorResponse({ status: 400 });
    expect(toApiProblem(error400).code).toBe("invalid_request");

    const error409 = new HttpErrorResponse({ status: 409 });
    expect(toApiProblem(error409).code).toBe("history_conflict");

    const error422 = new HttpErrorResponse({ status: 422 });
    expect(toApiProblem(error422).code).toBe("business_rule_violation");

    const errorUnknown = new HttpErrorResponse({ status: 503 });
    expect(toApiProblem(errorUnknown).code).toBe("internal_error");

    const error599 = new HttpErrorResponse({ status: 599 });
    expect(toApiProblem(error599).code).toBe("internal_error");

    const error600 = new HttpErrorResponse({ status: 600 });
    expect(toApiProblem(error600).code).toBe("unknown_error");
  });

  it("no expone un cuerpo string inesperado como detail", () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: "<html>gateway timeout: internal-proxy-01</html>",
      statusText: "Gateway Timeout",
    });
    const problem = toApiProblem(error);
    expect(problem).toMatchObject({
      status: 500,
      code: "internal_error",
      title: "Error interno",
      detail: null,
    });
  });

  it("no confía en objetos parciales que imitan ProblemDetails", () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: {
        status: 500,
        code: "unknown_error",
        detail: "database=internal;password=secret",
      },
    });

    expect(toApiProblem(error)).toMatchObject({
      status: 500,
      code: "internal_error",
      title: "Error interno",
      detail: null,
    });
  });

  it("no expone detail de un ProblemDetails completo para errores 5xx", () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: {
        type: "https://inovait.local/problems/internal-error",
        title: "Error interno",
        status: 500,
        code: "internal_error",
        detail: "database=internal;password=secret",
      },
    });

    expect(toApiProblem(error)).toMatchObject({
      status: 500,
      code: "internal_error",
      title: "Error interno",
      detail: null,
    });
  });

  it("rechaza un ProblemDetails cuyo status contradice la respuesta HTTP", () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        type: "https://inovait.local/problems/invalid-request",
        title: "Solicitud inválida",
        status: 400,
        code: "invalid_request",
        detail: "Detalle que no corresponde al transporte.",
      },
    });

    expect(toApiProblem(error)).toMatchObject({
      status: 422,
      code: "business_rule_violation",
      title: "Regla de negocio incumplida",
      detail: null,
    });
  });

  it("rechaza un status fraccionario aunque coincida con el cuerpo", () => {
    const error = new HttpErrorResponse({
      status: 422.5,
      error: {
        type: "https://inovait.local/problems/business-rule-violation",
        title: "Regla de negocio",
        status: 422.5,
        code: "business_rule_violation",
        detail: "No es un status HTTP canónico.",
      },
    });

    expect(toApiProblem(error)).toMatchObject({
      status: 422.5,
      code: "unknown_error",
      title: "Error inesperado",
      detail: null,
    });
  });
});
