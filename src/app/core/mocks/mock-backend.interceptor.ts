/* Copyright (c) 2026. All rights reserved. */
import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
} from "@angular/common/http";
import { inject, isDevMode } from "@angular/core";
import { Observable, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { API_CONFIG } from "../api/api-config";
import { normalizeApiError } from "../api/problem-details.interceptor";
import { extractPathParams, matchRoute } from "./mock-route-matcher";
import { MOCK_ROUTES } from "./mock-routes";
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
interface MockInterceptorOptions {
  readonly enabled: boolean;
  readonly loggingEnabled?: boolean;
  readonly routes?: readonly MockRoute[];
  readonly logger?: Pick<Console, "info" | "warn">;
}

const INTERNAL_SERVER_ERROR_STATUS = 500;

export const createMockBackendInterceptor =
  (options: MockInterceptorOptions): HttpInterceptorFn =>
  (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<unknown>> => {
    if (!options.enabled) {
      return next(req);
    }

    const config = inject(API_CONFIG);
    const apiBase = stripTrailingSlash(config.apiBaseUrl);
    const path = stripApiBase(req.url, apiBase);
    const loggingEnabled = options.loggingEnabled ?? isDevMode();
    const logger = options.logger ?? globalThis.console;

    // Only intercept `/api/*` requests, leave everything else (assets, etc.)
    // alone.
    if (!path.startsWith("/api/")) {
      return next(req);
    }

    const route = matchRoute(
      req.method as MockHttpMethod,
      path,
      options.routes ?? MOCK_ROUTES,
    );
    if (!route) {
      if (loggingEnabled) {
        logMock(
          logger,
          "warn",
          `[MOCK] no mock registered for ${req.method} — returning 404`,
        );
      }
      const notFound = new HttpErrorResponse({
        status: 404,
        statusText: "Not Found",
        url: req.url,
        error: {
          type: "https://inovait.local/problems/mock_not_found",
          title: "Mock no registrado",
          status: 404,
          code: "mock_not_found",
          detail: `No mock handler is registered for ${req.method}`,
        },
      });
      return throwError(() => normalizeApiError(notFound));
    }

    const ctx = buildContext(req, path, route);
    const start = currentTimestamp();
    return new Observable<HttpEvent<unknown>>(subscriber => {
      const sub = route.handler(ctx).subscribe({
        next: response => {
          const end = currentTimestamp();
          if (loggingEnabled) {
            logMock(
              logger,
              "info",
              `[MOCK] ${req.method} ${route.pattern} → ${response.status} in ${Math.round(end - start)}ms (${route.description ?? "no description"})`,
            );
          }
          subscriber.next(response.clone({ url: req.url }));
          subscriber.complete();
        },
        error: (err: unknown) => {
          // Handlers can return error observables (e.g. mockProblem). When
          // they do, propagate the error as an HttpErrorResponse.
          const wrapped = wrapAsHttpError(err, req.url);
          if (loggingEnabled) {
            logMock(
              logger,
              "info",
              `[MOCK] ${req.method} ${route.pattern} → ${wrapped.status} ${readErrorTitle(wrapped.error)}`,
            );
          }
          subscriber.error(normalizeApiError(wrapped));
        },
      });
      return () => sub.unsubscribe();
    });
  };

export const mockBackendInterceptor: HttpInterceptorFn =
  createMockBackendInterceptor({ enabled: environment.useMocks });

function logMock(
  logger: Pick<Console, "info" | "warn">,
  level: "info" | "warn",
  message: string,
): void {
  logger[level](message);
}

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
  if (s.endsWith("/")) {
    return s.slice(0, -1);
  }
  return s;
}

/**
 * Returns the path relative to the configured API base. Falls back to the
 * raw URL when the base URL is empty (typical in dev with mocks).
 */
function stripApiBase(url: string, apiBase: string): string {
  if (!apiBase) {
    return url;
  }
  if (url.startsWith(apiBase)) {
    const remainder = url.slice(apiBase.length);
    if (remainder.startsWith("/")) {
      return remainder;
    }
    return `/${remainder}`;
  }
  return url;
}

function currentTimestamp(): number {
  if (globalThis.performance === undefined) {
    return Date.now();
  }
  return globalThis.performance.now();
}

function readErrorTitle(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "title" in error &&
    typeof error.title === "string"
  ) {
    return error.title;
  }
  return "Request failed";
}

/**
 * Wraps any error thrown by a mock handler as an `HttpErrorResponse`,
 * preserving the `error` body so consumers reading `error.error.code` see
 * the ProblemDetails shape produced by the real backend.
 */
function wrapAsHttpError(err: unknown, url: string): HttpErrorResponse {
  if (err instanceof HttpErrorResponse) {
    return err;
  }
  // The mockProblem helper throws synthetic objects with `status`, `error`,
  // etc. Lift those into a proper HttpErrorResponse.
  const candidate = err as {
    status?: number;
    statusText?: string;
    error?: unknown;
    message?: string;
  };
  const status = candidate.status ?? INTERNAL_SERVER_ERROR_STATUS;
  const statusText = candidate.statusText ?? "Internal Server Error";
  const errorBody = candidate.error ?? {
    code: "internal_error",
    message: candidate.message,
  };
  return new HttpErrorResponse({
    status,
    statusText,
    url,
    error: errorBody,
  });
}
