/* Copyright (c) 2026. All rights reserved. */
/**
 * Tipos de la capa de vista del recorrido de **Consulta de estudiantes**
 * (US2). Mantiene paridad con el contrato canónico pero aplana los datos
 * anidados en estructuras planas para la presentación tabular.
 *
 * - `StudentSearchFiltersVm` representa los filtros académicos del
 *   formulario. Los tres filtros principales son obligatorios y se
 *   modelan como `number | null` para distinguir "sin selección" de `0`.
 *   `asOfDate` se omite cuando no se desea calcular contra una fecha
 *   distinta a la del backend.
 * - `StudentSearchResultVm` aplana `EnrollmentListItem` a un shape apto
 *   para la tabla: nombre completo precompuesto, etiquetas canónicas
 *   de escuela/grado/año y código de grupo.
 * - `StudentSearchFieldVm` modela las opciones que pueblan los `<select>`.
 */

/** Filtros requeridos por el contrato para `listEnrollments`. */
export interface StudentSearchFiltersVm {
  readonly schoolId: number | null;
  readonly gradeId: number | null;
  readonly academicYearId: number | null;
  /** Fecha opcional (`YYYY-MM-DD`) para calcular edad; omitida = null. */
  readonly asOfDate: string | null;
}

/** Resultado aplanado para la tabla de la consulta. */
export interface StudentSearchResultVm {
  readonly enrollmentId: number;
  readonly studentId: number;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly fullName: string;
  readonly birthDate: string;
  readonly age: number;
  readonly schoolName: string;
  readonly schoolSector: string;
  readonly academicYearName: string;
  readonly gradeName: string;
  readonly classGroupCode: string;
}

export interface StudentSearchFieldVm<TValue extends number | string> {
  readonly value: TValue;
  readonly label: string;
}
