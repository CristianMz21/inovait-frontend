/* Copyright (c) 2026. All rights reserved. */
import type { HttpErrorResponse } from "@angular/common/http";
import type { ApiProblem } from "./dtos/api-problem.dto";

const BAD_REQUEST_STATUS = 400;
const NOT_FOUND_STATUS = 404;
const CONFLICT_STATUS = 409;
const UNPROCESSABLE_CONTENT_STATUS = 422;

/**
 * Coerce un `HttpErrorResponse` a un `ApiProblem` canónico.
 * Si el backend responde `application/problem+json` se usa su cuerpo tal cual.
 * Si no, se construye un `ApiProblem` mínimo con `code` derivado del estado.
 */
export function toApiProblem(error: HttpErrorResponse): ApiProblem {
  const body: unknown = error.error;
  if (isApiProblem(body)) {
    return body;
  }

  const status = error.status ?? 0;
  const code = deriveFallbackCode(status);
  return {
    status,
    code,
    detail: null,
    type: error.url ?? `about:blank/${status}`,
    title: deriveFallbackTitle(code),
  };
}

function isApiProblem(value: unknown): value is ApiProblem {
  if (!isRecord(value)) {
    return false;
  }
  return (
    hasRequiredProblemFields(value) &&
    isOptionalString(value["detail"]) &&
    isOptionalErrorMap(value["errors"])
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasRequiredProblemFields(candidate: Record<string, unknown>): boolean {
  return (
    typeof candidate["type"] === "string" &&
    typeof candidate["title"] === "string" &&
    typeof candidate["status"] === "number" &&
    typeof candidate["code"] === "string"
  );
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalErrorMap(value: unknown): boolean {
  if (value === undefined) {
    return true;
  }
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(isStringArray);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

function deriveFallbackTitle(code: string): string {
  switch (code) {
    case "invalid_request":
      return "Solicitud inválida";
    case "resource_not_found":
      return "Recurso no encontrado";
    case "history_conflict":
      return "Conflicto";
    case "business_rule_violation":
      return "Regla de negocio incumplida";
    default:
      return "Error inesperado";
  }
}

function deriveFallbackCode(status: number): string {
  switch (status) {
    case BAD_REQUEST_STATUS:
      return "invalid_request";
    case NOT_FOUND_STATUS:
      return "resource_not_found";
    case CONFLICT_STATUS:
      return "history_conflict";
    case UNPROCESSABLE_CONTENT_STATUS:
      return "business_rule_violation";
    default:
      return "unknown_error";
  }
}
