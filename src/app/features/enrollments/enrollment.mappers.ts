import type { CreateEnrollmentRequest } from '../../core/api/dtos/create-enrollment-request.dto';
import type { CreateEnrollmentResponse } from '../../core/api/dtos/create-enrollment-response.dto';
import type {
  EnrollmentFormVm,
  EnrollmentResultVm,
} from './enrollment-create.vm';

/**
 * Convierte la vista del formulario a la `CreateEnrollmentRequest`
 * canónica que exige el backend. Devuelve `null` cuando alguna
 * referencia académica falta; el llamador debe usar este resultado
 * para bloquear el submit local antes de invocar al backend.
 *
 * El mapper recorta espacios en los campos de texto para alinear la
 * canonicalización que el backend declara en su descripción; cualquier
 * validación semántica adicional (rango, formato) la lleva el
 * formulario a través de `Validators`.
 */
export function enrollmentFormToRequest(
  vm: EnrollmentFormVm,
): CreateEnrollmentRequest | null {
  if (
    vm.schoolId === null ||
    vm.academicYearId === null ||
    vm.gradeId === null ||
    vm.classGroupId === null
  ) {
    return null;
  }
  return {
    student: {
      documentType: vm.documentType.trim(),
      documentNumber: vm.documentNumber.trim(),
      firstNames: vm.firstNames.trim(),
      lastNames: vm.lastNames.trim(),
      birthDate: vm.birthDate,
    },
    schoolId: vm.schoolId,
    academicYearId: vm.academicYearId,
    gradeId: vm.gradeId,
    classGroupId: vm.classGroupId,
  };
}

/**
 * Aplana `CreateEnrollmentResponse` a un `EnrollmentResultVm` apto para
 * la capa de presentación. No recalcula nada: el backend ya entrega la
 * edad canónica y los nombres ya canónicos; la UI sólo los compone.
 */
export function enrollmentResponseToResult(
  dto: CreateEnrollmentResponse,
): EnrollmentResultVm {
  return {
    enrollmentId: dto.enrollmentId,
    studentId: dto.studentId,
    studentReused: dto.studentReused,
    fullName: `${dto.firstNames} ${dto.lastNames}`.replace(/\s+/g, ' ').trim(),
    age: dto.age,
    schoolName: dto.school.name,
    academicYearName: dto.academicYear.name,
    gradeName: dto.grade.name,
    classGroupCode: dto.classGroup.code,
  };
}