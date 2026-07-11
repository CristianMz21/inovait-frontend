/**
 * Mappers de **Historial académico-docente** (FR-RPT-004 / WU11-STU).
 *
 * Convierten entre:
 *
 * - `StudentHistoryFiltersVm` (formulario) ⇄ path + query canónicos del
 *   endpoint `getStudentHistory`.
 * - `StudentHistoryResponseDto` (DTO canónico) → `StudentHistoryVm`
 *   (vista de presentación), preservando el orden estable del backend
 *   (inscripciones desc por `academicYear.startDate` y asc por
 *   `enrollmentId`; asignaciones asc por `subject.name`,
 *   `teacher.lastNames`, `teacher.firstNames`, `assignmentId`).
 *
 * El mapper NO reordena ni deduplica — exactamente lo opuesto: cuando el
 * backend garantiza el orden, la UI lo respeta para que DRPT spec del
 * recorrido no se rompa accidentalmente en refactors futuros.
 */

import type {
  EnrollmentHistoryItemDto,
  HistoryTeachingAssignmentDto,
  StudentHistoryResponseDto,
} from "../../core/api/dtos/student-history-item.dto";
import type {
  EnrollmentHistoryItemVm,
  StudentHistoryFiltersVm,
  StudentHistoryVm,
  TeachingAssignmentVm,
} from "./student-history.vm";
import { SCHOOL_SECTOR_LABELS, WEEKDAY_LABELS } from "./student-history.vm";

const DOCUMENT_TYPE_MIN = 1;
const DOCUMENT_TYPE_MAX = 20;
const DOCUMENT_NUMBER_MIN = 1;
const DOCUMENT_NUMBER_MAX = 32;

/**
 * Determina si los filtros de identidad están completos y la consulta
 * puede ejecutarse. El contrato exige `documentType` (1–20) y
 * `documentNumber` (1–32) en el path; las cadenas vacías o sólo espacios
 * se tratan como ausentes (la UI bloquea el envío en ese caso).
 *
 * `asOfDate` es opcional y se omite cuando es `null` o vacío.
 */
export function studentHistoryFiltersAreValid(
  vm: StudentHistoryFiltersVm,
): boolean {
  const docType = vm.documentType.trim();
  const docNumber = vm.documentNumber.trim();
  if (
    docType.length < DOCUMENT_TYPE_MIN ||
    docType.length > DOCUMENT_TYPE_MAX
  ) {
    return false;
  }
  if (
    docNumber.length < DOCUMENT_NUMBER_MIN ||
    docNumber.length > DOCUMENT_NUMBER_MAX
  ) {
    return false;
  }
  return true;
}

/**
 * Convierte la `StudentHistoryFiltersVm` a los parámetros canónicos del
 * endpoint `getStudentHistory`. Devuelve `null` cuando falta
 * `documentType` o `documentNumber`; el llamador debe bloquear el envío.
 *
 * `asOfDate` se incluye sólo cuando la operadora lo define
 * explícitamente (no vacío ni sólo espacios). Los path-params se
 * devuelven tal cual — la fachada los pasa al servicio HTTP que se
 * encarga del encoding de URL.
 */
export function studentHistoryFiltersToParams(vm: StudentHistoryFiltersVm): {
  documentType: string;
  documentNumber: string;
  asOfDate?: string;
} | null {
  if (!studentHistoryFiltersAreValid(vm)) {
    return null;
  }
  const params: {
    documentType: string;
    documentNumber: string;
    asOfDate?: string;
  } = {
    documentType: vm.documentType.trim(),
    documentNumber: vm.documentNumber.trim(),
  };
  const trimmedAsOf = vm.asOfDate?.trim();
  if (trimmedAsOf) {
    params.asOfDate = trimmedAsOf;
  }
  return params;
}

/**
 * Etiqueta legible de los días (`[1, 3, 5]` → `"Lunes, Miércoles, Viernes"`).
 * Los días fuera del rango 1–7 se incluyen con un literal canónico para
 * no ocultarlos al usuario.
 */
export function weekdayListLabel(weekdays: readonly number[]): string {
  return weekdays.map((day) => WEEKDAY_LABELS[day] ?? `Día ${day}`).join(", ");
}

/**
 * Aplana una asignación individual `HistoryTeachingAssignmentDto` a
 * `TeachingAssignmentVm`. Conserva el shape canónico:
 *
 * - `assignmentId` verbatim.
 * - `teacher` (id, documento, nombres, apellidos) se aplana; el nombre
 *   completo se compone con normalización de espacios múltiples (igual
 *   que la creación de matrículas).
 * - `subject` (id, code, name) se aplana; el código se conserva verbatim.
 * - `weekdays` se conserva verbatim y se etiqueta con `weekdaysLabel`.
 */
function toTeachingAssignmentVm(
  dto: HistoryTeachingAssignmentDto,
): TeachingAssignmentVm {
  const teacherFullName = `${dto.teacher.firstNames} ${dto.teacher.lastNames}`
    .replace(/\s+/g, " ")
    .trim();
  return {
    assignmentId: dto.assignmentId,
    teacherId: dto.teacher.id,
    teacherDocumentType: dto.teacher.documentType,
    teacherDocumentNumber: dto.teacher.documentNumber,
    teacherFullName,
    subjectId: dto.subject.id,
    subjectCode: dto.subject.code,
    subjectName: dto.subject.name,
    weekdays: [...dto.weekdays],
    weekdaysLabel: weekdayListLabel(dto.weekdays),
  };
}

/**
 * Aplana una inscripción individual `EnrollmentHistoryItemDto` a
 * `EnrollmentHistoryItemVm`. Conserva el shape canónico:
 *
 * - `academicYear`, `school`, `grade` y `classGroup` se aplanan campo a
 *   campo; el sector se etiqueta vía `SCHOOL_SECTOR_LABELS`.
 * - `teachingAssignments` se recorre en orden de llegada (ascendente por
 *   `subject.name`, `teacher.lastNames`, `teacher.firstNames`,
 *   `assignmentId`) sin reordenar ni podar.
 *
 * El mapper **no** fuerza `teachingAssignments: []` en una inscripción
 * vacía — el shape canónico ya lo garantiza. La VM queda `readonly` para
 * evitar mutaciones accidentales.
 */
export function enrollmentHistoryItemToVm(
  dto: EnrollmentHistoryItemDto,
): EnrollmentHistoryItemVm {
  return {
    enrollmentId: dto.enrollmentId,
    academicYearId: dto.academicYear.id,
    academicYearName: dto.academicYear.name,
    academicYearStartDate: dto.academicYear.startDate,
    academicYearEndDate: dto.academicYear.endDate,
    academicYearIsCurrent: dto.academicYear.isCurrent,
    schoolId: dto.school.id,
    schoolName: dto.school.name,
    schoolSector: dto.school.sector,
    schoolSectorLabel: SCHOOL_SECTOR_LABELS[dto.school.sector],
    gradeId: dto.grade.id,
    gradeName: dto.grade.name,
    classGroupId: dto.classGroup.id,
    classGroupCode: dto.classGroup.code,
    teachingAssignments: dto.teachingAssignments.map(toTeachingAssignmentVm),
  };
}

/**
 * Aplana la respuesta canónica `StudentHistoryResponseDto` a
 * `StudentHistoryVm` (vista de presentación).
 *
 * Transformación estructural 1:1 sin recalcular ni reagrupar:
 *
 * - `identity` se compone como `{ studentId, documentType, documentNumber,
 *   firstNames, lastNames, birthDate, fullName }`. El `fullName` normaliza
 *   espacios múltiples para mantener paridad con la creación de
 *   matrículas.
 * - `enrollments` se recorre en orden de llegada (descendente por
 *   `academicYear.startDate` y ascendente por `enrollmentId`). El backend
 *   garantiza el orden estable; la UI NO reordena.
 *
 * Una respuesta con `enrollments: []` se mapea a una VM con
 * `enrollments: []` explícito. La fachada (no este mapper) emite el
 * estado `empty` cuando la lista está vacía — el mapper es defensivo y
 * produce una VM coherente para cualquier entrada válida.
 */
export function studentHistoryResponseToVm(
  dto: StudentHistoryResponseDto,
): StudentHistoryVm {
  const fullName = `${dto.firstNames} ${dto.lastNames}`
    .replace(/\s+/g, " ")
    .trim();
  const identity = {
    studentId: dto.studentId,
    documentType: dto.documentType,
    documentNumber: dto.documentNumber,
    firstNames: dto.firstNames,
    lastNames: dto.lastNames,
    birthDate: dto.birthDate,
    fullName,
  };
  return {
    identity,
    enrollments: dto.enrollments.map(enrollmentHistoryItemToVm),
  };
}
