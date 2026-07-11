import { describe, expect, it } from "vitest";
import {
  ageDistributionFixture,
  emptyAgeDistributionFixture,
  emptyTeacherCountsBySectorFixture,
  emptyTopSchoolsFixture,
  teacherCountsBySectorFixture,
  topSchoolsFixture,
  topSchoolsSingleFixture,
} from "../../../testing/fixtures";
import type { AgeDistributionResponseDto } from "../../core/api/dtos/age-distribution.dto";
import type { TopSchoolResponseDto } from "../../core/api/dtos/top-schools.dto";
import {
  ageDistributionFiltersAreValid,
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
  teacherCountsBySectorFiltersAreValid,
  teacherCountsBySectorFiltersToParams,
  teacherCountsBySectorResponseToVm,
  topSchoolsFiltersAreValid,
  topSchoolsFiltersToParams,
  topSchoolsResponseToVm,
} from "./report.mappers";
import type {
  AgeDistributionFiltersVm,
  TeacherCountsBySectorFiltersVm,
  TopSchoolsFiltersVm,
} from "./report.vm";

const validFilters: AgeDistributionFiltersVm = {
  academicYearId: 2,
  asOfDate: null,
  schoolId: null,
  gradeId: null,
};

describe("ReportMappers (CT-AGE-MAP)", () => {
  describe("ageDistributionFiltersAreValid()", () => {
    it("acepta una VM con academicYearId", () => {
      expect(ageDistributionFiltersAreValid(validFilters)).toBe(true);
    });

    it("rechaza cuando academicYearId es null", () => {
      expect(
        ageDistributionFiltersAreValid({
          ...validFilters,
          academicYearId: null,
        }),
      ).toBe(false);
    });
  });

  describe("ageDistributionFiltersToParams()", () => {
    it("produce el payload canónico mínimo (sólo academicYearId)", () => {
      expect(ageDistributionFiltersToParams(validFilters)).toEqual({
        academicYearId: 2,
      });
    });

    it("envía asOfDate sólo cuando la operadora lo define", () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          asOfDate: "2026-07-10",
        }),
      ).toEqual({ academicYearId: 2, asOfDate: "2026-07-10" });
    });

    it("envía schoolId/gradeId sólo cuando están definidos", () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          schoolId: 1,
          gradeId: 3,
          asOfDate: "2026-07-10",
        }),
      ).toEqual({
        academicYearId: 2,
        schoolId: 1,
        gradeId: 3,
        asOfDate: "2026-07-10",
      });
    });

    it("recorta espacios en asOfDate antes de enviar", () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          asOfDate: "  2026-07-10  ",
        }),
      ).toEqual({ academicYearId: 2, asOfDate: "2026-07-10" });
    });

    it("omite asOfDate cuando es vacío o sólo espacios", () => {
      expect(
        ageDistributionFiltersToParams({ ...validFilters, asOfDate: "" }),
      ).toEqual({ academicYearId: 2 });
      expect(
        ageDistributionFiltersToParams({ ...validFilters, asOfDate: "   " }),
      ).toEqual({ academicYearId: 2 });
    });

    it("devuelve null cuando academicYearId falta", () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          academicYearId: null,
        }),
      ).toBeNull();
    });
  });

  describe("ageDistributionResponseToVm()", () => {
    it("aplana la respuesta canónica a la VM de presentación", () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.academicYearId).toBe(2);
      expect(vm.schoolId).toBeNull();
      expect(vm.gradeId).toBeNull();
      expect(vm.asOfDate).toBe("2026-07-10");
      expect(vm.bands).toHaveLength(3);
    });

    it("preserva los ids canónicos age3To7, age8To12, ageOver12", () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands.map((b) => b.id)).toEqual([
        "age3To7",
        "age8To12",
        "ageOver12",
      ]);
    });

    it("preserva los rangos exactos del DTO sin recalcular", () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands[0]).toMatchObject({
        id: "age3To7",
        minimumAge: 3,
        maximumAge: 7,
        count: 4,
      });
      expect(vm.bands[1]).toMatchObject({
        id: "age8To12",
        minimumAge: 8,
        maximumAge: 12,
        count: 6,
      });
      expect(vm.bands[2]).toMatchObject({
        id: "ageOver12",
        minimumAge: 13,
        maximumAge: null,
        count: 2,
      });
    });

    it("asigna etiquetas legibles por banda", () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands[0].label).toBe("3 a 7 años");
      expect(vm.bands[1].label).toBe("8 a 12 años");
      expect(vm.bands[2].label).toBe("Mayores de 12 años");
    });

    it("calcula totalCount como la suma de las tres bandas", () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.totalCount).toBe(4 + 6 + 2);
    });

    it("preserva conteos en 0 sin mapearlos a error (escenario sin inscripciones)", () => {
      const vm = ageDistributionResponseToVm(emptyAgeDistributionFixture);
      expect(vm.bands[0].count).toBe(0);
      expect(vm.bands[1].count).toBe(0);
      expect(vm.bands[2].count).toBe(0);
      expect(vm.totalCount).toBe(0);
    });

    it("propaga schoolId y gradeId cuando el backend los rellena", () => {
      const dto: AgeDistributionResponseDto = {
        ...ageDistributionFixture,
        schoolId: 1,
        gradeId: 3,
      };
      const vm = ageDistributionResponseToVm(dto);
      expect(vm.schoolId).toBe(1);
      expect(vm.gradeId).toBe(3);
    });

    it("no muta el DTO de entrada", () => {
      const original = JSON.stringify(ageDistributionFixture);
      ageDistributionResponseToVm(ageDistributionFixture);
      expect(JSON.stringify(ageDistributionFixture)).toBe(original);
    });
  });

  describe("teacherCountsBySectorFiltersAreValid()", () => {
    it("acepta ambos extremos en null (backend usa fecha actual)", () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: null,
          periodEnd: null,
        }),
      ).toBe(true);
    });

    it("acepta ambos extremos definidos", () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: "2026-07-01",
          periodEnd: "2026-07-10",
        }),
      ).toBe(true);
    });

    it("rechaza cuando sólo periodStart está definido", () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: "2026-07-01",
          periodEnd: null,
        }),
      ).toBe(false);
    });

    it("rechaza cuando sólo periodEnd está definido", () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: null,
          periodEnd: "2026-07-10",
        }),
      ).toBe(false);
    });
  });

  describe("teacherCountsBySectorFiltersToParams()", () => {
    it("produce el payload canónico mínimo (sin query)", () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: null,
          periodEnd: null,
        }),
      ).toEqual({});
    });

    it("envía ambos extremos cuando están definidos", () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: "2026-07-01",
          periodEnd: "2026-07-10",
        }),
      ).toEqual({ periodStart: "2026-07-01", periodEnd: "2026-07-10" });
    });

    it("recorta espacios en los extremos antes de enviar", () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: "  2026-07-01  ",
          periodEnd: "  2026-07-10  ",
        }),
      ).toEqual({ periodStart: "2026-07-01", periodEnd: "2026-07-10" });
    });

    it("omite extremos vacíos o sólo espacios", () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: "",
          periodEnd: "   ",
        }),
      ).toEqual({});
    });

    it("devuelve null cuando los filtros son asimétricos", () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: "2026-07-01",
          periodEnd: null,
        }),
      ).toBeNull();
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: null,
          periodEnd: "2026-07-10",
        }),
      ).toBeNull();
    });
  });

  describe("teacherCountsBySectorResponseToVm() (CT-SECTOR-MAP)", () => {
    it("aplana la respuesta canónica a la VM de presentación", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.periodStart).toBe("2026-07-10");
      expect(vm.periodEnd).toBe("2026-07-10");
      expect(vm.sectors).toHaveLength(2);
    });

    it("preserva el orden fijo de sectores (público, privado)", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.sectors.map((s) => s.id)).toEqual(["public", "private"]);
    });

    it("preserva los conteos exactos del DTO sin recalcular ni deduplicar", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.sectors[0]).toMatchObject({
        id: "public",
        distinctTeacherCount: 3,
      });
      expect(vm.sectors[1]).toMatchObject({
        id: "private",
        distinctTeacherCount: 2,
      });
    });

    it("asigna etiquetas legibles por sector", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.sectors[0].label).toBe("Público");
      expect(vm.sectors[1].label).toBe("Privado");
    });

    it("calcula totalDistinctTeacherCount como la suma de los dos sectores", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.totalDistinctTeacherCount).toBe(3 + 2);
    });

    it("preserva conteos en 0 sin mapearlos a error (escenario sin docentes)", () => {
      const vm = teacherCountsBySectorResponseToVm(
        emptyTeacherCountsBySectorFixture,
      );
      expect(vm.sectors[0].distinctTeacherCount).toBe(0);
      expect(vm.sectors[1].distinctTeacherCount).toBe(0);
      expect(vm.totalDistinctTeacherCount).toBe(0);
    });

    it("no muta el DTO de entrada", () => {
      const original = JSON.stringify(teacherCountsBySectorFixture);
      teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(JSON.stringify(teacherCountsBySectorFixture)).toBe(original);
    });

    it("preserva el período verbatim (no recalcula ni ajusta)", () => {
      const vm = teacherCountsBySectorResponseToVm(
        teacherCountsBySectorFixture,
      );
      expect(vm.periodStart).toBe(teacherCountsBySectorFixture.periodStart);
      expect(vm.periodEnd).toBe(teacherCountsBySectorFixture.periodEnd);
    });
  });

  describe("topSchoolsFiltersAreValid()", () => {
    it("acepta una VM con academicYearId", () => {
      expect(topSchoolsFiltersAreValid({ academicYearId: 2 })).toBe(true);
    });

    it("rechaza cuando academicYearId es null", () => {
      expect(topSchoolsFiltersAreValid({ academicYearId: null })).toBe(false);
    });
  });

  describe("topSchoolsFiltersToParams()", () => {
    it("produce el payload canónico (sólo academicYearId)", () => {
      expect(topSchoolsFiltersToParams({ academicYearId: 2 })).toEqual({
        academicYearId: 2,
      });
    });

    it("devuelve null cuando academicYearId falta", () => {
      expect(topSchoolsFiltersToParams({ academicYearId: null })).toBeNull();
    });
  });

  describe("topSchoolsResponseToVm() (CT-TOP-MAP)", () => {
    it("aplana la respuesta canónica a la VM de presentación", () => {
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      expect(vm.academicYearId).toBe(2);
      expect(vm.schools).toHaveLength(2);
    });

    it("preserva el orden estable del backend (school.name ASC, school.id)", () => {
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      expect(vm.schools.map((s) => s.schoolName)).toEqual([
        "Escuela Río Claro",
        "Instituto Horizonte",
      ]);
      expect(vm.schools.map((s) => s.schoolId)).toEqual([1, 2]);
    });

    it("conserva los empates en count=12 (no colapsa ni filtra)", () => {
      // El contrato exige "todos los empates" (T062 spec). El mapper
      // no debe descartar entradas con el mismo `enrollmentCount`.
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      expect(vm.schools.map((s) => s.enrollmentCount)).toEqual([12, 12]);
    });

    it("preserva los conteos exactos del DTO sin recalcular ni agregar", () => {
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      expect(vm.schools[0]).toMatchObject({
        schoolId: 1,
        schoolName: "Escuela Río Claro",
        sector: "Public",
        enrollmentCount: 12,
      });
      expect(vm.schools[1]).toMatchObject({
        schoolId: 2,
        schoolName: "Instituto Horizonte",
        sector: "Private",
        enrollmentCount: 12,
      });
    });

    it("asigna etiquetas legibles por sector (Public → Público, Private → Privado)", () => {
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      expect(vm.schools[0]?.sectorLabel).toBe("Público");
      expect(vm.schools[1]?.sectorLabel).toBe("Privado");
    });

    it("preserva una sola escuela líder sin empates (lista unitaria)", () => {
      const vm = topSchoolsResponseToVm(topSchoolsSingleFixture);
      expect(vm.schools).toHaveLength(1);
      expect(vm.schools[0]?.schoolId).toBe(3);
      expect(vm.schools[0]?.enrollmentCount).toBe(8);
    });

    it("mapea una lista vacía a una VM con schools vacío", () => {
      // El caller (facade) emite `empty` antes de invocar el mapper con
      // `[]`, pero el mapper debe seguir siendo defensivo: si recibe
      // `[]`, devuelve una VM con `schools` vacío (la fachada no entra
      // a esta rama por la rama `empty` previa).
      const vm = topSchoolsResponseToVm(emptyTopSchoolsFixture);
      expect(vm.schools).toEqual([]);
      expect(vm.schools).toHaveLength(0);
    });

    it("no muta el DTO de entrada", () => {
      const original = JSON.stringify(topSchoolsFixture);
      topSchoolsResponseToVm(topSchoolsFixture);
      expect(JSON.stringify(topSchoolsFixture)).toBe(original);
    });

    it("preserva verbatim schoolId, schoolName, sector y enrollmentCount", () => {
      const vm = topSchoolsResponseToVm(topSchoolsFixture);
      const first = vm.schools[0];
      const sourceFirst = topSchoolsFixture[0];
      expect(first).toBeDefined();
      expect(sourceFirst).toBeDefined();
      if (first && sourceFirst) {
        expect(first.schoolId).toBe(sourceFirst.school.id);
        expect(first.schoolName).toBe(sourceFirst.school.name);
        expect(first.sector).toBe(sourceFirst.school.sector);
        expect(first.enrollmentCount).toBe(sourceFirst.enrollmentCount);
      }
    });

    it("tolera un DTO arbitrario de una sola entrada con sector Private", () => {
      // La forma canónica puede traer una sola escuela privada; el
      // mapper no debe asumir un mínimo de dos entradas.
      const dto: readonly TopSchoolResponseDto[] = [
        {
          school: { id: 9, name: "Colegio Andino", sector: "Private" },
          academicYearId: 2,
          enrollmentCount: 5,
        },
      ];
      const vm = topSchoolsResponseToVm(dto);
      expect(vm.schools).toHaveLength(1);
      expect(vm.schools[0]?.sector).toBe("Private");
      expect(vm.schools[0]?.sectorLabel).toBe("Privado");
      expect(vm.academicYearId).toBe(2);
    });
  });
});
