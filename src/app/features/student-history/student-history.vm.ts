/**
 * Tipos de la capa de vista del recorrido **Historial académico-docente**
 * (FR-RPT-004 / WU11-STU). Mantiene paridad con el contrato canónico
 * (`components/enrollments.yaml#/schemas/StudentHistoryResponse`) pero
 * aplana los datos anidados en estructuras planas para la presentación.
 *
 * - `StudentHistoryFiltersVm` representa los filtros del formulario.
 *   `documentType` y `documentNumber` son obligatorios por contrato
 *   (rangos 1–20 / 1–32).
 * - `StudentHistoryVm` es la vista de presentación del recorrido; se
 *   compone de `identity` + `enrollments` y conserva el orden contractual.
 * - `EnrollmentHistoryItemVm` aplana `EnrollmentHistoryItemDto` con un
 *   `teachingAssignments: readonly TeachingAssignmentVm[]` que el template
 *   recorre sin reordenar.
 * - `TeachingAssignmentVm` aplana `HistoryTeachingAssignmentDto` con la
 *   lista de días canónicos y una etiqueta legible
 *   (`weekdaysLabel`) que se centra a partir de `WEEKDAY_LABELS`.
 * - `StudentIdentityVm` aplana los seis campos de identidad canónicos.
 *
 * El archivo también expone el mapa `WEEKDAY_LABELS` para mantener los
 * literales de la UI centralizados.
 */

export interface StudentHistoryFiltersVm {
  /** Tipo de documento (1–20 caracteres); obligatorio. */
  readonly documentType: string;
  /** Número de documento (1–32 caracteres); obligatorio. */
  readonly documentNumber: string;
}

export interface StudentIdentityVm {
  readonly studentId: number;
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly birthDate: string;
  /** Nombre completo precompuesto (normaliza espacios múltiples). */
  readonly fullName: string;
}

export interface TeachingAssignmentVm {
  readonly assignmentId: number;
  readonly teacherId: number;
  readonly teacherDocumentType: string;
  readonly teacherDocumentNumber: string;
  readonly teacherFullName: string;
  readonly subjectId: number;
  readonly subjectCode: string;
  readonly subjectName: string;
  readonly weekdays: readonly number[];
  /** Etiqueta legible de los días (ej.: "Lunes, Miércoles, Viernes"). */
  readonly weekdaysLabel: string;
}

export interface EnrollmentHistoryItemVm {
  readonly enrollmentId: number;
  readonly academicYearId: number;
  readonly academicYearName: string;
  readonly academicYearStartDate: string;
  readonly academicYearEndDate: string;
  readonly academicYearIsCurrent: boolean;
  readonly schoolId: number;
  readonly schoolName: string;
  readonly schoolSector: "Public" | "Private";
  readonly schoolSectorLabel: string;
  readonly gradeId: number;
  readonly gradeName: string;
  readonly classGroupId: number;
  readonly classGroupCode: string;
  readonly teachingAssignments: readonly TeachingAssignmentVm[];
}

/**
 * Vista de presentación del recorrido `student-history`. Combina la
 * identidad del estudiante con sus inscripciones, preservando el orden
 * estable que el backend emite.
 */
export interface StudentHistoryVm {
  readonly identity: StudentIdentityVm;
  readonly enrollments: readonly EnrollmentHistoryItemVm[];
}

/** Etiquetas legibles por día ISO (1 = lunes ... 7 = domingo). */
export const WEEKDAY_LABELS: Readonly<Record<number, string>> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

/** Etiqueta del sector (`Public` → "Público", `Private` → "Privado"). */
export const SCHOOL_SECTOR_LABELS: Readonly<
  Record<"Public" | "Private", string>
> = {
  Public: "Público",
  Private: "Privado",
};
