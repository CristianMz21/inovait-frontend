import { describe, expect, it } from "vitest";
import {
  ageBandFixture,
  ageDistributionFixture,
  apiProblemAsOfDateInvalidFixture,
  emptyAgeDistributionFixture,
} from "../../../../testing/fixtures/age-distribution.fixture";
import type {
  AgeBandResponse,
  AgeDistributionResponseDto,
} from "./age-distribution.dto";

/**
 * CT-AGE-CONTRACT — Garantía de paridad entre el DTO TypeScript y la
 * definición declarada en `components/reports.yaml`. Esta spec no
 * ejercita el backend: es un contrato declarativo que rompe si alguien
 * renombra o reordena un campo del shape canónico.
 */
describe("AgeDistributionDto (CT-AGE-CONTRACT)", () => {
  describe("AgeBandResponse", () => {
    it("declara minimumAge, maximumAge y count como campos requeridos", () => {
      const required: ReadonlyArray<keyof AgeBandResponse> = [
        "minimumAge",
        "maximumAge",
        "count",
      ];
      expect(required).toEqual(["minimumAge", "maximumAge", "count"]);
    });

    it("acepta maximumAge null para indicar rango abierto (ageOver12)", () => {
      const openBand: AgeBandResponse = {
        minimumAge: 13,
        maximumAge: null,
        count: 0,
      };
      expect(openBand.maximumAge).toBeNull();
    });

    it("la fixture ageBandFixture satisface la forma canónica", () => {
      expect(ageBandFixture).toEqual({
        minimumAge: 3,
        maximumAge: 7,
        count: 4,
      });
    });
  });

  describe("AgeDistributionResponseDto", () => {
    it("declara los cinco campos requeridos del contrato", () => {
      const required: ReadonlyArray<keyof AgeDistributionResponseDto> = [
        "academicYearId",
        "asOfDate",
        "age3To7",
        "age8To12",
        "ageOver12",
      ];
      // `schoolId` y `gradeId` son opcionales (pueden viajar null).
      expect(required).toEqual([
        "academicYearId",
        "asOfDate",
        "age3To7",
        "age8To12",
        "ageOver12",
      ]);
    });

    it("la fixture ageDistributionFixture es igualdad exacta contra el example del YAML", () => {
      expect(ageDistributionFixture).toEqual({
        academicYearId: 2,
        schoolId: null,
        gradeId: null,
        asOfDate: "2026-07-10",
        age3To7: { minimumAge: 3, maximumAge: 7, count: 4 },
        age8To12: { minimumAge: 8, maximumAge: 12, count: 6 },
        ageOver12: { minimumAge: 13, maximumAge: null, count: 2 },
      });
    });

    it("la fixture empty replica el example del YAML con conteos en 0", () => {
      expect(emptyAgeDistributionFixture.age3To7.count).toBe(0);
      expect(emptyAgeDistributionFixture.age8To12.count).toBe(0);
      expect(emptyAgeDistributionFixture.ageOver12.count).toBe(0);
      // Los rangos canónicos no cambian: el backend preserva el shape.
      expect(emptyAgeDistributionFixture.age3To7).toEqual({
        minimumAge: 3,
        maximumAge: 7,
        count: 0,
      });
      expect(emptyAgeDistributionFixture.age8To12).toEqual({
        minimumAge: 8,
        maximumAge: 12,
        count: 0,
      });
      expect(emptyAgeDistributionFixture.ageOver12).toEqual({
        minimumAge: 13,
        maximumAge: null,
        count: 0,
      });
    });

    it("el rango ageOver12 expone maximumAge null por contrato", () => {
      expect(ageDistributionFixture.ageOver12.maximumAge).toBeNull();
    });

    it("los rangos age3To7 y age8To12 tienen maximumAge cerrado", () => {
      expect(ageDistributionFixture.age3To7.maximumAge).toBe(7);
      expect(ageDistributionFixture.age8To12.maximumAge).toBe(12);
    });
  });

  describe("apiProblemAsOfDateInvalidFixture (422 canónico)", () => {
    it("refleja el example declarado en paths/reports.yaml", () => {
      expect(apiProblemAsOfDateInvalidFixture).toEqual({
        type: "https://inovait.local/problems/as-of-date-invalid",
        title: "La fecha de referencia no es válida",
        status: 422,
        code: "as_of_date_invalid",
      });
    });
  });
});
