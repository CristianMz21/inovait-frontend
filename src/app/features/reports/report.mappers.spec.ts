import { describe, expect, it } from 'vitest';
import {
  ageDistributionFixture,
  emptyAgeDistributionFixture,
  emptyTeacherCountsBySectorFixture,
  teacherCountsBySectorFixture,
} from '../../../testing/fixtures';
import type { AgeDistributionResponseDto } from '../../core/api/dtos/age-distribution.dto';
import {
  ageDistributionFiltersAreValid,
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
  teacherCountsBySectorFiltersAreValid,
  teacherCountsBySectorFiltersToParams,
  teacherCountsBySectorResponseToVm,
} from './report.mappers';
import type {
  AgeDistributionFiltersVm,
  TeacherCountsBySectorFiltersVm,
} from './report.vm';

const validFilters: AgeDistributionFiltersVm = {
  academicYearId: 2,
  asOfDate: null,
  schoolId: null,
  gradeId: null,
};

describe('ReportMappers (CT-AGE-MAP)', () => {
  describe('ageDistributionFiltersAreValid()', () => {
    it('acepta una VM con academicYearId', () => {
      expect(ageDistributionFiltersAreValid(validFilters)).toBe(true);
    });

    it('rechaza cuando academicYearId es null', () => {
      expect(
        ageDistributionFiltersAreValid({ ...validFilters, academicYearId: null }),
      ).toBe(false);
    });
  });

  describe('ageDistributionFiltersToParams()', () => {
    it('produce el payload canónico mínimo (sólo academicYearId)', () => {
      expect(ageDistributionFiltersToParams(validFilters)).toEqual({
        academicYearId: 2,
      });
    });

    it('envía asOfDate sólo cuando la operadora lo define', () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          asOfDate: '2026-07-10',
        }),
      ).toEqual({ academicYearId: 2, asOfDate: '2026-07-10' });
    });

    it('envía schoolId/gradeId sólo cuando están definidos', () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          schoolId: 1,
          gradeId: 3,
          asOfDate: '2026-07-10',
        }),
      ).toEqual({
        academicYearId: 2,
        schoolId: 1,
        gradeId: 3,
        asOfDate: '2026-07-10',
      });
    });

    it('recorta espacios en asOfDate antes de enviar', () => {
      expect(
        ageDistributionFiltersToParams({
          ...validFilters,
          asOfDate: '  2026-07-10  ',
        }),
      ).toEqual({ academicYearId: 2, asOfDate: '2026-07-10' });
    });

    it('omite asOfDate cuando es vacío o sólo espacios', () => {
      expect(
        ageDistributionFiltersToParams({ ...validFilters, asOfDate: '' }),
      ).toEqual({ academicYearId: 2 });
      expect(
        ageDistributionFiltersToParams({ ...validFilters, asOfDate: '   ' }),
      ).toEqual({ academicYearId: 2 });
    });

    it('devuelve null cuando academicYearId falta', () => {
      expect(
        ageDistributionFiltersToParams({ ...validFilters, academicYearId: null }),
      ).toBeNull();
    });
  });

  describe('ageDistributionResponseToVm()', () => {
    it('aplana la respuesta canónica a la VM de presentación', () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.academicYearId).toBe(2);
      expect(vm.schoolId).toBeNull();
      expect(vm.gradeId).toBeNull();
      expect(vm.asOfDate).toBe('2026-07-10');
      expect(vm.bands).toHaveLength(3);
    });

    it('preserva los ids canónicos age3To7, age8To12, ageOver12', () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands.map((b) => b.id)).toEqual([
        'age3To7',
        'age8To12',
        'ageOver12',
      ]);
    });

    it('preserva los rangos exactos del DTO sin recalcular', () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands[0]).toMatchObject({
        id: 'age3To7',
        minimumAge: 3,
        maximumAge: 7,
        count: 4,
      });
      expect(vm.bands[1]).toMatchObject({
        id: 'age8To12',
        minimumAge: 8,
        maximumAge: 12,
        count: 6,
      });
      expect(vm.bands[2]).toMatchObject({
        id: 'ageOver12',
        minimumAge: 13,
        maximumAge: null,
        count: 2,
      });
    });

    it('asigna etiquetas legibles por banda', () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.bands[0].label).toBe('3 a 7 años');
      expect(vm.bands[1].label).toBe('8 a 12 años');
      expect(vm.bands[2].label).toBe('Mayores de 12 años');
    });

    it('calcula totalCount como la suma de las tres bandas', () => {
      const vm = ageDistributionResponseToVm(ageDistributionFixture);
      expect(vm.totalCount).toBe(4 + 6 + 2);
    });

    it('preserva conteos en 0 sin mapearlos a error (escenario sin inscripciones)', () => {
      const vm = ageDistributionResponseToVm(emptyAgeDistributionFixture);
      expect(vm.bands[0].count).toBe(0);
      expect(vm.bands[1].count).toBe(0);
      expect(vm.bands[2].count).toBe(0);
      expect(vm.totalCount).toBe(0);
    });

    it('propaga schoolId y gradeId cuando el backend los rellena', () => {
      const dto: AgeDistributionResponseDto = {
        ...ageDistributionFixture,
        schoolId: 1,
        gradeId: 3,
      };
      const vm = ageDistributionResponseToVm(dto);
      expect(vm.schoolId).toBe(1);
      expect(vm.gradeId).toBe(3);
    });

    it('no muta el DTO de entrada', () => {
      const original = JSON.stringify(ageDistributionFixture);
      ageDistributionResponseToVm(ageDistributionFixture);
      expect(JSON.stringify(ageDistributionFixture)).toBe(original);
    });
  });

  describe('teacherCountsBySectorFiltersAreValid()', () => {
    it('acepta ambos extremos en null (backend usa fecha actual)', () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: null,
          periodEnd: null,
        }),
      ).toBe(true);
    });

    it('acepta ambos extremos definidos', () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: '2026-07-01',
          periodEnd: '2026-07-10',
        }),
      ).toBe(true);
    });

    it('rechaza cuando sólo periodStart está definido', () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: '2026-07-01',
          periodEnd: null,
        }),
      ).toBe(false);
    });

    it('rechaza cuando sólo periodEnd está definido', () => {
      expect(
        teacherCountsBySectorFiltersAreValid({
          periodStart: null,
          periodEnd: '2026-07-10',
        }),
      ).toBe(false);
    });
  });

  describe('teacherCountsBySectorFiltersToParams()', () => {
    it('produce el payload canónico mínimo (sin query)', () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: null,
          periodEnd: null,
        }),
      ).toEqual({});
    });

    it('envía ambos extremos cuando están definidos', () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: '2026-07-01',
          periodEnd: '2026-07-10',
        }),
      ).toEqual({ periodStart: '2026-07-01', periodEnd: '2026-07-10' });
    });

    it('recorta espacios en los extremos antes de enviar', () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: '  2026-07-01  ',
          periodEnd: '  2026-07-10  ',
        }),
      ).toEqual({ periodStart: '2026-07-01', periodEnd: '2026-07-10' });
    });

    it('omite extremos vacíos o sólo espacios', () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: '',
          periodEnd: '   ',
        }),
      ).toEqual({});
    });

    it('devuelve null cuando los filtros son asimétricos', () => {
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: '2026-07-01',
          periodEnd: null,
        }),
      ).toBeNull();
      expect(
        teacherCountsBySectorFiltersToParams({
          periodStart: null,
          periodEnd: '2026-07-10',
        }),
      ).toBeNull();
    });
  });

  describe('teacherCountsBySectorResponseToVm() (CT-SECTOR-MAP)', () => {
    it('aplana la respuesta canónica a la VM de presentación', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.periodStart).toBe('2026-07-10');
      expect(vm.periodEnd).toBe('2026-07-10');
      expect(vm.sectors).toHaveLength(2);
    });

    it('preserva el orden fijo de sectores (público, privado)', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.sectors.map((s) => s.id)).toEqual(['public', 'private']);
    });

    it('preserva los conteos exactos del DTO sin recalcular ni deduplicar', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.sectors[0]).toMatchObject({
        id: 'public',
        distinctTeacherCount: 3,
      });
      expect(vm.sectors[1]).toMatchObject({
        id: 'private',
        distinctTeacherCount: 2,
      });
    });

    it('asigna etiquetas legibles por sector', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.sectors[0].label).toBe('Público');
      expect(vm.sectors[1].label).toBe('Privado');
    });

    it('calcula totalDistinctTeacherCount como la suma de los dos sectores', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.totalDistinctTeacherCount).toBe(3 + 2);
    });

    it('preserva conteos en 0 sin mapearlos a error (escenario sin docentes)', () => {
      const vm = teacherCountsBySectorResponseToVm(emptyTeacherCountsBySectorFixture);
      expect(vm.sectors[0].distinctTeacherCount).toBe(0);
      expect(vm.sectors[1].distinctTeacherCount).toBe(0);
      expect(vm.totalDistinctTeacherCount).toBe(0);
    });

    it('no muta el DTO de entrada', () => {
      const original = JSON.stringify(teacherCountsBySectorFixture);
      teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(JSON.stringify(teacherCountsBySectorFixture)).toBe(original);
    });

    it('preserva el período verbatim (no recalcula ni ajusta)', () => {
      const vm = teacherCountsBySectorResponseToVm(teacherCountsBySectorFixture);
      expect(vm.periodStart).toBe(teacherCountsBySectorFixture.periodStart);
      expect(vm.periodEnd).toBe(teacherCountsBySectorFixture.periodEnd);
    });
  });
});