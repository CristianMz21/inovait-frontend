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
import {
  enrollmentListResponseFixture,
  emptyEnrollmentListResponseFixture,
} from "../../../testing/fixtures/enrollments-list.fixture";
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
  emptyTeacherContractsListedFixture,
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
    handler: ({ pathParams }) => {
      // Fixture data: every teacher is implicitly assigned to school 1 in
      // the canonical fixtures, so we filter by `schoolId === 1` when the
      // requested id is 1, otherwise return an empty list.
      const schoolId = Number(pathParams["id"]);
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
      const filtered = enrollmentListResponseFixture.filter(
        (row: EnrollmentListItem) => {
          if (schoolId && row.school.id !== Number(schoolId)) return false;
          if (gradeId && row.grade.id !== Number(gradeId)) return false;
          if (academicYearId && row.academicYear.id !== Number(academicYearId))
            return false;
          if (asOfDate && row.birthDate !== asOfDate) return false;
          return true;
        },
      );
      return mockOk(filtered);
    },
  },
  {
    method: "POST",
    pattern: "/api/enrollments",
    description: "Create enrollment",
    handler: ({ body }) => {
      const req = body as CreateEnrollmentRequest | null;
      if (!req?.student?.documentNumber) {
        return mockProblem(400, "invalid_request", "Solicitud inválida", {
          errors: { document: ["documentNumber requerido"] },
        });
      }
      // Echo back the request id as a stable response. The fixture is the
      // canonical happy-path response from the OpenAPI example.
      return mockOk<CreateEnrollmentResponse>(createEnrollmentResponseFixture);
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
    description: "List teacher contracts (filtered by asOfDate)",
    handler: ({ pathParams, params }) => {
      const teacherId = Number(pathParams["teacherId"]);
      const asOfDate = params["asOfDate"];
      if (teacherId === 9999) {
        return mockProblem(404, "resource_not_found", "Docente no encontrado");
      }
      if (asOfDate && asOfDate < "2026-07-01") {
        return mockOk<readonly TeacherContractResponse[]>(
          emptyTeacherContractsListedFixture,
        );
      }
      return mockOk<readonly TeacherContractResponse[]>(
        teacherContractsListedFixture,
      );
    },
  },
  {
    method: "POST",
    pattern: "/api/teachers/{teacherId}/contracts",
    description: "Create teacher contracts (atomic)",
    handler: ({ body }) => {
      const req = body as { schoolIds?: readonly number[] } | null;
      if (!req?.schoolIds || req.schoolIds.length === 0) {
        return mockProblem(
          422,
          "business_rule_violation",
          "Debe seleccionar al menos una escuela",
        );
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
      );
    },
  },

  // --- Reports -----------------------------------------------------------

  {
    method: "GET",
    pattern: "/api/reports/age-distribution",
    description: "Age distribution report",
    handler: ({ params }) => {
      if (!params["academicYearId"]) {
        return mockProblem(
          400,
          "invalid_request",
          "academicYearId es requerido",
          {
            errors: { academicYearId: ["Requerido"] },
          },
        );
      }
      if (params["academicYearId"] === "0") {
        return mockOk<AgeDistributionResponseDto>(emptyAgeDistributionFixture);
      }
      return mockOk<AgeDistributionResponseDto>(ageDistributionFixture);
    },
  },
  {
    method: "GET",
    pattern: "/api/reports/top-schools",
    description: "Top schools report",
    handler: ({ params }) => {
      if (!params["academicYearId"]) {
        return mockProblem(
          400,
          "invalid_request",
          "academicYearId es requerido",
        );
      }
      if (params["academicYearId"] === "0") {
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
          ? teacherCountsBySectorFixture
          : emptyTeacherCountsBySectorFixture,
      );
    },
  },
];

// Re-export so test files can assert against the canonical empty list
// without reaching into the testing folder.
export { emptyEnrollmentListResponseFixture };

/**
 * Public exports of the path-matching helpers. The interceptor uses them
 * internally, and the route table's unit tests use them to assert against
 * the matcher behavior in isolation. Not part of the public API surface;
 * marked with an underscore prefix by convention.
 *
 * @internal
 */
export const _matchPath = (pattern: string, path: string): boolean => {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);
  if (patternSegments.length !== pathSegments.length) return false;
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    const v = pathSegments[i];
    if (p === undefined || v === undefined) return false;
    if (p.startsWith("{") && p.endsWith("}")) continue;
    if (p !== v) return false;
  }
  return true;
};

/** @internal */
export const _extractPathParams = (
  pattern: string,
  path: string,
): Readonly<Record<string, string>> => {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = path.split("/").filter(Boolean);
  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const p = patternSegments[i];
    if (p === undefined) continue;
    if (p.startsWith("{") && p.endsWith("}")) {
      const key = p.slice(1, -1);
      const v = pathSegments[i];
      if (v !== undefined) {
        params[key] = decodeURIComponent(v);
      }
    }
  }
  return params;
};
