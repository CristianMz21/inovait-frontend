/**
 * Tipos de la capa de vista del recorrido de creación de matrícula.
 *
 * - `EnrollmentFormVm` describe el estado mutable del formulario antes de
 *   ser enviado. Los identificadores académicos son `number | null` para
 *   representar el estado "sin selección" y permitir que la UI deshabilite
 *   niveles dependientes.
 * - `EnrollmentResultVm` aplana los datos del `CreateEnrollmentResponse`
 *   canónico para presentarlos sin anidación. La anidación queda
 *   reservada al mapper, que es el único punto que conoce el shape DTO.
 * - `EnrollmentFieldVm` modela las opciones que pueblan los `<select>`.
 */

/** Tipos de documento aceptados por la UI. Limitado a los valores del contrato. */
export type EnrollmentDocumentType = 'DNI' | 'PAS' | 'CE';

export interface EnrollmentFormVm {
  readonly documentType: string;
  readonly documentNumber: string;
  readonly firstNames: string;
  readonly lastNames: string;
  readonly birthDate: string;
  readonly schoolId: number | null;
  readonly academicYearId: number | null;
  readonly gradeId: number | null;
  readonly classGroupId: number | null;
}

export interface EnrollmentResultVm {
  readonly enrollmentId: number;
  readonly studentId: number;
  readonly studentReused: boolean;
  readonly fullName: string;
  readonly age: number;
  readonly schoolName: string;
  readonly academicYearName: string;
  readonly gradeName: string;
  readonly classGroupCode: string;
}

export interface EnrollmentFieldVm<TValue extends number | string> {
  readonly value: TValue;
  readonly label: string;
}