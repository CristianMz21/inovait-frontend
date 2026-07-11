/**
 * Environment configuration for the Inovait frontend.
 *
 * `useMocks` controls whether the MockBackendInterceptor intercepts requests
 * to `/api/*` and serves canned fixtures instead of forwarding them to the
 * real backend. Default is `true` so that local development works without a
 * running backend; production builds flip this to `false`.
 *
 * To force either mode without rebuilding, set the global
 * `window.__INOVAIT_USE_MOCKS__` before the app bootstraps (used by E2E
 * tests and Playwright scenarios that need to test against the real backend).
 */
export interface AppEnvironment {
  readonly useMocks: boolean;
}

declare global {
  interface Window {
    __INOVAIT_USE_MOCKS__?: boolean;
  }
}

const readUseMocks = (): boolean => {
  // Explicit override (used by E2E tests): window flag wins.
  if (
    typeof window !== "undefined" &&
    typeof window.__INOVAIT_USE_MOCKS__ === "boolean"
  ) {
    return window.__INOVAIT_USE_MOCKS__;
  }
  // Default: true in dev (so the app runs without a backend), false otherwise.
  // Angular sets `ngDevMode` only in development builds.
  if (typeof ngDevMode === "undefined") {
    return false;
  }
  return true;
};

export const environment: AppEnvironment = {
  useMocks: readUseMocks(),
};
