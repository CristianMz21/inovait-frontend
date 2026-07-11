import type { EnrollmentListItem } from "../../app/core/api/dtos/enrollment-list-item.dto";

/**
 * Fixture de respuesta canónica de `GET /api/enrollments` cuando el
 * backend devuelve 200 con resultados. Refleja el `example` declarado en
 * `paths/enrollments.yaml` para `listEnrollments`.
 */
export const enrollmentListResponseFixture: readonly EnrollmentListItem[] = [
  {
    enrollmentId: 100,
    studentId: 50,
    documentType: "DNI",
    documentNumber: "99.001.101",
    firstNames: "Ana María",
    lastNames: "Solís",
    birthDate: "2018-07-10",
    age: 8,
    school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
    academicYear: {
      id: 2,
      name: "2026",
      startDate: "2026-03-02",
      endDate: "2026-12-18",
      isCurrent: true,
    },
    grade: { id: 1, name: "Grade 1", sortOrder: 1 },
    classGroup: {
      id: 10,
      code: "A",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    },
  },
  {
    enrollmentId: 101,
    studentId: 51,
    documentType: "DNI",
    documentNumber: "99.001.102",
    firstNames: "Luis",
    lastNames: "Pérez",
    birthDate: "2017-04-22",
    age: 9,
    school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
    academicYear: {
      id: 2,
      name: "2026",
      startDate: "2026-03-02",
      endDate: "2026-12-18",
      isCurrent: true,
    },
    grade: { id: 1, name: "Grade 1", sortOrder: 1 },
    classGroup: {
      id: 10,
      code: "A",
      schoolId: 1,
      academicYearId: 2,
      gradeId: 1,
    },
  },
];

/**
 * Fixture del payload canónico `200 []` — combinación válida sin
 * coincidencias. Refleja el escenario "Sin coincidencias con contexto
 * existente" de `FR-SRCH-001`.
 */
export const emptyEnrollmentListResponseFixture: readonly EnrollmentListItem[] =
  [];
