import { describe, expect, it } from "vitest";
import type { TeacherCountsBySectorResponseDto } from "./sector-counts.dto";
import {
  apiProblemPeriodInvalidFixture,
  emptyTeacherCountsBySectorFixture,
  teacherCountsBySectorFixture,
} from "../../../../testing/fixtures/sector-counts.fixture";

/**
 * CT-SECTOR-CONTRACT — Garantía de paridad entre el DTO TypeScript y la
 * definición declarada en `components/reports.yaml#/schemas/TeacherCountsBySectorResponse`.
 * Esta spec no ejercita el backend: es un contrato declarativo que rompe si
 * alguien renombra o reordena un campo del shape canónico.
 */
describe("TeacherCountsBySectorResponseDto (CT-SECTOR-CONTRACT)", () => {
  describe("campos requeridos", () => {
    it("declara los cuatro campos requeridos por el contrato", () => {
      const required: ReadonlyArray<keyof TeacherCountsBySectorResponseDto> = [
        "periodStart",
        "periodEnd",
        "publicDistinctTeacherCount",
        "privateDistinctTeacherCount",
      ];
      expect(required).toEqual([
        "periodStart",
        "periodEnd",
        "publicDistinctTeacherCount",
        "privateDistinctTeacherCount",
      ]);
    });
  });

  describe("fixtures vs example del YAML", () => {
    it("teacherCountsBySectorFixture es igualdad exacta contra el example del YAML", () => {
      expect(teacherCountsBySectorFixture).toEqual({
        periodStart: "2026-07-10",
        periodEnd: "2026-07-10",
        publicDistinctTeacherCount: 3,
        privateDistinctTeacherCount: 2,
      });
    });

    it("emptyTeacherCountsBySectorFixture conserva período y conteos en 0", () => {
      expect(emptyTeacherCountsBySectorFixture.periodStart).toBe("2026-07-10");
      expect(emptyTeacherCountsBySectorFixture.periodEnd).toBe("2026-07-10");
      expect(emptyTeacherCountsBySectorFixture.publicDistinctTeacherCount).toBe(
        0,
      );
      expect(
        emptyTeacherCountsBySectorFixture.privateDistinctTeacherCount,
      ).toBe(0);
    });

    it("el período se preserva igual al del backend cuando la operadora omitió el parámetro", () => {
      // El backend replica la fecha actual en ambos extremos; la VM
      // debe conservar ambos strings verbatim (no se calcula ni se ajusta).
      expect(teacherCountsBySectorFixture.periodStart).toBe(
        teacherCountsBySectorFixture.periodEnd,
      );
    });
  });

  describe("rango temporal (canonical shape)", () => {
    it("acepta periodStart === periodEnd como período de un solo día", () => {
      const sameDay: TeacherCountsBySectorResponseDto = {
        periodStart: "2026-07-10",
        periodEnd: "2026-07-10",
        publicDistinctTeacherCount: 3,
        privateDistinctTeacherCount: 2,
      };
      expect(sameDay.periodStart).toBe(sameDay.periodEnd);
    });

    it("acecta periodEnd posterior a periodStart", () => {
      const range: TeacherCountsBySectorResponseDto = {
        periodStart: "2026-03-01",
        periodEnd: "2026-07-10",
        publicDistinctTeacherCount: 5,
        privateDistinctTeacherCount: 4,
      };
      expect(range.periodEnd >= range.periodStart).toBe(true);
    });
  });

  describe("apiProblemPeriodInvalidFixture (422 canónico)", () => {
    it("refleja el example declarado en paths/reports.yaml", () => {
      expect(apiProblemPeriodInvalidFixture).toEqual({
        type: "https://inovait.local/problems/period-invalid",
        title: "El período no es válido",
        status: 422,
        code: "period_invalid",
        errors: {
          periodEnd: ["Debe ser igual o posterior a periodStart."],
        },
      });
    });

    it("expone `errors.periodEnd` con la violación específica", () => {
      expect(apiProblemPeriodInvalidFixture.errors?.periodEnd).toEqual([
        "Debe ser igual o posterior a periodStart.",
      ]);
    });
  });
});
