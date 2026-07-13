/* Copyright (c) 2026. All rights reserved. */
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
import {
  calculateCompletedYears,
  compareDateOnly,
  isValidDateOnly,
} from "./date-only";
import {
  validateEnrollmentBody,
  validateTeacherContractBody,
} from "./mock-request-validation";
import {
  currentLocalDateOnly,
  evaluateTeacherContract,
} from "./teacher-contract-date";

const BAD_REQUEST_STATUS = 400;
const CREATED_STATUS = 201;
const NOT_FOUND_STATUS = 404;
const CONFLICT_STATUS = 409;
const UNPROCESSABLE_CONTENT_STATUS = 422;
const TEACHER_NOT_FOUND_ID = 9999;
const CONTRACT_ID_BASE = 900;
const INVALID_AS_OF_DATE_TITLE = "asOfDate inválido";

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
): readonly T[] => {
  if (schoolId === undefined) {
    return list;
  }
  return list.filter(item => item.schoolId === Number(schoolId));
};

const filterByGrade = <T extends { gradeId: number }>(
  list: readonly T[],
  gradeId: string | undefined,
): readonly T[] => {
  if (gradeId === undefined) {
    return list;
  }
  return list.filter(item => item.gradeId === Number(gradeId));
};

const filterByAcademicYear = <T extends { academicYearId: number }>(
  list: readonly T[],
  academicYearId: string | undefined,
): readonly T[] => {
  if (academicYearId === undefined) {
    return list;
  }
  return list.filter(item => item.academicYearId === Number(academicYearId));
};

const isPositiveInteger = (value: unknown): boolean => {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }
  return typeof value === "string" && /^[1-9]\d*$/.test(value);
};

const optionalIdIsValid = (value: string | undefined): boolean =>
  value === undefined || isPositiveInteger(value);

const matchesOptionalId = (
  expected: string | undefined,
  actual: number,
): boolean => {
  if (expected === undefined) {
    return true;
  }
  return actual === Number(expected);
};

const validAgeDistributionFilters = (
  params: Readonly<Record<string, string>>,
): boolean =>
  isPositiveInteger(params["academicYearId"]) &&
  optionalIdIsValid(params["schoolId"]) &&
  optionalIdIsValid(params["gradeId"]);

const filterAgeDistributionEnrollments = (
  params: Readonly<Record<string, string>>,
): readonly EnrollmentListItem[] =>
  enrollmentListResponseFixture.filter(
    row =>
      row.academicYear.id === Number(params["academicYearId"]) &&
      matchesOptionalId(params["schoolId"], row.school.id) &&
      matchesOptionalId(params["gradeId"], row.grade.id),
  );

const withAsOfDate = (
  response: AgeDistributionResponseDto,
  asOfDate: string | undefined,
): AgeDistributionResponseDto => {
  if (asOfDate === undefined) {
    return response;
  }
  return { ...response, asOfDate };
};

const hasInvalidPeriodDate = (
  periodStart: string | undefined,
  periodEnd: string | undefined,
): boolean => {
  const startIsInvalid =
    periodStart !== undefined && !isValidDateOnly(periodStart);
  const endIsInvalid = periodEnd !== undefined && !isValidDateOnly(periodEnd);
  return startIsInvalid || endIsInvalid;
};

const hasIncompletePeriod = (
  periodStart: string | undefined,
  periodEnd: string | undefined,
): boolean => Boolean(periodStart) !== Boolean(periodEnd);

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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "Identificador inválido",
        );
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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "schoolId inválido",
        );
      }
      if (
        params["asOfDate"] !== undefined &&
        !isValidDateOnly(params["asOfDate"])
      ) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          INVALID_AS_OF_DATE_TITLE,
        );
      }
      if (schoolId !== 1) {
        return mockOk([]);
      }
      const teachersAtSchool = teachersFixture.map((teacher, index) => ({
        teacher,
        contractId: CONTRACT_ID_BASE + index,
        persistedStatus: "Confirmed" as const,
        effectiveStatus: "Effective" as const,
        evaluatedAt: "2026-07-10",
        startDate: "2026-03-01",
        endDate: null,
      }));
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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "Filtros inválidos",
        );
      }
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          INVALID_AS_OF_DATE_TITLE,
        );
      }
      const filtered = enrollmentListResponseFixture
        .filter((row: EnrollmentListItem) => {
          if (schoolId && row.school.id !== Number(schoolId)) {
            return false;
          }
          if (gradeId && row.grade.id !== Number(gradeId)) {
            return false;
          }
          if (
            academicYearId &&
            row.academicYear.id !== Number(academicYearId)
          ) {
            return false;
          }
          return true;
        })
        .map(row => {
          if (asOfDate === undefined) {
            return row;
          }
          return {
            ...row,
            age: calculateCompletedYears(row.birthDate, asOfDate),
          };
        });
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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "Solicitud inválida",
          { errors: validationErrors },
        );
      }
      const req = body as CreateEnrollmentRequest;
      if (compareDateOnly(req.student.birthDate, currentLocalDateOnly()) > 0) {
        return mockProblem(
          UNPROCESSABLE_CONTENT_STATUS,
          "business_rule_violation",
          "La fecha de nacimiento no puede ser futura",
          { errors: { "student.birthDate": ["No puede ser futura."] } },
        );
      }
      // Echo back the request id as a stable response. The fixture is the
      // canonical happy-path response from the OpenAPI example.
      return mockOk<CreateEnrollmentResponse>(createEnrollmentResponseFixture, {
        status: CREATED_STATUS,
      });
    },
  },

  // --- Student history ---------------------------------------------------

  {
    method: "GET",
    pattern: "/api/students/{documentType}/{documentNumber}/history",
    description: "Student history (lookup by document)",
    handler: ({ pathParams }) => {
      const documentNumber = pathParams["documentNumber"];
      if (documentNumber === "99.001.101") {
        return mockOk<StudentHistoryResponseDto>(studentHistoryFixture);
      }
      if (documentNumber === "99.001.404") {
        return mockProblem(
          NOT_FOUND_STATUS,
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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "teacherId inválido",
        );
      }
      if (teacherId === TEACHER_NOT_FOUND_ID) {
        return mockProblem(
          NOT_FOUND_STATUS,
          "resource_not_found",
          "Docente no encontrado",
        );
      }
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          INVALID_AS_OF_DATE_TITLE,
        );
      }
      const evaluatedAt = asOfDate ?? currentLocalDateOnly();
      return mockOk<readonly TeacherContractResponse[]>(
        teacherContractsListedFixture.map(contract =>
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
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "teacherId inválido",
        );
      }
      const validationErrors = validateTeacherContractBody(body);
      if (validationErrors !== null) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "Solicitud inválida",
          { errors: validationErrors },
        );
      }
      const req = body as {
        readonly schoolIds: readonly number[];
        readonly startDate: string;
        readonly endDate?: string | null;
      };
      if (new Set(req.schoolIds).size !== req.schoolIds.length) {
        return mockProblem(
          CONFLICT_STATUS,
          "teacher_contract_conflict",
          "Escuela repetida",
        );
      }
      if (
        req.endDate !== undefined &&
        req.endDate !== null &&
        compareDateOnly(req.endDate, req.startDate) < 0
      ) {
        return mockProblem(
          UNPROCESSABLE_CONTENT_STATUS,
          "business_rule_violation",
          "Período inválido",
          { errors: { endDate: ["Debe ser igual o posterior a startDate."] } },
        );
      }
      if (req.schoolIds.includes(1)) {
        return mockProblem(
          CONFLICT_STATUS,
          "teacher_contract_conflict",
          "Conflicto con contrato vigente",
        );
      }
      return mockOk<readonly TeacherContractResponse[]>(
        teacherContractsCreatedFixture,
        { status: CREATED_STATUS },
      );
    },
  },

  // --- Reports -----------------------------------------------------------

  {
    method: "GET",
    pattern: "/api/reports/age-distribution",
    description: "Age distribution report",
    handler: ({ params }) => {
      if (!validAgeDistributionFilters(params)) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "academicYearId es requerido",
          {
            errors: { academicYearId: ["Requerido"] },
          },
        );
      }
      const includedEnrollments = filterAgeDistributionEnrollments(params);
      const asOfDate = params["asOfDate"];
      if (asOfDate !== undefined && !isValidDateOnly(asOfDate)) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          INVALID_AS_OF_DATE_TITLE,
        );
      }
      if (
        asOfDate !== undefined &&
        includedEnrollments.some(
          row => compareDateOnly(asOfDate, row.birthDate) < 0,
        )
      ) {
        return mockProblem(
          UNPROCESSABLE_CONTENT_STATUS,
          "as_of_date_invalid",
          "La fecha de referencia no es válida",
        );
      }
      if (params["academicYearId"] === "1") {
        const emptyResponse = {
          ...emptyAgeDistributionFixture,
          academicYearId: 1,
        };
        return mockOk<AgeDistributionResponseDto>(
          withAsOfDate(emptyResponse, asOfDate),
        );
      }
      return mockOk<AgeDistributionResponseDto>(
        withAsOfDate(ageDistributionFixture, asOfDate),
      );
    },
  },
  {
    method: "GET",
    pattern: "/api/reports/top-schools",
    description: "Top schools report",
    handler: ({ params }) => {
      if (!isPositiveInteger(params["academicYearId"])) {
        return mockProblem(
          BAD_REQUEST_STATUS,
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
      if (hasInvalidPeriodDate(periodStart, periodEnd)) {
        return mockProblem(
          BAD_REQUEST_STATUS,
          "invalid_request",
          "Período mal formado",
        );
      }
      if (hasIncompletePeriod(periodStart, periodEnd)) {
        return mockProblem(
          UNPROCESSABLE_CONTENT_STATUS,
          "period_invalid",
          "El período no es válido",
        );
      }
      if (
        periodStart &&
        periodEnd &&
        compareDateOnly(periodEnd, periodStart) < 0
      ) {
        return mockProblem(
          UNPROCESSABLE_CONTENT_STATUS,
          "period_invalid",
          "El período no es válido",
          {
            errors: {
              periodEnd: ["Debe ser igual o posterior a periodStart."],
            },
          },
        );
      }
      if (!periodStart) {
        return mockOk<TeacherCountsBySectorResponseDto>(
          emptyTeacherCountsBySectorFixture,
        );
      }
      return mockOk<TeacherCountsBySectorResponseDto>({
        ...teacherCountsBySectorFixture,
        periodStart,
        periodEnd: periodEnd ?? periodStart,
      });
    },
  },
];
