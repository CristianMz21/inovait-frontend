/* Copyright (c) 2026. All rights reserved. */
import type { ApiProblem } from "./dtos/api-problem.dto";

/**
 * Error uniforme que el `problemDetailsInterceptor` produce para todas
 * las respuestas 4xx/5xx. Conserva el payload canónico y los flags
 * auxiliares para que la UI distinga por estado HTTP y `code` contractual.
 */
export class ApiProblemError extends Error {
  readonly problem: ApiProblem;
  readonly status: number;

  constructor(problem: ApiProblem) {
    super(problem.title);
    this.name = "ApiProblemError";
    this.problem = problem;
    this.status = problem.status;
  }
}
