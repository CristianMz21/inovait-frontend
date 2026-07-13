/* Copyright (c) 2026. All rights reserved. */
export { API_CONFIG, DEFAULT_API_CONFIG } from "./api-config";
export type { ApiConfig } from "./api-config";
export { ApiProblemError } from "./api-problem-error";
export type {
  AcademicYearSummary,
  AgeBandResponse,
  AgeDistributionResponseDto,
  ApiProblem,
  ApiProblemCode,
  ApiProblemWithCode,
  ClassGroupSummary,
  CreateEnrollmentRequest,
  CreateEnrollmentResponse,
  CreateTeacherContractsRequest,
  EnrollmentHistoryItemDto,
  EnrollmentListItem,
  GradeSummary,
  HistoryTeachingAssignmentDto,
  SchoolSector,
  SchoolSummary,
  SchoolTeacherSummary,
  StudentHistoryResponseDto,
  StudentIdentityInput,
  SubjectSummary,
  TeacherContractEffectiveStatus,
  TeacherContractPersistedStatus,
  TeacherContractResponse,
  TeacherCountsBySectorResponseDto,
  TeacherSummary,
  TopSchoolResponseDto,
} from "./dtos";
export {
  normalizeApiError,
  problemDetailsInterceptor,
} from "./problem-details.interceptor";
export {
  provideApiHttpClient,
  withApiProblemDetails,
} from "./provide-api-http-client";
export type { HttpInterceptorFn } from "./provide-api-http-client";
export { empty, errorState, idle, loading, success } from "./remote-state";
export type { RemoteState } from "./remote-state";
export { toApiProblem } from "./to-api-problem";
