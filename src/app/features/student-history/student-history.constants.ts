/* Copyright (c) 2026. All rights reserved. */
export const STUDENT_HISTORY_DOCUMENT_TYPE_MIN_LENGTH = 1;
export const STUDENT_HISTORY_DOCUMENT_TYPE_MAX_LENGTH = 20;
export const STUDENT_HISTORY_DOCUMENT_NUMBER_MIN_LENGTH = 1;
export const STUDENT_HISTORY_DOCUMENT_NUMBER_MAX_LENGTH = 32;

export const STUDENT_HISTORY_SELECTION_TTL_MS = 300_000;

export const STUDENT_HISTORY_REMOTE_STATUS = {
  empty: "empty",
  error: "error",
  idle: "idle",
  loading: "loading",
  success: "success",
} as const;

export const STUDENT_HISTORY_NO_RESULTS_REASON = "noResults" as const;
