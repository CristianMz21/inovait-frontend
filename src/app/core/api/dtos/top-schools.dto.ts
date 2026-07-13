/* Copyright (c) 2026. All rights reserved. */
/**
 * Entrada individual del reporte `getTopSchoolsByEnrollment`. Refleja la
 * definición de `components/reports.yaml#/schemas/TopSchoolResponse` del
 * contrato canónico:
 *
 * - `school` anida un `SchoolSummary` (`{ id, name, sector }`) declarado
 *   en `components/catalogs.yaml#/schemas/SchoolSummary`.
 * - `academicYearId` es el año académico sobre el que se cuentan las
 *   `Enrollment` (a través de `ClassGroup`).
 * - `enrollmentCount` reporta el conteo total de inscripciones de la
 *   escuela en el año. El contrato declara `minimum: 1` — un año sin
 *   inscripciones NO devuelve entradas con `count=0`, sino `[]`.
 *
 * El backend garantiza que la lista devuelta (no el DTO individual)
 * contiene todos los empates en `enrollmentCount` máximo, ordenada de
 * forma estable por `school.name` ascendente y luego `school.id`. La UI
 * NO reordena ni empata/desempata — se preserva el shape canónico.
 */
export interface TopSchoolResponseDto {
  readonly school: import("./school-summary.dto").SchoolSummary;
  readonly academicYearId: number;
  readonly enrollmentCount: number;
}
