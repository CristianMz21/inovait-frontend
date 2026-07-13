/* Copyright (c) 2026. All rights reserved. */
/**
 * Sub-elementos del response canónico `StudentHistoryResponse`. Refleja la
 * definición de `components/enrollments.yaml#/schemas/EnrollmentHistoryItem`
 * y `HistoryTeachingAssignment` del contrato OpenAPI.
 *
 * La forma es exacta: cualquier propiedad nueva o renombrada requiere
 * un delta en el contrato y, eventualmente, un delta en
 * `openspec/specs/municipal-reports/spec.md` (FR-RPT-004).
 */
import type { AcademicYearSummary } from "./academic-year-summary.dto";
import type { ClassGroupSummary } from "./class-group-summary.dto";
import type { GradeSummary } from "./grade-summary.dto";
import type { SchoolSummary } from "./school-summary.dto";
import type { SubjectSummary } from "./subject-summary.dto";
import type { TeacherSummary } from "./teacher-summary.dto";

/**
 * Una asignación docente dentro de una inscripción histórica. Refleja
 * `components/enrollments.yaml#/schemas/HistoryTeachingAssignment`.
 *
 * - `assignmentId` identifica la asignación canónica (`TeachingAssignment`).
 * - `teacher` anida un `TeacherSummary` (id, documento, nombres, apellidos).
 * - `subject` anida un `SubjectSummary` (id, code, name).
 * - `weekdays` es la lista canónica de días ISO (1 = lunes ... 7 = domingo);
 *   el orden interno del array lo fija el backend.
 */
export interface HistoryTeachingAssignmentDto {
  readonly assignmentId: number;
  readonly teacher: TeacherSummary;
  readonly subject: SubjectSummary;
  readonly weekdays: readonly number[];
}

/**
 * Una inscripción dentro de la historia académica. Refleja
 * `components/enrollments.yaml#/schemas/EnrollmentHistoryItem`.
 *
 * - `academicYear`, `school`, `grade` y `classGroup` resumen el contexto
 *   canónico de la inscripción en el año reportado.
 * - `teachingAssignments` contiene TODAS las asignaciones docentes de esa
 *   inscripción, en el orden estable del backend (ascendente por
 *   `subject.name`, `teacher.lastNames`, `teacher.firstNames`,
 *   `assignmentId`). Una inscripción sin asignaciones contiene `[]`.
 */
export interface EnrollmentHistoryItemDto {
  readonly enrollmentId: number;
  readonly academicYear: AcademicYearSummary;
  readonly school: SchoolSummary;
  readonly grade: GradeSummary;
  readonly classGroup: ClassGroupSummary;
  readonly teachingAssignments: readonly HistoryTeachingAssignmentDto[];
}

/**
 * Response canónico de `getStudentHistory`
 * (`paths/enrollments.yaml#/api/students/{documentType}/{documentNumber}/history`).
 * Refleja `components/enrollments.yaml#/schemas/StudentHistoryResponse`.
 *
 * - Los campos del estudiante replican exactamente su identidad normalizada
 *   tal y como la emite el backend (`documentType`, `documentNumber`,
 *   `firstNames`, `lastNames`, `birthDate`).
 * - `enrollments` es la lista completa de inscripciones del estudiante,
 *   ordenada por el backend (descendente por `academicYear.startDate` y
 *   ascendente por `enrollmentId`); una identidad sin inscripciones
 *   devuelve `[]`.
 */
export interface StudentHistoryResponseDto {
  readonly studentId: number;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly birthDate: string;
  readonly enrollments: readonly EnrollmentHistoryItemDto[];
}
