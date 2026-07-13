/* Copyright (c) 2026. All rights reserved. */
import type { CreateTeacherContractsRequest } from "../../core/api/dtos/create-teacher-contracts-request.dto";
import type { TeacherContractResponse } from "../../core/api/dtos/teacher-contract-response.dto";
import {
  isCalendarDateBefore,
  isCalendarDateOnly,
} from "../../core/dates/calendar-date";
import type {
  TeacherContractResultVm,
  TeacherContractsFormVm,
} from "./teacher-contracts.vm";

/**
 * Determina si el formulario de contratos es submittable.
 *
 * Reglas mínimas alineadas con el contrato (`components/teacher-contracts.yaml`):
 * - `teacherId` seleccionado.
 * - Al menos un `schoolId`.
 * - `schoolIds` sin duplicados (la duplicación es `409` para el backend,
 *   pero la UI la previene localmente).
 * - `startDate` no vacía en formato `YYYY-MM-DD`.
 * - `endDate` ausente o posterior/igual a `startDate` (regla de rango
 *   local; `endDate < startDate` debe bloquear el submit).
 */
export function teacherContractsFormIsValid(
  vm: TeacherContractsFormVm,
): boolean {
  if (vm.teacherId === null) {
    return false;
  }
  if (vm.schoolIds.length === 0) {
    return false;
  }
  const uniqueSchoolIds = new Set(vm.schoolIds);
  if (uniqueSchoolIds.size !== vm.schoolIds.length) {
    return false;
  }
  if (!isCalendarDateOnly(vm.startDate)) {
    return false;
  }
  if (vm.endDate !== null) {
    if (!isCalendarDateOnly(vm.endDate)) {
      return false;
    }
    if (isCalendarDateBefore(vm.endDate, vm.startDate)) {
      return false;
    }
  }
  return true;
}

/**
 * Convierte la `TeacherContractsFormVm` al payload canónico del
 * endpoint `createTeacherContracts`. Devuelve `null` cuando la VM no
 * cumple las reglas mínimas; el llamador debe bloquear el envío.
 *
 * El mapper recorta los `schoolIds` para alinear la canonicalización
 * con el backend (que rechaza duplicados como `409`). La conversión
 * `readonly number[]` → `number[]` se hace en una copia nueva para no
 * mutar la entrada.
 */
export function teacherContractsFormToRequest(
  vm: TeacherContractsFormVm,
): { teacherId: number; request: CreateTeacherContractsRequest } | null {
  if (!teacherContractsFormIsValid(vm)) {
    return null;
  }
  const teacherId = vm.teacherId;
  if (teacherId === null) {
    return null;
  }
  return {
    teacherId,
    request: {
      schoolIds: [...vm.schoolIds],
      startDate: vm.startDate,
      endDate: vm.endDate,
    },
  };
}

/**
 * Aplana `TeacherContractResponse` (DTO canónico) a
 * `TeacherContractResultVm` (VM de presentación). La composición de
 * `schoolSector` colapsa a etiqueta legible para la UI; los estados
 * `persistedStatus` y `effectiveStatus` se conservan como enums separados
 * para no mezclar semántica de negocio (FR-TC-003).
 */
export function teacherContractResponseToResult(
  dto: TeacherContractResponse,
): TeacherContractResultVm {
  let schoolSector = "Privado";
  if (dto.school.sector === "Public") {
    schoolSector = "Público";
  }
  return {
    schoolSector,
    id: dto.id,
    teacherId: dto.teacherId,
    schoolId: dto.school.id,
    schoolName: dto.school.name,
    startDate: dto.startDate,
    endDate: dto.endDate,
    persistedStatus: dto.persistedStatus,
    effectiveStatus: dto.effectiveStatus,
    evaluatedAt: dto.evaluatedAt,
  };
}
