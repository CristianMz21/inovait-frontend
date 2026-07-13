/* Copyright (c) 2026. All rights reserved. */
export {
  AGE_BAND_LABELS,
  SECTOR_LABELS,
  SECTOR_ORDER,
  TOP_SCHOOL_SECTOR_LABELS,
  type AgeBandId,
  type AgeBandVm,
  type AgeDistributionFieldVm,
  type AgeDistributionFiltersVm,
  type AgeDistributionVm,
  type SectorCountVm,
  type SectorId,
  type TeacherCountsBySectorFiltersVm,
  type TeacherCountsBySectorVm,
  type TopSchoolVm,
  type TopSchoolsFiltersVm,
  type TopSchoolsVm,
} from "./report.vm";
export {
  ReportApiService,
  type GetAgeDistributionParams,
  type GetTeacherCountsBySectorParams,
  type GetTopSchoolsByEnrollmentParams,
} from "./report.api.service";
export {
  ageDistributionFiltersAreValid,
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
  teacherCountsBySectorFiltersAreValid,
  teacherCountsBySectorFiltersToParams,
  teacherCountsBySectorResponseToVm,
  topSchoolsFiltersAreValid,
  topSchoolsFiltersToParams,
  topSchoolsResponseToVm,
} from "./report.mappers";
export { ReportFacade } from "./report.facade";
export { ReportsShellComponent } from "./reports-shell.component";
export { AgeDistributionComponent } from "./age-distribution/age-distribution.component";
export { TeacherCountsBySectorComponent } from "./teacher-counts-by-sector/teacher-counts-by-sector.component";
export { TopSchoolsComponent } from "./top-schools/top-schools.component";
