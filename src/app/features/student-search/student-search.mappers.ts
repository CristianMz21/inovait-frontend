import type { EnrollmentListItem } from "../../core/api/dtos/enrollment-list-item.dto";
import type {
  StudentSearchFiltersVm,
  StudentSearchResultVm,
} from "./student-search.vm";

/**
 * Determina si los filtros académicos están completos y la consulta puede
 * ejecutarse. El contrato exige los tres parámetros requeridos; `asOfDate`
 * es opcional y se omite cuando es `null` o vacío.
 */
export function studentSearchFiltersAreComplete(
  vm: StudentSearchFiltersVm,
): boolean {
  return (
    vm.schoolId !== null && vm.gradeId !== null && vm.academicYearId !== null
  );
}

/**
 * Convierte la `StudentSearchFiltersVm` a los parámetros canónicos del
 * endpoint `listEnrollments`. Devuelve `null` si falta algún filtro
 * académico obligatorio; el llamador debe bloquear el envío en ese caso.
 *
 * `asOfDate` se incluye sólo cuando la operadora lo ha definido
 * explícitamente: omitirlo deja al backend usar la fecha actual para el
 * cálculo de edad canónica.
 */
export function studentSearchFiltersToParams(vm: StudentSearchFiltersVm): {
  schoolId: number;
  gradeId: number;
  academicYearId: number;
  asOfDate?: string;
} | null {
  if (!studentSearchFiltersAreComplete(vm)) {
    return null;
  }
  const trimmedAsOf = vm.asOfDate?.trim();
  const params: {
    schoolId: number;
    gradeId: number;
    academicYearId: number;
    asOfDate?: string;
  } = {
    schoolId: vm.schoolId as number,
    gradeId: vm.gradeId as number,
    academicYearId: vm.academicYearId as number,
  };
  if (trimmedAsOf) {
    params.asOfDate = trimmedAsOf;
  }
  return params;
}

/**
 * Aplana `EnrollmentListItem` (DTO canónico) a `StudentSearchResultVm`
 * (VM de presentación). La composición de `fullName` colapsa espacios
 * múltiples, igual que en la creación de matrículas, para alinear la
 * canonicalización entre las dos pantallas.
 */
export function enrollmentListItemToResult(
  item: EnrollmentListItem,
): StudentSearchResultVm {
  return {
    enrollmentId: item.enrollmentId,
    studentId: item.studentId,
    documentType: item.documentType,
    documentNumber: item.documentNumber,
    fullName: `${item.firstNames} ${item.lastNames}`
      .replace(/\s+/g, " ")
      .trim(),
    birthDate: item.birthDate,
    age: item.age,
    schoolName: item.school.name,
    schoolSector: item.school.sector === "Public" ? "Público" : "Privado",
    academicYearName: item.academicYear.name,
    gradeName: item.grade.name,
    classGroupCode: item.classGroup.code,
  };
}
