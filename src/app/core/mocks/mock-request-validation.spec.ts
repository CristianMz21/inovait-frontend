import { describe, expect, it } from "vitest";
import {
  validateEnrollmentBody,
  validateTeacherContractBody,
} from "./mock-request-validation";

const validEnrollment = {
  student: {
    documentType: "DNI",
    documentNumber: "99.001.101",
    firstNames: "Ana María",
    lastNames: "Solís",
    birthDate: "2018-07-10",
  },
  schoolId: 1,
  academicYearId: 2,
  gradeId: 1,
  classGroupId: 10,
};

describe("mock request validation", () => {
  it("accepts canonical enrollment and teacher-contract bodies", () => {
    expect(validateEnrollmentBody(validEnrollment)).toBeNull();
    expect(
      validateTeacherContractBody({
        schoolIds: [1, 2],
        startDate: "2026-03-01",
        endDate: null,
      }),
    ).toBeNull();
  });

  it("reports every missing enrollment field", () => {
    expect(validateEnrollmentBody({})).toEqual({
      student: ["El campo es obligatorio."],
      schoolId: ["Debe ser un entero mayor o igual a 1."],
      academicYearId: ["Debe ser un entero mayor o igual a 1."],
      gradeId: ["Debe ser un entero mayor o igual a 1."],
      classGroupId: ["Debe ser un entero mayor o igual a 1."],
    });
    const studentErrors = validateEnrollmentBody({
      ...validEnrollment,
      student: {},
    });
    expect(studentErrors).toHaveProperty("student.documentType");
    expect(studentErrors).toHaveProperty("student.documentNumber");
    expect(studentErrors).toHaveProperty("student.firstNames");
    expect(studentErrors).toHaveProperty("student.lastNames");
    expect(studentErrors).toHaveProperty("student.birthDate");
  });

  it("rejects invalid enrollment types, bounds, dates, and additional fields", () => {
    const errors = validateEnrollmentBody({
      ...validEnrollment,
      unexpected: true,
      schoolId: "1",
      student: {
        ...validEnrollment.student,
        firstNames: "x".repeat(121),
        birthDate: "2026-02-31",
        extra: true,
      },
    });
    expect(errors).toHaveProperty("unexpected");
    expect(errors).toHaveProperty("schoolId");
    expect(errors).toHaveProperty("student.firstNames");
    expect(errors).toHaveProperty("student.birthDate");
    expect(errors).toHaveProperty("extra");
  });

  it("reports required and invalid teacher-contract fields", () => {
    const missing = validateTeacherContractBody({});
    expect(missing).toHaveProperty("schoolIds");
    expect(missing).toHaveProperty("startDate");
    const invalid = validateTeacherContractBody({
      schoolIds: [0, "2"],
      startDate: "2026-02-31",
      endDate: "tomorrow",
      unexpected: true,
    });
    expect(invalid).toHaveProperty("schoolIds");
    expect(invalid).toHaveProperty("startDate");
    expect(invalid).toHaveProperty("endDate");
    expect(invalid).toHaveProperty("unexpected");
  });
});
