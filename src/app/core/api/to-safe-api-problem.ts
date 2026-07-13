/* Copyright (c) 2026. All rights reserved. */
import type { ApiProblem } from "./dtos/api-problem.dto";
import { ApiProblemError } from "./api-problem-error";

const unexpectedProblem: ApiProblem = {
  type: "about:blank/unexpected-client-error",
  title: "Error inesperado",
  status: 0,
  code: "unknown_error",
  detail: null,
};

export const toSafeApiProblem = (error: unknown): ApiProblem => {
  if (error instanceof ApiProblemError) {
    return error.problem;
  }
  return unexpectedProblem;
};
