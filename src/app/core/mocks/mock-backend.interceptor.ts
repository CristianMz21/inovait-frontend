import type { HttpEvent, HttpRequest } from "@angular/common/http";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import {
  type HttpHandlerFn,
  type HttpInterceptorFn,
} from "@angular/common/http";
import { inject, isDevMode } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { API_CONFIG } from "../api/api-config";
import { environment } from "../../../environments/environment";
import { MOCK_ROUTES } from "./mock-routes";
import { mockOk } from "./mock-response";
import type {
  MockHandlerContext,
  MockHttpMethod,
  MockRoute,
} from "./mock-types";

/**
 * Intercept `/api/*` requests when `environment.useMocks === true` and
 * serve canned fixtures instead of forwarding them to the real backend.
 *
 * The interceptor is a no-op in production builds (`!environment.useMocks`)
 * and outside the configured `apiBaseUrl` path, so existing
 * `provideHttpClient` setups continue to work.
 *
 * When a request matches a route, the handler is executed and the result
 * is returned. When a request does not match any route, the interceptor
 * returns a synthetic 404 with a `mock_not_found` ProblemDetails so the
 * UI shows a clear error instead of silently failing through to the
 * real backend.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  if (!environment.useMocks) {
    return next(req);
  }

  const config = inject(API_CONFIG);
  const apiBase = stripTrailingSlash(config.apiBaseUrl);
  const path = stripApiBase(req.url, apiBase);

  // Only intercept `/api/*` requests, leave everything else (assets, etc.)
  // alone.
  if (!path.startsWith("/api/")) {
    return next(req);
  }

  const route = matchRoute(req.method as MockHttpMethod, path);
  if (!route) {
    if (isDevMode()) {
      // eslint-disable-next-line no-console -- intentional dev log
      console.warn(
        `[MOCK] no mock registered for ${req.method} ${path} — returning 404`,
      );
    }
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 404,
          statusText: "Not Found",
          url: req.url,
          error: {
            type: "https://inovait.local/problems/mock_not_found",
            title: "Mock no registrado",
            status: 404,
            code: "mock_not_found",
            detail: `No mock handler is registered for ${req.method} ${path}`,
          },
        }),
    );
  }

  const ctx = buildContext(req, path, route);
  const start =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  return new Observable<HttpEvent<unknown>>((subscriber) => {
    const sub = route.handler(ctx).subscribe({
      next: (body) => {
        const end =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        if (isDevMode()) {
          // eslint-disable-next-line no-console -- intentional dev log
          console.info(
            `[MOCK] ${req.method} ${path} → 200 in ${Math.round(end - start)}ms (${route.description ?? "no description"})`,
          );
        }
        subscriber.next(
          new HttpResponse({
            body,
            status: 200,
            url: req.url,
          }),
        );
        subscriber.complete();
      },
      error: (err) => {
        // Handlers can return error observables (e.g. mockProblem). When
        // they do, propagate the error as an HttpErrorResponse.
        const wrapped = wrapAsHttpError(err, req.url);
        if (isDevMode()) {
          // eslint-disable-next-line no-console -- intentional dev log
          console.info(
            `[MOCK] ${req.method} ${path} → ${wrapped.status} ${wrapped.statusText}`,
          );
        }
        subscriber.error(wrapped);
      },
    });
    return () => sub.unsubscribe();
  });
};

function buildContext(
  req: HttpRequest<unknown>,
  path: string,
  route: MockRoute,
): MockHandlerContext {
  return {
    method: req.method as MockHttpMethod,
    url: req.url,
    params: paramsToRecord(req.params),
    pathParams: extractPathParams(route.pattern, path),
    body: req.body,
    request: req,
  };
}

/**
 * Matches a request (method + path) against the route table.
 *
 * Iterates in declaration order and returns the first route whose method
 * matches and whose pattern matches the path. Returns `undefined` if no
 * route matches, which causes the interceptor to emit a 404.
 */
function matchRoute(
  method: MockHttpMethod,
  path: string,
): MockRoute | undefined {
  for (const route of MOCK_ROUTES) {
    if (route.method !== method) continue;
    if (matchPath(route.pattern, path)) return route;
  }
  return undefined;
}

/**
 * Matches a path against a pattern. A pattern is a slash-delimited path
 * where each segment is either a literal (must match exactly) or a
 * `{name}` placeholder (matches any single segment).
 *
 * Examples:
 *   matchPath("/api/schools", "/api/schools") === true
 *   matchPath("/api/teachers/{id}/contracts", "/api/teachers/42/contracts") === true
 *   matchPath("/api/schools", "/api/teachers") === false
 */
function matchPath(pattern: string, path: string): boolean {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return false;
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const v = pathSegments[i];
    if (p === undefined || v === undefined) return false;
    if (p.startsWith("{") && p.endsWith("}")) continue;
    if (p !== v) return false;
  }
  return true;
}

/**
 * Extracts dynamic path parameters from a path that matched a pattern.
 * Only segments captured by `{name}` placeholders are returned.
 */
function extractPathParams(
  pattern: string,
  path: string,
): Readonly<Record<string, string>> {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    if (p === undefined) continue;
    if (p.startsWith("{") && p.endsWith("}")) {
      const key = p.slice(1, -1);
      const v = pathSegments[i];
      if (v !== undefined) {
        params[key] = decodeURIComponent(v);
      }
    }
  }
  return params;
}

/**
 * Converts an Angular `HttpParams` instance to a plain object. Multi-value
 * params keep only the first occurrence; if a handler needs full multi-
 * value support, it should read `request.params` directly.
 */
function paramsToRecord(params: {
  keys(): readonly string[];
  get(key: string): string | null;
}): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  for (const key of params.keys()) {
    const value = params.get(key);
    if (value !== null) {
      out[key] = value;
    }
  }
  return out;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

/**
 * Returns the path relative to the configured API base. Falls back to the
 * raw URL when the base URL is empty (typical in dev with mocks).
 */
function stripApiBase(url: string, apiBase: string): string {
  if (!apiBase) return url;
  if (url.startsWith(apiBase)) {
    const remainder = url.slice(apiBase.length);
    return remainder.startsWith("/") ? remainder : `/${remainder}`;
  }
  return url;
}

/**
 * Wraps any error thrown by a mock handler as an `HttpErrorResponse`,
 * preserving the `error` body so consumers reading `error.error.code` see
 * the ProblemDetails shape produced by the real backend.
 */
function wrapAsHttpError(err: unknown, url: string): HttpErrorResponse {
  if (err instanceof HttpErrorResponse) return err;
  // The mockProblem helper throws synthetic objects with `status`, `error`,
  // etc. Lift those into a proper HttpErrorResponse.
  const anyErr = err as {
    status?: number;
    statusText?: string;
    error?: unknown;
    message?: string;
  };
  const status = anyErr.status ?? 500;
  const statusText = anyErr.statusText ?? "Internal Server Error";
  const errorBody = anyErr.error ?? {
    code: "internal_error",
    message: anyErr.message,
  };
  return new HttpErrorResponse({
    status,
    statusText,
    url,
    error: errorBody,
  });
}

// Re-export `mockOk` so test files can build custom routes via the same
// helpers without reaching into the response module.
export { mockOk };
