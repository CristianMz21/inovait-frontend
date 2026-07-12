// Learn more about Vitest configuration options at https://vitest.dev/config/

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // Pure test fixtures contain no production behavior and would inflate
      // line coverage merely by being imported by the mock adapter.
      exclude: ["src/**/*.spec.ts", "src/testing/**"],
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "coverage",
      thresholds: {
        statements: 89,
        branches: 83,
        functions: 89,
        lines: 90,
        "src/app/core/mocks/mock-response.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        "src/app/core/mocks/date-only.ts": {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
      },
    },
  },
});
