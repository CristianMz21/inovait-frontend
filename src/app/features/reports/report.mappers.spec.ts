import { describe, expect, it } from 'vitest';
import {
  ageDistributionFixture,
  emptyAgeDistributionFixture,
} from '../../../testing/fixtures';
import type { AgeDistributionResponseDto } from '../../core/api/dtos/age-distribution.dto';
import {
  ageDistributionFiltersAreValid,
  ageDistributionFiltersToParams,
  ageDistributionResponseToVm,
} from './report.mappers';
import type { AgeDistributionFiltersVm } from './report.vm';

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
});