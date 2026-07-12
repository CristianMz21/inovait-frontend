import {
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from "@angular/common/http";
import { Observable, mergeMap, of, throwError, timer } from "rxjs";

/**
 * Configurable knobs for every mock response.
 *
 * - `delayMs` simulates network latency so the UI exercises the same
 *   loading paths it would against the real backend. Default: 120ms.
 * - `status` is the HTTP status code for successful responses (default 200).
 * - `headers` are merged with the default `Content-Type: application/json`
 *   so callers can override specific keys without losing the JSON hint.
 */
export interface MockResponseOptions {
  readonly delayMs?: number;
  readonly status?: number;
  readonly headers?: Record<string, string | readonly string[]>;
}

interface MockProblemOptions extends Omit<MockResponseOptions, "status"> {
  readonly type?: string;
  readonly detail?: string;
  readonly instance?: string;
  readonly errors?: Readonly<Record<string, readonly string[]>>;
}

const DEFAULT_LATENCY_MS = 120;

export const applyDelay = <T>(
  source: Observable<T>,
  delayMs?: number,
): Observable<T> => {
  const ms = delayMs ?? DEFAULT_LATENCY_MS;
  return ms > 0 ? timer(ms).pipe(mergeMap(() => source)) : source;
};

/**
 * Builds a successful mock response (defaults to 200 OK + JSON content type).
 *
 * The payload is wrapped in an `HttpResponse` (not just emitted raw) so the
 * downstream `HttpClient` consumers see the same shape they'd see against
 * a real backend, including status and headers.
 */
export function mockOk<T>(
  body: T,
  options: MockResponseOptions = {},
): Observable<HttpResponse<T>> {
  const response = new HttpResponse<T>({
    body,
    status: options.status ?? 200,
    headers: mergeDefaultHeaders(options.headers),
  });
  return applyDelay(of(response), options.delayMs);
}

/**
 * Builds a mock error response using the Inovait `ProblemDetails` shape.
 *
 * The positional `status` is the single source of truth for both HTTP and
 * ProblemDetails status. The interceptor propagates the HttpErrorResponse so
 * consumers receive the same normalized API problem as with the backend.
 */
export function mockProblem(
  status: number,
  code: string,
  title: string,
  options: MockProblemOptions = {},
): Observable<never> {
  const problem = {
    type: options.type ?? `https://inovait.local/problems/${code}`,
    title,
    status,
    code,
    detail: options.detail,
    instance: options.instance,
    errors: options.errors,
  };
  const error = new HttpErrorResponse({
    status,
    statusText: title,
    error: problem,
    headers: mergeDefaultHeaders(options.headers, "application/problem+json"),
  });
  return applyDelay(
    throwError(() => error),
    options.delayMs,
  );
}

/**
 * Merges caller-supplied headers with sensible defaults for a JSON API.
 *
 * `Content-Type` is always set to `application/json` unless the caller
 * explicitly overrides it (useful for ProblemDetails responses, which
 * use `application/problem+json`).
 */
function mergeDefaultHeaders(
  overrides: Record<string, string | readonly string[]> | undefined,
  defaultContentType = "application/json",
): HttpHeaders {
  const base: Record<string, string | readonly string[]> = {
    "Content-Type": defaultContentType,
  };
  const merged: Record<string, string | readonly string[]> = {
    ...base,
    ...(overrides ?? {}),
  };
  let headers = new HttpHeaders();
  for (const [key, value] of Object.entries(merged)) {
    headers = headers.set(key, value as string | string[]);
  }
  return headers;
}
