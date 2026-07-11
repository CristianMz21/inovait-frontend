import type { CreateEnrollmentResponse } from '../../app/core/api/dtos/create-enrollment-response.dto';

/**
 * Fixture del payload canónico de `POST /api/enrollments` cuando el
 * backend responde 201 con un estudiante nuevo (no reutilizado). Refleja
 * la `example` declarada en `paths/enrollments.yaml`.
 */
export const createEnrollmentResponseFixture: CreateEnrollmentResponse = {
  enrollmentId: 100,
  studentId: 50,
  studentReused: false,
  documentType: 'DNI',
  documentNumber: '99.001.101',
  firstNames: 'Ana María',
  lastNames: 'Solís',
  birthDate: '2018-07-10',
  age: 8,
  school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
  academicYear: {
    id: 2,
    name: '2026',
    startDate: '2026-03-02',
    endDate: '2026-12-18',
    isCurrent: true,
  },
  grade: { id: 1, name: 'Grade 1', sortOrder: 1 },
  classGroup: { id: 10, code: 'A', schoolId: 1, academicYearId: 2, gradeId: 1 },
};

/**
 * Variante del fixture anterior cuando el backend reutiliza la
 * identidad del estudiante y solo crea el `Enrollment`.
 */
export const createEnrollmentReusedResponseFixture: CreateEnrollmentResponse = {
  ...createEnrollmentResponseFixture,
  enrollmentId: 101,
  studentId: 50,
  studentReused: true,
};