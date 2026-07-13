/* Copyright (c) 2026. All rights reserved. */
export interface AppEnvironment {
  readonly useMocks: boolean;
}

declare global {
  interface Window {
    __INOVAIT_USE_MOCKS__?: unknown;
  }
}

export const resolveUseMocks = (
  buildDefault: boolean,
  runtimeOverride: unknown,
): boolean => {
  if (typeof runtimeOverride === "boolean") {
    return runtimeOverride;
  }
  return buildDefault;
};

export const readRuntimeMockOverride = (): boolean | undefined => {
  if (globalThis.window === undefined) {
    return undefined;
  }
  const runtimeValue: unknown = globalThis.window.__INOVAIT_USE_MOCKS__;
  if (typeof runtimeValue === "boolean") {
    return runtimeValue;
  }
  return undefined;
};
