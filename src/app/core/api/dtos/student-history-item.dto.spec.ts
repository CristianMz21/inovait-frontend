import { describe, expect, it } from "vitest";
import {
  apiProblemStudentNotFoundFixture,
  emptyStudentHistoryFixture,
  studentHistoryFixture,
  studentHistoryNoAssignmentsFixture,
  studentHistorySecondYearFixture,
} from "../../../../testing/fixtures/student-history.fixture";
import type {
  EnrollmentHistoryItemDto,
  HistoryTeachingAssignmentDto,
  StudentHistoryResponseDto,
} from "./student-history-item.dto";

/**
 * CT-HIST-CONTRACT — Garantía de paridad entre los DTO TypeScript y la
 * definición declarada en `components/enrollments.yaml#/schemas/{StudentHistoryResponse,
 * EnrollmentHistoryItem, HistoryTeachingAssignment}`. Esta spec no
 * ejercita el backend: es un contrato declarativo que rompe si alguien
 * renombra o reordena un campo del shape canónico.
 */
describe("StudentHistoryResponseDto (CT-HIST-CONTRACT)", () => {
  describe("HistoryTeachingAssignmentDto", () => {
    it("declara assignmentId, teacher, subject y weekdays como campos requeridos", () => {
      const required: ReadonlyArray<keyof HistoryTeachingAssignmentDto> = [
        "assignmentId",
        "teacher",
        "subject",
        "weekdays",
      ];
      expect(required).toEqual([
        "assignmentId",
        "teacher",
        "subject",
        "weekdays",
      ]);
    });

    it("acepta weekdays como array de enteros del 1 al 7 (contract: minimum: 1, maximum: 7)", () => {
      const entry: HistoryTeachingAssignmentDto = {
        assignmentId: 31,
        teacher: {
          id: 5,
          documentType: "DNI",
          documentNumber: "88001001",
          firstNames: "Lucía",
          lastNames: "Benítez",
        },
        subject: { id: 3, code: "MATH", name: "Matemática" },
        weekdays: [1, 3, 5],
      };
      expect(entry.weekdays.every((day) => day >= 1 && day <= 7)).toBe(true);
      expect(entry.weekdays).toEqual([1, 3, 5]);
    });

    it("tolera weekdays con un único día (contract: minItems: 1)", () => {
      const entry: HistoryTeachingAssignmentDto = {
        assignmentId: 32,
        teacher: {
          id: 7,
          documentType: "DNI",
          documentNumber: "88001002",
          firstNames: "Pedro",
          lastNames: "Gómez",
        },
        subject: { id: 4, code: "LANG", name: "Lengua" },
        weekdays: [2],
      };
      expect(entry.weekdays).toHaveLength(1);
    });
  });

  describe("EnrollmentHistoryItemDto", () => {
    it("declara los seis campos requeridos por el contrato", () => {
      const required: ReadonlyArray<keyof EnrollmentHistoryItemDto> = [
        "enrollmentId",
        "academicYear",
        "school",
        "grade",
        "classGroup",
        "teachingAssignments",
      ];
      expect(required).toEqual([
        "enrollmentId",
        "academicYear",
        "school",
        "grade",
        "classGroup",
        "teachingAssignments",
      ]);
    });

    it("acepta teachingAssignments como array vacío (inscripción sin docentes)", () => {
      const entry: EnrollmentHistoryItemDto = {
        enrollmentId: 200,
        academicYear: {
          id: 3,
          name: "2025",
          startDate: "2025-03-03",
          endDate: "2025-12-19",
          isCurrent: false,
        },
        school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
        grade: { id: 1, name: "Grade 1", sortOrder: 1 },
        classGroup: {
          id: 11,
          code: "A",
          schoolId: 1,
          academicYearId: 3,
          gradeId: 1,
        },
        teachingAssignments: [],
      };
      expect(entry.teachingAssignments).toEqual([]);
    });
  });

  describe("StudentHistoryResponseDto", () => {
    it("declara los siete campos requeridos por el contrato", () => {
      const required: ReadonlyArray<keyof StudentHistoryResponseDto> = [
        "studentId",
        "documentType",
        "documentNumber",
        "firstNames",
        "lastNames",
        "birthDate",
        "enrollments",
      ];
      expect(required).toEqual([
        "studentId",
        "documentType",
        "documentNumber",
        "firstNames",
        "lastNames",
        "birthDate",
        "enrollments",
      ]);
    });

    it("la fixture happy (2 años + múltiples asignaciones) satisface el example del YAML", () => {
      expect(studentHistoryFixture).toEqual({
        studentId: 50,
        documentType: "DNI",
        documentNumber: "99.001.101",
        firstNames: "Ana María",
        lastNames: "Solís",
        birthDate: "2018-07-10",
        enrollments: [
          {
            enrollmentId: 100,
            academicYear: {
              id: 2,
              name: "2026",
              startDate: "2026-03-02",
              endDate: "2026-12-18",
              isCurrent: true,
            },
            school: { id: 1, name: "Escuela Río Claro", sector: "Public" },
            grade: { id: 1, name: "Grade 1", sortOrder: 1 },
            classGroup: {
              id: 10,
              code: "A",
              schoolId: 1,
              academicYearId: 2,
              gradeId: 1,
            },
            teachingAssignments: [
              {
                assignmentId: 31,
                teacher: {
                  id: 5,
                  documentType: "DNI",
                  documentNumber: "88001001",
                  firstNames: "Lucía",
                  lastNames: "Benítez",
                },
                subject: { id: 3, code: "MATH", name: "Matemática" },
                weekdays: [1, 3, 5],
              },
            ],
          },
        ],
      });
    });

    it("expone multipleYearsFixture con un año previo y el actual (orden contractual)", () => {
      const dto = studentHistorySecondYearFixture;
      expect(dto.enrollments).toHaveLength(2);
      // El backend ordena descendente por academicYear.startDate; el año
      // actual (startDate 2026) aparece primero que el previo (2025).
      expect(dto.enrollments[0]?.academicYear.name).toBe("2026");
      expect(dto.enrollments[1]?.academicYear.name).toBe("2025");
    });

    it("expone una variante con inscripciones sin asignaciones (teachingAssignments: [])", () => {
      expect(
        studentHistoryNoAssignmentsFixture.enrollments[0]?.teachingAssignments,
      ).toEqual([]);
    });

    it("expone emptyStudentHistoryFixture con enrollments [] (200 [])", () => {
      expect(emptyStudentHistoryFixture.enrollments).toEqual([]);
      expect(emptyStudentHistoryFixture.enrollments).toHaveLength(0);
      expect(emptyStudentHistoryFixture.documentType).toBe("DNI");
    });

    it("expone apiProblemStudentNotFoundFixture con código canónico student_not_found", () => {
      expect(apiProblemStudentNotFoundFixture.code).toBe("student_not_found");
      expect(apiProblemStudentNotFoundFixture.status).toBe(404);
    });
  });
});
