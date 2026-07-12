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
): boolean =>
  typeof runtimeOverride === "boolean" ? runtimeOverride : buildDefault;

export const readRuntimeMockOverride = (): boolean | undefined => {
  if (typeof window === "undefined") {
    return undefined;
  }
  const runtimeValue: unknown = window.__INOVAIT_USE_MOCKS__;
  return typeof runtimeValue === "boolean" ? runtimeValue : undefined;
};
