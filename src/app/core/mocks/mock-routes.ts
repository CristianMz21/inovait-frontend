import type { AgeDistributionResponseDto } from "../api/dtos/age-distribution.dto";
import type { CreateEnrollmentRequest } from "../api/dtos/create-enrollment-request.dto";
import type { CreateEnrollmentResponse } from "../api/dtos/create-enrollment-response.dto";
import type { EnrollmentListItem } from "../api/dtos/enrollment-list-item.dto";
import type { StudentHistoryResponseDto } from "../api/dtos/student-history-item.dto";
import type { TopSchoolResponseDto } from "../api/dtos/top-schools.dto";
import type { TeacherCountsBySectorResponseDto } from "../api/dtos/sector-counts.dto";
import type { TeacherContractResponse } from "../api/dtos/teacher-contract-response.dto";
import {
  ageDistributionFixture,
  emptyAgeDistributionFixture,
} from "../../../testing/fixtures/age-distribution.fixture";
import { classGroupsFixture } from "../../../testing/fixtures/class-groups.fixture";
import { createEnrollmentResponseFixture } from "../../../testing/fixtures/enrollment-create-response.fixture";
import { enrollmentListResponseFixture } from "../../../testing/fixtures/enrollments-list.fixture";
import { schoolsFixture } from "../../../testing/fixtures/schools.fixture";
import { academicYearsFixture } from "../../../testing/fixtures/academic-years.fixture";
import { gradesFixture } from "../../../testing/fixtures/grades.fixture";
import { teachersFixture } from "../../../testing/fixtures/teachers.fixture";
import { subjectsFixture } from "../../../testing/fixtures/subjects.fixture";
import {
  studentHistoryFixture,
  studentHistorySecondYearFixture,
  studentHistoryNoAssignmentsFixture,
} from "../../../testing/fixtures/student-history.fixture";
import {
  teacherContractsCreatedFixture,
  teacherContractsListedFixture,
} from "../../../testing/fixtures/teacher-contracts.fixture";
import {
  teacherCountsBySectorFixture,
  emptyTeacherCountsBySectorFixture,
} from "../../../testing/fixtures/sector-counts.fixture";
import {
  topSchoolsFixture,
  emptyTopSchoolsFixture,
} from "../../../testing/fixtures/top-schools.fixture";
import { mockOk, mockProblem } from "./mock-response";
import type { MockRoute } from "./mock-types";
import { calculateCompletedYears, isValidDateOnly } from "./date-only";
import {
  validateEnrollmentBody,
  validateTeacherContractBody,
} from "./mock-request-validation";
import {
  currentLocalDateOnly,
  evaluateTeacherContract,
} from "./teacher-contract-date";

/**
 * Filter helpers: take a list and apply simple predicate-based filters.
 *
 * The mock backend intentionally supports only the filter combinations
 * that the real backend documents. Anything more elaborate would diverge
 * from production behavior.
 */
const filterBySchool = <T extends { schoolId: number }>(
  list: readonly T[],
  schoolId: string | undefined,
): readonly T[] =>
  schoolId === undefined
    ? list
    : list.filter((x) => x.schoolId === Number(schoolId));

const filterByGrade = <T extends { gradeId: number }>(
  list: readonly T[],
  gradeId: string | undefined,
): readonly T[] =>
  gradeId === undefined
    ? list
    : list.filter((x) => x.gradeId === Number(gradeId));

const filterByAcademicYear = <T extends { academicYearId: number }>(
  list: readonly T[],
  academicYearId: string | undefined,
): readonly T[] =>
  academicYearId === undefined
    ? list
    : list.filter((x) => x.academicYearId === Number(academicYearId));

const isPositiveInteger = (value: unknown): boolean =>
  typeof value === "number"
    ? Number.isInteger(value) && value > 0
    : typeof value === "string" && /^[1-9]\d*$/.test(value);

const optionalIdIsValid = (value: string | undefined): boolean =>
  value === undefined || isPositiveInteger(value);

/**
 * Mock route table for the Inovait API.
 *
 * Routes are evaluated in declaration order; the first match wins. Routes
 * with path parameters (`{id}`, `{documentType}`, etc.) are listed first
 * when they share a prefix with a parameterless route, so the matcher
 * resolves the more specific pattern.
 *
 * To add a new endpoint:
 *   1. Append a `MockRoute<TResponse>` entry below.
 *   2. Type the handler parameter so the response matches the DTO the
 *      real backend returns (the type system will fail the build if you
 *      forget).
 *   3. Optionally add a `description` for nicer console logs.
 */
export const MOCK_ROUTES: readonly MockRoute[] = [
  // --- Catalog endpoints -------------------------------------------------

  {
    method: "GET",
    pattern: "/api/schools",
    description: "List schools",
    handler: () => mockOk(schoolsFixture),
  },
  {
    method: "GET",
    pattern: "/api/grades",
    description: "List grades",
    handler: () => mockOk(gradesFixture),
  },
  {
    method: "GET",
    pattern: "/api/academic-years",
    description: "List academic years",
    handler: () => mockOk(academicYearsFixture),
  },
  {
    method: "GET",
    pattern: "/api/teachers",
    description: "List teachers",
    handler: () => mockOk(teachersFixture),
  },
  {
    method: "GET",
    pattern: "/api/subjects",
    description: "List subjects",
    handler: () => mockOk(subjectsFixture),
  },
  {
    method: "GET",
    pattern: "/api/class-groups",
    description: "List class groups (filtered)",
    handler: ({ params }) => {
      if (
        !optionalIdIsValid(params["schoolId"]) ||
        !optionalIdIsValid(params["gradeId"]) ||
        !optionalIdIsValid(params["academicYearId"])
      ) {
        return mockProblem(400, "invalid_request", "Identificador inválido");
      }
      const filtered = filterByAcademicYear(
        filterByGrade(
          filterBySchool(classGroupsFixture, params["schoolId"]),
          params["gradeId"],
        ),
        params["academicYearId"],
      );
      return mockOk(filtered);
    },
  },
  {
    method: "GET",
    pattern: "/api/schools/{id}/teachers",
    description: "List teachers working at a school",
    handler: ({ pathParams, params }) => {
      // Fixture data: every teacher is implicitly assigned to school 1 in
      // the canonical fixtures, so we filter by `schoolId === 1` when the
      // requested id is 1, otherwise return an empty list.
      const schoolId = Number(pathParams["id"]);
      if (!isPositiveInteger(schoolId)) {
        return mockProblem(400, "invalid_request", "schoolId inválido");
      }
      if (
        params["asOfDate"] !== undefined &&
        !isValidDateOnly(params["asOfDate"])
      ) {
        return mockProblem(400, "invalid_request", "asOfDate inválido");
      }
      const teachersAtSchool =
        schoolId === 1
          ? teachersFixture.map((t, i) => ({
              teacher: t,
              contractId: 900 + i,
              persistedStatus: "Confirmed" as const,
              effectiveStatus: "Effective" as const,
              evaluatedAt: "2026-07-10",
              startDate: "2026-03-01",
              endDate: null,
            }))
          : [];
      return mockOk(teachersAtSchool);
    },
  },

  // --- Enrollment endpoints ---------------------------------------------

  {
    method: "GET",
    pattern: "/api/enrollments",
    description: "List enrollments (filtered)",
    handler: ({ params }) => {
      const schoolId = params["schoolId"];
      const gradeId = params["gradeId"];
      const academicYearId = params["academicYearId"];
      const asOfDate = params["asOfDate"];
      if (
        !isPositiveInteger(schoolId) ||
        !isPositiveInteger(gradeId) ||
        !isPositiveInteger(academicYearId)
      ) {
        return mockProblem(400, "invalid_request", "Filtros inválidos");
      }
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(400, "invalid_request", "asOfDate inválido");
      }
      const filtered = enrollmentListResponseFixture
        .filter((row: EnrollmentListItem) => {
          if (schoolId && row.school.id !== Number(schoolId)) return false;
          if (gradeId && row.grade.id !== Number(gradeId)) return false;
          if (academicYearId && row.academicYear.id !== Number(academicYearId))
            return false;
          return true;
        })
        .map((row) =>
          asOfDate
            ? { ...row, age: calculateCompletedYears(row.birthDate, asOfDate) }
            : row,
        );
      return mockOk(filtered);
    },
  },
  {
    method: "POST",
    pattern: "/api/enrollments",
    description: "Create enrollment",
    handler: ({ body }) => {
      const validationErrors = validateEnrollmentBody(body);
      if (validationErrors !== null) {
        return mockProblem(400, "invalid_request", "Solicitud inválida", {
          errors: validationErrors,
        });
      }
      const req = body as CreateEnrollmentRequest;
      if (req.student.birthDate > currentLocalDateOnly()) {
        return mockProblem(
          422,
          "business_rule_violation",
          "La fecha de nacimiento no puede ser futura",
          { errors: { "student.birthDate": ["No puede ser futura."] } },
        );
      }
      // Echo back the request id as a stable response. The fixture is the
      // canonical happy-path response from the OpenAPI example.
      return mockOk<CreateEnrollmentResponse>(createEnrollmentResponseFixture, {
        status: 201,
      });
    },
  },

  // --- Student history ---------------------------------------------------

  {
    method: "GET",
    pattern: "/api/students/{documentType}/{documentNumber}/history",
    description: "Student history (lookup by document)",
    handler: ({ pathParams, params }) => {
      const documentNumber = pathParams["documentNumber"];
      const asOfDate = params["asOfDate"];
      // The current backend OpenAPI omits this query parameter, but the
      // existing frontend capability explicitly propagates it end to end.
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(400, "invalid_request", "asOfDate inválido");
      }
      if (documentNumber === "99.001.101") {
        const fixture =
          asOfDate === "2026-07-10"
            ? studentHistorySecondYearFixture
            : studentHistoryFixture;
        return mockOk<StudentHistoryResponseDto>(fixture);
      }
      if (documentNumber === "99.001.404") {
        return mockProblem(
          404,
          "student_not_found",
          "Estudiante no encontrado",
        );
      }
      return mockOk<StudentHistoryResponseDto>(
        studentHistoryNoAssignmentsFixture,
      );
    },
  },

  // --- Teacher contracts ------------------------------------------------

  {
    method: "GET",
    pattern: "/api/teachers/{teacherId}/contracts",
    description: "List all teacher contracts evaluated at asOfDate",
    handler: ({ pathParams, params }) => {
      const teacherId = Number(pathParams["teacherId"]);
      const asOfDate = params["asOfDate"];
      if (!isPositiveInteger(teacherId)) {
        return mockProblem(400, "invalid_request", "teacherId inválido");
      }
      if (teacherId === 9999) {
        return mockProblem(404, "resource_not_found", "Docente no encontrado");
      }
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(400, "invalid_request", "asOfDate inválido");
      }
      const evaluatedAt = asOfDate ?? currentLocalDateOnly();
      return mockOk<readonly TeacherContractResponse[]>(
        teacherContractsListedFixture.map((contract) =>
          evaluateTeacherContract(contract, evaluatedAt),
        ),
      );
    },
  },
  {
    method: "POST",
    pattern: "/api/teachers/{teacherId}/contracts",
    description: "Create teacher contracts (atomic)",
    handler: ({ body, pathParams }) => {
      if (!isPositiveInteger(Number(pathParams["teacherId"]))) {
        return mockProblem(400, "invalid_request", "teacherId inválido");
      }
      const validationErrors = validateTeacherContractBody(body);
      if (validationErrors !== null) {
        return mockProblem(400, "invalid_request", "Solicitud inválida", {
          errors: validationErrors,
        });
      }
      const req = body as {
        readonly schoolIds: readonly number[];
        readonly startDate: string;
        readonly endDate?: string | null;
      };
      if (new Set(req.schoolIds).size !== req.schoolIds.length) {
        return mockProblem(
          409,
          "teacher_contract_conflict",
          "Escuela repetida",
        );
      }
      if (
        req.endDate !== undefined &&
        req.endDate !== null &&
        req.endDate < req.startDate
      ) {
        return mockProblem(422, "business_rule_violation", "Período inválido", {
          errors: { endDate: ["Debe ser igual o posterior a startDate."] },
        });
      }
      if (req.schoolIds.includes(1)) {
        return mockProblem(
          409,
          "teacher_contract_conflict",
          "Conflicto con contrato vigente",
        );
      }
      return mockOk<readonly TeacherContractResponse[]>(
        teacherContractsCreatedFixture,
        { status: 201 },
      );
    },
  },

  // --- Reports -----------------------------------------------------------

  {
    method: "GET",
    pattern: "/api/reports/age-distribution",
    description: "Age distribution report",
    handler: ({ params }) => {
      if (
        !isPositiveInteger(params["academicYearId"]) ||
        !optionalIdIsValid(params["schoolId"]) ||
        !optionalIdIsValid(params["gradeId"])
      ) {
        return mockProblem(
          400,
          "invalid_request",
          "academicYearId es requerido",
          {
            errors: { academicYearId: ["Requerido"] },
          },
        );
      }
      const includedEnrollments = enrollmentListResponseFixture.filter(
        (row) =>
          row.academicYear.id === Number(params["academicYearId"]) &&
          (params["schoolId"] === undefined ||
            row.school.id === Number(params["schoolId"])) &&
          (params["gradeId"] === undefined ||
            row.grade.id === Number(params["gradeId"])),
      );
      const asOfDate = params["asOfDate"];
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(400, "invalid_request", "asOfDate inválido");
      }
      if (
        asOfDate !== undefined &&
        includedEnrollments.some((row) => asOfDate < row.birthDate)
      ) {
        return mockProblem(
          422,
          "as_of_date_invalid",
          "La fecha de referencia no es válida",
        );
      }
      if (params["academicYearId"] === "1") {
        return mockOk<AgeDistributionResponseDto>({
          ...emptyAgeDistributionFixture,
          academicYearId: 1,
          ...(asOfDate ? { asOfDate } : {}),
        });
      }
      return mockOk<AgeDistributionResponseDto>({
        ...ageDistributionFixture,
        ...(asOfDate ? { asOfDate } : {}),
      });
    },
  },
  {
    method: "GET",
    pattern: "/api/reports/top-schools",
    description: "Top schools report",
    handler: ({ params }) => {
      if (!isPositiveInteger(params["academicYearId"])) {
        return mockProblem(
          400,
          "invalid_request",
          "academicYearId es requerido",
        );
      }
      if (params["academicYearId"] === "1") {
        return mockOk<readonly TopSchoolResponseDto[]>(emptyTopSchoolsFixture);
      }
      return mockOk<readonly TopSchoolResponseDto[]>(topSchoolsFixture);
    },
  },
  {
    method: "GET",
    pattern: "/api/reports/teacher-counts-by-sector",
    description: "Teacher counts by sector report",
    handler: ({ params }) => {
      const periodStart = params["periodStart"];
      const periodEnd = params["periodEnd"];
      if (
        (periodStart !== undefined && !isValidDateOnly(periodStart)) ||
        (periodEnd !== undefined && !isValidDateOnly(periodEnd))
      ) {
        return mockProblem(400, "invalid_request", "Período mal formado");
      }
      if ((periodStart && !periodEnd) || (!periodStart && periodEnd)) {
        return mockProblem(422, "period_invalid", "El período no es válido");
      }
      if (periodStart && periodEnd && periodEnd < periodStart) {
        return mockProblem(422, "period_invalid", "El período no es válido", {
          errors: { periodEnd: ["Debe ser igual o posterior a periodStart."] },
        });
      }
      return mockOk<TeacherCountsBySectorResponseDto>(
        periodStart
          ? {
              ...teacherCountsBySectorFixture,
              periodStart,
              periodEnd: periodEnd ?? periodStart,
            }
          : emptyTeacherCountsBySectorFixture,
      );
    },
  },
];
