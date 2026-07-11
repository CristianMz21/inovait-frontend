import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { toApiProblem } from './to-api-problem';
import { apiProblemNotFoundFixture } from '../../../testing/fixtures';

describe('toApiProblem', () => {
  it('pasa el payload cuando el backend responde ProblemDetails', () => {
    const headers = new HttpHeaders({ 'Content-Type': 'application/problem+json' });
    const error = new HttpErrorResponse({
      status: 404,
      error: apiProblemNotFoundFixture,
      headers,
    });
    const problem = toApiProblem(error);
    expect(problem.code).toBe('resource_not_found');
    expect(problem.status).toBe(404);
    expect(problem.title).toBe(apiProblemNotFoundFixture.title);
  });

  it('deriva un code por estado HTTP cuando no hay ProblemDetails', () => {
    const error400 = new HttpErrorResponse({ status: 400 });
    expect(toApiProblem(error400).code).toBe('invalid_request');

    const error409 = new HttpErrorResponse({ status: 409 });
    expect(toApiProblem(error409).code).toBe('history_conflict');

    const error422 = new HttpErrorResponse({ status: 422 });
    expect(toApiProblem(error422).code).toBe('business_rule_violation');

    const errorUnknown = new HttpErrorResponse({ status: 503 });
    expect(toApiProblem(errorUnknown).code).toBe('unknown_error');
  });

  it('preserva el detail cuando el cuerpo es un string', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: 'gateway timeout',
      statusText: 'Gateway Timeout',
    });
    const problem = toApiProblem(error);
    expect(problem.detail).toBe('gateway timeout');
  });
});
