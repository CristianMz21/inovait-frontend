import type { HttpErrorResponse } from '@angular/common/http';
import type { ApiProblem } from './dtos/api-problem.dto';

/**
 * Coerce un `HttpErrorResponse` a un `ApiProblem` canónico.
 * Si el backend responde `application/problem+json` se usa su cuerpo tal cual.
 * Si no, se construye un `ApiProblem` mínimo con `code` derivado del estado.
 */
export function toApiProblem(error: HttpErrorResponse): ApiProblem {
  const body = error.error as Partial<ApiProblem> | string | null | undefined;
  if (body && typeof body === 'object' && 'code' in body && 'status' in body) {
    return body as ApiProblem;
  }

  const status = error.status ?? 0;
  return {
    type: error.url ?? `about:blank/${status}`,
    title: error.statusText || 'Error',
    status,
    code: deriveFallbackCode(status),
    detail: typeof body === 'string' ? body : null,
  };
}

function deriveFallbackCode(status: number): string {
  switch (status) {
    case 400:
      return 'invalid_request';
    case 404:
      return 'resource_not_found';
    case 409:
      return 'history_conflict';
    case 422:
      return 'business_rule_violation';
    default:
      return 'unknown_error';
  }
}
