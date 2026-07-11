import type { ApiProblem } from '../../app/core/api/dtos/api-problem.dto';
import type {
  EnrollmentHistoryItemDto,
  HistoryTeachingAssignmentDto,
  StudentHistoryResponseDto,
} from '../../app/core/api/dtos/student-history-item.dto';

/**
 * Asignación docente canónica para `studentHistoryFixture`. Refleja el
 * example declarado en
 * `paths/enrollments.yaml#/api/students/{documentType}/{documentNumber}/history.get.responses.200.example.teachingAssignments[0]`.
 */
const teachingAssignmentFixture: HistoryTeachingAssignmentDto = {
  assignmentId: 31,
  teacher: {
    id: 5,
    documentType: 'DNI',
    documentNumber: '88001001',
    firstNames: 'Lucía',
    lastNames: 'Benítez',
  },
  subject: { id: 3, code: 'MATH', name: 'Matemática' },
  weekdays: [1, 3, 5],
};

/**
 * Inscripción canónica con su `teachingAssignments[]`. Refleja el example
 * del YAML.
 */
const enrollmentWithAssignmentFixture: EnrollmentHistoryItemDto = {
  enrollmentId: 100,
  academicYear: {
    id: 2,
    name: '2026',
    startDate: '2026-03-02',
    endDate: '2026-12-18',
    isCurrent: true,
  },
  school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
  grade: { id: 1, name: 'Grade 1', sortOrder: 1 },
  classGroup: {
    id: 10,
    code: 'A',
    schoolId: 1,
    academicYearId: 2,
    gradeId: 1,
  },
  teachingAssignments: [teachingAssignmentFixture],
};

/**
 * Fixture "happy / una inscripción + asignación" de
 * `StudentHistoryResponseDto` cuando el backend responde `200` con el
 * `example` declarado en
 * `paths/enrollments.yaml#/api/students/{documentType}/{documentNumber}/history.get.responses.200.example`.
 *
 * Mantiene el orden estable del backend: la inscripción aparece con su
 * única asignación tal cual la emite el contrato (un único bloque, orden
 * ascendente por `subject.name`/`teacher.lastNames`/`assignmentId`).
 */
export const studentHistoryFixture: StudentHistoryResponseDto = {
  studentId: 50,
  documentType: 'DNI',
  documentNumber: '99.001.101',
  firstNames: 'Ana María',
  lastNames: 'Solís',
  birthDate: '2018-07-10',
  enrollments: [enrollmentWithAssignmentFixture],
};

/**
 * Fixture "happy / 2 años + asignaciones múltiples". El año actual aparece
 * primero (orden descendente por `academicYear.startDate`); el año previo
 * expone múltiples docentes y conserva el orden estable del backend.
 */
export const studentHistorySecondYearFixture: StudentHistoryResponseDto = {
  studentId: 50,
  documentType: 'DNI',
  documentNumber: '99.001.101',
  firstNames: 'Ana María',
  lastNames: 'Solís',
  birthDate: '2018-07-10',
  enrollments: [
    {
      enrollmentId: 100,
      academicYear: {
        id: 2,
        name: '2026',
        startDate: '2026-03-02',
        endDate: '2026-12-18',
        isCurrent: true,
      },
      school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
      grade: { id: 2, name: 'Grade 2', sortOrder: 2 },
      classGroup: {
        id: 20,
        code: 'B',
        schoolId: 1,
        academicYearId: 2,
        gradeId: 2,
      },
      teachingAssignments: [
        teachingAssignmentFixture,
        {
          assignmentId: 32,
          teacher: {
            id: 7,
            documentType: 'DNI',
            documentNumber: '88001002',
            firstNames: 'Pedro',
            lastNames: 'Gómez',
          },
          subject: { id: 4, code: 'LANG', name: 'Lengua' },
          weekdays: [2, 4],
        },
      ],
    },
    {
      enrollmentId: 90,
      academicYear: {
        id: 1,
        name: '2025',
        startDate: '2025-03-03',
        endDate: '2025-12-19',
        isCurrent: false,
      },
      school: { id: 1, name: 'Escuela Río Claro', sector: 'Public' },
      grade: { id: 1, name: 'Grade 1', sortOrder: 1 },
      classGroup: {
        id: 10,
        code: 'A',
        schoolId: 1,
        academicYearId: 1,
        gradeId: 1,
      },
      teachingAssignments: [
        {
          assignmentId: 21,
          teacher: {
            id: 9,
            documentType: 'DNI',
            documentNumber: '88001003',
            firstNames: 'Marta',
            lastNames: 'Acosta',
          },
          subject: { id: 3, code: 'MATH', name: 'Matemática' },
          weekdays: [1, 3, 5],
        },
      ],
    },
  ],
};

/**
 * Fixture "happy / inscripción sin asignaciones". El contrato declara
 * explícitamente que una inscripción sin asignaciones contiene un array
 * vacío (`EnrollmentHistoryItem.teachingAssignments: []`).
 */
export const studentHistoryNoAssignmentsFixture: StudentHistoryResponseDto = {
  studentId: 80,
  documentType: 'DNI',
  documentNumber: '88.200.300',
  firstNames: 'Luis',
  lastNames: 'Pérez',
  birthDate: '2017-05-05',
  enrollments: [
    {
      enrollmentId: 300,
      academicYear: {
        id: 1,
        name: '2025',
        startDate: '2025-03-03',
        endDate: '2025-12-19',
        isCurrent: false,
      },
      school: { id: 2, name: 'Instituto Horizonte', sector: 'Private' },
      grade: { id: 3, name: 'Grade 3', sortOrder: 3 },
      classGroup: {
        id: 30,
        code: 'A',
        schoolId: 2,
        academicYearId: 1,
        gradeId: 3,
      },
      teachingAssignments: [],
    },
  ],
};

/**
 * Fixture "empty / identidad sin inscripciones" — una identidad normalizada
 * válida pero sin `Enrollment`. El contrato canónico garantiza `enrollments: []`;
 * la UI debe mapear esta respuesta al estado `empty` de
 * `RemoteState<StudentHistoryVm>` (NO a `error`).
 */
export const emptyStudentHistoryFixture: StudentHistoryResponseDto = {
  studentId: 80,
  documentType: 'DNI',
  documentNumber: '88.200.300',
  firstNames: 'Luis',
  lastNames: 'Pérez',
  birthDate: '2017-05-05',
  enrollments: [],
};

/**
 * Fixture `404 ProblemDetails` para el caso canónico `student_not_found`:
 * la identidad normalizada no corresponde a un estudiante. Refleja el
 * `example` declarado en `paths/enrollments.yaml:158-166`. La UI debe
 * exponer el problema con `role="alert"` y conservar los filtros.
 */
export const apiProblemStudentNotFoundFixture: ApiProblem = {
  type: 'https://inovait.local/problems/student-not-found',
  title: 'No se encontró el estudiante',
  status: 404,
  code: 'student_not_found',
};

/**
 * Fixture `422 ProblemDetails` para el caso canónico de bad_request en
 * `getStudentHistory` (longitudes de path inválidas o tipo de documento
 * desconocido). Refleja el `responses/400` declarado en
 * `paths/enrollments.yaml:157`.
 */
export const apiProblemHistoryBadRequestFixture: ApiProblem = {
  type: 'https://inovait.local/problems/invalid-request',
  title: 'La solicitud no es válida',
  status: 400,
  code: 'invalid_request',
  detail: 'documentType debe tener entre 1 y 20 caracteres.',
  instance: '/api/enrollments/students//history',
  errors: {
    documentType: ['El campo es obligatorio.'],
  },
};
