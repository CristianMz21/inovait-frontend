/* Copyright (c) 2026. All rights reserved. */
/**
 * Environment configuration for the Inovait frontend.
 *
 * `useMocks` controls whether the MockBackendInterceptor intercepts requests
 * to `/api/*` and serves canned fixtures instead of forwarding them to the
 * real backend. The production default is `false`; Angular's development
 * configuration replaces this file with `environment.development.ts`, whose
 * default is `true`.
 *
 * To force either mode without rebuilding, set the global
 * `window.__INOVAIT_USE_MOCKS__` before the app bootstraps (used by E2E
 * tests). Only boolean values are accepted; other runtime values fall back to
 * the build default.
 */
import {
  type AppEnvironment,
  readRuntimeMockOverride,
  resolveUseMocks,
} from "./environment-config";

export const environment: AppEnvironment = {
  useMocks: resolveUseMocks(false, readRuntimeMockOverride()),
};
