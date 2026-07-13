/* Copyright (c) 2026. All rights reserved. */
import {
  type AppEnvironment,
  readRuntimeMockOverride,
  resolveUseMocks,
} from "./environment-config";

export const environment: AppEnvironment = {
  useMocks: resolveUseMocks(true, readRuntimeMockOverride()),
};
