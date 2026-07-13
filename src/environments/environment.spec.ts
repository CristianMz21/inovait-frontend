import { describe, expect, it, vi } from "vitest";
import { readRuntimeMockOverride, resolveUseMocks } from "./environment-config";

describe("resolveUseMocks", () => {
  it("uses the build default when no runtime override exists", () => {
    expect(resolveUseMocks(true, undefined)).toBe(true);
    expect(resolveUseMocks(false, undefined)).toBe(false);
  });

  it("gives the runtime override precedence in every build", () => {
    expect(resolveUseMocks(false, true)).toBe(true);
    expect(resolveUseMocks(true, false)).toBe(false);
  });

  it.each(["false", "true", 0, 1, null, [], {}, Symbol("true")])(
    "fails closed for a non-boolean runtime value: %s",
    runtimeValue => {
      expect(resolveUseMocks(false, runtimeValue)).toBe(false);
      expect(resolveUseMocks(true, runtimeValue)).toBe(true);
    },
  );

  it("reads only boolean values from the browser global", () => {
    const original = window.__INOVAIT_USE_MOCKS__;
    try {
      for (const invalidValue of ["false", "true", 0, null, [], {}]) {
        window.__INOVAIT_USE_MOCKS__ = invalidValue;
        expect(readRuntimeMockOverride()).toBeUndefined();
      }
      window.__INOVAIT_USE_MOCKS__ = true;
      expect(readRuntimeMockOverride()).toBe(true);
      window.__INOVAIT_USE_MOCKS__ = false;
      expect(readRuntimeMockOverride()).toBe(false);
    } finally {
      window.__INOVAIT_USE_MOCKS__ = original;
    }
  });

  it("returns undefined outside a browser", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(readRuntimeMockOverride()).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
