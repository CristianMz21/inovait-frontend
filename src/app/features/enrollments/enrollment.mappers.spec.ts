import { describe, expect, it } from "vitest";
import { createEnrollmentResponseFixture } from "../../../testing/fixtures";
import {
  enrollmentFormToRequest,
  enrollmentResponseToResult,
} from "./enrollment.mappers";
import type { EnrollmentFormVm } from "./enrollment-create.vm";

const baseForm: EnrollmentFormVm = {
  documentType: " DNI ",
  documentNumber: " 99.001.101 ",
  firstNames: " Ana María ",
  lastNames: " Solís ",
  birthDate: "2018-07-10",
  schoolId: 1,
  academicYearId: 2,
  gradeId: 1,
  classGroupId: 10,
};

describe("enrollmentFormToRequest", () => {
  it("mapea la VM completa al DTO canónico y recorta espacios", () => {
    expect(enrollmentFormToRequest(baseForm)).toEqual({
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
    });
  });

  it("devuelve null cuando falta cualquier referencia académica", () => {
    expect(enrollmentFormToRequest({ ...baseForm, schoolId: null })).toBeNull();
    expect(
      enrollmentFormToRequest({ ...baseForm, academicYearId: null }),
    ).toBeNull();
    expect(enrollmentFormToRequest({ ...baseForm, gradeId: null })).toBeNull();
    expect(
      enrollmentFormToRequest({ ...baseForm, classGroupId: null }),
    ).toBeNull();
  });
});

describe("enrollmentResponseToResult", () => {
  it("aplana la respuesta canónica a la VM de presentación", () => {
    const result = enrollmentResponseToResult(createEnrollmentResponseFixture);
    expect(result).toEqual({
      enrollmentId: 100,
      studentId: 50,
      studentReused: false,
      fullName: "Ana María Solís",
      age: 8,
      schoolName: "Escuela Río Claro",
      academicYearName: "2026",
      gradeName: "Grade 1",
      classGroupCode: "A",
    });
  });

  it("normaliza espacios múltiples al componer el nombre completo", () => {
    const result = enrollmentResponseToResult({
      ...createEnrollmentResponseFixture,
      firstNames: "  Ana  María ",
      lastNames: " Solís  López ",
    });
    expect(result.fullName).toBe("Ana María Solís López");
  });

  it("conserva la bandera studentReused del backend sin recalcular", () => {
    const result = enrollmentResponseToResult({
      ...createEnrollmentResponseFixture,
      studentReused: true,
      enrollmentId: 999,
    });
    expect(result.studentReused).toBe(true);
    expect(result.enrollmentId).toBe(999);
  });
});
