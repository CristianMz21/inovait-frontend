import type { Observable } from "rxjs";
import type { HttpRequest } from "@angular/common/http";

/**
 * HTTP methods the mock backend can intercept.
 *
 * Kept narrow on purpose: only the verbs actually used by the Inovait API
 * are accepted. Adding a new verb here is the only change required to
 * support it.
 */
export type MockHttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Parameters passed to a mock handler when a request is intercepted.
 *
 * - `params` holds the query string as a plain record (Angular's `HttpParams`
 *   is not exposed here to keep handlers framework-agnostic).
 * - `pathParams` holds the dynamic path segments matched against the route
 *   pattern (e.g. `/api/teachers/{id}/contracts` → `{ id: "42" }`).
 * - `body` holds the parsed JSON body for POST/PUT/PATCH, or `undefined`.
 * - `request` exposes the original Angular request for advanced cases
 *   (e.g. inspecting headers).
 */
export interface MockHandlerContext {
  readonly method: MockHttpMethod;
  readonly url: string;
  readonly params: Readonly<Record<string, string>>;
  readonly pathParams: Readonly<Record<string, string>>;
  readonly body: unknown;
  /**
   * Original Angular request, exposed for handlers that need to inspect
   * headers, content-type, etc. Optional because unit tests construct
   * minimal contexts without spinning up the full Angular HTTP machinery.
   */
  readonly request?: HttpRequest<unknown>;
}

/**
 * A mock handler produces the response payload for a given request.
 *
 * Returning an `Observable` (rather than a plain value) lets handlers
 * simulate latency with `delay()`, throw errors, or compose multiple
 * emissions. The interceptor subscribes once and forwards the result.
 */
export type MockHandler<TResponse> = (
  context: MockHandlerContext,
) => Observable<TResponse>;

/**
 * Definition of a single mock route.
 *
 * `pattern` is a path with optional `{paramName}` segments. The matcher
 * splits the request URL on `/api/` and matches the remainder against
 * the pattern. A route is considered a match when:
 *   1. The HTTP method matches exactly.
 *   2. Every path segment aligns (literal matches the segment, `{x}`
 *      matches anything and is captured into `pathParams.x`).
 *
 * Routes are evaluated in declaration order; the first match wins. Put
 * more specific patterns before more general ones (e.g. `/api/foo/{id}`
 * before `/api/foo`).
 */
export interface MockRoute<TResponse = unknown> {
  readonly method: MockHttpMethod;
  readonly pattern: string;
  readonly handler: MockHandler<TResponse>;
  /**
   * Optional human-readable description used in console logs. Helpful when
   * debugging which route served a given request.
   */
  readonly description?: string;
}
