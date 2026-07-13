/* Copyright (c) 2026. All rights reserved. */
export { TeacherContractsComponent } from "./teacher-contracts.component";
export { TeacherContractsFacade } from "./teacher-contracts.facade";
export type {
  TeacherContractEffectiveLabel,
  TeacherContractPersistedLabel,
  TeacherContractResultVm,
  TeacherContractsFieldVm,
  TeacherContractsFormVm,
} from "./teacher-contracts.vm";
export { TeacherContractsApiService } from "./teacher-contracts.api.service";
export type {
  CreateTeacherContractsParams,
  ListTeacherContractsParams,
} from "./teacher-contracts.api.service";
export {
  teacherContractResponseToResult,
  teacherContractsFormIsValid,
  teacherContractsFormToRequest,
} from "./teacher-contracts.mappers";
