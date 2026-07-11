import { describe, expect, it } from "vitest";
import { enrollmentListResponseFixture } from "../../../testing/fixtures";
import {
  enrollmentListItemToResult,
  studentSearchFiltersAreComplete,
  studentSearchFiltersToParams,
} from "./student-search.mappers";
import type { StudentSearchFiltersVm } from "./student-search.vm";

const completeFilters: StudentSearchFiltersVm = {
  schoolId: 1,
  gradeId: 1,
  academicYearId: 2,
  asOfDate: null,
};

describe("studentSearchFiltersAreComplete", () => {
  it("es true cuando los tres filtros académicos están definidos", () => {
    expect(studentSearchFiltersAreComplete(completeFilters)).toBe(true);
  });

  it("es false cuando falta cualquier filtro académico", () => {
    expect(
      studentSearchFiltersAreComplete({ ...completeFilters, schoolId: null }),
    ).toBe(false);
    expect(
      studentSearchFiltersAreComplete({ ...completeFilters, gradeId: null }),
    ).toBe(false);
    expect(
      studentSearchFiltersAreComplete({
        ...completeFilters,
        academicYearId: null,
      }),
    ).toBe(false);
  });
});

describe("studentSearchFiltersToParams", () => {
  it("devuelve null cuando falta algún filtro obligatorio", () => {
    expect(
      studentSearchFiltersToParams({ ...completeFilters, schoolId: null }),
    ).toBeNull();
    expect(
      studentSearchFiltersToParams({ ...completeFilters, gradeId: null }),
    ).toBeNull();
    expect(
      studentSearchFiltersToParams({
        ...completeFilters,
        academicYearId: null,
      }),
    ).toBeNull();
  });

  it("emite los tres parámetros requeridos sin asOfDate cuando es null", () => {
    expect(studentSearchFiltersToParams(completeFilters)).toEqual({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
  });

  it("emite asOfDate cuando la operadora lo define y recorta espacios", () => {
    expect(
      studentSearchFiltersToParams({
        ...completeFilters,
        asOfDate: " 2026-07-10 ",
      }),
    ).toEqual({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
      asOfDate: "2026-07-10",
    });
  });

  it("omite asOfDate cuando es vacío o sólo espacios", () => {
    expect(
      studentSearchFiltersToParams({ ...completeFilters, asOfDate: "" }),
    ).toEqual({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
    expect(
      studentSearchFiltersToParams({ ...completeFilters, asOfDate: "   " }),
    ).toEqual({
      schoolId: 1,
      gradeId: 1,
      academicYearId: 2,
    });
  });
});

describe("enrollmentListItemToResult", () => {
  it("aplana la respuesta canónica a la VM de presentación", () => {
    const first = enrollmentListResponseFixture[0];
    const result = enrollmentListItemToResult(first);
    expect(result).toEqual({
      enrollmentId: 100,
      studentId: 50,
      documentType: "DNI",
      documentNumber: "99.001.101",
      fullName: "Ana María Solís",
      birthDate: "2018-07-10",
      age: 8,
      schoolName: "Escuela Río Claro",
      schoolSector: "Público",
      academicYearName: "2026",
      gradeName: "Grade 1",
      classGroupCode: "A",
    });
  });

  it('etiqueta escuelas privadas como "Privado"', () => {
    const result = enrollmentListItemToResult({
      ...enrollmentListResponseFixture[0],
      school: { id: 2, name: "Instituto Horizonte", sector: "Private" },
    });
    expect(result.schoolSector).toBe("Privado");
  });

  it("normaliza espacios múltiples al componer el nombre completo", () => {
    const result = enrollmentListItemToResult({
      ...enrollmentListResponseFixture[0],
      firstNames: "  Ana  María ",
      lastNames: " Solís  López ",
    });
    expect(result.fullName).toBe("Ana María Solís López");
  });
});
